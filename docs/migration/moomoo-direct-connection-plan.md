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

## Next slice — execution import and history backfill

This owner-approved slice turns the connection into a broker execution source.
It remains read-only: it never places, changes or cancels an order.

### Broker connection experience

1. The Account page owns one **Broker connections** card. It starts with a
   broker selector; Moomoo is the first selectable broker and the card states
   that more brokers are coming soon.
2. Selecting a broker reveals only that broker's connection method,
   limitations, reauthorization behavior and next steps. Those instructions
   disappear once that broker is connected.
3. The selected broker's Connect action takes the trader to the broker's own
   sign-in/authorization page and returns them to TradersLink. The provider's
   OAuth client display name must identify TradersLink in production; generic
   provider wording is not adequate release copy.
4. Connected brokers appear as their own rows with status and a red
   **Disconnect** control. Disconnect asks for confirmation, destroys usable
   local credentials and removes that broker from the visible connected list.
   Selecting it later starts a fresh connection; it does not silently reuse an
   old credential.

### Authorization and source contract

1. Upgrade the Moomoo OAuth connection from the candle-proof `quote:read`
   scope to the minimum execution-read `trade:read` scope. Never request
   `trade:write`.
2. Read authorized trading accounts first. Keep raw provider account IDs,
   order IDs and deal IDs server-side/private; browser models use safe labels
   and opaque references only.
3. Read **historical deals/fills**, not historical orders, for Journal facts.
   A deal is one actual execution; an order may have several deals. Preserve
   the provider's deal ID, parent order ID, side, symbol, quantity, price,
   market, status and broker timestamps exactly at the private evidence
   boundary.
4. Broker-imported exact fills are accepted automatically after deterministic
   validation. Data Decisions are only for genuine duplicate/source conflicts,
   missing facts or impossible arithmetic; they are not a blanket review step.

### Initial history selection and durable progress

1. On the first execution import, the trader chooses an earliest import date.
   Offer date shortcuts and a custom date. Do not claim an "all available"
   progress total because Moomoo does not document an earliest-history date
   discovery field.
2. Divide the selected start date through the current date into consecutive
   90-day date ranges. This is a TradersLink reliability/progress unit, not a
   claim that Moomoo limits explicit start/end queries to 90 days.
3. Process ranges oldest to newest. Store the selected start/end, current
   range, page cursor, counts, attempt state and timestamps in durable
   server-side import records. The Account page can show ranges complete out
   of total, current date window, imported execution count and any retry
   status while the trader navigates elsewhere or closes the browser.
4. Within a range, follow Moomoo's historical-deals page cursor until it is
   complete. Never perform the whole backfill inside an OAuth callback,
   browser request or a single long-running serverless invocation.
5. A retry resumes from the last durable page/range checkpoint. Rate-limit or
   provider failures back off without discarding completed work.

### Reconnect and incremental sync

1. Store a broker-account-scoped high-water mark based on Moomoo's execution
   update timestamp, plus a small overlap on every later sync.
2. Deduplicate the overlap by provider + broker account + deal ID. A reconnect
   or a second import request never re-creates already accepted executions.
3. If Moomoo changes an existing execution, preserve the source-version chain
   and let the Journal rebuild affected round trips under its existing
   correction/decision contract.

### Required implementation boundary

- Add the broker connection/import job schema only after the shared next
  migration number is available; do not reuse migration 0033 or conflict with
  the separately reserved currency migration 0034.
- Use a durable worker/queue suitable for hosted execution. The browser is a
  status surface only; local development can run the same job processor
  explicitly.
- Prove the returned execution schema and account/market pagination with a
  bounded live `trade:read` test before creating Journal facts from it.
- Preserve every existing import, Data Decisions, manual execution and
  Journal-ledger invariant. This integration adds another trusted broker
  source; it does not replace the existing import path.
