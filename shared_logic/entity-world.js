/*jshint browser: true, devel: true, node: true */
(function () {
    'use strict';
    var client, server;
    if (typeof require === 'function') {
        server = true;
        var Class = require('./inheritance.js').Class;
        var Math2D = require('./math2d.js').Math2D;
        var Entity = require('./entity.js').Entity;
        var World = require('./world.js').World;
        var underscore = require('underscore');
    } else {
        server = false;
        var Class = window.Class;
        var Math2D = window.Math2D;
        var Entity = window.Entity;
        var World = window.World;
        var underscore = undefined;
    }
    client = !server;
    var EntityWorld = World.extend({
        collisionSize: {},
        events: undefined, // an EventEmitter
        init: function () {
            this.entityCount = 0;
            this.uid = 1;
            this.version = 1; // unused in the client
            this.entities = {};
            this._super();
            if (server) {
                this.send = underscore.throttle(this.send, 20);
            } else {
                this.send = function () {};
            }
        },
        startServer: function (io) {
            var that = this;
            this.io = io;
            io.sockets.on('connection', function (socket) {
                var player,
                    playerSpeed = 350.0, // pixels per second.
                    createData,
                    playerPing = 100; // half a ping
                player = that.attach(new Entity({x: 0, y: 479}));
                player.getPing = function () {return playerPing;};
                player.getSocket = function () {return socket;};
                socket.on('ready', function (callback) {
                    pinger();
                    callback({
                        position: player.position,
                        id: player.id
                    });
                    that.sendTo(player);
                });
                socket.on('player-move', function (data) {
                    player.partialUpdate({
                        delta: {x: +data.direction * playerSpeed},
                        startedMoving: +new Date()
                    });
                    player.lastChanged = that.bumpVersion();
                });
                socket.on('world-update-ack', function (version) {
                    player.latestAck = version;
                });
                var pinger = function () {
                    var pingStarted = +new Date();
                    socket.once('pong-event', function () {
                        playerPing = (+new Date() - pingStarted) / 2;
                        pinger.timeout = setTimeout(pinger, 10000);
                    });
                    socket.emit('ping-event', playerPing);
                };
                socket.on('disconnect', function () {
                    clearTimeout(pinger.timeout);
                    that.detach(player);
                });
            });
        },
        send: function () {
            this.iterate(this.sendTo.bind(this));
        },
        sendTo: function (player) {
            var compressed = this.deltaCompress(player.latestAck || -1);
            player.getSocket().emit('world-update', compressed);
        },
        startClient: function (socket, player) {
            var that = this;
            this.socket = socket;
            this.player = player;
            this.entities[player.id] = player;
            this.socket.on('world-update', function (data) {
                that.deltaUncompress(data);
                that.socket.emit('world-update-ack', data.changed);
            })
        },
        getEntityCount: function () {
            return this.entityCount;
        },
        attach: function (entity) {
            // (server-only) attach an entity to this world.
            if (entity.id && this.entities[entity.id]) {
                throw new Error('Entity already exists!');
            }
            this.entityCount += 1;
            this.uid += 1;
            entity.id = this.uid;
            this.entities[entity.id] = entity;
            return entity;
        },
        detach: function (entity) {
            // (server-only) detach an entity
            if (this.entities[entity.id]) {
                this.entityCount -= 1;
                this.entities[entity.id] = {
                        id: entity.id,
                        removed: true,
                        lastChanged: this.bumpVersion()
                    };
            }
        },
        iterate: function (callback, findRemoved) {
            var entities = this.entities,
                ent;
            for (ent in entities) {
                if (entities.hasOwnProperty(ent)) {
                    if (entities[ent]) {
                        if ((!entities[ent].removed) || findRemoved) {
                            callback(entities[ent]);
                        }
                    }
                }
            }
        },
        getVersion: function () {
            return this.version;
        },
        bumpVersion: function () {
            this.version += 1;
            this.send();
            return this.version;
        },
        deltaCompress: function (fromVersion) {
            // Make a delta compressed version of the world
            // (Check which objects have changed. This client only needs to know those.)
            var data = {
                    changed: this.version,
                    entities: {}
                };
            this.iterate(function (entity) {
                if (entity.lastChanged >= fromVersion || entity.lastChanged === undefined) {
                    if (entity.toPacket) {
                        data.entities[entity.id] = entity.toPacket();
                    } else if (entity.removed) {
                        data.entities[entity.id] = entity;
                    }
                }
            }, true);
            return data;
        },
        deltaUncompress: function (data) {
            // Uncompress a delta into this entity world.
            // data = {changed: x, entities: {id: ..., command: 'remove'}, ...}
            var id,
                entity,
                ordinal = data.changed,
                entities = data.entities;
            // Is this out of date?
            if (ordinal < this.latestUpdateReceived) {
                return false;
            } else {
                this.latestUpdateReceived = ordinal;
            }
            for (id in entities) {
                if (entities.hasOwnProperty(id)) {
                    if (entities[id].removed) {
                        delete this.entities[id];
                        continue;
                    }
                    if (this.entities[id] === undefined) {
                        this.entities[id] = new Entity(Math2D.origin, this);
                        this.entities[id].id = +id;
                        this.entityCount += 1;
                    }
                    entity = this.entities[id];
                    entity.partialUpdate(data.entities[id]);
                }
            }
            return true;
        }
    });
    if (server) {
        module.exports.EntityWorld = EntityWorld;
    } else {
        window.EntityWorld = EntityWorld;
    }
}());
