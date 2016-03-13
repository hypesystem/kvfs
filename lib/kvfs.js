var fs = require("fs");
var path = require("path");

/**
 * This is a quick little key-value store based on the file system.
 * A secret goal of this is to have an API that is a subset of the node-redis API
 *   (so redis can be used as a drop-in replacement).
 * It won't fit the API 100% pre-1.0, but that's ok.
 */

function createNewKeyValueFileSystem(folder) {
    var obj = {};
    obj.set = queueActions.call(this, set.bind(obj, folder));
    obj.get = queueActions.call(this, get.bind(obj, folder));
    obj.del = queueActions.call(this, del.bind(obj, folder));

    ensureFolder(folder, function() {
        obj.set = set.bind(obj, folder);
        obj.get = get.bind(obj, folder);
        obj.del = del.bind(obj, folder);

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
    var data = { value: value };
    var str;
    try {
        str = JSON.stringify(data);
    }
    catch(e) {
        return callback(e);
    }
    fs.writeFile(path.join(root, key), str, function(error) {
        if(error) {
            return callback(error);
        }
        callback();
    });
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

module.exports = createNewKeyValueFileSystem;
