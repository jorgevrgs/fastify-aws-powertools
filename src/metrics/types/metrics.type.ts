import type { Metrics } from '@aws-lambda-powertools/metrics';
import type {
  ExtraOptions,
  MetricsOptions,
} from '@aws-lambda-powertools/metrics/lib/cjs/types/Metrics';

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
  metricsOptions?: ExtraOptions
} & (
  | {
      metrics: Metrics;
    }
  | {
      metricsInstanceOptions?: MetricsOptions;
    }
);
