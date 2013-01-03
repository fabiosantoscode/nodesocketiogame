(function (require, exports) {
    'use strict';
    if (require) {
        require('inheritance.js');
    }
    exports.FreshestUpcomingEvent = Class.extend({
        upcomingTimeout: undefined,
        upcomingTimeoutTime: undefined,
        callback: function () {},
        onAddCallback: function () {},
        data: undefined,
        clear: function () {
            if (this.upcomingTimeout) {
                clearTimeout(this.upcomingTimeout);
            }
        },
        trigger: function (data) {
            this.callback(data);
        },
        later: function (timeout, data) {
            var that = this,
                realTime = timeout + (+new Date());
            if (this.upcomingTimeoutTime < realTime) {
                return;
            }
            this.upcomingTimeoutTime = realTime;
            if (this.onAddCallback) {
                this.onAddCallback(timeout, data);
            }
            if (this.callback) {
                setTimeout(function () {
                    that.callback(data);
                    that.clear();
                }, timeout);
            }
        },
        on: function (callback) {
            this.callback = callback;
        },
        onAdd: function (callback) {
            this.onAddCallback = callback;
        },
        get: function() {
            return this.data;
        }
    });
}(this.require, (this.module && this.module.exports) || window));
