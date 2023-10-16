import type { Logger } from '@aws-lambda-powertools/logger';
import type { HandlerOptions as LoggerServiceOptions } from '@aws-lambda-powertools/logger/lib/types';
import type { Metrics } from '@aws-lambda-powertools/metrics';
import { ExtraOptions as MetricsServiceOptions } from '@aws-lambda-powertools/metrics/lib/types';
import type { Tracer } from '@aws-lambda-powertools/tracer';
import type { HandlerOptions as TracerServiceOptions } from '@aws-lambda-powertools/tracer/lib/types';
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
  interface FastifyRequest {
    awsLambda: AwsLambdaInterface;
    logger?: Logger;
    metrics?: Metrics;
    tracer?: Tracer;
  }
}

export interface FastifyAwsPowertoolsOptions {
  loggerOptions?: LoggerServiceOptions;
  metricsOptions?: MetricsServiceOptions;
  tracerOptions?: TracerServiceOptions;
  logger?: Logger | Logger[];
  metrics?: Metrics | Metrics[];
  tracer?: Tracer;
}

export { LoggerServiceOptions, MetricsServiceOptions, TracerServiceOptions };
