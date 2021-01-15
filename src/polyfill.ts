import type { Exports, Module, Require } from './index'
import env                               from './index'

declare global {
    var module: Module;
    var exports: Exports;
    var require: Require;
};

const __globalThis = globalThis

const {
    module: $module,
    exports: $exports,
    require: $require,
} = env()

try {
    module ||= $module
} catch (e) {
    __globalThis.module ||= $module
}

try {
    exports ||= $exports
} catch (e) {
    __globalThis.exports ||= $exports
}

try {
    require ||= $require
} catch (e) {
    __globalThis.require ||= $require
}
