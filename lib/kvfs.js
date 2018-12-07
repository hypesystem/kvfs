var fs = require("fs");
var path = require("path");
var async = require("async");
var EventEmitter2 = require("eventemitter2").EventEmitter2;

function createNewKeyValueFileSystem(folder) {
    var obj = new EventEmitter2({
        wildcard: true,
        delimiter: "/",
        newListener: false,
        maxListeners: 100
    });
    obj.set = queueActions.call(obj, set.bind(obj, folder));
    obj.get = queueActions.call(obj, get.bind(obj, folder));
    obj.del = queueActions.call(obj, del.bind(obj, folder));
    obj.list = queueActions.call(obj, list.bind(obj, folder));
    obj.len = queueActions.call(obj, len.bind(obj, folder));

    ensureFolder(folder, function() {
        obj.set = set.bind(obj, folder);
        obj.get = get.bind(obj, folder);
        obj.del = del.bind(obj, folder);
        obj.list = list.bind(obj, folder);
        obj.len = len.bind(obj, folder);

        triggerWaitingActions(obj);
        delete obj.__waitingActions;
    });

    return obj;
}

function queueActions(action) {
    if(!this.__waitingActions) {
        this.__waitingActions = [];
    }
    return function() {
        var args = arguments;
        this.__waitingActions.push(function() {
            action.apply(this, args);
        });
    }.bind(this);
}

function ensureFolder(folder, callback) {
    fs.mkdir(folder, function() {
        callback();
    });
}

function triggerWaitingActions(obj) {
    if(!obj.__waitingActions) {
        return;
    }
    obj.__waitingActions.forEach(function(waitingAction) {
        waitingAction();
    });
}

function set(root, key, value, callback) {
    var emitter = this;
    var data = { value: value, last_change: new Date().toISOString() };
    var str;
    try {
        str = JSON.stringify(data, null, 4);
    }
    catch(e) {
        return callback(e);
    }
    ensureKeyFolder(root, key, function(error) {
        if(error) {
            return callback(error);
        }
        fs.writeFile(pathFromKey(root, key), str, function(error) {
            if(error) {
                return callback(error);
            }
            key = key.replace(path.sep, "/");
            emitter.emit(key, key);
            callback();
        });
    });
}

function pathFromKey(root, key) {
    return path.join(root, key + ".json");
}

function ensureKeyFolder(root, key, callback) {
    if(key.indexOf("/") == -1) {
        return callback();
    }
    var keyFolders = key.split("/").slice(0, -1);
    ensureFolderParts(root, keyFolders, callback);
}

function ensureFolderParts(root, folders, callback) {
    if(folders.length == 0) {
        return callback();
    }
    var folderToCreate = path.join(root, folders[0]);
    fs.mkdir(folderToCreate, function(error) {
        if(error && error.code != "EEXIST") {
            return callback(error);
        }
        ensureFolderParts(folderToCreate, folders.slice(1), callback);
    })
}

function get(root, key, callback) {
    fs.readFile(pathFromKey(root, key), function(error, buffer) {
        if(error) {
            return callback(error);
        }
        var data;
        try {
            data = JSON.parse(buffer.toString());
        }
        catch(e) {
            return callback(e);
        }
        callback(null, data.value);
    });
}

function del(root, key, callback) {
    var emitter = this;
    fs.unlink(pathFromKey(root, key), function(error) {
        if(error) {
            return callback(error);
        }
        var key = key.replace(path.sep, "/");
        emitter.emit(key, key);
        callback();
    });
}

function list(root, prefix, callback) {
    fs.readdir(path.join(root, prefix), function(error, files) {
        if(error && error.code == "ENOENT") {
            return callback(null, []);
        }
        if(error) {
            return callback(error);
        }
        getChildren(root, prefix, files, callback);
    });
}

function getChildren(dir, prefix, files, callback) {
    async.map(files, function(file, callback) {
        var qualifiedFilePath = path.join(prefix, file);
        fs.readdir(path.join(dir, qualifiedFilePath), function(error, children) {
            if(error && error.code == "ENOTDIR") {
                return callback(null, [ qualifiedFilePath ]);
            }
            if(error) {
                return callback(error);
            }
            getChildren(dir, qualifiedFilePath, children, callback);
        });
    }, function(error, childrenSets) {
        if(error) {
            return callback(error);
        }
        var result = [];
        childrenSets.forEach(function(childrenSet) {
            result = result.concat(childrenSet);
        });
        result = result.map(child => child.replace(path.sep, "/").replace(/\.json$/, ""));
        callback(null, result);
    });
}

function len(root, prefix, callback) {
    list.call(this, root, prefix, function(error, children) {
        if(error) {
            return callback(error);
        }
        callback(null, children.length);
    });
}

module.exports = createNewKeyValueFileSystem;
