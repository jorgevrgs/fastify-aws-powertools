// @ts-check

const fastify = require('fastify');
const fastifyPowertools = require('fastify-aws-powertools');
const fastifyAwsLambda = require('@fastify/aws-lambda');

const app = fastify();
app.register(fastifyPowertools);

app.get('/', async (request, reply) => {
  const segment = request.tracer.getSegment(); // This is the facade segment (the one that is created by AWS Lambda)
  let subsegment;
  if (segment) {
    // Create subsegment for the function & set it as active
    subsegment = segment.addNewSubsegment(`## ${process.env._HANDLER}`);
    request.tracer.setSegment(subsegment);
  }

  request.logger.info('Hello from Fastify!');
  request.metrics.addMetric('custom-metric', 'Count', 1);

  try {
    // Add the response as metadata
    request.tracer.addResponseAsMetadata({}, process.env._HANDLER);
  } catch (err) {
    // Add the error as metadata
    request.tracer.addErrorAsMetadata(err);
    throw err;
  } finally {
    if (segment && subsegment) {
      // Close subsegment (the AWS Lambda one is closed automatically)
      subsegment.close();
      // Set back the facade segment as active again
      request.tracer.setSegment(segment);
    }
  }
});

const proxy = fastifyAwsLambda(app);

exports.handler = async (event, context) => {
  return proxy(event, context);
};
