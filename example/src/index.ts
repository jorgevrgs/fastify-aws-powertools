import awsLambdaFastify from '@fastify/aws-lambda';
import server from './server';

const proxy = awsLambdaFastify(server);

export const handler = async (event: any, context: any) =>
  proxy(event, context);
