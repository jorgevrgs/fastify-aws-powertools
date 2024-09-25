import { Metrics } from '@aws-lambda-powertools/metrics';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { metricsHook } from '../hooks';
import type { FastifyAwsPowertoolsMetricsOptions } from '../types';

const fastifyAwsPowertoolsMetrics: FastifyPluginAsync<
  FastifyAwsPowertoolsMetricsOptions
> = async (fastify, opts) => {
  const { metricsOptions = {} } = opts;

  let metrics: Metrics;

  if ('metrics' in opts) {
    metrics = opts.metrics;
  } else {
    metrics = new Metrics(opts.metricsInstanceOptions);
  }

  fastify
    .decorateRequest('metrics', null)
    .decorate('metrics', metrics)
    .register(fp(metricsHook), {
      metrics,
      metricsOptions,
    });
};

export const fastifyAwsPowertoolsMetricsPlugin = fp(
  fastifyAwsPowertoolsMetrics,
  {
    name: 'fastify-aws-powertools-metrics',
    fastify: '4.x',
  },
);
