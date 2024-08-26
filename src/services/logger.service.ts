import { Logger } from '@aws-lambda-powertools/logger';
import type {
  onErrorAsyncHookHandler,
  onRequestAsyncHookHandler,
  onResponseAsyncHookHandler,
} from 'fastify';
import { isAwsLambdaRequest } from '../helpers';
import type { LoggerServiceOptions } from '../types';

export function loggerService(
  target: Logger | Logger[],
  options: LoggerServiceOptions = {},
) {
  const { resetKeys, clearState } = options;

  const isResetStateEnabled = clearState || resetKeys;

  const loggers = Array.isArray(target) ? target : [target];

  const onRequestHook: onRequestAsyncHookHandler = async (request, _reply) => {
    if (!isAwsLambdaRequest(request)) {
      request.log.warn('Request does not contain AWS Lambda object');
      return;
    }

    for (const logger of loggers) {
      Logger.injectLambdaContextBefore(
        logger,
        request.awsLambda.event,
        request.awsLambda.context,
        options,
      );
    }
  };

  const onResponseOrErrorHandler = () => {
    if (isResetStateEnabled) {
      for (const logger of loggers) {
        logger.resetKeys();
      }
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
