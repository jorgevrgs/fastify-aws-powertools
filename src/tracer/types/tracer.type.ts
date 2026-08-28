import type { Tracer } from '@aws-lambda-powertools/tracer';
import type {
    CaptureLambdaHandlerOptions,
    TracerOptions,
} from '@aws-lambda-powertools/tracer/types';

export type FastifyAwsPowertoolsTracerOptions = {
  tracerOptions?: CaptureLambdaHandlerOptions;
} & (
  | {
      tracer: Tracer;
    }
  | {
      tracerInstanceOptions?: TracerOptions;
    }
);
