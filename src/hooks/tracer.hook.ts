import type { Tracer } from '@aws-lambda-powertools/tracer';
import type { FastifyPluginAsync } from 'fastify';
import { tracerService } from '../services';
import type { FastifyAwsPowertoolsTracerOptions } from '../types';

export const tracerHook: FastifyPluginAsync<
  FastifyAwsPowertoolsTracerOptions & { tracer: Tracer }
> = async (fastify, opts) => {
  const { tracer, tracerOptions: options } = opts;

  const { onRequest, onResponse, onSend, onError } = tracerService(
    tracer,
    options,
  );

  fastify
    .addHook('onRequest', async (request) => {
      if (!request.tracer) {
        request.tracer = tracer;
      }
    })
    .addHook('onRequest', onRequest)
    .addHook('onSend', onSend)
    .addHook('onResponse', onResponse)
    .addHook('onError', onError);
};
