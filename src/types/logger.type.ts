import type { Logger } from '@aws-lambda-powertools/logger';
import type { InjectLambdaContextOptions as LoggerServiceOptions } from '@aws-lambda-powertools/logger/lib/cjs/types/Logger';

export type FastifyAwsPowertoolsLoggerOptions = {
  loggerOptions?: LoggerServiceOptions;
  logger?: Logger | Logger[];
};
