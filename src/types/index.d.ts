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

export interface LoggerOptions {
  logEvent?: boolean;
  clearState?: boolean;
}

export type LogAttributeValue = unknown;
export type LogAttributes = { [key: string]: LogAttributeValue };
export type Dimensions = { [key: string]: string };

export interface MetricsOptions {
  throwOnEmptyMetrics?: boolean;
  defaultDimensions?: Dimensions;
  captureColdStartMetric?: boolean;
}

export interface TracerOptions {
  captureResponse?: boolean;
}

export interface fastifyAwsPowertoolsOptions {
  logger?: LoggerOptions;
  metrics?: MetricsOptions;
  tracer?: TracerOptions;
}
