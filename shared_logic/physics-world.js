/*jshint browser: true, node: true*/
(function () {
    'use strict';
    var client, server;
    var Class, Math2D, World, Box2D;
    if (typeof require === 'function') {
        server = true;
        Class = require('./inheritance.js').Class;
        Math2D = require('./math2d.js').Math2D;
        World = require('./world.js').World;
        Box2D = require('./Box2dWeb-2.1.a.3.js');
    } else {
        server = false;
        Class = window.Class;
        Math2D = window.Math2D;
        World = window.World;
        Box2D = window.Box2D;
    }
    client = !server;
    
    var b2Vec2 = Box2D.Common.Math.b2Vec2;
    var b2BodyDef = Box2D.Dynamics.b2BodyDef;
    var b2Body = Box2D.Dynamics.b2Body;
    var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
    var b2Fixture = Box2D.Dynamics.b2Fixture;
    var b2World = Box2D.Dynamics.b2World;
    var b2MassData = Box2D.Collision.Shapes.b2MassData;
    var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
    var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
    var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

    var PhysicsWorld = Class.extend({
        init: function (timeStep, debugOptions) {
            this.timeStep = timeStep;
            var gravity = new b2Vec2(0, 9.8);
            this.box2dWorld = new b2World(gravity, true);
            if (debug) {
                var debugDraw = this.debugDraw = new b2DebugDraw();
                debugDraw.SetSprite(debugOptions.context);
                debugDraw.SetDrawScale(debugOptions.scale);
                debugDraw.SetFillAlpha(0.3);
                debugDraw.SetLineThickness(1.0);
                debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
                this.box2dWorld.SetDebugDraw(debugDraw);
            }
        },
        tick: function () {
            this.box2dWorld.Step(this.timeStep, 8, 3);
            if (this.debugDraw) {
                this.box2dWorld.DrawDebugData();
            }
        },
    });
    if (server) {
        module.exports.PhysicsWorld = PhysicsWorld;
    } else {
        window.PhysicsWorld = PhysicsWorld;
    }
}());
