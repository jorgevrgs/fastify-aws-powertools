import type { Metrics } from '@aws-lambda-powertools/metrics';
import type {
  onErrorAsyncHookHandler,
  onRequestAsyncHookHandler,
  onResponseAsyncHookHandler,
} from 'fastify';
import { MetricsServiceOptions } from '../types';

export function metricsService(
  target: Metrics | Metrics[],
  options: MetricsServiceOptions = {},
) {
  const metricsInstances = target instanceof Array ? target : [target];

  const onRequestHook: onRequestAsyncHookHandler = async (request) => {
    metricsInstances.forEach((metrics: Metrics) => {
      metrics.setFunctionName(request.awsLambda.context.functionName);
      const { throwOnEmptyMetrics, defaultDimensions, captureColdStartMetric } =
        options;

      if (throwOnEmptyMetrics !== undefined) {
        metrics.throwOnEmptyMetrics();
      }

      if (defaultDimensions !== undefined) {
        metrics.setDefaultDimensions(defaultDimensions);
      }

      if (captureColdStartMetric !== undefined) {
        metrics.captureColdStartMetric();
      }
    });
  };

  const onResponseHook: onResponseAsyncHookHandler = async () => {
    metricsInstances.forEach((metrics: Metrics) => {
      metrics.publishStoredMetrics();
    });
  };

  const onErrorHook: onErrorAsyncHookHandler = async () => {
    metricsInstances.forEach((metrics: Metrics) => {
      metrics.publishStoredMetrics();
    });
  };

  return {
    onRequest: onRequestHook,
    onResponse: onResponseHook,
    onError: onErrorHook,
  };
}
