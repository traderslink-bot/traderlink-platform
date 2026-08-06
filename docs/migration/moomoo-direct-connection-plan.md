# Moomoo Direct Connection Plan

**Status:** Approved to begin the read-only foundation on 2026-08-06. Visible
connection UI requires owner review before implementation.

## Goal

Connect a trader's Moomoo account directly to TradersLink using Moomoo OAuth
2.1 with PKCE, then read authorized trading accounts and broker fills without
placing, changing, or cancelling orders. This is a direct TradersLink
connection; it does not use SnapTrade or expose a third-party brokerage portal.

## First slice

1. Register one TradersLink OAuth public client outside source control, with a
   production callback URL and a separate local-development callback URL.
2. Implement a server-only OAuth authorization start/callback flow with a
   short-lived, HttpOnly state/PKCE binding. Authorization state, codes and
   tokens never enter a URL beyond Moomoo's one-time callback code, logs,
   browser storage, fixtures, source control or analytics.
3. Store access and refresh tokens encrypted at rest using versioned AES-256-GCM
   application keys. The database stores connection state, expiry and safe
   scopes, but never exposes tokens or raw Moomoo account identifiers to a
   browser.
4. Prove Moomoo historical 1-minute candles through the authorized account's
   quote access. Use Moomoo fills, not orders, as the future execution source.
   Retain an encrypted/raw source boundary only after the returned payload has
   been reviewed; this foundation does not create imports, Journal executions,
   source-account links, round trips or Data Decisions.
5. Refresh an access token server-side only when it is expired or near expiry.
   If Moomoo rejects a refresh, mark the connection as needing reconnection and
   require the trader to authorize again.

## Explicit exclusions

- No order placement, modification, cancellation, buying power, position,
  fundamentals, corporate-actions, LLM, MCP or WebSocket feature.
- No always-on worker or real-time stream. Initial reads are on demand and
  bounded; a later scheduled catch-up needs a separate cost/reliability plan.
- No automated Journal acceptance. A later slice must preserve fetched broker
  evidence, normalize only documented fields, and pass the existing
  Journal/Data Decisions contract before creating facts. Exact broker fills
  are accepted automatically; Data Decisions are reserved for genuine source
  conflicts, duplicates, missing facts, or impossible arithmetic.
- No account is silently connected to a Journal account. That later mapping is
  an explicit trader confirmation using the existing private source-account
  boundary.

## Security and privacy contract

- Request quote read access for the first candle-data proof. A later
  execution-read slice must additionally require `trade:read`; never request
  `trade:write`.
- OAuth callback validates state and PKCE before exchanging a one-time code.
- Connection lookup is derived from the authenticated Platform user and
  workspace server-side. It fails closed for a missing/expired scope.
- Raw broker account, order and fill IDs are treated as private source data.
  Stable browser references are opaque and scoped; normal status views expose
  only safe labels and lifecycle state.
- Revocation removes usable encrypted credentials from the active connection
  record without deleting Journal facts (none are created in this slice).

## Data contract to prove with the owner's inactive Moomoo account

For every authorized account/market combination, inspect a bounded sample of
today and historical fills and record only a privacy-safe schema inventory:

- required returned fields and timestamp units;
- available markets and pagination behavior;
- whether historical fills are available despite no recent trading activity;
- fill status values and any fields needed for fees, currency, asset class or
  corrections; and
- the exact source-data gaps that prevent direct Journal previewing.

No personal account value, identifier, token, trade value or payload is written
to project files or logs.

## Exit criteria for this foundation

- A Moomoo OAuth client is registered outside the repository and the required
  server-only configuration is present.
- A trader can connect from the owner-approved Account status surface while
  staying within TradersLink except for Moomoo's authorization page.
- Tokens are encrypted at rest and are unavailable from all browser responses.
- The server proves bounded extended-hours historical 1-minute candle access,
  including its actual pagination behavior, with no write-capable scope.
- The owner's test result yields a privacy-safe candle-field inventory and an
  explicit follow-up decision for the Daily Trade Tracker and Journal ingestion.
