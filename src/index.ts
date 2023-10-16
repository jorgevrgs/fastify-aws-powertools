import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { loggerHook, metricsHook, tracerHook } from './hooks';
import type { FastifyAwsPowertoolsOptions } from './types';

export const fastifyAwsPowertools: FastifyPluginAsync<
  FastifyAwsPowertoolsOptions
> = async (fastify, options) => {
  const {
    logger,
    metrics,
    tracer,
    loggerOptions = {},
    metricsOptions = {},
    tracerOptions = {},
  } = options;

  const defaultLogger = logger ?? new Logger();
  const defaultMetrics = metrics ?? new Metrics();
  const defaultTracer = tracer ?? new Tracer();

  fastify
    .decorateRequest('logger', null)
    .decorateRequest('metrics', null)
    .decorateRequest('tracer', null)
    .decorate('logger', logger)
    .decorate('metrics', metrics)
    .decorate('tracer', tracer)
    .register(fp(loggerHook), {
      logger: defaultLogger,
      handlerOptions: loggerOptions,
    })
    .register(fp(metricsHook), {
      metrics: defaultMetrics,
      handlerOptions: metricsOptions,
    })
    .register(fp(tracerHook), {
      tracer: defaultTracer,
      handlerOptions: tracerOptions,
    });
};

export default fastifyAwsPowertools;
