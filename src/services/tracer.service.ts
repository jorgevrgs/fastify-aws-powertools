import type { Tracer } from '@aws-lambda-powertools/tracer';
import type { Segment, Subsegment } from 'aws-xray-sdk-core';
import type {
  onErrorAsyncHookHandler,
  onRequestAsyncHookHandler,
  onResponseAsyncHookHandler,
} from 'fastify';
import type { TracerServiceOptions } from '../types';

export function tracerService(
  target: Tracer,
  options: TracerServiceOptions = {},
) {
  const { captureResponse = true } = options;

  let lambdaSegment: Segment;
  let handlerSegment: Subsegment;

  const open = (): void => {
    const segment = target.getSegment();

    if (segment === undefined) {
      return;
    }

    // If segment is defined, then it is a Segment as this middleware is only used for Lambda Handlers
    lambdaSegment = segment as Segment;
    handlerSegment = lambdaSegment.addNewSubsegment(
      `## ${process.env._HANDLER}`,
    );

    target.setSegment(handlerSegment as never);
  };

  const close = (): void => {
    if (handlerSegment === undefined || lambdaSegment === null) {
      return;
    }

    try {
      handlerSegment.close();
    } catch (error) {
      console.warn(
        `Failed to close or serialize segment, ${handlerSegment.name}. We are catching the error but data might be lost.`,
        error,
      );
    }
    target.setSegment(lambdaSegment as never);
  };

  const onRequestHook: onRequestAsyncHookHandler = async (_request, _reply) => {
    if (target.isTracingEnabled()) {
      open();
      target.annotateColdStart();
      target.addServiceNameAnnotation();
    }
  };

  const onResponseHook: onResponseAsyncHookHandler = async (
    _request,
    reply,
  ) => {
    if (target.isTracingEnabled()) {
      if (captureResponse) {
        target.addResponseAsMetadata(reply.raw, process.env._HANDLER);
      }

      close();
    }
  };

  const onErrorHook: onErrorAsyncHookHandler = async (
    _request,
    _reply,
    error,
  ) => {
    if (target.isTracingEnabled()) {
      if (error) {
        target.addErrorAsMetadata(error as Error);
      }

      close();
    }
  };

  return {
    onRequest: onRequestHook,
    onResponse: onResponseHook,
    onError: onErrorHook,
  };
}
