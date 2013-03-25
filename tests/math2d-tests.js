/*globals asyncTest, deepEqual, equal, expect, module
, notDeepEqual, notEqual, notStrictEqual, ok, QUnit,
raises, start, stop, strictEqual, test */
(function (window) {
    'use strict';
    var roundVector = function (v) {
            return {
                x: Math.round(v.x * 10) / 10,
                y: Math.round(v.y * 10) / 10
            };
        }
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
    test('Interpolation', function () {
        var interp;
        interp = Math2D.lerp(Math2D.origin, Math2D.origin, 0.5);
        deepEqual(interp, Math2D.origin);
        
        interp = Math2D.lerp({x: 10, y: 10}, {x: 20, y: 20}, 0.5);
        deepEqual(interp, {x: 15, y: 15});
        
        interp = Math2D.lerp(Math2D.origin, {x: 10, y: 10}, 0);
        deepEqual(interp, Math2D.origin);
        
        interp = Math2D.lerp(Math2D.origin, {x: 10, y: 10}, 1);
        deepEqual(interp, {x: 10, y: 10});
    });
}(window));
