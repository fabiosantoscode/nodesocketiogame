'use strict';
module.exports = function (config) {
    var induceLag = require('./lag.js')(config).makeInducer;
    return {
        syncClock: function (callback) {
            var timestamp;
            induceLag(function () {
                timestamp = +new Date();
            }, function () {
                callback(timestamp);
            })();
        }
    };
}