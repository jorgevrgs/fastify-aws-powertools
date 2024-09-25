import type { Logger } from '@aws-lambda-powertools/logger';
import type { InjectLambdaContextOptions } from '@aws-lambda-powertools/logger/lib/cjs/types/Logger';
import type {
  FastifyRequest,
  onErrorAsyncHookHandler,
  onRequestAsyncHookHandler,
  onResponseAsyncHookHandler,
} from 'fastify';
import { isAwsLambdaRequest } from '../../commons/helpers';
import { LOGGER_KEY, POWERTOOLS_REQUEST_KEY } from '../../commons/symbols';

export function loggerService(
  target: Logger | Logger[],
  options: InjectLambdaContextOptions = {},
) {
  const { resetKeys, clearState, logEvent } = options;

  const isResetStateEnabled = clearState || resetKeys;

  const loggers = Array.isArray(target) ? target : [target];

  const setCleanupFunction = (request: FastifyRequest) => {
    request[POWERTOOLS_REQUEST_KEY] = {
      ...request[POWERTOOLS_REQUEST_KEY],
      [LOGGER_KEY]: onResponseOrErrorHandler,
    };
  };

  const onRequestHook: onRequestAsyncHookHandler = async (request, _reply) => {
    if (!isAwsLambdaRequest(request)) {
      request.log.warn('Request does not contain AWS Lambda object');
      return;
    }

    for (const logger of loggers) {
      if (isResetStateEnabled) {
        setCleanupFunction(request);
      }

      logger.addContext(request.awsLambda.context);
      logger.logEventIfEnabled(request.awsLambda.event, logEvent);
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
