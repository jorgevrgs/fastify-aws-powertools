import { Logger } from '@aws-lambda-powertools/logger';
import type {
  FastifyPluginAsync,
  FastifyRequest,
  onRequestAsyncHookHandler,
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

  let loggers: Logger[];

  if ('logger' in opts) {
    loggers = Array.isArray(opts.logger) ? opts.logger : [opts.logger];
  } else {
    loggers = [new Logger(opts.loggerInstanceOptions)];
  }

  const { resetKeys, clearState, logEvent } = options;

  const isResetStateEnabled = clearState || resetKeys;

  const setCleanupFunction = (request: FastifyRequest) => {
    request[POWERTOOLS_REQUEST_KEY] = {
      ...request[POWERTOOLS_REQUEST_KEY],
      [LOGGER_KEY]: onResponseHandler,
    };
  };

  const onRequestHook: onRequestAsyncHookHandler = async (request, _reply) => {
    if (!isAwsLambdaRequest(request)) {
      request.log.warn('Request does not contain AWS Lambda object');
      return;
    }

    if (isResetStateEnabled) {
      setCleanupFunction(request);
    }

    for (const logger of loggers) {
      logger.refreshSampleRateCalculation();

      logger.addContext(request.awsLambda.context);
      logger.logEventIfEnabled(request.awsLambda.event, logEvent);

      if (options.correlationIdPath) {
        logger.setCorrelationId(
          request.awsLambda.event,
          options.correlationIdPath,
        );
      }
    }
  };

  const onResponseHandler = async () => {
    for (const logger of loggers) {
      logger.clearBuffer();

      if (isResetStateEnabled) {
        logger.resetKeys();
      }
    }
  };

  const onErrorHandler = async (error: unknown) => {
    for (const logger of loggers) {
      if (options.flushBufferOnUncaughtError) {
        logger.flushBuffer();
        logger.error({
          message: 'Uncaught error detected, flushing log buffer before exit',
          error,
        });
      } else {
        logger.clearBuffer();
      }

      if (isResetStateEnabled) {
        logger.resetKeys();
      }
    }
  };

  fastify
    .decorateRequest('logger', {
      getter() {
        return loggers[0];
      },
    })
    .decorate('logger', loggers[0])
    .addHook('onRequest', onRequestHook)
    .addHook('onResponse', onResponseHandler)
    .addHook('onError', onErrorHandler);
};

export const fastifyAwsPowertoolsLoggerPlugin = fp(fastifyAwsPowertoolsLogger, {
  name: 'fastify-aws-powertools-logger',
  fastify: '5.x',
});
