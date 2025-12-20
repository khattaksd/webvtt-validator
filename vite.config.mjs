import { defineConfig } from 'vite';

export default defineConfig({
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
