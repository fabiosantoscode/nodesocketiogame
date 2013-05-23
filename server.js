/*jshint node: true*/
(function () {
    'use strict';
    var config = {
            media: __dirname + "/media",
            sharedLogic: __dirname + "/shared_logic",
            httpport: 8080,
            socketioport: 9090,
            lag: 100 // half ping
        },
        express = require('express'),
        server = require('http').createServer(),
        io = require('socket.io').listen(server),
        app = express(),
        EntityWorld = require('./shared_logic/entity-world.js').EntityWorld,
        world;
    app
        .use(express.bodyParser())
        .use("/media", express['static'](config.media))
        .use("/shared_logic", express['static'](config.sharedLogic))
        .get('/', function (req, res) {
            res.render('../index.jade', {});
        });

    world = new EntityWorld();
    world.startServer(io);
    
    console.log('socket.io on ' + config.socketioport);
    console.log('listening on ' + config.httpport);
    app.listen(config.httpport);
    server.listen(config.socketioport);
}());
