# Moomoo Direct Connection Progress

**Plan:** [Moomoo Direct Connection Plan](moomoo-direct-connection-plan.md)

## Current checkpoint — 2026-08-06

- [x] Confirmed direct Moomoo OAuth 2.1 + PKCE is the appropriate
  third-party-app flow.
- [x] Confirmed first execution read endpoints: authorized accounts, today's
  fills and historical fills.
- [x] Kept the scope read-only and outside the Journal write path until real
  response fields are inspected.
- [x] Added migration 0033 and the server-only Moomoo credential repository.
- [x] Added OAuth 2.1 + PKCE start/callback routes. They request only
  `quote:read`, validate short-lived state/verifier cookies, encrypt returned
  credentials at rest, and do not expose tokens in browser responses.
- [x] Registered the local OAuth client and supplied its server-only
  configuration outside source control.
- [x] Connected the owner's Moomoo account from the approved Account status
  surface; the saved connection is active and credentials remain server-only.
- [x] Proved bounded historical 1-minute candles using the owner's quote
  access, including extended-hours candles for CLRO, WYHG and PAVS.
- [x] Confirmed live historical-Kline pagination: the response returns
  `data.next_time`, and the next backward page is requested with that value as
  the `next_time` query parameter. It is not passed as `end` despite the
  conflicting general pagination wording.
- [ ] Connect the new unfunded/no-brokerage Moomoo OAuth identity and run the
  minimum-account Daily Trade Tracker candle proof.
- [ ] Prove only one-minute U.S. historical candles with premarket and
  after-hours (`ktype=1`, `extended_time=1`), same-symbol pagination, exact
  4:00 AM-8:00 PM coverage and bounded distinct-symbol behavior. Overnight,
  daily/five-minute, realtime, scanner, short-interest and market-depth tests
  are explicitly outside this checkpoint.
- [ ] Publish a privacy-safe confirmed-working / confirmed-unavailable /
  unresolved result and decide pass, limited pass or fail for the existing
  broker-neutral Daily Trade Tracker `MarketDataProvider` boundary.
- [ ] Replace the inactive Yahoo analyzer provider with the authenticated
  Moomoo candle provider, then restore Daily Trade Tracker analyzer display.
- [ ] Add the bounded authorized-account/today-fill/historical-fill read client
  when the owner chooses the execution-read scope.
- [ ] Decide the later source-evidence/Journal-preview contract.

## Execution-import checkpoint — planned

- [ ] Upgrade Moomoo authorization to `trade:read` and prove an authorized
  account/deal response without retaining private values in logs or fixtures.
- [ ] Add the broker selector/details experience and the durable disconnect /
  fresh-connect lifecycle for the Account page.
- [ ] Require a trader-entered earliest import date; retrieve exact Moomoo
  start/end batches newest to oldest in durable overlapping 90-day work units,
  page at 50 fills until `completed: true`, and publish retry-safe server-side
  progress while the trader navigates elsewhere.
- [ ] Let a trader later import older trades by requesting only the uncovered
  interval before the earliest completed account/market boundary, deduplicating
  the overlap by Moomoo deal ID and rebuilding the affected Journal chronology.
- [ ] Add broker account + deal-ID deduplication and update-time watermark
  sync so reconnects and future syncs do not re-import past executions.
- [ ] Reconcile accepted broker fills through the canonical Journal ledger and
  publish privacy-safe progress/status models.
- [ ] Pass the execution-import plan QA gates: execution-scope state,
  disconnect/reconnect lifecycle, future-broker schema, hosted job ownership,
  honest range progress, deal-ID deduplication, market coverage and production
  OAuth client identity.
- [ ] Pass the second QA gates: explicit broker-account to Journal-account
  mapping, exact selected-date timestamp boundaries, private page evidence /
  bounded Journal writes, and account-specific trade-read proof.
- [ ] Prove reliable multi-year pagination and recovery at representative
  high-fill volume. If that proof fails, approve and disclose a fixed recent
  historical-day window for direct Moomoo imports and use statements for older
  history with explicit coverage and duplicate reconciliation.

## Implementation checkpoint

Migration 0033 has been applied to the local development database. The
connection's server-only settings are outside source control:

- `TRADERLINK_MOOMOO_OAUTH_CLIENT_ID`
- `TRADERLINK_MOOMOO_CREDENTIAL_ACTIVE_KEY_VERSION`
- `TRADERLINK_MOOMOO_CREDENTIAL_KEYS_BASE64` (a JSON object of 32-byte,
  Base64-encoded AES keys keyed by version)

The registered callback must exactly match the local or hosted origin followed
by `/api/connections/moomoo/callback`. The local callback uses `127.0.0.1`
because Moomoo requires an exact registered redirect match. No credential,
account identifier or candle payload is retained in project files or logs.

## Coordination note

This work must not overlap or absorb the existing AI-review administration
package currently present in the checkout. It introduces no Journal execution
write, import acceptance, WebSocket, scheduled polling or trading action.
