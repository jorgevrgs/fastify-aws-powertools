import { randomUUID } from 'node:crypto';
import { Metrics } from '@aws-lambda-powertools/metrics';
import type { PromiseHandler } from '@fastify/aws-lambda';
import awsLambdaFastify from '@fastify/aws-lambda';
import type { APIGatewayProxyEventV2 } from 'aws-lambda';
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import type { MockInstance } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fastifyAwsPowertoolsMetricsPlugin } from '../../src';
import { dummyContext } from '../fixtures/context';
import { dummyEvent } from '../fixtures/event';

describe('fastifyAwsPowertoolsMetricsPlugin metrics integration', () => {
  let app: FastifyInstance;
  let metrics: Metrics;
  let proxy: PromiseHandler;
  let handler: PromiseHandler;
  let consoleLogSpy: MockInstance;
  // let consoleErrorSpy: SpyInstance;
  // let consoleWarnSpy: SpyInstance;

  const event = {
    foo: 'bar',
    bar: 'baz',
  };

  beforeEach(async () => {
    vi.stubEnv(
      '_X_AMZN_TRACE_ID',
      'Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1',
    );
    vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', 'my-lambda-function');
    vi.stubEnv('AWS_LAMBDA_FUNCTION_MEMORY_SIZE', '128');
    vi.stubEnv('POWERTOOLS_METRICS_NAMESPACE', 'hello-world');

    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(vi.fn());
    vi.spyOn(console, 'error').mockImplementation(vi.fn());
    vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    metrics = new Metrics({
      namespace: 'serverlessAirline',
      serviceName: 'orders',
    });

    app = Fastify();
    app
      .register(fastifyAwsPowertoolsMetricsPlugin, {
        metricsOptions: {
          captureColdStartMetric: true,
        },
        metrics,
      })
      .get('/', async (request, _reply) => {
        const coldStart = request.metrics?.getColdStart();
        if (coldStart) {
          return 'cold start';
        }

        return 'warm start';
      });
    proxy = awsLambdaFastify<APIGatewayProxyEventV2>(app);

    handler = async (event, context) => proxy(event, context);
    await app.ready();
  });

  afterEach(async () => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();

    await app.close();
  });

  it('should be a plugin', () => {
    expect(app.hasPlugin('fastify-aws-powertools-metrics')).toBe(true);
  });

  describe('captureColdStartMetric', () => {
    const awsRequestId = randomUUID();

    it('should capture cold start metric if set to true', async () => {
      vi.stubEnv('_X_AMZN_TRACE_ID', awsRequestId);
      const consoleSpy = vi
        // biome-ignore lint/complexity/useLiteralKeys: This needs to be accessed with literal key for testing
        .spyOn(metrics['console'], 'log')
        .mockImplementation(vi.fn());

      vi.spyOn(metrics, 'singleMetric').mockImplementation(() => metrics);

      // Cold start
      await handler(dummyEvent, dummyContext);

      // Second call
      await handler(dummyEvent, dummyContext);

      expect(consoleSpy.mock.calls).toHaveLength(1);

      // @ts-expect-error - accessing unknown property for testing
      const loggedData = JSON.parse(consoleSpy.mock.calls[0][0]);

      expect(loggedData._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics[0].Name).toBe(
        'ColdStart',
      );
      expect(loggedData._aws.CloudWatchMetrics[0].Metrics[0].Unit).toBe(
        'Count',
      );
      expect(loggedData.ColdStart).toBe(1);
    });

    it('should not capture cold start metrics if set to false', async () => {
      // Prepare
      app = Fastify();
      app
        .register(fastifyAwsPowertoolsMetricsPlugin, {
          metricsOptions: {
            captureColdStartMetric: false,
          },
          metrics,
        })
        .get('/', async (request, _reply) => {
          const coldStart = request.metrics?.getColdStart();
          if (coldStart) {
            return 'cold start';
          }

          return 'warm start';
        });
      proxy = awsLambdaFastify<APIGatewayProxyEventV2>(app);

      handler = async (event, context) => proxy(event, context);
      await app.ready();

      const consoleSpy = vi
        // biome-ignore lint/complexity/useLiteralKeys: This needs to be accessed with literal key for testing
        .spyOn(metrics['console'], 'log')
        .mockImplementation(vi.fn());

      await handler(dummyEvent, dummyContext);
      await handler(dummyEvent, dummyContext);

      expect(consoleLogSpy).to.not.toHaveBeenCalled();
    });

    it('should not throw on empty metrics if not set', async () => {
      // Prepare
      const metrics = new Metrics({
        namespace: 'serverlessAirline',
        serviceName: 'orders',
      });
      app = Fastify();
      app
        .register(fastifyAwsPowertoolsMetricsPlugin, {
          metricsOptions: {
            captureColdStartMetric: false,
          },
          metrics,
        })
        .get('/', async (request, _reply) => {
          const coldStart = request.metrics?.getColdStart();
          if (coldStart) {
            return 'cold start';
          }

          return 'warm start';
        });
      proxy = awsLambdaFastify<APIGatewayProxyEventV2>(app);

      handler = async (event, context) => proxy(event, context);
      await app.ready();

      // Act & Assess
      await expect(handler(event, dummyContext)).resolves.not.toThrow();
    });
  });
});
