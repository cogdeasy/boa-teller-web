(function () {
  'use strict';

  angular.module('boaTeller', [
    'ui.router',
    'boaTeller.templates',
    'boaTeller.core',
    'boaTeller.layout',
    'boaTeller.login',
    'boaTeller.customers',
    'boaTeller.accounts',
    'boaTeller.transactions',
    'boaTeller.transfers'
  ]);
})();
