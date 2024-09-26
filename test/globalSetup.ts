import { afterEach, beforeEach, vi } from 'vitest';

beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(vi.fn());
  vi.spyOn(console, 'warn').mockImplementation(vi.fn());
  vi.spyOn(console, 'info').mockImplementation(vi.fn());
  vi.spyOn(console, 'debug').mockImplementation(vi.fn());
  vi.spyOn(console, 'log').mockImplementation(vi.fn());

  vi.mock('node:console', () => ({
    ...vi.importActual('node:console'),
    Console: vi.fn().mockImplementation(() => ({
      log: vi.fn(),
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    })),
  }));

  vi.stubEnv(
    '_X_AMZN_TRACE_ID',
    'Root=1-5759e988-bd862e3fe1be46a994272793;Parent=557abcec3ee5a047;Sampled=1',
  );
  vi.stubEnv('_HANDLER', 'index.handler');
  vi.stubEnv('AWS_EXECUTION_ENV', 'AWS_Lambda_nodejs20.x');
  vi.stubEnv('AWS_LAMBDA_FUNCTION_MEMORY_SIZE', '128');
  vi.stubEnv('AWS_LAMBDA_FUNCTION_NAME', 'my-lambda-function');
  vi.stubEnv('AWS_LAMBDA_FUNCTION_VERSION', '$LATEST');
  vi.stubEnv('POWERTOOLS_METRICS_NAMESPACE', 'hello-world');
  vi.stubEnv('POWERTOOLS_SERVICE_NAME', 'hello-world');
});

afterEach(() => {
  vi.resetModules();
  vi.restoreAllMocks();
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
});
