(function () {
  'use strict';

  angular.module('boaTeller.core')
    .factory('authInterceptor', authInterceptor);

  authInterceptor.$inject = ['$injector', '$q', '$rootScope'];
  function authInterceptor($injector, $q, $rootScope) {
    return {
      request: function (config) {
        if (config.skipAuthInterceptor) {
          return config;
        }
        var header = $injector.get('AuthService').getAuthorizationHeader();
        if (header) {
          config.headers = config.headers || {};
          config.headers.Authorization = header;
        }
        return config;
      },
      responseError: function (response) {
        if (response.status === 401 && !response.config.skipAuthInterceptor) {
          $rootScope.$broadcast('auth:expired');
        }
        return $q.reject(response);
      }
    };
  }
})();
