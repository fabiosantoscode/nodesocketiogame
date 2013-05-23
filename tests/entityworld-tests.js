/*globals asyncTest, deepEqual, equal, expect, module
, notDeepEqual, notEqual, notStrictEqual, ok, QUnit,
raises, start, stop, strictEqual, test, window
*/
(function () {
    'use strict';
    var Entity = window.Entity,
        EntityWorld = window.EntityWorld,
        Math2D = window.Math2D;
    test('Test adding and removing entities', function () {
        var eww = new EntityWorld(),
            mockEntity = {};
        eww.attach(mockEntity);
        ok(eww.getEntityCount());
        eww.detach(mockEntity);
        ok(!eww.getEntityCount());
    });
    test('Test IDs', function () {
        var mockEntity = {},
            mockEntity2 = {},
            entw = new EntityWorld();
        entw.attach(mockEntity);
        entw.attach(mockEntity2);
        // check their IDs
        ok(mockEntity.id);
        ok(mockEntity2.id);
        ok(mockEntity.id !== mockEntity2.id);
    });
    test('Test iteration', function () {
        expect(2);
        var entw = new EntityWorld(),
            ent1 = {},
            ent2 = {},
            ent3 = {};
        entw.attach(ent1);
        entw.attach(ent2);
        entw.attach(ent3);
        entw.detach(ent3);
        entw.iterate(function (ent) {
            ok(true, 'Iterating');
        });
    });
    test('Delta compress', function () {
        var entw = new EntityWorld(),
            ent1 = new Entity(Math2D.origin),
            ent2 = new Entity(Math2D.origin),
            data,
            cmp;
        entw.attach(ent1);
        entw.attach(ent2);
        data = entw.deltaCompress(-1);
        cmp = {};
        cmp[ent1.id] = ent1.toPacket();
        cmp[ent2.id] = ent2.toPacket();
        deepEqual(data.entities, cmp);
    });
    test('delta uncompress', function () {
        // Compress entw with 2 entities into a new entity world,
        // Check that the new entity world contains the correct data.
        var entw = new EntityWorld(),
            entw2 = new EntityWorld(),
            ent1 = new Entity(Math2D.origin),
            ent2 = new Entity(Math2D.origin),
            data;
        entw.attach(ent1);
        entw.attach(ent2);
        ent2.partialUpdate({position: {x: 3}});
        ent2.partialUpdate({position: {y: -1}});
        ent1.partialUpdate({position: {y: -1}});
        data = entw.deltaCompress(-1);
	data.changed = 65536; // force entw2 to take it as the most recent
        entw2.deltaUncompress(data);
        deepEqual(entw2.entities[ent2.id].toPacket(), ent2.toPacket());
        deepEqual(entw2.entities[ent1.id].toPacket(), ent1.toPacket());
    });
}());
