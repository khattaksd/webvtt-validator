import { defineConfig } from 'vite';
import { bundleSizeGuard } from './scripts/vite-plugin-bundle-size-guard.mjs';

export default defineConfig({
  plugins: [
    bundleSizeGuard({
      checks: [
        { id: 'INDEX_MJS', file: 'index.mjs', rawLimit: 25_000, gzipLimit: 8_000 },
        { id: 'INDEX_CJS', file: 'index.cjs', rawLimit: 16_000, gzipLimit: 6_500 },
      ],
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'WebVTTParser',
      fileName: (format) => {
        if (format === 'es') return 'index.mjs';
        if (format === 'cjs') return 'index.cjs';
        return 'index';
      },
      formats: ['es', 'cjs']
    },
    sourcemap: true,
    minify: 'esbuild',
    emptyOutDir: true
  }
});
