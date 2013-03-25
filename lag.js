/*jshint node: true*/
'use strict';
var _ = require('./underscore.js');
module.exports = function (config) {
    return {
        makeInducer: function () {
            var lag = config.lag,
                variance = 0.3 * lag,
                args = arguments,
                rand = Math.random;
            // Because we are going to add rand() * variance and rand => [0; 1]
            lag -= variance * 0.5;
            if (!lag) {
                return function () {
                    _.each(_.toArray(args), function (fn) {
                        fn();
                    });
                };
            }
            return function () {
                var accumTime = 0;
                _.each(_.toArray(args), function (fn) {
                    accumTime += lag + (rand() * variance);
                    setTimeout(fn, accumTime);
                });
            };
        }
    };
};
