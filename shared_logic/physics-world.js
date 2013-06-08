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
    
    function makeBody (physicsWorld, details) {
        // adapted from http://buildnewgames.com/box2dweb/
        details = details || {};
        var definition = new b2BodyDef();
        
        // Set up the definition
        for (var k in definitionDefaults) {
            if (definitionDefaults.hasOwnProperty(k)) {
                definition[k] = details[k] || definitionDefaults[k];
            }
        }
        
        definition.position = new b2Vec2(details.x || 5, details.y || 5);
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
 
        switch (details.shape) {
            case "circle":
                fixtureDef.shape = new b2CircleShape(defaults.radius || details.radius);
                break;
            case "polygon":
                fixtureDef.shape = new b2PolygonShape();
                fixtureDef.shape.SetAsArray(details.points, details.points.length);
                break;
            case "block":
            default:
                details.width = details.width || defaults.width;
                details.height = details.height || defaults.height;
                fixtureDef.shape = new b2PolygonShape();
                fixtureDef.shape.SetAsBox(details.width / 2,
                details.height / 2);
            break;
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
        density: 1,
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
    
    if (window) {
        window.makeBody = makeBody
        setTimeout(function () {
            makeBody(physicsWorld, {
                type: "static", x: 4, y: 0, height: 0.1, width: 50 });

            makeBody(physicsWorld, {x: 5, y: 3 });
            makeBody(physicsWorld, {x: 2, y: 3 });
            makeBody(physicsWorld, {x: 8, y: 3 });
        }, 1000)
    }
    
    var PhysicsWorld = Class.extend({
        init: function (timeStep) {
            this.timeStep = timeStep;
            var gravity = new b2Vec2(0, 9.8);
            this.box2dWorld = new b2World(gravity, true);
        },
        setUpDebugDraw: function (debugOptions) {
            var debugDraw = this.debugDraw = new b2DebugDraw();
            debugDraw.SetSprite(debugOptions.canvasContext);
            debugDraw.SetDrawScale(debugOptions.scale);
            debugDraw.SetFillAlpha(0.3);
            debugDraw.SetLineThickness(1.0);
            debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
            this.box2dWorld.SetDebugDraw(debugDraw);
        },
        frame: function () {
            this.box2dWorld.Step(this.timeStep, 5, 2);
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
