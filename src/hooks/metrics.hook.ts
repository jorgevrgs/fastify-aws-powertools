import { Metrics } from '@aws-lambda-powertools/metrics';
import type { FastifyPluginAsync } from 'fastify';
import { metricsService } from '../services';
import type { fastifyAwsPowertoolsOptions } from '../types';

export const metricsHook: FastifyPluginAsync<
  fastifyAwsPowertoolsOptions
> = async (fastify, opts) => {
  let metrics = opts.metrics as Metrics;

  if (typeof metrics === 'undefined') {
    metrics = new Metrics();
  }

  const metricsHooks = metricsService(metrics, opts.metricsOptions);

  fastify
    .addHook('onRequest', metricsHooks.onRequest)
    .addHook('onResponse', metricsHooks.onResponse)
    .addHook('onError', metricsHooks.onError);
};
