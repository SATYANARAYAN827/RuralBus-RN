import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@ruralbus/database': path.resolve(__dirname, '../../packages/database/src/index.ts'),
      '@ruralbus/shared-types': path.resolve(__dirname, '../../packages/shared-types/src/index.ts'),
      '@ruralbus/shared-validators': path.resolve(__dirname, '../../packages/shared-validators/src/index.ts'),
    },
  },
});
