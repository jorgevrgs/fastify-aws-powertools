import type { FastifyPluginAsync } from 'fastify';
import { loggerHook, metricsHook, tracerHook } from './hooks';
import { FastifyAwsPowertoolsOptions } from './types';

const fastifyAwsPowertools: FastifyPluginAsync<
  FastifyAwsPowertoolsOptions
> = async (fastify, opts) => {
  fastify
    .decorateRequest('logger', null)
    .decorateRequest('metrics', null)
    .decorateRequest('tracer', null)
    .decorate('logger', opts.logger)
    .decorate('metrics', opts.metrics)
    .decorate('tracer', opts.tracer)
    .register(loggerHook, opts)
    .register(metricsHook, opts)
    .register(tracerHook, opts);
};

export default fastifyAwsPowertools;
