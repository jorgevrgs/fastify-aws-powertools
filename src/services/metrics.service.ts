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

  const { throwOnEmptyMetrics, defaultDimensions, captureColdStartMetric } =
    options;

  const onRequestHook: onRequestAsyncHookHandler = async (request, _reply) => {
    metricsInstances.forEach((metrics: Metrics) => {
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
    });
  };

  const onResponseOrErrorHandler = () => {
    metricsInstances.forEach((metrics) => {
      metrics.publishStoredMetrics();
    });
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

  return {
    onRequest: onRequestHook,
    onResponse: onResponseHook,
    onError: onErrorHook,
  };
}
