import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const DEFAULT_EXAMPLES = ['examples/cjs-full', 'examples/ejs-full'];

const event = {
  version: '2',
  routeKey: '/',
  rawPath: '/',
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
      protocol: 'HTTP/1.1',
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

const context = {
  callbackWaitsForEmptyEventLoop: true,
  functionVersion: '$LATEST',
  functionName: 'foo-bar-function',
  memoryLimitInMB: '128',
  logGroupName: '/aws/lambda/foo-bar-function-123456abcdef',
  logStreamName: '2021/03/09/[$LATEST]abcdef123456abcdef123456abcdef123456',
  invokedFunctionArn:
    'arn:aws:lambda:eu-west-1:123456789012:function:foo-bar-function',
  awsRequestId: 'c6af9ac6-7b61-11e6-9a41-93e812345678',
  getRemainingTimeInMillis: () => 1234,
  done() {},
  fail() {},
  succeed() {},
};

const loadHandler = async (dir) => {
  const pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'));
  const entry = join(dir, pkg.main);

  if (pkg.type === 'module') {
    const namespace = await import(pathToFileURL(entry).href);
    return namespace.handler;
  }

  return createRequire(import.meta.url)(entry).handler;
};

const runExample = async (relDir) => {
  const dir = join(root, relDir);
  const handler = await loadHandler(dir);
  assert.equal(typeof handler, 'function', `${relDir} must export handler`);

  const result = await handler(event, context);
  assert.equal(
    result.statusCode,
    200,
    `${relDir} expected 200, got ${JSON.stringify(result)}`,
  );

  const body = JSON.parse(result.body);
  assert.equal(body.ok, true, `${relDir} body: ${result.body}`);
  console.log(`${relDir} ok`);
};

process.env.POWERTOOLS_DEV ??= 'true';
process.env.POWERTOOLS_LOG_LEVEL ??= 'WARN';
process.env._HANDLER ??= 'index.handler';

const targets = process.argv.slice(2);
for (const target of targets.length > 0 ? targets : DEFAULT_EXAMPLES) {
  await runExample(target);
}
