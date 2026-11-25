(function () {
  'use strict';

  angular.module('nbTeller.transfers')
    .controller('TransferController', TransferController);

  TransferController.$inject = ['$scope', '$stateParams', '$log', 'CoreBankingService', 'AccountNumbers', 'ApiError', 'TRANSFER_ERRORS'];
  function TransferController($scope, $stateParams, $log, CoreBankingService, AccountNumbers, ApiError, TRANSFER_ERRORS) {
    $scope.step = 'entry';
    $scope.transfer = blank();
    $scope.error = null;

    if ($scope.transfer.fromAccount) {
      lookupFrom();
    }

    function blank() {
      return {
        fromAccount: $stateParams.fromAccount || '',
        toAccount: '',
        amount: '',
        memo: '',
        idempotencyKey: uuid()
      };
    }

    function uuid() {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0;
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
      });
    }

    function lookupFrom() {
      $scope.fromDetails = null;
      if (AccountNumbers.isValid($scope.transfer.fromAccount)) {
        CoreBankingService.getAccount($scope.transfer.fromAccount).then(function (a) {
          $scope.fromDetails = a;
        });
      }
    }
    $scope.lookupFrom = lookupFrom;

    $scope.validate = function () {
      var t = $scope.transfer;
      if (!AccountNumbers.isValid(t.fromAccount)) {
        return 'From account is not a valid 12-digit account number.';
      }
      if (!AccountNumbers.isValid(t.toAccount)) {
        return 'To account is not a valid 12-digit account number.';
      }
      if (t.fromAccount === t.toAccount) {
        return 'From and to accounts must be different.';
      }
      if (!/^\d+(\.\d{1,2})?$/.test(t.amount) || parseFloat(t.amount) <= 0) {
        return 'Enter an amount greater than zero, e.g. 250.00.';
      }
      return null;
    };

    $scope.review = function () {
      $scope.error = $scope.validate();
      if ($scope.error) {
        return;
      }
      $scope.transfer.amount = parseFloat($scope.transfer.amount).toFixed(2);
      CoreBankingService.getAccount($scope.transfer.toAccount).then(function (a) {
        $scope.toDetails = a;
        $scope.step = 'review';
      }, function (response) {
        $scope.error = ApiError.from(response);
      });
    };

    $scope.edit = function () {
      $scope.step = 'entry';
    };

    $scope.submit = function () {
      $scope.posting = true;
      $scope.error = null;
      CoreBankingService.createTransfer($scope.transfer).then(function (result) {
        $log.info('Book transfer posted', result.transferId, $scope.transfer.fromAccount, '->',
          $scope.transfer.toAccount, $scope.transfer.amount);
        $scope.result = result;
        $scope.step = 'done';
      }, function (response) {
        var err = ApiError.from(response);
        $scope.error = TRANSFER_ERRORS[err.code] ? { code: err.code, message: TRANSFER_ERRORS[err.code] } : err;
        $scope.step = 'entry';
      }).finally(function () {
        $scope.posting = false;
      });
    };

    $scope.another = function () {
      $scope.transfer = blank();
      $scope.result = null;
      $scope.toDetails = null;
      $scope.step = 'entry';
      lookupFrom();
    };
  }
})();
