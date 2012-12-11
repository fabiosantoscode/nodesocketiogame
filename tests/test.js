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
        ];
    test('World class tests', function () {
        var world = new World(testWorldObjects);
        equal(world.getObjects().length, 3);
    });
    test('World collision tests', function () {
        var world = new World(testWorldObjects);
        // Point Collision
        equal(world.pointInWorld(-10, -10), false, 'test point outside the big box');
        equal(world.pointInWorld(355, 415), true, 'test point inside the big box');
        equal(world.pointInWorld(345, 409), false, 'test point to the left and above of the big box');
        equal(world.pointInWorld(345, 611), false, 'test point to the left and below the big box');
        equal(world.pointInWorld(455, 611), false, 'test point to the right and below the big box');
        // Moving Point Collision
        // unimpl.
        // Bounding Box Collision
        equal(world.boxInWorld(
            {x: 10, y: 10},
            {w: 10, h: 10}), false, 'test box completely outside the big box');
        equal(world.boxInWorld(
            {x: 340, y: 409},
            {w: 20, h: 20}), true, 'test box half inside the big box');
        equal(world.boxInWorld(
            {x: 360, y: 411},
            {w: 10, h: 10}), true, 'test box fully inside the big box');
        // Moving Bounding Box Collision
        // Half plane collision
        /*equal(world.halfPlaneInWorld(
            {x: 0, y:0}, {x: 10, 0}), false,
            'horizontal half plane above everything');
        equal(world.halfPlaneInWorld(
            {x: 0, y:0}, {x: 10, 0}), false,
            'horizontal half plane below everything');
        equal(world.halfPlaneInWorld(
            {x: 0, y:0}, {x: 10, 0}), false,
            'Vertical half plane to the left of everything');
        equal(world.halfPlaneInWorld(
            {x: 0, y:0}, {x: 10, 0}), false,
            'Vertical half plane to the right of everything');
        equal(world.halfPlaneInWorld(
            {x: 0, y:0}, {x: 349, 409}), true,
            'slightly different half plane, colliding with big box.');
        try{
            ok(false, 'Bad half plane raises no exception.');
        } catch (e) {
            ok(true, 'Bad half plane raised exception');
        }*/
    });
    test('Octree tests', function () {
        
    });
}(window));
