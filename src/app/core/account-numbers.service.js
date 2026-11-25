(function () {
  'use strict';

  angular.module('boaTeller.core')
    .factory('AccountNumbers', AccountNumbers);

  function AccountNumbers() {
    return {
      isValid: isValid,
      mask: mask,
      branchOf: function (accountNumber) {
        return isValid(accountNumber) ? accountNumber.substr(0, 3) : null;
      }
    };

    // 12 digits: 3-digit branch, 8-digit serial, Luhn check digit.
    function isValid(value) {
      if (!/^\d{12}$/.test(value || '')) {
        return false;
      }
      var sum = 0;
      var alternate = false;
      for (var i = value.length - 1; i >= 0; i--) {
        var d = parseInt(value.charAt(i), 10);
        if (alternate) {
          d *= 2;
          if (d > 9) {
            d -= 9;
          }
        }
        sum += d;
        alternate = !alternate;
      }
      return sum % 10 === 0;
    }

    function mask(value) {
      if (!value) {
        return '';
      }
      var s = String(value);
      return s.length <= 4 ? s : '********' + s.slice(-4);
    }
  }
})();
