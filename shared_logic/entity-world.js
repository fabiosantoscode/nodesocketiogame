/*jshint browser: true, devel: true, node: true */
(function () {
    'use strict';
    var Class,
        Math2D,
        Entity,
        World,
        EntityWorld;
    if (typeof require === 'function') {
        Class = require('./inheritance.js').Class;
        Math2D = require('./math2d.js').Math2D;
        Entity = require('./entity.js').Entity;
        World = require('./world.js').World;
    } else {
        Class = window.Class;
        Math2D = window.Math2D;
        Entity = window.Entity;
        World = window.World;
    }
    var Pawn = Entity.extend({
        tellPeers: function () {
            var packet = this.toPacket();
            packet.upstreamPing = this.getPing();
            this.getSocket().broadcast.emit('pawn-update', packet);
        }
    });
    EntityWorld = World.extend({
        collisionSize: {},
        events: undefined, // an EventEmitter
        init: function () {
            this.entityCount = 0;
            this.uid = 1;
            this.version = 1; // unused in the client
            this.entities = {};
        },
        startServer: function (io) {
            var that = this;
            io.sockets.on('connection', function (socket) {
                var player,
                    playerSpeed = 350.0, // pixels per second.
                    createData,
                    playerPing = 100, // half a ping
                    pinger;
                that.socket = socket;
                player = that.attach(new Pawn({x: 0, y: 479}));
                player.getPing = function () {return playerPing;};
                player.getSocket = function () {return socket;};
                socket.on('ready', function (callback) {
                    pinger();
                    callback({
                        position: player.position,
                        id: player.id
                    });
                });
                socket.on('player-move', function (data) {
                    var timestamp = +new Date(),
                        stopping = player.isMoving() && !data.direction;
                    player.lastChanged = that.bumpVersion();
                    player.partialUpdate({
                        delta: {x: +data.direction * playerSpeed},
                        startedMoving: timestamp
                    });
                    if (stopping) {
                        socket.emit('player-position-correct', {
                            expected: player.currentPosition(timestamp)
                        });
                    }
                });
                pinger = function () {
                    var pingStarted = +new Date();
                    socket.once('pong-event', function () {
                        playerPing = +new Date() - pingStarted;
                        playerPing /= 2;
                        pinger.timeout = setTimeout(pinger, 10000);
                    });
                    socket.emit('ping-event', playerPing);
                };
                socket.on('disconnect', function () {
                    socket.broadcast.emit('pawn-remove', player.id);
                    clearTimeout(pinger.timeout);
                    that.detach(player);
                });
            });
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
            this.entities[this.uid] = entity;
            return entity;
        },
        detach: function (entity) {
            // (server-only) detach an entity
            if (this.entities[entity.id]) {
                this.entityCount -= 1;
                delete this.entities[entity.id];
                entity.id = undefined;
            }
        },
        iterate: function (callback) {
            var entities = this.entities,
                ent;
            for (ent in entities) {
                if (entities.hasOwnProperty(ent)) {
                    if (entities[ent]) {
                        callback(entities[ent]);
                    }
                }
            }
        },
        getVersion: function () {
            return this.version;
        },
        bumpVersion: function () {
            this.version += 1;
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
                if (entity.lastChanged > fromVersion || entity.lastChanged === undefined) {
                    data.entities[entity.id] = entity.toPacket();
                }
            });
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
            }
            console.log(entities);
            for (id in entities) {
                if (entities.hasOwnProperty(id)) {
                    if (this.entities[id] === undefined) {
                        this.entities[id] = new Entity(Math2D.origin, this);
                        this.entities[id].id = +id;
                    }
                    entity = this.entities[id];
                    entity.partialUpdate(data.entities[id]);
                }
            }
            return true;
        }
    });
    try {
        module.exports.EntityWorld = EntityWorld;
    } catch (e) {
        window.EntityWorld = EntityWorld;
    }
}());
