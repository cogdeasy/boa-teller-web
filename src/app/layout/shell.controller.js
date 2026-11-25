(function () {
  'use strict';

  angular.module('boaTeller.layout')
    .controller('ShellController', ShellController);

  ShellController.$inject = ['$scope', '$state', 'AuthService', 'APP_CONFIG'];
  function ShellController($scope, $state, AuthService, APP_CONFIG) {
    $scope.session = AuthService.getSession();
    $scope.branch = APP_CONFIG.branchCode + ' ' + APP_CONFIG.branchName;
    $scope.businessDate = moment().format('MM/DD/YYYY');
    $scope.$state = $state;
    $scope.quick = { accountNumber: '' };

    $scope.openAccount = function () {
      var n = ($scope.quick.accountNumber || '').replace(/\D/g, '');
      if (n.length === 12) {
        $scope.quick.accountNumber = '';
        $state.go('console.account', { accountNumber: n });
      }
    };

    $scope.signOut = function () {
      AuthService.logout();
      $state.go('login');
    };
  }
})();
