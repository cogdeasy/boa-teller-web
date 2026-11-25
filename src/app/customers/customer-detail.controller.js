(function () {
  'use strict';

  angular.module('nbTeller.customers')
    .controller('CustomerDetailController', CustomerDetailController);

  CustomerDetailController.$inject = ['$scope', '$stateParams', '$q', 'CoreBankingService', 'ApiError'];
  function CustomerDetailController($scope, $stateParams, $q, CoreBankingService, ApiError) {
    $scope.loading = true;
    $scope.error = null;

    $q.all([
      CoreBankingService.getCustomer($stateParams.cif),
      CoreBankingService.getCustomerAccounts($stateParams.cif)
    ]).then(function (results) {
      $scope.customer = results[0];
      $scope.accounts = results[1];
      $scope.totals = {
        ledger: _.sumBy($scope.accounts, function (a) { return parseFloat(a.ledgerBalance); }).toFixed(2),
        available: _.sumBy($scope.accounts, function (a) { return parseFloat(a.availableBalance); }).toFixed(2)
      };
    }, function (response) {
      $scope.error = ApiError.from(response);
    }).finally(function () {
      $scope.loading = false;
    });

    $scope.kycClass = function (status) {
      return { VERIFIED: 'label-success', REVIEW_DUE: 'label-warning' }[status] || 'label-danger';
    };
  }
})();
