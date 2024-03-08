import type { Logger } from '@aws-lambda-powertools/logger';
import type { HandlerOptions as LoggerServiceOptions } from '@aws-lambda-powertools/logger/lib/types';
import type { Metrics } from '@aws-lambda-powertools/metrics';
import type { ExtraOptions as MetricsServiceOptions } from '@aws-lambda-powertools/metrics/lib/types';
import type { Tracer } from '@aws-lambda-powertools/tracer';
import type { CaptureLambdaHandlerOptions as TracerServiceOptions } from '@aws-lambda-powertools/tracer/lib/types';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  Context,
} from 'aws-lambda';

export interface AwsLambdaInterface<
  TEvent = APIGatewayProxyEvent | APIGatewayProxyEventV2,
> {
  event: TEvent;
  context: Context;
}

declare module 'fastify' {
  interface FastifyInstance {
    awsLambda: AwsLambdaInterface;
    logger: Logger | Logger[];
    metrics: Metrics | Metrics[];
    tracer: Tracer;
  }

  interface FastifyRequest {
    awsLambda: AwsLambdaInterface;
    logger: Logger;
    metrics: Metrics;
    tracer: Tracer;
  }
}

export type FastifyAwsPowertoolsLoggerOptions = {
  loggerOptions?: LoggerServiceOptions;
  logger?: Logger | Logger[];
};

export type FastifyAwsPowertoolsMetricsOptions = {
  metricsOptions?: MetricsServiceOptions;
  metrics?: Metrics | Metrics[];
};

export type FastifyAwsPowertoolsTracerOptions = {
  tracerOptions?: TracerServiceOptions;
  tracer?: Tracer;
};

export type FastifyAwsPowertoolsOptions = FastifyAwsPowertoolsLoggerOptions &
  FastifyAwsPowertoolsMetricsOptions &
  FastifyAwsPowertoolsTracerOptions;
