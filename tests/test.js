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
                    /*
                
                     p2
                 x  /  
                   /
                  /
                 p1
                
            */

        equal(world.halfPlaneInWorld(
            {x: 0, y: 290}, {x: 10, y: 290}), false,
            'horizontal half plane above everything');
        equal(world.halfPlaneInWorld(
            {x: 10, y: 290}, {x: 0, y:290}), true,
            'horizontal half plane above everything (pointing down)');
        equal(world.halfPlaneInWorld(
            {x: 0, y: 310}, {x: 10, y: 310}), true,
            'not so above everything');
        equal(world.halfPlaneInWorld(
            {x: 10, y: 310}, {x: 0, y: 310}), true,
            'not so above everything (pointing down)');
        equal(world.halfPlaneInWorld(
            {x: 10, y: 620}, {x: 0, y: 620}), false,
            'horizontal half plane below everything');
        equal(world.halfPlaneInWorld(
            {x: 0, y: 620}, {x: 10, y: 620}), true,
            'horizontal half plane below everything (pointing up)');
        equal(world.halfPlaneInWorld(
            {x: 10, y: 600}, {x: 0, y: 600}), true,
            'horizontal half plane not so below everything');
        equal(world.halfPlaneInWorld(
            {x: 0, y: 600}, {x: 10, y: 600}), true,
            'horizontal half plane not so below everything (pointing up)');
        equal(world.halfPlaneInWorld(
            {x: 20, y: 10}, {x: 20, y: 0}), false,
            'Vertical half plane to the left of everything');
        equal(world.halfPlaneInWorld(
            {x: 20, y: 0}, {x: 20, y: 10}), true,
            'Vertical half plane to the left of everything (pointing right)');
        equal(world.halfPlaneInWorld(
            {x: 460, y: 10}, {x: 460, y: 0}), true,
            'Vertical half plane to the right of everything (pointing left)');
        equal(world.halfPlaneInWorld(
            {x: 460, y: 0}, {x: 460, y: 10}), false,
            'Vertical half plane to the right of everything (pointing right)');
        equal(world.halfPlaneInWorld(
            {x: 440, y: 10}, {x: 440, y: 0}), true,
            'Not-so to the right of everything (pointing left)');
        equal(world.halfPlaneInWorld(
            {x: 440, y: 0}, {x: 440, y: 10}), true,
            'Not-so to the right of everything (pointing right)');
        equal(world.halfPlaneInWorld(
            {x: 40, y: 10}, {x: 40, y: 0}), true,
            'Not-so to the left of everything (pointing left)');
       equal(world.halfPlaneInWorld(
            {x: 40, y: 0}, {x: 40, y: 10}), true,
            'Not-so to the left of everything (pointing right)');
        equal(world.halfPlaneInWorld(
            {x: 0, y: 0}, {x: 349, y: 409}), true,
            'slightly different half plane, colliding with big box.');
        equal(world.halfPlaneInWorld(
            {x: 0, y: 0}, {x: 349, y: 409}), true,
            'slightly different half plane, colliding with big box. (pointing down)');
        equal(world.halfPlaneInWorld(
            {x: -1, y: 1}, {x: 1, y: -1}), false,
            'slanted half plane excluding everything');
        equal(world.halfPlaneInWorld(
            {x: 1, y: -1}, {x: -1, y: 1}), true,
            'slanted half plane including everything');
        try{
            world.halfPlaneInWorld({x: 10, y: 10}, {x: 10, y: 10});
            ok(false, 'Bad half plane raises no exception.');
        } catch (e) {
            ok(true, 'Bad half plane raised exception');
        }
    });
    test('World collision tests 2', function () {
        
    });
    test('Octree tests', function () {
        expect(0);
    });
}(window));
