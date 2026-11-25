describe('AuthService', function () {
  'use strict';

  var AuthService, $httpBackend, $window;

  beforeEach(module('boaTeller.core'));
  beforeEach(inject(function (_AuthService_, _$httpBackend_, _$window_) {
    AuthService = _AuthService_;
    $httpBackend = _$httpBackend_;
    $window = _$window_;
    AuthService.logout();
  }));

  afterEach(function () {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  it('signs a teller in when core-banking accepts the credentials', function () {
    $httpBackend.expectGET('/api/v1/accounts/307000555010', function (headers) {
      return headers.Authorization === 'Basic ' + $window.btoa('teller01:Teller#2019');
    }).respond(200, { accountNumber: '307000555010' });

    var session;
    AuthService.login('teller01', 'Teller#2019').then(function (s) { session = s; });
    $httpBackend.flush();

    expect(session.username).toBe('teller01');
    expect(AuthService.isAuthenticated()).toBe(true);
  });

  it('refuses users without the TELLER role', function () {
    $httpBackend.expectGET('/api/v1/accounts/307000555010').respond(403, { code: 'FORBIDDEN' });

    var error;
    AuthService.login('dana.whitfield', 'Welcome1!').catch(function (e) { error = e; });
    $httpBackend.flush();

    expect(error).toMatch(/TELLER/);
    expect(AuthService.isAuthenticated()).toBe(false);
  });
});
