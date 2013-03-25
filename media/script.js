jQuery(function ($) {
    'use strict';
    var hostname = window.location.hostname,
        socket = window.socket = io.connect('http://' + hostname + ':9090'),
        //Classes
        Class = window.Class,
        Movement = window.Movement,
        Enemy = window.Enemy,
        Player = window.Player,
        //Pawns
        player,
        playerSpeed = 350.0,
        //World
        camera,
        world = new window.World(),
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
        debugCanvas = document.getElementById('debugcanvas'),
        debugCanvasContext = debugCanvas.getContext('2d'),
        fps = 60,
        fpsInterval = 1000 / fps,
        requestAnimationFrame =
            window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.msrequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            function (callback, elm) {
                return setTimeout(callback, fpsInterval);
            },
        cancelRequestAnimationFrame =
            window.cancelRequestAnimationFrame ||
            window.webkitCancelRequestAnimationFrame ||
            window.mozCancelRequestAnimationFrame ||
            window.msCancelRequestAnimationFrame ||
            window.oCancelRequestAnimationFrame ||
            clearTimeout,
        logicTicks = 12, // per second
        logicTickInterval = 1000 / logicTicks,
        // debug stuff
        debugMode = !!$('.debuginfo').length,
        $pingDisplay = $('.debuginfo.ping');
    playerSprite.image.src = '/media/bacano.png';


    // Stuff every entity needs
    Entity.prototype.draw = function (time, ctx, replaceCoordinates) {
        var deCentered = Math2D.vectorAdd(
            this.sprite.center,
            replaceCoordinates || this.currentPosition(time));
        ctx.drawImage(this.sprite.image, deCentered.x, deCentered.y);
    };

    Entity.prototype.getPing = function () {return ownPing};

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
                enemies = enemiesList,
                enemyID,
                time = +new Date();
            if (camera) {
                ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);
                camera.update();
                for (enemyID in enemies) {
                    if (enemies.hasOwnProperty(enemyID)) {
                        camera.draw(enemies[enemyID], ctx, time);
                    }
                }
                camera.draw(player, ctx, time);
                world.drawWorld(ctx, camera);
            }
            requestAnimationFrame(renderLoop, gameCanvas); // schedule next frame draw
        };
        renderLoop();
    }
    function gameLogicLoop() {
        var oldTime = +new Date(),
            logicLoop;
        logicLoop = function () {
            var newTime = +new Date(),
                dt = newTime - oldTime;
            // entityWorld.frame();
            keyInput.frame();
            setTimeout(logicLoop, logicTickInterval);
            oldTime = +new Date();
        };
        logicLoop();
    }
    function tryInit() {
        var $list = $('ul.announcements');
        // Start stuff up after every event has happened.
        if (playerSpriteLoaded) {
            socket.on('pawn-update', function (data) {
                var enemy = enemiesList[data.id];
                if (enemy === undefined) {
                    enemiesList[data.id] = new Enemy(data.position);
                }
                enemy.update(data);
            });
            socket.on('pawn-remove', function (id) {
                delete enemiesList[id];
            });
            socket.emit('ready', function (creationData) {
                player = new Player(creationData.position, creationData.id);
                window.player = player;
                console.log('all loaded');
                camera = new Camera(player, world, canvasSize);
            });
            window.announce = function (text, type) {
                $list.append($('<li />')
                    .addClass(type || 'announcement')
                    .text(text));
            };
            socket.on('ping-event', function (ping) {
                ownPing = ping;
                socket.emit('pong-event');
                $pingDisplay.text('Ping: ' + ping);
            });
            socket.on('message', function (data) {
                if (data.announce) {
                    window.announce(data.announce, "announcement");
                } else if (data.message) {
                    window.announce(data.message, "message");
                }
            });
            gameRenderLoop();
            gameLogicLoop();
            // Debug information!
            (function () {
                var redrawList = {},
                    redrawDebug, // function to redraw all debug info
                    debugInfoTimeout = 1.6 * 1000;
                redrawDebug = function () {
                    var key,
                        data,
                        position,
                        wrongPosition,
                        ctx = debugCanvasContext; // Get canvas context for debug info.
                    ctx.clearRect(0, 0, canvasSize.w, canvasSize.h); // clear debug canvas
                    for (key in redrawList) {
                        if (redrawList.hasOwnProperty(key)) {
                            data = redrawList[key];
                            if (data) {
                                position = camera.offsetCoordinates(data.position);
                                ctx.beginPath();
                                ctx.arc(position.x, position.y, 10, 0, Math.PI * 2);
                                ctx.strokeStyle = '#11FF11'; // green
                                ctx.stroke();
                                if (data.wrongPosition) {
                                    wrongPosition = camera.offsetCoordinates(data.wrongPosition);
                                    ctx.beginPath();
                                    ctx.arc(wrongPosition.x, wrongPosition.y, 10, 0, Math.PI * 2);
                                    ctx.strokeStyle = '#FF1111'; // red
                                    ctx.stroke();
                                }
                                if (data.delta.x || data.delta.y) {
                                    ctx.strokeStyle = '#1111FF'; // blue
                                    ctx.moveTo(data.position.x, data.position.y);
                                    ctx.lineTo(data.whereTo.x, data.whereTo.y);
                                    ctx.stroke();
                                }
                            }
                        }
                    }
                };
                socket.on('debug-key', function (data) {
                    var uid = +new Date();
                    data.whereTo = Math2D.vectorAdd(data.position, Math2D.vectorMul(data.delta, 0.1));
                    redrawList[uid] = data;
                    redrawDebug();
                    setTimeout(function () {
                        delete redrawList[uid];
                        redrawDebug();
                    }, debugInfoTimeout);
                });
            }());
        }
    }
    playerSprite.image.onload = function () {
        playerSpriteLoaded = true;
        tryInit();
    };
});
