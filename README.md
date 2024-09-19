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

### Dependencies

Install and configure `@fastify/aws-lambda` to use this plugin. See [@fastify/aws-lambda](https://github.com/fastify/aws-lambda-fastify).

## Options

Logger, Metrics, and Tracer instances will be automatically provided if either `(logger|metrics|tracer)` or `(logger|metrics|tracer)InstanceOptions` are provided.

### Logger Plugin

| Property              | Description                                                                                                             | Default     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------- |
| logger                | Logger instance, otherwise provide loggerInstanceOptions | `undefined` |
| loggerOptions  | `{logEvent?: boolean; resetKeys?: boolean;}`                                                                           | `undefined` |
| loggerInstanceOptions  | See [ConstructorOptions](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/packages/logger/src/types/Logger.ts#L180) | `undefined` |

### Metrics Plugin

| Property              | Description                                                                                                             | Default     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------- |
| metrics               | Metrics instance, otherwise provide metricsInstanceOptions | `undefined` |
| metricsOptions | `{throwOnEmptyMetrics?: boolean; defaultDimensions?: Record<[key: string]: string>; captureColdStartMetric?: boolean;}` | `undefined` |
| metricsInstanceOptions | See [MetricsOptions](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/packages/metrics/src/types/Metrics.ts#L9) | `undefined` |

### Tracer Plugin

| Property              | Description                                                                                                             | Default     |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------- |
| tracer                | Tracer instance, otherwise provide tracerInstanceOptions | `undefined` |
| tracerOptions  | `{captureResponse?: boolean;}`                                                                                          | `undefined` |
| tracerInstanceOptions  | See [TracerOptions](https://github.com/aws-powertools/powertools-lambda-typescript/blob/main/packages/tracer/src/types/Tracer.ts#L22) | `undefined` |


### PowerTools Plugin

Use `fastifyAwsPowertoolsPlugin` if you want to use all the plugins.

## Example

Simple example using all the plugins:

```typescript
// index.ts
import fastify from 'fastify';
import awsLambdaFastify from '@fastify/aws-lambda';
import { MetricUnits } from '@aws-lambda-powertools/metrics';
import fastifyAwsPowertool, {
  type FastifyAwsPowertoolsOptions,
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

Additional examples can be found in the [examples](./examples) folder.

```typescript
const serviceName = 'my-service';

const logger = new Logger({
    serviceName,
  });

const metrics = new Metrics({
  serviceName,
  namespace: serviceName,
});

const tracer = new Tracer({
  serviceName,
  captureHTTPsRequests: true,
});

tracer.provider.setLogger(logger);

export const myPlugin: FastifyASyncPlugin = async (fastify) => {

  const options: FastifyAwsPowertoolsOptions = {
    logger,
    metrics,
    tracer,
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
  fastify.register(fastifyAwsPowertoolsPlugin, options);
};

const logger = new AwsPowerToolsLogger({
  serviceName
});

const app = Fastify({ logger });
```
