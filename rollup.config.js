import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/webvtt-validator.js',
  output: [
    {
      file: 'dist/webvtt-validator.js',
      format: 'umd',
      name: 'WebVTTValidator',
      sourcemap: true
    },
    {
      file: 'dist/webvtt-validator.min.js',
      format: 'umd',
      name: 'WebVTTValidator',
      plugins: [terser()],
      sourcemap: true
    },
    {
      file: 'dist/webvtt-validator.esm.js',
      format: 'esm',
      sourcemap: true
    }
  ]
};
