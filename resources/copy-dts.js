const Path = require('path')
const $    = require('shelljs')

for (const name of ['index', 'polyfill']) {
    const dts = `./dist/types/${name}.d.ts`

    for (const js of $.ls(`./dist/${name}*.js`)) {
        const basename = Path.basename(js, '.js')
        $.cp(dts, `dist/${basename}.d.ts`)
    }
}
