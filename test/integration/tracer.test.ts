import { Tracer } from '@aws-lambda-powertools/tracer';
import type { PromiseHandler } from '@fastify/aws-lambda';
import awsLambdaFastify from '@fastify/aws-lambda';
import { Segment, Subsegment } from 'aws-xray-sdk-core';
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import fastifyAwsPowertool from '../../src';

describe('fastifyAwsPowertool tracer integration', () => {
  let app: FastifyInstance;
  let proxy: PromiseHandler;
  let handler: PromiseHandler;
  let tracer: Tracer;

  const context = {
    callbackWaitsForEmptyEventLoop: true,
    functionVersion: '$LATEST',
    functionName: 'foo-bar-function',
    memoryLimitInMB: '128',
    logGroupName: '/aws/lambda/foo-bar-function-123456abcdef',
    logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
    invokedFunctionArn:
      'arn:aws:lambda:eu-west-1:123456789012:function:Example',
    awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e8deadbeef',
    getRemainingTimeInMillis: () => 1234,
    done: () => console.log('Done!'),
    fail: () => console.log('Failed!'),
    succeed: () => console.log('Succeeded!'),
  };

  beforeEach(async () => {
    tracer = new Tracer({ enabled: false });
    app = Fastify();
    app
      .register(fp(fastifyAwsPowertool), {
        tracerOptions: { captureResponse: false },
        tracer,
      })
      .get('/', async (request, reply) => {
        return 'OK';
      });
    proxy = awsLambdaFastify(app);

    handler = async (event, context) => proxy(event, context);
    await app.ready();
  });

  it('should be a function', () => {
    expect(fastifyAwsPowertool).toBeInstanceOf(Function);
  });

  it('when used while tracing is disabled, it does nothing', async () => {
    // Prepare
    const setSegmentSpy = vi.spyOn(tracer.provider, 'setSegment');

    const getSegmentSpy = vi
      .spyOn(tracer.provider, 'getSegment')
      .mockImplementationOnce(
        () => new Segment('facade', process.env._X_AMZN_TRACE_ID || null),
      )
      .mockImplementationOnce(() => new Subsegment('## index.handler'));

    // Act
    await handler({}, context);

    // Assess
    expect(setSegmentSpy).toHaveBeenCalledTimes(0);
    expect(getSegmentSpy).toHaveBeenCalledTimes(0);
  });

  it('when used while tracing is disabled, even if the handler throws an error, it does nothing', async () => {
    // Prepare
    const setSegmentSpy = vi.spyOn(tracer.provider, 'setSegment');
    const getSegmentSpy = vi
      .spyOn(tracer.provider, 'getSegment')
      .mockImplementationOnce(
        () => new Segment('facade', process.env._X_AMZN_TRACE_ID || null),
      )
      .mockImplementationOnce(() => new Subsegment('## index.handler'));

    const resp = await handler(
      { httpMethod: 'POST', path: '/not-found' },
      context,
    );

    // Act & Assess
    await expect(
      handler({ httpMethod: 'POST', path: '/not-found' }, context),
    ).resolves.toContain({ statusCode: 404 });
    expect(setSegmentSpy).toHaveBeenCalledTimes(0);
    expect(getSegmentSpy).toHaveBeenCalledTimes(0);
    expect.assertions(3);
  });
});
