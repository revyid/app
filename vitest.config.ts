import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['**/e2e/**', '**/node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'api/**'],
    },
  },
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
});
