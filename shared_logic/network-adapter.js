/*jshint browser: true, node: true*/
(function () {
    'use strict';
    var Class,
        NetworkAdapter;

    try {
        Class = window.Class;
    } catch (e) {
        Class = require('./inheritance.js').Class;
    }

    NetworkAdapter = Class.extend({
        init: function (socket) {
            if (!socket) {
                throw new Error('new NetworkAdapter() requires socket.io socket as argument');
            }
            this.socket = socket;
        },
        sendPlayerMovement: function (player, side) {
            this.socket.emit('player-move', {
                position: player.currentPosition(),
                direction: side
            });
        }
    });

    try {
        window.NetworkAdapter = NetworkAdapter;
    } catch (e) {
        module.exports.NetworkAdapter = NetworkAdapter;
    }
}());
