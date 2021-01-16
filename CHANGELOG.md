## 3.1.1 - 2021-01-16

- improve identity detection

## 3.1.0 - 2021-01-16

- add an option to assign the `require` function when creating an
  environment

## 3.0.1 - 2021-01-15

- remove unused dev dependency

## 3.0.0 - 2021-01-15

- add support for live bindings (e.g. esbuild's CommonJS output)
- separate the polyfill from the exports
- migrate source to TypeScript

## 2.0.2 - 2020-11-06

- update build dependencies
- documentation tweaks

## 2.0.1 - 2020-08-26

- remove redundant/duplicate backing store

## 2.0.0 - 2020-08-26

#### Breaking Change

- clarify that ES6 support is required, not just ES6 Proxy support, since other
  features may be used (bumped the major version in case anyone was relying on
  partial support and a polyfill)

#### Features

- generate cleaner (flatter) names

#### Fixes

- improve detection of duplicate assignments

## 1.0.1 - 2020-08-25

- documentation tweaks

## 1.0.0 - 2020-08-12

- add `require` hook (`module.require`)

## 0.3.2 - 2020-08-06

- portability fixes
  - return true from the Proxy#set trap as required by the spec
  - catch the ReferenceError when assigning undeclared variables in strict
    mode and fall back to `globalThis`
- add a caveat about scoping/portability (thanks,
  [darkred](https://github.com/chocolateboy/userscripts/issues/11))

## 0.3.1 - 2020-07-29

- reduce the size of the minified build
- documentation tweaks

## 0.3.0 - 2020-07-29

- don't dedup the names of duplicate assignments, e.g.:
  `exports.foo = foo && exports.foo = foo`
- fix assignment to generated names, e.g. assigning to `foo_1`
- add missing license

## 0.2.0 - 2020-05-02

- add `module.exported`, a read-only view of the exports without the
  Proxy wrapper

## 0.1.0 - 2020-05-01

- export the keys of plain objects as named exports, in addition to exporting
  the object itself as "default", "default_1" etc.
- documentation fixes

## 0.0.2 - 2020-04-26

- add missing documentation

## 0.0.1 - 2020-04-26

- initial release
