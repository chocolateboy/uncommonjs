'use strict';

const test = require('ava')
const cjs  = require('../dist/index.js')

function foo () { return 'Foo' }
function bar () { return 'Bar' }
function baz () { return 'Baz' }

test.beforeEach(t => {
    t.context.$ = cjs()
})

test.afterEach(t => {
    const { $ } = t.context

    t.truthy($.module.exports, 'module.exports is defined')
    t.truthy($.exports, 'exports is defined')
    t.is($.module.exports, $.exports, 'module.exports === exports')
    t.deepEqual($.module.exports, $.exports, 'module.exports matches exports')

    if (!t.context.skipExported) {
        t.deepEqual($.module.exports, $.module.exported, 'module.exports matches module.exported')
    }
})

test('single explicitly named export', t => {
    const { $ } = t.context
    $.module.exports.foo = foo
    t.deepEqual($.module.exports, { foo })
})

test('single implicitly named export', t => {
    const { $ } = t.context
    $.module.exports = foo
    t.deepEqual($.module.exports, { foo })
})

test('single anonymous export', t => {
    const { $ } = t.context
    $.module.exports = 42
    t.deepEqual($.module.exports, { default: 42 })
})

test('duplicate named exports', t => {
    const { $ } = t.context

    $.module.exports.foo = foo
    $.module.exports.foo = foo
    $.module.exports = bar
    $.module.exports = bar
    $.module.exports.baz = baz
    $.module.exports = baz
    $.module.exports.quux = NaN
    $.module.exports.quux = NaN

    t.deepEqual($.module.exports, {
        foo,
        bar,
        baz,
        quux: NaN,
    })
})

test('duplicate anonymous exports', t => {
    const { $ } = t.context

    $.module.exports = 42
    $.module.exports = 42
    $.module.exports = 'foo'
    $.module.exports = 'foo'
    $.module.exports = NaN
    $.module.exports = NaN

    t.deepEqual($.module.exports, {
        default: 42,
        default_1: 'foo',
        default_2: NaN,
    })
})

test('multiple named exports (different names)', t => {
    const { $ } = t.context

    $.module.exports.foo = foo
    $.module.exports.bar = bar

    t.deepEqual($.module.exports, { foo, bar })
})

test('multiple named exports (same name, different values)', t => {
    const { $ } = t.context

    $.module.exports.foo = foo
    $.module.exports.foo = bar

    t.deepEqual($.module.exports, { foo: foo, foo_1: bar })
})

test('multiple default exports (anonymous functions)', t => {
    const { $ } = t.context

    // it's quite hard to refer to an anonymous function in ES6 without
    // accidentally assigning it a name
    const anon = [() => {}, () => {}]

    $.module.exports = anon[0]
    $.module.exports = anon[1]

    t.deepEqual($.module.exports, { default: anon[0], default_1: anon[1] })
})

test('multiple default exports (non-functions)', t => {
    const { $ } = t.context

    $.module.exports = 'foo'
    $.module.exports = 42

    t.deepEqual($.module.exports, { default: 'foo', default_1: 42 })
})

test('multiple default exports (named functions)', t => {
    const { $ } = t.context

    $.module.exports = foo
    $.module.exports = bar

    t.deepEqual($.module.exports, { foo, bar })
})

test('multiple default exports (named properties)', t => {
    const { $ } = t.context
    const props1 = { foo, bar }
    const props2 = { foo, bar }

    $.module.exports = props1
    $.module.exports = props2

    t.deepEqual($.module.exports, {
        foo,
        bar,
        default: props1,
        default_1: props2,
    })
})

test('assign to generated names', t => {
    const { $ } = t.context

    function bar_1 () {}

    $.module.exports.foo = 1        // foo
    $.module.exports.foo = 2        // foo_1
    $.module.exports.foo_1 = 3      // foo_1_1
    $.module.exports.foo_1_1 = 4    // foo_1_1_1
    $.module.exports.foo_1_1 = 5    // foo_1_1_2
    $.module.exports.foo_1_1 = 6    // foo_1_1_3
    $.module.exports = 7            // default
    $.module.exports = 8            // default_1
    $.module.exports.default_1 = 9  // default_1_1
    $.module.exports.default_1 = 10 // default_1_2
    $.module.exports.bar = 11       // bar
    $.module.exports = bar          // bar_1
    $.module.exports = bar_1        // bar_1_1

    t.deepEqual($.module.exports, {
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

test('pre-empt generated names', t => {
    const { $ } = t.context

    $.module.exports.foo_1 = 1   // foo_1
    $.module.exports.foo_2 = 2   // foo_2
    $.module.exports.foo = 3     // foo
    $.module.exports.foo = 4     // foo_3
    $.module.exports.foo_1 = 5   // foo_1_1
    $.module.exports.foo_2 = 6   // foo_2_1
    $.module.exports.foo_1 = 7   // foo_1_2
    $.module.exports.foo_2 = 8   // foo_2_2
    $.module.exports.foo = 9     // foo_4
    $.module.exports.foo = 10    // foo_5

    t.deepEqual($.module.exports, {
        foo_1:   1,
        foo_2:   2,
        foo:     3,
        foo_3:   4,
        foo_1_1: 5,
        foo_2_1: 6,
        foo_1_2: 7,
        foo_2_2: 8,
        foo_4:   9,
        foo_5:   10,
    })
})

test('duplicate assignments', t => {
    const { $ } = t.context

    $.module.exports.foo = 1 // foo
    $.module.exports.foo = 2 // foo_1
    $.module.exports.foo = 3 // foo_2
    $.module.exports.foo = 1 // foo
    $.module.exports.foo = 2 // foo_1
    $.module.exports.foo = 3 // foo_2

    $.module.exports.foo_1 = 2 // no change
    $.module.exports.foo_2 = 3 // no change
    $.module.exports.foo_1 = 2 // no change
    $.module.exports.foo_2 = 3 // no change

    t.deepEqual($.module.exports, { foo: 1, foo_1: 2, foo_2: 3 })
})

test('module.exports', t => {
    const { $ } = t.context

    $.module.exports.foo = foo
    $.module.exports.bar = bar
    $.module.exports = { baz }

    t.is($.module.exports.constructor, Object)
    t.deepEqual(Object.keys($.module.exports), ['foo', 'bar', 'baz', 'default'])
    t.deepEqual(Object.values($.module.exports), [foo, bar, baz, { baz }])
    t.deepEqual(Object.entries($.module.exports), [['foo', foo], ['bar', bar], ['baz', baz], ['default', { baz }]])
})

test('module.exported', t => {
    const { $ } = t.context

    $.module.exports = foo
    $.module.exports = bar

    // module.exported !== module.exports
    t.deepEqual($.module.exported, $.module.exports)
    t.not($.module.exported, $.module.exports)

    // each property access returns a new snapshot (new reference)
    const exported1 = $.module.exported
    const exported2 = $.module.exported

    t.deepEqual(exported1, exported2)
    t.not(exported1, exported2)

    // assigning to module.exported doesn't affect module.exports
    const exported = $.module.exported

    exported.baz = baz
    t.is(exported.baz, baz)
    t.is($.module.exports.baz, undefined)
    t.is($.module.exported.baz, undefined)

    // module.exported matches module.exports
    t.deepEqual($.module.exports, { foo, bar })
    t.deepEqual($.module.exported, { foo, bar })
})

test('require', t => {
    const { $ } = t.context

    // require is defined
    t.is(typeof $.require, 'function')
    t.is($.require.name, 'require')

    // require is not implemented
    t.throws(() => $.require('fs'), { message: /not implemented/ })
})

test('module.require', t => {
    const { $ } = t.context

    // require can be overridden
    $.module.require = id => ({ overridden: id })

    t.deepEqual($.require('foo'), { overridden: 'foo' })
    t.deepEqual($.require('bar'), { overridden: 'bar' })
})

test('options.require', t => {
    // require can be initialized
    const $ = cjs({ require: id => ({ initialized: id }) })

    t.deepEqual($.require('baz'), { initialized: 'baz' })
    t.deepEqual($.require('quux'), { initialized: 'quux' })
})

test('live exports', t => {
    const { $ } = t.context
    const descriptor = (i => ({ get: () => ++i }))(0)

    Object.defineProperty($.exports, 'foo', descriptor)    // foo
    Object.defineProperty($.exports, 'foo', { value: 42 }) // foo_1
    $.module.exports.foo = 'bar'                           // foo_2

    const exported1 = $.module.exported

    t.is($.exports.foo, 1)
    t.is(exported1.foo, 2)
    t.is($.exports.foo, 3)
    t.is(exported1.foo, 4)

    t.is($.exports.foo_1, 42)
    t.is(exported1.foo_1, 42)

    t.is($.exports.foo_2, 'bar')
    t.is(exported1.foo_2, 'bar')

    const exported2 = $.module.exported

    t.is($.exports.foo, 5)
    t.is(exported1.foo, 6)
    t.is(exported1.foo, 7)
    t.is(exported2.foo, 8)
    t.is(exported1.foo, 9)
    t.is($.exports.foo, 10)

    t.is($.exports.foo_1, 42)
    t.is(exported1.foo_1, 42)
    t.is(exported2.foo_1, 42)

    t.is($.exports.foo_2, 'bar')
    t.is(exported1.foo_2, 'bar')
    t.is(exported2.foo_2, 'bar')

    t.context.skipExported = true
})
