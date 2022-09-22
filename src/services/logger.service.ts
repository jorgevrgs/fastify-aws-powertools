import { Logger } from '@aws-lambda-powertools/logger';
import { onRequestAsyncHookHandler } from 'fastify';
import type { LogAttributes, LoggerOptions } from '../types';

export function loggerService(target: Logger, options: LoggerOptions) {
  const loggers = target instanceof Array ? target : [target];
  const persistentAttributes: LogAttributes[] = [];

  const onRequestHook: onRequestAsyncHookHandler = async (request) => {
    loggers.forEach((logger: Logger) => {
      if (options && options.clearState === true) {
        persistentAttributes.push({ ...logger.getPersistentLogAttributes() });
      }
      Logger.injectLambdaContextBefore(
        logger,
        request.awsLambda.event,
        request.awsLambda.context,
        options
      );
    });
  };

  const onResponseOrError = async (): Promise<void> => {
    if (options && options.clearState === true) {
      loggers.forEach((logger: Logger, index: number) => {
        Logger.injectLambdaContextAfterOrOnError(
          logger,
          persistentAttributes[index],
          options
        );
      });
    }
  };

  return {
    onRequest: onRequestHook,
    onResponse: onResponseOrError,
    onError: onResponseOrError,
  };
}
