# nb-teller-web — Branch Teller Console

Northbridge Federal Bank's branch teller console. Tellers use it to look up customers by CIF, review
accounts and transaction history, search posted transactions, place holds and post internal book
transfers. It is a single-page AngularJS 1.5 application that talks directly to the **core-banking**
service of the Northbridge Core Platform over HTTP Basic.

Owner: Branch Technology (branch-tech@northbridge.example) · Runbook: Branch Ops wiki › Teller Console

## Quick start

```bash
npm install
npm start          # builds into dist/ and serves http://localhost:3000 with a local core-banking stub
```

Sign in as `teller01` / `Teller#2019` (TELLER role). Try CIF `100000001` (Dana Whitfield) or
`100000002` (Marcus Oyelaran), or jump straight to account `104000123455`.

| command | what it does |
|---|---|
| `npm start` | `gulp build`, then `mock-server/server.js` on `:3000` with the in-memory core-banking stub |
| `npm run start:core-banking` | same, but proxies `/api/v1` to a real core-banking on `http://localhost:8080` |
| `npm run watch` | rebuilds `dist/` on change (run `npm run serve` alongside) |
| `npm test` | Karma + Jasmine unit tests in headless Chrome (set `CHROME_BIN` if Chrome is not on the PATH) |
| `npm run lint` | ESLint (ES5 rules) |
| `npm run build` | production bundle in `dist/` (static files, deployable to any web server) |

`PORT` and `CORE_BANKING_URL` environment variables override the defaults.

## Architecture

```
browser ── dist/index.html, js/vendor.js, js/app.js ──┐
                                                      │ same origin
             mock-server/server.js (Express, :3000) ──┤
               ├── /            static dist/
               └── /api/v1/*    in-memory stub (mock-server/api.js)
                                 or proxy → core-banking :8080/api/v1 (CORE_BANKING_URL)
```

* **AngularJS 1.5.8** with `ui-router` 0.3, Bootstrap 3.3 and jQuery 2.2; lodash and moment as globals.
* Controllers use `$scope` directly; one Angular module per feature folder under `src/app/`:

  | folder | module | screens |
  |---|---|---|
  | `core/` | `nbTeller.core` | `AuthService`, `authInterceptor`, `CoreBankingService`, filters, `nb-alert` |
  | `login/` | `nbTeller.login` | sign-in |
  | `layout/` | `nbTeller.layout` | navbar shell, quick account jump |
  | `customers/` | `nbTeller.customers` | CIF lookup, customer profile and accounts |
  | `accounts/` | `nbTeller.accounts` | balances, transaction history, place hold |
  | `transactions/` | `nbTeller.transactions` | free-text transaction search |
  | `transfers/` | `nbTeller.transfers` | book transfer (details → review → receipt) |

* **Build:** gulp 4 concatenates vendor libraries into `dist/js/vendor.js` and the app (plus HTML
  templates via `gulp-angular-templatecache`) into `dist/js/app.js`. No transpiler, no module bundler.
* **Routing:** hash-based (`#/lookup`, `#/customers/:cif`, `#/accounts/:accountNumber`,
  `#/transactions/search`, `#/transfers/new`). A `$stateChangeStart` guard sends unauthenticated users
  to `#/login`.

## How it talks to core-banking

The console is a pure client of core-banking `/api/v1` as defined in the platform API contract
(`docs/API.md` in the core platform repository, `boa`). It calls only these endpoints:

| screen | endpoint |
|---|---|
| sign-in | `GET /accounts/307000555010` — the branch suspense GL; a 200 proves the credentials and TELLER role, 403 means not branch staff |
| customer lookup / profile | `GET /customers/{cif}`, `GET /customers/{cif}/accounts` |
| account detail | `GET /accounts/{accountNumber}`, `GET /accounts/{accountNumber}/transactions?from&to&page&size` |
| place hold | `POST /accounts/{accountNumber}/holds` |
| transaction search | `GET /transactions/search?q&accountNumber` (slow full-text path; the UI warns the teller) |
| book transfer | `GET /accounts/{to}` (review step), `POST /transfers` with a per-form `idempotencyKey` |

* **Auth:** HTTP Basic. `AuthService` stores the session and `authInterceptor` adds the
  `Authorization` header to every `$http` call; any 401 signs the teller out.
* **Formats:** amounts are two-decimal strings (`"4812.33"`), dates `yyyy-MM-dd`, timestamps local
  America/New_York. Payload shapes are documented as JSDoc typedefs in `src/app/core/contract.js`.
* **Errors:** `{ code, message }`. Transfer codes `NSF`, `LIMIT_EXCEEDED`, `ACCOUNT_NOT_FOUND` and
  `DUPLICATE` are mapped to teller-facing text in `TRANSFER_ERRORS` (`core/app-config.constant.js`).
* **Account numbers** are 12 digits (branch, serial, Luhn check digit), validated client-side in
  `AccountNumbers` and shown masked (`********3455`) through the `maskAccount` filter.

### Local core-banking stub

`mock-server/` implements the endpoints above in memory, seeded with the contract's local-profile
users and accounts (`seed.js`) and ~120 days of deterministic transaction history per account. It
enforces roles (CUSTOMER sees own accounts only, TELLER sees all, holds are TELLER-only), the
10,000.00 single-transfer limit, available-balance NSF checks and idempotency keys. State resets on
restart.

| user | password | role | CIF |
|---|---|---|---|
| teller01 | Teller#2019 | TELLER | – |
| dana.whitfield | Welcome1! | CUSTOMER | 100000001 |
| marcus.oyelaran | Welcome1! | CUSTOMER | 100000002 |
| ops.batch | Ops#Batch1 | OPS | – |

| account | CIF | product | ledger |
|---|---|---|---|
| 104000123455 | 100000001 | DDA-CHK Advantage Checking | 4,812.33 (100.00 on hold) |
| 104000123463 | 100000001 | DDA-SAV Advantage Savings | 22,150.00 |
| 211000048218 | 100000002 | DDA-CHK | 1,045.12 |
| 211000048226 | 100000002 | DDA-SAV | 9,300.00 |
| 307000555010 | – | GL-SUSP suspense GL | 0.00 |

## Running against a real core-banking

Start core-banking from the core platform repository with its `local` profile on `:8080`, then:

```bash
npm run start:core-banking
```

The Express server proxies `/api/v1` so the browser stays same-origin and no CORS configuration is
needed on core-banking.

## CI

`Jenkinsfile` runs on the Branch Technology Jenkins (`linux-node` agents, Node 8.11 tool): install,
lint, unit tests, build, and on `main` archives `dist/` as `nb-teller-web-<build>.tgz` for the branch
web tier.

## Further reading

* `AGENTS.md` — commands and conventions for contributors.
* `docs/MODERNISATION.md` — AngularJS end-of-life plan and the React + TypeScript target.
