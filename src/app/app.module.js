(function () {
  'use strict';

  angular.module('nbTeller', [
    'ui.router',
    'nbTeller.templates',
    'nbTeller.core',
    'nbTeller.layout',
    'nbTeller.login',
    'nbTeller.customers',
    'nbTeller.accounts',
    'nbTeller.transactions',
    'nbTeller.transfers'
  ]);
})();
