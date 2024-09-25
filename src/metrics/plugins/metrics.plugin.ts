import { Metrics } from '@aws-lambda-powertools/metrics';
import type {
  FastifyPluginAsync,
  FastifyRequest,
  onErrorAsyncHookHandler,
  onRequestAsyncHookHandler,
  onResponseAsyncHookHandler,
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

  let metrics: Metrics;

  if ('metrics' in opts) {
    metrics = opts.metrics;
  } else {
    metrics = new Metrics(opts.metricsInstanceOptions);
  }

  const metricsInstances = Array.isArray(metrics) ? metrics : [metrics];

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

    for (const metrics of metricsInstances) {
      metrics.setFunctionName(request.awsLambda.context.functionName);

      if (throwOnEmptyMetrics) {
        metrics.throwOnEmptyMetrics();
      }

      if (typeof defaultDimensions !== 'undefined') {
        metrics.setDefaultDimensions(defaultDimensions);
      }

      if (captureColdStartMetric) {
        metrics.captureColdStartMetric();
      }
    }

    setCleanupFunction(request);
  };

  const onResponseOrErrorHandler = () => {
    for (const metrics of metricsInstances) {
      metrics.publishStoredMetrics();
    }
  };

  const onResponseHook: onResponseAsyncHookHandler = async (
    _request,
    _reply,
  ) => {
    onResponseOrErrorHandler();
  };

  const onErrorHook: onErrorAsyncHookHandler = async (
    _request,
    _reply,
    _error,
  ) => {
    onResponseOrErrorHandler();
  };

  fastify
    .decorateRequest('metrics', null)
    .decorate('metrics', metrics)
    .addHook('onRequest', async (request) => {
      if (!request.metrics) {
        request.metrics = metrics;
      }
    })
    .addHook('onRequest', onRequestHook)
    .addHook('onResponse', onResponseHook)
    .addHook('onError', onErrorHook);
};

export const fastifyAwsPowertoolsMetricsPlugin = fp(
  fastifyAwsPowertoolsMetrics,
  {
    name: 'fastify-aws-powertools-metrics',
    fastify: '4.x',
  },
);
