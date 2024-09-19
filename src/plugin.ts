import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { fastifyAwsPowertoolsLoggerPlugin, fastifyAwsPowertoolsMetricsPlugin, fastifyAwsPowertoolsTracerPlugin } from './plugins';
import type { FastifyAwsPowertoolsOptions } from './types';

export const fastifyAwsPowertools: FastifyPluginAsync<
  FastifyAwsPowertoolsOptions
> = async (fastify, opts) => {
  fastify
    .register(fastifyAwsPowertoolsLoggerPlugin, opts)
    .register(fastifyAwsPowertoolsMetricsPlugin, opts)
    .register(fastifyAwsPowertoolsTracerPlugin, opts);
};

export const fastifyAwsPowertoolsPlugin = fp(fastifyAwsPowertools, {
  name: 'fastify-aws-powertools',
  fastify: '4.x',
});
