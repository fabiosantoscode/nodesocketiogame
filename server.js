(function () {
    'use strict';
    var config = {
            media: __dirname + "/media",
            httport: 8080,
            socketioport: 9090,
            msgLimit: 100,
            lag: 100
        },
        express = require('express'),
        http = require('http'),
        // _ = require('./underscore.js'),
        // url = require('url'),
        app = express(),
        EventEmitter = require('events').EventEmitter,
        otherSockets = new EventEmitter(),
        globalUpdateEvent = new EventEmitter(),
        debugInfoChannel = new EventEmitter(),
        server = http.createServer(app),
        io = require('socket.io').listen(server),
        syncClock = require('./syncclock.js')(config).syncClock,
        induceLag = require('./lag.js')(config).makeInducer,
        playerID = 0;
    app
        .use(express.bodyParser())
        .use("/media", express['static'](config.media))
        .get('/', function (req, res) {
            res.render('../index.jade', {});
        });
    function predictPosition(position, delta, ms) {
        var s = (ms || 1000) / 1000;
        return {
            x: (+position.x) + ((+delta.x) * (+s)),
            y: (+position.y) + ((+delta.y) * (+s))
        };
    }
    function sqr(a) {
        return a * a;
    }
    function distance(a, b) {
        var xdist = Math.abs(a.x - b.x),
            ydist = Math.abs(a.y - b.y);
        return Math.sqrt(sqr(xdist) + sqr(ydist));
    }
    io.sockets.on('connection', function (socket) {
        var playerPosition = {x: 0, y: 480},
            playerSpeed = 350.0, // pixels per second.
            playerStartMove = null,
            playerDelta = {x: 0, y: 0},
            createData,
            latestMove = 0,
            informOtherSockets,
            playerPing,
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
        socket.on('sync-clock', syncClock);
        socket.on('ready', function (callback) {
            pinger();
            socket.broadcast.emit('message', {'announce': 'Player ' + playerID + ' has connected'});
            socket.broadcast.emit('pawn-create', createData);
            callback(createData);
            otherSockets.emit('please-inform-me', function (data) {
                socket.emit('pawn-create', data);
            });
            otherSockets.on('please-inform-me', informOtherSockets);
            globalUpdateEvent.on('tick', globalUpdateEventHandler);
        });
        socket.on('player-move', function (data) {
            var timestamp, eventData, dt, expectedPosition, didCorrect;
            latestMove = data.timestamp;
            induceLag(function () {
                timestamp = +new Date();
            }, function () {
                if (data.direction) {
                    playerDelta.x = (+data.direction) * playerSpeed;
                    playerStartMove = +new Date();
                    debugInfoChannel.emit('key', {
                        position: playerPosition,
                        delta: playerDelta
                    });
                } else { // stopping
                    if (playerStartMove) {
                        // calculate stop position using delta vector.
                        // Then verify given against expected
                        dt = (timestamp - playerStartMove);
                        expectedPosition = predictPosition(playerPosition, playerDelta, dt);
                        if (distance(playerPosition, data.position) < 
                                distance(playerPosition, expectedPosition) * 1.01) {
                            playerPosition = data.position;
                        } else {
                            didCorrect = true;
                            playerPosition = expectedPosition
                        }
                        playerDelta = {x: 0, y: 0};
                        playerStartMove = null;
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
            socket.emit('ping', pingStarted, function () {
                playerPing = +new Date() - pingStarted;
                alreadyCalled=true;
                setTimeout(pinger, 5000);
            });
            setTimeout(function () {
                if (!alreadyCalled) {
                    pinger();
                }
            }, 6000);
        }
        socket.on('disconnect', function () {
            socket.broadcast.emit('message', {'announce': 'Player ' + playerID + ' was disconnected'});
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
        setInterval(tickGlobalEvents, 5000);
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
