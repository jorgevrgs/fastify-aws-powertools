import type { Logger } from '@aws-lambda-powertools/logger';
import type { Metrics } from '@aws-lambda-powertools/metrics';
import type { Tracer } from '@aws-lambda-powertools/tracer';
import type { Context } from 'aws-lambda';
import type { FastifyRequest } from 'fastify';
import {
  LOGGER_KEY,
  METRICS_KEY,
  POWERTOOLS_REQUEST_KEY,
  TRACER_KEY,
} from '../constants';
import type { FastifyAwsPowertoolsLoggerOptions } from './logger.type';
import type { FastifyAwsPowertoolsMetricsOptions } from './metrics.type';
import type { FastifyAwsPowertoolsTracerOptions } from './tracer.type';
export type * from './logger.type';
export type * from './metrics.type';
export type * from './tracer.type';

declare module 'fastify' {
  interface FastifyInstance {
    logger: Logger;
    metrics: Metrics;
    tracer: Tracer;
  }

  interface FastifyRequest {
    logger: Logger;
    metrics: Metrics;
    tracer: Tracer;
    [POWERTOOLS_REQUEST_KEY]: {
      [LOGGER_KEY]: VoidFunction;
      [METRICS_KEY]: VoidFunction;
      [TRACER_KEY]: VoidFunction;
    };
  }
}

export type FastifyAwsPowertoolsOptions = FastifyAwsPowertoolsLoggerOptions &
  FastifyAwsPowertoolsMetricsOptions &
  FastifyAwsPowertoolsTracerOptions;

export type RequestWithAwsLambda<
  TEvent = unknown,
  TContext = Context,
> = FastifyRequest & {
  awsLambda: {
    event: TEvent;
    context: TContext;
  };
};
