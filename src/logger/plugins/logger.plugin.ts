import { Logger } from '@aws-lambda-powertools/logger';
import type {
  FastifyPluginAsync,
  FastifyRequest,
  onErrorAsyncHookHandler,
  onRequestAsyncHookHandler,
  onResponseAsyncHookHandler,
} from 'fastify';
import fp from 'fastify-plugin';
import {
  LOGGER_KEY,
  POWERTOOLS_REQUEST_KEY,
  isAwsLambdaRequest,
} from '../../commons';
import type { FastifyAwsPowertoolsLoggerOptions } from '../types';

const fastifyAwsPowertoolsLogger: FastifyPluginAsync<
  FastifyAwsPowertoolsLoggerOptions
> = async (fastify, opts) => {
  const { loggerOptions: options = {} } = opts;

  let logger: Logger;

  if ('logger' in opts) {
    logger = opts.logger;
  } else {
    logger = new Logger(opts.loggerInstanceOptions);
  }

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
    .decorateRequest('logger', null)
    .decorate('logger', logger)
    .addHook('onRequest', async (request) => {
      if (!request.logger) {
        request.logger = logger;
      }
    })
    .addHook('onRequest', onRequestHook)
    .addHook('onResponse', onResponseHook)
    .addHook('onError', onErrorHook);
};

export const fastifyAwsPowertoolsLoggerPlugin = fp(fastifyAwsPowertoolsLogger, {
  name: 'fastify-aws-powertools-logger',
  fastify: '4.x',
});
