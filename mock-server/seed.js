'use strict';

/*
 * Seed data for the local core-banking stub. Mirrors the "local profile" seed in the
 * core platform contract (docs/API.md in the core platform repository).
 */

var USERS = [
  { username: 'dana.whitfield', password: 'Welcome1!', role: 'CUSTOMER', cif: '100000001' },
  { username: 'marcus.oyelaran', password: 'Welcome1!', role: 'CUSTOMER', cif: '100000002' },
  { username: 'teller01', password: 'Teller#2019', role: 'TELLER', cif: null },
  { username: 'ops.batch', password: 'Ops#Batch1', role: 'OPS', cif: null }
];

var CUSTOMERS = [
  {
    cif: '100000001', firstName: 'Dana', lastName: 'Whitfield', email: 'dana.whitfield@example.com',
    segment: 'PREFERRED', kycStatus: 'VERIFIED'
  },
  {
    cif: '100000002', firstName: 'Marcus', lastName: 'Oyelaran', email: 'marcus.oyelaran@example.com',
    segment: 'STANDARD', kycStatus: 'REVIEW_DUE'
  }
];

// Balances are held in cents to keep the stub's arithmetic exact.
var ACCOUNTS = [
  { accountNumber: '104000123455', cif: '100000001', productCode: 'DDA-CHK', nickname: 'Advantage Checking',
    status: 'OPEN', ledger: 481233, hold: 10000, openedOn: '2014-03-11' },
  { accountNumber: '104000123463', cif: '100000001', productCode: 'DDA-SAV', nickname: 'Advantage Savings',
    status: 'OPEN', ledger: 2215000, hold: 0, openedOn: '2014-03-11' },
  { accountNumber: '440000528719', cif: '100000001', productCode: 'CC-VISA', nickname: 'Customized Cash Rewards Visa',
    status: 'OPEN', ledger: -128456, hold: 0, openedOn: '2017-06-19' },
  { accountNumber: '211000048218', cif: '100000002', productCode: 'DDA-CHK', nickname: 'Everyday Checking',
    status: 'OPEN', ledger: 104512, hold: 0, openedOn: '2019-07-22' },
  { accountNumber: '211000048226', cif: '100000002', productCode: 'DDA-SAV', nickname: 'Everyday Savings',
    status: 'OPEN', ledger: 930000, hold: 0, openedOn: '2019-07-22' },
  { accountNumber: '307000555010', cif: null, productCode: 'GL-SUSP', nickname: 'Suspense GL',
    status: 'OPEN', ledger: 0, hold: 0, openedOn: '2001-01-02' }
];

var CARD_MERCHANTS = [
  'WHOLE FDS MKT #10233', 'STARBUCKS STORE #08812', 'BLUE BOTTLE COFFEE NY', 'SHELL OIL 57442',
  'TRADER JOE\'S #540', 'CVS/PHARMACY #02291', 'AMZN MKTP US*2K4', 'UBER *TRIP', 'NETFLIX.COM',
  'JOE COFFEE CO #4', 'DUANE READE #14402', 'BARNES & NOBLE #2231', 'MTA*NYCT PAYGO', 'CHIPOTLE 1187'
];
var BILLERS = ['CON EDISON PAYMENT', 'VERIZON WIRELESS PAYMENT', 'NATIONAL GRID PAYMENT', 'GEICO AUTO PAYMENT'];
var P2P = ['P2P TO J SMITH', 'P2P FROM A NGUYEN', 'P2P TO R PATEL'];

// Deterministic PRNG so every restart shows the same history.
function rng(seed) {
  var s = seed % 2147483647;
  if (s <= 0) { s += 2147483646; }
  return function () {
    s = s * 16807 % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function pick(r, list) {
  return list[Math.floor(r() * list.length)];
}

function cents(r, min, max) {
  return Math.round((min + r() * (max - min)) * 100);
}

/**
 * Builds a transaction history that ends exactly at the account's current ledger balance.
 * Returns oldest-first entries without ids or running balances; the store assigns those.
 */
function history(account, days, today) {
  var r = rng(parseInt(account.accountNumber.slice(-6), 10));
  var entries = [];
  var d;
  for (d = days; d >= 1; d--) {
    var date = new Date(today.getTime() - d * 86400000);
    var dom = date.getUTCDate();
    if (account.productCode === 'DDA-CHK') {
      if (dom === 1 || dom === 15) {
        entries.push({ date: date, channel: 'ACH', type: 'CREDIT', amount: cents(r, 2100, 2400),
          description: 'ACH DEPOSIT NORTHWIND LOGISTICS PAYROLL' });
      }
      var n = Math.floor(r() * 3);
      for (var i = 0; i < n; i++) {
        entries.push({ date: date, channel: 'CARD', type: 'DEBIT', amount: -cents(r, 3, 140),
          description: pick(r, CARD_MERCHANTS) });
      }
      if (dom === 6) {
        entries.push({ date: date, channel: 'BILLPAY', type: 'DEBIT', amount: -cents(r, 60, 180),
          description: pick(r, BILLERS) });
      }
      if (r() < 0.06) {
        entries.push({ date: date, channel: 'ATM', type: 'DEBIT', amount: -(Math.floor(r() * 4) + 1) * 2000,
          description: 'ATM WITHDRAWAL #2231 ATLANTIC AVE' });
      }
      if (r() < 0.05) {
        var p = pick(r, P2P);
        entries.push({ date: date, channel: 'P2P', type: p.indexOf('FROM') > 0 ? 'CREDIT' : 'DEBIT',
          amount: (p.indexOf('FROM') > 0 ? 1 : -1) * cents(r, 15, 120), description: p });
      }
      if (dom === 28) {
        entries.push({ date: date, channel: 'TRANSFER', type: 'DEBIT', amount: -50000,
          description: 'ONLINE TRANSFER TO SAV ...' + String(+account.accountNumber.slice(-4) + 8).slice(-4) });
      }
    } else if (account.productCode === 'DDA-SAV') {
      if (dom === 28) {
        entries.push({ date: date, channel: 'TRANSFER', type: 'CREDIT', amount: 50000,
          description: 'ONLINE TRANSFER FROM CHK ...' + String(+account.accountNumber.slice(-4) - 8).slice(-4) });
      }
      if (dom === 30 || (dom === 1 && date.getUTCMonth() === 2)) {
        entries.push({ date: date, channel: 'INTEREST', type: 'CREDIT', amount: cents(r, 4, 19),
          description: 'INTEREST PAYMENT' });
      }
    }
  }
  return entries;
}

module.exports = {
  USERS: USERS,
  CUSTOMERS: CUSTOMERS,
  ACCOUNTS: ACCOUNTS,
  history: history
};
