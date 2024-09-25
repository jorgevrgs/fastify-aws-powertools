import type { Logger } from '@aws-lambda-powertools/logger';
import type {
  FastifyPluginAsync,
  FastifyRequest,
  onErrorAsyncHookHandler,
  onRequestAsyncHookHandler,
  onResponseAsyncHookHandler,
} from 'fastify';
import {
  LOGGER_KEY,
  POWERTOOLS_REQUEST_KEY,
  isAwsLambdaRequest,
} from '../../commons';
import type { FastifyAwsPowertoolsLoggerOptions } from '../types';

export const loggerHook: FastifyPluginAsync<
  FastifyAwsPowertoolsLoggerOptions & { logger: Logger }
> = async (fastify, opts) => {
  const { logger, loggerOptions: options = {} } = opts;

  const { resetKeys, clearState, logEvent } = options;

  const isResetStateEnabled = clearState || resetKeys;

  const loggers = Array.isArray(logger) ? logger : [logger];

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

  fastify
    .addHook('onRequest', async (request) => {
      if (!request.logger) {
        request.logger = logger;
      }
    })
    .addHook('onRequest', onRequestHook)
    .addHook('onResponse', onResponseHook)
    .addHook('onError', onErrorHook);
};
