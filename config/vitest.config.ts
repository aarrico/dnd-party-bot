import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    root: path.resolve(__dirname, '..'),
    include: ['src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '#app': path.resolve(__dirname, '../src'),
      '#commands': path.resolve(__dirname, '../src/commands'),
      '#events': path.resolve(__dirname, '../src/events'),
      '#modules': path.resolve(__dirname, '../src/modules'),
      '#scripts': path.resolve(__dirname, '../src/scripts'),
      '#services': path.resolve(__dirname, '../src/services'),
      '#shared': path.resolve(__dirname, '../src/shared'),
      '#generated': path.resolve(__dirname, '../src/generated'),
    },
  },
});
