import { Logger } from '@aws-lambda-powertools/logger';
import type { PromiseHandler } from '@fastify/aws-lambda';
import awsLambdaFastify from '@fastify/aws-lambda';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { FastifyInstance, FastifyPluginAsync } from 'fastify';
import Fastify from 'fastify';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fastifyAwsPowertoolsLoggerPlugin } from '../../src';
import { dummyContext } from '../fixtures/context';

vi.spyOn(console, 'log').mockImplementation(vi.fn);

describe('fastifyAwsPowertool logger integration', () => {
  let app: FastifyInstance;
  let proxy: PromiseHandler;
  let handler: PromiseHandler<APIGatewayProxyEventV2>;
  let logger: Logger;
  let plugin: FastifyPluginAsync;

  const getContextLogEntries = (overrides?: Record<string, unknown>) => ({
    function_arn: dummyContext.invokedFunctionArn,
    function_memory_size: dummyContext.memoryLimitInMB,
    function_name: dummyContext.functionName,
    function_request_id: dummyContext.awsRequestId,
    cold_start: true,
    ...overrides,
  });

  const logSpy = vi.spyOn(console, 'info');

  const event = {
    foo: 'bar',
  } as unknown as APIGatewayProxyEventV2;

  beforeEach(async () => {
    vi.stubEnv(
      '_X_AMZN_TRACE_ID',
      'Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1',
    );
    vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', 'my-lambda-function');
    vi.stubEnv('AWS_LAMBDA_FUNCTION_MEMORY_SIZE', '128');
    vi.stubEnv('AWS_LAMBDA_FUNCTION_VERSION', '$LATEST');
    vi.stubEnv('POWERTOOLS_LOG_LEVEL', 'DEBUG');
    vi.stubEnv('POWERTOOLS_SERVICE_NAME', 'hello-world');

    vi.mock('node:console', () => ({
      ...vi.importActual('node:console'),
      Console: vi.fn().mockImplementation(() => ({
        log: vi.fn(),
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
      })),
    }));

    // vi.useFakeTimers();
  });

  afterEach(async () => {
    // vi.useRealTimers();
    vi.restoreAllMocks();
    vi.resetModules();

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

      // Act
      logger.addContext(dummyContext);
      logger.info('Hello, world!');

      // Assess
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(JSON.parse(logSpy.mock.calls[0][0])).toStrictEqual(
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

    it('adds the context to log messages when the feature is enabled in the Middy.js middleware', async () => {
      // Prepare
      app = Fastify({ logger: false });
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
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(JSON.parse(logSpy.mock.calls[0][0])).toStrictEqual(
        expect.objectContaining({
          message: 'Hello, world!',
          ...getContextLogEntries(),
        }),
      );
    });
  });
});
