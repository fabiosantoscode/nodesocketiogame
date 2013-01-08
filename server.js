(function () {
    'use strict';
    var config = {
            media: __dirname + "/media",
            sharedLogic: __dirname + "/shared_logic",
            httport: 8080,
            socketioport: 9090,
            msgLimit: 100,
            tickInterval: 5000,
            lag: 100 // half ping
        },
        express = require('express'),
        http = require('http'),
        Math2D = require('./shared_logic/math2d.js').Math2D,
        Entity = require('./shared_logic/entity.js').Entity,
        Pawn,
        // _ = require('./underscore.js'),
        // url = require('url'),
        app = express(),
        EventEmitter = require('events').EventEmitter,
        otherSockets = new EventEmitter(),
        globalUpdateEvent = new EventEmitter(),
        debugInfoChannel = new EventEmitter(),
        server = http.createServer(app),
        io = require('socket.io').listen(server),
        induceLag = require('./lag.js')(config).makeInducer,
        worldFloor = 479,
        playerID = 0;
    app
        .use(express.bodyParser())
        .use("/media", express['static'](config.media))
        .use("/shared_logic", express['static'](config.sharedLogic))
        .get('/', function (req, res) {
            res.render('../index.jade', {});
        });
    Pawn = Entity.extend({
        init: function(position, id) {
            this.position = position;
            this.id = id;
        },
        tellPeers: function () {
            var packet = {
                    position: this.position,
                    delta: this.delta,
                    id: this.id,
                    upstreamPing: this.getPing()
                },
                event;
            this.getSocket().broadcast.emit(this.remoteCreated ? 'pawn-move' : 'pawn-create', packet);
            this.remoteCreated = true;
        }
    });
    io.sockets.on('connection', function (socket) {
        var player,
            playerSpeed = 350.0, // pixels per second.
            createData,
            informOtherSockets,
            playerPing = 100, // half a ping
            pinger,
            globalUpdateEventHandler;
        playerID += 1;
        player = new Pawn({x: 0, y: worldFloor}, playerID);
        createData = {
            position: player.position,
            id: player.id
        };
        player.getPing = function () {return playerPing;}
        player.getSocket = function () {return socket;}
        globalUpdateEventHandler = function () {
        };
        informOtherSockets = function (callback) {
            callback({
                position: player.position,
                id: player.id
            });
        };
        socket.on('ready', function (callback) {
            pinger();
            socket.broadcast.emit('pawn-create', createData);
            callback(createData);
            otherSockets.emit('please-inform-me', function (data) {
                socket.emit('pawn-create', data);
            });
            otherSockets.on('please-inform-me', informOtherSockets);
            globalUpdateEvent.on('tick', globalUpdateEventHandler);
        });
        socket.on('player-move', function (data) {
            var timestamp,
                eventData,
                stopWhere,
                dt,
                expectedPosition,
                didCorrect;
            induceLag(function () {
                timestamp = +new Date();
            }, function () {
                if (data.direction) {
                    player.partialUpdate({
                        delta: {x: +data.direction * playerSpeed},
                        startedMoving: +new Date() - playerPing
                    }, true);
                } else { // stopping
                    if (player.startedMoving !== undefined) {
                        // calculate stop position using delta vector.
                        // Then verify given against expected
                        dt = (timestamp - player.startedMoving);
                        expectedPosition = Math2D.predictPosition(player.position, player.delta, dt + playerPing);
                        if (Math2D.vectorLength(expectedPosition, data.position) <
                                Math2D.vectorLength(player.position, expectedPosition) * 0.1) { // OK to move 10% faster
                            stopWhere = data.position;
                        } else {
                            socket.emit('player-position-correct', {
                                expected: expectedPosition,
                                position: data.position
                            });
                            didCorrect = true;
                            stopWhere = expectedPosition;
                        }
                        player.partialUpdate({
                            delta: {x: 0, y: 0},
                            position: stopWhere
                        }, true);
                    }
                }
                // Send debug info
                debugInfoChannel.emit('key', {
                    position: player.position,
                    delta: player.delta,
                    wrongPosition: didCorrect && data.position
                });
            })();
        });
        pinger = function () {
            var pingStarted = +new Date(),
                alreadyCalled = false;
            socket.once('pong-event', function () {
                playerPing = +new Date() - pingStarted;
                playerPing += config.lag;
                playerPing /= 2;
                alreadyCalled = true;
                setTimeout(pinger, 5000);
            });
            socket.emit('ping-event', playerPing);
        };
        socket.on('disconnect', function () {
            socket.broadcast.emit('pawn-remove', player.id);
            otherSockets.removeListener('please-inform-me', informOtherSockets);
            globalUpdateEvent.removeListener('tick', globalUpdateEventHandler);
        });
    });
    (function () {
        var globalUpdateData = [];
        function tickGlobalEvents() {
            globalUpdateEvent.once('tick', function () {
                // Runs when all events have been dealt with
                // (EventEmitter.emit calls them in order of attachment)
                io.sockets.emit('global-update', globalUpdateData);
                globalUpdateData = [];
            });
            globalUpdateEvent.emit('tick', function (data) {
                globalUpdateData.push(data);
            });
        }
        setInterval(tickGlobalEvents, config.tickInterval);
    }());
    debugInfoChannel.on('key', function (data) {
        // the "key frames"
        io.sockets.emit('debug-key', data);
    });
    debugInfoChannel.on('periodic', function (data) {
        // the rest of the "frames"
        io.sockets.emit('debug-periodic', data);
    });
    server.listen(config.socketioport);
    console.log('socket.io on ' + config.socketioport);
    console.log('listening on ' + config.httport);
    app.listen(config.httport);
}());
