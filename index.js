(function () {
    const uniqueName = function () {
        const names = {}

        return function (name) {
            let nextIndex = names[name]

            if (nextIndex) {
                names[name] += 1
                return `${name}_${nextIndex}`
            } else {
                names[name] = 1
                return name
            }
        }
    }()

    const $exports = new Proxy({}, {
        set (target, name, value) {
            const key = (typeof name === 'symbol') ? name : uniqueName(String(name))
            target[key] = value
        }
    })

    const $module = {
        get exports () {
            return $exports
        },

        set exports (value) {
            let key

            if (typeof value === 'function' && value.name) {
                key = value.name
            } else {
                key = 'default'
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
