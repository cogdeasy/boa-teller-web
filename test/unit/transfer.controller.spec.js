describe('TransferController', function () {
  'use strict';

  var $scope, $httpBackend;

  beforeEach(module('nbTeller.transfers'));
  beforeEach(inject(function ($controller, $rootScope, _$httpBackend_) {
    $httpBackend = _$httpBackend_;
    $scope = $rootScope.$new();
    $controller('TransferController', { $scope: $scope, $stateParams: {} });
  }));

  it('rejects an invalid destination account before calling core-banking', function () {
    $scope.transfer.fromAccount = '104000123455';
    $scope.transfer.toAccount = '104000123456';
    $scope.transfer.amount = '250';
    $scope.review();
    expect($scope.error).toMatch(/To account/);
    expect($scope.step).toBe('entry');
  });

  it('posts a transfer and shows the receipt', function () {
    $scope.transfer.fromAccount = '104000123455';
    $scope.transfer.toAccount = '104000123463';
    $scope.transfer.amount = '250';

    $httpBackend.expectGET('/api/v1/accounts/104000123463').respond(200, { nickname: 'Advantage Savings' });
    $scope.review();
    $httpBackend.flush();
    expect($scope.step).toBe('review');
    expect($scope.transfer.amount).toBe('250.00');

    $httpBackend.expectPOST('/api/v1/transfers').respond(201, { transferId: 'TRF-20261125-000231', status: 'POSTED' });
    $scope.submit();
    $httpBackend.flush();
    expect($scope.step).toBe('done');
    expect($scope.result.transferId).toBe('TRF-20261125-000231');
  });

  it('maps NSF to a teller-friendly message', function () {
    $scope.transfer.fromAccount = '104000123455';
    $scope.transfer.toAccount = '104000123463';
    $scope.transfer.amount = '99999.00';
    $httpBackend.expectPOST('/api/v1/transfers').respond(422, { code: 'NSF', message: 'Insufficient available funds' });
    $scope.submit();
    $httpBackend.flush();
    expect($scope.error.code).toBe('NSF');
    expect($scope.step).toBe('entry');
  });
});
