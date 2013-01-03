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
    io.sockets.on('connection', function (socket) {
        var playerPosition = {x: 0, y: worldFloor},
            playerSpeed = 350.0, // pixels per second.
            playerStartMove = undefined,
            playerDelta = {x: 0, y: 0},
            createData,
            latestMove = 0,
            informOtherSockets,
            playerPing = 100, // half a ping
            pinger,
            globalUpdateEventHandler;
        playerID += 1;
        createData = {
            position: playerPosition,
            id: playerID
        };
        globalUpdateEventHandler = function () {
        };
        informOtherSockets = function (callback) {
            callback({
                position: playerPosition,
                id: playerID
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
                dt,
                expectedPosition,
                didCorrect;
            latestMove = data.timestamp;
            induceLag(function () {
                timestamp = +new Date();
            }, function () {
                if (data.direction) {
                    playerDelta.x = (+data.direction) * playerSpeed;
                    playerStartMove = +new Date() - playerPing;
                    // Send debug info
                    debugInfoChannel.emit('key', {
                        position: playerPosition,
                        delta: playerDelta
                    });
                } else { // stopping
                    if (playerStartMove !== undefined) {
                        // calculate stop position using delta vector.
                        // Then verify given against expected
                        dt = (timestamp - playerStartMove);
                        expectedPosition = Math2D.predictPosition(playerPosition, playerDelta, dt + playerPing);
                        if (Math2D.vectorLength(expectedPosition, data.position) <
                                Math2D.vectorLength(playerPosition, expectedPosition) * 0.1) { // OK to move 10% faster
                            playerPosition = data.position;
                        } else {
                            socket.emit('player-position-correct', {
                                expected: expectedPosition,
                                position: data.position
                            });
                            didCorrect = true;
                            playerPosition = expectedPosition;
                        }
                        playerDelta = {x: 0, y: 0};
                        playerStartMove = undefined;
                        // Send debug info
                        debugInfoChannel.emit('key', {
                            position: playerPosition,
                            delta: playerDelta,
                            wrongPosition: didCorrect && data.position
                        });
                    }
                }
                eventData = {
                    timestamp: timestamp,
                    position: playerPosition,
                    delta: playerDelta,
                    id: playerID
                };
                socket.broadcast.emit('pawn-move', eventData);
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
            socket.broadcast.emit('pawn-remove', playerID);
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
