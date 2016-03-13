kvfs
====

kvfs is a Key-Value store based on the file system.
It takes no time to set up, no infrastructure other than a file system, and lets you get started with your code real quick.

**PLEASE NOTE** that pre-1.0 this package might *change its interface* in a breaking manner between minor version bumps.

A goal of this package (as of start) is to have an interface that is a subset of that of [node_redis](https://github.com/NodeRedis/node_redis).
This might change, seeing as we rely on callbacks and node_redis does not.
The idea stands: we want to offer a drop-in replacement when users are ready to move from prototype to serious architecture.

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

In your file that needs access to the file store simply instantiate it like this:

```js
var kvfs = require("kvfs")(".data");

kvfs.set("my_first_entry", "Hello, world. This is a quick test entry.", (error) => {
    if(error) {
        return console.error("Failed to set entry.", error);
    }
    console.log("Saved my first entry.");
    kvfs.get("my_first_entry", (error, value) => {
        if(error) {
            return console.error("Failed to get my entry.", error);
        }
        console.log("Read the entry back. Its value was:", value);
    });
});
```

Contributing
------------

Please feel free to open issues and Pull Requests on this repository if you have questions or suggestions :-)
