(function () {
  'use strict';

  angular.module('boaTeller.customers')
    .controller('CustomerLookupController', CustomerLookupController);

  CustomerLookupController.$inject = ['$scope', '$state', '$window', 'CoreBankingService', 'ApiError'];
  function CustomerLookupController($scope, $state, $window, CoreBankingService, ApiError) {
    var RECENT_KEY = 'boa.teller.recentCustomers';

    $scope.form = { cif: '' };
    $scope.error = null;
    $scope.busy = false;
    $scope.recent = angular.fromJson($window.localStorage.getItem(RECENT_KEY)) || [];

    $scope.lookup = function (cif) {
      cif = (cif || $scope.form.cif || '').replace(/\D/g, '');
      if (!/^\d{9}$/.test(cif)) {
        $scope.error = 'A CIF is 9 digits.';
        return;
      }
      $scope.error = null;
      $scope.busy = true;
      CoreBankingService.getCustomer(cif).then(function (customer) {
        remember(customer);
        $state.go('console.customer', { cif: customer.cif });
      }, function (response) {
        $scope.error = response.status === 404 ? 'No customer found for CIF ' + cif + '.' : ApiError.from(response);
      }).finally(function () {
        $scope.busy = false;
      });
    };

    function remember(customer) {
      var list = $scope.recent.filter(function (c) { return c.cif !== customer.cif; });
      list.unshift({ cif: customer.cif, name: customer.firstName + ' ' + customer.lastName });
      $scope.recent = list.slice(0, 8);
      $window.localStorage.setItem(RECENT_KEY, angular.toJson($scope.recent));
    }
  }
})();
