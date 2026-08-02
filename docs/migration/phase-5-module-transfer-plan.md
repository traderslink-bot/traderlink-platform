# Phase 5 Module Transfer Plan

**Status:** Accepted for implementation under delegated technical authority; implementation has not begun
**Phase:** 5 - Module Transfer
**Repository:** `C:\Users\jerac\Documents\TraderLink\traderlink-platform`
**Branch:** `codex/traderlink-platform-replacement`
**Entry HEAD:** `f8cfa6481682439f926777afface51f8ea87ed7f`
**Active database:** `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\development.sqlite`
**Progress tracker:** [Phase 5 Module Transfer Progress](phase-5-module-transfer-progress.md)
**Prior handoff:** [Phase 4 Core Analytics Handoff](phase-4-core-analytics-handoff.md)

## 1. Outcome

Phase 5 transfers every remaining accepted product capability into its named
replacement module without reconnecting V3 as ordinary runtime authority.
The approved light Material dashboard remains the visible product. The work
changes the services and facts beneath it, then completes deliberately deferred
surfaces through separately reviewed slices.

The immediate Journal result is:

```text
historical broker statements + Trade Tracker manual executions
  -> one immutable source/evidence boundary
  -> one canonical execution ledger
  -> trader-controlled Data Decisions
  -> full-history round-trip rebuilds
  -> Journal day/open/ticker/calendar queries
  -> the approved dashboard and Journal Analytics
```

Valid executions and ready round trips remain visible. A pending decision
limits only the affected chain or fact-dependent metric. The trader controls
factual corrections, exclusions and supported open-position classifications;
the engine enforces arithmetic, scope and evidence consistency.

## 2. Accepted entry boundary

Phase 4 is accepted through:

- implementation commit
  `4575dafd0fb62804ac090c4a149152506d8db7b1`;
- closure commit
  `f8cfa6481682439f926777afface51f8ea87ed7f`;
- an owner-approved light Material dashboard and complete left navigation;
- replacement Workspace, Round Trips, overview API and five standard Analytics
  routes;
- 210 classified analytics capabilities, of which 181 are implemented or
  conditional and 29 are explicitly unavailable;
- 331 ready closed round trips, zero automatically legitimate-open round trips,
  two contained Data Decisions and 331 fee-complete realized rows; and
- no push, deployment, production mutation or legacy deletion.

At Phase 5 entry the database main file is 10,522,624 bytes with SHA-256
`31101395dafb7bb14c2bf934e3288b40f63a5f8736a1da03cf549c996463af3b`.
The WAL is zero bytes and SHM is 32,768 bytes. Port 3010 is not listening and
remains off until a visual-review checkpoint.

The entry working tree is clean. The legacy repository and its private stores
remain preserved recovery/reference sources.

## 3. Controlling inventory

This plan does not replace the complete inventories with a smaller "minimum"
list. The controlling target is every item in:

- [Product Inventory](product-inventory.md);
- [Route Ownership](route-ownership.md), including 96 page routes and 61 Route
  Handler routes;
- [Database Ownership](database-ownership.md);
- [Operational and Configuration Inventory](operational-and-configuration-inventory.md);
- [V3 Dependency Map](v3-dependency-map.md);
- [Module Contracts](module-contracts.md); and
- [Acceptance Inventory](acceptance-inventory.md).

Every item must finish Phase 5 as implemented, compatibility-preserved,
explicitly deferred to Phase 6/go-live, or owner-rejected. An item may not
disappear merely because it is not in the first implementation slice.

### Complete Phase 5 module target list

| Module/area | Complete target carried into Phase 5 |
| --- | --- |
| Platform shell | Approved dashboard shell, route/navigation ownership, module composition, preferences and readiness state |
| Platform identity/account | Stable user/workspace/membership IDs; Discord-first public login; optional email/password; account UI and access grants before go-live |
| Journal imports | Historical statement preview, account confirmation, commit, history, idempotency, source evidence, arbitrary upload order and compatibility endpoints |
| Journal Data Decisions | Pending/resolved decision reads, evidence, correction/exclusion/duplicate/order/inventory/open-position actions, audit and rebuild status |
| Journal executions | One broker/manual/correction ledger, exact facts, provenance, versions, aliases and coverage |
| Journal trade views | Round trips, ticker history, open positions, day/trading-date queries, Calendar and Trade Tracker |
| Journal annotations | Trading rules, rule versions/lifecycle, rule reviews, tags, tag assignments, day notes and trade notes |
| Journal Analytics | Existing standard pages plus Analytics Lab, saved views and supported chart/trade explorations |
| Level Analysis/market data | Candle and level facts, provider deliveries, review links and explicit data coverage |
| Coach/Review | Reflection loop, queues, plans, user-authored reviews and explanation provenance |
| Academy | Course/path/lesson behavior and production progress/slug preservation |
| Watchlist | Current list, symbol detail, archives, recap, health, authenticated stream and ingestion |
| News/content | Articles, ticker pages, access, Week Ahead content and the preserved low-priority Big Time automation |
| Account/Affiliate | Profile/preferences, module access and preserved affiliate relationships |
| Market tools/site | Charts, landing/site routes, scanner access and other Platform peers in the route inventory |
| Legacy `/intelligence` | All 52 routes mapped by unique capability before retirement; compatibility or explicit disposition for each |
| Operations | Environment variables, launchers, verification scripts, CI safeguards, schedules, deployment and storage ownership |

## 4. Current route facts and corrections to the prior assumption

The owner approved the dashboard design but observed these live replacement
states:

- `/calendar`, `/trade-tracker` and `/rules` fail through inherited V3 access;
- `/trades/ticker` and `/trades/open` render honest but incomplete foundations;
- `/data-decisions` cannot reach its legacy import-repair endpoint;
- `/manual-entry` remains disabled;
- `/analytics/lab` is intentionally disconnected from V3/sample data; and
- standard Analytics pages show replacement data.

Source inspection adds two facts:

1. `/imports` and its import/history/decision endpoints also still depend on V3
   or the legacy trader-analytics repository. Import transfer is therefore part
   of the first Journal work, not a later cosmetic task.
2. The current Data Decisions screen assumes mutable isolated V3 statements,
   including physical-style delete/rebuild language and a generic repair-row
   contract. It cannot be safely repointed to the replacement database. Its
   actions must map explicitly to the accepted append-only decision service.

The legacy tag/Day Session store contained 21 tag definitions and four tag
assignments at the Phase 1 snapshot, with no observed day-note/review rows. The
legacy rules store contained no current rules records. These counts must be
reverified from read-only backups at the migration checkpoint; they are not
permission to discard or silently seed anything.

## 5. Cross-cutting rules

1. No new ordinary dashboard code imports V3 analytics, V3 authentication,
   V3 deployment, V3 replay/proof/authority, or the legacy trader-analytics
   repository.
2. Server Components call module services directly. Browser mutations use a
   narrow authenticated Server Action or Route Handler only when HTTP is
   genuinely required.
3. Every private operation derives `WorkspaceAccessScope` and account access on
   the server. Client IDs never establish ownership.
4. Exact financial values remain canonical decimal strings or integer/rational
   facts. Browser `number`, `Math`, `toFixed` and `Intl` output are display-only
   and never feed calculations, filtering or persisted decisions.
5. No missing fact becomes zero, closed, a swing trade, a rule violation, a
   setup, or trader intent.
6. Statement upload order and manual submission order are not execution order.
   Every accepted change rebuilds the full affected chronological account/
   instrument/currency chain.
7. One module owns its tables, migrations, repositories and mutations. Other
   modules consume published contracts.
8. No silent dual-write, V3 fallback, repository SQLite, sample trading data,
   private-data logging or unbounded client response is allowed.
9. Port 3010 stays off during implementation and focused checks. It is started
   only for an integrated visual-review checkpoint and stopped afterward.
10. Focused tests use one Vitest worker and no file parallelism. Broad lint,
    full-project TypeScript, full regression, production build, browser/E2E and
    CI-equivalent checks remain the Phase 6/final gate unless a slice changes a
    build/auth/data contract that requires an earlier bounded proof.

## 6. Slice A - Journal read models and route recovery

Slice A is read-only and introduces no schema migration.

### Calendar

- Replace V3 auth/configured analytics/deployment imports with the replacement
  Platform scope and Journal Analytics service.
- Preserve the approved Month and primary Monday-Friday Week UI.
- Build daily and day+ticker groups from one exact server query/accumulator;
  realized P/L is attributed to closing date in the Journal account timezone.
- Return exact value/display DTOs. Remove client-side financial authority and
  numeric filtering over P/L/win rate.
- Preserve date, symbol, direction, profitability, trade-count and P/L filters
  only where the replacement query contract can enforce them server-side.
- Treat named premarket/regular/after-hours filters as unavailable until an
  exchange/session fact exists; do not assume all Stock activity uses one U.S.
  session.
- Show closed, open, pending-decision and unavailable coverage without letting
  either contained decision hide the 331 ready trades.

### Trades by Ticker

- Publish a bounded Journal/Analytics ticker read model using stable instrument
  identity, symbol, trading days, round trips, direction counts, exact gross or
  covered net P/L, win rate and coverage.
- Opening a ticker reuses one stable detail contract for full history or a
  selected trading date.
- Multi-currency money remains partitioned; counts may be clearly combined.

### Open Positions

- Publish only trader-supported `legitimate_open` projections as open
  positions, with exact remaining quantity, average cost when covered, opened
  instant, account timezone, age-as-of and coverage.
- Show pending chains separately with a Data Decisions action. Do not display a
  decision chain as an open position merely because it does not reach zero.
- At the accepted entry state, zero legitimate-open and two needs-decision is a
  valid result, not "no verified analytics."

### Trade Tracker read path

- Replace V3 auth, Analytics Lab runtime and legacy tag/rule/day-session readers
  with a Journal-owned trading-day query plus Journal Analytics values.
- A dated route represents exactly one account trading date. It includes
  executions occurring that day, closed round trips attributed to that day,
  carried-in/out positions, coverage and previous/next available trading dates.
- The undated route resolves the most useful latest Journal trading date while
  still exposing manual entry for the intended date. It must not assume that
  submission day is execution day.
- Preserve the approved factual Day Session presentation. Rules, tags and notes
  may render an honest unavailable state until Slice D; they do not call legacy
  stores.
- Design-preview fixture math stays isolated from normal runtime and cannot be
  used as factual data.

### Slice A exit gate

- No V3/legacy import in the active Calendar/Ticker/Open/Trade Tracker read
  paths.
- Targeted lint, dependency-scoped TypeScript, focused exact-service/UI-adapter
  tests with one worker, static dependency verification and read-only private
  database reconciliation pass.
- Database hash/size and zero non-empty WAL remain unchanged.
- The accepted dashboard layout is not redesigned. Start port 3010 only after
  the integrated read slice is ready for owner visual review.

## 7. Slice B - imports and Data Decisions cutover

Slice B connects the already accepted Journal import/decision foundation to
the product. It is a write slice and requires an online backup, byte-identical
restore verification and recovery instructions immediately before the first
real mutation.

### Import workflow

- Support historical IBKR statement upload for any period and arbitrary upload
  order through record-preserving preview and explicit account confirmation.
- Keep raw account identity server-only. Use confirmed versioned source-account
  fingerprints and the existing canonical account boundary.
- Commit through `JournalIntegrityCommandService.commitIbkrStatement()` so
  evidence, executions, decisions and full-account rebuild occur atomically.
- Preserve idempotent reupload and overlap detection. A later/earlier statement
  may close an existing chain without creating a second ledger.
- Publish privacy-safe import history, batch status, row/issue counts, coverage
  and decision links from Journal repositories.
- Replace the `/imports` browser contract and required compatibility endpoints;
  do not keep a hidden legacy writer.

### Data Decisions read model

- Add a bounded server query for pending and resolved decisions across the
  allowed account selection, including issue/effect, target kind, revision,
  allowed actions, privacy-safe evidence summary and rebuild/result link.
- Deep-link to exact source rows/executions/affected chain and back to the
  resulting trade/analytics view without exposing raw private identifiers in
  logs or URLs unnecessarily.
- The two accepted contained chain decisions must appear. Unrelated ready
  trades remain visible throughout.

### Data Decisions actions

Every UI action maps to one typed `JournalDataDecisionService.resolve()`
action and an expected revision. Generic labels do not authorize generic data
mutation.

- "Save correction" selects a target-specific correction action and shows a
  before/after preview.
- "Keep as imported" is available only when the service permits an
  evidence-supported keep-distinct or source-limitation decision.
- "Exclude" creates an append-only trader exclusion for the affected execution
  or supported source target; it never deletes the original row.
- "Reset" creates a superseding correction/decision event when a source-backed
  reversal is valid; it never erases history.
- Add-missing-execution, same-time order, duplicate, opening inventory,
  coverage and legitimate-open actions appear only for compatible targets.

The legacy "Delete statement" operation remains disabled until an explicit
append-only import withdrawal/supersession service is designed. Physical
deletion and silent execution removal are prohibited. A future withdrawal must
preview affected executions/round trips, preserve source/audit evidence,
require confirmation, rebuild deterministically and be reversible through
history.

### Slice B exit gate

- Fresh backup/restore evidence exists before real writes.
- Focused synthetic tests prove authorization, revision conflict, each exposed
  action, rollback and no unrelated-trade suppression.
- Disposable import/reimport/out-of-order import and decision resolution pass.
- Private-statement verification proves source/execution/decision/rebuild
  reconciliation without printing statement names, account identifiers or
  financial values.
- Browser review proves `/imports` and `/data-decisions` present the accepted
  workflow and accurate coverage.

## 8. Slice C - canonical manual execution entry

- Trade Tracker is the canonical manual-execution experience. `/manual-entry`
  becomes a compatibility redirect or clear handoff to Trade Tracker; it does
  not maintain a second form, store or execution type.
- The server accepts one bounded batch whose entries carry their actual local
  execution date/time, timezone, exact symbol/side/quantity/price and optional
  fee facts. It uses an idempotency key and
  `JournalIntegrityCommandService.commitManualExecutions()`.
- Manual entries share the broker ledger, overlap detection, decisions and
  full-account rebuild. Provenance remains `manual`; it is not lower-quality by
  definition.
- The backend may accept entries from multiple dates in one submission. Its
  response groups results/coverage by actual trading date so a future UI can
  present Monday, Tuesday and Wednesday separately.
- The initial visible form remains date-specific unless/until the owner reviews
  a multi-day presentation. No daily note or review is ever shared across
  combined dates.
- Same-time ordering and point-only manual-day coverage remain explicit Data
  Decisions. The UI never claims that a manual batch proves the full day's
  account activity.
- Candle review is not triggered implicitly until the Level Analysis contract
  is migrated and exact provider coverage is available.

Slice C uses the Slice B backup/recovery discipline and must prove idempotency,
duplicate/overlap handling, multi-date grouping, timezone conversion, atomic
rebuild, decision creation and unchanged unrelated chains.

## 9. Slice D - rules, tags, notes and reviews

Slice D adds a new immutable migration after a fresh online backup and restore
rehearsal. The exact schema proposal is reviewed in the tracker before the
migration file is created.

The migration owns versioned, workspace/account-scoped Journal tables for:

- user rule definitions and immutable rule versions;
- active/paused/retired lifecycle events;
- day and round-trip rule reviews pinned to the reviewed rule version;
- tag definitions and immutable/audited rename/delete history;
- tag assignments to stable current round-trip identity (and later supported
  open-position identity);
- revisioned daily notes by `journal_trading_days` identity; and
- revisioned individual-trade notes.

Required constraints include stable UUIDs, server-derived scope, canonical UTC
timestamps, optimistic revisions, bounded names/text, a maximum ten tags per
trade, unique active names per scope, valid review statuses, stable target
foreign keys and no cascade that can erase authored history.

Rules are trader-authored facts. Evaluation may later compare an execution to
an objective versioned rule, but it cannot mark followed/broken when required
facts are absent and cannot infer intent. Day and trade reviews remain separate.

### Legacy annotation migration

- Reverify the legacy tag/rule/day-session sources read-only.
- Back up and restore-verify every source before migration.
- Map tag assignments through accepted stable round-trip aliases. Refuse the
  real migration if any assignment is silently lost or ambiguously mapped.
- Preserve definitions even when an assignment cannot yet map; report the
  exact unresolved count without adopting a guessed target.
- Reconcile source/target counts and normalized content digests. Do not seed
  duplicate preset tags when a user tag already exists.
- The Phase 1 snapshot of 21 definitions/four assignments/zero notes/zero rules
  is evidence only and must be refreshed at execution time.

The existing Rules and Trade Tracker visual designs are preserved unless a
visible change is separately shown to and approved by the owner.

## 10. Slice E - Analytics Lab, candles and Level Analysis

- Replace the disconnected V3/sample Analytics Lab runtime with the accepted
  Journal Analytics registry/query service. Every selectable metric/filter/
  grouping is allowlisted and carries exact coverage.
- Saved Analytics Lab views use a replacement module-owned persistence contract
  with revisions and owner scope; no repository-local V3 JSON/SQLite store.
- Unsupported combinations explain their missing fact instead of producing
  sample data or zero.
- Candle Review and trade-candle analysis consume versioned Level Analysis/
  market-data facts linked to stable Journal round trips. Provider timestamps,
  timezone, interval, adjustments and coverage are preserved.
- No external provider receives broker statements, account identifiers, notes
  or unrelated execution data. Symbol/time requests follow the accepted privacy
  boundary and provider failures do not change Journal facts.
- Any coaching or pattern language is labeled assistance and never becomes a
  factual trade classification without the trader.

## 11. Slice F - remaining module transfer

After the Journal dashboard is coherent, transfer the rest of the complete
inventory in bounded module-owned slices:

1. Academy routes, APIs and production progress with slug-baseline/alias proof;
2. Watchlist routes, stream, ingestion, archives, recap and storage ownership;
3. News/content routes, ingestion/access, Week Ahead and preserved Big Time
   automation without treating it as a Journal core dependency;
4. Coach/Review/Reflection routes using published Journal/Analytics facts;
5. Account/Affiliate/profile/preferences and module access;
6. Platform readiness, Charts/market tools, scanner access and peer site routes;
7. Discord-first public authentication linked to the stable Platform user,
   optional email/password only if still wanted, and account UI before go-live;
8. all required compatibility handlers and redirects; and
9. all 52 `/intelligence` routes, each mapped to a replacement, compatibility
   route, explicit deferral or owner rejection.

Each module slice must inventory its current database/environment/process,
remove cross-module fallback storage, preserve existing data, implement its
module contract, reconcile routes/API behavior and obtain visual approval for
visible work. Nothing is bulk-copied merely because it is recent.

## 12. Database and migration discipline

- Phase 5 read-only slices use `openReadonlyPlatformDatabase()`.
- Before the first write in each database-affecting slice: stop conflicting
  processes if needed, prove zero non-empty WAL, create an online backup, hash
  it, restore it to a disposable target, run integrity/schema/count checks and
  record recovery instructions.
- Applied migration files/checksums are immutable. New migrations receive the
  next global execution order and deterministic post-schema digest.
- Every real write is previewed on a disposable restored database first.
- After a write, verify migration history, schema digest, `foreign_key_check`,
  `quick_check`, domain counts, reconciliation digests and privacy-safe facts.
- Rollback means restore the verified pre-slice backup and accepted Git commit;
  it never means editing an applied migration or switching back to a shared V3
  writer.

## 13. Verification cadence and resource policy

For each slice:

1. static dependency and file-contract check;
2. targeted lint for changed files;
3. dependency-scoped TypeScript;
4. smallest focused Vitest set with one worker/no file parallelism;
5. disposable database/API proof when the slice writes;
6. privacy-safe real-data reconciliation;
7. integrated browser review only at a coherent visual checkpoint; and
8. database hash/WAL/process/Git boundary verification.

If Windows returns pre-application `uv_os_get_passwd` `ENOMEM`, use only the
already accepted command-local fallback for the affected child command, remove
it immediately afterward and do not change global Windows settings. Processes
may be stopped to free resources, but only after their ownership is identified.

Full regression, CI-equivalent checks, production build, browser/E2E sweep,
backup restore rehearsal for the final state and deployment rehearsal occur in
Phase 6. Deferral changes timing, not the acceptance requirement.

## 14. Git, process and review checkpoints

- Work remains on `codex/traderlink-platform-replacement` in the existing
  replacement checkout. Do not create another clone/worktree/branch.
- Commit coherent verified slices locally after an exact allowlist audit. Do
  not push, open a PR, deploy or change upstream without explicit later scope.
- Keep the legacy repository and databases unchanged as recovery evidence.
- Start the replacement server only for a planned browser/visual checkpoint,
  state the path/branch/port, and stop it afterward when the owner no longer
  needs it.
- Preserve the approved dashboard design. Any redesign or new unresolved
  multi-day Trade Tracker presentation requires iterative owner visual review.

## 15. Stop conditions

Stop the affected slice, preserve all evidence and diagnose before continuing
if:

- HEAD/branch/status changes unexpectedly;
- another process or task writes overlapping files;
- a protected database hash/count/schema changes outside the authorized step;
- a non-empty WAL cannot be safely checkpointed;
- a legacy annotation/import record cannot be mapped without guessing;
- a query would hide valid unrelated data or include a pending chain in an
  unsupported metric;
- authorization/account scope cannot be derived server-side;
- a migration checksum/schema digest differs; or
- private data would enter source control, logs, fixtures or an unauthorized
  external service.

## 16. Phase 5 exit condition

Phase 5 is complete only when:

1. every item in the controlling product/route/database/operations inventories
   has an implemented, compatibility, deferred or owner-rejected disposition;
2. every Platform-target dashboard route and required compatibility endpoint
   uses its replacement module or an honest approved deferral, with no active
   ordinary V3 authority;
3. historical imports, canonical manual executions, Data Decisions, complete
   chain rebuilds, Journal day/ticker/open/calendar queries, rules/tags/notes/
   reviews and supported Analytics Lab behavior pass their slice gates;
4. Academy, Watchlist, News, Coach/Review, Account/Affiliate, Level Analysis and
   Platform peer services have explicit accepted ownership and preservation;
5. real private facts and legacy annotations reconcile without silent loss;
6. the approved light Material dashboard passes owner visual review for every
   visible completed slice;
7. the replacement can enter Phase 6 acceptance without depending on the
   legacy app for an accepted active capability; and
8. no push, production deployment or legacy retirement is inferred from local
   completion.

Phase 6, not Phase 5, performs the final whole-product regression/build/E2E,
deployment rehearsal and complete replacement acceptance. Phase 7 alone may
retire legacy assets, and only with explicit owner approval.
