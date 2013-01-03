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
    test('predict position', function () {
        var entity = movementFactory();
        deepEqual(entity.predictPosition(1000), entity.position);
        entity.delta.x = 1;
        entity.startedMoving = +new Date();
        deepEqual(entity.predictPosition(1000), {x: 1, y: 0});
    });
    test('current position', function () {
        var entity = movementFactory();
        entity.delta.x = 1;
        entity.startedMoving = 1000;
        deepEqual(entity.currentPosition(1000), {x: 0, y: 0});
        deepEqual(entity.currentPosition(2000), {x: 1, y: 0});
    });
    test('get expected stop data', function () {
        var entity = movementFactory();
        entity.delta = {x: 10, y: 0};
        entity.startedMoving = new Date();
        ok(entity.getExpectedStop(1000));
        entity.delta.x -= 20;
        ok(!entity.getExpectedStop(1000));
    });
    test('freshest upcoming event', 2, function () {
        var event = new FreshestUpcomingEvent();
        event.on(function (data) {
            equal(data, 3);
        });
        event.trigger(3);
        
        stop();
        event.on(function () {
            start();
            ok(true);
        });
        event.later(10);
    });
}(window));
