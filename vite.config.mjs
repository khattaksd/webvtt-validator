import { defineConfig } from 'vite';
import { bundleSizeGuard } from './scripts/vite-plugin-bundle-size-guard.mjs';

export default defineConfig({
  plugins: [
    bundleSizeGuard({
      checks: [
        { id: 'INDEX_MJS', file: 'index.mjs', rawLimit: 25_000, gzipLimit: 8_000 },
        { id: 'INDEX_JS', file: 'index.js', rawLimit: 16_000, gzipLimit: 6_500 },
      ],
    }),
  ],
  build: {
    lib: {
      entry: 'src/index.js',
      name: 'WebVTTParser',
      fileName: 'index',
      formats: ['es', 'cjs']
    },
    sourcemap: true,
    minify: 'esbuild',
    emptyOutDir: true
  }
});
