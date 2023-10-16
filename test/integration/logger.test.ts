import { Logger } from '@aws-lambda-powertools/logger';
import type { PromiseHandler } from '@fastify/aws-lambda';
import awsLambdaFastify from '@fastify/aws-lambda';
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fastifyAwsPowertool from '../../src';

describe('fastifyAwsPowertool logger integration', function () {
  let app: FastifyInstance;
  let proxy: PromiseHandler;
  let handler: PromiseHandler;
  let logger: Logger;

  beforeEach(async function () {
    vi.useFakeTimers();

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
        fp(
          async (instance) => {
            instance.get('/', async (request, reply) => {
              request.logger?.info('This is an INFO log with some context');

              return 'OK';
            });
          },
          {
            name: 'routes',
            dependencies: ['powertools'],
            decorators: {
              request: ['logger'],
            },
          },
        ),
      );
    proxy = awsLambdaFastify(app);

    handler = async (event, context) => proxy(event, context);
    await app.ready();
  });

  afterEach(async function () {
    vi.useRealTimers();
    vi.restoreAllMocks();

    await app.close();
  });

  it('should be a function', function () {
    expect(fastifyAwsPowertool).to.be.instanceOf(Function);
  });

  it('when a logger object is passed, it adds the context to the logger instance', async function () {
    const event = {
      httpMethod: 'GET',
      path: '/',
    };

    const getRandomInt = (): number => Math.floor(Math.random() * 1000000000);

    const awsRequestId = getRandomInt().toString();
    const context = {
      callbackWaitsForEmptyEventLoop: true,
      functionVersion: '$LATEST',
      functionName: 'foo-bar-function',
      memoryLimitInMB: '128',
      logGroupName: '/aws/lambda/foo-bar-function',
      logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
      invokedFunctionArn:
        'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
      awsRequestId: awsRequestId,
      getRemainingTimeInMillis: () => 1234,
      done: () => console.log('Done!'),
      fail: () => console.log('Failed!'),
      succeed: () => console.log('Succeeded!'),
    };

    await handler(event, context);

    expect(logger).toHaveProperty(
      ['powertoolLogData', 'lambdaContext', 'awsRequestId'],
      awsRequestId,
    );
  });
});
