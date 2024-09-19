import fastify from 'fastify';
import { AwsPowertoolsLogger } from 'fastify-aws-powertools';
import app from './app';
import { logger as powertoolsLogger } from './powertools';

const logger = new AwsPowertoolsLogger(powertoolsLogger);

const server = fastify({
  logger,
});

server.register(app);

export default server;
