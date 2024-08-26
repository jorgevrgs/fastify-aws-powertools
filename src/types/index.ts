import type { Logger } from '@aws-lambda-powertools/logger';
import type { LogAttributes } from '@aws-lambda-powertools/logger/lib/cjs/types/Log';
import type { InjectLambdaContextOptions as LoggerServiceOptions } from '@aws-lambda-powertools/logger/lib/cjs/types/Logger';
import type { Metrics } from '@aws-lambda-powertools/metrics';
import type { ExtraOptions as MetricsServiceOptions } from '@aws-lambda-powertools/metrics/lib/cjs/types/Metrics';
import type { Tracer } from '@aws-lambda-powertools/tracer';
import type { CaptureLambdaHandlerOptions as TracerServiceOptions } from '@aws-lambda-powertools/tracer/lib/cjs/types/Tracer';
import type { Context } from 'aws-lambda';
import type { FastifyRequest } from 'fastify';
import type { FastifyAwsPowertoolsLoggerOptions } from './logger.type';
import type { FastifyAwsPowertoolsMetricsOptions } from './metrics.type';
import type { FastifyAwsPowertoolsTracerOptions } from './tracer.type';
export type * from './logger.type';
export type * from './metrics.type';
export type * from './tracer.type';

export type {
  LogAttributes,
  LoggerServiceOptions,
  MetricsServiceOptions,
  TracerServiceOptions,
};

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
