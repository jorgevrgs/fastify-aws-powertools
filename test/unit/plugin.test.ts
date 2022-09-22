import Fastify, { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import { beforeEach, describe, expect, it } from 'vitest'
import fastifyAwsPowertool from '../../src'

describe('fastifyAwsPowertool unit', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = Fastify()
  })

  it('should be a function', () => {
    expect(fastifyAwsPowertool).to.be.instanceOf(Function)
  })

  it('should register the plugin', async () => {
    app.register(fp(fastifyAwsPowertool))

    await app.ready()

    expect(app.hasDecorator('logger')).to.be.true
    expect(app.hasDecorator('metrics')).to.be.true
    expect(app.hasDecorator('tracer')).to.be.true

    expect(app.hasRequestDecorator('logger')).to.be.true
    expect(app.hasRequestDecorator('metrics')).to.be.true
    expect(app.hasRequestDecorator('tracer')).to.be.true
  })
})
