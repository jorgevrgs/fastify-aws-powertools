import Fastify, { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { beforeEach, describe, expect, it } from 'vitest';
import fastifyAwsPowertool from '../../src';

describe('fastifyAwsPowertool unit', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    app = Fastify();
  });

  it('should be a function', () => {
    expect(fastifyAwsPowertool).to.be.instanceOf(Function);
  });

  it('should register the plugin', async () => {
    app.register(fp(fastifyAwsPowertool));

    await app.ready();

    expect(app.hasDecorator('logger')).toBeTruthy();
    expect(app.hasDecorator('metrics')).toBeTruthy();
    expect(app.hasDecorator('tracer')).toBeTruthy();

    expect(app.hasRequestDecorator('logger')).toBeTruthy();
    expect(app.hasRequestDecorator('metrics')).toBeTruthy();
    expect(app.hasRequestDecorator('tracer')).toBeTruthy();
  });
});
