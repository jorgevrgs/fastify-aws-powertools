import { Tracer } from '@aws-lambda-powertools/tracer';
import type { FastifyPluginAsync } from 'fastify';
import { tracerService } from '../services';
import type { fastifyAwsPowertoolsOptions } from '../types';

export const tracerHook: FastifyPluginAsync<
  fastifyAwsPowertoolsOptions
> = async (fastify, opts) => {
  let tracer = opts.tracer as Tracer;

  if (typeof tracer === 'undefined') {
    tracer = new Tracer();
  }

  const tracerHooks = tracerService(tracer, opts.tracerOptions);

  fastify
    .addHook('onRequest', tracerHooks.onRequest)
    .addHook('onResponse', tracerHooks.onResponse)
    .addHook('onError', tracerHooks.onError);
};
