'use strict';

/*
 * Regression tests for the stub's per-transfer limits (mock-server/api.js). Runs under plain Node:
 *   npm run test:server
 * The limits mirror core-banking's product_limit table (DDA-CHK 10000.00, DDA-SAV 25000.00, CC-VISA 15000.00).
 */

var assert = require('assert');
var http = require('http');
var express = require('express');

var seed = require('../../mock-server/seed');

var CHECKING = '104000123455';
var SAVINGS = '104000123463';
var CARD = '412000055217';
var AUTH = 'Basic ' + Buffer.from('teller01:Teller#2019').toString('base64');

var app = express();
app.use('/api/v1', require('../../mock-server/api'));
var server = http.createServer(app);
var keySeq = 0;

function transfer(from, to, amount, done) {
  keySeq += 1;
  var payload = JSON.stringify({ fromAccount: from, toAccount: to, amount: amount, idempotencyKey: 'limits-' + keySeq });
  var req = http.request({
    port: server.address().port, path: '/api/v1/transfers', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), Authorization: AUTH }
  }, function (res) {
    var text = '';
    res.on('data', function (chunk) { text += chunk; });
    res.on('end', function () {
      var body;
      try { body = JSON.parse(text); } catch (e) { body = { raw: text.slice(0, 200) }; }
      done(res.statusCode, body);
    });
  });
  req.end(payload);
}

var tests = [
  ['the seeded card is a CC-VISA account', function (done) {
    var card = seed.ACCOUNTS.filter(function (a) { return a.accountNumber === CARD; })[0];
    assert.ok(card, 'card account ' + CARD + ' is seeded');
    assert.strictEqual(card.productCode, 'CC-VISA');
    done();
  }],
  ['card payment (CC-VISA destination) posts instead of crashing', function (done) {
    transfer(SAVINGS, CARD, '25.00', function (status, body) {
      assert.strictEqual(status, 201, status + ' ' + JSON.stringify(body));
      assert.strictEqual(body.status, 'POSTED');
      done();
    });
  }],
  ['CC-VISA per-transfer limit is 15000.00, as in core-banking product_limit', function (done) {
    transfer(SAVINGS, CARD, '15000.01', function (status, body) {
      assert.strictEqual(status, 422, status + ' ' + JSON.stringify(body));
      assert.strictEqual(body.code, 'LIMIT_EXCEEDED');
      assert.strictEqual(body.message, 'Amount exceeds the per-transfer limit of 15000.00 for CC-VISA');
      done();
    });
  }],
  ['CC-VISA accepts exactly 15000.00', function (done) {
    transfer(SAVINGS, CARD, '15000.00', function (status, body) {
      assert.strictEqual(status, 201, status + ' ' + JSON.stringify(body));
      done();
    });
  }],
  ['DDA-CHK per-transfer limit is still 10000.00', function (done) {
    transfer(SAVINGS, CHECKING, '10000.01', function (status, body) {
      assert.strictEqual(status, 422, status + ' ' + JSON.stringify(body));
      assert.strictEqual(body.code, 'LIMIT_EXCEEDED');
      assert.strictEqual(body.message, 'Amount exceeds the per-transfer limit of 10000.00 for DDA-CHK');
      done();
    });
  }],
  ['DDA-SAV per-transfer limit is still 25000.00', function (done) {
    transfer(CHECKING, SAVINGS, '25000.01', function (status, body) {
      assert.strictEqual(status, 422, status + ' ' + JSON.stringify(body));
      assert.strictEqual(body.code, 'LIMIT_EXCEEDED');
      assert.strictEqual(body.message, 'Amount exceeds the per-transfer limit of 25000.00 for DDA-SAV');
      done();
    });
  }]
];

var failed = 0;
var current = null;

function run(i) {
  if (i === tests.length) {
    server.close();
    process.stdout.write('\n' + tests.length + ' run, ' + (tests.length - failed) + ' passed, ' + failed + ' failed\n');
    process.exitCode = failed ? 1 : 0;
    return;
  }
  var finished = false;
  current = function (err) {
    if (finished) { return; }
    finished = true;
    if (err) { failed += 1; }
    process.stdout.write((err ? 'FAIL ' : 'ok   ') + tests[i][0] + (err ? '\n     ' + err.message.split('\n')[0] : '') + '\n');
    run(i + 1);
  };
  try {
    tests[i][1](function () { current(); });
  } catch (e) {
    current(e);
  }
}

// assertions run inside HTTP callbacks, so a failed one surfaces here
process.on('uncaughtException', function (e) { current(e); });

server.listen(0, function () { run(0); });
