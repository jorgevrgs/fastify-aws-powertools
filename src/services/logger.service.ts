import { Logger } from '@aws-lambda-powertools/logger';
import type {
  onErrorAsyncHookHandler,
  onRequestAsyncHookHandler,
  onResponseAsyncHookHandler,
} from 'fastify';
import type { LogAttributes, LoggerServiceOptions } from '../types';

export function loggerService(
  target: Logger | Logger[],
  options: LoggerServiceOptions,
) {
  const { clearState, logEvent } = options;

  const loggers = Array.isArray(target) ? target : [target];
  const persistentAttributes: LogAttributes[] = [];

  const onRequestHook: onRequestAsyncHookHandler = async (request, reply) => {
    loggers.forEach((logger, index) => {
      if (clearState === true) {
        persistentAttributes[index] = {
          ...logger.getPersistentLogAttributes(),
        };
      }

      Logger.injectLambdaContextBefore(
        logger,
        request.awsLambda.event,
        request.awsLambda.context,
        { clearState, logEvent },
      );
    });
  };

  const onResponseOrErrorHandler = () => {
    if (clearState === true) {
      loggers.forEach((logger, index) => {
        Logger.injectLambdaContextAfterOrOnError(
          logger,
          persistentAttributes[index],
          { clearState, logEvent },
        );
      });
    }
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
