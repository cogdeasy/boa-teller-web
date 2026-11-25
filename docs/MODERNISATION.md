# Teller console modernisation

AngularJS reached end of long-term support in December 2021, and the pinned front-end libraries
(Angular 1.5.8, jQuery 2.2.4, Bootstrap 3.3.7, lodash 4.17.4, moment 2.18.1) no longer receive
fixes. Branch Technology's target for internal web apps is **React 18 + TypeScript**, built with
Vite and tested with Vitest + Testing Library.

## Current state

| area | today | target |
|---|---|---|
| framework | AngularJS 1.5.8, `$scope` controllers | React function components + hooks |
| language | ES5, globals (`_`, `moment`, `$`) | TypeScript (strict), ES modules |
| routing | ui-router 0.3 hash routes | React Router, same paths without `#` |
| styling | Bootstrap 3.3.7 + jQuery plugins | Bootstrap 5 (no jQuery) or the bank design system |
| HTTP | `$http` + `authInterceptor` | `fetch` wrapper or axios with typed responses |
| dates | moment 2.18 | `date-fns` / `Intl` |
| build | gulp 4 concat, no bundler | Vite |
| tests | Karma 1.7 + Jasmine 2.8, 10 specs | Vitest + Testing Library, coverage gate in CI |
| CI | Jenkins, Node 8.11 tool | current Node LTS, dependency scan stage |

## Why the migration is straightforward

* **The API boundary is already isolated.** Every core-banking call goes through
  `src/app/core/core-banking.service.js`; screens never build URLs. That service becomes
  `src/api/coreBanking.ts` one-for-one.
* **Payload shapes are written down.** `src/app/core/contract.js` holds JSDoc typedefs for `Customer`,
  `Account`, `Transaction`, `TransactionPage`, `HoldRequest`, `TransferRequest`, `TransferResult` and
  `ApiError`; they convert directly to TypeScript interfaces (ideally generated from the platform
  contract so both repos share one definition).
* **Pure logic is framework-free.** `AccountNumbers` (Luhn, masking) and the `money` filter are plain
  functions wrapped in Angular registration and port with their existing specs.
* **One feature folder per screen.** `login`, `customers`, `accounts`, `transactions` and `transfers`
  migrate one route at a time.
* **The stub server is framework-independent.** `mock-server/` keeps working as the dev API for the
  React app.

## Suggested sequence

1. Dependency and CVE clean-up on the current app (one library family per change): jQuery → 3.7,
   Bootstrap → 3.4.1, lodash → 4.17.21, moment → 2.29.4+, Express/body-parser/http-proxy-middleware
   in the dev server; move CI to current Node LTS and add `npm audit` / dependency scanning.
2. Raise unit coverage on `core/` and the controllers so the React port has behaviour to match.
3. Scaffold `web/` (Vite + React + TS) next to `src/`, generate types from the contract, port `core/`
   (API client, auth, account numbers, formatting).
4. Port screens in order: login → customer lookup/detail → account detail and holds → transaction
   search → book transfer. Serve both bundles from the Express server during the transition.
5. Remove AngularJS, gulp and Karma; switch Jenkins to the Vite build.

## Coupling with the core platform upgrade

The console depends only on the core-banking `/api/v1` contract. The planned core platform upgrade
(Java 8 → 21, Spring Boot 1.5 → 3.x) must keep these behaviours stable or change them in both repos
together:

* HTTP Basic authentication and the TELLER / CUSTOMER / OPS roles (login relies on a 200 vs 403 from
  `GET /accounts/307000555010`).
* JSON field names and formats: two-decimal amount strings, `yyyy-MM-dd` dates, offset-less
  America/New_York timestamps (Jackson defaults change between Spring Boot 1.5 and 3.x).
* Error bodies `{ code, message }` and the transfer codes `NSF`, `LIMIT_EXCEEDED`,
  `ACCOUNT_NOT_FOUND`, `DUPLICATE` (Spring Boot 3 defaults to RFC 7807 problem details).
* Paging envelope `{ content, page, size, total }` on transaction history.
* `POST /transfers` idempotency semantics (409 on a repeated key).

Contract tests against `mock-server/api.js` and a running core-banking are the safest way to catch a
drift during either upgrade.
