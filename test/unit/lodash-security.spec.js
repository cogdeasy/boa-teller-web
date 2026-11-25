'use strict';

/* global _ */

describe('bundled lodash', function () {

  // CVE-2021-23337: code injection through the `variable` option of _.template (fixed in 4.17.21).
  it('rejects a template `variable` option that carries code', function () {
    window.__lodashInjected = false;
    expect(function () {
      _.template('', { variable: 'obj){window.__lodashInjected=true}; with(obj' })({});
    }).toThrow();
    expect(window.__lodashInjected).toBe(false);
    delete window.__lodashInjected;
  });

  it('keeps the helpers the console uses', function () {
    expect(_.sumBy([{ a: 1 }, { a: 2 }], 'a')).toBe(3);
    expect(_.countBy([{ k: 'x' }, { k: 'x' }, { k: 'y' }], 'k')).toEqual({ x: 2, y: 1 });
  });
});
