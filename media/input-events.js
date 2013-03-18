(function () {
    'use strict';
    var $ = window.jQuery,
        sides = {},
        revSides = {},
        mappings = {},
        keyInput,
        realKey;
    realKey = function (key) {
        // Get mapped key code from a key alias, or just from a key
        var realk = mappings[key] || key;
        return revSides[key] || realk;
    };
    window.keyInput = keyInput = {
        _events: new window.EventEmitter(),
        pressedKeys: {},
        pressedThisFrame: {},
        releasedThisFrame: {},
        isPressed: function (key) {
            return this.pressedKeys[realKey(key)];
        },
        wasReleased: function (key) {
            return this.releasedThisFrame[realKey(key)];
        },
        wasPressed: function (key) {
            return this.pressedThisFrame[realKey(key)];
        },
        pressKey: function (key) {
            key = realKey(key);
            this.pressedThisFrame[key] = true;
            this.pressedKeys[key] = true;
            this._events.trigger('press', key);
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
    sides = {
        37: -1, /*left*/
        38: 'jump', /*up*/
        39: 1, /*right*/
        40: 'crouch' /* down */
    };
    revSides[-1] = 37;
    revSides['jump'] = 38;
    revSides[1] = 39;
    revSides['crouch'] = 40;
    mappings = { // map a WASD key to an arrow key
        65: 37, // A
        87: 38, // W
        83: 40, // S
        68: 39, // D
        32: 38 // SPACE
    };
}());
