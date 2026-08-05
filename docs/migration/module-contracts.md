# TraderLink Platform Module Contracts

**Phase:** Phase 1 inventory preserved; contracts accepted through the Phase 4 Core Analytics plan

**Status:** Platform/Journal foundation and Phase 3 Journal integrity are implemented and technically accepted. The exact Phase 4 Journal-to-Analytics fact-set, math, registry, coverage, local-auth and route-consumer contracts are accepted for implementation under the Phase 4 plan.

**Architecture:** One Next.js modular monolith, one Platform identity, one physical database per environment when appropriate, and explicit logical ownership.

## Contract rules

1. A module owns its tables, migrations, server repositories, validation, mutations, and published data-transfer contracts.
2. Another module calls the owner's server service; it does not query the owner's tables or import internal repository files.
3. Server Components call server services directly. They do not call TraderLink's own Route Handlers merely to reach the same process.
4. Server Actions are used for authenticated UI mutations when file upload/streaming/external HTTP is unnecessary.
5. Route Handlers remain for statement uploads, external publishers/providers, OAuth/webhooks, streams, and browser requests that genuinely need HTTP.
6. Every private call carries a server-derived `WorkspaceAccessScope` or narrowed `AccountScope`. Client-supplied ownership identifiers are never sufficient authorization.
7. Cross-module summaries fail independently. A Watchlist or Academy failure cannot blank the Journal summary, and a pending Journal record cannot blank an unrelated metric.
8. Contracts use exact decimal strings or minor units for financial values. JavaScript floating-point numbers are not the financial source of truth.
9. All persisted mutations retain version/revision, actor, source, timestamp, and reason/evidence when applicable.
10. Contract names describe product concepts, not the implementation generation. No new public contract uses `v3` or `v4` as its domain name.

## Shared primitives

| Primitive | Required shape/meaning |
| --- | --- |
| `WorkspaceAccessScope` | Platform-derived `userId`, `workspaceId`, workspace role, allowed `accountIds`, and active account selection; represents owners, admins, or members and is never trusted from request body alone |
| Journal account selection | One user/workspace may contain multiple user-defined Journal accounts for any strategy, asset class, purpose or grouping. A Journal account may contain many broker/source identities and is not a one-broker container. An opaque HttpOnly local-review cookie selects only from the server-derived active-account allowlist; internal account IDs are not browser selectors. The selected scope controls every import, learned mapping, execution, decision, annotation and analytics query, and mutation requests carry an expected selection so stale tabs fail with a conflict |
| `AccountScope` | Stable Journal trading-account ID, broker label/identity, base currency, account timezone, import timezone defaults, status |
| `Decimal` | Canonical base-10 string with defined scale/rounding at display only |
| `Money` | `{ amount: Decimal, currency: ISO-4217 code }`; no cross-currency summation without an explicit conversion fact |
| `Quantity` | Canonical signed/unsigned decimal string as defined by the field; supports fractional quantity where the broker does |
| `Instant` | UTC ISO timestamp plus preserved source timestamp/timezone evidence |
| `TradingDate` | Calendar date in the metric/account's declared trading timezone |
| `Coverage` | Candidate, included, open, pending-decision, excluded, unavailable counts plus machine reason codes and readable explanations |
| `Revision` | Stable record ID, monotonically ordered version or revision token, actor, creation/update time, supersession link |
| `Provenance` | Source kind, broker/manual/system identity, import batch/source row, original evidence reference, and correction/supersession chain |

## Platform

### Owns

- User/session identity and authentication providers.
- Workspaces, memberships, account access grants, preferences, navigation, shared shell, notifications, and module availability.
- Server-derived `WorkspaceAccessScope`, narrowed `AccountScope`, and authorization/audit boundary.

### Publishes

- `requireWorkspaceAccessScope()` for authenticated server work.
- `requireAccountAccess(accountId)` and allowed-account listing.
- `getWorkspaceComposition()` containing module availability/status, not module private records.
- Stable shared UI/layout contracts and route-title/navigation configuration.

### Does not own

Broker executions, round trips, analytics calculations, lesson completions, Watchlist symbols, News articles, or provider market facts.

## Journal Administration

The exact QA-corrected contract is defined in the [Journal Administration Dashboard Plan](journal-admin-dashboard-plan.md). It is owner approved. Admin 1-6 authorization, import/format evidence, bounded read models, private APIs, audited maintenance actions and the complete light Material UI are assembled in the active unstaged implementation; integrated compile/build/browser acceptance and production activation remain pending.

Platform owns global operator grants, Discord/session authorization, sensitive-access audit events and operational receipts. Journal owns import-attempt evidence, statement-format observations/candidates and the admin read services over Journal facts. The `/admin/journal` composition layer may combine those published services after a fail-closed Platform operator check; it may not query V3 or a separate legacy/admin database.

Discord authenticates the owner in production. Journal Administration then requires the exact Discord-linked Platform user, configured-server owner evidence refreshed within five minutes and the singleton active `journal_owner_admin` grant. None of those conditions alone, and no Premium entitlement or workspace `owner`/`admin` role, authorizes Platform-global administration. Email/password admin login remains deferred.

Journal Administration publishes bounded, privacy-safe operational counts, opaque support references, developer format packages and audited maintenance actions. It never owns or changes user executions, round trips, annotations or Data Decision outcomes, never turns an account-scoped user mapping into global runtime authority, and does not administer the separate computer-run Watchlist system.

## Journal

The exact Phase 3 persistence, reconciliation, reconstruction, and verification
contract is defined in the [Phase 3 Journal Integrity
Plan](phase-3-journal-integrity-plan.md). It refines this module boundary without
moving Journal authority into V3, routes, pages, or browser code.

### Owns facts

- Broker statements/import files and retention metadata.
- Immutable source rows and mappings.
- Immutable source coverage intervals; a missing statement period never means
  zero activity. Intentional manual trade capture proves only the submitted
  executions and previewed trade boundary; it does not claim full-account or
  full-day broker coverage. Broker-import coverage decisions remain separate.
- Import batches/previews/acceptance/supersession.
- Canonical executions from broker and manual sources.
- Data Decisions, corrections, exclusions, duplicate resolution, opening inventory, and decision audit.
- Derived round trips and stable round-trip identity/alias history.
- Trading-day records, notes, trade notes, tags, setups, rules, reviews, and candle/Level Analysis associations.
- Versioned trader-authored trade-style plans and dated Swing Trade Tracker note
  revisions keyed to stable position/round-trip identity.

### Source-account assignment contract

Unscoped statement parsing may expose only privacy-safe aggregate preview
evidence; a raw broker account identifier exists only transiently inside the
server operation. Scoped preview and import require an explicit confirmed
source-account identity and never auto-link in ordinary product paths.

The one-owner private migration may use a future narrow server-only preparation
command only after backup and migrations. It must prove exactly one active
Journal account in the seeded workspace, zero non-superseded identities for the
source system, no fingerprint conflict, and exactly one linked identity after a
single transactional `confirmSourceIdentityLinkRecord()` operation. After a
post-link interruption, one existing identity is an idempotent no-mutation
resume only when the in-process statement fingerprint resolves under complete
configured retained HMAC authority to that identity and the same sole active
account. Another
account, multiple identities, missing/unsupported authority, mismatch, conflict,
or ambiguity requires factual trader review/recovery. Returned evidence contains
counts and digests only, never the raw identifier.

Source-account assignment is Journal data ownership, not Platform login
authentication. The accepted local `development_local` owner remains
authoritative; Discord-first and optional email/password login are deferred.

### Source-row contract

Required: stable row ID; owner/account/import/source identity; original row number and preserved raw evidence reference; parsed fields; mapping/version; row state; issue codes; decision/supersession history. Raw private content is server-only and never logged or returned unnecessarily.

### Execution contract

Required facts:

- stable execution ID and owner/account scope;
- instrument identity and displayed symbol;
- execution time in UTC plus source time/timezone evidence;
- side and exact quantity/price;
- currency;
- commission/fees as exact optional facts with coverage state;
- broker execution/order IDs when provided;
- source kind and full provenance;
- state: `accepted`, `needs_decision`, `excluded_by_trader`, or `superseded`;
- revision/supersession history and deterministic ordering key.

An accepted execution must have the minimum facts required to change position: account, instrument, time/order, side, quantity, and price. A missing optional fee does not invalidate position reconstruction; it makes fee/net metrics conditional.

### Data Decision contract

Required: affected source rows/executions/round-trip chain; detected issue and consequence; available factual actions; before/after preview; trader choice; actor/time/reason; rebuild status; resulting aliases/coverage. Supported actions include correct, add a missing execution with new manual/correction provenance, set an evidence-supported execution order, exclude, resolve duplicate, confirm supported opening inventory, supply a missing position or statement-coverage fact, accept an unavailable source fact without inventing it, keep distinct, merge/supersede, and classify a supported position as legitimately open.

The trader controls facts. The service rejects arithmetically impossible outcomes such as declaring a non-zero position closed without an execution/inventory fact that reaches zero.

Broker/manual reconciliation is a contained Data Decision. Candidate generation
uses account-local date, instrument, currency, side, exact/aggregate quantity
and price/notional evidence; exact time is never a hard weak-match requirement.
While pending, the accepted manual execution remains eligible and only the
provisional imported candidate is withheld. Same, separate, correct and later
outcomes preserve both sources and prevent double counting; grouped-fill
resolution must conserve exact quantity.

The withholding occurs in the canonical round-trip input query through durable
pending reconciliation membership, not as a UI or analytics-only filter. The
ordinary exact duplicate merge remains strict; time-tolerant one-to-one merge is
allowed only by an active account-scoped reconciliation set and explicit trader
confirmation. Candidate creation, resolution and rebuild are atomic and
idempotent across reimports.

### Round-trip contract

Required: stable ID; current deterministic identity plus aliases; owner/account/instrument/currency; direction; ordered execution allocations; exact open/close times; lifecycle state; exact gross P/L; charge facts/coverage; net P/L when supportable; maximum position quantity; entry/exit notionals when supportable; affected trading dates; decision/limitation reasons.

The builder uses the approved zero-to-nonzero-to-zero rule, splits flips, rebuilds the complete affected chain after historical changes, and never groups by upload order.

### Trading-day contract

Required: owner/account/date/timezone; executions occurring that day; positions carried in/out; round trips closed that day; daily note; rule reviews; coverage. Realized P/L is attributed to closing trading date unless a metric explicitly declares a different basis.

### Day/Swing tracker contract

The [Day Trade Tracker And Swing Trade Tracker
Plan](day-and-swing-trade-tracker-plan.md) controls the two Journal workflows.
They share the canonical execution ledger and deterministic round-trip builder.
Day/Swing/Other is an append-only trader-authored plan on a stable
trade/position identity, never an inference from holding duration. Swing daily
notes use the stable position and note date; late authorship keeps its actual
creation timestamp. `/trades/open` continues to publish every factually
confirmed open position, regardless of tracker classification.

Intentional manual capture previews per-row dates/times plus explicit
start/continue/close relationships. A supported zero boundary can establish a
new manual trade without importing the unrelated whole-day coverage workflow.
Duplicates, contradictory chronology, missing required facts and impossible
position arithmetic still fail closed into Data Decisions.

### Publishes

- Import preview/accept/decision services.
- Owner-scoped execution ledger queries.
- Round-trip/open-position/ticker/calendar/day queries.
- Notes/tags/rules/review mutations.
- `JournalAnalyticsFactSet` for Analytics: only accepted facts plus explicit open/pending/excluded coverage and stable identities.
- Bounded summary for `/workspace`.

## Journal Analytics

### Owns

- Versioned metric definitions and formulas.
- Eligibility rules per metric.
- Exact shared aggregation over Journal-published facts.
- Rebuildable materialized summaries only when performance evidence justifies them.
- Filters/groupings, display metadata, coverage, limitations, and reconciliation output.

### Input contract

`JournalAnalyticsFactSet` includes:

- filter scope: owner, allowed accounts, currency partition, time range and timezone/date basis;
- accepted closed round-trip rows with exact facts;
- legitimate open positions as a separate population;
- pending/excluded/superseded counts and reason codes;
- source/fee/quantity/notional/label/market-data coverage flags.

Analytics never reads source tables directly and never reinterprets a trader decision.

### Output contract

Every metric result includes:

- metric ID/version/title/unit/display format;
- exact value or `unavailable`;
- formula/date/currency/fee/open-trade policy identifiers;
- filter scope;
- included population and excluded/open/pending counts;
- limitation/unavailable reasons;
- last rebuilt/source revision.

Every grouped response derives from the same accumulator/calculation functions as its total. Pages do not independently calculate financial values.

### Publishes

- `getAnalyticsOverview(scope, filters)`.
- `getPerformanceAnalytics`, `getResultAnalytics`, `getTimingAnalytics`, `getExecutionAnalytics`.
- Bounded totals/daily/ticker/time-of-day data for Workspace, Trades, Calendar, and Analytics.
- Capability/availability metadata so the UI explains missing facts.

## Academy

### Owns

Course/path/lesson registry, enrollment/progress/completion, quiz/assessment state, protected slug aliases, and Academy-specific preferences.

### Publishes

User-scoped progress summary, current path/lesson state, completion mutations,
and a bounded Workspace summary. Platform owns stable multi-provider identity
and sessions; Academy owns canonical lesson completion state and immutable
events. Progress follows the user across workspaces and Journal accounts.

## Watchlist

### Owns

Symbols, publisher ingestion, current lifecycle/health, archives, recap, and Watchlist-specific provider facts.

Migration 0014 owns the local current-symbol, global-health and immutable
archive tables. Watchlist state is shared premium content and is not scoped to
a workspace or Journal account. Local and the accepted single-node hosted
runtime use the explicit Platform database under Watchlist-owned migrations.
Ordinary reads/writes verify schema and execute no DDL.

### Publishes

Current list/symbol/archive/recap queries, authenticated stream, ingestion boundary, and bounded Workspace summary. It does not write Journal executions based on a watched symbol.

Platform publishes the Premium access decision. The guarded development user
is accepted locally; public access uses the Platform session and current
bounded Discord membership. User access never
authorizes publisher ingestion, recap or archive-reset commands.

## News

### Owns

Article content, ingestion provenance, ticker/category metadata, publish/access state, and weekly source automation outputs.

Migration 0015 owns the current article projection and immutable article
versions. News is public module content, not Journal-account data. Local and
the accepted single-node hosted runtime use the protected Platform database.
Ordinary requests verify schema and execute no DDL.

### Publishes

Public and access-aware article/ticker queries plus bounded Workspace summary. Article ingestion is an authenticated external/operational HTTP boundary.

The publisher token is required in every environment. Identical delivery is
idempotent; a content change advances the revision and appends an immutable
version. Public responses do not expose raw publisher payload or diagnostics.

## Level Analysis and market data

### Owns

Provider deliveries, normalized candle/level facts, symbol/timeframe/as-of provenance, validation/quarantine, provider/warehouse health, and reproducible provider versions.

### Publishes

Versioned symbol/as-of facts and delivery evidence. Journal owns the association between a delivery/fact set and a Journal execution/round trip. Analytics consumes a joined published view only for metrics whose market-data coverage is complete.

It never owns or silently changes Journal executions, round trips, decisions, or realized broker P/L.

## Coach and Review

### Owns

Coaching plans/prompts, review queues/workflows, user-authored lessons, acknowledged/dismissed recommendations, and explanation provenance.

### Consumes

Published Journal facts, Journal Analytics metrics/coverage, trader tags/rules/reviews, and optional Level Analysis facts. It may propose a review; it may not create a factual trade classification without a trader decision.

### Publishes

Bounded actionable review queues and Workspace summary. AI-generated language is labeled as assistance, never source truth.

## Account and Affiliate

### Owns

Account profile/preferences, module access/subscription links, affiliate
invites/attributions, and user-facing account relationships. Migration 0016
keys first-touch attribution to stable Platform user ID. It is never scoped to
a Journal account and never stores broker identity. Repeated events may advance
last-seen/joined evidence but cannot silently replace the first affiliate.
Hosted Discord relationships map through exact Platform identity; ambiguous or
unmapped legacy referrals remain pending and are never guessed.
Payment/commerce provider behavior requires a separate contract if introduced.

## Workspace composition contract

`/workspace` calls each enabled module summary independently. The Platform response contains per-module states:

- `ready`: summary data plus source revision.
- `empty`: valid zero population.
- `limited`: data plus coverage warning.
- `unavailable`: module-specific safe error and retry/action.

One module's `unavailable` state does not change another module's `ready` state. A valid zero is distinct from unavailable or not-yet-calculated.

## Transactions and rebuilds

- Import acceptance, correction, duplicate resolution, and manual execution creation write Journal facts and enqueue/mark the affected chain for deterministic rebuild in one database transaction where possible.
- Round trips and analytics summaries are derived and reproducible; source evidence and trader decisions are durable facts.
- The first implementation may rebuild synchronously for the current local dataset. If work later becomes asynchronous, the durable job/outbox state belongs to the initiating module and publishes explicit pending/failure status.
- No silent dual-write to legacy and replacement databases is allowed.

## Current-to-future boundary map

| Current implementation | Future contract owner | Required action |
| --- | --- | --- |
| V3 owner/deployment auth | Platform | Preserve isolation/loopback outcomes, remove V3 dashboard coupling |
| V3/trader-analytics import SQLite repository | Journal | Migrate evidence/executions/decisions; replace schema and services |
| V3 configured dashboard analytics | Journal Analytics | Replace with metric-specific exact aggregation and coverage |
| V3 rules types/replay | Journal | Preserve rule/version/lifecycle facts without V3 engine dependency |
| Repository-local tags/Day Session DB | Journal | Migrate to Journal-owned schema and stable round-trip/day identities |
| Academy/News/Watchlist/affiliate generic V3 DB fallback | Respective owners | Replace with explicit platform DB/module repositories |
| Level Analysis shared V3 DB accessor | Level Analysis + Journal link | Separate logical migrations/contracts while allowing one physical DB |
| Two dashboard shells/layouts | Platform | Preserve approved `/workspace` visual baseline; retire legacy shell only after mapping and owner approval |

## Phase 2 accepted foundation and later operation

Phase 2 preservation, design, and foundation implementation established:

1. the accepted local Git state in a traceable source commit;
2. the clean full checkout at `C:\Users\jerac\Documents\TraderLink\traderlink-platform` with its recorded remote and branch;
3. the approved light Material dashboard shell and complete left-navigation preservation contract;
4. the owner-accepted exact empty Platform/Journal database foundation, global migration identity, deterministic schema-drift verification, initialization recovery, versioned account fingerprinting, server-derived `WorkspaceAccessScope`, owner/admin/member permission model, and separate ownership-seed gate; and
5. the implemented and correction-verified focused verification plan and exact implementation-file list in [Replacement Database Schema and Migrations](replacement-database-schema-and-migrations.md); and
6. the verified empty `development.sqlite` with exactly two migration rows and five zero-row domain tables, accepted with the 10-file/53-test result by the coordinating technical auditor.

The Phase 2 empty database foundation and follow-on [Development Owner Seed Progress](development-owner-seed-progress.md) checkpoint are technically complete. The seed established stable development ownership independently from public authentication so later Journal facts do not depend on a temporary login implementation. Its 1/1/1/1/0 counts are the historical seed boundary. Phase 3 subsequently added the accepted source identity and Journal facts under the [Phase 3 tracker](phase-3-journal-integrity-progress.md). F6 implements Discord-first Platform sessions while preserving those stable user/workspace/account UUIDs; the exact initial-owner link and hosted-data adoption remain explicit pre-launch operations. Optional linked email/password identity remains deferred. Do not remove or repurpose the original `traderslink.pro` folder.
