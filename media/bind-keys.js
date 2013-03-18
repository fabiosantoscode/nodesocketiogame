function setUpKeys(player) {
    'use strict';
    var pressedKeys = 0,
        sides,
        lastAction = 0,
        interestingKeys,
        foundKey,
        event,
        mappings,
        lastPressed,
        secondToLastPressed,
        keyInput = window.keyInput;
    interestingKeys = [37, 39];
    pressedKeys = {}; // Currently pressed keys
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
        if (action && action !== lastAction) {
            lastAction = action;
            if (action === 'jump') {
                player.startJump();
            } else {
                player.moveToSide(action);
            }
        }
    });
    keyInput.onRelease(function (key) {
        var action = sides[key];
        if (action === 'jump') {
            player.stopJump();
        } else if (action === 'crouch') {
            player.crouch();
        } else if (action !== undefined) { // left or right
            foundKey = 0;
            $.each(pressedKeys, function (ind, val) {
                if (val === true) {
                    foundKey = ind;
                    return false;
                }
            });
            if (foundKey) {
                event = jQuery.Event('keydown');
                event.which = foundKey;
                $(window).trigger(event);
            } else {
                player.moveToSide(0);
                lastAction = 0;
            }
        }
    });
}
