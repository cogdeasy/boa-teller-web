# AGENTS.md — boa-teller-web

Branch teller console: AngularJS 1.5 SPA + Express dev server with an in-memory core-banking stub.

## Commands

```bash
npm install                 # Node 8+ (also runs on current LTS)
npm start                   # gulp build + serve on http://localhost:3000 (stubbed /api/v1)
npm run start:core-banking  # proxy /api/v1 to core-banking on :8080 instead of the stub
npm test                    # Karma/Jasmine, headless Chrome; export CHROME_BIN if needed
npm run lint                # ESLint, ES5
npm run build               # dist/
```

Login: `teller01` / `Teller#2019`. Seed CIFs `100000001`, `100000002`.

## Layout

* `src/app/<feature>/` — `<feature>.module.js`, `*.controller.js`, `*.html` templates.
* `src/app/core/` — shared services (`CoreBankingService`, `AuthService`, `AccountNumbers`, `ApiError`),
  interceptor, filters, directives, `APP_CONFIG` constants, `contract.js` (payload typedefs).
* `src/app/app.module.js`, `app.routes.js` — root module, ui-router states, auth guard.
* `src/styles/teller.css` — theme on top of Bootstrap 3.
* `src/assets/` — static assets (brand logo), copied to `dist/assets/` by the build.
* `mock-server/` — `server.js` (static + stub/proxy), `api.js` (routes), `store.js` (state), `seed.js` (data).
* `test/unit/*.spec.js` — Jasmine specs. Tests load feature modules (e.g. `boaTeller.transfers`), never the
  root `boaTeller` module, so no templates or routes are needed.

## Conventions

* ES5 only (no arrow functions, `let`/`const`, template strings): there is no transpiler.
* Each file is an IIFE with `'use strict'`; register on an existing module with `angular.module('x')`.
* Explicit `$inject` arrays (the app boots with `ng-strict-di`).
* Controllers use `$scope`; HTTP lives in services and resolves with `response.data`.
* All core-banking calls go through `CoreBankingService`; endpoints and field names follow the platform
  API contract (`docs/API.md` in the core platform repo). Do not add endpoints that are not in the contract.
* Show account numbers masked with the `maskAccount` filter; amounts through the `money` filter.
* New templates under `src/app/**` are picked up automatically by the template cache (`app/<path>.html`).
* Any change to the API shape must be made in the contract and the stub (`mock-server/api.js`) together.
