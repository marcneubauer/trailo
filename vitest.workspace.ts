import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'shared',
      root: './packages/shared',
      include: ['src/**/*.test.ts'],
    },
  },
  {
    test: {
      name: 'api',
      root: './packages/api',
      include: ['tests/**/*.test.ts'],
      setupFiles: ['tests/setup.ts'],
    },
  },
  {
    test: {
      name: 'web',
      root: './packages/web',
      include: ['tests/**/*.test.ts'],
      environment: 'jsdom',
    },
  },
]);
