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
    
    function makeBody(physicsWorld, details) {
        // adapted from http://buildnewgames.com/box2dweb/
        details = details || {};
        var definition = new b2BodyDef();
        
        // Set up the definition
        for (var k in definitionDefaults) {
            if (definitionDefaults.hasOwnProperty(k)) {
                definition[k] = details[k] || definitionDefaults[k];
            }
        }
        
        definition.position = new b2Vec2(details.x || 0, details.y || 0);
        definition.linearVelocity = new b2Vec2(details.vx || 0, details.vy || 0);
        definition.userData = details.userData;
        definition.type = details.type === "static" ? b2Body.b2_staticBody : b2Body.b2_dynamicBody;
        
        // Create the Body
        var body = physicsWorld.box2dWorld.CreateBody(definition);
         
        // Create the fixture
        var fixtureDef = new b2FixtureDef();
        for (var k in fixtureDefaults) {
            if (fixtureDefaults.hasOwnProperty(k)) {
                fixtureDef[k] = details[k] || fixtureDefaults[k];
            }
        }
        
        details.shape = details.shape || defaults.shape;
 
        if (details.shape === 'circle') {
            fixtureDef.shape = new b2CircleShape(details.radius || defaults.radius);
        } else if (details.shape === 'polygon') {
            fixtureDef.shape = new b2PolygonShape();
            fixtureDef.shape.SetAsArray(details.points, details.points.length);
        } else if (details.shape === 'block') {
            details.width = details.width || defaults.width;
            details.height = details.height || defaults.height;
            fixtureDef.shape = new b2PolygonShape();
            fixtureDef.shape.SetAsBox(details.width / 2,
                details.height / 2);
        }
        
        body.CreateFixture(fixtureDef);
        
        return body;
    }
    
    var defaults = {
        shape: "block",
        width: 1,
        height: 1,
        radius: 0.5
    };
    
    var fixtureDefaults = {
        density: 2,
        friction: 1,
        restitution: 0.2
    };
    
    var definitionDefaults = {
        active: true,
        allowSleep: true,
        angle: 0,
        angularVelocity: 0,
        awake: true,
        bullet: false,
        fixedRotation: false
    };
    
    var PhysicsWorld = Class.extend({
        init: function (timeStep) {
            this.timeStep = timeStep;
            var gravity = new b2Vec2(0, 9.8);
            this.box2dWorld = new b2World(gravity, true);
        },
        frame: function () {
            this.box2dWorld.Step(this.timeStep, 5, 2);
            if (this.debugDraw) {
                this.box2dWorld.DrawDebugData();
            }
        },
        setUpDebugDraw: function (debugOptions) {
            var debug = new CameraOrientedDebugDraw(debugOptions.camera);
            this.debugDraw = true;
            debug.SetSprite(debugOptions.canvasContext);
            debug.SetDrawScale(50);
            debug.SetFillAlpha(0.3);
            debug.SetLineThickness(1.0);
            debug.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
            this.box2dWorld.SetDebugDraw(debug);
        },
        makeBody: function (options) {
            makeBody.apply(null, [this, options])
        },
        setUpDebugDropThings: function (canvas, camera) {
            var $ = window.jQuery;
            var that = this;
            $(canvas).click(function (e) {
                var offs = $(this).offset();
                that.makeBody(camera.absoluteCoordinates({
                    x: e.pageX - offs.left,
                    y: e.pageY - offs.top}));
            });
        }
    });
    
    function CameraOrientedDebugDraw(camera) {
        this.camera = camera;
        b2DebugDraw.apply(this, []);
    }
    
    CameraOrientedDebugDraw.prototype = new b2DebugDraw();
    
    CameraOrientedDebugDraw.prototype.DrawPolygon = function (vertices, vertexCount, color) {
        for (var i = 0; i < vertexCount; i++) {
            vertices[i].x -= this.camera.offset;
        }
        return b2DebugDraw.prototype.DrawPolygon.call(this, vertices, vertexCount, color);
    };
    CameraOrientedDebugDraw.prototype.DrawSolidPolygon = function (vertices, vertexCount, color) {
        for (var i = 0; i < vertexCount; i++) {
            vertices[i].x -= this.camera.offset;
        }
        return b2DebugDraw.prototype.DrawSolidPolygon.call(this, vertices, vertexCount, color);
    };
    CameraOrientedDebugDraw.prototype.DrawCircle = function (center, radius, color) {
        center.x -= this.camera.offset;
        return b2DebugDraw.prototype.DrawCircle.call(this, center, radius, color);
    };
    CameraOrientedDebugDraw.prototype.DrawSolidCircle = function (center, radius, axis, color) {
        center.x -= this.camera.offset;
        return b2DebugDraw.prototype.DrawSolidCircle.call(this, center, radius, axis, color);
    };
    CameraOrientedDebugDraw.prototype.DrawSegment = function (p1, p2, color) {
        p1.x -= this.camera.offset;
        p2.x -= this.camera.offset;
        return b2DebugDraw.prototype.DrawSegment.call(this, p1, p2, color);
    };
    CameraOrientedDebugDraw.prototype.DrawTransform = function (xf) {
        xf.position.x -= this.camera.offset;
        return b2DebugDraw.prototype.DrawTransform.call(this, xf);
    };
    
    if (server) {
        module.exports.PhysicsWorld = PhysicsWorld;
    } else {
        window.PhysicsWorld = PhysicsWorld;
    }
}());
