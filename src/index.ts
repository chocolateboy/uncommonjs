type Exported = Record<string | symbol, PropertyDescriptor>;

export type Exports = Record<PropertyKey, unknown>;
export type Require = ((id: string) => unknown);
export type Module = {
    readonly exported: Exports;
    require: Require;

    // XXX TypeScript doesn't allow getters and setters to return different
    // types
    exports: any;
};

export type Environment = {
    [Symbol.toStringTag]: string;
    module: Module;
    exports: Exports;
    require: Require;
};

// minification helpers
const {
    assign:         __assign,
    defineProperty: __defineProperty,
    freeze:         __freeze,
    keys:           __keys,
} = Object

const { get: __get, ownKeys: __ownKeys } = Reflect
const ignore = () => false
const toString = {}.toString

const isPlainObject = (value: any): value is Record<string, unknown> => {
    return value
        && toString.call(value) === '[object Object]'
        && ((value.constructor || Object) === Object)
}

// translate the requested name into a unique name and assign the supplied
// value to it if it doesn't already exist
const assign = (exported: Exported, name: PropertyKey, descriptor: PropertyDescriptor) => {
    let unique: string | symbol

    if (typeof name === 'symbol') {
        unique = name
    } else {
        for (let i = 0, assigned; ; ++i) {
            unique = name + (i === 0 ? '' : `_${i}`)
            assigned = exported.hasOwnProperty(unique) && exported[unique]

            if (assigned) {
                if (descriptor.get === assigned.get && descriptor.value === assigned.value) {
                    return true
                }
            } else {
                break
            }
        }
    }

    // XXX https://github.com/microsoft/TypeScript/issues/1863
    exported[unique as string] = descriptor

    // the set and defineProperty traps must return true
    return true
}

export default (): Environment => {
    // stub require implementation (for diagnostic purposes)
    let __require: Require = function require (id: string) {
        throw new Error(`Can't require ${id}: require is not implemented`)
    }

    // the underlying dictionary
    const $exported: Exported = {}

    const $exports: Exports = new Proxy($exported, {
        defineProperty: assign,

        get (target, name, receiver) {
            if (!target.hasOwnProperty(name)) {
                return __get(target, name)
            }

            const descriptor = target[name as string]
            const { get, value } = descriptor

            return get ? get.call(receiver) : value
        },

        preventExtensions: ignore,

        set (target, name, value) {
            return assign(target, name, {
                value,
                configurable: true,
                enumerable: true,
                writable: true
            })
        },

        setPrototypeOf: ignore,
    })

    const $require = function require (id: string) { return __require(id) }

    const $module = {
        get exported () {
            const exported = __ownKeys($exported).reduce((acc, name) => {
                const descriptor = $exported[name as string]
                return __defineProperty(acc, name, __assign({}, descriptor, { enumerable: true }))
            }, {})

            return __freeze(exported)
        },

        get exports () {
            return $exports
        },

        set exports (value: unknown) {
            // if the value is a plain object, export each of its keys as a
            // named export (in addition to exporting the object itself as
            // "default", "default_1" etc.)

            if (isPlainObject(value)) {
                // since this is a convenience and the full object is still
                // available as a fallback, we can afford to be strict in what
                // we support/export here, namely a) only string keys (i.e. not
                // symbols) and b) only (own) enumerable properties

                for (const key of __keys(value)) {
                    $exports[key] = value[key]
                }
            }

            const key = ((typeof value === 'function') && value.name)
                ? value.name
                : 'default'

            $exports[key] = value
        },

        get require () {
            return $require
        },

        set require (fn: Require) {
            __require = fn
        },
    }

    return {
        [Symbol.toStringTag]: 'UnCommonJS',
        exports: $exports,
        module: $module,
        require: $require,
    }
}
