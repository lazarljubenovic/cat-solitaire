import typescript from 'rollup-plugin-typescript2'
import node from 'rollup-plugin-node-resolve'
import {terser} from 'rollup-plugin-terser'
import copy from 'rollup-plugin-copy'
import bundleSize from 'rollup-plugin-bundle-size'
import cjs from 'rollup-plugin-commonjs'

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/index.js',
    format: 'iife',
  },
  plugins: [
    node(),
    cjs(),
    typescript({
      typescript: require('typescript'),
      objectHashIgnoreUnknownHack: true,
    }),
    ...(
      process.env.NODE_ENV === 'prod'
        ? [
          terser({
            output: {
              ecma: 8,
            },
            compress: {},
            mangle: {
              module: true,
              toplevel: true,
              properties: true,
            },
            module: true,
            toplevel: true,
          })
        ]
        : []
    ),
    copy({
      targets: [
        'src/index.html',
      ],
      outputFolder: 'dist',
    }),
    bundleSize(),
  ],
}
