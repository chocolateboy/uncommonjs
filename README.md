# UnCommonJS

[![Build Status](https://github.com/chocolateboy/uncommonjs/workflows/test/badge.svg)](https://github.com/chocolateboy/uncommonjs/actions?query=workflow%3Atest)
[![NPM Version](https://img.shields.io/npm/v/@chocolateboy/uncommonjs.svg)](https://www.npmjs.org/package/@chocolateboy/uncommonjs)

<!-- TOC -->

- [NAME](#name)
- [FEATURES](#features)
- [INSTALLATION](#installation)
- [USAGE](#usage)
- [DESCRIPTION](#description)
  - [Why?](#why)
  - [Why not?](#why-not)
- [TYPES](#types)
- [GLOBALS](#globals)
  - [exports](#exports)
  - [module](#module)
    - [exported](#moduleexported)
    - [exports](#moduleexports)
    - [require](#modulerequire)
  - [require](#require)
- [EXPORTS](#exports-1)
  - [default](#default)
- [CAVEATS](#caveats)
  - [Scope](#scope)
- [DEVELOPMENT](#development)
- [COMPATIBILITY](#compatibility)
- [SEE ALSO](#see-also)
- [VERSION](#version)
- [AUTHOR](#author)
- [COPYRIGHT AND LICENSE](#copyright-and-license)

<!-- TOC END -->

# NAME

UnCommonJS - a minimum viable shim for `module.exports`

# FEATURES

- `module.exports`
- `exports`
- pluggable `require`
- supports live exports (ESM emulation)
- tiny (~ 700 B minified + gzipped)
- no dependencies
- fully typed (TypeScript)
- CDN builds - [jsDelivr][], [unpkg][]

# INSTALLATION

    $ npm install @chocolateboy/uncommonjs

# USAGE

```javascript
// ==UserScript==
// @name          My Userscript
// @description   A userscript which uses some CommonJS modules
// @include       https://www.example.com/*
// @require       https://unpkg.com/@chocolateboy/uncommonjs@3.1.0
// @require       https://cdn.jsdelivr.net/npm/crypto-hash@1.2.2
// @require       https://cdn.jsdelivr.net/npm/tiny-once@1.0.0
// ==/UserScript==

console.log(module.exported) // { once: ..., sha1: ..., sha256: ..., ... }
console.log(exports === module.exports) // true

const { once, sha256: encrypt } = exports

// ...
```

# DESCRIPTION

UnCommonJS is a tiny library which exposes a `module.exports` global (and
`exports` alias) which behaves like the CommonJS built-in. It can be used to
gather exports in environments which don't otherwise support CommonJS.

Names are deduplicated, so that e.g. if multiple modules export the same name
or assign multiple values to `module.exports`, each export is given a distinct
name.

This shim is useful in very constrained environments in which it's not possible
(usually for political or policy reasons) to use transpilers or bundlers to
integrate third-party modules.

## Why?

I use it to work around NPM modules that don't have UMD builds when I want to
use one of those modules in a [userscript](https://github.com/chocolateboy/userscripts).

For example, let's say I want to use the following modules, which are available
on NPM but don't have UMD builds:

- [crypto-hash](https://www.npmjs.com/package/crypto-hash)
- [tiny-once](https://www.npmjs.com/package/tiny-once)

Since both of these modules are simple, small, and standalone — i.e. they don't
use `require` — I can use UnCommonJS to expose `module.exports` and `exports`
globals which they can attach their exports to. I can then pull these exported
values (functions in this case) into a userscript simply by extracting them
from the `module.exports`/`exports` object:

```javascript
// ==UserScript==
// @name     My Userscript
// @require  https://unpkg.com/@chocolateboy/uncommonjs@3.1.0
// @require  https://cdn.jsdelivr.net/npm/crypto-hash@1.2.2
// @require  https://cdn.jsdelivr.net/npm/tiny-once@1.0.0
// ==/UserScript==

const { once, sha256: encrypt } = module.exports

// ...
```

## Why not?

This is a hack to get CommonJS modules working in constrained environments such
as userscripts when no other option is available. It shouldn't be used in
situations or environments where sane solutions are available.

# TYPES

The following types are referenced in the descriptions below.

<details>

```typescript
type Exports = Record<PropertyKey, unknown>
type Require = (id: string) => unknown

type Module = {
    readonly exported: Exports;
    require: Require;
    exports: any;
}

type Environment = {
    module: Module;
    exports: Exports;
    require: Require;
}

type Options = {
    require?: Require;
}
```

</details>

# GLOBALS

When the shim is loaded, [`module`](#module), [`exports`](#exports) and
[`require`](#require) are defined as global variables if they're not defined
already. Unless noted, they should have the same behavior as the corresponding
values in Node.js and other CommonJS environments.

```javascript
import '@chocolateboy/uncommonjs/polyfill'

module.exports = 42
console.log(module.exported) // { "default": 42 }
```

The API can be [imported](#exports-1) without being automatically registered via
the module's main file, e.g.:

```javascript
import cjs from '@chocolateboy/uncommonjs'

const env = cjs() // { module: ..., exports: ..., require: ... }
Object.assign(globalThis, env)
```

## exports

An alias for [`module.exports`](#moduleexports).

## module

An object which contains the following fields:

<!-- TOC:display:exported -->
### module.exported

[`module.exports`](#moduleexports) (and its [`exports`](#exports) alias) is
implemented as a thin wrapper (an ES6 Proxy) around the actual exports which
transparently handles name deduplication.

Most of the time this distinction doesn't matter, but it can crop up when
logging/debugging — e.g. when dumping the exported values with `console.log` —
since some environments display the Proxy's internals, rather than its target.
This can make it hard to see what's actually available. The `module.exported`
property solves this by exposing a (read-only) view of the underlying object.

```javascript
console.log(module.exports)
// Proxy { <target>: {…}, <handler>: {…} }

console.log(module.exported)
// Object { once: ..., sha1: ..., sha256: ..., ... }
```

<!-- TOC:display:exports -->
### module.exports

An object (dictionary) of exported values which can be assigned to by name, e.g.:

```javascript
module.exports.foo = function foo () { ... }
module.exports.bar = function () { ... }
```

`exports` is an alias for `module.exports`, so named assignments to `exports`
are identical to named assignments to `module.exports`.

The first time a named export is assigned, it is given the specified name.
Subsequent assignments to the same name with the same value are ignored. If
different values are assigned to the same name, they are assigned unique names
by appending numeric suffixes, e.g.: `foo`, `foo_1`, `foo_2` etc.

In addition to named exports, default exports can be assigned directly to
`module.exports`. Note: unlike named exports, which can be assigned to
`exports`, default exports only work by assignment to `module.exports`.

If a named function is assigned to `module.exports`, it is equivalent to a
named export, e.g.:

```javascript
module.exports = function foo () { }
```

is equivalent to:

```javascript
module.exports.foo = function foo () { }
```

If the assigned value is an anonymous function or a non-function, it is
assigned the name `default`. As with named exports, default assignments with
the same value are ignored and default assignments with different values are
assigned distinct names by appending a numeric suffix, e.g. `default`,
`default_1`, `default_2` etc.

If a plain object is assigned to `module.exports`, its properties are assigned
by name (the object's own, enumerable string keys) in addition to the default
export, e.g.:

```javascript
const props = { foo, bar }
module.exports = props
```

is equivalent to:

```javascript
module.exports.foo = foo
module.exports.bar = bar
module.exports.default = props
```

<!-- TOC:display:require -->
### module.require

An alias for the [`require`](#require) export. Can be assigned a new `require`
implementation which is used whenever the exported `require` function is
called.

```javascript
const mods = {
    'is-even':     (value => value % 2 === 0),
    'is-odd':      (value => value % 2 === 1),
    'is-thirteen': (value => value === 13),
}

module.require = id => {
    return mods[id] || throw new Error(...)
}
```

## require

A function which takes a module ID (string) and returns the value exported by
the module.

The default implementation is a stub which raises an exception which includes
the name of the required module. It can be overridden by assigning to
[`module.require`](#modulerequire).

# EXPORTS

## default

**Type**: `(options?: Options) => Environment`

```javascript
import cjs from '@chocolateboy/uncommonjs'

const mods = {
    'is-even': (value => value % 2 === 0),
    'is-odd':  (value => value % 2 === 1),
}

const myRequire = id => mods[id] || throw new Error(...)
const env = cjs({ require: myRequire })

Object.assign(globalThis, env)
```

A function which generates a new CommonJS environment, i.e. an object
containing CommonJS-compatible [`module`](#module), [`exports`](#exports) and
[`require`](#require) properties.

Takes an optional options object supporting the following options:

<!-- TOC:ignore -->
### require

**Type**: `Require`

A `require` implementation which is delegated to by the exported
[`require`](#require) function. If not supplied, it defaults to a function
which raises an exception with the supplied module ID.

# CAVEATS

- By default, `require` is defined but not implemented (it throws an
  exception): check the required modules to ensure they don't use it
- `__filename` and `__dirname` are not supported
- Pin the versions of the required modules to avoid being caught out if they
  update their dependencies
- Unless a compatible [`require`](#require) has been [defined](#modulerequire),
  load UMD bundles which use `require` **before** this shim, otherwise it will
  mislead them into thinking it's a real CommonJS environment

## Scope

Care may need to be taken when extracting values from the `exports` object into
variables if a CommonJS module (also) defines those variables at its top
level, e.g.:

```javascript
function foo () { ... }

module.exports = foo
```

For example, while most userscript engines execute userscripts in a (nested)
scope distinct from that of the `@require`s, at least one popular engine
doesn't. This means that the following won't work portably:

```javascript
// ==UserScript==
// @name          Non-Portable Userscript
// @include       *
// @require       https://unpkg.com/@chocolateboy/uncommonjs@3.1.0
// @require       https://cdn.jsdelivr.net/npm/just-safe-get@2.0.0
// ==/UserScript==

const { get } = exports // SyntaxError

get(obj, path)
```

Because the userscript is evaluated in the same scope as the CommonJS module,
the name is already defined and the declaration results in an error:

    Uncaught SyntaxError: redeclaration of function `get`

The same issue can occur in other contexts, e.g. if the shim is being used on a
webpage.

The solution is to wrap the code (or the parts of the code which assign
properties of `exports` to local variables) in a nested scope, e.g. a
[block](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/block)
or [IIFE](https://developer.mozilla.org/en-US/docs/Glossary/IIFE):

```javascript
(function () {
    const { get } = exports // OK

    get(obj, path)
})()
```

Alternatively, it may be simpler to access the export by its qualified name,
e.g.:

```javascript
exports.get(obj, path) // OK
```

# DEVELOPMENT

<details>

<!-- TOC:ignore -->
## NPM Scripts

The following NPM scripts are available:

- build - generate the minified build of the library (index.min.js)
- build:doc - update the table-of-contents (TOC) in the README
- test - run the test suite

</details>

# COMPATIBILITY

- any environment with ES6 support
- in strict mode, globals are assigned to
  [`globalThis`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/globalThis),
  which may need to be polyfilled

# SEE ALSO

- [GreasyFork Libraries](https://greasyfork.org/scripts/libraries)
- [Observable - How to require stubborn modules](https://observablehq.com/@observablehq/how-to-require-stubborn-modules)
- [packd](https://github.com/Rich-Harris/packd) - a [web service](https://bundle.run/) which converts NPM packages to UMD bundles
- [quickjs-require](https://github.com/IvanGaravito/quickjs-require) - a CommonJS `require` implementation for QuickJS
- [REPKG](https://github.com/privatenumber/repkg) - a [web service](https://repkg.now.sh/) which converts NPM packages to UMD bundles

# VERSION

3.1.0

# AUTHOR

[chocolateboy](mailto:chocolate@cpan.org)

# COPYRIGHT AND LICENSE

Copyright © 2020-2021 by chocolateboy.

This is free software; you can redistribute it and/or modify it under the
terms of the [Artistic License 2.0](https://www.opensource.org/licenses/artistic-license-2.0.php).

[jsDelivr]: https://cdn.jsdelivr.net/npm/@chocolateboy/uncommonjs
[unpkg]: https://unpkg.com/@chocolateboy/uncommonjs
