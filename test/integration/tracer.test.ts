import { Tracer } from '@aws-lambda-powertools/tracer';
import type { PromiseHandler } from '@fastify/aws-lambda';
import awsLambdaFastify from '@fastify/aws-lambda';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import {
  Segment,
  Subsegment,
  setContextMissingStrategy,
} from 'aws-xray-sdk-core';
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import { randomUUID } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fastifyAwsPowertoolsTracerPlugin } from '../../src';
import { dummyContext } from '../fixtures/context';
import { dummyEvent } from '../fixtures/event';

describe('fastifyAwsPowertool tracer integration', () => {
  let app: FastifyInstance;
  let proxy: PromiseHandler;
  let handler: PromiseHandler;
  let tracer: Tracer;

  beforeEach(async () => {
    vi.stubEnv('AWS_EXECUTION_ENV', 'AWS_Lambda_nodejs20.x');
    vi.stubEnv('_HANDLER', 'index.handler');

    tracer = new Tracer({ enabled: false });
    app = Fastify();

    app
      .register(fastifyAwsPowertoolsTracerPlugin, {
        tracerOptions: { captureResponse: false },
        tracer,
      })
      .get('/', async (_request, _reply) => {
        return 'OK';
      });

    proxy = awsLambdaFastify<APIGatewayProxyEventV2>(app);

    handler = async (event, context) => proxy(event, context);
    await app.ready();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it('should be register a plugin', () => {
    expect(app.hasPlugin('fastify-aws-powertools-tracer')).toBe(true);
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

  it('when used while captureResponse set to false, it does not capture the response as metadata', async () => {
    // Prepare
    const tracer: Tracer = new Tracer();
    vi.spyOn(tracer.provider, 'setSegment').mockImplementation(vi.fn());
    const putMetadataSpy = vi.spyOn(tracer, 'putMetadata');

    // Act
    await handler({}, dummyContext);

    // Assess
    expect(putMetadataSpy).toHaveBeenCalledTimes(0);
  });

  it('when used while captureResponse set to true, it captures the response as metadata', async () => {
    // Prepare
    const tracer: Tracer = new Tracer();
    vi.spyOn(tracer.provider, 'setSegment').mockImplementation(vi.fn());
    const putMetadataSpy = vi.spyOn(tracer, 'putMetadata');

    app = Fastify();
    app
      .register(fastifyAwsPowertoolsTracerPlugin, {
        tracerOptions: { captureResponse: true },
        tracer,
      })
      .get('/', async (_request, _reply) => {
        return { foo: 'bar' };
      });
    proxy = awsLambdaFastify<APIGatewayProxyEventV2>(app);

    handler = async (event, context) => proxy(event, context);
    await app.ready();

    // Act
    await handler({}, dummyContext);

    // Assess
    expect(putMetadataSpy).toHaveBeenCalledTimes(1);
    expect(putMetadataSpy).toHaveBeenCalledWith('index.handler response', {
      foo: 'bar',
    });
  });

  it('when used with standard config, it captures the response as metadata', async () => {
    // Prepare
    const tracer: Tracer = new Tracer();
    vi.spyOn(tracer.provider, 'setSegment').mockImplementation(vi.fn());
    const putMetadataSpy = vi.spyOn(tracer, 'putMetadata');

    app = Fastify();
    app
      .register(fastifyAwsPowertoolsTracerPlugin, {
        tracer,
      })
      .get('/', async (_request, _reply) => {
        return { foo: 'bar' };
      });
    proxy = awsLambdaFastify<APIGatewayProxyEventV2>(app);

    // Act
    await handler({}, dummyContext);

    // Assess
    expect(putMetadataSpy).toHaveBeenCalledTimes(1);
    expect(putMetadataSpy).toHaveBeenCalledWith('index.handler response', {
      foo: 'bar',
    });
  });

  it('when used while POWERTOOLS_TRACER_CAPTURE_ERROR is set to false, it does not capture the exceptions', async () => {
    // Prepare
    vi.stubEnv('POWERTOOLS_TRACER_CAPTURE_ERROR', 'false');
    const tracer: Tracer = new Tracer();
    const newSubsegment: Segment | Subsegment | undefined = new Subsegment(
      '## index.handler',
    );
    const setSegmentSpy = vi
      .spyOn(tracer.provider, 'setSegment')
      .mockImplementation(vi.fn());

    vi.spyOn(tracer.provider, 'getSegment').mockImplementation(
      () => newSubsegment,
    );

    setContextMissingStrategy(() => null);
    const addErrorSpy = vi.spyOn(newSubsegment, 'addError');
    const addErrorFlagSpy = vi.spyOn(newSubsegment, 'addErrorFlag');

    app = Fastify();
    app
      .register(fastifyAwsPowertoolsTracerPlugin, {
        tracerOptions: { captureResponse: true },
        tracer,
      })
      .get('/', async (_request, _reply) => {
        throw new Error('Exception thrown!');
      });
    proxy = awsLambdaFastify<APIGatewayProxyEventV2>(app);

    // Act & Assess
    await expect(handler({}, dummyContext)).resolves.toMatchObject({
      statusCode: 500,
    });
    expect(setSegmentSpy).toHaveBeenCalledTimes(2);
    expect('cause' in newSubsegment).toBe(false);
    expect(addErrorFlagSpy).toHaveBeenCalledTimes(1);
    expect(addErrorSpy).toHaveBeenCalledTimes(0);
    expect.assertions(5);
  });

  it('when used with standard config, it captures the exception correctly', async () => {
    // Prepare
    const tracer: Tracer = new Tracer();
    const newSubsegment: Segment | Subsegment | undefined = new Subsegment(
      '## index.handler',
    );
    const setSegmentSpy = vi
      .spyOn(tracer.provider, 'setSegment')
      .mockImplementation(vi.fn());

    vi.spyOn(tracer.provider, 'getSegment').mockImplementation(
      () => newSubsegment,
    );

    setContextMissingStrategy(() => null);
    const addErrorSpy = vi.spyOn(newSubsegment, 'addError');

    app = Fastify();
    app
      .register(fastifyAwsPowertoolsTracerPlugin, {
        tracerOptions: { captureResponse: true },
        tracer,
      })
      .get('/', async (_request, _reply) => {
        throw new Error('Exception thrown!');
      });
    proxy = awsLambdaFastify<APIGatewayProxyEventV2>(app);

    // Act & Assess
    await expect(handler({}, dummyContext)).resolves.toMatchObject({
      statusCode: 500,
    });
    expect(setSegmentSpy).toHaveBeenCalledTimes(2);
    expect('cause' in newSubsegment).toBe(true);
    expect(addErrorSpy).toHaveBeenCalledTimes(1);
    expect(addErrorSpy).toHaveBeenCalledWith(
      new Error('Exception thrown!'),
      false,
    );
    expect.assertions(5);
  });
});
