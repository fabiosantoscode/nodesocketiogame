function setUpKeys(player) {
    var pressedKeys = 0,
        sides,
        lastAction = 0,
        interestingKeys,
        foundKey,
        event,
        mappings,
        lastPressed,
        secondToLastPressed;
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
    /*
    updateKeys = function () {
        if (pressedKeys[LEFT]) {
            player.moveToSide(1);
        } else if (pressedKeys[RIGHT]) {
            player.moveToSide(-1);
        }
    };
    */
    $(window)
        .on('keydown', function (e) {
            secondToLastPressed = lastPressed;
            lastPressed = e.which;
            pressedKeys[mappings[e.which] || e.which] = true;
        })
        .on('keydown', function (e) {
            var key = mappings[e.which] || e.which,
                action = sides[key];
            if (action && action !== lastAction) {
                lastAction = action;
                if (action === 'jump') {
                    player.startJump();
                } else {
                    player.moveToSide(action);
                }
            }
        })
        .on('keyup', function (e) {
            pressedKeys[mappings[e.which] || e.which] = false;
        })
        .on('keyup', function (e) {
            var key = mappings[e.which] || e.which,
                action = sides[key];
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
