import type { Tracer } from '@aws-lambda-powertools/tracer';
import type { CaptureLambdaHandlerOptions } from '@aws-lambda-powertools/tracer/lib/cjs/types/Tracer';
import type { Segment, Subsegment } from 'aws-xray-sdk-core';
import type {
  FastifyRequest,
  onErrorAsyncHookHandler,
  onRequestAsyncHookHandler,
  onResponseAsyncHookHandler,
  onSendAsyncHookHandler,
} from 'fastify';
import { POWERTOOLS_REQUEST_KEY, TRACER_KEY } from '../../commons/symbols';

export function tracerService(
  target: Tracer,
  options: CaptureLambdaHandlerOptions = {},
) {
  const { captureResponse = true } = options;

  let lambdaSegment: Segment;
  let handlerSegment: Subsegment;

  const setCleanupFunction = (request: FastifyRequest) => {
    request[POWERTOOLS_REQUEST_KEY] = {
      ...request[POWERTOOLS_REQUEST_KEY],
      [TRACER_KEY]: close,
    };
  };

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

    target.setSegment(handlerSegment);
  };

  const close = (): void => {
    if (handlerSegment === undefined || lambdaSegment === null) {
      return;
    }

    try {
      handlerSegment.close();
    } catch (error) {
      console.warn(
        'Failed to close or serialize segment %s. We are catching the error but data might be lost.',
        handlerSegment.name,
        error,
      );
    }

    target.setSegment(lambdaSegment);
  };

  const onRequestHook: onRequestAsyncHookHandler = async (request, _reply) => {
    if (!target.isTracingEnabled()) {
      return;
    }

    open();

    setCleanupFunction(request);
    target.annotateColdStart();
    target.addServiceNameAnnotation();
  };

  const onResponseHook: onResponseAsyncHookHandler = async () => {
    if (!target.isTracingEnabled()) {
      return;
    }

    close();
  };

  const onSendHook: onSendAsyncHookHandler<unknown> = async (
    _request,
    _reply,
    payload,
  ) => {
    if (!target.isTracingEnabled()) {
      return payload;
    }

    if (captureResponse && typeof payload === 'string') {
      let data = '';

      try {
        data = JSON.parse(payload);
      } catch (_error) {
        data = payload;
      }

      target.addResponseAsMetadata(data, process.env._HANDLER);
    }

    return payload;
  };

  const onErrorHook: onErrorAsyncHookHandler = async (
    _request,
    _reply,
    error,
  ) => {
    if (!target.isTracingEnabled()) {
      return;
    }

    target.addErrorAsMetadata(error as Error);
  };

  return {
    onRequest: onRequestHook,
    onSend: onSendHook,
    onError: onErrorHook,
    onResponse: onResponseHook,
  };
}
