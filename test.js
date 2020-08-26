"use strict"; // trigger the Proxy#set check

const test = require('ava')
const Fs   = require('fs')

function foo () { return 'Foo' }
function bar () { return 'Bar' }
function baz () { return 'Baz' }

test.beforeEach(t => {
    module = exports = require = undefined

    t.is(module, undefined)
    t.is(exports, undefined)
    t.is(require, undefined)

    const src = Fs.readFileSync('./index.min.js', 'utf8')

    eval(src)
})

test.afterEach(t => {
    t.truthy(module.exports, 'module.exports is defined')
    t.truthy(exports, 'exports is defined')
    t.is(module.exports, exports, 'module.exports === exports')
    t.deepEqual(module.exports, exports, 'module.exports matches exports')
})

test('single explicitly named export', t => {
    module.exports.foo = foo
    t.deepEqual(module.exports, { foo })
})

test('single implicitly named export', t => {
    module.exports = foo
    t.deepEqual(module.exports, { foo })
})

test('single anonymous export', t => {
    module.exports = 42
    t.deepEqual(module.exports, { default: 42 })
})

test('duplicate named exports', t => {
    module.exports.foo = foo
    module.exports.foo = foo
    module.exports = bar
    module.exports = bar
    module.exports.baz = baz
    module.exports = baz

    t.deepEqual(module.exports, { foo, bar, baz })
})

test('duplicate anonymous exports', t => {
    module.exports.foo = 42
    module.exports.foo = 42
    module.exports = 'quux'
    module.exports = 'quux'

    t.deepEqual(module.exports, { foo: 42, default: 'quux' })
})

test('multiple named exports (different names)', t => {
    module.exports.foo = foo
    module.exports.bar = bar

    t.deepEqual(module.exports, { foo, bar })
})

test('multiple named exports (same name, different values)', t => {
    module.exports.foo = foo
    module.exports.foo = bar

    t.deepEqual(module.exports, { foo: foo, foo_1: bar })
})

test('multiple default exports (anonymous functions)', t => {
    // it's quite hard to refer to an anonymous function in ES6 without
    // accidentally assigning it a name
    const anon = [() => {}, () => {}]

    module.exports = anon[0]
    module.exports = anon[1]

    t.deepEqual(module.exports, { default: anon[0], default_1: anon[1] })
})

test('multiple default exports (non-functions)', t => {
    module.exports = 'foo'
    module.exports = 42

    t.deepEqual(module.exports, { default: 'foo', default_1: 42 })
})

test('multiple default exports (named functions)', t => {
    module.exports = foo
    module.exports = bar

    t.deepEqual(module.exports, { foo, bar })
})

test('multiple default exports (named properties)', t => {
    const props1 = { foo, bar }
    const props2 = { foo, bar }

    module.exports = props1
    module.exports = props2

    t.deepEqual(module.exports, {
        foo,
        bar,
        default: props1,
        default_1: props2,
    })
})

test('assign to generated names', t => {
    function bar_1 () {}

    module.exports.foo = 1        // foo
    module.exports.foo = 2        // foo_1
    module.exports.foo_1 = 3      // foo_1_1
    module.exports.foo_1_1 = 4    // foo_1_1_1
    module.exports.foo_1_1 = 5    // foo_1_1_2
    module.exports.foo_1_1 = 6    // foo_1_1_3
    module.exports = 7            // default
    module.exports = 8            // default_1
    module.exports.default_1 = 9  // default_1_1
    module.exports.default_1 = 10 // default_1_2
    module.exports.bar = 11       // bar
    module.exports = bar          // bar_1
    module.exports = bar_1        // bar_1_1

    t.deepEqual(module.exports, {
        foo:         1,
        foo_1:       2,
        foo_1_1:     3,
        foo_1_1_1:   4,
        foo_1_1_2:   5,
        foo_1_1_3:   6,
        default:     7,
        default_1:   8,
        default_1_1: 9,
        default_1_2: 10,
        bar:         11,
        bar_1:       bar,
        bar_1_1:     bar_1,
    })
})

test('preempt generated names', t => {
    module.exports.foo_1 = 1   // foo_1
    module.exports.foo_1_1 = 2 // foo_1_1
    module.exports.foo = 3     // foo
    module.exports.foo = 4     // foo_1_1_1
    module.exports.foo_1 = 5   // foo_1_2
    module.exports.foo_1_1 = 6 // foo_1_1_2
    module.exports.foo = 7     // foo_2
    module.exports.foo = 8     // foo_3

    t.deepEqual(module.exports, {
        foo_1:     1,
        foo_1_1:   2,
        foo:       3,
        foo_1_1_1: 4,
        foo_1_2:   5,
        foo_1_1_2: 6,
        foo_2:     7,
        foo_3:     8,
    })
})

test('duplicate assignments', t => {
    module.exports.foo = 1 // foo
    module.exports.foo = 2 // foo_1
    module.exports.foo = 3 // foo_2
    module.exports.foo = 1 // foo
    module.exports.foo = 2 // foo_1
    module.exports.foo = 3 // foo_2

    module.exports.foo_1 = 2 // no change
    module.exports.foo_2 = 3 // no change
    module.exports.foo_1 = 2 // no change
    module.exports.foo_2 = 3 // no change

    t.deepEqual(module.exports, { foo: 1, foo_1: 2, foo_2: 3 })
})

test('module.exported', t => {
    module.exports = foo
    module.exports = bar

    // module.exported !== module.exports
    t.not(module.exported, module.exports)

    // module.exported is immutable
    module.exported.baz = baz
    t.is(module.exported.baz, undefined)

    // module.exported matches module.exports
    t.deepEqual(module.exports, { foo, bar })
    t.deepEqual(module.exported, { foo, bar })
})

test('require', t => {
    // require is defined
    t.is(typeof require, 'function')
    t.is(require.name, 'require')

    // require is not implemented
    t.throws(() => require('fs'), { message: /not implemented/ })
})

test('module.require', t => {
    const $require = id => ({ required: id })

    // write only
    t.is(module.require, undefined)
    module.require = $require
    t.is(module.require, undefined)

    t.is(require, $require)
    t.deepEqual(require('left-pad'), { required: 'left-pad' })
})
