import Fastify, { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { beforeEach, describe, expect, it } from 'vitest'
import fastifyAwsPowertool from '../../src'

describe('fastifyAwsPowertool metrics integration', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = Fastify()
    app.register(fp(fastifyAwsPowertool))
    await app.ready()
  })

  it('should be a function', () => {
    expect(fastifyAwsPowertool).toBeInstanceOf(Function)
  })
})
