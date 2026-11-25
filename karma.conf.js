'use strict';

module.exports = function (config) {
  config.set({
    basePath: '',
    frameworks: ['jasmine'],
    files: [
      'node_modules/jquery/dist/jquery.js',
      'node_modules/lodash/lodash.js',
      'node_modules/moment/moment.js',
      'node_modules/angular/angular.js',
      'node_modules/angular-sanitize/angular-sanitize.js',
      'node_modules/angular-ui-router/release/angular-ui-router.js',
      'node_modules/angular-mocks/angular-mocks.js',
      'src/app/**/*.module.js',
      'src/app/**/*.js',
      'test/unit/**/*.spec.js'
    ],
    exclude: [
      'src/app/app.module.js',
      'src/app/app.routes.js'
    ],
    reporters: ['progress'],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: false,
    browsers: ['ChromeHeadlessCI'],
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },
    singleRun: true,
    concurrency: Infinity
  });
};
