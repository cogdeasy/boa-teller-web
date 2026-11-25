(function () {
  'use strict';

  angular.module('boaTeller.core')
    .constant('APP_CONFIG', {
      apiBase: '/api/v1',
      branchCode: '104',
      branchName: 'Midtown Manhattan',
      // Branch suspense GL. Every TELLER can read it, so the login screen uses it to verify credentials.
      suspenseAccount: '307000555010',
      transactionPageSize: 25,
      defaultHistoryDays: 30,
      // TODO(BRT-412): remove once the training branch has its own SSO-provisioned users.
      prefillLogin: true,
      defaultUsername: 'teller01',
      defaultPassword: 'Teller#2019'
    })
    .constant('HOLD_REASONS', [
      { code: 'CHK-DEP-HOLD', label: 'Check deposit hold' },
      { code: 'LEGAL', label: 'Legal / garnishment' },
      { code: 'FRAUD-REVIEW', label: 'Fraud review' },
      { code: 'OTHER', label: 'Other' }
    ])
    .constant('TRANSFER_ERRORS', {
      NSF: 'The source account does not have sufficient available funds.',
      LIMIT_EXCEEDED: 'The amount exceeds the per-transfer limit for the destination account. Refer to a branch manager.',
      ACCOUNT_NOT_FOUND: 'One of the accounts could not be found. Check the account numbers.',
      DUPLICATE: 'This transfer has already been posted.'
    });
})();
