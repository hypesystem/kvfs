kvfs
====

kvfs is a Key-Value store based on the file system.
It takes no time to set up, no infrastructure other than a file system, and lets you get started with your code real quick.

**PLEASE NOTE** that pre-1.0 this package might *change its interface* in a breaking manner between minor version bumps.

kvfs **should not** be used for serious production stuff, but is useful for getting started quickly.
It uses the filesystem and is inherently *undistributable*.
The goal is simple: get you started quick, let you decide on underlying layers later.

That said, here's some documentation and stuff...

Getting started
---------------

You need to decide on a path, relative to where you are running your application from, that will be your data store.
In this example we will use a folder *.data*, but you could, for example, use */var/lib/<your app name>*.

Install the package from npm using your commandline:

    npm install kvfs --save

Documentation
-------------

To create a new key-value store, simply pass the relative (to where you are running the app from) path for the store.

```js
var kvfs = require("kvfs");
var myStore = kvfs(".myStore");
```

This will create a folder ".myStore" in your current working directory.

On `myStore` you can now call any of the supported functions, to work with your key-value store (below).
In addition, the store is an event emitter, which lets you listen on changes to entries.

### set

```js
myStore.set(key, value, callback)
```

- **key** string key to use for lookup
- **value** any kind of standard JSON value (string, number, boolean, object, array).
  If it is not a standard value (a cyclic object, an object with functionality) kvfs will attempt to coerce it to JSON (basically `JSON.stringify`).
- **callback** should take a single argument, `error`, in case something goes wrong.

### get

```js
myStore.get(key, callback)
```

- **key** corresponding key: will retrieve the value that has been set for this key or fail
- **callback** should take two arguments:
  - `error` in case something goes wrong
  - `value` the value retrieved

### del

```js
myStore.del(key, callback)
```

- **key** the key to delete: the value will be erased
- **callback** should take a single argument, `error`, in case something goes wrong.

### list

```js
myStore.list(prefix, callback)
```

This function works on collections.
A collection consists of all entries with a shared prefix, ended with a forward slash `/`.

- **prefix** the collection prefix to look for.
  For example, `"hello"` will match `"hello/world"`, `"hello/kitty"`, and even `"hello/it/is/me"`, but not `"hello-there"`.
  The prefix must be immediately followed by a forward slash `/`.
- **callback** should take two arguments:
  - `error` in case something goes wrong
  - `descendants` all of the entries belonging to the collection

### len

```js
myStore.len(prefix, callback)
```

Like `.list`, but returning the number of children.

- **prefix** the collection prefix to look for.
- **callback** should take two arguments:
  - `error` in case something goes wrong
  - `length` (number) the number of entries in the collection

### on

```js
myStore.on(key, listener)
```

- **key** key to listen for changes on.
  May use wildcards, for example `"hello/**"` will listen to changes for all entries in the `hello` collection (all descendants of `"hello"`).
- **listener** takes the exact key of the element that was changed.

Also supported:

- `once`
- `onAny`
- ...

Contributing
------------

Please feel free to open issues and Pull Requests on this repository if you have questions or suggestions :-)
