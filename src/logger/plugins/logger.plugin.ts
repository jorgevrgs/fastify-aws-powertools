import { Logger } from '@aws-lambda-powertools/logger';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { loggerHook } from '../hooks';
import type { FastifyAwsPowertoolsLoggerOptions } from '../types';

const fastifyAwsPowertoolsLogger: FastifyPluginAsync<
  FastifyAwsPowertoolsLoggerOptions
> = async (fastify, opts) => {
  const { loggerOptions = {} } = opts;

  let logger: Logger;

  if ('logger' in opts) {
    logger = opts.logger;
  } else {
    logger = new Logger(opts.loggerInstanceOptions);
  }

  fastify
    .decorateRequest('logger', null)
    .decorate('logger', logger)
    .register(fp(loggerHook), { logger, loggerOptions });
};

export const fastifyAwsPowertoolsLoggerPlugin = fp(fastifyAwsPowertoolsLogger, {
  name: 'fastify-aws-powertools-logger',
  fastify: '4.x',
});
