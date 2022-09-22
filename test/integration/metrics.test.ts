import { expect } from 'chai'
import Fastify, { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import Sinon from 'sinon'
import { afterEach, beforeEach, describe, it } from 'vitest'
import fastifyAwsPowertool from '../../src'

describe('fastifyAwsPowertool metrics integration', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = Fastify()
    app.register(fp(fastifyAwsPowertool))
    await app.ready()
  })

  afterEach(function () {
    Sinon.restore()
  })

  it('should be a function', () => {
    expect(fastifyAwsPowertool).to.be.instanceOf(Function)
  })
})
