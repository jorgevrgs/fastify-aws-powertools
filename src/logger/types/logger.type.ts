import type { Logger } from '@aws-lambda-powertools/logger';
import type {
    ConstructorOptions,
    InjectLambdaContextOptions,
} from '@aws-lambda-powertools/logger/types';

export type FastifyAwsPowertoolsLoggerOptions = {
  loggerOptions?: InjectLambdaContextOptions;
} & (
  | {
      logger: Logger | Logger[];
    }
  | {
      loggerInstanceOptions?: ConstructorOptions;
    }
);
