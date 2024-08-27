import type { Logger } from '@aws-lambda-powertools/logger';
import type {
  ConstructorOptions,
  InjectLambdaContextOptions,
} from '@aws-lambda-powertools/logger/lib/cjs/types/Logger';

export type FastifyAwsPowertoolsLoggerOptions = {
  loggerServiceOptions?: InjectLambdaContextOptions;
  loggerInstanceOptions?: ConstructorOptions;
  logger?: Logger;
};
