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
        pixelOffset: 0,
        init: function (lookAtEntity, world, canvasSize) {
            this.world = world;
            this.lookAtEntity = lookAtEntity;
            this.canvasSize = canvasSize;
            this.scale = 50;
            this.localCanvasSize = {
                h: canvasSize / this.scale,
                w: canvasSize / this.scale};
        },
        absoluteCoordinates: function (v) {
            return {
                x: (v.x + this.pixelOffset) / this.scale,
                y: (v.y) / this.scale};
        },
        offsetCoordinates: function (v) {
            return {
                x: v.x - this.offset,
                y: v.y};
        },
        scaleCoordinates: function (v) {
            return {
                x: v.x * this.scale,
                y: v.y * this.scale};
        },
        scaleSize: function (v) {
            return {
                h: v.h * this.scale,
                w: v.w * this.scale};
        },
        update: function (dt) {
            this.offset = this.lookAtEntity.currentPosition().x -
                ((this.canvasSize.w / this.scale) / 2);
            this.pixelOffset = this.offset * this.scale;
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
                scaled = this.scaleCoordinates(coordinates),
                deCentered = Math2D.vectorAdd(sprite.center, scaled);
            ctx.drawImage(sprite.image, deCentered.x, deCentered.y);
        },
        drawWorld: function(world, ctx) {
            var obj,
                staticObjects = world.getObjects(),
                len = staticObjects.length;
            for (var i = 0; i < len; i += 1) {
                obj = staticObjects[i];
                var pos = this.scaleCoordinates(this.offsetCoordinates(obj.position));
                var size = this.scaleSize(obj.size);
                if (obj.type === 'platform') {
                    ctx.fillStyle = '#000000';
                    ctx.strokeRect(pos.x, pos.y, size.w, size.h);
                }
            }
        },
        toBox: function () {
            return {
                position: {x: 0 + this.pixelOffset, y: 0},
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
