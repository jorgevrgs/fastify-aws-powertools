import type { Logger } from '@aws-lambda-powertools/logger';
import type { LogAttributes } from '@aws-lambda-powertools/logger/lib/cjs/types/Log';
import type { InjectLambdaContextOptions as LoggerServiceOptions } from '@aws-lambda-powertools/logger/lib/cjs/types/Logger';
import type { Metrics } from '@aws-lambda-powertools/metrics';
import type { ExtraOptions as MetricsServiceOptions } from '@aws-lambda-powertools/metrics/lib/cjs/types/Metrics';
import type { Tracer } from '@aws-lambda-powertools/tracer';
import type { CaptureLambdaHandlerOptions as TracerServiceOptions } from '@aws-lambda-powertools/tracer/lib/cjs/types/Tracer';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  Context,
} from 'aws-lambda';

export type {
  LogAttributes,
  LoggerServiceOptions,
  MetricsServiceOptions,
  TracerServiceOptions,
};

export interface MetricRecord {
  Name: string;
  Unit: string;
}

export interface CloudWatchMetric {
  Namespace: string;
  Dimensions: Array<string[]>;
  Metrics: MetricRecord[];
}

export interface AwsDetails {
  Timestamp: number;
  CloudWatchMetrics: CloudWatchMetric[];
}

export interface MetricRecords {
  _aws: AwsDetails;
  service: string;
  function_name: string;
  ColdStart: number;
}

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
