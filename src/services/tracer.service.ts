import type { Tracer } from '@aws-lambda-powertools/tracer'
import type { Segment, Subsegment } from 'aws-xray-sdk-core'
import {
  onErrorAsyncHookHandler,
  onRequestAsyncHookHandler,
  onResponseAsyncHookHandler
} from 'fastify'
import type { TracerServiceOptions } from '../types'

export function tracerService(target: Tracer, options?: TracerServiceOptions) {
  let lambdaSegment: Subsegment | Segment

  const open = (): void => {
    lambdaSegment = target.getSegment()
    const handlerSegment = lambdaSegment.addNewSubsegment(
      `## ${process.env._HANDLER}`
    )
    target.setSegment(handlerSegment)
  }

  const close = (): void => {
    const subsegment = target.getSegment()
    subsegment.close()
    target.setSegment(lambdaSegment as Segment)
  }

  const onRequestHook: onRequestAsyncHookHandler = async () => {
    if (target.isTracingEnabled()) {
      open()
      target.annotateColdStart()
      target.addServiceNameAnnotation()
    }
  }

  const onResponseHook: onResponseAsyncHookHandler = async (request, reply) => {
    if (target.isTracingEnabled()) {
      if (options?.captureResponse ?? true) {
        target.addResponseAsMetadata(reply.raw, process.env._HANDLER)
      }

      close()
    }
  }

  const onErrorHook: onErrorAsyncHookHandler = async (error) => {
    if (target.isTracingEnabled()) {
      target.addErrorAsMetadata(error as unknown as Error)
      close()
    }
  }

  return {
    onRequest: onRequestHook,
    onResponse: onResponseHook,
    onError: onErrorHook
  }
}
