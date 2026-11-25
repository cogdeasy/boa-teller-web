(function () {
  'use strict';

  /**
   * Lets <input type="date"> bind to a "yyyy-MM-dd" string model (the contract's date format)
   * instead of a Date object.
   */
  angular.module('boaTeller.core')
    .directive('boaDateString', boaDateString);

  function boaDateString() {
    return {
      require: 'ngModel',
      priority: 1,
      link: function (scope, element, attrs, ngModel) {
        ngModel.$formatters.push(function (value) {
          return value ? moment(value, 'YYYY-MM-DD').toDate() : null;
        });
        ngModel.$parsers.push(function (value) {
          return value ? moment(value).format('YYYY-MM-DD') : null;
        });
      }
    };
  }
})();
