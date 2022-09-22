import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
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
    .register(fp(loggerHook), opts)
    .register(fp(metricsHook), opts)
    .register(fp(tracerHook), opts);
};

export default fastifyAwsPowertools;
