import type { Logger } from '@aws-lambda-powertools/logger';
import type { Metrics } from '@aws-lambda-powertools/metrics';
import type { Tracer } from '@aws-lambda-powertools/tracer';
import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

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
      event: APIGatewayProxyEvent;
      context: Context;
    };
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

export interface fastifyAwsPowertoolsOptions {
  loggerOptions?: LoggerServiceOptions;
  metricsOptions?: MetricsServiceOptions;
  tracerOptions?: TracerServiceOptions;
  logger?: Logger;
  metrics?: Metrics;
  tracer?: Tracer;
}
