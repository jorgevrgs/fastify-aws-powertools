import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { loggerHook, metricsHook, tracerHook } from './hooks';
import type { FastifyAwsPowertoolsOptions } from './types';

const fastifyAwsPowertoolsLogger: FastifyPluginAsync<
  FastifyAwsPowertoolsOptions
> = async (fastify, opts) => {
  const {
    logger = new Logger(opts.loggerInstanceOptions),
    loggerOptions = {},
  } = opts;

  fastify
    .decorateRequest('logger', null)
    .decorate('logger', logger)
    .register(fp(loggerHook), { logger, loggerOptions });
};

const fastifyAwsPowertoolsMetrics: FastifyPluginAsync<
  FastifyAwsPowertoolsOptions
> = async (fastify, opts) => {
  const {
    metrics = new Metrics(opts.metricsInstanceOptions),
    metricsOptions = {},
  } = opts;

  fastify
    .decorateRequest('metrics', null)
    .decorate('metrics', metrics)
    .register(fp(metricsHook), {
      metrics,
      metricsOptions,
    });
};

const fastifyAwsPowertoolsTracer: FastifyPluginAsync<
  FastifyAwsPowertoolsOptions
> = async (fastify, opts) => {
  const {
    tracer = new Tracer(opts.tracerInstanceOptions),
    tracerOptions = {},
  } = opts;

  fastify
    .decorateRequest('tracer', null)
    .decorate('tracer', tracer)
    .register(fp(tracerHook), { tracer, tracerOptions });
};

export const fastifyAwsPowertools: FastifyPluginAsync<
  FastifyAwsPowertoolsOptions
> = async (fastify, opts) => {
  fastify
    .register(fastifyAwsPowertoolsLogger, opts)
    .register(fastifyAwsPowertoolsMetrics, opts)
    .register(fastifyAwsPowertoolsTracer, opts);
};

export const fastifyAwsPowertoolsPlugin = fp(fastifyAwsPowertools, {
  name: 'fastify-aws-powertools',
  fastify: '4.x',
});

export const fastifyAwsPowertoolsLoggerPlugin = fp(fastifyAwsPowertoolsLogger, {
  name: 'fastify-aws-powertools-logger',
  fastify: '4.x',
});

export const fastifyAwsPowertoolsMetricsPlugin = fp(
  fastifyAwsPowertoolsMetrics,
  {
    name: 'fastify-aws-powertools-metrics',
    fastify: '4.x',
  },
);

export const fastifyAwsPowertoolsTracerPlugin = fp(fastifyAwsPowertoolsTracer, {
  name: 'fastify-aws-powertools-tracer',
  fastify: '4.x',
});
