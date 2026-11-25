'use strict';

/*
 * Regression tests for the stub's per-transfer limits (mock-server/api.js). Runs under plain Node:
 *   npm run test:server
 */

var assert = require('assert');
var http = require('http');
var express = require('express');

var seed = require('../../mock-server/seed');
var store = require('../../mock-server/store');

var CHECKING = '104000123455';
var SAVINGS = '104000123463';
var CARD = '440000528719';
var AUTH = 'Basic ' + new Buffer('teller01:Teller#2019').toString('base64');

var app = express();
app.use('/api/v1', require('../../mock-server/api'));
var server = http.createServer(app);
var keySeq = 0;

function transfer(to, amount, done) {
  keySeq += 1;
  var payload = JSON.stringify({ fromAccount: SAVINGS, toAccount: to, amount: amount, idempotencyKey: 'limits-' + keySeq });
  var req = http.request({
    port: server.address().port, path: '/api/v1/transfers', method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload), Authorization: AUTH }
  }, function (res) {
    var text = '';
    res.on('data', function (chunk) { text += chunk; });
    res.on('end', function () {
      var body;
      try { body = JSON.parse(text); } catch (e) { body = { raw: text }; }
      done(res.statusCode, body);
    });
  });
  req.end(payload);
}

var tests = [
  ['card payment (CC-VISA destination) posts instead of crashing', function (done) {
    transfer(CARD, '25.00', function (status, body) {
      assert.strictEqual(status, 201, JSON.stringify(body));
      assert.strictEqual(body.status, 'POSTED');
      done();
    });
  }],
  ['CC-VISA limit is 15000.00, as in core-banking product_limit', function (done) {
    transfer(CARD, '15000.01', function (status, body) {
      assert.strictEqual(status, 422);
      assert.strictEqual(body.code, 'LIMIT_EXCEEDED');
      assert.strictEqual(body.message, 'Amount exceeds the per-transfer limit of 15000.00 for CC-VISA');
      done();
    });
  }],
  ['DDA-CHK limit is still 10000.00', function (done) {
    transfer(CHECKING, '10000.01', function (status, body) {
      assert.strictEqual(status, 422);
      assert.strictEqual(body.code, 'LIMIT_EXCEEDED');
      done();
    });
  }],
  ['a product without a limit is refused, not a 500', function (done) {
    var card = seed.ACCOUNTS.filter(function (a) { return a.accountNumber === CARD; })[0];
    card.productCode = 'LOC-HELOC';
    store.reset();
    transfer(CARD, '25.00', function (status, body) {
      card.productCode = 'CC-VISA';
      store.reset();
      assert.strictEqual(status, 422, JSON.stringify(body));
      assert.strictEqual(body.code, 'PRODUCT_LIMIT_NOT_CONFIGURED');
      done();
    });
  }]
];

var failed = 0;

function run(i) {
  if (i === tests.length) {
    server.close();
    process.stdout.write('\n' + tests.length + ' tests, ' + failed + ' failed\n');
    process.exitCode = failed ? 1 : 0;
    return;
  }
  var finished = false;
  function finish(err) {
    if (finished) { return; }
    finished = true;
    if (err) { failed += 1; }
    process.stdout.write((err ? 'FAIL ' : 'ok   ') + tests[i][0] + (err ? '\n     ' + err.message : '') + '\n');
    run(i + 1);
  }
  var d = require('domain').create();
  d.on('error', finish);
  d.run(function () { tests[i][1](finish); });
}

server.listen(0, function () { run(0); });
