import { expect } from 'chai'
import Fastify, { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import fastifyAwsPowertool from '../../src'

describe('fastifyAwsPowertool', () => {
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