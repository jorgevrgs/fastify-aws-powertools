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

  // logger
  const defaultLogger = logger ?? new Logger();
  fastify
    .decorateRequest('logger', null)
    .decorate('logger', logger)
    .register(fp(loggerHook), {
      logger: defaultLogger,
      handlerOptions: loggerOptions,
    });

  // metrics
  const defaultMetrics = metrics ?? new Metrics();
  fastify
    .decorateRequest('metrics', null)
    .decorate('metrics', metrics)
    .register(fp(metricsHook), {
      metrics: defaultMetrics,
      handlerOptions: metricsOptions,
    });

  // tracer
  const defaultTracer = tracer ?? new Tracer();
  fastify
    .decorateRequest('tracer', null)
    .decorate('tracer', tracer)
    .register(fp(tracerHook), {
      tracer: defaultTracer,
      handlerOptions: tracerOptions,
    });
};
