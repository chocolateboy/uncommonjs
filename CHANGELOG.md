### 0.3.1 - 2020-07-29

- reduce the size of the minified build
- documentation tweaks

### 0.3.0 - 2020-07-29

- don't dedup the names of duplicate assignments, e.g.:
  `exports.foo = foo && exports.foo = foo`
- fix assignment to generated names, e.g. assigning to `foo_1`
- add missing license

### 0.2.0 - 2020-05-02

- add `module.exported`, a read-only view of the exports without the
  Proxy wrapper

### 0.1.0 - 2020-05-01

- export the keys of plain objects as named exports, in addition to exporting
  the object itself as "default", "default_1" etc.
- documentation fixes

### 0.0.2 - 2020-04-26

- add missing documentation

### 0.0.1 - 2020-04-26

- initial release
