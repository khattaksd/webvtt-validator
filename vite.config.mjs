import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/webvtt-validator.js',
      name: 'WebVTTValidator',
      fileName: (format) => `webvtt-validator.${format}.js`,
      formats: ['es', 'umd']
    },
    sourcemap: true,
    minify: 'esbuild',
    emptyOutDir: true
  }
});
