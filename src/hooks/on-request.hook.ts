import type { FastifyPluginAsync } from 'fastify';
import { fastifyAwsPowertoolsOptions } from '../types';

export const onRequestHook: FastifyPluginAsync<
  fastifyAwsPowertoolsOptions
> = async (fastify, opts) => {
  // TODO
};
