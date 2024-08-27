import type { FastifyPluginAsync } from 'fastify';
import { loggerService } from '../services';
import type { FastifyAwsPowertoolsLoggerOptions } from '../types';

export const loggerHook: FastifyPluginAsync<
  Required<Pick<FastifyAwsPowertoolsLoggerOptions, 'logger' | 'loggerOptions'>>
> = async (fastify, opts) => {
  const { logger, loggerOptions: options } = opts;

  const { onRequest, onResponse, onError } = loggerService(logger, options);

  fastify
    .addHook('onRequest', async (request) => {
      if (!request.logger) {
        request.logger =
          Array.isArray(logger) && logger.length > 0 ? logger[0] : logger;
      }
    })
    .addHook('onRequest', onRequest)
    .addHook('onResponse', onResponse)
    .addHook('onError', onError);
};
