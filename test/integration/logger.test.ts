import { Logger } from '@aws-lambda-powertools/logger';
import type { PromiseHandler } from '@fastify/aws-lambda';
import awsLambdaFastify from '@fastify/aws-lambda';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import type { MockInstance } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fastifyAwsPowertoolsLoggerPlugin } from '../../src';
import { dummyContext } from '../fixtures/context';

describe('fastifyAwsPowertoolsLoggerPlugin', () => {
  let app: FastifyInstance;
  let proxy: PromiseHandler;
  let handler: PromiseHandler<APIGatewayProxyEventV2>;
  let logger: Logger;

  const getContextLogEntries = (overrides?: Record<string, unknown>) => ({
    function_arn: dummyContext.invokedFunctionArn,
    function_memory_size: dummyContext.memoryLimitInMB,
    function_name: dummyContext.functionName,
    function_request_id: dummyContext.awsRequestId,
    cold_start: true,
    ...overrides,
  });

  let logSpy: MockInstance<Console['info']>;

  const event = {
    foo: 'bar',
  } as unknown as APIGatewayProxyEventV2;

  beforeEach(() => {
    vi.stubEnv('POWERTOOLS_LOG_LEVEL', 'DEBUG');
    vi.stubEnv('POWERTOOLS_DEV', 'true');

    logSpy = vi.spyOn(console, 'info');
  });

  afterEach(async () => {
    await app.close();
  });

  it('should be registered', async () => {
    app = Fastify();
    logger = new Logger();
    app.register(fastifyAwsPowertoolsLoggerPlugin, {
      logger,
    });
    proxy = awsLambdaFastify<APIGatewayProxyEventV2>(app);

    handler = async (event, context) => proxy(event, context);
    await app.ready();

    expect(app.hasPlugin('fastify-aws-powertools-logger')).toBeTruthy();
  });

  describe('Inject Lambda Context', () => {
    it('adds the context to log messages when the feature is enabled', () => {
      // Prepare
      logger = new Logger();

      console.warn('calls --> ', logSpy.mock.calls);

      // Act
      logger.addContext(dummyContext);
      logger.info('Hello, world!');

      // Assess
      expect(vi.mocked(console.info)).toHaveBeenCalledTimes(1);
      expect(
        JSON.parse(vi.mocked(console.info).mock.calls[0][0]),
      ).toStrictEqual(
        expect.objectContaining({
          message: 'Hello, world!',
          ...getContextLogEntries(),
        }),
      );
    });

    it('replaces the context when a new context is added', () => {
      // Prepare
      const logger = new Logger();

      // Act
      logger.addContext(dummyContext);
      logger.info('Hello, world!');
      logger.addContext({
        ...dummyContext,
        awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345679',
      });
      logger.info('Hello, world!');

      // Assess
      expect(logSpy).toHaveBeenCalledTimes(2);
      expect(JSON.parse(logSpy.mock.calls[1][0])).toStrictEqual(
        expect.objectContaining({
          message: 'Hello, world!',
          ...getContextLogEntries({
            function_request_id: 'c6af9ac6-7b61-11e6-9a41-93e812345679',
            cold_start: false,
          }),
        }),
      );
    });

    it('adds the context to log messages when the feature is enabled in the Fastify plugin', async () => {
      // Prepare
      app = Fastify();
      logger = new Logger();
      app
        .register(fastifyAwsPowertoolsLoggerPlugin, {
          logger,
        })
        .get('/', async (request, reply) => {
          request.logger.info('Hello, world!');
        });
      proxy = awsLambdaFastify<APIGatewayProxyEventV2>(app);

      handler = async (event, context) => proxy(event, context);
      await app.ready();

      // Act
      await handler(event, dummyContext);

      // Assess
      expect(logSpy).toHaveBeenCalledOnce();
      expect(JSON.parse(logSpy.mock.calls[0][0])).toStrictEqual(
        expect.objectContaining({
          message: 'Hello, world!',
          ...getContextLogEntries(),
        }),
      );
    });

    it('adds the context to the messages of each logger instance', async () => {
      // Prepare
      const logger1 = new Logger({ serviceName: 'parent' });
      const logger2 = logger1.createChild({ serviceName: 'child' });
      app = Fastify();
      logger = new Logger();
      app
        .register(fastifyAwsPowertoolsLoggerPlugin, {
          logger: [logger1, logger2],
        })
        .get('/', async (request, reply) => {
          request.logger.info('Hello, world!');
          logger2.info('Hello, world!');
        });
      proxy = awsLambdaFastify<APIGatewayProxyEventV2>(app);

      handler = async (event, context) => proxy(event, context);
      await app.ready();

      // Act
      await handler(event, dummyContext);

      // Assess
      expect(logSpy).toHaveBeenCalledTimes(2);
      expect(JSON.parse(logSpy.mock.calls[0][0])).toStrictEqual(
        expect.objectContaining({
          message: 'Hello, world!',
          service: 'parent',
          ...getContextLogEntries(),
        }),
      );
      expect(JSON.parse(logSpy.mock.calls[1][0])).toStrictEqual(
        expect.objectContaining({
          message: 'Hello, world!',
          service: 'child',
          ...getContextLogEntries(),
        }),
      );
    });
  });
});
