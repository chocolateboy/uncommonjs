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
  - [Caveats](#caveats)
- [GLOBALS](#globals)
  - [exports](#exports)
  - [module.exported](#moduleexported)
  - [module.exports](#moduleexports)
  - [require](#require)
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
- `require` (just for diagnostics - raises an exception if called)
- tiny (&lt; 700 B minified)
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
// @require       https://unpkg.com/@chocolateboy/uncommonjs@0.3.0
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
or assign multiple values to `module.exports` (i.e. multiple default exports),
each export is given a distinct name.

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
// @require  https://unpkg.com/@chocolateboy/uncommonjs@0.3.0
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

## Caveats

- `require` is defined but not supported (it throws an exception): check the
  required modules to ensure they don't use it
- `__filename` and `__dirname` are not supported
- pin the versions of the required modules to avoid being caught out if they
  update their dependencies
- load UMD bundles **before** this shim, otherwise it will mislead them into
  thinking it's a real CommonJS environment

# GLOBALS

When this shim is loaded, the following variables are defined if they're not
defined already. Unless noted, they should have the same behavior as the
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

## require

This is defined as a function purely for diagnostic purposes. When called, it
raises an exception which includes the name of the required module.

# DEVELOPMENT

<details>

## NPM Scripts

The following NPM scripts are available:

- build - generate the minified build of the library (index.min.js)
- doctoc - update the table-of-contents (TOC) in the README
- test - run the test suite

</details>

# COMPATIBILITY

- any environment with [ES6 Proxy support](https://caniuse.com/#feat=proxy)

# SEE ALSO

- [GreasyFork Libraries](https://greasyfork.org/scripts/libraries)
- [Observable - How to require stubborn modules](https://observablehq.com/@observablehq/how-to-require-stubborn-modules)
- [packd](https://github.com/Rich-Harris/packd) - a [web service](https://bundle.run/) which converts CommonJS modules to UMD

# VERSION

0.3.0

# AUTHOR

[chocolateboy](mailto:chocolate@cpan.org)

# COPYRIGHT AND LICENSE

Copyright © 2020 by chocolateboy.

This is free software; you can redistribute it and/or modify it under the
terms of the [Artistic License 2.0](https://www.opensource.org/licenses/artistic-license-2.0.php).
