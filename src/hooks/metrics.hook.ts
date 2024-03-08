import type { Metrics } from '@aws-lambda-powertools/metrics';
import type { FastifyPluginAsync } from 'fastify';
import { metricsService } from '../services';
import type { FastifyAwsPowertoolsMetricsOptions } from '../types';

export const metricsHook: FastifyPluginAsync<
  FastifyAwsPowertoolsMetricsOptions
> = async (fastify, opts) => {
  const { metrics: baseMetrics, metricsOptions: options } = opts;

  let metrics = baseMetrics as Metrics;

  if (typeof metrics === 'undefined') {
    metrics = new Metrics();
  }

  const { onRequest, onResponse, onError } = metricsService(metrics, options);

  fastify
    .addHook('onRequest', async (request) => {
      if (!request.metrics) {
        request.metrics = Array.isArray(metrics) ? metrics[0] : metrics;
      }
    })
    .addHook('onRequest', onRequest)
    .addHook('onResponse', onResponse)
    .addHook('onError', onError);
};
