import { Tracer } from '@aws-lambda-powertools/tracer';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';
import { tracerHook } from '../hooks';
import type { FastifyAwsPowertoolsTracerOptions } from '../types';

const fastifyAwsPowertoolsTracer: FastifyPluginAsync<
  FastifyAwsPowertoolsTracerOptions
> = async (fastify, opts) => {
  const { tracerOptions = {} } = opts;

  let tracer: Tracer;

  if ('tracer' in opts) {
    tracer = opts.tracer;
  } else {
    tracer = new Tracer(opts.tracerInstanceOptions);
  }

  fastify
    .decorateRequest('tracer', null)
    .decorate('tracer', tracer)
    .register(fp(tracerHook), { tracer, tracerOptions });
};

export const fastifyAwsPowertoolsTracerPlugin = fp(fastifyAwsPowertoolsTracer, {
  name: 'fastify-aws-powertools-tracer',
  fastify: '4.x',
});
