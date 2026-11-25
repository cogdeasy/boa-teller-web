describe('AccountNumbers', function () {
  'use strict';

  var AccountNumbers;

  beforeEach(module('boaTeller.core'));
  beforeEach(inject(function (_AccountNumbers_) {
    AccountNumbers = _AccountNumbers_;
  }));

  it('accepts seeded DDA numbers with a valid Luhn check digit', function () {
    expect(AccountNumbers.isValid('104000123455')).toBe(true);
    expect(AccountNumbers.isValid('211000048226')).toBe(true);
  });

  it('rejects a bad check digit or wrong length', function () {
    expect(AccountNumbers.isValid('104000123456')).toBe(false);
    expect(AccountNumbers.isValid('10400012345')).toBe(false);
    expect(AccountNumbers.isValid('')).toBe(false);
  });

  it('masks all but the last four digits', function () {
    expect(AccountNumbers.mask('104000123455')).toBe('********3455');
    expect(AccountNumbers.branchOf('104000123455')).toBe('104');
  });
});
