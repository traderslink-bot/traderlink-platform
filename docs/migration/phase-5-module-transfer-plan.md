# Phase 5 Module Transfer Plan

**Status:** Slices A-E and local multi-account integration are technically complete; Slice F remaining-module transfer is active and port 3010 remains off
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
| Platform identity/account | Stable user/workspace/membership IDs; multiple separately managed Journal accounts per user/workspace; dashboard account creation, selection and switching; login-free loopback-only local review; replacement account UI; Discord-first public login and optional email/password before go-live |
| Journal imports | Broker-neutral historical-statement intake; verified adapter registry; automatic and user-reviewed reusable mappings; unsupported-format preservation; account confirmation, commit, history, idempotency, source evidence, arbitrary upload order and compatibility endpoints |
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

The legacy tag/Day Session store contained only owner test data. Per the owner
decision on 2026-08-02, its tag definitions, assignments, old trade
annotations and rule records are not migration inputs. The verified backups
remain preserved evidence, but Slice D starts the replacement annotation
tables empty and proves all new writes against exact Journal account/day/trade
identities.

## 5. Cross-cutting rules

1. No new ordinary dashboard code imports V3 analytics, V3 authentication,
   V3 deployment, V3 replay/proof/authority, or the legacy trader-analytics
   repository.
2. Server Components call module services directly. Browser mutations use a
   narrow authenticated Server Action or Route Handler only when HTTP is
   genuinely required.
3. Every private operation derives `WorkspaceAccessScope` and account access on
   the server. Client IDs never establish ownership.
   A user may manage multiple separate Journal accounts from one TraderLink
   login and decides what each account represents, such as long-term holdings,
   forex or small-cap day trading. A Journal account is not one broker account:
   it may contain statements and source identities from multiple brokers or
   brokerage accounts. The selected Journal account scopes imports, learned
   statement mappings, executions, Data Decisions, annotations and analytics;
   no dashboard aggregation may silently mix those accounts.
   Browser state uses an opaque server-derived account-selection reference,
   never an internal account UUID or broker identifier. The server resolves it
   only against the authenticated/locally authorized account list. Mutations
   carry the selection reference they were reviewed under; a stale tab fails
   with a conflict instead of writing into a newly selected account.
4. Exact financial values remain canonical decimal strings or integer/rational
   facts. Browser `number`, `Math`, `toFixed` and `Intl` output are display-only
   and never feed calculations, filtering or persisted decisions.
   All displayed trading-data decimals use at most two places; editable source
   and manual-entry values remain lossless.
5. No missing fact becomes zero, closed, a swing trade, a rule violation, a
   setup, or trader intent.
6. Statement upload order and manual submission order are not execution order.
   Every accepted change rebuilds the full affected chronological account/
   instrument/currency chain.
7. A Trade Tracker trading date is a review boundary, not a trade boundary. A
   position may carry across any number of trading dates while retaining one
   execution lifecycle. A future swing-trade view may present that same
   lifecycle differently, but it must not create a second tracker, ledger or
   copy of the executions. Day-trade/swing intent is optional trader-authored
   metadata and is never inferred merely from elapsed time.
8. One module owns its tables, migrations, repositories and mutations. Other
   modules consume published contracts.
9. No silent dual-write, V3 fallback, repository SQLite, sample trading data,
   private-data logging or unbounded client response is allowed.
10. Port 3010 stays off during implementation and focused checks. It is started
   only for an integrated visual-review checkpoint and stopped afterward.
11. Focused tests use one Vitest worker and no file parallelism. Broad lint,
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

### Open Positions (`/trades/open`)

- Preserve every trader-supported `legitimate_open` projection with exact
  remaining quantity, average cost when covered, opened instant, account
  timezone, age-as-of and coverage. A confirmed open position stays visible
  even when its trading plan has not yet been classified.
- Publish intentional swing, unplanned hold and other status from
  trader-authored lifecycle metadata. Never infer intent or status from age or
  an overnight timestamp. Until persistence is connected, show the position as
  not classified rather than guessing.
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
- The undated route opens the current account trading date/current trading week
  and shows the complete manual-entry form at the top. It does not fall back to
  the most recent historical trade date or assume submission day is execution
  day.
- Historical dated routes remain factual read-only history. Subjective tags,
  notes, and rule reviews are intended for the current week, not prompts to
  reconstruct memories about old trades.
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

- Provide one broker-neutral historical-statement upload workflow. Interactive
  Brokers is the first real-statement-verified adapter, not the product
  boundary. Moomoo and the useful prior broker presets are adapter candidates
  and may not be labeled supported until format-specific fixtures and, where
  available, privacy-safe real-statement verification pass.
- Attempt format detection first and allow the trader to supply or correct a
  broker name. Every successful mapping preview shows source columns/sections,
  canonical destinations, timestamp timezone, side/value interpretation,
  confidence, row outcomes and blocking versus Data Decisions issues before
  any execution is written.
- Port the useful prior generic column-review, timezone-override, side-value
  mapping and reusable-template behavior into Journal-owned contracts. Do not
  reuse its V3 authorization, trader-analytics repository or legacy writer.
  Saved mappings are workspace/account scoped, versioned and matched by a
  normalized structural signature; they never live only in browser storage.
- A trader-confirmed mapping becomes reusable only after the mapped statement
  is accepted. The complete confirmed contract is stored with that immutable
  import batch. A later upload may automatically reuse only the latest
  accepted contract for the same workspace, same Journal account and exact
  ordered structural signature. Any changed or ambiguous structure returns to
  mapping review/Data Decisions and never silently guesses a financial fact.
- Keep the privacy-safe mapping-support package downloadable after successful
  automatic or manual mapping as well as after failure. A successful mapping
  remains useful as a broker-format fixture for building and verifying a
  dedicated adapter without exporting raw rows or values.
- When no adapter or confirmed mapping can safely parse a statement, offer a
  `format_needs_support` result and a downloadable mapping-support package.
  The package contains the trader-supplied broker name, delimiter,
  section/table/header signatures, privacy-safe value-shape summaries,
  encoding/parser result and failure codes. It excludes raw rows, raw values,
  the original filename and every local path, and creates zero execution facts.
  The user keeps that JSON file locally so Codex/development can add the broker
  adapter. The original private statement remains on the user's computer and
  is used separately only when the user explicitly allows local inspection.
- A later optional evidence-preservation workflow may keep failed original
  bytes in protected user-owned storage after explicit confirmation, but it is
  not required for the first support-package workflow and must not send private
  statements to an external service automatically.
- A later adapter/template can replay the preserved evidence through a
  versioned append-only mapping event. It must not be blocked as an ordinary
  duplicate, silently reinterpret earlier facts or require re-upload when the
  evidence is still available. External sharing remains an explicit future
  user-consent action.
- Support historical IBKR statement upload for any period and arbitrary upload
  order through record-preserving preview and explicit account confirmation as
  the first verified adapter.
- Keep raw account identity server-only. Use confirmed versioned source-account
  fingerprints and the existing canonical account boundary. Multiple broker
  source identities may link to one user-defined Journal account; one source
  identity may not silently link to multiple Journal accounts.
- The selected Journal account controls the operation. A known source identity
  or exact reimport that belongs to another allowed account returns an explicit
  account-selection conflict and offers a switch; it never silently changes
  the active account.
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
- The broker-neutral adapter/template/unsupported-format contract has focused
  tests proving that an unknown format is preserved without creating
  executions and can later be replayed through an accepted mapping.
- Focused multi-account proof shows that an accepted template in account A is
  unavailable in account B and that stale/changed structure cannot auto-map.
- A known statement linked to another account fails with an account-switch
  conflict. A previously unseen broker account can be linked to the selected
  Journal account only through explicit named-account confirmation, and a
  conflicting existing link still fails closed. This source link does not make
  the Journal account broker-specific; additional broker sources may be linked
  to the same selected account.

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
- Each entry can carry an optional trader-authored `not_set`, `day_trade`, or
  `swing` intent. Conflicting intent within one rebuilt lifecycle is a Data
  Decision; duration never resolves it automatically. Confirmed intent and a
  later trader-authored `unplanned_hold` or other open-position status attach
  to the same lifecycle and executions shown on Open Positions.
- The backend may accept entries from multiple dates in one submission. Its
  response groups results/coverage by actual trading date so a future UI can
  present Monday, Tuesday and Wednesday separately.
- The initial visible form is anchored to the current account trading week and
  lets the trader choose the actual trading date. No daily note or review is
  ever shared across dates.
- An execution entered on one day may belong to a lifecycle that remains open
  across later trading dates. Trade Tracker shows the execution on its factual
  date and the carried position on later dates; closing it later completes the
  same lifecycle. A future swing-focused view remains a projection over this
  shared ledger.
- Same-time ordering and point-only manual-day coverage remain explicit Data
  Decisions. The UI never claims that a manual batch proves the full day's
  account activity.
- Candle review is not triggered implicitly until the Level Analysis contract
  is migrated and exact provider coverage is available.

Slice C uses the Slice B backup/recovery discipline and must prove idempotency,
duplicate/overlap handling, multi-date grouping, timezone conversion, atomic
rebuild, decision creation and unchanged unrelated chains.

## 8A. Local Platform account and future login boundary

- Recover `/account` into the approved dashboard shell and read the existing
  stable Platform user, workspace/membership and allowed Journal accounts.
  Raw authentication subjects and internal identifiers do not enter the page.
- One user/workspace may create multiple separately managed Journal trading
  accounts. The dashboard exposes the active privacy-safe account label and an
  explicit switcher on every page. Create, rename, non-destructive archive and
  reactivate remain owner/admin-authorized operations; physical account delete
  is prohibited. Base currency/timezone changes after facts exist require a
  separate guarded correction contract.
- Local selection is stored in an HttpOnly, `SameSite=Strict`, path-wide cookie
  containing only an opaque selection reference. Missing selection falls back
  deterministically to an allowed active account; forged, archived,
  cross-workspace and stale selections fail closed. The same resolver later
  sits behind Discord sessions without changing Journal ownership IDs.
- Local review continues through the loopback-only development-owner boundary;
  the owner does not need to log in to Discord on this computer. The local
  launcher loads the external replacement database, protected authority,
  evidence vault and upload-staging configuration without copying secrets into
  the repository.
- The existing Academy/legacy Discord code is reference material, not the
  replacement Platform session contract. Before public launch, add a
  production-only Discord authentication adapter that links the authenticated
  Discord identity to the already stable Platform user/workspace ownership.
  It must not duplicate or rewrite Journal facts. Email/password remains
  optional and is not required for this checkpoint.
- Account/profile preferences and access changes remain server-authorized and
  revisioned. Phase 5 implements bounded account create/select management and
  stale-write protection; further profile and entitlement mutations remain
  deferred.

## 9. Slice D - rules, tags, notes and reviews

The accepted exact schema and proof contract is recorded in
[Phase 5 Slice D Journal Annotation Schema](phase-5-slice-d-annotation-schema.md).

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

### Legacy annotation test-data disposition

- Preserve the already verified legacy tag/rule/day-session backups as recovery
  evidence only.
- Do not copy, seed, reconcile or attach any legacy tag definition, assignment,
  rule, note or old test trade annotation into the replacement database.
- Start the replacement annotation tables empty for each user-defined Journal
  account.
- Prove new tag assignments target one exact stable round trip; new daily notes
  target one exact trading day; and new rule reviews pin one exact rule version
  and day/round-trip target.
- Prove every write uses the trader-selected Journal account even when that
  account contains sources from multiple brokers or brokerage accounts.
  is evidence only and must be refreshed at execution time.
- A Journal account remains the trader's own grouping, never a broker-derived
  bucket. Rules, tags, notes and reviews use the selected Journal account even
  when its executions came from several brokers or brokerage accounts.

The existing Rules and Trade Tracker visual designs are preserved unless a
visible change is separately shown to and approved by the owner.

## 10. Slice E - Analytics Lab, candles and Level Analysis

The exact sub-slice contract and audit are recorded in
[Phase 5 Slice E Analytics Lab, Candle Review and Level Analysis Plan](phase-5-slice-e-analytics-lab-candles-level-analysis-plan.md).

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

The exact current inventory, sub-slice order and F1 contract are recorded in
[Phase 5 Slice F Remaining Modules Plan](phase-5-slice-f-remaining-modules-plan.md).
Its active Academy boundary is the
[Slice F2 Academy Identity And Progress Plan](phase-5-slice-f2-academy-identity-and-progress-plan.md).

After the Journal dashboard is coherent, transfer the rest of the complete
inventory in bounded module-owned slices:

1. Academy routes, APIs and production progress with slug-baseline/alias proof;
2. Watchlist routes, stream, ingestion, archives, recap and storage ownership;
3. News/content routes, ingestion/access, Week Ahead and preserved Big Time
   automation without treating it as a Journal core dependency;
4. Coach/Review/Reflection routes using published Journal/Analytics facts;
5. remaining Account/Affiliate preferences, mutations and module access after
   the local account-read boundary in Section 8A;
6. Platform readiness, Charts/market tools, scanner access and peer site routes;
7. production activation of Discord-first public authentication linked to the stable Platform user,
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
5. real private execution facts reconcile without silent loss, while explicitly
   excluded legacy annotation test data remains absent;
6. the approved light Material dashboard passes owner visual review for every
   visible completed slice;
7. the replacement can enter Phase 6 acceptance without depending on the
   legacy app for an accepted active capability; and
8. no push, production deployment or legacy retirement is inferred from local
   completion.

Phase 6, not Phase 5, performs the final whole-product regression/build/E2E,
deployment rehearsal and complete replacement acceptance. Phase 7 alone may
retire legacy assets, and only with explicit owner approval.
