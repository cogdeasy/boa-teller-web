(function () {
  'use strict';

  /**
   * Thin client for the core-banking /api/v1 endpoints the teller console uses.
   * Every method resolves with the response body (see core/contract.js for shapes).
   */
  angular.module('nbTeller.core')
    .factory('CoreBankingService', CoreBankingService);

  CoreBankingService.$inject = ['$http', 'APP_CONFIG'];
  function CoreBankingService($http, APP_CONFIG) {
    var base = APP_CONFIG.apiBase;

    function data(response) {
      return response.data;
    }

    return {
      getCustomer: function (cif) {
        return $http.get(base + '/customers/' + cif).then(data);
      },
      getCustomerAccounts: function (cif) {
        return $http.get(base + '/customers/' + cif + '/accounts').then(data);
      },
      getAccount: function (accountNumber) {
        return $http.get(base + '/accounts/' + accountNumber).then(data);
      },
      getTransactions: function (accountNumber, params) {
        return $http.get(base + '/accounts/' + accountNumber + '/transactions', { params: params }).then(data);
      },
      placeHold: function (accountNumber, hold) {
        return $http.post(base + '/accounts/' + accountNumber + '/holds', hold).then(data);
      },
      searchTransactions: function (q, accountNumber) {
        var params = { q: q };
        if (accountNumber) {
          params.accountNumber = accountNumber;
        }
        return $http.get(base + '/transactions/search', { params: params }).then(data);
      },
      createTransfer: function (transfer) {
        return $http.post(base + '/transfers', transfer).then(data);
      },
      getTransfer: function (transferId) {
        return $http.get(base + '/transfers/' + transferId).then(data);
      }
    };
  }
})();
