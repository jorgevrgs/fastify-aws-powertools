import { Logger } from '@aws-lambda-powertools/logger';
import { Metrics, MetricUnits } from '@aws-lambda-powertools/metrics';
import { Tracer } from '@aws-lambda-powertools/tracer';
import { FastifyPluginAsync } from 'fastify';
import fastifyAwsPowertools from 'fastify-aws-powertools';

const app: FastifyPluginAsync = async (fastify) => {
  fastify.register(fastifyAwsPowertools, {
    logger: new Logger(),
    metrics: new Metrics(),
    tracer: new Tracer(),
  });

  fastify.get('/', async (request) => {
    request.tracer?.putAnnotation('successfulBooking', true);
    request.logger?.info('This is a log with an extra variable', {
      foo: 'bar',
    });
    request.metrics?.addMetric('successfulBooking', MetricUnits.Count, 1);
    request.metrics?.addMetadata(
      'bookingId',
      '7051cd10-6283-11ec-90d6-0242ac120003',
    );
    request.metrics?.publishStoredMetrics();

    return { hello: 'world' };
  });
};

export default app;
