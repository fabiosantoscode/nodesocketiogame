(function (require, exports) {
    'use strict';
    // TODO get all these util functions on shared_logic
    function vectorSum(a, b) {
        return {
            x: a.x + b.x,
            y: a.y + b.y
        };
    }
    if (require) {
        require('inheritance.js');
    } // else: include through HTML tag.
    exports.World = Class.extend({
        init: function (worldObjects) {
            this.objects = worldObjects || [
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
        pointInWorld: function (x, y, boolean) {
            var result = [],
                i,
                objects = this.getObjects(),
                obj,
                pos, size,
                len = objects.length;
            for (i = 0; i < len; i += 1) {
                obj = objects[i];
                pos = obj.position;
                size = obj.size;
                if (obj.collision === 'rect') {
                    if ((x > pos.x && x < pos.x + size.w)
                            && (y > pos.y && y < pos.y + size.h)) {
                        if (boolean) {
                            return true;
                        } else {
                            result.push(obj);
                        }
                    }
                }
            }
            if (boolean) {
                return false;
            } else {
                return result;
            }
        },
        drawWorld: function(ctx, offsetx) {
            // Draw every platform in the game world,
            // taking into account a global offset value, given by the camera.
            var i,
                objects = this.getObjects(),
                obj,
                pos, size,
                len = objects.length;
            for (i = 0; i < len; i += 1) {
                obj = objects[i];
                pos = obj.position;
                size = obj.size;
                if (obj.type === 'platform') {
                    ctx.fillStyle = '#000000';
                    ctx.strokeRect(pos.x, pos.y, size.w, size.h);
                }
            }
        },
        boxInWorld: function (position, size, boolean) {
            var result = [],
                i,
                objects = this.getObjects(),
                obj,
                obj_pos, obj_size,
                len = objects.length;
            for (i = 0; i < len; i += 1) {
                obj = objects[i];
                obj_pos = obj.position;
                obj_size = obj.size;
                if (obj.collision === 'rect') {
                    if (position.x + size.w > obj_pos.x && obj_pos.x + obj_size.w > position.x &&
                            position.y + size.h > obj_pos.y && obj_pos.y + obj_size.h > position.y) {
                        if (boolean) {
                            return true;
                        } else {
                            result.push(obj);
                        }
                    }
                }
            }
            if (boolean) {
                return false;
            } else {
                return result;
            }
        },
        movingBoxInWorld: function (startPosition, size, delta, get, timeLimit) {
            /*
                Collide a moving box against the world
                   __   __
                  /  | |  \
                 /  /   \  \
                |__/     \__\
                Cover a shape like the above ones using half plane collision.
                
                get: time|boolean|list|position (default is boolean)
            */
            if (['time', 'list', 'position'].indexOf(get) !== -1) {
                return 'Cant get ' + get + ' yet.';
            }
            var i,
                objects = this.getObjects(),
                len = objects.length,
                timeLimitSeconds = timeLimit * 1000,
                tmp,
                endPosition = {
                    x: (+startPosition.x) + ((+delta.x) * (+timeLimitSeconds)),
                    y: (+startPosition.y) + ((+delta.y) * (+timeLimitSeconds))
                },
                // points
                l1_p1, l1_p2,
                l2_p1, l2_p2,
                result = {},
                min_x = Math.min(startPosition.x, endPosition.x),
                max_x = Math.max(startPosition.x, endPosition.x) + size.w,
                min_y = Math.min(startPosition.y, endPosition.y),
                max_y = Math.max(startPosition.y, endPosition.y) + size.h;
            if (delta.x === 0 && delta.y === 0) {
                return 'cant handle static boxes yet';
            } else if ((delta.x >= 0 && delta.y <= 0) || (delta.x <= 0 && delta.y >= 0)) {
                // Connect the upper left corners and the lower right corners
                l1_p1 = startPosition;
                l1_p2 = endPosition;
                l2_p1 = vectorSum(startPosition, {x: size.w, y: size.h});
                l2_p2 = vectorSum(endPosition, {x: size.w, y: size.h});
                // Same corners, but swap direction
                if (delta.x >= 0 && delta.y <= 0) {
                    tmp = l1_p1; l1_p1 = l1_p2; l1_p2 = tmp;
                    tmp = l2_p1; l2_p1 = l2_p2; l2_p2 = tmp;
                }
            } else if ((delta.x <= 0 && delta.y <= 0) || (delta.x >= 0 && delta.y >= 0)) {
                // Connect the upper right corners and the lower left corners
                l1_p1 = {x: startPosition.x + size.w, y: startPosition.y};
                l1_p2 = {x: endPosition.x + size.w, y: endPosition.y};
                l2_p1 = {x: startPosition.x, y: startPosition.y + size.h};
                l2_p2 = {x: endPosition.x, y: endPosition.y + size.h};
                // Likewise. In one of the cases, swap direction.
                if (delta.x >= 0 && delta.y >= 0) {
                    tmp = l1_p1; l1_p1 = l1_p2; l1_p2 = tmp;
                    tmp = l2_p1; l2_p1 = l2_p2; l2_p2 = tmp;
                }
            }
            result.elements = this.boxInWorld(
                {x: min_x, y: min_y},
                {w: max_x - min_x, h: max_y - min_y});
            // Filter the result further
            result.elements = this.halfPlaneInWorld(l1_p1, l1_p2, false, result.elements);
            result.elements = this.halfPlaneInWorld(l2_p1, l2_p2, false, result.elements);
            return !!result.elements.length;
        },
        halfPlaneInWorld: function (p1, p2, boolean, in_elements) {
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
            var result = [],
                timesX,
                offsetX, offsetY,
                objects = in_elements || this.getObjects(),
                len = objects.length,
                verticality = p1.x - p2.x,
                horizontality = p1.y - p2.y,
                side,
                i, obj;
            if (horizontality === 0 && verticality === 0) {
                throw new Error('Checking an undefineable plane. p1 == p2');
            } else if (horizontality === 0) {
                side = verticality < 0; // side ? 'up' : 'down'
                for (i = 0; i < len; i += 1) {
                    obj = objects[i];
                    if (obj.collision === 'rect') {
                        if (side) {
                            if (obj.position.y < p1.y) {
                                if (boolean) {
                                    return true;
                                } else {
                                    result.push(obj);
                                }
                            }
                        } else {
                            if (obj.position.y + obj.size.h > p1.y) {
                                if (boolean) {
                                    return true;
                                } else {
                                    result.push(obj);
                                }
                            }
                        }
                    }
                }
            } else if (verticality === 0) {
                side = horizontality < 0; // side ? 'right' : 'left';
                for (i = 0; i < len; i += 1) {
                    obj = objects[i];
                    if (obj.collision === 'rect') {
                        if (side) {
                            if (obj.position.x + obj.size.w > p1.x) {
                                if (boolean) {
                                    return true;
                                } else {
                                    result.push(obj);
                                }
                            }
                        } else {
                            if (obj.position.x < p1.x) {
                                if (boolean) {
                                    return true;
                                } else {
                                    result.push(obj);
                                }
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
                    for (i = 0; i < len; i += 1) {
                        obj = objects[i];
                        if (obj.collision === 'rect') {
                            // Lower left corner
                            if (obj.position.y + obj.size.h > ((obj.position.x - p1.x) * timesX) + p1.y) {
                                if (boolean) {
                                    return true;
                                } else {
                                    result.push(obj);
                                }
                            }
                            // Lower right corner
                            if (obj.position.y + obj.size.h > (((obj.position.x + obj.size.w) - p1.x) * timesX) + p1.y) {
                                if (boolean) {
                                    return true;
                                } else {
                                    result.push(obj);
                                }
                            }
                        }
                    }
                } else {
                    for (i = 0; i < len; i += 1) {
                        obj = objects[i];
                        if (obj.collision === 'rect') {
                            // Upper left corner
                            if (obj.position.y < ((obj.position.x - p1.x) * timesX) + p1.y) {
                                if (boolean) {
                                    return true;
                                } else {
                                    result.push(obj);
                                }
                            }
                            // Upper right corner
                            if (obj.position.y < (((obj.position.x + obj.size.w) - p1.x) * timesX) + p1.y) {
                                if (boolean) {
                                    return true;
                                } else {
                                    result.push(obj);
                                }
                            }
                        }
                    }
                }
            }
            if (boolean) {
                return false;
            } else {
                return result;
            }
        }
    });
}(this.require, (this.module && this.module.exports) || window));
