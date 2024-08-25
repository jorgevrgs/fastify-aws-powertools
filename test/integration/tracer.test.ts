import { Tracer } from '@aws-lambda-powertools/tracer';
import type { PromiseHandler } from '@fastify/aws-lambda';
import awsLambdaFastify from '@fastify/aws-lambda';
import { Segment, Subsegment } from 'aws-xray-sdk-core';
import { randomUUID } from 'crypto';
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fastifyAwsPowertool from '../../src';
import { dummyContext } from '../fixtures/context';
import { dummyEvent } from '../fixtures/event';

describe('fastifyAwsPowertool tracer integration', () => {
  let app: FastifyInstance;
  let proxy: PromiseHandler;
  let handler: PromiseHandler;
  let tracer: Tracer;

  beforeEach(async () => {
    tracer = new Tracer({ enabled: false });
    app = Fastify();
    app
      .register(fp(fastifyAwsPowertool), {
        tracerOptions: { captureResponse: false },
        tracer,
      })
      .get('/', async (_request, _reply) => {
        return 'OK';
      });
    proxy = awsLambdaFastify(app);

    handler = async (event, context) => proxy(event, context);
    await app.ready();
  });

  afterEach(function () {
    vi.unstubAllEnvs();
  });

  it('should be a function', () => {
    expect(fastifyAwsPowertool).toBeInstanceOf(Function);
  });

  it('when used while tracing is disabled, it does nothing', async () => {
    // Prepare
    const setSegmentSpy = vi.spyOn(tracer.provider, 'setSegment');
    vi.stubEnv('_X_AMZN_TRACE_ID', randomUUID());

    const getSegmentSpy = vi
      .spyOn(tracer.provider, 'getSegment')
      .mockImplementationOnce(
        () => new Segment('facade', process.env._X_AMZN_TRACE_ID),
      )
      .mockImplementationOnce(() => new Subsegment('## index.handler'));

    // Act
    await handler(dummyEvent, dummyContext);

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

    // Act & Assess
    await expect(
      handler({ httpMethod: 'POST', path: '/not-found' }, dummyContext),
    ).resolves.toMatchObject({ statusCode: 404 });
    expect(setSegmentSpy).toHaveBeenCalledTimes(0);
    expect(getSegmentSpy).toHaveBeenCalledTimes(0);
    expect.assertions(3);
  });

  it('when used while POWERTOOLS_TRACER_CAPTURE_RESPONSE is set to false, it does not capture the response as metadata', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_TRACER_CAPTURE_RESPONSE', 'false');
    const tracer: Tracer = new Tracer();
    vi.spyOn(tracer.provider, 'setSegment');
    const putMetadataSpy = vi.spyOn(tracer, 'putMetadata');

    // Act
    await handler(dummyEvent, dummyContext);

    // Assess
    expect(putMetadataSpy).toHaveBeenCalledTimes(0);
  });
});
