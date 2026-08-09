# Moomoo Direct Connection Plan

**Status:** OAuth, quote-backed analyzer access and the durable execution-import
implementation are built. The owner approved the Account progress experience
on 2026-08-09. Real `trade:read` provider proof is deliberately deferred to
the invited public beta and remains a release checkpoint rather than an
implementation claim.

**Active reliability correction:** [Moomoo Import Reliability And Admin Errors Plan](moomoo-import-reliability-and-admin-errors-plan.md)
and [progress tracker](moomoo-import-reliability-and-admin-errors-progress.md).

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

## Minimum-account Daily Trade Tracker candle proof

Before expanding the execution-import slice, prove the Daily Trade Tracker's
minimum market-data requirement with a newly created Moomoo OAuth identity that
has no funded balance, no cash or margin brokerage account, no trading history
and no executions. This is a quote-access proof, not an execution-import test.

### Exact scope

1. Use only the current OAuth OPEN API at `webapi.moomoo.com` with the existing
   server-held `quote:read` connection. Do not install, start or use OpenD and
   do not treat legacy OpenD behavior as proof.
2. Test only historical U.S. **one-minute** candles. Moomoo documents
   `extended_time` only for U.S. one-minute K-lines: use `extended_time=1` to
   include premarket and after-hours. Do not request `extended_time=2`; the
   Daily Trade Tracker does not support overnight trading in this slice.
3. Do not test daily or five-minute candles, realtime REST/WebSocket data,
   quotes, scanner features, short interest, daily short volume, Level 1/2/3,
   order books, watchlists, fundamentals or any trading endpoint.
4. The application requirement is the analyzer's existing 4:00 AM through
   8:00 PM America/New_York session: exact one-minute OHLCV, every execution
   minute, and available candles through 60 minutes after the final exit. The
   diagnostic must assess this contract rather than unrelated provider fields.

### Diagnostic sequence

1. After the owner connects the new minimum account, record only the safe OAuth
   scopes and the owner's supplied account classification. Never record tokens,
   cookies, raw identities, broker identifiers or account values.
2. Request a liquid U.S. symbol for a completed trading date with
   `ktype=1`, `extended_time=1` and the documented maximum `num=370`. Validate
   actual OHLCV rows and timestamps rather than treating HTTP success as proof.
3. Follow the live OPEN API pagination behavior for the same symbol until the
   requested 4:00 AM-8:00 PM session is covered or Moomoo reports no earlier
   page. Record page count, candle count, first/last timestamps, safe response
   status/error codes and whether premarket, regular-session and after-hours
   candles were actually observed.
4. Repeat with representative U.S. symbols that have known extended-hours
   activity, including the previously useful CLRO, WYHG and PAVS cases where
   their requested dates remain suitable. A valid empty minute is not a
   failure, but every requested execution minute must have a candle before the
   analyzer can call that trade ready.
5. Probe distinct symbols gradually and with bounded pacing. First search the
   current OPEN API response/documentation for observable quota metadata. If a
   legacy-like 100-unique-symbol rolling seven-day limit becomes proven, accept
   it as a workable analyzer coverage limit and expose missing coverage rather
   than bypassing or hiding it. Do not rapidly blast 101 requests merely to
   force an error; expand the probe only while responses and provider limits
   remain safe.
   - The initial same-day probe completed 150 fresh Nasdaq symbols, each with
     one paced History K-Line first-page request for the current date. All
     returned HTTP 200 and provider code `0`; no response included quota,
     remaining-count, reset or rate-limit metadata. The old 100-symbol claim
     is therefore not a hard limit for this OAuth REST account and endpoint.
     This does not prove an unlimited entitlement: Moomoo did not disclose an
     upper bound, so the production client must still request only the ticker
     coverage a trader actually needs and cache fetched candles by symbol and
     minute.
6. Store a privacy-safe diagnostic report with only confirmed working,
   confirmed unavailable and unresolved results. Do not persist raw candle
   values merely to prove capability; counts, bounded timestamps, session
   coverage, hashes and provider errors are sufficient.

### Decision boundary

- **Pass:** the minimum account can retrieve and page valid one-minute U.S.
  premarket, regular and after-hours candles covering the analyzer's required
  trade window. The Moomoo adapter may then be considered for the Daily Trade
  Tracker behind the existing broker-neutral `MarketDataProvider` boundary.
- **Limited pass:** candles work but a provider history, pagination or
  distinct-symbol restriction is proven. Keep the analyzer available only
  within that exact disclosed coverage and return factual no-coverage states
  outside it.
- **Fail:** the minimum account cannot obtain the required one-minute extended
  session. Do not make Moomoo a general Daily Trade Tracker candle dependency;
  retain the provider abstraction for another market-data source.

## Next slice — execution import and history backfill

This owner-approved slice turns the connection into a broker execution source.
It remains read-only: it never places, changes or cancels an order.

## Linked implementation slice

The approved follow-on implementation is [Moomoo Daily Trade Tracker Analyzer
Plan](moomoo-daily-trade-tracker-analyzer-plan.md), with its active work record
in [Moomoo Daily Trade Tracker Analyzer Progress](moomoo-daily-trade-tracker-analyzer-progress.md).
It replaces the inactive Yahoo Daily Trade Tracker analyzer only. Automatic
Moomoo execution importing remains the execution-import scope below.

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
5. Before connection, explain the two Moomoo capability levels plainly. A free
   Moomoo user account can connect the quote data used for chart replay and
   analyzer features without opening a Moomoo trading account. Automatic
   execution imports additionally require `trade:read` and at least one
   authorized trading account returned by Moomoo. TradersLink detects this
   after authorization instead of inventing a balance, funding or trade-history
   minimum that Moomoo does not document for this endpoint.
6. After connection, show the exact TradersLink features unlocked by the
   returned capabilities. A quote-only/free account shows chart replay and
   eligible-date trade analysis as available, with execution imports not
   enabled. A trade-read connection with an authorized trading account can be
   linked for automatic imports. If no authorized trading account is returned,
   keep chart features available and direct the trader to statement imports.

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

### Historical Journal facts versus Daily Tracker work

1. Execution-import coverage and Daily Trade Tracker participation are
   independent. A trader may import years of Moomoo fills into the Journal
   without creating years of incomplete Daily Tracker reviews, missing-note
   prompts, tag prompts or rule-review obligations.
2. The first import records a **Daily Tracker start date**. It defaults to the
   connection/import setup date. Imported trading dates before that boundary
   remain available as historical Journal and analytics facts, but are not
   presented as Daily Tracker work the trader failed to complete. The trader
   may still open an older date and add context voluntarily.
3. Trading rules are versioned behavior commitments with an effective start
   date. A rule created, enabled or materially changed today is not evaluated
   against an earlier trade unless the trader explicitly assigns a historically
   accurate rule version to that earlier period. Importing old executions must
   never rewrite historical rule outcomes using current rules.
4. Notes and tags remain optional historical context. Their absence on an
   imported date before the Daily Tracker start date is an explicit
   not-requested state, not missing evidence and not a negative completion
   signal.

### Analyzer eligibility and bounded historical candles

1. Execution history does not automatically create candle-history work. A
   trade is analyzer-eligible only when its trading date falls within a saved
   active paid-plan interval for that Platform user and workspace. The first
   paid trading date is eligible in full, including trades made earlier that
   same date before the activation time.
2. Cancelling or losing paid access closes the active eligibility interval.
   Existing saved analyses and replays remain visible, but no newly traded
   dates during the unpaid gap become eligible. Reactivation starts a new
   interval and never backfills that gap.
3. A delayed broker import may still be analyzed after the interval closes if
   the fill's actual trading date was eligible. Eligibility follows the broker
   execution date, not the later arrival, page-view or job-completion date.
4. Do not offer normal-plan analysis of history before the first eligible paid
   date or of trades from an unpaid gap. A distinct
   ticker/trading-date can require an extended-hours one-minute candle session,
   and Moomoo caps each History K-Line response at 370 candles. Automatically
   expanding years of executions into candle requests and stored replays would
   create provider and storage work and would let one paid month consume years
   of analyzer value. A future separately priced historical-analysis product
   would require its own explicit contract; it is not part of this plan.
5. Every eligible analysis checks the shared candle cache first, queues only
   missing ticker/date coverage, and reports complete, partial, unavailable or
   provider-limited coverage truthfully. Candle availability never blocks the
   execution import.
6. Long-term statistics must state their population. Execution-only measures
   can use the imported Journal coverage; candle-derived measures use only
   analyzer-eligible trades with complete required candle coverage. Neither
   population may be described as the trader's complete history unless its
   corresponding coverage is complete.

### Initial history selection and durable progress

1. The trader must enter the earliest trading date they want imported before
   the first execution job can start. Explain that they should choose the date
   of their first Moomoo execution or a slightly earlier date if they are
   unsure. Do not offer or imply an automatic "all available history" search:
   Moomoo does not expose the account-opening date or an earliest-history
   discovery field.
2. Lock an immutable import cutoff when the job starts. Moomoo accepts exact
   positive `start` and `end` microsecond update timestamps; when both are
   supplied, they define the requested batch. Divide the trader-selected date
   through that cutoff into consecutive, overlapping 90-day reliability and
   progress ranges. The range size is a TradersLink recovery unit, not a claim
   that Moomoo limits an explicit start/end query to 90 days.
3. Retrieve ranges newest to oldest so the most recent executions become
   available first, then continue backward until the trader-selected start
   boundary has been processed. Store the selected start, immutable cutoff,
   current range, page cursor, counts, attempt state and timestamps in durable
   server-side import records. The Account page can show ranges complete out
   of total, current date window, imported execution count and any retry
   status while the trader navigates elsewhere or closes the browser.
4. Within each account, market and date range, request the maximum documented
   page size of 50 fills and follow Moomoo's returned `page_flag`. A range is
   complete only when Moomoo returns `completed: true`, which means every deal
   for that requested account, market and start/end batch has been returned;
   it does not prove lifetime account-history coverage outside that batch.
   Never perform the whole backfill inside an OAuth callback, browser request
   or a single long-running serverless invocation.
5. Retrieval order does not change Journal truth. Preserve each fill's exact
   `create_time` as its execution time and `updated_time` as its provider
   synchronization/correction time, then rebuild the affected Journal chain in
   chronological execution order. Until the selected coverage is complete,
   do not describe partial position, round-trip or long-term analytics as
   complete.
6. A retry resumes from the last durably committed page/range checkpoint.
   Rate-limit or provider failures back off without discarding completed work.
   A page cursor advances only after that page's private evidence and bounded
   Journal commit have both succeeded, so a crash cannot skip received fills.

### Beta failure visibility

1. User accounts show only useful process states: queued, importing, retrying,
   complete or unable to finish. They never receive internal error codes,
   provider codes, raw broker identifiers or support/event references.
2. When a server-received operation fails, the user is told that the details
   were automatically sent to TradersLink administration and are being worked
   on. A browser/network failure that never reaches the server must not be
   described as reported.
3. Privacy-safe failure categories, HTTP status codes and numeric provider
   codes are written to immutable operational receipts visible only in Journal
   Administration. Tokens, account/deal/order IDs and provider payload values
   are never written to those receipts or logs.
4. The invited beta uses hand-picked Moomoo traders after the public site is
   live. Live account/deal proof is performed there because the current owner
   account cannot supply representative trading-account history. A failed beta
   import remains recoverable through durable range/page state and broker
   statement fallback.

### Extending imported history backward

1. Persist successfully processed coverage intervals by provider account and
   market. Coverage is proven by completed requests, not inferred from dates
   on existing executions; an execution-free period may still have been
   requested successfully.
2. After an initial import, let the trader choose **Import older trades** and
   enter an earlier date. Compute only the missing interval between that new
   date and the earliest completed boundary, with a small deliberate boundary
   overlap. Do not request all already-covered newer history again.
3. Deduplicate every overlap by provider + broker account + deal ID. Once the
   older interval is complete, merge the durable coverage intervals and
   rebuild the affected chronological Journal chain so earlier executions can
   correctly change later positions and round trips.

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
- The implementation provides a CRON-secret-protected hosted worker entrypoint
  that processes one bounded provider page per invocation and a local launcher
  bridge for development. Deployment must schedule the hosted entrypoint; it
  must not expose the worker publicly or rely on an open browser tab.
- Prove the returned execution schema and account/market pagination with a
  bounded live `trade:read` test before creating Journal facts from it.
- Preserve every existing import, Data Decisions, manual execution and
  Journal-ledger invariant. This integration adds another trusted broker
  source; it does not replace the existing import path.

### Reliability fallback

The multi-year direct backfill remains conditional on live proof that Moomoo's
pagination, rate limits, cursor recovery and hosted processing are reliable at
realistic account sizes. If that proof does not pass, do not ship a fragile
long-history promise. Limit the direct connection to current executions plus a
clearly stated, owner-approved number of recent historical days. Show that
exact recent-history window before the trader starts the import, and use broker
statements for history before the window. Record broker-API and statement
coverage separately, deduplicate any deliberate overlap through the canonical
source-identity and Journal reconciliation boundary, and never imply that the
bounded direct import represents the trader's complete account history.

## Plan QA gates

The following are required before this slice may be called complete.

1. **Scope readiness is visible and enforced.** The existing proof connection
   has `quote:read`; that is candle-ready, not execution-ready. The connection
   model and Account status must distinguish quote-only, execution-ready and
   reauthorization-required states. An active quote-only connection must not
   be presented as able to import trades or trigger a fill job.
2. **Fresh removal can reconnect.** Migration 0033 intentionally prevents a
   revoked record from being modified. The next connection migration must make
   a confirmed Disconnect remove usable credentials, hide the broker row and
   still let a later new OAuth flow create a fresh connection safely. Verify
   this lifecycle end to end; do not leave a hidden revoked record that blocks
   a new connection.
3. **More-broker architecture is real, not just a picker label.** Migration
   0033 currently constrains the database provider to Moomoo. Before any
   second broker becomes selectable, introduce a versioned broker registry and
   schema constraints that allow only explicitly supported providers. Each
   provider supplies its own OAuth method, scope requirements, availability,
   delay/reauthorization limitations, history capabilities and importer.
4. **The job has a hosted owner.** Select and document the durable hosted job
   runner before release. It must claim database-backed work, use bounded
   execution time, persist each page/range checkpoint before another call,
   back off on provider limits and be independently retryable. Browser
   navigation, request timeouts and OAuth callbacks cannot own the import.
5. **Progress totals are honest.** Do not start an execution import until the
   trader supplies the earliest date they want imported. The total is the
   deterministic account + market + TradersLink-range work from that date
   through the immutable import cutoff, not an assertion about Moomoo's
   earliest available history or the unknown number of fills. Show the current
   backward-moving date window, completed work units and accepted fill count;
   do not invent a fill percentage.
6. **Execution identity is exact.** Deduplicate by the provider deal/fill ID
   within the provider account identity, never by parent order ID, symbol,
   time, price or quantity. Use Moomoo update timestamps only as a sync
   cursor, with an overlap that always rechecks already-seen deal IDs.
7. **Market coverage is explicit.** Moomoo historical-deals requests require
   a trading market. The importer must enumerate supported authorized markets
   and show unavailable/unsupported markets rather than silently omitting
   executions.
8. **OAuth client identity is release-ready.** The production Moomoo OAuth
   client must display TradersLink as its client name on Moomoo's consent
   screen. The local generic Moomoo Web API wording is a test-only result and
   must not be described as branded TradersLink authorization.
9. **Multiple broker accounts require an explicit mapping.** OAuth may return
   more than one authorized Moomoo trading account. Show only safe account
   labels and let the trader select which broker accounts feed which Journal
   account; never silently route every returned broker account into the active
   Journal account. Persist the private source-account identity under the
   existing versioned identity/HMAC boundary before the first fill is accepted.
10. **Date selection has exact broker-time boundaries.** The required initial
    date is a trader-facing trading date, while Moomoo historical-deals filters
    use microsecond update timestamps. At job creation, resolve the selected
    first date and immutable import cutoff to documented market/account-timezone
    boundaries and persist both exact instants. Until a live boundary test
    proves Moomoo's inclusivity semantics, overlap adjacent ranges and
    deduplicate by deal ID rather than assuming half-open provider behavior. No
    later browser timezone, daylight-saving change or retry may shift a
    boundary and miss a fill.
11. **Every page enters Journal through the existing evidence boundary.** A
    worker page first persists its private, hashed source evidence, then uses
    the canonical broker-import command/rebuild path to commit that page's
    accepted executions in a bounded transaction, and only after both succeed
    advances the durable page cursor. If those stores cannot share one database
    transaction, persist an explicit replayable intermediate state so a crash
    repeats rather than skips the page. Never keep raw API payloads in browser
    models, ordinary logs or job-status tables, and never turn a multi-year
    import into one giant ledger write.
12. **Scope proof is account-specific.** Do not treat a token string that
    merely contains `trade:read` as enough. Prove that the returned authorized
    account list and each selected market can actually be read with that token.
    If Moomoo's returned account-scoping permission excludes an account, show
    that account as unavailable and do not start a partially authorized import.
13. **Long-history reliability has a release decision.** Test representative
    high-fill multi-year pagination, interruption, retry and provider-limit
    behavior before enabling unrestricted user-selected history. If it does
    not pass, activate the documented recent-history-plus-statements fallback,
    select and disclose the exact supported day count, and retain the same
    duplicate, coverage and Journal-truth safeguards across both sources.
14. **Historical imports do not create review debt.** Persist a Daily Tracker
    start boundary separately from broker coverage. Dates before it do not
    become incomplete Tracker days merely because executions were imported.
15. **Rules do not apply backward silently.** Rule evaluation uses the rule
    version effective for the trade date. A missing historical rule version is
    shown as not evaluated, never inferred from the trader's current settings.
16. **Analyzer work follows paid trading-date intervals.** The first paid date
    is eligible in full. Cancellation closes the interval, reactivation starts
    another, and unpaid gaps or history before first activation are never
    backfilled by the normal plan. Saved eligible analyses remain readable and
    execution importing continues when analysis is ineligible or unavailable.
