function cameraFactory (lookAt, world, canvasSize) {
    return new Camera(
        lookAt || {x:0},
        world || {},
        canvasSize || {w: 640, h: 480}
    );
}
test('visible()', function () {
    var camera = cameraFactory(undefined, undefined, /* canvas size */{w: 1000}),
        entity = {
            position: {x: 0},
            size: {w: 100}
        };
    camera.offset = 99;
    ok(camera.visible(entity), 'left boundary, inside');
    camera.offset = 101;
    ok(!camera.visible(entity), 'left boundary, outside');
    
    camera.offset = -999;
    ok(camera.visible(entity), 'right boundary, inside');
    camera.offset = -1001;
    ok(!camera.visible(entity), 'right boundary, outside');
});
test('update()', function () {
    var lookAt = {currentPosition: function () {return {x: 0, y: 0}}, size: {w: 10}},
        camera = cameraFactory(lookAt),
        oldPosition;
    camera.update();
    oldPosition = camera.offset;
    
    lookAt.currentPosition = function () {return {x: 1, y: 0}};
    camera.update();
    equal(camera.offset, oldPosition + 1);
});
test('offsetCoordinates()', function () {
    // A camera's offset is zero by default.
    var camera = cameraFactory();
    deepEqual(
        camera.offsetCoordinates({x: 10, y: 10}),
        {x: 10, y: 10}, 'no offset');
    camera.offset = 10;
    deepEqual(
        camera.offsetCoordinates({x: 10, y: 0}),
        {x: 0, y: 0}, 'offset by -10 since the camera is 10 to the right');
});
test('toBox()', function () {
    var camera = cameraFactory();
    deepEqual(camera.toBox(), {
        position: {x: 0, y: 0},
        size: {w: 640, h: 480}});
});
