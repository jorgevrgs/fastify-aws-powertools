import type { Tracer } from '@aws-lambda-powertools/tracer';
import type { Segment, Subsegment } from 'aws-xray-sdk-core';
import type {
  FastifyPluginAsync,
  FastifyRequest,
  onErrorAsyncHookHandler,
  onRequestAsyncHookHandler,
  onResponseAsyncHookHandler,
  onSendAsyncHookHandler,
} from 'fastify';
import { POWERTOOLS_REQUEST_KEY, TRACER_KEY } from '../../commons';
import type { FastifyAwsPowertoolsTracerOptions } from '../types';

export const tracerHook: FastifyPluginAsync<
  FastifyAwsPowertoolsTracerOptions & { tracer: Tracer }
> = async (fastify, opts) => {
  const { tracer, tracerOptions: options = {} } = opts;

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
    const segment = tracer.getSegment();

    if (segment === undefined) {
      return;
    }

    // If segment is defined, then it is a Segment as this middleware is only used for Lambda Handlers
    lambdaSegment = segment as Segment;
    handlerSegment = lambdaSegment.addNewSubsegment(
      `## ${process.env._HANDLER}`,
    );

    tracer.setSegment(handlerSegment);
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

    tracer.setSegment(lambdaSegment);
  };

  const onRequestHook: onRequestAsyncHookHandler = async (request, _reply) => {
    if (!tracer.isTracingEnabled()) {
      return;
    }

    open();

    setCleanupFunction(request);
    tracer.annotateColdStart();
    tracer.addServiceNameAnnotation();
  };

  const onResponseHook: onResponseAsyncHookHandler = async () => {
    if (!tracer.isTracingEnabled()) {
      return;
    }

    close();
  };

  const onSendHook: onSendAsyncHookHandler<unknown> = async (
    _request,
    _reply,
    payload,
  ) => {
    if (!tracer.isTracingEnabled()) {
      return payload;
    }

    if (captureResponse && typeof payload === 'string') {
      let data = '';

      try {
        data = JSON.parse(payload);
      } catch (_error) {
        data = payload;
      }

      tracer.addResponseAsMetadata(data, process.env._HANDLER);
    }

    return payload;
  };

  const onErrorHook: onErrorAsyncHookHandler = async (
    _request,
    _reply,
    error,
  ) => {
    if (!tracer.isTracingEnabled()) {
      return;
    }

    tracer.addErrorAsMetadata(error as Error);
  };

  fastify
    .addHook('onRequest', async (request) => {
      if (!request.tracer) {
        request.tracer = tracer;
      }
    })
    .addHook('onRequest', onRequestHook)
    .addHook('onSend', onSendHook)
    .addHook('onResponse', onResponseHook)
    .addHook('onError', onErrorHook);
};
