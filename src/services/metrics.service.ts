import type { Metrics } from '@aws-lambda-powertools/metrics';
import type {
  onErrorAsyncHookHandler,
  onRequestAsyncHookHandler,
  onResponseAsyncHookHandler,
} from 'fastify';
import type { MetricsServiceOptions } from '../types';

export function metricsService(
  target: Metrics | Metrics[],
  options: MetricsServiceOptions = {},
) {
  const metricsInstances = Array.isArray(target) ? target : [target];

  const onRequestHook: onRequestAsyncHookHandler = async (request, reply) => {
    metricsInstances.forEach((metrics: Metrics) => {
      metrics.setFunctionName(request.awsLambda.context.functionName);
      const {
        throwOnEmptyMetrics,
        defaultDimensions = { framework: 'fastify' },
        captureColdStartMetric,
      } = options;

      if (throwOnEmptyMetrics) {
        metrics.throwOnEmptyMetrics();
      }

      if (defaultDimensions) {
        metrics.setDefaultDimensions(defaultDimensions);
      }

      if (captureColdStartMetric) {
        metrics.captureColdStartMetric();
      }
    });
  };

  const onResponseOrErrorHandler = () => {
    metricsInstances.forEach((metrics) => {
      metrics.publishStoredMetrics();
    });
  };

  const onResponseHook: onResponseAsyncHookHandler = async (request, reply) => {
    onResponseOrErrorHandler();
  };

  const onErrorHook: onErrorAsyncHookHandler = async (
    request,
    reply,
    error,
  ) => {
    onResponseOrErrorHandler();
  };

  return {
    onRequest: onRequestHook,
    onResponse: onResponseHook,
    onError: onErrorHook,
  };
}
