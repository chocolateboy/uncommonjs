import type { Exports, Module, Require } from './index'
import env                               from './index'

declare global {
    var module: Module;
    var exports: Exports;
    var require: Require;
};

const $env = env()

try {
    module ||= $env.module
} catch (e) {
    globalThis.module ||= $env.module
}

try {
    exports ||= $env.exports
} catch (e) {
    globalThis.exports ||= $env.exports
}

try {
    require ||= $env.require
} catch (e) {
    globalThis.require ||= $env.require
}
