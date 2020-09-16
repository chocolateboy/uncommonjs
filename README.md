# UnCommonJS

[![Build Status](https://travis-ci.org/chocolateboy/uncommonjs.svg)](https://travis-ci.org/chocolateboy/uncommonjs)
[![NPM Version](https://img.shields.io/npm/v/@chocolateboy/uncommonjs.svg)](https://www.npmjs.org/package/@chocolateboy/uncommonjs)

<!-- toc -->

- [NAME](#name)
- [FEATURES](#features)
- [INSTALLATION](#installation)
- [USAGE](#usage)
- [DESCRIPTION](#description)
  - [Why?](#why)
  - [Why not?](#why-not)
- [GLOBALS](#globals)
  - [exports](#exports)
  - [module.exported](#moduleexported)
  - [module.exports](#moduleexports)
  - [module.require](#modulerequire)
  - [require](#require)
- [CAVEATS](#caveats)
  - [Scope](#scope)
- [DEVELOPMENT](#development)
  - [NPM Scripts](#npm-scripts)
- [COMPATIBILITY](#compatibility)
- [SEE ALSO](#see-also)
- [VERSION](#version)
- [AUTHOR](#author)
- [COPYRIGHT AND LICENSE](#copyright-and-license)

<!-- tocstop -->

# NAME

UnCommonJS - a minimum viable shim for `module.exports`

# FEATURES

- `module.exports`
- `exports`
- pluggable `require`
- tiny (&lt; 800 B minified)
- no dependencies
- suitable for userscripts

# INSTALLATION

    $ npm install @chocolateboy/uncommonjs

# USAGE

```javascript
// ==UserScript==
// @name          My Userscript
// @description   A userscript which uses some CommonJS modules
// @include       https://www.example.com/*
// @require       https://unpkg.com/@chocolateboy/uncommonjs@2.0.1
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
// @require  https://unpkg.com/@chocolateboy/uncommonjs@2.0.1
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

# GLOBALS

When this shim is loaded, the following global variables are defined if they're
not defined already. Unless noted, they should have the same behavior as the
corresponding values in Node.js and other CommonJS environments.

## exports

This is an alias for [`module.exports`](#moduleexports).

## module.exported

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

## module.exports

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

## module.require

A write-only property which can be assigned a replacement for the default
[`require`](#require) implementation.

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

# CAVEATS

- By default, `require` is defined but not implemented (it throws an
  exception): check the required modules to ensure they don't use it
- `__filename` and `__dirname` are not supported
- pin the versions of the required modules to avoid being caught out if they
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
// @require       https://unpkg.com/@chocolateboy/uncommonjs@2.0.1
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

Alternatively, for one-off uses, it may be simpler to access the export by its
qualified name, e.g.:

```javascript
exports.get(obj, path) // OK
```

# DEVELOPMENT

<details>

## NPM Scripts

The following NPM scripts are available:

- build - generate the minified build of the library (index.min.js)
- doctoc - update the table-of-contents (TOC) in the README
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
- [REPKG](https://github.com/privatenumber/repkg) - a [web service](https://repkg.now.sh/) which converts NPM packages to UMD bundles

# VERSION

2.0.1

# AUTHOR

[chocolateboy](mailto:chocolate@cpan.org)

# COPYRIGHT AND LICENSE

Copyright © 2020 by chocolateboy.

This is free software; you can redistribute it and/or modify it under the
terms of the [Artistic License 2.0](https://www.opensource.org/licenses/artistic-license-2.0.php).
