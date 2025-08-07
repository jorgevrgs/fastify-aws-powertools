import { Metrics } from '@aws-lambda-powertools/metrics';
import type {
  FastifyPluginAsync,
  FastifyRequest,
  onRequestAsyncHookHandler,
} from 'fastify';
import fp from 'fastify-plugin';
import {
  METRICS_KEY,
  POWERTOOLS_REQUEST_KEY,
  isAwsLambdaRequest,
} from '../../commons';
import type { FastifyAwsPowertoolsMetricsOptions } from '../types';

const fastifyAwsPowertoolsMetrics: FastifyPluginAsync<
  FastifyAwsPowertoolsMetricsOptions
> = async (fastify, opts) => {
  const { metricsOptions: options = {} } = opts;

  let metrics: Metrics[];

  if ('metrics' in opts) {
    metrics = Array.isArray(opts.metrics) ? opts.metrics : [opts.metrics];
  } else {
    metrics = [new Metrics(opts.metricsInstanceOptions)];
  }

  const { throwOnEmptyMetrics, defaultDimensions, captureColdStartMetric } =
    options;

  const setCleanupFunction = (request: FastifyRequest) => {
    request[POWERTOOLS_REQUEST_KEY] = {
      ...request[POWERTOOLS_REQUEST_KEY],
      [METRICS_KEY]: onResponseOrErrorHandler,
    };
  };

  const onRequestHook: onRequestAsyncHookHandler = async (request, _reply) => {
    if (!isAwsLambdaRequest(request)) {
      request.log.warn('Request does not contain AWS Lambda object');
      return;
    }

    for (const metric of metrics) {
      metric.setFunctionName(request.awsLambda.context.functionName);

      if (throwOnEmptyMetrics) {
        metric.throwOnEmptyMetrics();
      }

      if (typeof defaultDimensions !== 'undefined') {
        metric.setDefaultDimensions(defaultDimensions);
      }

      if (captureColdStartMetric) {
        metric.captureColdStartMetric();
      }
    }

    setCleanupFunction(request);
  };

  const onResponseOrErrorHandler = () => {
    for (const metric of metrics) {
      metric.publishStoredMetrics();
    }
  };

  fastify
    .decorateRequest('metrics', null)
    .decorate('metrics', metrics[0])
    .addHook('onRequest', async (request) => {
      if (!request.metrics) {
        request.metrics = metrics[0];
      }
    })
    .addHook('onRequest', onRequestHook)
    .addHook('onResponse', onResponseOrErrorHandler)
    .addHook('onError', onResponseOrErrorHandler);
};

export const fastifyAwsPowertoolsMetricsPlugin = fp(
  fastifyAwsPowertoolsMetrics,
  {
    name: 'fastify-aws-powertools-metrics',
    fastify: '5.x',
  },
);
