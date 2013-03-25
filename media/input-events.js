/*jshint browser: true*/
(function () {
    'use strict';
    var $ = window.jQuery,
        mappings = {},
        keyInput,
        realKey;
    realKey = function (key) {
        // Get mapped key code from a key alias, or just from a key
        return mappings[key] || key;
    };
    window.keyInput = keyInput = {
        _events: new window.EventEmitter(),
        pressedKeys: {},
        pressedThisFrame: {},
        releasedThisFrame: {},
        isPressed: function (key) {
            return !!this.pressedKeys[realKey(key)];
        },
        wasReleased: function (key) {
            return !!this.releasedThisFrame[realKey(key)];
        },
        wasPressed: function (key) {
            return !!this.pressedThisFrame[realKey(key)];
        },
        pressKey: function (key) {
            key = realKey(key);
            // Our browser will give us the same event again...
            if (!this.pressedKeys[key]) {
                this.pressedThisFrame[key] = true;
                this.pressedKeys[key] = true;
                this._events.trigger('press', key);
            }
        },
        releaseKey: function (key) {
            key = realKey(key);
            this.releasedThisFrame[key] = true;
            this.pressedKeys[key] = false;
            this._events.trigger('release', key);
        },
        onPress: function (callback) {
            this._events.on('press', callback);
        },
        onRelease: function (callback) {
            this._events.on('release', callback);
        },
        frame: function (callback) {
            this.pressedThisFrame = this.releasedThisFrame = {};
        }
    };
    $(window)
        .on('keydown', function (e) {
            keyInput.pressKey(e.which);
        })
        .on('keyup', function (e) {
            keyInput.releaseKey(e.which);
        });
    mappings = { // map a WASD key to an arrow key
        65: 37, // A
        87: 38, // W
        83: 40, // S
        68: 39, // D
        32: 38 // SPACE
    };
}());
