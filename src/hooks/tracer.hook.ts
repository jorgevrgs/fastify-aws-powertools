import type { FastifyPluginAsync } from 'fastify';
import { tracerService } from '../services';
import type { FastifyAwsPowertoolsTracerOptions } from '../types';

export const tracerHook: FastifyPluginAsync<
  Required<
    Pick<FastifyAwsPowertoolsTracerOptions, 'tracer' | 'tracerServiceOptions'>
  >
> = async (fastify, opts) => {
  const { tracer, tracerServiceOptions: options } = opts;

  const { onRequest, onResponse, onError } = tracerService(tracer, options);

  fastify
    .addHook('onRequest', async (request) => {
      if (!request.tracer) {
        request.tracer = tracer;
      }
    })
    .addHook('onRequest', onRequest)
    .addHook('onResponse', onResponse)
    .addHook('onError', onError);
};
