export type Exports = Record<PropertyKey, any>;
export type Require = (id: string) => any;
export type Module = {
    get exports (): Exports;
    set exports (value: any);
    readonly exported: Exports;
    require: Require;
};

export type Environment = {
    module: Module;
    exports: Exports;
    require: Require;
};

export type Options = {
    require?: Require;
};

type Descriptors = Record<string | symbol, PropertyDescriptor>;

// minification helpers
const {
    assign:         __assign,
    defineProperty: __defineProperty,
    is:             __is,
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
const assign = (descriptors: Descriptors, name: PropertyKey, descriptor: PropertyDescriptor) => {
    let unique: string | symbol

    if (typeof name === 'symbol') {
        unique = name
    } else {
        for (let i = 0, assigned; ; ++i) {
            unique = name + (i === 0 ? '' : `_${i}`)
            assigned = descriptors.hasOwnProperty(unique) && descriptors[unique]

            if (assigned) {
                if (descriptor.get === assigned.get && __is(descriptor.value, assigned.value)) {
                    return true
                }
            } else {
                break
            }
        }
    }

    descriptors[unique] = descriptor

    // the set and defineProperty traps must return true
    return true
}

// stub require implementation (for diagnostic purposes)
const defaultRequire = (id: string) => {
    throw new Error(`Can't require ${id}: require is not implemented`)
}

export default (options: Options = {}): Environment => {
    let _require: Require = options.require || defaultRequire

    // the underlying dictionary
    const descriptors: Descriptors = {}

    const $exports: Exports = new Proxy(descriptors, {
        defineProperty: assign,

        get (target, name, receiver) {
            if (!target.hasOwnProperty(name)) {
                return __get(target, name)
            }

            const { get, value } = target[name]

            return get ? get.call(receiver) : value
        },

        preventExtensions: ignore,

        set (target, name, value) {
            return assign(target, name, {
                value,
                configurable: true,
                enumerable: true,
                writable: true,
            })
        },

        setPrototypeOf: ignore,
    })

    const $require = function require (id: string) { return _require(id) }

    const $module = {
        get exported (): Exports {
            return __ownKeys(descriptors).reduce((acc, name) => {
                return __defineProperty(
                    acc,
                    name,
                    __assign({}, descriptors[name], { enumerable: true })
                )
            }, {})
        },

        get exports (): Exports {
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
            _require = fn
        },
    }

    return {
        exports: $exports,
        module: $module,
        require: $require,
    }
}
