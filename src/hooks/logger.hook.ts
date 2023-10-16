import type { Logger } from '@aws-lambda-powertools/logger';
import type { FastifyPluginAsync } from 'fastify';
import { loggerService } from '../services';
import type { LoggerServiceOptions } from '../types';

export const loggerHook: FastifyPluginAsync<{
  logger: Logger | Logger[];
  handlerOptions: LoggerServiceOptions;
}> = async (fastify, opts) => {
  const { logger, handlerOptions } = opts;

  const loggerHooks = loggerService(logger, handlerOptions);

  fastify
    .addHook('onRequest', async (request) => {
      if (!request.logger) {
        request.logger = Array.isArray(logger) ? logger[0] : logger;
      }
    })
    .addHook('onRequest', loggerHooks.onRequest)
    .addHook('onResponse', loggerHooks.onResponse)
    .addHook('onError', loggerHooks.onError);
};
