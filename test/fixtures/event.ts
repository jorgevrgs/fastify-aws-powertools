import type { APIGatewayProxyEventV2 } from 'aws-lambda';

export const dummyEvent: APIGatewayProxyEventV2 = {
  version: '2',
  routeKey: '/',
  rawPath: '',
  rawQueryString: '',
  headers: {},
  requestContext: {
    accountId: '',
    apiId: '',
    domainName: '',
    domainPrefix: '',
    http: {
      method: 'GET',
      path: '/',
      protocol: '',
      sourceIp: '',
      userAgent: '',
    },
    requestId: 'string',
    routeKey: 'string',
    stage: 'string',
    time: 'string',
    timeEpoch: 0,
  },
  isBase64Encoded: false,
};
