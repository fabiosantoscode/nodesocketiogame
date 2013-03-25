/*jshint browser: true, devel: true, node: true */
(function () {
    'use strict';
    var EntityWorld = Class.extend({
        collisionSize: {},
        events: undefined, // an EventEmitter
        init: function (world, physicsWorld) {
            this.entityCount = 0;
            this.uid = 1;
            this.version = 1; // unused in the client
            this.entities = {};
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
            entity.entityWorld = this;
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
