(function (require, exports) {
    'use strict';
    if (require) {
        require('./shared_logic/inheritance.js');
        require('./shared_logic/math2d.js');
        require('./shared_logic/EventEmitter.js');
    }
    var world;
    exports.SetMovementWorld = function (newWorld) {
        world = newWorld;
    };
    exports.Movement = Class.extend({
        startedMoving: undefined, //if undefined then stopped
        position: {x: 0, y: 0},
        delta: {x: 0, y: 0},
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
            return this.predictPosition(atTime - this.startedMoving);
        },
        predictPosition: function (time) {
            if (this.startedMoving){
                return Math2D.predictPosition(this.position, this.delta, time);
            } else {
                return this.position;
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
}(this.require, (this.module && this.module.exports) || window));
