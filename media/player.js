(function () {
    'use strict';
    var Entity = window.Entity,
        Player,
        Enemy;

    Enemy = window.Enemy = Entity.extend({});
    Player = window.Player = Entity.extend({
        init: function (position, id, keyInput, socket) {
            this._super(position);
            this.setUpKeys(keyInput || window.keyInput);
            this.socket = socket || window.socket;
            // TODO: do not do the following lines when entityWorld is integrated
            this.listenToSocketEvents();
            this.id = id;
        },
        tick: function (dt) {

        },
        setUpKeys: function (keyInput) {
            var sides,
                that = this;
            sides = {
                37: -1, /*left*/
                38: 'jump', /*up*/
                39: 1, /*right*/
                40: 'crouch' /* down */
            };
            keyInput.onPress(function (key) {
                var action = sides[key];
                if (+action) { // Pressed a "side" key
                    that.moveToSide(action);
                }
            });
            keyInput.onRelease(function (key) {
                var action = sides[key];
                if (+action) { // Released a "side" key
                    that.moveToSide(0);
                }
            });
        },
        wasMoving: null,
        listenToSocketEvents: function () {
            var that = this;
            // TODO this event list. should be removed.
            this.socket.on('player-position-correct', function (data) {
                that.position = data.expected;
            });
        },
        moveToSide: function (side) {
            // side: -1 (left), 0 (stop) or 1 (right)
            var timestamp = +new Date(),
                delta,
                stopWhere,
                worldQueryResult;
            // TODO isn't it if (side === 0) ?
            if (this.wasMoving) { // stopping
                stopWhere = this.currentPosition(timestamp);
                this.socket.emit('player-move', {
                    position: stopWhere,
                    direction: 0
                });
                delta = this.delta;
                this.stop(stopWhere);
            } else {
                this.socket.emit('player-move', {
                    position: this.position,
                    direction: side
                });
                delta = {
                    x: Player.speed * side,
                    y: 0
                };
                this.update({
                    delta: delta,
                    startedMoving: timestamp,
                    position: this.position});
            }
            this.wasMoving = side;
        }
    });
}());