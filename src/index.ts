import type { FastifyPluginAsync } from 'fastify';
import { loggerHook, metricsHook, tracerHook } from './hooks';
import { fastifyAwsPowertoolsOptions } from './types';

const fastifyAwsPowertools: FastifyPluginAsync<
  fastifyAwsPowertoolsOptions
> = async (fastify, opts) => {
  fastify
    .register(loggerHook, opts)
    .register(metricsHook, opts)
    .register(tracerHook, opts);
};

export default fastifyAwsPowertools;
