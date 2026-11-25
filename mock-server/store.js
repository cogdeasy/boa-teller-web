'use strict';

var seed = require('./seed');

var DAYS_OF_HISTORY = 120;
var SINGLE_TRANSFER_LIMIT = 1000000; // 10,000.00
// Display labels for the teller's Activity (Transactions) tab, keyed by channel code.
// Zelle transfers were added to the seed data without a matching entry here.
var CHANNEL_LABELS = {
  CARD: { label: 'Card' },
  ACH: { label: 'ACH' },
  WIRE: { label: 'Wire' },
  P2P: { label: 'P2P' },
  BILLPAY: { label: 'Bill Pay' },
  BRANCH: { label: 'Branch' },
  ATM: { label: 'ATM' },
  INTEREST: { label: 'Interest' },
  FEE: { label: 'Fee' },
  TRANSFER: { label: 'Transfer' }
};
var HOLD_REASONS = ['CHK-DEP-HOLD', 'LEGAL', 'FRAUD-REVIEW', 'OTHER'];

function pad(n, w) {
  var s = String(n);
  while (s.length < (w || 2)) { s = '0' + s; }
  return s;
}

// Wall-clock time in America/New_York, formatted without an offset as per the contract.
function nyParts(date) {
  var fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  var parts = {};
  fmt.formatToParts(date || new Date()).forEach(function (p) { parts[p.type] = p.value; });
  if (parts.hour === '24') { parts.hour = '00'; }
  return parts;
}

function businessDate(date) {
  var p = nyParts(date);
  return p.year + '-' + p.month + '-' + p.day;
}

function timestamp(date) {
  var p = nyParts(date);
  return p.year + '-' + p.month + '-' + p.day + 'T' + p.hour + ':' + p.minute + ':' + p.second;
}

function money(c) {
  var neg = c < 0;
  var abs = Math.abs(c);
  return (neg ? '-' : '') + Math.floor(abs / 100) + '.' + pad(abs % 100);
}

function parseMoney(s) {
  if (typeof s !== 'string' || !/^\d{1,9}\.\d{2}$/.test(s)) { return null; }
  var p = s.split('.');
  return parseInt(p[0], 10) * 100 + parseInt(p[1], 10);
}

function mask(accountNumber) {
  return '********' + accountNumber.slice(-4);
}

var accounts = {};
var transactions = [];
var holds = [];
var transfers = {};
var idempotencyKeys = {};
var nextTxnId = 99000;
var nextHoldId = 51;
var nextTransferSeq = 231;

function reset() {
  accounts = {};
  transactions = [];
  holds = [];
  transfers = {};
  idempotencyKeys = {};
  nextTxnId = 99000;
  nextHoldId = 51;
  nextTransferSeq = 231;

  var today = new Date(businessDate() + 'T00:00:00Z');
  var all = [];
  seed.ACCOUNTS.forEach(function (a) {
    accounts[a.accountNumber] = {
      accountNumber: a.accountNumber, cif: a.cif, productCode: a.productCode, nickname: a.nickname,
      status: a.status, ledger: a.ledger, hold: a.hold, openedOn: a.openedOn
    };
    var entries = seed.history(a, DAYS_OF_HISTORY, today);
    var balance = a.ledger;
    for (var i = entries.length - 1; i >= 0; i--) {
      entries[i].runningBalance = balance;
      balance -= entries[i].amount;
    }
    var lastDay = null;
    var slot = 0;
    entries.forEach(function (e, idx) {
      slot = e.date.getTime() === lastDay ? slot + 1 : 0;
      lastDay = e.date.getTime();
      var posted = new Date(e.date.getTime() + (7 * 3600 + slot * 3 * 3600 + (idx * 977) % 9000) * 1000);
      all.push({
        accountNumber: a.accountNumber,
        postedAt: posted.toISOString().slice(0, 19),
        businessDate: e.date.toISOString().slice(0, 10),
        type: e.type, channel: e.channel, amount: e.amount, runningBalance: e.runningBalance,
        description: e.description, status: 'POSTED'
      });
    });
  });
  all.sort(function (x, y) { return x.postedAt < y.postedAt ? -1 : x.postedAt > y.postedAt ? 1 : 0; });
  all.forEach(function (t) { t.id = nextTxnId++; transactions.push(t); });
}

function accountView(a) {
  return {
    accountNumber: a.accountNumber,
    maskedNumber: mask(a.accountNumber),
    cif: a.cif,
    productCode: a.productCode,
    nickname: a.nickname,
    status: a.status,
    ledgerBalance: money(a.ledger),
    availableBalance: money(a.ledger - a.hold),
    holdAmount: money(a.hold),
    openedOn: a.openedOn
  };
}

function txnView(t) {
  return {
    id: t.id, accountNumber: t.accountNumber, postedAt: t.postedAt, businessDate: t.businessDate,
    type: t.type, channel: t.channel, channelLabel: CHANNEL_LABELS[t.channel].label,
    amount: money(t.amount), runningBalance: money(t.runningBalance),
    description: t.description, status: t.status
  };
}

function getCustomer(cif) {
  return seed.CUSTOMERS.filter(function (c) { return c.cif === cif; })[0] || null;
}

function getAccount(n) {
  return accounts[n] || null;
}

function accountsFor(cif) {
  return Object.keys(accounts).map(function (k) { return accounts[k]; })
    .filter(function (a) { return a.cif === cif; });
}

function transactionsFor(n, from, to) {
  return transactions.filter(function (t) {
    return t.accountNumber === n && (!from || t.businessDate >= from) && (!to || t.businessDate <= to);
  }).reverse();
}

function search(q, accountNumber, allowed) {
  var needle = q.toLowerCase();
  return transactions.filter(function (t) {
    return (!accountNumber || t.accountNumber === accountNumber) &&
      allowed(t.accountNumber) &&
      t.description.toLowerCase().indexOf(needle) !== -1;
  }).reverse().slice(0, 200);
}

function placeHold(a, amount, reason, releaseOn, user) {
  a.hold += amount;
  var hold = {
    holdId: nextHoldId++, accountNumber: a.accountNumber, amount: money(amount), reason: reason,
    releaseOn: releaseOn, status: 'ACTIVE', placedBy: user, placedAt: timestamp()
  };
  holds.push(hold);
  return hold;
}

function post(a, amount, description) {
  a.ledger += amount;
  var now = new Date();
  var t = {
    id: nextTxnId++, accountNumber: a.accountNumber, postedAt: timestamp(now), businessDate: businessDate(now),
    type: amount < 0 ? 'DEBIT' : 'CREDIT', channel: 'TRANSFER', amount: amount, runningBalance: a.ledger,
    description: description, status: 'POSTED'
  };
  transactions.push(t);
  return t;
}

function transfer(from, to, amount, memo, key, user) {
  var bd = businessDate();
  var id = 'TRF-' + bd.replace(/-/g, '') + '-' + pad(nextTransferSeq++, 6);
  var suffix = memo ? ' ' + memo.toUpperCase() : '';
  post(from, -amount, 'TRANSFER TO ...' + to.accountNumber.slice(-4) + suffix);
  post(to, amount, 'TRANSFER FROM ...' + from.accountNumber.slice(-4) + suffix);
  var record = {
    transferId: id, status: 'POSTED', postedAt: timestamp(), businessDate: bd,
    fromAccount: from.accountNumber, toAccount: to.accountNumber, amount: money(amount),
    memo: memo || null, idempotencyKey: key, initiatedBy: user
  };
  transfers[id] = record;
  if (key) { idempotencyKeys[key] = id; }
  return record;
}

reset();

module.exports = {
  HOLD_REASONS: HOLD_REASONS,
  SINGLE_TRANSFER_LIMIT: SINGLE_TRANSFER_LIMIT,
  reset: reset,
  money: money,
  parseMoney: parseMoney,
  businessDate: businessDate,
  accountView: accountView,
  txnView: txnView,
  getCustomer: getCustomer,
  getAccount: getAccount,
  accountsFor: accountsFor,
  transactionsFor: transactionsFor,
  search: search,
  placeHold: placeHold,
  transfer: transfer,
  getTransfer: function (id) { return transfers[id] || null; },
  isDuplicate: function (key) { return !!(key && idempotencyKeys[key]); }
};
