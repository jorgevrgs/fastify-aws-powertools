import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import type { FastifyAwsPowertoolsOptions } from './commons/types';
import { fastifyAwsPowertoolsLoggerPlugin } from './logger';
import { fastifyAwsPowertoolsMetricsPlugin } from './metrics';
import { fastifyAwsPowertoolsTracerPlugin } from './tracer';

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
