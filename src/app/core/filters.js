(function () {
  'use strict';

  angular.module('nbTeller.core')
    .filter('maskAccount', maskAccount)
    .filter('money', money)
    .filter('highlight', highlight)
    .filter('nyTime', nyTime);

  maskAccount.$inject = ['AccountNumbers'];
  function maskAccount(AccountNumbers) {
    return function (value) {
      return AccountNumbers.mask(value);
    };
  }

  // "1234.5" -> "$1,234.50", "-42.18" -> "-$42.18"
  function money() {
    return function (value) {
      if (value === null || value === undefined || value === '') {
        return '';
      }
      var n = parseFloat(value);
      if (isNaN(n)) {
        return '';
      }
      var parts = Math.abs(n).toFixed(2).split('.');
      parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      return (n < 0 ? '-' : '') + '$' + parts.join('.');
    };
  }

  // Wraps search-term matches in <mark> for the transaction search results grid.
  highlight.$inject = ['$sce'];
  function highlight($sce) {
    return function (text, term) {
      if (!text) {
        return '';
      }
      if (!term) {
        return $sce.trustAsHtml(text);
      }
      var escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return $sce.trustAsHtml(text.replace(new RegExp('(' + escaped + ')', 'gi'), '<mark>$1</mark>'));
    };
  }

  function nyTime() {
    return function (value, format) {
      return value ? moment(value, moment.ISO_8601).format(format || 'MM/DD/YYYY h:mm A') : '';
    };
  }
})();
