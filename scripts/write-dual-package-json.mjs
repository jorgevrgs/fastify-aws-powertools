import { mkdirSync, writeFileSync } from 'node:fs';

/**
 * @param {string} path
 * @param {Record<string, string>} value
 */
const writeJson = (path, value) => {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
};

mkdirSync('dist/cjs', { recursive: true });
mkdirSync('dist/esm', { recursive: true });

writeJson('dist/cjs/package.json', { type: 'commonjs' });
writeJson('dist/esm/package.json', { type: 'module' });
