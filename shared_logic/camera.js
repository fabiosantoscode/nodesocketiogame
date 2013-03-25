/*jshint browser: true, node: true*/
(function () {
    'use strict';
    var Camera,
        Class;
    if (require) {
        require('./inheritance.js');
        Class = this.Class;
    } else {
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
        draw: function (entity, ctx, time) {
            entity.draw(time || +new Date(),
                ctx,
                this.offsetCoordinates(
                    entity.currentPosition(time)));
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
