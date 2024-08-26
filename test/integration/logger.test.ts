import { Logger } from '@aws-lambda-powertools/logger';
import type { PromiseHandler } from '@fastify/aws-lambda';
import awsLambdaFastify from '@fastify/aws-lambda';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fastifyAwsPowertool from '../../src';
import { dummyContext } from '../fixtures/context';
import { dummyEvent } from '../fixtures/event';

vi.spyOn(console, 'log').mockImplementation(vi.fn);

describe('fastifyAwsPowertool logger integration', () => {
  let app: FastifyInstance;
  let proxy: PromiseHandler;
  let handler: PromiseHandler<APIGatewayProxyEventV2>;
  let logger: Logger;
  let plugin: FastifyPluginAsync;

  beforeEach(async () => {
    vi.useFakeTimers();

    plugin = async (instance) => {
      instance.get('/', async (request, _reply) => {
        request.logger?.info('This is an INFO log with some context');

        return 'OK';
      });
    };

    app = Fastify();
    logger = new Logger();
    app
      .register(
        fp(fastifyAwsPowertool, {
          name: 'powertools',
        }),
        {
          logger,
        },
      )
      .register(
        fp(plugin, {
          name: 'routes',
          dependencies: ['powertools'],
          decorators: {
            request: ['logger'],
          },
        }),
      );
    proxy = awsLambdaFastify<APIGatewayProxyEventV2>(app);

    handler = async (event, context) => proxy(event, context);
    await app.ready();
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();

    await app.close();
  });

  it('should be a function', () => {
    expect(fastifyAwsPowertool).to.be.instanceOf(Function);
  });

  it('when a logger object is passed, it adds the context to the logger instance', async () => {
    const getRandomInt = (): number => Math.floor(Math.random() * 1000000000);

    const awsRequestId = getRandomInt().toString();

    await handler(dummyEvent, {
      ...dummyContext,
      awsRequestId,
    });

    expect(logger).toHaveProperty(
      ['powertoolsLogData', 'lambdaContext', 'awsRequestId'],
      awsRequestId,
    );
  });
});
