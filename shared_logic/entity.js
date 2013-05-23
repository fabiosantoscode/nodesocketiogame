/*jshint browser: true, node: true*/
(function () {
    'use strict';
    var Entity,
        Movement;
    if (typeof require === 'function') {
        Movement = require('./movement.js').Movement;
    } else {
        Movement = window.Movement;
    }
    /*
        Entity class:
            Broadcasted to all players who have it within their Camera's range.
            Contains hooks for syncing to server and clients
    */
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
    Entity = Movement.extend({
        accelerationTime: 400,
        init: function (position, collisionSize) {
            this._super(position, collisionSize || {h: 0, w: 0});
        },
        partialUpdate: function (data, tellPeers) {
            this._super(data);
            if (tellPeers) {
                this.tellPeers();
            }
        },
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
    } catch (e) {
        window.Entity = Entity;
    }
}());
