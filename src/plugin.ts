import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { loggerHook, metricsHook, tracerHook } from './hooks';
import type { FastifyAwsPowertoolsOptions } from './types';

const plugin: FastifyPluginAsync<FastifyAwsPowertoolsOptions> = async (
  fastify,
  opts,
) => {
  const {
    logger,
    metrics,
    tracer,
    loggerOptions,
    metricsOptions,
    tracerOptions,
  } = opts;

  fastify
    .decorateRequest('logger', null)
    .decorateRequest('metrics', null)
    .decorateRequest('tracer', null)
    .decorate('logger', logger)
    .decorate('metrics', metrics)
    .decorate('tracer', tracer)
    .register(fp(loggerHook), { logger, loggerOptions })
    .register(fp(metricsHook), { metrics, metricsOptions })
    .register(fp(tracerHook), { tracer, tracerOptions });
};

export const fastifyAwsPowertools = plugin;

export const fastifyAwsPowertoolsPlugin = fp(plugin, {
  name: 'fastify-aws-powertools',
  fastify: '4.x',
});
