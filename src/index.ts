import type { FastifyPluginAsync } from 'fastify';
import { onErrorHook, onRequestHook, onResponseHook } from './hooks';
import { fastifyAwsPowertoolsOptions } from './types';

export const fastifyAwsPowertools: FastifyPluginAsync<
  fastifyAwsPowertoolsOptions
> = async (fastify, opts) => {
  fastify
    .register(onRequestHook, opts)
    .register(onResponseHook, opts)
    .register(onErrorHook, opts);
};
