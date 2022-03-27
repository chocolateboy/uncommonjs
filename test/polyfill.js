// basic sanity checks for the minified polyfill

const Fs   = require('fs')
const Path = require('path')
const test = require('ava')

const path = Path.join(__dirname, '../dist/polyfill.iife.min.js')
const polyfill = Fs.readFileSync(path, 'utf-8')

test.beforeEach(t => {
    exports = undefined
    module = undefined
    require = undefined

    delete globalThis.exports
    delete globalThis.module
    delete globalThis.require

    t.is(exports, undefined)
    t.is(globalThis.exports, undefined)

    t.is(module, undefined)
    t.is(globalThis.module, undefined)

    t.is(require, undefined)
    t.is(globalThis.require, undefined)

    // make sure this hasn't been tree shaken away by rollup
    t.assert(/\bglobalThis\b/.test(polyfill))

    // reassign the local variables passed into scripts by +require+
    eval(polyfill)

    // assign to globalThis
    Function(polyfill)()

    t.truthy(exports)
    t.is(typeof exports, 'object')

    t.truthy(module)
    t.is(typeof module, 'object')

    t.truthy(require)
    t.is(typeof require, 'function')
})

test('named assignment', t => {
    exports.foo = () => 'named-1'
    t.is(exports.foo(), 'named-1')
    t.is(module.exports.foo(), 'named-1')

    global.exports.foo = () => 'named-2'
    t.is(global.exports.foo(), 'named-2')
    t.is(global.module.exports.foo(), 'named-2')
})

test('default assignment', t => {
    module.exports = function bar () { return 'default-1' }
    t.is(exports.bar(), 'default-1')
    t.is(module.exports.bar(), 'default-1')

    global.module.exports = function bar () { return 'default-2' }
    t.is(global.exports.bar(), 'default-2')
    t.is(global.module.exports.bar(), 'default-2')
})

test('override require', t => {
    t.throws(() => require('baz'), { message: /not implemented/ })
    module.require = () => 'require-1'
    t.is(require('baz'), 'require-1')
    t.is(module.require('baz'), 'require-1')

    t.throws(() => global.require('baz'), { message: /not implemented/ })
    global.module.require = () => 'require-2'
    t.is(global.require('baz'), 'require-2')
    t.is(global.module.require('baz'), 'require-2')
})
