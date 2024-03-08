import type { Logger } from '@aws-lambda-powertools/logger';
import type { Metrics } from '@aws-lambda-powertools/metrics';
import type { Tracer } from '@aws-lambda-powertools/tracer';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyEventV2,
  Context,
} from 'aws-lambda';

/** Requires @fastify/aws-lambda
 * @example
 * const const awsLambdaFastify = require('@fastify/aws-lambda')
 * const app = require('./app')
 * const proxy = awsLambdaFastify(app, {
 *  decorateRequest: true,              // default
 *  decorationPropertyName: 'awsLambda' // default
 * })
 * @see https://github.com/fastify/aws-lambda-fastify
 */
declare module 'fastify' {
  interface FastifyRequest {
    awsLambda: {
      event: APIGatewayProxyEvent | APIGatewayProxyEventV2;
      context: Context;
    };
    logger?: Logger;
    metrics?: Metrics;
    tracer?: Tracer;
  }
}

export interface LoggerServiceOptions {
  logEvent?: boolean;
  clearState?: boolean;
}

export type LogAttributeValue = unknown;
export type LogAttributes = { [key: string]: LogAttributeValue };
export type Dimensions = { [key: string]: string };

export interface MetricsServiceOptions {
  throwOnEmptyMetrics?: boolean;
  defaultDimensions?: Dimensions;
  captureColdStartMetric?: boolean;
}

export interface TracerServiceOptions {
  captureResponse?: boolean;
}

export interface FastifyAwsPowertoolsOptions {
  loggerOptions?: LoggerServiceOptions;
  metricsOptions?: MetricsServiceOptions;
  tracerOptions?: TracerServiceOptions;
  logger?: Logger | Logger[];
  metrics?: Metrics | Metrics[];
  tracer?: Tracer;
}
