function setUpKeys(player) {
    'use strict';
    var sides, mappings;
    sides = {
        37: -1, /*left*/
        38: 'jump', /*up*/
        39: 1, /*right*/
        40: 'crouch' /* down */
    };
    mappings = { // map a WASD key to an arrow key
        65: 37, // A
        87: 38, // W
        83: 40, // S
        68: 39, // D
        32: 38 // SPACE
    };
    keyInput.onPress(function (key) {
        var action = sides[key];
        if (+action) { // Pressed a "side" key
            player.moveToSide(action);
        }
    });
    keyInput.onRelease(function (key) {
        var action = sides[key];
        if (+action) { // Released a "side" key
            player.moveToSide(0);
        }
    });
}
