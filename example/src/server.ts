import fastify from 'fastify';
import app from './app';

const server = fastify({
  logger: true,
});

server.register(app);

export default server;
