'use strict';

/*
 * In-memory stub of the core-banking /api/v1 surface used by the teller console.
 * Request/response shapes follow the core platform API contract.
 */

var express = require('express');
var bodyParser = require('body-parser');
var seed = require('./seed');
var store = require('./store');

var router = express.Router();
router.use(bodyParser.json());

function error(res, status, code, message) {
  return res.status(status).json({ code: code, message: message });
}

function authenticate(req, res, next) {
  var header = req.headers.authorization || '';
  if (header.indexOf('Basic ') !== 0) {
    return error(res, 401, 'UNAUTHORIZED', 'Authentication required');
  }
  var decoded = new Buffer(header.slice(6), 'base64').toString('utf8');
  var idx = decoded.indexOf(':');
  var username = decoded.slice(0, idx);
  var password = decoded.slice(idx + 1);
  var user = seed.USERS.filter(function (u) { return u.username === username && u.password === password; })[0];
  if (!user) {
    return error(res, 401, 'UNAUTHORIZED', 'Bad credentials');
  }
  req.user = user;
  next();
}

function canView(user, account) {
  if (user.role === 'TELLER') { return true; }
  return user.role === 'CUSTOMER' && account.cif === user.cif;
}

function requireRole(role) {
  return function (req, res, next) {
    if (req.user.role !== role) {
      return error(res, 403, 'FORBIDDEN', 'Requires role ' + role);
    }
    next();
  };
}

function loadAccount(req, res, next) {
  var account = store.getAccount(req.params.accountNumber);
  if (!account) {
    return error(res, 404, 'ACCOUNT_NOT_FOUND', 'Account not found');
  }
  if (!canView(req.user, account)) {
    return error(res, 403, 'FORBIDDEN', 'Not permitted to view this account');
  }
  req.account = account;
  next();
}

router.use(authenticate);

router.get('/customers/:cif', function (req, res) {
  var customer = store.getCustomer(req.params.cif);
  if (!customer) {
    return error(res, 404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
  }
  if (req.user.role !== 'TELLER' && req.user.cif !== customer.cif) {
    return error(res, 403, 'FORBIDDEN', 'Not permitted to view this customer');
  }
  res.json(customer);
});

router.get('/customers/:cif/accounts', function (req, res) {
  var customer = store.getCustomer(req.params.cif);
  if (!customer) {
    return error(res, 404, 'CUSTOMER_NOT_FOUND', 'Customer not found');
  }
  if (req.user.role !== 'TELLER' && req.user.cif !== customer.cif) {
    return error(res, 403, 'FORBIDDEN', 'Not permitted to view this customer');
  }
  res.json(store.accountsFor(customer.cif).map(store.accountView));
});

router.get('/accounts/:accountNumber', loadAccount, function (req, res) {
  res.json(store.accountView(req.account));
});

router.get('/accounts/:accountNumber/transactions', loadAccount, function (req, res) {
  var page = Math.max(parseInt(req.query.page || '0', 10) || 0, 0);
  var size = Math.min(Math.max(parseInt(req.query.size || '50', 10) || 50, 1), 200);
  var all = store.transactionsFor(req.account.accountNumber, req.query.from, req.query.to);
  res.json({
    content: all.slice(page * size, page * size + size).map(store.txnView),
    page: page,
    size: size,
    total: all.length
  });
});

router.post('/accounts/:accountNumber/holds', requireRole('TELLER'), loadAccount, function (req, res) {
  var body = req.body || {};
  var amount = store.parseMoney(body.amount);
  if (!amount) {
    return error(res, 400, 'VALIDATION', 'amount must be a positive decimal with two places');
  }
  if (store.HOLD_REASONS.indexOf(body.reason) === -1) {
    return error(res, 400, 'VALIDATION', 'reason must be one of ' + store.HOLD_REASONS.join(', '));
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(body.releaseOn || '') || body.releaseOn <= store.businessDate()) {
    return error(res, 400, 'VALIDATION', 'releaseOn must be a future business date');
  }
  res.status(201).json(store.placeHold(req.account, amount, body.reason, body.releaseOn, req.user.username));
});

router.get('/transactions/search', function (req, res) {
  var q = (req.query.q || '').trim();
  if (q.length < 2) {
    return error(res, 400, 'VALIDATION', 'q must be at least 2 characters');
  }
  var results = store.search(q, req.query.accountNumber, function (n) {
    return canView(req.user, store.getAccount(n));
  });
  var view = results.map(store.txnView);
  // Free-text search is a full scan in core-banking; keep the stub similarly unhurried.
  setTimeout(function () { res.json(view); }, 400 + Math.floor(Math.random() * 600));
});

router.post('/transfers', function (req, res) {
  var body = req.body || {};
  var amount = store.parseMoney(body.amount);
  if (!amount) {
    return error(res, 400, 'VALIDATION', 'amount must be a positive decimal with two places');
  }
  if (body.fromAccount === body.toAccount) {
    return error(res, 400, 'VALIDATION', 'fromAccount and toAccount must differ');
  }
  var from = store.getAccount(body.fromAccount);
  var to = store.getAccount(body.toAccount);
  if (!from || !to) {
    return error(res, 404, 'ACCOUNT_NOT_FOUND', 'Account not found');
  }
  if (!canView(req.user, from)) {
    return error(res, 403, 'FORBIDDEN', 'Not permitted to debit this account');
  }
  if (store.isDuplicate(body.idempotencyKey)) {
    return error(res, 409, 'DUPLICATE', 'A transfer with this idempotency key has already been posted');
  }
  if (amount > store.SINGLE_TRANSFER_LIMIT) {
    return error(res, 422, 'LIMIT_EXCEEDED', 'Amount exceeds the single transfer limit of 10000.00');
  }
  if (from.productCode !== 'GL-SUSP' && amount > from.ledger - from.hold) {
    return error(res, 422, 'NSF', 'Insufficient available funds');
  }
  res.status(201).json(store.transfer(from, to, amount, body.memo, body.idempotencyKey, req.user.username));
});

router.get('/transfers/:transferId', function (req, res) {
  var t = store.getTransfer(req.params.transferId);
  if (!t) {
    return error(res, 404, 'TRANSFER_NOT_FOUND', 'Transfer not found');
  }
  res.json(t);
});

router.get('/ops/health/slo', requireRole('OPS'), function (req, res) {
  res.json({ window: '15m', endpoints: [] });
});

router.use(function (req, res) {
  error(res, 404, 'NOT_FOUND', 'No such endpoint');
});

module.exports = router;
