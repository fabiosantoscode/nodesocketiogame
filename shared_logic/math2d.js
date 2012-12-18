(function (require, exports) {
    'use strict';
    var Math2D;
    Math2D = exports.Math2D = {
        pointInHalfPlane: function (p1, p2, point) {
            var angdiff = (Math2D.halfPlaneAngle(p1, p2)
                - Math2D.halfPlaneAngle(p1, point));
            angdiff = Math2D.radClamp(angdiff);
            return !(angdiff >= 0 && angdiff <= Math.PI)
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
        halfPlaneAngle: function (p1, p2) {
            return Math2D.angleBetween2Points(p1, p2) + (Math.PI / 2);
        },
        vectorLength: function (v) {
            return Math.sqrt(Math2D.vectorSqLength(v));
        },
        vectorSqLength: function (v) {
            return sqr(Math.abs(v.x)) + sqr(Math.abs(v.y));
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
}(this.require, (this.module && this.module.exports) || window));
