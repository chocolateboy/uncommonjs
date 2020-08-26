(function () {
    // the underlying dictionary
    const $exported = {}

    // maps a requested name (e.g. "foo") to a set of the unique values assigned
    // with that name. e.g. given the following assignments:
    //
    //   exports.foo = 1 // foo
    //   exports.foo = 2 // foo_1
    //   exports.foo = 3 // foo_2
    //
    // this object would contain:
    //
    //   {
    //       foo:   Set { 1, 2, 3 },
    //       foo_1: Set { 2 },
    //       foo_2: Set { 3 },
    //   }
    //
    // this also doubles as a counter for the number of aliases for a name
    const seen = {}

    // a helper function used to identify plain objects
    const toString = {}.toString

    // stub require implementation (for diagnostic purposes)
    const $require = function require (id) {
        throw new Error(`Can't require ${id}: require is not implemented`)
    }

    // a WeakSet with support for non-object values
    const InterSet = class {
        constructor () {
            this._values = this._objects = null
            this._size = 0
        }

        add (value) {
            this._target(value).add(value)
            ++this._size
            return this
        }

        has (value) {
            return this._target(value).has(value)
        }

        get size () {
            return this._size
        }

        _target (value) {
            if (Object(value) === value) {
                return this._objects || (this._objects = new WeakSet())
            } else {
                return this._values || (this._values = new Set())
            }
        }
    }

    // a helper function used to translate a requested name into a unique name
    const uniqueName = (name, value) => {
        const values = seen[name] || (seen[name] = new InterSet())
        const { size } = values

        if (values.has(value)) {
            return null
        }

        values.add(value)
        return size ? uniqueName(`${name}_${size}`, value) : name
    }

    // factor out some common code/constants to reduce the minified file size
    const UNDEFINED = 'undefined'

    const assignRequire = fn => {
        try {
            require = fn
        } catch (e) {
            globalThis.require = fn
        }
    }

    const $exports = new Proxy($exported, {
        set (target, name, value) {
            // name is either a symbol or (has been coerced to) a string

            const key = typeof name === 'symbol'
                ? name
                : (name && uniqueName(name, value))

            if (key) {
                target[key] = value
            }

            // NOTE the `set` trap must return true:
            //
            //   > The set method should return a boolean value. Return true to
            //   > indicate that assignment succeeded. If the set method returns
            //   > false, and the assignment happened in strict-mode code, a
            //   > TypeError will be thrown.
            //
            // -- https://mzl.la/2XR09L9
            return true
        }
    })

    const $module = {
        get exported () {
            return Object.assign({}, $exported)
        },

        get exports () {
            return $exports
        },

        set exports (value) {
            // if the value is a plain object, export each of its keys as a
            // named export (in addition to exporting the object itself as
            // "default", "default_1" etc.)
            if (toString.call(value) === '[object Object]') {
                // since this is a convenience and the full object is still
                // available as a fallback, we can afford to be strict in what
                // we support/export here, namely a) only string keys (i.e. not
                // symbols) and b) only (own) enumerable properties

                for (const key of Object.keys(value)) {
                    $exports[key] = value[key]
                }
            }

            const key = ((typeof value === 'function') && value.name)
                ? value.name
                : 'default'

            $exports[key] = value
        },

        // write only
        set require (fn) {
            assignRequire(fn)
        }
    }

    // by default, assign these as undeclared variables; this works in
    // non-strict mode and is needed by the test.
    //
    // if that fails, assign to globalThis
    if (typeof exports === UNDEFINED) {
        try {
            exports = $exports
        } catch (e) {
            globalThis.exports = $exports
        }
    }

    if (typeof module === UNDEFINED) {
        try {
            module = $module
        } catch (e) {
            globalThis.module = $module
        }
    }

    if (typeof require === UNDEFINED) {
        assignRequire($require)
    }
})();
