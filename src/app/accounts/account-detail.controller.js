(function () {
  'use strict';

  angular.module('nbTeller.accounts')
    .controller('AccountDetailController', AccountDetailController);

  AccountDetailController.$inject = ['$scope', '$stateParams', 'CoreBankingService', 'ApiError', 'APP_CONFIG', 'HOLD_REASONS'];
  function AccountDetailController($scope, $stateParams, CoreBankingService, ApiError, APP_CONFIG, HOLD_REASONS) {
    var accountNumber = $stateParams.accountNumber;

    $scope.tab = 'transactions';
    $scope.error = null;
    $scope.holdReasons = HOLD_REASONS;
    $scope.filter = {
      from: moment().subtract(APP_CONFIG.defaultHistoryDays, 'days').format('YYYY-MM-DD'),
      to: moment().format('YYYY-MM-DD')
    };
    $scope.paging = { page: 0, size: APP_CONFIG.transactionPageSize, total: 0 };
    $scope.hold = newHold();

    loadAccount();
    $scope.loadTransactions = loadTransactions;
    loadTransactions(0);

    function newHold() {
      return { amount: '', reason: 'CHK-DEP-HOLD', releaseOn: moment().add(2, 'days').format('YYYY-MM-DD') };
    }

    function loadAccount() {
      CoreBankingService.getAccount(accountNumber).then(function (account) {
        $scope.account = account;
      }, function (response) {
        $scope.error = ApiError.from(response);
      });
    }

    function loadTransactions(page) {
      $scope.loadingTxns = true;
      CoreBankingService.getTransactions(accountNumber, {
        from: $scope.filter.from,
        to: $scope.filter.to,
        page: page,
        size: $scope.paging.size
      }).then(function (result) {
        $scope.transactions = result.content;
        $scope.paging.page = result.page;
        $scope.paging.total = result.total;
        $scope.paging.pages = Math.max(Math.ceil(result.total / result.size), 1);
      }, function (response) {
        $scope.error = ApiError.from(response);
      }).finally(function () {
        $scope.loadingTxns = false;
      });
    }

    $scope.placeHold = function () {
      $scope.holdError = null;
      $scope.holdResult = null;
      var amount = parseFloat($scope.hold.amount);
      if (!(amount > 0)) {
        $scope.holdError = 'Enter a hold amount greater than zero.';
        return;
      }
      $scope.placingHold = true;
      CoreBankingService.placeHold(accountNumber, {
        amount: amount.toFixed(2),
        reason: $scope.hold.reason,
        releaseOn: $scope.hold.releaseOn
      }).then(function (hold) {
        $scope.holdResult = hold;
        $scope.hold = newHold();
        loadAccount();
      }, function (response) {
        $scope.holdError = ApiError.from(response);
      }).finally(function () {
        $scope.placingHold = false;
      });
    };
  }
})();
