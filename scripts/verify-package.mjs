import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
process.chdir(root);

const REQUIRED_NAMED_EXPORTS = [
  'fastifyAwsPowertools',
  'fastifyAwsPowertoolsPlugin',
  'invokeCleanUpFunctions',
  'isAwsLambdaRequest',
  'fastifyAwsPowertoolsLoggerPlugin',
  'Logger',
  'fastifyAwsPowertoolsMetricsPlugin',
  'fastifyAwsPowertoolsTracerPlugin',
];

const walkJs = (dir) => {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkJs(path));
    } else if (extname(entry.name) === '.js') {
      files.push(path);
    }
  }
  return files;
};

const assertNoExtensionlessSpecifiers = () => {
  const specifier = /(?:from|import)\s+['"](\.[^'"]+)['"]/g;
  const offenders = [];

  for (const file of walkJs(join(root, 'dist/esm'))) {
    const source = readFileSync(file, 'utf8');
    for (const match of source.matchAll(specifier)) {
      const spec = match[1];
      if (!spec.endsWith('.js') && !spec.endsWith('.json')) {
        offenders.push(`${file}: ${spec}`);
      }
    }
  }

  if (offenders.length > 0) {
    throw new Error(
      `ESM dist still has extensionless relative specifiers:\n${offenders.join('\n')}`,
    );
  }
};

const assertNamedExports = (label, namespace) => {
  const missing = REQUIRED_NAMED_EXPORTS.filter((name) => namespace[name] == null);
  if (missing.length > 0) {
    throw new Error(`${label} missing named exports: ${missing.join(', ')}`);
  }
};

const assertTypescriptBundlerResolution = () => {
  const scratch = mkdtempSync(join(tmpdir(), 'fastify-aws-powertools-bundler-'));
  const packageDir = join(scratch, 'node_modules', 'fastify-aws-powertools');
  mkdirSync(dirname(packageDir), { recursive: true });
  symlinkSync(root, packageDir);

  const fastifyDir = join(root, 'node_modules', 'fastify');
  symlinkSync(fastifyDir, join(scratch, 'node_modules', 'fastify'));

  writeFileSync(
    join(scratch, 'consumer.ts'),
    `import type { FastifyRequest } from 'fastify';
import {
  fastifyAwsPowertoolsTracerPlugin,
} from 'fastify-aws-powertools';

declare const request: FastifyRequest;
const _plugin: typeof fastifyAwsPowertoolsTracerPlugin =
  fastifyAwsPowertoolsTracerPlugin;
void request.tracer;
void _plugin;
`,
  );
  writeFileSync(
    join(scratch, 'tsconfig.json'),
    `${JSON.stringify(
      {
        compilerOptions: {
          module: 'esnext',
          moduleResolution: 'bundler',
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          types: [],
        },
        files: ['consumer.ts'],
      },
      null,
      2,
    )}\n`,
  );

  const tsc = join(root, 'node_modules', 'typescript', 'bin', 'tsc');
  const result = spawnSync(process.execPath, [tsc, '-p', scratch], {
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    throw new Error(
      `TypeScript bundler resolution failed:\n${result.stdout}\n${result.stderr}`,
    );
  }
};

assertNoExtensionlessSpecifiers();

const esm = await import('fastify-aws-powertools');
assertNamedExports('ESM import', esm);

const cjs = createRequire(import.meta.url)('fastify-aws-powertools');
assertNamedExports('CJS require', cjs);

assertTypescriptBundlerResolution();

console.log(
  'package exports ok:',
  REQUIRED_NAMED_EXPORTS.join(', '),
);
