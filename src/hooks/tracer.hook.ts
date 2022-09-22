import type { FastifyPluginAsync } from 'fastify';
import { fastifyAwsPowertoolsOptions } from '../types';

export const onResponseHook: FastifyPluginAsync<
  fastifyAwsPowertoolsOptions
> = async (fastify, opts) => {
  // TODO
};
