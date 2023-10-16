import { Tracer } from '@aws-lambda-powertools/tracer';
import type { FastifyPluginAsync } from 'fastify';
import { tracerService } from '../services';
import type { TracerServiceOptions } from '../types';

export const tracerHook: FastifyPluginAsync<{
  tracer: Tracer;
  handlerOptions: TracerServiceOptions;
}> = async (fastify, opts) => {
  const { tracer, handlerOptions } = opts;

  const tracerHooks = tracerService(tracer, handlerOptions);

  fastify
    .addHook('onRequest', async (request) => {
      if (!request.tracer) {
        request.tracer = tracer;
      }
    })
    .addHook('onRequest', tracerHooks.onRequest)
    .addHook('onResponse', tracerHooks.onResponse)
    .addHook('onError', tracerHooks.onError);
};
