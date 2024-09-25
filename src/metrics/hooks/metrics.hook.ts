import type { Metrics } from '@aws-lambda-powertools/metrics';
import type { FastifyPluginAsync } from 'fastify';
import { metricsService } from '../services';
import type { FastifyAwsPowertoolsMetricsOptions } from '../types';

export const metricsHook: FastifyPluginAsync<
  Required<FastifyAwsPowertoolsMetricsOptions & { metrics: Metrics }>
> = async (fastify, opts) => {
  const { metrics, metricsOptions: options } = opts;

  const { onRequest, onResponse, onError } = metricsService(metrics, options);

  fastify
    .addHook('onRequest', async (request) => {
      if (!request.metrics) {
        request.metrics = metrics;
      }
    })
    .addHook('onRequest', onRequest)
    .addHook('onResponse', onResponse)
    .addHook('onError', onError);
};
