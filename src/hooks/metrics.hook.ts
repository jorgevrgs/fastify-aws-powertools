import type { FastifyPluginAsync } from 'fastify';
import { metricsService } from '../services';
import type { FastifyAwsPowertoolsMetricsOptions } from '../types';

export const metricsHook: FastifyPluginAsync<
  Required<
    Pick<
      FastifyAwsPowertoolsMetricsOptions,
      'metrics' | 'metricsServiceOptions'
    >
  >
> = async (fastify, opts) => {
  const { metrics, metricsServiceOptions: options } = opts;

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
