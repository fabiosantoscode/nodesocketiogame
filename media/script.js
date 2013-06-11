/*jshint browser: true, devel: true*/
jQuery(function ($) {
    'use strict';
    var hostname = window.location.hostname,
        socket = window.socket = window.io.connect('http://' + hostname + ':9090'),
        //Classes
        Class = window.Class,
        Movement = window.Movement,
        Entity = window.Entity,
        Enemy = window.Enemy,
        Player = window.Player,
        //Pawns
        player,
        playerSpeed = 350.0,
        //World
        Camera = window.Camera,
        camera,
        world = window.world = new window.EntityWorld(),
        //Utils
        Math2D = window.Math2D,
        enemiesList = {},
        playerSprite = {
            image: new Image(),
            center: {x: -16, y: -63}
        },
        //Keyboard input handler
        keyInput = window.keyInput,
        // stuff we need to load before we are ready to play
        playerSpriteLoaded,
        // Canvas graphics (inspired in jCanvaScript)
        frameUpdateSubscribers = [],
        frameUpdate,
        canvasSize = {
            w: 640,
            h: 480
        },
        // For compensating timestamp calculations.
        ownPing,
        gameCanvas = document.getElementById('gamecanvas'),
        gameCanvasContext = gameCanvas.getContext('2d'),
        fps = 20,
        fpsInterval = 1000 / fps,
        logicTicks = 12, // per second
        logicTickInterval = 1000 / logicTicks;
    playerSprite.image.src = '/media/bacano.png';


    // Stuff every entity needs from this scope
    Entity.prototype.getPing = function () {
        return ownPing;
    };

    Entity.prototype.sprite = {
        image: playerSprite.image,
        center: playerSprite.center
    };

    // Stuff only for player entity
    Player.speed = playerSpeed;

    enemiesList = {};
    function gameRenderLoop() {
        // Render to the "game" layer. Request frame updates from browser (or
        // setTimeout). this is the only layer which needs constant updates
        // and slim code. The others might just use setInterval with large intervals
        // and/or respond to events.
        var oldTime = +new Date(),
            renderLoop;
        renderLoop = function () {
            var ctx = gameCanvasContext,
                player = window.player,
                enemyID,
                time = +new Date();
            if (camera) {
                ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);
                camera.update();
                
                world.iterate(function (entity) {
                    camera.drawEntity(entity, ctx, time);
                });
                
                camera.drawWorld(world, ctx);
            }
            setTimeout(renderLoop, fpsInterval); // schedule next frame draw
        };
        renderLoop();
    }
    function gameLogicLoop() {
        var oldTime = +new Date();
        var loop = function () {
            var newTime = +new Date(),
                dt = newTime - oldTime;
            // entityWorld.frame();
            keyInput.frame();
            setTimeout(loop, logicTickInterval);
            oldTime = +new Date();
        };
        loop();
    }
    function tryInit() {
        // Start stuff up after every event has happened.
        if (playerSpriteLoaded) {
            startGame();
        }
    }
    function startGame() {
        socket.emit('ready', function (creationData) {
            var adapter = new NetworkAdapter(window.socket);
            player = new Player(
                creationData.position,
                creationData.id,
                keyInput,
                adapter,
                socket);
            window.player = player;
            console.log('all loaded');
            world.startClient(socket, player);
            camera = new Camera(player, world, canvasSize);
        });
        socket.on('ping-event', function (ping) {
            ownPing = ping;
            socket.emit('pong-event');
        });
        gameRenderLoop();
        gameLogicLoop();
    }
    playerSprite.image.onload = function () {
        playerSpriteLoaded = true;
        tryInit();
    };
});
