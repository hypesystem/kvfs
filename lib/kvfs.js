var fs = require("fs");
var path = require("path");
var async = require("async");

function createNewKeyValueFileSystem(folder) {
    var obj = {};
    obj.set = queueActions.call(this, set.bind(obj, folder));
    obj.get = queueActions.call(this, get.bind(obj, folder));
    obj.del = queueActions.call(this, del.bind(obj, folder));
    obj.list = queueActions.call(this, list.bind(obj, folder));
    obj.len = queueActions.call(this, len.bind(obj, folder));

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
    };
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
    var data = { value: value, last_change: new Date().toISOString() };
    var str;
    try {
        str = JSON.stringify(data);
    }
    catch(e) {
        return callback(e);
    }
    ensureKeyFolder(root, key, function(error) {
        if(error) {
            return callback(error);
        }
        fs.writeFile(path.join(root, key), str, function(error) {
            if(error) {
                return callback(error);
            }
            callback();
        });
    });
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
    fs.readFile(path.join(root, key), function(error, buffer) {
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
    fs.unlink(path.join(root, key), function(error) {
        if(error) {
            return callback(error);
        }
        callback();
    });
}

function list(root, prefix, callback) {
    fs.readdir(path.join(root, prefix), function(error, files) {
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
        result = result.map(child => child.replace(path.sep, "/"));
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
