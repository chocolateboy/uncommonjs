import size       from 'rollup-plugin-filesize'
import { terser } from 'rollup-plugin-terser'
import ts         from '@wessberg/rollup-plugin-ts'

const $size = size({ showMinifiedSize: false })
const $ts = ts({ transpiler: 'babel' })

const $terser = terser({
    ecma: 2015,
    compress: {
        passes: 2,
        reduce_vars: false,
        keep_fnames: true,
    },
    mangle: {
        reserved: ['require'],
    }
})

export default [
    {
        input: 'src/index.ts',
        plugins: [$ts],
        output: [
            {
                file: 'dist/index.js',
                format: 'cjs',
            },
            {
                file: 'dist/index.esm.js',
                format: 'esm',
            },
            {
                file: 'dist/index.umd.js',
                format: 'umd',
                name: 'UnCommonJS',
            },
            {
                file: 'dist/index.umd.min.js',
                format: 'umd',
                name: 'UnCommonJS',
                plugins: [$size, $terser],
            },
        ]
    },

    {
        input: 'src/polyfill.ts',
        plugins: [$ts],
        output: [
            {
                file: 'dist/polyfill.esm.js',
                format: 'esm',
            },
            {
                file: 'dist/polyfill.iife.js',
                format: 'iife',
                strict: false,
            },
            {
                file: 'dist/polyfill.iife.min.js',
                format: 'iife',
                strict: false,
                plugins: [$size, $terser],
            },
        ]
    },
]
