const test = require('ava')
const Fs   = require('fs')

function foo () { return 'Foo' }
function bar () { return 'Bar' }

test.beforeEach(t => {
    module = exports = require = undefined

    t.is(module, undefined)
    t.is(exports, undefined)
    t.is(require, undefined)

    const src = Fs.readFileSync('./index.js', 'utf8')

    eval(src)
})

test.afterEach(t => {
    t.truthy(module.exports, 'module.exports is defined')
    t.truthy(exports, 'exports is defined')
    t.is(module.exports, exports, 'module.exports === exports')
    t.deepEqual(module.exports, exports, 'module.exports matches exports')
})

test('single export', t => {
    module.exports.foo = foo
    t.deepEqual(module.exports, { foo })
})

test('multiple named exports, different names', t => {
    module.exports.foo = foo
    module.exports.bar = bar
    t.deepEqual(module.exports, { foo, bar })
})

test('multiple named exports, same name', t => {
    module.exports.foo = foo
    module.exports.foo = bar
    t.deepEqual(module.exports, { foo: foo, foo_1: bar })
})

test('multiple default exports (anonymous functions)', t => {
    // it's quite hard to get a reference to an anonymous function in ES6
    const anon = [() => {}]
    module.exports = anon[0]
    module.exports = anon[0]
    t.deepEqual(module.exports, { default: anon[0], default_1: anon[0] })
})

test('multiple default exports (non-functions)', t => {
    const anon = { foo: 42 }
    module.exports = anon
    module.exports = anon
    t.deepEqual(module.exports, { default: anon, default_1: anon })
})

test('multiple default exports (named functions)', t => {
    module.exports = foo
    module.exports = bar
    t.deepEqual(module.exports, { foo, bar })
})

test('mixed exports', t => {
    const anon = [() => {}]

    module.exports.foo = foo
    module.exports.foo = bar

    module.exports.bar = foo
    module.exports.bar = bar

    module.exports = foo
    module.exports = bar

    module.exports = anon[0]
    module.exports = anon[0]

    t.deepEqual(module.exports, {
        foo: foo,
        foo_1: bar,
        bar: foo,
        bar_1: bar,
        foo_2: foo,
        bar_2: bar,
        default: anon[0],
        default_1: anon[0],
    })
})

test('require is defined', t => {
    t.is(typeof require, 'function')
    t.is(require.name, 'require')
})

test('require is not implemented', t => {
    t.throws(() => require('fs'), { message: /not implemented/ })
})
