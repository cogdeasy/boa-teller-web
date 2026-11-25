(function () {
  'use strict';

  angular.module('nbTeller')
    .config(routes)
    .run(guard);

  routes.$inject = ['$stateProvider', '$urlRouterProvider', '$httpProvider'];
  function routes($stateProvider, $urlRouterProvider, $httpProvider) {
    $httpProvider.interceptors.push('authInterceptor');

    $stateProvider
      .state('login', {
        url: '/login',
        templateUrl: 'app/login/login.html',
        controller: 'LoginController',
        data: { public: true }
      })
      .state('console', {
        abstract: true,
        templateUrl: 'app/layout/shell.html',
        controller: 'ShellController'
      })
      .state('console.lookup', {
        url: '/lookup',
        templateUrl: 'app/customers/customer-lookup.html',
        controller: 'CustomerLookupController'
      })
      .state('console.customer', {
        url: '/customers/:cif',
        templateUrl: 'app/customers/customer-detail.html',
        controller: 'CustomerDetailController'
      })
      .state('console.account', {
        url: '/accounts/:accountNumber',
        templateUrl: 'app/accounts/account-detail.html',
        controller: 'AccountDetailController'
      })
      .state('console.search', {
        url: '/transactions/search?q&accountNumber',
        templateUrl: 'app/transactions/transaction-search.html',
        controller: 'TransactionSearchController'
      })
      .state('console.transfer', {
        url: '/transfers/new?fromAccount',
        templateUrl: 'app/transfers/transfer.html',
        controller: 'TransferController'
      });

    $urlRouterProvider.otherwise('/lookup');
  }

  guard.$inject = ['$rootScope', '$state', 'AuthService'];
  function guard($rootScope, $state, AuthService) {
    $rootScope.$on('$stateChangeStart', function (event, toState) {
      var isPublic = toState.data && toState.data.public;
      if (!isPublic && !AuthService.isAuthenticated()) {
        event.preventDefault();
        $state.go('login');
      }
    });

    $rootScope.$on('auth:expired', function () {
      AuthService.logout();
      $state.go('login', {}, { reload: true });
    });
  }
})();
