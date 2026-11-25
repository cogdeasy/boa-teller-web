(function () {
  'use strict';

  angular.module('boaTeller.core')
    .factory('AuthService', AuthService);

  AuthService.$inject = ['$http', '$q', '$window', 'APP_CONFIG'];
  function AuthService($http, $q, $window, APP_CONFIG) {
    var STORAGE_KEY = 'boa.teller.session';
    var session = read();

    return {
      login: login,
      logout: logout,
      isAuthenticated: isAuthenticated,
      getSession: getSession,
      getAuthorizationHeader: getAuthorizationHeader
    };

    function read() {
      try {
        return angular.fromJson($window.localStorage.getItem(STORAGE_KEY));
      } catch (e) {
        return null;
      }
    }

    function login(username, password) {
      var token = $window.btoa(username + ':' + password);
      // core-banking has no session endpoint; verify the credentials (and TELLER role) by reading
      // the branch suspense account, which only staff can see.
      return $http.get(APP_CONFIG.apiBase + '/accounts/' + APP_CONFIG.suspenseAccount, {
        headers: { Authorization: 'Basic ' + token },
        skipAuthInterceptor: true
      }).then(function () {
        session = { username: username, role: 'TELLER', token: token, signedInAt: new Date().toISOString() };
        $window.localStorage.setItem(STORAGE_KEY, angular.toJson(session));
        return session;
      }, function (response) {
        if (response.status === 401) {
          return $q.reject('Incorrect user ID or password.');
        }
        if (response.status === 403) {
          return $q.reject('This console is restricted to branch staff with the TELLER role.');
        }
        return $q.reject('core-banking is unavailable (HTTP ' + response.status + '). Try again shortly.');
      });
    }

    function logout() {
      session = null;
      $window.localStorage.removeItem(STORAGE_KEY);
    }

    function isAuthenticated() {
      return !!(session && session.token);
    }

    function getSession() {
      return session;
    }

    function getAuthorizationHeader() {
      return session ? 'Basic ' + session.token : null;
    }
  }
})();
