/*jshint node: true*/
(function () {
    'use strict';
    var config = {
            media: __dirname + "/media",
            sharedLogic: __dirname + "/shared_logic",
            httpport: 8080,
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
        app = express(),
        EventEmitter = require('events').EventEmitter,
        debugInfoChannel = new EventEmitter(),
        server = http.createServer(),
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
            var packet = this.toPacket();
            packet.upstreamPing = this.getPing();
            this.getSocket().broadcast.emit('pawn-update', packet);
        }
    });
    io.sockets.on('connection', function (socket) {
        var player,
            playerSpeed = 350.0, // pixels per second.
            createData,
            playerPing = 100, // half a ping
            pinger;
        playerID += 1;
        player = new Pawn({x: 0, y: worldFloor}, playerID);
        createData = {
            position: player.position,
            id: player.id
        };
        player.getPing = function () {return playerPing;};
        player.getSocket = function () {return socket;};
        socket.on('ready', function (callback) {
            pinger();
            callback(createData);
        });
        socket.on('player-move', function (data) {
            var timestamp, stopping;
            induceLag(function () {
                timestamp = +new Date();
            }, function () {
                if (player.isMoving() && !data.direction ) { // if stopping
                    stopping = true;
                }
                player.partialUpdate({
                    delta: {x: +data.direction * playerSpeed},
                    startedMoving: timestamp
                }, true);
                if (stopping) {
                    socket.emit('player-position-correct', {
                        expected: player.currentPosition(timestamp)
                    });
                    // Send debug info
                    debugInfoChannel.emit('key', {
                        position: player.position,
                        delta: player.delta,
                        wrongPosition: data.position});
                }
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
                pinger.timeout = setTimeout(pinger, 10000);
            });
            socket.emit('ping-event', playerPing);
        };
        socket.on('disconnect', function () {
            socket.broadcast.emit('pawn-remove', player.id);
            clearTimeout(pinger.timeout);
        });
    });
    debugInfoChannel.on('key', function (data) {
        // the "key frames"
        io.sockets.emit('debug-key', data);
    });
    console.log('socket.io on ' + config.socketioport);
    console.log('listening on ' + config.httport);
    app.listen(config.httpport);
    server.listen(config.socketioport);
}());
