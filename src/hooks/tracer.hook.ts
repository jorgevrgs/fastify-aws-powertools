import { Tracer } from '@aws-lambda-powertools/tracer';
import type { FastifyPluginAsync } from 'fastify';
import { tracerService } from '../services';
import type { FastifyAwsPowertoolsTracerOptions } from '../types';

export const tracerHook: FastifyPluginAsync<
  FastifyAwsPowertoolsTracerOptions
> = async (fastify, opts) => {
  const { tracer: baseTracer, tracerOptions: options } = opts;

  let tracer = baseTracer as Tracer;

  if (typeof tracer === 'undefined') {
    tracer = new Tracer();
  }

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
