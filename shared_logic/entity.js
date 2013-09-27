/*jshint browser: true, node: true*/
(function () {
    'use strict';
    var Class,
        Math2D;
    try {
        Class = require('./inheritance.js').Class;
        Math2D = require('./math2d.js').Math2D;
    } catch(e) {
        Class = window.Class;
        Math2D = window.Math2D;
    }
    function compensateForPing(packet, ping) {
        // Compensates startedMoving with local ping (ping) and for indirect ping
        // (which comes in packet.upstreamPing) a startedMoving timestamp is also
        // created if it does not exist.
        var compensation;
        compensation = ping || 0;
        compensation += packet.upstreamPing || 0;
        compensation += packet.sendDelay || 0;
        if (packet.startedMoving) {
            packet.startedMoving -= compensation;
        } else {
            packet.startedMoving = +new Date() - compensation;
        }
        return packet;
    }
    function SetMovementWorld(world_) {
        world = world_;
    }
    var world;
    /*
        Entity class:
            Broadcasted to all players who have it within their Camera's range.
            Contains hooks for syncing to server and clients
            Movement code
    */
    var Entity = Class.extend({
        movementStart: undefined, //if undefined then stopped
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
        partialUpdate: function (data, tellPeers) {
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
            if (tellPeers) {
                this.tellPeers();
            }
        },
        accelerationTime: 400,
        toPacket: function () {
            return {
                position: this.position,
                delta: this.delta,
                id: this.id
            };
        },
        update: function (data, tellPeers) {
            // Update this instance using a packet of data. It may have upstream ping.
            // the second argument
            data = compensateForPing(data, this.getPing());
            this.partialUpdate(data, false);
            if (tellPeers) {
                this.tellPeers(data);
            }
        },
        stop: function (where) {
            // TODO calculate stop position when accel is implemented.
            this.position = where;
            this.delta = {x: 0, y: 0};
            this.startedMoving = null;
        },
        getPing: function () {
            // The remote ping is available in the closures this class is used.
            // Just return it from the closure.
            throw new Error('Not implemented!');
        },
        tellPeers: function (packet) {
            // Inform the server or the client that something has changed.
            // Remember to set upstreamPing if necessary, and unset if not
            throw new Error('Not implemented!');
        }
    });
    try {
        module.exports.Entity = Entity;
        module.exports.SetMovementWorld = SetMovementWorld;
    } catch (e) {
        window.Entity = Entity;
        window.SetMovementWorld = SetMovementWorld;
    }
}());
