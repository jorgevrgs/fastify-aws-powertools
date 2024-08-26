import type { Logger as PowertoolsLogger } from '@aws-lambda-powertools/logger';
import type { LogLevel } from '@aws-lambda-powertools/logger/lib/cjs/types/Log';
import type { FastifyBaseLogger } from 'fastify';
import type { Bindings, ChildLoggerOptions, LevelWithSilent } from 'pino';

/**
 * @see https://docs.powertools.aws.dev/lambda/typescript/latest/core/logger/#log-levels
 */
const powertoolsToFastifyLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  CRITICAL: 'fatal',
  SILENT: 'silent',
  // ???: 'trace'
} as const satisfies Record<Uppercase<LogLevel>, LevelWithSilent>;

const fastifyToPowertoolsLevel = Object.fromEntries<Uppercase<LogLevel>>(
  Object.entries<LevelWithSilent>(powertoolsToFastifyLevel).map(
    ([key, value]) => [value, key as Uppercase<LogLevel>],
  ),
);

export class Logger implements FastifyBaseLogger {
  level: string;

  constructor(private readonly logger: PowertoolsLogger) {
    const logLevelName = logger.getLevelName();

    this.level = powertoolsToFastifyLevel[logLevelName];
  }

  child(bindings: Bindings, options?: ChildLoggerOptions) {
    const { level: logLevel } = options ?? {};

    const logger = this.logger.createChild({
      logLevel: fastifyToPowertoolsLevel[logLevel ?? 'info'],
    });
    logger.appendPersistentKeys(bindings);

    return new Logger(logger);
  }

  fatal<T extends object>(obj: T, msg?: string, ...args: Array<unknown>) {
    this.logger.error(msg ?? '', { obj, ...args });
  }

  error<T extends object>(obj: T, msg?: string, ...args: Array<unknown>) {
    this.logger.error(msg ?? '', { obj, ...args });
  }

  warn<T extends object>(obj: T, msg?: string, ...args: Array<unknown>) {
    this.logger.warn(msg ?? '', { obj, ...args });
  }

  info<T extends object>(obj: T, msg?: string, ...args: Array<unknown>) {
    this.logger.info(msg ?? '', { obj, ...args });
  }

  debug<T extends object>(obj: T, msg?: string, ...args: Array<unknown>) {
    this.logger.debug(msg ?? '', { obj, ...args });
  }

  trace<T extends object>(obj: T, msg?: string, ...args: Array<unknown>) {
    this.logger.error(msg ?? '', { obj, ...args });
  }

  silent<T extends object>(_obj: T, _msg?: string, ..._args: Array<unknown>) {
    // Noop function
  }
}
