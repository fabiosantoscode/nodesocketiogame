(function () {
    'use strict';
    var Math2D;
    Math2D = {
        origin: {x: 0, y: 0},
        pointInHalfPlane: function (p1, p2, point) {
            var angdiff = (Math2D.halfPlaneAngle(p1, p2)
                - Math2D.halfPlaneAngle(p1, point));
            angdiff = Math2D.radClamp(angdiff);
            return !(angdiff >= 0 && angdiff <= Math.PI)
        },
        accelerate: function (delta, accelerationTime, ms) {
            /* Get dPosition from delta, acceleration ratio and dTime (ms) */
            if (ms < accelerationTime) {
                // For now, just stand there.
                return {x: 0, y: 0};
            } else {
                // When done accelerating, return linear.
                return Math2D.predictPosition({x: 0, y: 0}, delta, ms - accelerationTime);
            }
        },
        radClamp: function (ang) {
            var fullTurn = Math.PI * 2;
            while (ang <= 0) {
                ang += fullTurn;
            }
            while (ang >= fullTurn) {
                ang -= fullTurn;
            }
            return ang;
        },
        predictPosition: function (position, delta, ms) {
            var s = ms / 1000;
            return {
                x: (+position.x) + ((+delta.x) * (+s)),
                y: (+position.y) + ((+delta.y) * (+s))
            };
        },
        halfPlaneAngle: function (p1, p2) {
            return Math2D.angleBetween2Points(p1, p2) + (Math.PI / 2);
        },
        vectorLength: function (v) {
            return Math.sqrt(Math2D.vectorSqLength(v));
        },
        vectorSqLength: function (v) {
            return Math.pow(Math.abs(v.x), 2) + Math.pow(Math.abs(v.y), 2);
        },
        vectorDistance: function (a, b) {
            return Math2D.vectorLength(Math2D.vectorSub(a, b));
        },
        vectorSqDistance: function (a, b) {
            return Math2D.vectorSqLength(Math2D.vectorSub(a, b));
        },
        vectorAdd: function (a, b) {
            return {
                x: a.x + b.x,
                y: a.y + b.y
            };
        },
        vectorSub: function (a, b) {
            return {
                x: a.x - b.x,
                y: a.y - b.y
            };
        },
        vectorMul: function (a, b) {
            return {
                x: a.x * b.x,
                y: a.y * b.y
            };
        },
        vectorBool: function (a) {
            return a.x || a.y;
        },
        lerp: function (a, b, ratio) {
            // Linear interpolation of a and b, by ratio.
            // Assume ratio is a number between 0 and 1
            var inv = 1 - ratio;
            return {
                x: (a.x * inv) + (b.x * ratio),
                y: (a.y * inv) + (b.y * ratio)
            };
        },
        angleBetween2Points: function (a, b) {
            return Math.atan2(b.x - a.x, b.y - a.y);
        },
        rotatePoint: function (pivot, point, angle) {
            var tmp,
                sine,
                cosine;
            if (angle === undefined) {
                // Alternate function signature
                angle = point;
                point = pivot;
                pivot = {x: 0, y: 0};
            }
            sine = Math.sin(angle);
            cosine = Math.cos(angle);
            tmp = {x: point.x - pivot.x, y: point.y - pivot.y};
            return {
                x: ((tmp.x * cosine) - (tmp.y * sine)) + pivot.x,
                y: ((tmp.x * sine) + (tmp.y * cosine)) + pivot.y
            }
        },
        pointsOfBox: function (position, size) {
            // Return counter-clockwise list of box points.
            return [
                {x: position.x, y: position.y},
                Math2D.vectorAdd(position, {x: 0, y: size.h}),
                Math2D.vectorAdd(position, {x: size.w, y: size.h}),
                Math2D.vectorAdd(position, {x: size.w, y: 0})
            ];
        }
    };
    try {
        module.exports.Math2D = Math2D;
    } catch (e) {
        window.Math2D = Math2D;
    }
}());
