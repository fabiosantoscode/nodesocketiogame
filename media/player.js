/*jshint browser: true*/
(function () {
    'use strict';
    var Entity = window.Entity,
        Player,
        Enemy;

    Enemy = window.Enemy = Entity.extend({});
    Player = window.Player = Entity.extend({
        init: function (position, id, keyInput, networkAdapter) {
            this._super(position);
            this.setUpKeys(keyInput || window.keyInput);
            this.networkAdapter = networkAdapter || window.networkAdapter;
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
                if (+sides[key]) { // Released a "side" key
                    if (keyInput.isPressed(39)) {
                        that.moveToSide(sides[39]);
                    } else if (keyInput.isPressed(37)) {
                        that.moveToSide(sides[37]);
                    } else {
                        that.moveToSide(0);
                    }
                }
            });
        },
        wasMoving: null,
        movingToSide: undefined,
        moveToSide: function (side) {
            // side: -1 (left), 0 (stop) or 1 (right)
            var timestamp = +new Date(),
                delta,
                stopWhere,
                worldQueryResult;
            if (side === this.movingToSide) {
                return;
            } else {
                this.movingToSide = side;
            }
            if (side === 0) { // stopping
                stopWhere = this.currentPosition(timestamp);
                this.networkAdapter.sendPlayerMovement(
                    this, side);
                this.stop(this.currentPosition());
            } else {
                this.networkAdapter.sendPlayerMovement(
                    this, side);
                delta = {
                    x: Player.speed * side,
                    y: 0
                };
                this.update({
                    delta: delta,
                    startedMoving: timestamp,
                    position: this.currentPosition(timestamp)});
            }
            this.wasMoving = side;
        }
    });
}());
