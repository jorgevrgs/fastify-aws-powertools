import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { FastifyPluginAsync } from 'fastify';
import fastifyAwsPowertools from 'fastify-aws-powertools';

const app: FastifyPluginAsync = async (fastify) => {
  fastify.register(fastifyAwsPowertools, {
    logger: new Logger(),
    metrics: new Metrics(),
    tracer: new Tracer(),
  });

  fastify.get('/', async () => {
    return { hello: 'world' };
  });
};

export default app;
