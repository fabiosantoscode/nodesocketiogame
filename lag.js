'use strict';
var _ = require('./underscore.js');
module.exports = function (config) {
    return {
        makeInducer: function () {
            var lag = config.lag,
                variance = ((0.5 * lag) / 2),
                args = arguments;
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
                    accumTime += ((Math.random() * variance) + lag) + 1;
                    setTimeout(fn, accumTime);
                });
            };
        }
    };
};