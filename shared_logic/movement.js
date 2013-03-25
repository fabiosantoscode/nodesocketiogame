/*jshint browser: true, node: true*/
(function () {
    'use strict';
    var world,
        SetMovementWorld,
        Movement,
        Math2D,
        EventEmitter;
    try {
        require('./inheritance.js');
        Math2D = require('./math2d.js').Math2D;
        EventEmitter = require('./eventemitter.js').EventEmitter;
    } catch (e) {
        // If in browser, appropriate stuff has already been included.
        Math2D = window.Math2D;
        EventEmitter = window.EventEmitter;
    }
    SetMovementWorld = function (newWorld) {
        world = newWorld;
    };
    Movement = Class.extend({
        movementStart: undefined, //if undefined then stopped
        position: {x: 0, y: 0},
        delta: {x: 0, y: 0},
        size: {w: 0, h: 0},
        accelerationTime: 0,
        // TODO gravity and being affected by it.
        // TODO accel too.
        collisionSize: {},
        events: undefined, // an EventEmitter
        init: function (position, collisionSize) {
            this.events = new EventEmitter();
            this.collisionSize = collisionSize;
            this.position = position;
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
        }/*,
        onExpectedStop: function (callback, world) {
            this.startExpectedStopEventLoop();
            this.events.on('haveToStop', callback);
        },
        startExpectedStopEventLoop: function () {
            if (!this.expectedStopEventLoopStarted) {
                this.expectedStopEventLoop();
            }
        },
        expectedStopEventLoopStarted: false,
        expectedStopEventLoop: function () {
            // This is for walking and being able to setTimeout and warning the entity to change direction.
            var worldQueryResult,
                that = this;
            worldQueryResult = this.getExpectedStop(1000);
            if (worldQueryResult) {
                setTimeout(function () {
                    that.events.emit('haveToStop', worldQueryResult);
                }, worldQueryResult.time);
                this.expectedStopEventLoopStarted = false;
            } else {
                setTimeout(function () {
                    that.expectedStopEventLoop();
                }, 1000);
            }
        }*/
    });
    try {
        module.exports.Movement = Movement;
        module.exports.SetMovementWorld = SetMovementWorld;
    } catch (e) {
        window.Movement = Movement;
        window.SetMovementWorld = SetMovementWorld;
    }
}());
