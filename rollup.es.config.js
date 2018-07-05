import sourcemaps from 'rollup-plugin-sourcemaps';

export default {
  output: {
    format: 'es',
    sourcemap: true
  },
  plugins: [
    sourcemaps()
  ],
  onwarn: () => { return }
}
