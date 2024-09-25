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
import { invokeCleanUpFunctions } from '../../src/commons/helpers';
import { dummyContext } from '../fixtures/context';
import { dummyEvent } from '../fixtures/event';

describe('fastifyAwsPowertoolsTracerPlugin', () => {
  let app: FastifyInstance;
  let proxy: PromiseHandler;
  let handler: PromiseHandler;
  let tracer: Tracer;

  beforeEach(async () => {
    vi.stubEnv('AWS_NODEJS_CONNECTION_REUSE_ENABLED', '1');
    vi.stubEnv('AWS_XRAY_LOGGING_LEVEL', 'silent');

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

  afterEach(async () => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();

    await app.close();
  });

  it('should be registered', () => {
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
    handler = async (event, context) => proxy(event, context);
    await app.ready();

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
    handler = async (event, context) => proxy(event, context);
    await app.ready();

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

  it('when used with standard config, it annotates ColdStart correctly', async () => {
    // Prepare
    const tracer: Tracer = new Tracer();
    vi.spyOn(tracer.provider, 'setSegment').mockImplementation(() => ({}));
    vi.spyOn(tracer.provider, 'getSegment')
      .mockImplementationOnce(() => new Segment('facade'))
      .mockImplementationOnce(() => new Subsegment('## index.handler'))
      .mockImplementationOnce(() => new Segment('facade'))
      .mockImplementation(() => new Subsegment('## index.handler'));
    const putAnnotationSpy = vi.spyOn(tracer, 'putAnnotation');

    app = Fastify();
    app
      .register(fastifyAwsPowertoolsTracerPlugin, {
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
    await handler({}, dummyContext);

    // Assess
    // 2x Cold Start + 2x Service
    expect(putAnnotationSpy).toHaveBeenCalledTimes(4);
    expect(putAnnotationSpy).toHaveBeenNthCalledWith(1, 'ColdStart', true);
    expect(putAnnotationSpy).toHaveBeenNthCalledWith(3, 'ColdStart', false);
  });

  it('when used with standard config, it annotates Service correctly', async () => {
    // Prepare
    const tracer: Tracer = new Tracer();
    vi.spyOn(tracer.provider, 'setSegment').mockImplementation(() => ({}));
    vi.spyOn(tracer.provider, 'getSegment')
      .mockImplementationOnce(() => new Segment('facade'))
      .mockImplementation(() => new Subsegment('## index.handler'));
    const putAnnotationSpy = vi.spyOn(tracer, 'putAnnotation');

    app = Fastify();
    app
      .register(fastifyAwsPowertoolsTracerPlugin, {
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
    // The first call is for the Cold Start annotation
    expect(putAnnotationSpy).toHaveBeenCalledTimes(2);
    expect(putAnnotationSpy).toHaveBeenNthCalledWith(
      2,
      'Service',
      'hello-world',
    );
  });

  it('when enabled, and another middleware returns early, it still closes and restores the segments correctly', async () => {
    // Prepare
    const tracer = new Tracer();
    const setSegmentSpy = vi
      .spyOn(tracer.provider, 'setSegment')
      .mockImplementation(() => ({}));
    vi.spyOn(tracer, 'annotateColdStart').mockImplementation(() => ({}));
    vi.spyOn(tracer, 'addServiceNameAnnotation').mockImplementation(() => ({}));

    const facadeSegment1 = new Segment('facade');
    const handlerSubsegment1 = new Subsegment('## index.handlerA');
    vi.spyOn(facadeSegment1, 'addNewSubsegment').mockImplementation(
      () => handlerSubsegment1,
    );

    const facadeSegment2 = new Segment('facade');
    const handlerSubsegment2 = new Subsegment('## index.handlerB');

    vi.spyOn(facadeSegment2, 'addNewSubsegment').mockImplementation(
      () => handlerSubsegment2,
    );

    vi.spyOn(tracer.provider, 'getSegment')
      .mockImplementationOnce(() => facadeSegment1)
      .mockImplementationOnce(() => facadeSegment2);

    app = Fastify();
    app
      .register(fastifyAwsPowertoolsTracerPlugin, {
        tracer,
        tracerOptions: { captureResponse: false },
      })
      .get(
        '/',
        {
          preHandler: async (request, reply) => {
            // @ts-expect-error missing decorator
            if (request.awsLambda.event.idx === 1) {
              await invokeCleanUpFunctions(request);

              reply.send('foo');
            }
          },
        },
        async (_request, _reply) => {
          return { foo: 'bar' };
        },
      );
    proxy = awsLambdaFastify<APIGatewayProxyEventV2>(app);
    await app.ready();

    // Act
    await handler({ idx: 0 }, dummyContext);
    await handler({ idx: 1 }, dummyContext);

    // Assess
    // Check that the subsegments are closed
    expect(handlerSubsegment1.isClosed()).toBe(true);
    expect(handlerSubsegment2.isClosed()).toBe(true);
    // Check that the segments are restored
    expect(setSegmentSpy).toHaveBeenCalledTimes(4);
    expect(setSegmentSpy).toHaveBeenNthCalledWith(2, facadeSegment1);
    expect(setSegmentSpy).toHaveBeenNthCalledWith(4, facadeSegment2);
  });

  it('catches the error and logs a warning when the segment closing/serialization fails upon closing the segment', async () => {
    // Prepare
    const tracer = new Tracer();
    const facadeSegment = new Segment('facade');
    const handlerSubsegment = new Subsegment('## index.handler');
    vi.spyOn(tracer.provider, 'getSegment')
      .mockImplementationOnce(() => facadeSegment)
      .mockImplementationOnce(() => handlerSubsegment);
    vi.spyOn(tracer, 'annotateColdStart').mockImplementation(() => ({}));
    vi.spyOn(tracer, 'addServiceNameAnnotation').mockImplementation(() => ({}));
    const setSegmentSpy = vi
      .spyOn(tracer.provider, 'setSegment')
      .mockImplementation(() => ({}));
    vi.spyOn(facadeSegment, 'addNewSubsegment').mockImplementation(
      () => handlerSubsegment,
    );

    app = Fastify();
    app
      .register(fastifyAwsPowertoolsTracerPlugin, {
        tracer,
      })
      .get('/', async (_request, _reply) => {
        console.log('Hello world!');
      });
    proxy = awsLambdaFastify<APIGatewayProxyEventV2>(app);
    await app.ready();

    // Act
    const logWarningSpy = vi.spyOn(console, 'warn');
    const closeSpy = vi
      .spyOn(handlerSubsegment, 'close')
      .mockImplementation(() => {
        throw new Error('dummy error');
      });

    // Act
    await handler({ idx: 0 }, dummyContext);

    // Assess
    expect(closeSpy).toHaveBeenCalledTimes(1);
    expect(logWarningSpy).toHaveBeenNthCalledWith(
      1,
      'Failed to close or serialize segment %s. We are catching the error but data might be lost.',
      handlerSubsegment.name,
      new Error('dummy error'),
    );
    // Check that the segments are restored
    expect(setSegmentSpy).toHaveBeenNthCalledWith(2, facadeSegment);
  });
});
