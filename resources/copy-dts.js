const Path = require('path')
const $    = require('shelljs')

// copy ./dist/types/{index,polyfill}.d.ts to ./dist for each format of the
// corresponding target, e.g.
//
//   source:     ./src/polyfill.ts
//   source-dts: ./dist/types/polyfill.d.ts
//   target:     ./dist/polyfill.iife.min.js
//   target-dts: ./dist/polyfill.iife.min.d.ts
//
// the ./dist/types directory is removed after its declarations have been copied

Object.assign($.config, { verbose: true, fatal: true })

for (const ts of $.ls('./src/*.ts')) {
    const name = Path.basename(ts, '.ts')
    const dts = `./dist/types/${name}.d.ts`

    for (const js of $.ls(`./dist/${name}*.js`)) {
        const basename = Path.basename(js, '.js')
        $.cp(dts, `dist/${basename}.d.ts`)
    }
}
