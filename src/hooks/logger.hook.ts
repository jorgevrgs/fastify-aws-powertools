import { Logger } from '@aws-lambda-powertools/logger'
import type { FastifyPluginAsync } from 'fastify'
import { loggerService } from '../services'
import type { FastifyAwsPowertoolsOptions } from '../types'

export const loggerHook: FastifyPluginAsync<
  FastifyAwsPowertoolsOptions
> = async (fastify, opts) => {
  let logger = opts.logger as Logger

  if (typeof logger === 'undefined') {
    logger = new Logger()
  }

  const loggerHooks = loggerService(logger, opts.loggerOptions)

  fastify
    .addHook('onRequest', async (request) => {
      if (!request.logger) {
        request.logger = logger
      }
    })
    .addHook('onRequest', loggerHooks.onRequest)
    .addHook('onResponse', loggerHooks.onResponse)
    .addHook('onError', loggerHooks.onError)
}
