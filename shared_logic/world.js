(function (require, exports) {
    'use strict'
    if (require) {
        require('inheritance.js');
    } // else: include through HTML tag.
    exports.World = Class.extend({
        init: function () {
        },
        getObjects: function (startx, endx, starty, endy) {
            // Constant and not quadtree optimized for now.
            // Used for collisions as well as drawing
            return [
                {
                    type: 'platform',
                    position: {x: 60, y: 400},
                    size: {w: 200, h: 5},
                    collision: 'rect'
                }, {
                    type: 'platform',
                    position: {x: 30, y: 300},
                    size: {w: 100, h: 5},
                    collision: 'rect'
                }, {
                    type: 'platform',
                    position: {x: 350, y: 410},
                    size: {w: 100, h: 200},
                    collision: 'rect'
                }
            ]
        },
        pointInWorld: function(x, y) {
            var i,
                objects = this.getObjects(),
                obj,
                pos, size,
                len = objects.length;
            for (i = 0; i < len; i++) {
                obj = objects[i];
                pos = obj.position;
                size = obj.size;
                if (obj.collision === 'rect') {
                    if ((x > pos.x && x < pos.x + size.w)
                            && (y > pos.y && y < pos.y + size.h)) {
                        return true;
                    }
                }
            }
            return false;
        },
        drawWorld: function(ctx, offsetx) {
            // Draw every platform in the game world,
            // taking into account a global offset value, given by the camera.
            var i,
                objects = this.getObjects(),
                obj,
                pos, size,
                len = objects.length;
            for (i = 0; i < len; i++) {
                obj = objects[i];
                pos = obj.position;
                size = obj.size;
                if (obj.type === 'platform') {
                    ctx.fillStyle = '#000000';
                    ctx.strokeRect(pos.x, pos.y, size.w, size.h);
                }
            }
        },
        boxInWorld: function (position, size) {
            var i,
                objects = this.getObjects(),
                obj,
                obj_pos, obj_size,
                len = objects.length;
            for (i = 0; i < len; i++) {
                obj = objects[i];
                obj_pos = obj.position;
                obj_size = obj.size;
                if (obj.collision === 'rect') {
                    if (position.x + size.w > obj_pos.x && obj_pos.x + obj_size.w > position.x &&
                            position.y + size.h > obj_pos.y && obj_pos.y + obj_size.h > position.y) {
                        return true;
                    }
                }
            }
            return false;
        },
        movingBoxInWorld: function (position, size, delta) {
            /*
                Collide a moving box against the world
                   __
                  /  |
                 /  /
                |__/
            */
            /* (stub method)
            var i,
                objects = this.getObjects(),
                obj,
                obj_pos, obj_size,
                len = objects.length;
            for (i = 0; i < len; i++) {
                obj = objects[i];
                obj_pos = obj.position;
                obj_size = obj.size;
                if (obj.collision === 'rect') {
                    if (position.x + size.w > obj_pos.x && obj_pos.x + obj_size.w > position.x &&
                            position.y + size.h > obj_pos.y && obj_pos.y + obj_size.h > position.y) {
                        console.log('Moving box in world');
                        return true;
                    }
                }
            }
            console.log('Moving box not in world');
            return false;*/
        }
    });
}(this.require, (this.module && this.module.exports) || window));
