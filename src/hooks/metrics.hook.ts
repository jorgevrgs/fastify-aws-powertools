import type { FastifyPluginAsync } from 'fastify';
import { fastifyAwsPowertoolsOptions } from '../types';

export const onErrorHook: FastifyPluginAsync<
  fastifyAwsPowertoolsOptions
> = async (fastify, opts) => {
  // TODO
};
