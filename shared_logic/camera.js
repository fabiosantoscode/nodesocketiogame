(function () {
    'use strict';
    var Camera;
    Camera = Class.extend({
        offset: 0,
        init: function (lookAtEntity, world, canvasSize) {
            this.world = world;
            this.lookAtEntity = lookAtEntity;
            this.canvasSize = canvasSize;
        },
        offsetCoordinates: function (vector) {
            return {
                x: vector.x - this.offset,
                y: vector.y
            };
        },
        update: function (dt) {
            this.offset = this.lookAtEntity.position.x - (
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
        }
    });
    try {
        module.exports.Camera = Camera;
    } catch (e) {
        window.Camera = Camera
    }
}());
