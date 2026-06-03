import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(rootDir, 'apps/web-pc/src'),
      '@volix/i18n': path.resolve(rootDir, 'packages/i18n/src'),
      '@volix/types': path.resolve(rootDir, 'packages/types/src'),
      '@volix/utils': path.resolve(rootDir, 'packages/utils/src'),
    },
  },
  test: {
    include: ['**/*.{test,spec}.ts'],
    exclude: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
  },
});
