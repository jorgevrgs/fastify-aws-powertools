import type { Tracer } from '@aws-lambda-powertools/tracer';
import type {
  CaptureLambdaHandlerOptions,
  TracerOptions,
} from '@aws-lambda-powertools/tracer/lib/cjs/types/Tracer';

export type FastifyAwsPowertoolsTracerOptions = {
  tracerOptions?: CaptureLambdaHandlerOptions;
  tracerInstanceOptions?: TracerOptions;
  tracer?: Tracer;
};
