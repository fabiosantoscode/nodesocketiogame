(function (window) {
    'use strict';
    var Movement = window.Movement,
        world = new window.World([{
                position: {x: 10, y: -10},
                size: {h: 100, w: 100},
                collision: 'rect'
            }]),
        movementFactory = function (position, size) {
            return new Movement(
                position || {x: 0, y: 0},
                size || {h: 10, w: 10});
        };
    window.SetMovementWorld(world);
    test('get expected stop data', function () {
        var entity = movementFactory();
        entity.delta = {x: 10, y: 0};
        entity.startedMoving = new Date();
        ok(entity.getExpectedStop(1000));
        entity.delta.x -= 20;
        ok(!entity.getExpectedStop(1000));
    });
}(window));
