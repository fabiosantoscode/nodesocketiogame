(function (require, exports) {
    'use strict'
    if (require) {
        require('inheritance.js');
    } // else: include through HTML tag.
    exports.World = Class.extend({
        init: function (worldObjects) {
            this.objects = worldObjects ? worldObjects : [
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
            ];
        },
        getObjects: function (startx, endx, starty, endy) {
            // Constant and not quadtree optimized for now.
            // Used for collisions as well as drawing
            return this.objects;
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
        },
        halfPlaneInWorld: function (p1, p2) {
            /*
                Checks if a half plane collides with the world.
                probably badly named.
                
                     p2
                 x  /  
                   /
                  /
                 p1
                
                The formula is to check if any part of the world (marked X above) is above the linear function dividing the half plane.
                This linear function is given by the two points p1 and p2
                For vertical dividers, we get some special cases.
            */
            var timesX,
                offsetX, offsetY,
                objects = this.getObjects(),
                len = objects.length,
                verticality = p1.x - p2.x,
                horizontality = p1.y - p2.y,
                side,
                i, obj;
            if (horizontality === 0 && verticality === 0) {
                throw new Error('Checking an undefineable plane. p1 == p2');
            } else if (horizontality === 0) {
                side = verticality < 0; // side ? 'up' : 'down'
                for (i = 0; i < len; i++) {
                    obj = objects[i];
                    if (obj.collision === 'rect') {
                        if (side) {
                            if (obj.position.y < p1.y) {
                                return true;
                            }
                        } else {
                            if (obj.position.y + obj.size.h > p1.y) {
                                return true;
                            }
                        }
                    }
                }
            } else if (verticality === 0) {
                side = horizontality < 0; // side ? 'right' : 'left';
                for (i = 0; i < len; i++) {
                    obj = objects[i];
                    if (obj.collision === 'rect') {
                        if (side) {
                            if (obj.position.x + obj.size.w > p1.x) {
                                return true;
                            }
                        } else {
                            if (obj.position.x < p1.x) {
                                return true;
                            }
                        }
                    }
                }
            } else {
                // create the linear function.
                offsetX = p1.x - p2.x;
                offsetY = p1.y - p2.y;
                timesX = offsetY / offsetX;
                side = p1.x > p2.x; // side ? 'down' : 'up';
                // y = ((x - offsetX) * timesX) + offsetY
                // lin = function (x) {}
                // return ('offsetX: ' + p1.x + '; offsetY: ' + p1.y + '; timesX: ' + timesX + '; side: ' + (side ? 'down' : 'up'));
                if (side) {
                    for (i = 0; i < len; i++) {
                        obj = objects[i];
                        if (obj.collision === 'rect') {
                            if (obj.position.y + obj.size.h > ((obj.position.x - p1.x) * timesX) + p1.y) {
                                return true;
                            }
                        }
                    }
                } else {
                    for (i = 0; i < len; i++) {
                        obj = objects[i];
                        if (obj.collision === 'rect') {
                            if (obj.position.y < ((obj.position.x - p1.x) * timesX) + p1.y) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        }
    });
}(this.require, (this.module && this.module.exports) || window));
