(function () {
    'use strict';
    var Entity,
        Movement;
    try {
        Movement = require('./movement.js').Movement;
    } catch (e) {
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
        if (packet.startedMoving) {
            packet.startedMoving -= compensation;
        } else {
            packet.startedMoving = +new Date() - compensation;
        }
        return packet;
    }
    Entity = Movement.extend({
        accelerationTime: 800,
        init: function (position) {
            this.position.x = position.x || 0;
            this.position.y = position.y || 0;
        },
        partialUpdate: function (data, tellPeers) {
            this._super(data);
            if (tellPeers) {
                this.tellPeers();
            }
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
            // Send the argument `packet`, or create a packet using `this`.
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
