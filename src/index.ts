import type { FastifyPluginAsync } from 'fastify';
import { onErrorHook, onRequestHook, onResponseHook } from './hooks';

export const fastifyAwsPowertools: FastifyPluginAsync = async (fastify) => {
  fastify
    .register(onRequestHook)
    .register(onResponseHook)
    .register(onErrorHook);
};
