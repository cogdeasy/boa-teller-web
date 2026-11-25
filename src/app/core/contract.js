/*
 * core-banking /api/v1 payload shapes, as documented in the core platform API contract.
 * Amounts are decimal strings with two places, dates are yyyy-MM-dd, timestamps are
 * ISO-8601 local time in America/New_York.
 *
 * @typedef {Object} Customer
 * @property {string} cif
 * @property {string} firstName
 * @property {string} lastName
 * @property {string} email
 * @property {string} segment       e.g. PREFERRED, STANDARD
 * @property {string} kycStatus     e.g. VERIFIED, REVIEW_DUE
 *
 * @typedef {Object} Account
 * @property {string} accountNumber 12-digit DDA number (branch, serial, Luhn check digit)
 * @property {string} maskedNumber  ********3455
 * @property {string} cif
 * @property {string} productCode   DDA-CHK, DDA-SAV, GL-SUSP
 * @property {string} nickname
 * @property {string} status        OPEN, CLOSED, FROZEN
 * @property {string} ledgerBalance
 * @property {string} availableBalance
 * @property {string} holdAmount
 * @property {string} openedOn
 *
 * @typedef {Object} Transaction
 * @property {number} id
 * @property {string} accountNumber
 * @property {string} postedAt
 * @property {string} businessDate
 * @property {string} type          DEBIT, CREDIT
 * @property {string} channel       CARD, ACH, WIRE, P2P, BILLPAY, BRANCH, ATM, INTEREST, FEE, TRANSFER, ZELLE
 * @property {string} channelLabel  display label for the channel
 * @property {string} amount
 * @property {string} runningBalance
 * @property {string} description
 * @property {string} status
 *
 * @typedef {Object} TransactionPage
 * @property {Transaction[]} content
 * @property {number} page
 * @property {number} size
 * @property {number} total
 *
 * @typedef {Object} HoldRequest
 * @property {string} amount
 * @property {string} reason        CHK-DEP-HOLD, LEGAL, FRAUD-REVIEW, OTHER
 * @property {string} releaseOn
 *
 * @typedef {Object} TransferRequest
 * @property {string} fromAccount
 * @property {string} toAccount
 * @property {string} amount
 * @property {string} memo
 * @property {string} idempotencyKey
 *
 * @typedef {Object} TransferResult
 * @property {string} transferId    TRF-yyyyMMdd-nnnnnn
 * @property {string} status
 * @property {string} postedAt
 * @property {string} businessDate
 *
 * @typedef {Object} ApiError
 * @property {string} code          NSF, LIMIT_EXCEEDED, ACCOUNT_NOT_FOUND, DUPLICATE, VALIDATION, ...
 * @property {string} message
 */
