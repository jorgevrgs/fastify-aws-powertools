import awsLambdaFastify from '@fastify/aws-lambda';
import type { APIGatewayProxyEventV2, Context } from 'aws-lambda';
import server from './server';

const proxy = awsLambdaFastify(server);

export const handler = async (event: APIGatewayProxyEventV2, context: Context) =>
  proxy(event, context);
