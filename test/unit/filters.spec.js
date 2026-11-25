describe('filters', function () {
  'use strict';

  var $filter;

  beforeEach(module('nbTeller.core'));
  beforeEach(inject(function (_$filter_) {
    $filter = _$filter_;
  }));

  it('formats contract amounts as US dollars', function () {
    var money = $filter('money');
    expect(money('4812.33')).toBe('$4,812.33');
    expect(money('-42.18')).toBe('-$42.18');
    expect(money('0.00')).toBe('$0.00');
    expect(money(null)).toBe('');
  });

  it('masks account numbers', function () {
    expect($filter('maskAccount')('211000048218')).toBe('********8218');
  });
});
