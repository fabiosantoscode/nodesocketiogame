(function (window) {
    'use strict';
    var World = window.World,
        testWorldObjects = [
            {
                type: 'platform',
                position: {x: 60, y: 400},
                size: {w: 200, h: 5},
                collision: 'rect'
            }, {
                type: 'platform',
                position: {x: 30, y: 300},
                size: {w: 100, h: 5},
                collision: 'rect'
            }, {
                type: 'platform',
                position: {x: 350, y: 410},
                size: {w: 100, h: 200},
                collision: 'rect'
            }
        ],
        roundVector = function (v) {
            return {
                x: Math.round(v.x * 10) / 10,
                y: Math.round(v.y * 10) / 10
            };
        };
    test('2d math functions', function () {
        equal(Math2D.halfPlaneAngle(
            {x: 0, y: 0}, {x: 0, y: 15}), Math.PI / 2, 'Half plane angle detection');
        equal(Math2D.halfPlaneAngle(
            {x: 0, y: 0}, {x: 0, y: -15}), Math.PI * (3 / 2), 'Half plane angle detection');
        equal(Math2D.halfPlaneAngle(
            {x: 10, y: 10}, {x: 10, y: 11}), Math.PI / 2, 'Half plane angle detection');
        equal(Math2D.halfPlaneAngle(
            {x: 10, y: 10}, {x: 10, y: 0}), Math.PI * (3 / 2), 'Half plane angle detection');
        
        equal(Math2D.pointInHalfPlane(
            {x: 10, y: 290}, {x: 0, y:290},
            {x: 30, y: 30}), false, 'Point in half plane pointing away');
        equal(Math2D.pointInHalfPlane(
            {x: 0, y: 290}, {x: 10, y: 290},
            {x: 30, y: 30}), true, 'Point in half plane pointing into it');
        
        deepEqual(Math2D.vectorAdd(
            {x: 1, y: 1}, {x: 1, y: 1}),
            {x: 2, y: 2}, 'Add two vectors');
        
        equal(Math2D.angleBetween2Points(
            {x: -10, y: -10}, {x: 0, y: 0}), Math.PI * (1 / 4),
            'Angle between 2 points');
        
        deepEqual(roundVector(Math2D.rotatePoint(
            {x: 0, y: 0}, {x: 1, y: 0}, Math.PI / 2)), {x: 0, y: 1},
            'rotatePoint');
        deepEqual(roundVector(Math2D.rotatePoint(
            {x: 1, y: 0}, Math.PI / 2)), {x: 0, y: 1},
            'rotatePoint');
        deepEqual(Math2D.pointsOfBox(
            {x: 1, y: 1}, {h: 9, w: 9}), [
                {x: 1 , y: 1},
                {x: 1, y: 10},
                {x: 10, y: 10},
                {x: 10, y: 1}
            ], 'pointsOfBox');
    });
    test('Calculating acceleration', function () {
        var delta = {x: 1000, y: 0},
            accelerationTime = 1200,
            time = 1000,
            d;
        d = Math2D.accelerate(delta, 0, time).x;
        equal(d, 1000, 'when accelerationTime === 0 we get immediate acceleration');
        d = Math2D.accelerate(delta, accelerationTime, 0).x;
        equal(d, 0, 'when time === 0 we get nowhere');
        d = Math2D.accelerate({x: 0, y: 0}, accelerationTime, time).x;
        equal(d, 0, 'when delta === {} we get nowhere');
        
        accelerationTime = 500;
        d = Math2D.accelerate(delta, accelerationTime, time).x;
        ok(d > 0, 'd greater than 0');
        ok(d < 1000, 'd less than time');
    });
    test('Fix moving box query bugs', function () {
        var size = {w: 2, h: 2},
            lotsOfTime = 10,
            world = new World([{
                position: {x: 10, y: 10},
                size: {w: 10, h: 10},
                collision: 'rect'
            }]);
        deepEqual(world.movingBoxInWorld({x: -1, y: 21}, size,
            {x: 10, y: -10}, true, lotsOfTime), true,
            'delta X >= 0 and delta Y <= 0');
        deepEqual(world.movingBoxInWorld({x: 21, y: -1}, size,
            {x: -10, y: 10}, true, lotsOfTime), true,
            'delta X <= 0 and delta Y >= 0');
        deepEqual(world.movingBoxInWorld({x: 21, y: 21}, size,
            {x: -10, y: -10}, true, lotsOfTime), true,
            'delta X and Y <= 0');
        deepEqual(world.movingBoxInWorld({x: -1, y: -1}, size,
            {x: 10, y: 10}, true, lotsOfTime), true,
            'delta X and Y >= 0');
        size = {w: 10, h: 10};
        deepEqual(world.movingBoxInWorld({x: -1, y: 21}, size,
            {x: 10, y: -10}, true, lotsOfTime), true,
            'delta X >= 0 and delta Y <= 0');
        deepEqual(world.movingBoxInWorld({x: 21, y: -1}, size,
            {x: -10, y: 10}, true, lotsOfTime), true,
            'delta X <= 0 and delta Y >= 0');
        deepEqual(world.movingBoxInWorld({x: 21, y: 21}, size,
            {x: -10, y: -10}, true, lotsOfTime), true,
            'delta X and Y <= 0');
        deepEqual(world.movingBoxInWorld({x: -1, y: -1}, size,
            {x: 10, y: 10}, true, lotsOfTime), true,
            'delta X and Y >= 0');
    });
    test('Advanced moving box queries', function () {
        var size = {w: 10, h: 10},
            world = new World([{
                // Three x-axis-aligned boxes.
                position: {x: 10, y: 0},
                size: size,
                collision: 'rect'
            },{
                position: {x: 30, y: 0},
                size: size,
                collision: 'rect'
            },{
                position: {x: 20, y: 0},
                size: size,
                collision: 'rect'
            }]),
            result,
            d;
        deepEqual(world.movingBoxInWorld({x: -10, y: 0}, size, {x: 10, y: 0}, false, 0.99), undefined, 'no collision');
        result = world.movingBoxInWorld({x: -10, y: 0}, size, {x: 10, y: 0}, false, 1.5);
        ok(result.time > 999 && result.time < 1201, 'result time');
        deepEqual(result.list, [world.objects[0]], 'result collision list');
        d = Math2D.vectorDistance(result.position, world.objects[0].position);
        ok(d < 10 && d > 0, 'result position');
    });
    test('World class tests', function () {
        var world = new World(testWorldObjects);
        equal(world.getObjects().length, 3);
    });
    test('World collision tests (legacy)', function () {
        var world = new World(testWorldObjects),
            smallWorld = new World([{
                position: {x: 10, y: 10},
                size: {h: 10, w: 10},
                collision: 'rect'
            }]);
        
        // Point Collision
        equal(world.pointInWorld(-10, -10, true), false, 'test point outside the big box');
        equal(world.pointInWorld(355, 415, true), true, 'test point inside the big box');
        equal(world.pointInWorld(345, 409, true), false, 'test point to the left and above of the big box');
        equal(world.pointInWorld(345, 611, true), false, 'test point to the left and below the big box');
        equal(world.pointInWorld(455, 611, true), false, 'test point to the right and below the big box');
        // Moving Point Collision
        // unimpl.
        // Bounding Box Collision
        equal(world.boxInWorld(
            {x: 10, y: 10},
            {w: 10, h: 10}, true), false, 'test box completely outside the big box');
        equal(world.boxInWorld(
            {x: 340, y: 409},
            {w: 20, h: 20}, true), true, 'test box half inside the big box');
        equal(world.boxInWorld(
            {x: 360, y: 411},
            {w: 10, h: 10}, true), true, 'test box fully inside the big box');
        // Moving Bounding Box Collision
        equal(world.movingBoxInWorld(
            {x: 330, y: 410}, // position
            {w: 10, h: 10}, // size
            {x: 20, y: 0}, // delta
            true,
            10 * 1000),
            true, 'Moving bounding box set to hit the world.');
        equal(world.movingBoxInWorld(
            {x: 330, y: 390}, // position
            {w: 10, h: 10}, // size
            {x: 10, y: 0}, // delta
            true,
            100),
            false, 'Moving bounding box which wont hit the world.');
    });
    test('Half plane world collision tests', function () {
        /*
                
                     p2
                 x  /  
                   /
                  /
                 p1
                
            */
        var world = new World(testWorldObjects);
        equal(world.halfPlaneInWorld(
            {x: 0, y: 290}, {x: 10, y: 290}, true), false,
            'horizontal half plane above everything');
        equal(world.halfPlaneInWorld(
            {x: 10, y: 290}, {x: 0, y:290}, true), true,
            'horizontal half plane above everything (pointing down)');
        equal(world.halfPlaneInWorld(
            {x: 0, y: 310}, {x: 10, y: 310}, true), true,
            'not so above everything');
        equal(world.halfPlaneInWorld(
            {x: 10, y: 310}, {x: 0, y: 310}, true), true,
            'not so above everything (pointing down)');
        equal(world.halfPlaneInWorld(
            {x: 10, y: 620}, {x: 0, y: 620}, true), false,
            'horizontal half plane below everything');
        equal(world.halfPlaneInWorld(
            {x: 0, y: 620}, {x: 10, y: 620}, true), true,
            'horizontal half plane below everything (pointing up)');
        equal(world.halfPlaneInWorld(
            {x: 10, y: 600}, {x: 0, y: 600}, true), true,
            'horizontal half plane not so below everything');
        equal(world.halfPlaneInWorld(
            {x: 0, y: 600}, {x: 10, y: 600}, true), true,
            'horizontal half plane not so below everything (pointing up)');
        equal(world.halfPlaneInWorld(
            {x: 20, y: 10}, {x: 20, y: 0}, true), false,
            'Vertical half plane to the left of everything');
        equal(world.halfPlaneInWorld(
            {x: 20, y: 0}, {x: 20, y: 10}, true), true,
            'Vertical half plane to the left of everything (pointing right)');
        equal(world.halfPlaneInWorld(
            {x: 460, y: 10}, {x: 460, y: 0}, true), true,
            'Vertical half plane to the right of everything (pointing left)');
        equal(world.halfPlaneInWorld(
            {x: 460, y: 0}, {x: 460, y: 10}, true), false,
            'Vertical half plane to the right of everything (pointing right)');
        equal(world.halfPlaneInWorld(
            {x: 440, y: 10}, {x: 440, y: 0}, true), true,
            'Not-so to the right of everything (pointing left)');
        equal(world.halfPlaneInWorld(
            {x: 440, y: 0}, {x: 440, y: 10}, true), true,
            'Not-so to the right of everything (pointing right)');
        equal(world.halfPlaneInWorld(
            {x: 40, y: 10}, {x: 40, y: 0}, true), true,
            'Not-so to the left of everything (pointing left)');
        equal(world.halfPlaneInWorld(
            {x: 40, y: 0}, {x: 40, y: 10}, true), true,
            'Not-so to the left of everything (pointing right)');
        equal(world.halfPlaneInWorld(
            {x: 0, y: 0}, {x: 349, y: 409}, true), true,
            'slightly different half plane, colliding with big box.');
        equal(world.halfPlaneInWorld(
            {x: 0, y: 0}, {x: 349, y: 409}, true), true,
            'slightly different half plane, colliding with big box. (pointing down)');
        equal(world.halfPlaneInWorld(
            {x: -1, y: 1}, {x: 1, y: -1}, true), false,
            'slanted half plane excluding everything');
        equal(world.halfPlaneInWorld(
            {x: 1, y: -1}, {x: -1, y: 1}, true), true,
            'slanted half plane including everything');
        try{
            world.halfPlaneInWorld({x: 10, y: 10}, {x: 10, y: 10});
            ok(false, 'Bad half plane raises no exception.');
        } catch (e) {
            ok(true, 'Bad half plane raised exception');
        }
        equal(world.halfPlaneInWorld({x: 0, y: 0}, {x: 10, y: 0}).length,
            0, 'query nothing');
        equal(world.halfPlaneInWorld({x: 10, y: 0}, {x: 0, y: 0}).length,
            testWorldObjects.length, 'query all objects');
        // Now for corner cases.
        world = new World([{
                type: 'platform',
                position: {x: 10, y: 10},
                size: {w: 90, h: 90},
                collision: 'rect'
            }]);
        equal(world.halfPlaneInWorld(
            {x: 9, y: 11}, {x: 11, y: 9}, true), false,
            'Upper left corner case');
        equal(world.halfPlaneInWorld(
            {x: 11, y: 13}, {x: 13, y: 11}, true), true,
            'Upper left corner case 2');
        equal(world.halfPlaneInWorld(
            {x: 101, y: 9}, {x: 102, y: 10}, true), false,
            'Upper right corner case');
        equal(world.halfPlaneInWorld(
            {x: 98, y: 10}, {x: 99, y: 11}, true), true,
            'Upper right corner case 2');
        equal(world.halfPlaneInWorld(
            {x: 11, y: 103}, {x: 9, y: 101}, true), false,
            'Lower left corner case');
        equal(world.halfPlaneInWorld(
            {x: 12, y: 100}, {x: 10, y: 98}, true), true,
            'Lower left corner case 2');
        equal(world.halfPlaneInWorld(
            {x: 102, y: 100}, {x: 101, y: 101}, true), false,
            'Lower right corner case');
        equal(world.halfPlaneInWorld(
            {x: 100, y: 98}, {x: 99, y: 99}, true), true,
            'Lower right corner case 2');
    });
    test('boxInWorld tests', function () {
        var objects = [{
                type: 'platform',
                position: {x: 10, y: 10},
                size: {w: 90, h: 90},
                collision: 'rect'
            }],
            world = new World(objects);
        equal(world.boxInWorld({x: 0, y: 0}, {h: 9, w: 9}, true), false, 'Top left');
        equal(world.boxInWorld({x: 101, y: 0}, {h: 9, w: 9}, true), false, 'Top right');
        equal(world.boxInWorld({x: 0, y: 101}, {h: 9, w: 9}, true), false, 'Bottom left');
        equal(world.boxInWorld({x: 101, y: 101}, {h: 9, w: 9}, true), false, 'Bottom right');
        equal(world.boxInWorld({x: 2, y: 2}, {h: 9, w: 9}, true), true, 'Top left 2');
        equal(world.boxInWorld({x: 98, y: 2}, {h: 9, w: 9}, true), true, 'Top right 2');
        equal(world.boxInWorld({x: 2, y: 98}, {h: 9, w: 9}, true), true, 'Bottom left 2');
        equal(world.boxInWorld({x: 98, y: 98}, {h: 9, w: 9}, true), true, 'Bottom right 2');
        ok(world.boxInWorld({x: 0, y: 0}, {h: 9, w: 9}), 'Top left (obj mode)');
        ok(world.boxInWorld({x: 101, y: 0}, {h: 9, w: 9}), 'Top right (obj mode)');
        ok(world.boxInWorld({x: 0, y: 101}, {h: 9, w: 9}), 'Bottom left (obj mode)');
        ok(world.boxInWorld({x: 101, y: 101}, {h: 9, w: 9}), 'Bottom right (obj mode)');
        ok(world.boxInWorld({x: 2, y: 2}, {h: 9, w: 9}), 'Top left 2 (obj mode)');
        ok(world.boxInWorld({x: 98, y: 2}, {h: 9, w: 9}), 'Top right 2 (obj mode)');
        ok(world.boxInWorld({x: 2, y: 98}, {h: 9, w: 9}), 'Bottom left 2 (obj mode)');
        ok(world.boxInWorld({x: 98, y: 98}, {h: 9, w: 9}), 'Bottom right 2 (obj mode)');
    });
    test('Octree tests', function () {
        expect(0);
    });
}(window));
