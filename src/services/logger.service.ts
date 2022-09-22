import { Logger } from '@aws-lambda-powertools/logger'
import type {
  onErrorAsyncHookHandler,
  onRequestAsyncHookHandler,
  onResponseAsyncHookHandler
} from 'fastify'
import type { LogAttributes, LoggerServiceOptions } from '../types'

export function loggerService(
  target: Logger | Logger[],
  options?: LoggerServiceOptions
) {
  const loggers = target instanceof Array ? target : [target]
  const persistentAttributes: LogAttributes[] = []

  const onRequestHook: onRequestAsyncHookHandler = async (request) => {
    loggers.forEach((logger: Logger) => {
      if (options?.clearState === true) {
        persistentAttributes.push({ ...logger.getPersistentLogAttributes() })
      }

      Logger.injectLambdaContextBefore(
        logger,
        request.awsLambda.event,
        request.awsLambda.context,
        options
      )
    })
  }

  const onResponseHook: onResponseAsyncHookHandler = async () => {
    if (options && options.clearState === true) {
      loggers.forEach((logger: Logger, index: number) => {
        Logger.injectLambdaContextAfterOrOnError(
          logger,
          persistentAttributes[index],
          options
        )
      })
    }
  }

  const onErrorHook: onErrorAsyncHookHandler = async () => {
    if (options && options.clearState === true) {
      loggers.forEach((logger: Logger, index: number) => {
        Logger.injectLambdaContextAfterOrOnError(
          logger,
          persistentAttributes[index],
          options
        )
      })
    }
  }

  return {
    onRequest: onRequestHook,
    onResponse: onResponseHook,
    onError: onErrorHook
  }
}
