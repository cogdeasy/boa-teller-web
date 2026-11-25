(function () {
  'use strict';

  angular.module('boaTeller.login')
    .controller('LoginController', LoginController);

  LoginController.$inject = ['$scope', '$state', 'AuthService', 'APP_CONFIG'];
  function LoginController($scope, $state, AuthService, APP_CONFIG) {
    $scope.credentials = {
      username: APP_CONFIG.prefillLogin ? APP_CONFIG.defaultUsername : '',
      password: APP_CONFIG.prefillLogin ? APP_CONFIG.defaultPassword : ''
    };
    $scope.error = null;
    $scope.busy = false;

    if (AuthService.isAuthenticated()) {
      $state.go('console.lookup');
    }

    $scope.submit = function () {
      $scope.error = null;
      $scope.busy = true;
      AuthService.login($scope.credentials.username, $scope.credentials.password)
        .then(function () {
          $state.go('console.lookup');
        }, function (message) {
          $scope.error = message;
        })
        .finally(function () {
          $scope.busy = false;
        });
    };
  }
})();
