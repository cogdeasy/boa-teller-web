'use strict';

/*
 * Local development server for the teller console.
 *
 *   - Serves the built app from dist/.
 *   - Without CORE_BANKING_URL: answers /api/v1 from an in-memory stub of core-banking.
 *   - With CORE_BANKING_URL (e.g. http://localhost:8080): proxies /api/v1 to a real core-banking.
 */

var path = require('path');
var express = require('express');
var morgan = require('morgan');

var PORT = parseInt(process.env.PORT || '3000', 10);
var CORE_BANKING_URL = process.env.CORE_BANKING_URL;

var app = express();
app.use(morgan('dev'));

if (CORE_BANKING_URL) {
  var proxy = require('http-proxy-middleware');
  app.use('/api/v1', proxy({ target: CORE_BANKING_URL, changeOrigin: true, logLevel: 'warn' }));
} else {
  app.use('/api/v1', require('./api'));
}

app.use(express.static(path.join(__dirname, '..', 'dist')));

app.listen(PORT, function () {
  /* eslint-disable no-console */
  console.log('boa-teller-web listening on http://localhost:' + PORT);
  console.log(CORE_BANKING_URL ? '  /api/v1 -> ' + CORE_BANKING_URL : '  /api/v1 -> local core-banking stub');
  /* eslint-enable no-console */
});
