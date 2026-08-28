// @ts-check

const fastify = require('fastify');
const fastifyAwsLambda = require('@fastify/aws-lambda');
const {
  fastifyAwsPowertoolsPlugin,
} = require('fastify-aws-powertools');

const app = fastify();
app.register(fastifyAwsPowertoolsPlugin);

app.get('/', async (request, _reply) => {
  const segment = request.tracer.getSegment();
  let subsegment;
  if (segment) {
    subsegment = segment.addNewSubsegment(`## ${process.env._HANDLER}`);
    request.tracer.setSegment(subsegment);
  }

  request.logger.info('Hello from Fastify!');
  request.metrics.addMetric('custom-metric', 'Count', 1);

  try {
    request.tracer.addResponseAsMetadata({}, process.env._HANDLER);
  } catch (err) {
    request.tracer.addErrorAsMetadata(err);
    throw err;
  } finally {
    if (segment && subsegment) {
      subsegment.close();
      request.tracer.setSegment(segment);
    }
  }

  return { ok: true };
});

const proxy = fastifyAwsLambda(app);

exports.handler = async (event, context) => {
  return proxy(event, context);
};
