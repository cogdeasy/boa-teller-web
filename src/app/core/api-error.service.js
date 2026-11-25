(function () {
  'use strict';

  angular.module('nbTeller.core')
    .factory('ApiError', ApiError);

  function ApiError() {
    return {
      // Normalises an $http rejection into {status, code, message}.
      from: function (response) {
        var body = (response && response.data) || {};
        return {
          status: response ? response.status : 0,
          code: body.code || (response && response.status === -1 ? 'OFFLINE' : 'ERROR'),
          message: body.message || (response && response.status === -1
            ? 'core-banking could not be reached.'
            : 'core-banking returned HTTP ' + (response ? response.status : '?') + '.')
        };
      }
    };
  }
})();
