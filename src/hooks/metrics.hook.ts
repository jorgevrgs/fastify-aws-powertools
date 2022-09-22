import { Metrics } from '@aws-lambda-powertools/metrics'
import type { FastifyPluginAsync } from 'fastify'
import { metricsService } from '../services'
import type { FastifyAwsPowertoolsOptions } from '../types'

export const metricsHook: FastifyPluginAsync<
  FastifyAwsPowertoolsOptions
> = async (fastify, opts) => {
  let metrics = opts.metrics as Metrics

  if (typeof metrics === 'undefined') {
    metrics = new Metrics()
  }

  const metricsHooks = metricsService(metrics, opts.metricsOptions)

  fastify
    .addHook('onRequest', async (request) => {
      if (!request.metrics) {
        request.metrics = metrics
      }
    })
    .addHook('onRequest', metricsHooks.onRequest)
    .addHook('onResponse', metricsHooks.onResponse)
    .addHook('onError', metricsHooks.onError)
}
