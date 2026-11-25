'use strict';

// Node-side regression tests for the core-banking stub (run by `npm test` after Karma).
var assert = require('assert');
var seed = require('../../mock-server/seed');
var store = require('../../mock-server/store');

var passed = 0;

function test(name, fn) {
  fn();
  passed++;
  process.stdout.write('  ok - ' + name + '\n');
}

test('every seeded account renders its transactions with a channel label', function () {
  seed.ACCOUNTS.forEach(function (a) {
    store.transactionsFor(a.accountNumber).map(store.txnView).forEach(function (t) {
      assert.ok(t.channelLabel, a.accountNumber + ' ' + t.channel + ' has no channelLabel');
    });
  });
});

test('Zelle transfer on Advantage Checking is labelled Zelle', function () {
  var zelle = store.transactionsFor('104000123455').map(store.txnView)
    .filter(function (t) { return t.channel === 'ZELLE'; });
  assert.ok(zelle.length > 0, 'expected a seeded ZELLE transaction');
  assert.strictEqual(zelle[0].channelLabel, 'Zelle');
});

test('a channel code without a label falls back to the code instead of throwing', function () {
  assert.strictEqual(store.channelLabel('RTP'), 'RTP');
  assert.strictEqual(store.channelLabel('CARD'), 'Card');
});

process.stdout.write('mock-server: ' + passed + ' tests passed\n');
