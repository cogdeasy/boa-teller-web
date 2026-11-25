(function () {
  'use strict';

  angular.module('boaTeller.transactions')
    .controller('TransactionSearchController', TransactionSearchController);

  TransactionSearchController.$inject = ['$scope', '$state', '$stateParams', 'CoreBankingService', 'ApiError'];
  function TransactionSearchController($scope, $state, $stateParams, CoreBankingService, ApiError) {
    $scope.query = { q: $stateParams.q || '', accountNumber: $stateParams.accountNumber || '' };
    $scope.results = null;
    $scope.error = null;

    $scope.search = function () {
      var q = ($scope.query.q || '').trim();
      if (q.length < 2) {
        $scope.error = 'Enter at least 2 characters.';
        return;
      }
      $scope.error = null;
      $scope.searching = true;
      $scope.term = q;
      $state.go('.', { q: q, accountNumber: $scope.query.accountNumber || null }, { notify: false });
      var started = Date.now();
      CoreBankingService.searchTransactions(q, $scope.query.accountNumber).then(function (results) {
        $scope.results = results;
        $scope.elapsed = Date.now() - started;
        $scope.byAccount = _.countBy(results, 'accountNumber');
      }, function (response) {
        $scope.error = ApiError.from(response);
      }).finally(function () {
        $scope.searching = false;
      });
    };

    if ($scope.query.q) {
      $scope.search();
    }
  }
})();
