jQuery(function ($) {
    'use strict';
    var hostname = window.location.hostname,
        socket = io.connect('http://' + hostname + ':9090'),
        //Classes
        Class = window.Class,
        Movement = window.Movement,
        Entity,
        Enemy,
        Player,
        //Pawns
        player,
        playerSpeed = 350.0,
        //World
        //Camera,
        world = new window.World(),
        enemiesList = {},
        playerSprite = {
            image: new Image(),
            center: {x: -16, y: -63}
        },
        playerSpriteLoaded,
        // Canvas graphics (inspired in jCanvaScript)
        frameUpdateSubscribers = [],
        frameUpdate,
        canvasSize = {
            w: 640,
            h: 480
        },
        // For compensating timestamp calculations.
        ownPing = undefined,
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
        // debug stuff
        debugMode = !!$('.debuginfo').length,
        $pingDisplay = $('.debuginfo.ping');
    playerSprite.image.src = '/media/bacano.png';
    /*
        Entity class:
            Broadcasted to all players who have it within their Camera's range.
    */
    function setUpKeys(player) {
        var pressedKeys = 0,
            sides,
            lastAction = 0,
            interestingKeys,
            foundKey,
            event,
            mappings,
            lastPressed,
            secondToLastPressed;
        interestingKeys = [37, 39];
        pressedKeys = {}; // Currently pressed keys
        sides = {
            37: -1, /*left*/
            38: 'jump', /*up*/
            39: 1, /*right*/
            40: 'crouch' /* down */
        };
        mappings = { // map a WASD key to an arrow key
            65: 37, // A
            87: 38, // W
            83: 40, // S
            68: 39, // D
            32: 38 // SPACE
        };
        /*
        updateKeys = function () {
            if (pressedKeys[LEFT]) {
                player.moveToSide(1);
            } else if (pressedKeys[RIGHT]) {
                player.moveToSide(-1);
            }
        };
        */
        $(window)
            .on('keydown', function (e) {
                secondToLastPressed = lastPressed;
                lastPressed = e.which;
                pressedKeys[mappings[e.which] || e.which] = true;
            })
            .on('keydown', function (e) {
                var key = mappings[e.which] || e.which,
                    action = sides[key];
                if (action && action !== lastAction) {
                    lastAction = action;
                    if (action === 'jump') {
                        player.startJump();
                    } else {
                        player.moveToSide(action);
                    }
                }
            })
            .on('keyup', function (e) {
                pressedKeys[mappings[e.which] || e.which] = false;
            })
            .on('keyup', function (e) {
                var key = mappings[e.which] || e.which,
                    action = sides[key];
                if (action === 'jump') {
                    player.stopJump();
                } else if (action === 'crouch') {
                    player.crouch();
                } else if (action !== undefined) { // left or right
                    foundKey = 0;
                    $.each(pressedKeys, function (ind, val) {
                        if (val === true) {
                            foundKey = ind;
                            return false;
                        }
                    });
                    if (foundKey) {
                        event = jQuery.Event('keydown');
                        event.which = foundKey;
                        $(window).trigger(event);
                    } else {
                        player.moveToSide(0);
                        lastAction = 0;
                    }
                }
            });
    }
    function compensateForPing(packet, ping) {
        var compensation;
        compensation = ping || 0;
        compensation += packet.upstreamPing || 0;
        if (packet.startedMoving) {
            packet.startedMoving -= compensation;
        } else {
            packet.startedMoving = +new Date() - compensation;
        }
        return packet;
    }
    Entity = Movement.extend({
        init: function (position) {
            this.position.x = position.x || 0;
            this.position.y = position.y || 0;
        },
        partialUpdate: function (data, dumb) {
            var partialUpdateVector = function (vec, own) {
                if (vec) {
                    own.x = vec.x === undefined ? own.x : vec.x;
                    own.y = vec.y === undefined ? own.y : vec.y;
                }
            }
            partialUpdateVector(data.position, this.position);
            partialUpdateVector(data.delta, this.delta);
            if (!dumb) {
                this.autoStop(data.position, data.delta);
            }
        },
        updateFromPacket: function (data, dumb) {
            data = compensateForPing(data, ownPing);
            this.updateFromLocalData(data, dumb);
        },
        updateFromLocalData: function (data, dumb) {
            this.startedMoving = data.startedMoving;
            this.partialUpdate(data, dumb);
        },
        autoStop: function (position, delta) {
            if (!Math2D.vectorBool(delta)) {
                this.stop(position);
            }
        },
        sprite: null,
        stop: function (where) {
            // TODO calculate stop position when accel is implemented.
            this.position = where;
            this.delta = {x: 0, y: 0};
            this.startedMoving = null;
        }
    });
    Player = Entity.extend({
        sprite: {
            image: playerSprite.image,
            center: playerSprite.center
        },
        init: function (position, id) {
            this._super(position);
            setUpKeys(this);
            this.listenToSocketEvents();
            this.id = id;
        },
        wasMoving: null,
        listenToSocketEvents: function () {
            var that = this;
            socket.on('player-position-correct', function (data) {
                that.position = data.expected;
            });
        },
        moveToSide: function (side) {
            // side: -1 (left), 0 (stop) or 1 (right)
            var timestamp = +new Date(),
                delta,
                stopWhere,
                worldQueryResult;
            if (this.wasMoving) { // stopping
                stopWhere = this.currentPosition(timestamp);
                socket.emit('player-move', {
                    position: stopWhere,
                    direction: 0,
                });
                delta = this.delta;
                this.stop(stopWhere);
            } else {
                socket.emit('player-move', {
                    position: this.position,
                    direction: side,
                });
                delta = {
                    x: playerSpeed * side,
                    y: 0
                };
                this.updateFromLocalData({
                    delta: delta,
                    startedMoving: timestamp,
                    position: this.position});
            }
            this.wasMoving = side;
        }
    });
    Enemy = Entity.extend({
        sprite: {
            image: playerSprite.image,
            center: playerSprite.center
        },
        init: function (position) {
            this._super(position);
        }
    });
    enemiesList = {};
    /*
    Camera = new Class.extend({
        
    });
    
    World = new Class.extend({
        
    });
    */
    function gameRenderLoop() {
        // Render to the "game" layer. Request frame updates from browser (or
        // setTimeout). this is the only layer which needs constant updates
        // and slim code. The others might just use setInterval with large intervals
        // and/or respond to events.
        var oldTime = +new Date(),
            loop;
        loop = function () {
            var ctx = gameCanvasContext,
                player = window.player,
                enemies = enemiesList,
                enemy,
                predictedPosition,
                deCentered,
                time = +new Date(),
                dt = time - oldTime,
                enemyID;
            ctx.clearRect(0, 0, canvasSize.w, canvasSize.h);
            for (enemyID in enemies) {
                if (enemies.hasOwnProperty(enemyID)) {
                    enemy = enemies[enemyID];
                    if (enemy.startedMoving) {
                        predictedPosition = enemy.currentPosition(time);

                    } else {
                        predictedPosition = enemy.position;
                    }
                    deCentered = Math2D.vectorAdd(enemy.sprite.center, predictedPosition);
                    ctx.drawImage(enemy.sprite.image, deCentered.x, deCentered.y);
                }
            }
            if (player) {
                if (player.startedMoving) {
                    predictedPosition = player.currentPosition(time);
                } else {
                    predictedPosition = player.position;
                }
                deCentered = Math2D.vectorAdd(player.sprite.center, predictedPosition);
                ctx.drawImage(player.sprite.image, deCentered.x, deCentered.y);
            }
            if (world) {
                world.drawWorld(ctx);
            }
            requestAnimationFrame(loop, gameCanvas); // schedule next frame draw
        };
        loop();
    }
    function tryInit() {
        var $list = $('ul.announcements');
        // Start stuff up after every event has happened.
        if (playerSpriteLoaded) {
            socket.on('pawn-create', function (data) {
                enemiesList[data.id] = new Enemy(data.position);
            });
            socket.on('pawn-move', function (data) {
                var enemy = enemiesList[data.id];
                if (enemy === undefined) {
                    enemy = new Enemy(data.position)
                }
                enemy.updateFromPacket(data);
            });
            socket.on('pawn-remove', function (id) {
                delete enemiesList[id];
            });
            socket.emit('ready', function (creationData) {
                player = new Player(creationData.position, creationData.id);
                window.player = player;
                console.log('all loaded');
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
            // Debug information!
            (function () {
                var redrawList = {},
                    redrawDebug, // function to redraw all debug info
                    debugInfoTimeout = 1.6 * 1000;
                redrawDebug = function () {
                    var key,
                        data,
                        ctx = debugCanvasContext; // Get canvas context for debug info.
                    ctx.clearRect(0, 0, canvasSize.w, canvasSize.h); // clear debug canvas
                    for (key in redrawList) {
                        if (redrawList.hasOwnProperty(key)) {
                            data = redrawList[key];
                            if (data) {
                                ctx.beginPath();
                                ctx.arc(data.position.x, data.position.y, 10, 0, Math.PI * 2);
                                ctx.strokeStyle = '#11FF11'; // green
                                ctx.stroke();
                                if (data.wrongPosition) {
                                    ctx.beginPath();
                                    ctx.arc(data.wrongPosition.x, data.wrongPosition.y, 10, 0, Math.PI * 2);
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
