import type { Tracer } from '@aws-lambda-powertools/tracer';
import type { CaptureLambdaHandlerOptions as TracerServiceOptions } from '@aws-lambda-powertools/tracer/lib/cjs/types/Tracer';

export type FastifyAwsPowertoolsTracerOptions = {
  tracerOptions?: TracerServiceOptions;
  tracer?: Tracer;
};
