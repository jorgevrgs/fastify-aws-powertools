import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import type { FastifyAwsPowertoolsOptions } from './commons/types/index.js';
import { fastifyAwsPowertoolsLoggerPlugin } from './logger/index.js';
import { fastifyAwsPowertoolsMetricsPlugin } from './metrics/index.js';
import { fastifyAwsPowertoolsTracerPlugin } from './tracer/index.js';

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
  fastify: '5.x',
});
