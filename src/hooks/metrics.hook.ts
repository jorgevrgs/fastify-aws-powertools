import { Metrics } from '@aws-lambda-powertools/metrics';
import type { FastifyPluginAsync } from 'fastify';
import { metricsService } from '../services';
import type { MetricsServiceOptions } from '../types';

export const metricsHook: FastifyPluginAsync<{
  metrics: Metrics | Metrics[];
  handlerOptions: MetricsServiceOptions;
}> = async (fastify, opts) => {
  const { metrics, handlerOptions } = opts;

  const metricsHooks = metricsService(metrics, handlerOptions);

  fastify
    .addHook('onRequest', async (request) => {
      if (!request.metrics) {
        request.metrics = Array.isArray(metrics) ? metrics[0] : metrics;
      }
    })
    .addHook('onRequest', metricsHooks.onRequest)
    .addHook('onResponse', metricsHooks.onResponse)
    .addHook('onError', metricsHooks.onError);
};
