import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.(spec|test).ts'],
    exclude: [
      'test/**/fixtures/**/*',
      'test/**/helpers/**/*',
      'test/**/mocks/**/*',
      'test/**/stubs/**/*',
      'test/**/utils/**/*',
      '**/node_modules/**/*',
      '**/*.e2e-(test|spec).ts',
    ],
    coverage: {
      reporter: ['html-spa'],
    },
    setupFiles: 'test/globalSetup.ts',
  },
});
