/*jshint browser: true, node: true*/
(function () {
    'use strict';
    var world,
        SetMovementWorld,
        Movement,
        Math2D,
        Class;
    if (typeof require === 'function') {
        Class = require('./inheritance.js').Class;
        Math2D = require('./math2d.js').Math2D;
    } else {
        // If in browser, appropriate stuff has already been included.
        Class = window.Class;
        Math2D = window.Math2D;
    }
    SetMovementWorld = function (newWorld) {
        world = newWorld;
    };
    Movement = Class.extend({
        movementStart: undefined, //if undefined then stopped
        accelerationTime: 0,
        // TODO gravity and being affected by it.
        // TODO accel too.
        init: function (position, collisionSize) {
            this.size = collisionSize || {x: 0, y: 0};
            this.collisionSize = collisionSize || {x: 0, y: 0};
            this.position = position || {x: 0, y: 0};
            this.delta = {x: 0, y: 0};
        },
        getExpectedStop: function (secondsLimit) {
            // Get whether and when this box is going to stop.
            return world.movingBoxInWorld(
                this.position, this.collisionSize, this.delta, false,
                secondsLimit);
        },
        currentPosition: function (atTime) {
            atTime = atTime || +new Date();
            return this.predictPosition(atTime - this.movementStart);
        },
        isMoving: function () {
            return this.movementStart !== undefined;
        },
        predictPosition: function (time) {
            if (this.movementStart){
                return Math2D.vectorAdd(
                    Math2D.accelerate(this.delta, this.accelerationTime, time),
                    this.position);
            } else {
                return this.position;
            }
        },
        partialUpdate: function (data) {
            if (data.position || data.delta) {
                this.position = this.currentPosition();
                this.movementStart = data.startedMoving;
                if (!this.movementStart && data.delta && Math2D.vectorBool(data.delta)) {
                    this.movementStart = +new Date();
                }
            } else {
                return;
            }
            if (data.position) {
                this.position.x = data.position.x === undefined ? this.position.x : data.position.x;
                this.position.y = data.position.y === undefined ? this.position.y : data.position.y;
            }
            if (data.delta) {
                this.delta.x = data.delta.x === undefined ? this.delta.x : data.delta.x;
                this.delta.y = data.delta.y === undefined ? this.delta.y : data.delta.y;
            }
        }
    });
    try {
        module.exports.Movement = Movement;
        module.exports.SetMovementWorld = SetMovementWorld;
    } catch (e) {
        window.Movement = Movement;
        window.SetMovementWorld = SetMovementWorld;
    }
}());
