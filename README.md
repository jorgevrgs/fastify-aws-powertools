# fastify-aws-powertools

[![NPM Version](https://img.shields.io/npm/v/fastify-aws-powertools.svg)](https://npmjs.org/package/fastify-aws-powertools) [![CI](https://github.com/jorgevrgs/fastify-aws-powertools/actions/workflows/tests.yml/badge.svg?branch=main)](https://github.com/jorgevrgs/fastify-aws-powertools/actions/workflows/tests.yml)

## Introduction

Implementation of a Fastify plugin of [AWS Lambda Powertools for Typescript](https://awslabs.github.io/aws-lambda-powertools-typescript/latest/) to take advantage of Logger, Metrics, and Tracer services for [AWS Lambda](https://aws.amazon.com/lambda/). Inspired by Middy middleware created by AWS Lambda Powertools team.

## Getting Started

Install the dependency:

```sh
npm i fastify-aws-powertools
```

Add peer dependencies (if there are not installed yet):

```sh
npm i fastify @fastify/aws-lambda
```

Configure the plugin:

```typescript
import fastifyAwsPowertool from 'fastify-aws-powertools';
import type { FastifyAwsPowertoolsOptions } from 'fastify-aws-powertools';
import type { FastifyASyncPlugin } from 'fastify';

export const plugin: FastifyASyncPlugin = async (fastify) => {
  const options: FastifyAwsPowertoolsOptions = {
    loggerOptions: {
      logEvent: true,
      clearState: true,
    },
    metricsOptions: {
      captureColdStartMetric: true,
    },
    tracerOptions: {
      captureResponse: true,
    },
  };
  fastify.register(fastifyAwsPowertool, options);
};
```

Also, available each plugin separately:

```typescript
import { fastifyAwsPowertoolsLogger } from 'fastify-aws-powertools';
import type { FastifyAwsPowertoolsOptions } from 'fastify-aws-powertools';
import type { FastifyASyncPlugin } from 'fastify';

export const plugin: FastifyASyncPlugin = async (fastify) => {
  const options: FastifyAwsPowertoolsOptions = {
    loggerOptions: {
      logEvent: true,
      clearState: true,
    }
  };
  fastify.register(fastifyAwsPowertoolsLogger, options);
};
```

### Options

| Property              | Description                                                                                                             | Default     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------- |
| logger                | Logger instance                                                                                                         | `undefined` |
| metrics               | Metrics instance                                                                                                        | `undefined` |
| tracer                | Tracer instance                                                                                                         | `undefined` |
| loggerOptions  | `{logEvent?: boolean; resetKeys?: boolean;}`                                                                           | `undefined` |
| metricsOptions | `{throwOnEmptyMetrics?: boolean; defaultDimensions?: Record<[key: string]: string>; captureColdStartMetric?: boolean;}` | `undefined` |
| tracerOptions  | `{captureResponse?: boolean;}`                                                                                          | `undefined` |

Logger, Metrics, and Tracer instances will be provided automatically if no options are provided.

### Dependencies

Install and configure `@fastify/aws-lambda` to use this plugin. See [@fastify/aws-lambda](https://github.com/fastify/aws-lambda-fastify).

## Example

```typescript
// index.ts
import fastify from 'fastify';
import awsLambdaFastify from '@fastify/aws-lambda';
import { MetricUnits } from '@aws-lambda-powertools/metrics';
import fastifyAwsPowertool, {
  FastifyAwsPowertoolsOptions,
} from 'fastify-aws-powertools';

const server = fastify({
  logger: false,
});

server.register(fastifyAwsPowertool);

server.get('/', async (request, reply) => {
  request.tracer.putAnnotation('successfulBooking', true);
  request.logger.info('This is a log with an extra variable', {
    foo: 'bar',
  });
  request.metrics.addMetric('successfulBooking', MetricUnits.Count, 1);
  request.metrics.addMetadata(
    'bookingId',
    '7051cd10-6283-11ec-90d6-0242ac120003',
  );
  request.metrics.publishStoredMetrics();

  return 'Hello world!';
});

const proxy = awsLambdaFastify(server);

export const handler = async (event: any, context: any) =>
  proxy(event, context);
```
