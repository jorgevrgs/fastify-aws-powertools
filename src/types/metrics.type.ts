import type { LogAttributes } from '@aws-lambda-powertools/logger/lib/cjs/types/Log';
import type { InjectLambdaContextOptions as LoggerServiceOptions } from '@aws-lambda-powertools/logger/lib/cjs/types/Logger';
import type { Metrics } from '@aws-lambda-powertools/metrics';
import type { ExtraOptions as MetricsServiceOptions } from '@aws-lambda-powertools/metrics/lib/cjs/types/Metrics';
import type { CaptureLambdaHandlerOptions as TracerServiceOptions } from '@aws-lambda-powertools/tracer/lib/cjs/types/Tracer';

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

export type FastifyAwsPowertoolsMetricsOptions = {
  metricsOptions?: MetricsServiceOptions;
  metrics?: Metrics;
};
