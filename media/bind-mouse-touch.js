function setUpMouseAndTouch(player) {
    // Respond to click and touch (TODO) events by telling the player to shoot.
    $('.group-canvases-as-layers')
        .click(function (e) {
            var offset = $(this).offset(),
                clickOffset = {
                    x: e.pageX - offset.left,
                    y: e.pageY - offset.top
                },
                absClick = window.camera.absoluteCoordinates(clickOffset),
                absPlayer = Math2D.vectorAdd(
                    player.position,
                    player.sprite.center);
            window.player.shoot(player.position, Math2D.vectorSub(absPlayer, absClick));
        });
}

