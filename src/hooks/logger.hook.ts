import type { Logger } from '@aws-lambda-powertools/logger';
import type { FastifyPluginAsync } from 'fastify';
import { loggerService } from '../services';
import type { FastifyAwsPowertoolsLoggerOptions } from '../types';

export const loggerHook: FastifyPluginAsync<
  FastifyAwsPowertoolsLoggerOptions
> = async (fastify, opts) => {
  const { logger: baseLogger, loggerOptions: options } = opts;

  let logger = baseLogger as Logger;

  if (typeof logger === 'undefined') {
    logger = new Logger();
  }

  const { onRequest, onResponse, onError } = loggerService(logger, options);

  fastify
    .addHook('onRequest', async (request) => {
      if (!request.logger) {
        request.logger = Array.isArray(logger) ? logger[0] : logger;
      }
    })
    .addHook('onRequest', onRequest)
    .addHook('onResponse', onResponse)
    .addHook('onError', onError);
};
