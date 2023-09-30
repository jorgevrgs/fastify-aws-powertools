import { Metrics } from '@aws-lambda-powertools/metrics';
import awsLambdaFastify, { PromiseHandler } from '@fastify/aws-lambda';
import { randomUUID } from 'crypto';
import Fastify, { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fastifyAwsPowertool from '../../src';

const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {
  return;
});

describe('fastifyAwsPowertool metrics integration', function () {
  let app: FastifyInstance;
  let metrics: Metrics;
  let proxy: PromiseHandler;
  let handler: PromiseHandler;

  beforeEach(async function () {
    metrics = new Metrics({
      namespace: 'serverlessAirline',
      serviceName: 'orders',
    });

    app = Fastify();
    app
      .register(fp(fastifyAwsPowertool), {
        metricsOptions: { captureColdStartMetric: true },
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

    await app.close();
  });

  it('should be a function', function () {
    expect(fastifyAwsPowertool).toBeInstanceOf(Function);
  });

  describe('captureColdStartMetric', function () {
    const awsRequestId = randomUUID();

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

    it('should capture cold start metric if set to true', async function () {
      // Cold start
      await handler(
        {
          httpMethod: 'GET',
          path: '/',
        },
        context,
      );

      // Second call
      await handler(
        {
          httpMethod: 'GET',
          path: '/',
        },
        context,
      );

      const loggedData: any[] = [
        JSON.parse(consoleSpy.mock.calls[0][0]),
        JSON.parse(consoleSpy.mock.calls[1][0]),
      ];

      expect(consoleSpy.mock.calls).toHaveLength(3);
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics.length).toBe(1);
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics[0].Name).toBe(
        'ColdStart',
      );
      expect(loggedData[0]._aws.CloudWatchMetrics[0].Metrics[0].Unit).toBe(
        'Count',
      );
      expect(loggedData[0].ColdStart).toBe(1);
    });
  });
});
