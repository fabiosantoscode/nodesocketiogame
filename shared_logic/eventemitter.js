function EventEmitter () {
    'use strict';
    var onces = {},
        listeners = {},
        register,
        callAll,
        remove;
    register = function (eventName, callback, array) {
        var callbacks;
        callbacks = array[eventName] || [];
        callbacks.push(callback);
        array[eventName] = callbacks;
    };
    callAll = function (array, callArgs) {
        var i;
        for (i = 0; i < array.length; i += 1) {
            array[i].apply(this, callArgs);
        }
    };
    remove = function (arr, ind) {
        var tmp = arr.splice(0, ind);
        arr.splice(0, 1);
        return tmp.concat(arr);
    };
    this.once = function (eventName, callback) {
        register(eventName, callback, onces);
    };
    this.on = this.addListener = function (eventName, callback) {
        register(eventName, callback, listeners);
    };
    this.emit = this.trigger = function (eventName) {
        var i,
            callArgs = [],
            onceArr = onces[eventName],
            listenerArr = listeners[eventName];
        for (i = 1; i < arguments.length; i += 1) {
            callArgs.push(arguments[i]);
        }
        if (onceArr) {
            callAll(onceArr, callArgs);
            onces[eventName] = undefined;
        }
        if (listenerArr) {
            callAll(listeners[eventName], callArgs);
        }
    };
    this.clear = this.removeAllListeners = function (eventName) {
        if (!eventName) {
            onces = listeners = {};
        } else {
            onces[eventName] = listeners[eventName] = [];
        }
    };
    this.off = this.removeListener = function (eventName, listener) {
        var listenerArr,
            ind,
            iter = [onces, listeners];
        while (iter.length) {
            listenerArr = iter[0][eventName];
            if (listenerArr) {
                ind = listenerArr.length;
                while (ind) {
                    ind -= 1;
                    if (listenerArr[ind] === listener) {
                        iter[0][eventName] = remove(listenerArr, ind);
                    }
                }
            }
            iter.shift();
        }
    };
}
