import { Logger } from '@aws-lambda-powertools/logger';
import type { FastifyPluginAsync } from 'fastify';
import { loggerService } from '../services';
import type { fastifyAwsPowertoolsOptions } from '../types';

export const loggerHook: FastifyPluginAsync<
  fastifyAwsPowertoolsOptions
> = async (fastify, opts) => {
  let logger = opts.logger as Logger;

  if (typeof logger === 'undefined') {
    logger = new Logger();
  }

  const loggerHooks = loggerService(logger, opts.loggerOptions);

  fastify
    .addHook('onRequest', loggerHooks.onRequest)
    .addHook('onResponse', loggerHooks.onResponse)
    .addHook('onError', loggerHooks.onError);
};
