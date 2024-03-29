import { helloworldContext as dummyContext } from '@aws-lambda-powertools/commons/lib/samples/resources/contexts/hello-world';
import { CustomEvent as dummyEvent } from '@aws-lambda-powertools/commons/lib/samples/resources/events/custom/index';
import { Metrics } from '@aws-lambda-powertools/metrics';
import type { PromiseHandler } from '@fastify/aws-lambda';
import awsLambdaFastify from '@fastify/aws-lambda';
import { randomUUID } from 'crypto';
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';
import fp from 'fastify-plugin';
import type { MockInstance } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fastifyAwsPowertool from '../../src';
import type { MetricRecords } from '../../src/types';

describe('fastifyAwsPowertool metrics integration', function () {
  let app: FastifyInstance;
  let metrics: Metrics;
  let proxy: PromiseHandler;
  let handler: PromiseHandler;
  let consoleLogSpy: MockInstance;
  // let consoleErrorSpy: SpyInstance;
  // let consoleWarnSpy: SpyInstance;

  beforeEach(async function () {
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    metrics = new Metrics({
      namespace: 'serverlessAirline',
      serviceName: 'orders',
    });

    app = Fastify();
    app
      .register(fp(fastifyAwsPowertool), {
        metricsOptions: {
          captureColdStartMetric: true,
        },
        metrics,
      })
      .get('/', async (request, reply) => {
        const coldStart = request.metrics?.getColdStart();
        if (coldStart) {
          return 'cold start';
        }

        return 'warm start';
      });
    proxy = awsLambdaFastify(app);

    handler = async (event, context) => proxy(event, context);
    await app.ready();
  });

  afterEach(async function () {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();

    await app.close();
  });

  it('should be a function', function () {
    expect(fastifyAwsPowertool).toBeInstanceOf(Function);
  });

  describe('captureColdStartMetric', function () {
    const awsRequestId = randomUUID();

    it('should capture cold start metric if set to true', async function () {
      vi.stubEnv('_X_AMZN_TRACE_ID', awsRequestId);
      const consoleSpy = vi
        .spyOn(metrics['console'], 'log')
        .mockImplementation(vi.fn());

      vi.spyOn(metrics, 'singleMetric').mockImplementation(() => metrics);

      // Cold start
      await handler(dummyEvent, dummyContext);

      // Second call
      await handler(dummyEvent, dummyContext);

      const parsedData = consoleSpy.mock.calls.map((value) => {
        const parsed = JSON.parse(
          value as unknown as string,
        ) as unknown as MetricRecords;

        return parsed;
      });

      expect(consoleSpy.mock.calls).toHaveLength(2);
      expect(parsedData[0]._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(parsedData[0]._aws.CloudWatchMetrics[0].Metrics[0].Name).toBe(
        'ColdStart',
      );
      expect(parsedData[0]._aws.CloudWatchMetrics[0].Metrics[0].Unit).toBe(
        'Count',
      );
      expect(parsedData[0].ColdStart).toBe(1);
      expect(parsedData[1].ColdStart).toBeUndefined();
    });

    it('should not capture cold start metrics if set to false', async () => {
      // Prepare
      app = Fastify();
      app
        .register(fp(fastifyAwsPowertool), {
          metricsOptions: {
            captureColdStartMetric: false,
          },
          metrics,
        })
        .get('/', async (request, reply) => {
          const coldStart = request.metrics?.getColdStart();
          if (coldStart) {
            return 'cold start';
          }

          return 'warm start';
        });
      proxy = awsLambdaFastify(app);

      handler = async (event, context) => proxy(event, context);
      await app.ready();

      const consoleSpy = vi
        .spyOn(metrics['console'], 'log')
        .mockImplementation(vi.fn());

      await handler(dummyEvent, dummyContext);
      await handler(dummyEvent, dummyContext);

      const parsedData = consoleSpy.mock.calls.map((value) => {
        const parsed = JSON.parse(
          value as unknown as string,
        ) as unknown as MetricRecords;

        return parsed;
      });

      expect(parsedData[0]._aws.CloudWatchMetrics[0].Dimensions).not.contains({
        Name: 'ColdStart',
        Unit: 'Count',
      });
      expect(parsedData[0].ColdStart).toBeUndefined();
    });
  });
});
