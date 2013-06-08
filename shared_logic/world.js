/*jshint browser: true, node: true*/
(function () {
    'use strict';
    var Class,
        Math2D,
        World;
    try {
        Class = require('./inheritance.js').Class;
        Math2D = require('./math2d.js').Math2D;
    } catch (e) {
        Class = window.Class;
        Math2D = window.Math2D;
    }
    World = Class.extend({
        init: function (worldObjects, physicsWorld) {
            var objects = worldObjects || [
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
                ],
                i;
            this.physicsWorld = physicsWorld || undefined;
            this.objects = [];
            for (i = 0; i < objects.length; i += 1) {
                this.addStatic(objects[i]);
            }
        },
        addStatic: function (object) {
            this.objects.push(object);
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
                    if ((x > pos.x && x < pos.x + size.w) && (y > pos.y && y < pos.y + size.h)) {
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
        polyInWorld: function (pts, boolean, inElements) {
            // pts: counter-clockwise set of points
            var elements = inElements || this.getObjects(),
                len = pts.length,
                i;
            for (i = 0; i < len - 1; i++) {
                elements = this.halfPlaneInWorld(
                    pts[i], pts[i + 1], false, elements);
            }
            elements = this.halfPlaneInWorld(pts[pts.length - 1], pts[0], false, elements);
            if (boolean) {
                return !!elements.length;
            } else {
                return elements;
            }
        },
        boxInWorld: function (position, size, boolean, inElements) {
            var result = [],
                i,
                objects = inElements || this.getObjects(),
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
        movingBoxInWorld: function (startPosition, size, delta, boolean, timeLimit, resolution) {
            /*
                Collide a moving box against the world
                   __   __
                  /  | |  \
                 /  /   \  \
                |__/     \__\
                Cover a shape like the above ones using polygon collision
                
                If delta.x and delta.y have the same sign, it's the right shape.
                Otherwise, it's the left shape.
            */
            var timeLimitMilliSeconds = timeLimit * 1000,
                endPosition = {
                    x: (+startPosition.x) + ((+delta.x) * (+timeLimit)),
                    y: (+startPosition.y) + ((+delta.y) * (+timeLimit))
                },
                // upper left, lower right points
                min_x = Math.min(startPosition.x, endPosition.x),
                max_x = Math.max(startPosition.x, endPosition.x) + size.w,
                min_y = Math.min(startPosition.y, endPosition.y),
                max_y = Math.max(startPosition.y, endPosition.y) + size.h,
                // Points for polyInWorld
                points = [],
                deltaSameSign = (delta.x <= 0 && delta.y <= 0) || (delta.x >= 0 && delta.y >= 0),
                // Array of world objects we get in the end
                results = [],
                // returned info object
                ret = {},
                // When walking to find collisions
                walkTime,
                walkTimeDelta = (1 / (resolution || 10)) * 1000,
                walkStep;
            if (!timeLimit) {
                throw new Error('movingBoxInWorld requires a time limit!');
            }
            // Go counter-clockwise to add points to the list
            if (delta.x === 0 && delta.y === 0) {
                return 'cant handle static boxes yet';
            }
            // Start with top left (bottom left if deltas don't have the same sign).
            if (deltaSameSign) {
                // top left
                points.push({x: min_x + size.w, y: min_y});
                points.push({x: min_x, y: min_y});
                points.push({x: min_x, y: min_y + size.h});
                // bottom right
                points.push({x: max_x - size.w, y: max_y});
                points.push({x: max_x, y: max_y});
                points.push({x: max_x, y: max_y - size.h});
            } else {
                // bottom left
                points.push({x: min_x, y: max_y - size.h});
                points.push({x: min_x, y: max_y});
                points.push({x: min_x + size.w, y: max_y});
                // top right
                points.push({x: max_x, y: min_y + size.h});
                points.push({x: max_x, y: min_y});
                points.push({x: max_x - size.w, y: min_y});
            }
            results = this.polyInWorld(points, false);
            if (boolean) {
                return !!results.length;
            } else {
                if (!results.length) {
                    return undefined;
                }
            }
            ret = {
                list: results,
                position: undefined,
                time: undefined
            };
            for (walkTime = -walkTimeDelta; walkTime < timeLimitMilliSeconds; walkTime += walkTimeDelta) {
                walkStep = Math2D.predictPosition(startPosition, delta, walkTime);
                if (this.boxInWorld(walkStep, size, false, results).length) {
                    ret.position = walkStep;
                    ret.time = (walkTime + walkTimeDelta);
                    return ret;
                }
            }
            return undefined;
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
                
                Use Math2D.pointInHalfPlane to check if any point in each box is
                in the half plane.
            */
            var results = [],
                objects = in_elements || this.getObjects(),
                len = objects.length,
                i,
                j,
                obj,
                boxPoints;
            if (p1.x - p2.x === 0 && p1.y - p2.y === 0) {
                throw new Error('Bad half plane. p1 === p2');
            }
            for (i = 0; i < len; i += 1) {
                obj = objects[i];
                boxPoints = Math2D.pointsOfBox(obj.position, obj.size);
                for (j = 0; j < 4; j += 1) {
                    if (Math2D.pointInHalfPlane(p1, p2, boxPoints[j])) {
                        if (boolean) {
                            return true;
                        } else {
                            results.push(obj);
                        }
                        break;
                    }
                }
            }
            if (boolean) {
                return false;
            } else {
                return results;
            }
        }
    });
    try {
        module.exports.World = World;
    } catch (e) {
        window.World = World;
    }
}());
