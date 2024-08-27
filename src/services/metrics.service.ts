import type { Metrics } from '@aws-lambda-powertools/metrics';
import type { ExtraOptions } from '@aws-lambda-powertools/metrics/types';
import type {
  onErrorAsyncHookHandler,
  onRequestAsyncHookHandler,
  onResponseAsyncHookHandler,
} from 'fastify';
import { isAwsLambdaRequest } from '../helpers';

export function metricsService(
  target: Metrics | Metrics[],
  options: ExtraOptions = {},
) {
  const metricsInstances = Array.isArray(target) ? target : [target];

  const { throwOnEmptyMetrics, defaultDimensions, captureColdStartMetric } =
    options;

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

  return {
    onRequest: onRequestHook,
    onResponse: onResponseHook,
    onError: onErrorHook,
  };
}
