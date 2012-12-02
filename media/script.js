jQuery(function ($) {
    'use strict';
    var hostname = window.location.hostname,
        socket = io.connect('http://' + hostname + ':9090'),
        canvasID = 'gamecanvas',
        Entity,
        //World,
        Player,
        player,
        Enemy,
        playerSpeed = 350.0,
        enemiesList = [],
        //Camera,
        playerSprite = {
            image: new Image(),
            center: {x: -16, y: -63}
        },
        playerSpriteLoaded,
        // debug stuff
        $pingDisplay = $('.debuginfo.ping');
    function vectorSum(a, b) {
        return {
            x: a.x + b.x,
            y: a.y + b.y
        };
    }
    function vectorMul(a, b) {
        return {
            x: a.x * (b.x || b),
            y: a.y * (b.y || b)
        };
    }
    function predictPosition(position, delta, ms) { // TODO add acceleration
        var s = (ms || 1000) / 1000;
        return {
            x: (+position.x) + ((+delta.x) * (+s)),
            y: (+position.y) + ((+delta.y) * (+s))
        };
    }
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
    Entity = Class.extend({
        init: function (position) {
            this.position.x = position.x || 0;
            this.position.y = position.y || 0;
            this.sprite.jcImage = jc.image({
                image: this.sprite.image,
                x: this.position.x + this.sprite.center.x,
                y: this.position.y + this.sprite.center.y
            });
        },
        startedMoving: null,
        position: {x: 0, y: 0},
        delta: {x: 0, y: 0},
        update: function (position, delta, startedMoving, autoMove) {
            this.position = position;
            this.delta = delta;
            this.startedMoving = startedMoving;
            if (autoMove && (delta.x || delta.y)) {
                this.move(position, delta, startedMoving);
            } else if (autoMove) {
                this.stop(position);
            }
        },
        sprite: null,
        move: function (where, whereTo, startedMoving) {
            var animateMove,
                that = this,
                oldwhere = where;
            this.position = where;
            this.delta = whereTo;
            this.startedMoving = +new Date();
            this.sprite.jcImage.animate({
                x: where.x + this.sprite.center.x,
                y: where.y + this.sprite.center.y
            });
            animateMove = function (prediction) {
                var nextPrediction = predictPosition(prediction, whereTo, 4000);
                that.sprite.jcImage.animate({
                    x: prediction.x + that.sprite.center.x,
                    y: prediction.y + that.sprite.center.y
                }, 4000, function () {
                    animateMove(nextPrediction);
                });
            };
            animateMove(predictPosition(where, whereTo, 4000));
        },
        stop: function (position) {
            var where = position; // TODO calculate stop position when accel is implemented.
            this.sprite.jcImage.stop();
            this.sprite.jcImage.animate(vectorSum(where, this.sprite.center));
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
                that.sprite.jcImage.animate({
                    x: data.expected.x + that.sprite.center.x,
                    y: data.expected.y + that.sprite.center.y
                }, 100); // TODO make this alter deceleration.
            });
        },
        moveToSide: function (side) {
            // side: -1 (left), 0 (stop) or 1 (right)
            var timestamp = +new Date(),
                delta,
                stopWhere,
                that = this;
            if (this.wasMoving) { // stop
                stopWhere = predictPosition(this.position, this.delta, timestamp - this.startedMoving);
                socket.emit('player-move', {
                    position: stopWhere,
                    direction: 0,
                    timestamp: timestamp
                });
                delta = this.delta;
                this.stop(stopWhere);
            } else {
                socket.emit('player-move', {
                    position: this.position,
                    direction: side,
                    timestamp: timestamp
                });
                delta = {
                    x: playerSpeed * side,
                    y: 0
                };
                that.update(this.position, delta, timestamp);
                that.move(this.position, delta, timestamp);
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
    enemiesList = [];
    /*
    Camera = new Class.extend({
        
    });
    
    World = new Class.extend({
        
    });
    */
    function tryInit() {
        var $list = $('ul.announcements');
        // Start stuff up after every event has happened.
        if (playerSpriteLoaded) {
            socket.on('pawn-create', function (data) {
                enemiesList[data.id] = new Enemy(data.position);
            });
            socket.on('pawn-move', function (data) {
                var enemy = enemiesList[data.id];
                if (enemy) {
                    enemy.update(data.position, data.delta, data.timestamp, true);
                }
            });
            socket.on('pawn-remove', function (id) {
                delete enemiesList[id];
            });
            socket.emit('ready', function (creationData) {
                jc.start(canvasID, true);
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
            // Debug information!
            socket.on('debug-key', function (data) {
                var blue = {r: 50, g: 50, b: 255, a: 1},
                    red = {r: 255, g: 50, b: 50, a: 1},
                    green = {r: 50, g: 255, b: 50, a: 1},
                    col = data.wrongPosition ? green : blue,
                    thisKeyCircle = jc.circle({
                        x: data.position.x,
                        y: data.position.y,
                        radius: 10,
                        color: col
                    }),
                    errorCorrectionCircle,
                    whereTo = vectorSum(data.position, vectorMul(data.delta, 0.1)),
                    thisKeyLine = jc.line([
                        [data.position.x, data.position.y],
                        [whereTo.x, whereTo.y]], col);
                if (data.wrongPosition) {
                    errorCorrectionCircle = jc.circle({
                        x: data.wrongPosition.x,
                        y: data.wrongPosition.y,
                        radius: 9,
                        color: red
                    });
                }
                setTimeout(function () {
                    thisKeyCircle.del();
                    if (errorCorrectionCircle) {
                        errorCorrectionCircle.del();
                    }
                    if (thisKeyLine) {
                        thisKeyLine.del();
                    }
                }, 3 * 1000);
            });
        }
    }
    playerSprite.image.onload = function () {
        playerSpriteLoaded = true;
        tryInit();
    };
});
