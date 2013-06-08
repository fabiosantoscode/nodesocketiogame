/*jshint browser: true, node: true*/
(function () {
    'use strict';
    var Camera,
        Class;
    try {
        Class = require('./inheritance.js').Class;
    } catch (e) {
        Class = window.Class;
    }
    Camera = Class.extend({
        offset: 0,
        init: function (lookAtEntity, world, canvasSize) {
            this.world = world;
            this.lookAtEntity = lookAtEntity;
            this.canvasSize = canvasSize;
        },
        absoluteCoordinates: function (vector) {
            return {
                x: vector.x + this.offset,
                y: vector.y
            };
        },
        offsetCoordinates: function (vector) {
            return {
                x: vector.x - this.offset,
                y: vector.y
            };
        },
        update: function (dt) {
            this.offset = this.lookAtEntity.currentPosition().x - (
                (this.lookAtEntity.size.w / 2) +
                (this.canvasSize.w / 2));
        },
        visible: function (position, size) {
            if (size === undefined) {
                // we were given an entity
                size = position.size;
                position = position.position;
            }
            position = this.offsetCoordinates(position).x;
            return (position + size.w >= 0 && position <= this.canvasSize.w);
        },
        drawEntity: function (entity, ctx, time) {
            var sprite = entity.sprite,
                coordinates = this.offsetCoordinates(entity.currentPosition(time)),
                deCentered = Math2D.vectorAdd(sprite.center, coordinates);
            ctx.drawImage(sprite.image, deCentered.x, deCentered.y);
        },
        drawWorld: function(world, ctx) {
            var obj,
                staticObjects = world.getObjects(),
                len = staticObjects.length;
            for (var i = 0; i < len; i += 1) {
                obj = staticObjects[i];
                var pos = this.offsetCoordinates(obj.position);
                var size = obj.size;
                if (obj.type === 'platform') {
                    ctx.fillStyle = '#000000';
                    ctx.strokeRect(pos.x, pos.y, size.w, size.h);
                }
            }
        },
        toBox: function () {
            return {
                position: {x: 0 + this.offset, y: 0},
                size: this.canvasSize
            };
        }
    });
    try {
        module.exports.Camera = Camera;
    } catch (e) {
        window.Camera = Camera;
    }
}());
