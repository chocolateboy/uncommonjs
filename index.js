(function () {
    const $exported = {}
    const names = {}
    const toString = {}.toString

    const uniqueName = function (name) {
        let nextIndex = names[name]

        if (nextIndex) {
            names[name] += 1
            return `${name}_${nextIndex}`
        } else {
            names[name] = 1
            return name
        }
    }

    const $exports = new Proxy($exported, {
        set (target, name, value) {
            const key = (typeof name === 'symbol') ? name : uniqueName(String(name))
            target[key] = value
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
                // we support/export here, namely: a) only string keys (i.e. not
                // symbols) and b) only (own) enumerable properties
                const keys = Object.keys(value)

                for (let i = 0; i < keys.length; ++i) {
                    const key = keys[i]
                    $exports[key] = value[key]
                }
            }

            let key = 'default'

            if (typeof value === 'function') {
                key = value.name || key
            }

            $exports[key] = value
        },
    }

    const $require = function require (id) {
        throw new Error(`can't require ${id}: require is not implemented`)
    }

    if (typeof exports === 'undefined') {
        exports = $exports
    }

    if (typeof module === 'undefined') {
        module = $module
    }

    if (typeof require === 'undefined') {
        require = $require
    }
})()
