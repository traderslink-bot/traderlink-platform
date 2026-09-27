# TraderLink Platform Replacement Plan

**Status:** Approved controlling plan. Phases 0-6 are locally accepted; the Phase 4 replacement route cutover passed technical/runtime verification and owner visual approval on 2026-08-02, Phase 5 completed the module transfer, and Phase 6 passed sequential regression, production build, packaged-runtime, two-account browser/API/privacy and final backup/restore gates. F6 Discord-first identity, single-node hosted packaging and authorized hosted-transfer tooling are ready locally. The accepted source lineage was published on 2026-08-03 to `https://github.com/traderslink-bot/traderlink-platform`, with published `main` at `c0c998d8e456b9e70433e73123e8024b13ece203`. The public Vercel project now serves the verified landing page and preserved Academy from the narrow production release `2d7bdd2370b0781c8157ed11f54337c20a4e68cd` (`dpl_4MGMs3jqaYbQ7Wx3FQKdaHRxt6vW`). That is not the hosted replacement dashboard: actual owner linking, production-source transfer, Docker execution, Railway persistent-volume deployment and full application/DNS cutover remain external pre-go-live gates. Slice D annotation tables, Slice E saved-view/market-fact/review/delivery/link tables, F2 Academy progress, F3 Watchlist and F4 Affiliate tables began empty and contain no copied legacy test data. F4 preserved the one reconciled legacy News article under versioned News ownership. F5 replaces fixture-driven readiness and maps all 52 preserved legacy pages away from V3 runtime entry. The accepted real data boundary remains 331 analytics-ready closed round trips with two fact-dependent chains contained in Data Decisions. Legacy trades, tags, rules and notes were test data and are not transferred; their replacement account-scoped feature contracts are verified. Phase 7 deletion/retirement remains prohibited without explicit owner approval.

**Active Slice E contract:** [Analytics Lab, Candle Review and Level Analysis Plan](phase-5-slice-e-analytics-lab-candles-level-analysis-plan.md)

**Completed Slice F5 contract:** [Platform Peers And Legacy Route Disposition Plan](phase-5-slice-f5-platform-peers-and-legacy-route-disposition-plan.md)

**Active Slice F6 contract:** [Public Identity And Hosted Transfer Plan](phase-5-slice-f6-public-identity-and-hosted-transfer-plan.md) and [Hosted Beta Runbook](traderlink-platform-hosted-beta-runbook.md)

**Approved PWA contract:** [TraderLink Platform PWA Plan](traderlink-platform-pwa-plan.md) with its [implementation progress tracker](traderlink-platform-pwa-progress.md). The installed app preserves the complete dashboard, adds offline Daily/Swing/Quick Trade Entry through the canonical Journal preview/commit path, bounded last-synced dashboard projections, best-effort background sync with foreground fallbacks, opt-in privacy-safe Web Push and the owner-approved exact app-icon correction. This local implementation scope does not authorize deployment or production push activation.

**Approved Press Release dashboard contract:** [Press Release Dashboard Plan](press-release-dashboard-plan.md) with its [implementation progress tracker](press-release-dashboard-progress.md). It preserves the existing Discord/public-article flow, adds authenticated channel feeds, exact unread badges, responsive article drawers and channel-specific PWA Push without duplicating or deleting canonical News articles.

**Approved Journal import simplification:** [Journal Import Simplification And Reliability Plan](journal-import-simplification-and-reliability-plan.md) with its [progress tracker](journal-import-simplification-and-reliability-progress.md). It replaces the technical import-review presentation with verified auto-save, an explicit manual-mapping fallback and clear completed outcomes while preserving the last committed import-engine behavior. The consented AI repair worker remains a separately controlled Railway/OpenAI activation boundary.

**Completed Phase 6 contract:** [Replacement Acceptance Plan](phase-6-replacement-acceptance-plan.md), [progress tracker](phase-6-replacement-acceptance-progress.md), and [acceptance report](phase-6-replacement-acceptance-report.md)

**Phase 7 preservation boundary:** [Legacy Retirement Progress](phase-7-legacy-retirement-progress.md)

**Approved Journal Administration:** [Journal Administration Dashboard Plan](journal-admin-dashboard-plan.md) with its active [implementation progress tracker](journal-admin-dashboard-progress.md). The implementation-contract QA pass and owner approval are complete. The plan reserves `/admin/journal`, keeps the separate computer-run Watchlist admin and preserved V3/operations admin surfaces out of scope, and permits only the owner's exact Discord-linked Platform user with configured-server ownership refreshed within five minutes plus the singleton active server-side owner-admin grant. Email/password admin login is deferred. Migrations 0019/0020 and technical Admin 1-6 are assembled in the active unstaged package: fail-closed authority/request security, import instrumentation/recovery, privacy-safe format learning, bounded operational read models, 14 private route handlers, audited lifecycle/merge/package/source actions and the complete light Material admin UI. The focused administration gate passes 15 files/31 tests, the 83-file static inventory/privacy verifier, full whole-project TypeScript, full lint with zero errors, the 126-page production build, all 21 migration-file checks and the expanded 156-file V3-free replacement guard. Live browser acceptance passes across Overview and all six Admin subsections, including clean console/overlay and sidebar-navigation checks; the production grant and real support-source root remain absent, owner visual/product review remains open, the supported-format registry intentionally remains empty until exact adapter/fixture evidence is deployed, and automatic orphan deletion remains report-only pending separate destructive-cleanup authorization.

**Approved tracker split:** [Day Trade Tracker And Swing Trade Tracker Plan](day-and-swing-trade-tracker-plan.md). Day and swing workflows are separate product surfaces over one canonical Journal execution ledger. Migrations 0019-0021, manual multi-date preview/confirmation/save, shared style/Swing-note services, complete Day/Swing/Open Positions UI integration and manual/broker reconciliation are implemented. Same, separate, grouped-fill, repeat-evidence and explicit correct-manual-entry focused proofs pass; affected dates and stable Swing position references are returned after save. The integrated tracker/service/route gate passes five files/75 tests, shell/navigation enforcement, full TypeScript/lint/build and the 156-file active replacement guard. Live browser acceptance passes for Day Tracker, Swing Tracker and Open Positions; only integrated owner visual/product review remains.

**2026-08-03 independent readiness QA:** A fresh full-route browser sweep found
and corrected one Account status-chip hydration mismatch, then passed Account,
the dashboard review inventory and all seven Journal Administration pages with
zero browser page errors or framework overlays. Deterministic UTC display now
covers Admin and saved Swing-note timestamps. Read-only database integrity,
all 21 migrations, the Admin and active-replacement static guards, full
TypeScript, zero-error full lint and the 126-page production build pass. Owner
visual/product review remains the next product checkpoint; production Discord,
owner grant, hosted transfer and full application cutover remain separate.

**Second readiness QA:** A new clean session rechecked Account and 13 high-risk
dashboard/Admin routes, their rendered content, financial precision, overlays,
page-error record and non-destructive Import/Data Decisions/Admin navigation.
All checks passed, no displayed numeric value exceeded two decimal places and
the post-browser database again passed all 21 migrations and integrity checks.
No statement, trade, decision, preview or commit was saved. Port 3010 is active
temporarily for the owner's integrated review.

**Active Slice F contract:** [Remaining Modules Plan](phase-5-slice-f-remaining-modules-plan.md)

**Completed Slice F3 contract:** [Watchlist Storage And Access Plan](phase-5-slice-f3-watchlist-storage-and-access-plan.md)
**Completed Slice F4 contract:** [News Content And Affiliate Ownership Plan](phase-5-slice-f4-news-content-and-affiliate-plan.md)

**Completed Slice F2 contract:** [Academy Identity And Progress Plan](phase-5-slice-f2-academy-identity-and-progress-plan.md)

**Slice D source-account preparation:** Completed through the accepted
development-only preparation boundary. The privacy-safe preview, sole-account
source link, scoped preview, vault promotion, atomic import, exact reimport, and
independent verification passed. The source identity remains Journal source
ownership, not login; the development-local owner remains authoritative and
Discord/email remain deferred.

**Phase 2 foundation preservation:** Local commit `fea56307fbd0142ef99b9f13c020451a6a503cc7` (`feat(platform): establish verified database foundation`); not pushed or deployed.

**Phase 3 Journal integrity implementation:** Local commit
`8f6a4d4e4dec20ef6edcd50f476b14d368bde505`; technically accepted, not pushed
or deployed. See [Phase 3 Handoff](phase-3-journal-integrity-handoff.md).

**Owner:** Project owner and Codex

**Prepared:** 2026-07-31

**Supersedes for future platform work:** the V3 implementation roadmap in `plan.md`. That document remains historical reference only.

**Related documents:** [TraderLink Platform PWA Plan](traderlink-platform-pwa-plan.md), [TraderLink Platform PWA Progress](traderlink-platform-pwa-progress.md), [Import Integrity and Data Decisions Contract](import-integrity-and-data-decisions-contract.md), [Journal Review Workflow Corrections Plan](journal-review-workflow-corrections-plan.md), [Journal Review Workflow Corrections Progress](journal-review-workflow-corrections-progress.md), [Journal Corporate Actions and Share Adjustments Plan](journal-corporate-actions-plan.md), [Journal Corporate Actions and Share Adjustments Progress](journal-corporate-actions-progress.md), [Trade Explorer Plan](trade-explorer-platform-plan.md), [Trade Explorer Progress](trade-explorer-platform-progress.md), [Currency Preference And Reporting Plan](currency-preference-and-reporting-plan.md), [Currency Preference And Reporting Progress](currency-preference-and-reporting-progress.md), [Product Inventory](product-inventory.md), [Route Ownership](route-ownership.md), [Database Ownership](database-ownership.md), [Replacement Database Schema and Migrations](replacement-database-schema-and-migrations.md), [Phase 3 Journal Integrity Plan](phase-3-journal-integrity-plan.md), [Phase 3 Journal Integrity Progress](phase-3-journal-integrity-progress.md), [Phase 3 Handoff](phase-3-journal-integrity-handoff.md), [Phase 4 Core Analytics Plan](phase-4-core-analytics-plan.md), [Phase 4 Core Analytics Progress](phase-4-core-analytics-progress.md), [Phase 4 Handoff](phase-4-core-analytics-handoff.md), [Phase 5 Module Transfer Plan](phase-5-module-transfer-plan.md), [Phase 5 Module Transfer Progress](phase-5-module-transfer-progress.md), [V3 Dependency Map](v3-dependency-map.md), [Module Contracts](module-contracts.md), [Analytics Capability Catalog](analytics-capability-catalog.md), [Operational and Configuration Inventory](operational-and-configuration-inventory.md), [Workspace Inventory](workspace-inventory.md), [Source Snapshot](source-snapshot-and-untracked-manifest.md), [Workspace and Worktree Cleanup Plan](workspace-and-worktree-cleanup-plan.md), [Risk Register](risk-register.md), [Acceptance Inventory](acceptance-inventory.md), [Phase 1 Progress](phase-1-inventory-and-baseline-progress.md), [Phase 2 Progress](phase-2-replacement-baseline-progress.md), [Development Owner Seed Progress](development-owner-seed-progress.md), [Phase Handoff Template](phase-handoff-template.md), [Phase 0 Handoff](phase-0-planning-handoff.md), [Phase 1 Handoff](phase-1-inventory-and-baseline-handoff.md), [Migration Register](migration-register.md), and [Migration Progress](migration-progress.md).

## 1. Mandate

TraderLink will become a modular trading, education, and market-tools platform. The Journal is an important module, not the application architecture.

The replacement exists because Trader Intelligence V3 made ordinary dashboards dependent on strict authority, replay, and proof paths. Those paths could withhold all dashboard data when one record or dependency was unresolved. The replacement must make valid data visible while keeping incorrect or incomplete data out of the metrics it cannot support.

> Trustworthy dashboards, clear Data Decisions, and no situation where one unresolved trade makes unrelated valid data vanish.

## 2. Product and architecture direction

TraderLink is a single Next.js modular monolith with one shared platform identity and a shared platform shell. It is not a microservice system, dynamic plugin marketplace, or a set of separately deployed applications.

The permanent module boundaries are:

- **Platform:** authentication, users, preferences, navigation, shared UI, access, notifications, activity, and workspace composition.
- **Journal:** source statement rows, imports, executions, accounts, round trips, manual entry, Data Decisions, notes, tags, setups, rules, calendar, reviews, and candle associations.
- **Journal Analytics:** reusable, practical calculations over eligible Journal records and rebuildable summaries.
- **Academy:** content, paths, enrollment, progress, quizzes, and its workspace summary.
- **Watchlist, News, Coach, Account, and future tools:** peer modules with explicit ownership and public module contracts.

`/workspace` is the composed platform home. Each module owns its summary; failure of one module must not prevent the rest from rendering.

### Approved dashboard design baseline

The final platform dashboard preserves the owner-approved **light Material UI design**. It is not a dark dashboard. Its identifying structure is the shared left navigation and the approved dashboard destination inventory, including Trades, the Calendar with week/month views, Analytics, Trading Rules, Workspace, separate Day Trade and Swing Trade Trackers over canonical manual entry, broker-neutral imports, Data Decisions, Account, and the other accepted destinations recorded in `product-inventory.md` and `route-ownership.md`. Analytics Lab is retained in the codebase but disabled from the online dashboard until a later owner-approved scope restores it.

A legacy or experimental dashboard that lacks the light Material treatment, the left navigation, Trades, Calendar, Analytics or Trading Rules is not the approved final dashboard. It may be used only as behavior/reference evidence. The owner explicitly deferred Day/Swing Tracker and Journal Administration review until their backend and complete UI are technically integrated; those plans use one final review rather than intermediate visual gates. Other unapproved visible replacements still require owner review before cutover.

### Next.js module boundaries

Server Components read through `WorkspaceAccessScope`-authorized or narrowed `AccountScope` server module services directly; they do not call TraderLink's own HTTP routes merely to reach the same process. UI-only mutations use Server Actions when they fit the interaction. Route Handlers are reserved for file uploads, external/public integrations, webhooks, and client-side requests that genuinely require HTTP. Each module owns its server services and validated data-transfer contracts so screens do not reach directly into another module's tables.

## 3. Data integrity is a product feature

The replacement is not a loose analytics system. It uses a scoped integrity model:

```text
Imported source row or manual entry
  -> accepted execution
  -> derived round trip
  -> trader Data Decision when necessary
  -> metric-specific dashboard eligibility
```

### Roles

- The system preserves source evidence, detects deterministic issues, builds candidate executions and round trips, and records why a record is in a given state.
- The trader makes the final factual decision when a source row or derived round trip needs correction, exclusion, or deliberate classification.
- The analytics engine applies those resolved facts consistently; it never invents a missing fact or silently changes a trader decision.

### Required states

| Object | Required states | Meaning |
| --- | --- | --- |
| Import | preview, blocked, accepted, accepted_with_decisions, superseded | A systemic source problem can block acceptance; a contained record issue does not erase valid records. |
| Source row | mapped_execution, mapped_position_fact, mapped_coverage_fact, automatic_non_execution, unsupported, needs_correction | Every statement row stays immutable and traceable. Trader decisions change derived facts/disposition, never the preserved evidence row. `mapped_coverage_fact` is immutable trader-supplied statement-period evidence created through Data Decisions. |
| Execution | accepted, needs_decision, excluded_by_trader, superseded | An execution cannot be analytically used unless its required facts are resolved. |
| Round trip | ready_closed, legitimate_open, needs_decision, superseded | A questionable execution makes the dependent round trip questionable; it does not invalidate unrelated round trips. Phase 3 exclusion is applied to source evidence/executions and reported explicitly; direct whole-trade exclusion waits for a stable UI/evidence contract. |
| Metric eligibility | included, excluded_with_reason, not_applicable | Eligibility is evaluated per metric, not as a global dashboard switch. |

`legitimate_open` is not an import failure. It is shown as an open position and excluded only from realized-P/L calculations.

### One canonical execution ledger

Broker-statement executions and Trade Tracker manual executions are not separate trade systems. They enter one owner- and account-scoped execution ledger and use the same validation, Data Decisions, round-trip reconstruction, notes linkage, and analytics path.

Every execution retains its provenance. Imported executions retain the broker, statement/import batch, source row, and broker execution identity when available. Manual executions retain the creating trader, entry timestamp, and manual-entry source. Provenance explains where a fact came from; it does not create a separate analytics population.

Statement upload order never determines trade grouping. After an import or manual correction, the Journal orders all accepted executions for the affected owner, account, instrument, and currency by execution time and a deterministic tie breaker. A closing execution may arrive in a statement uploaded before or after the statement that contained the opening execution.

Overlapping statements and reimports are previewed before acceptance. A broker execution identity is the strongest duplicate key. Exact reimport of the same source is idempotent. Conflicting versions and look-alike rows without reliable identity go to Data Decisions; they are not silently duplicated or discarded. An accepted replacement supersedes the earlier version without deleting its evidence.

### Round-trip rule

For each owner, account, instrument, and currency:

1. The position starts from supported opening-inventory evidence. An explicit
   zero is valid; when the earliest coverage boundary has no supported opening
   fact, the system creates a contained Data Decision instead of silently
   assuming zero.
2. The first execution that changes the position from zero to non-zero starts a new round trip.
3. Partial entries and exits remain in that round trip while the net position is non-zero.
4. The execution that returns the position to zero closes the round trip.
5. The next execution after zero starts a new round trip, even for the same symbol on the same day.
6. An execution that crosses through zero is split mathematically: the portion that reaches zero closes the old round trip and the remainder opens the new opposite-direction round trip.
7. Missing opening inventory, a same-time ordering that can actually change trade allocation, or a missing required execution creates a contained Data Decision for the affected chain.

This means repeated completed FFAI trades are separate round trips whenever the trader returns to zero between them. A later purchase after zero begins a new trade.

### Data Decisions

Data Decisions is a first-class Journal capability. It must let the trader inspect the affected source rows and executions, understand the derived round-trip consequence, and choose to correct, keep, exclude, or classify an item as open. The journal retains the original evidence, the decision, who made it, and the resulting rebuild.

The trader has final authority over factual records: they may correct a statement fact, add a genuinely missing execution, exclude an erroneous row, resolve a duplicate, or confirm supported opening inventory. The system has responsibility for transparent arithmetic. It cannot label a non-zero position closed or force an unresolved chain into realized analytics without the facts needed to support that result.

For correctness, the first implementation rebuilds the complete affected owner/account/instrument/currency chain after a historical change. Later optimization may begin at the earliest changed execution only if it proves an identical result.

The dashboard must show explicit coverage: included closed trades, open positions, pending decisions, excluded records, and the reason a metric is unavailable. It must never fabricate zeroes or silently drop records.

### Day Trade Tracker, Swing Trade Tracker and trading-day records

The approved tracker split provides two focused workflows over the canonical
Journal ledger. `/trade-tracker` is the Day Trade Tracker and
`/trade-tracker/swings` is the Swing Trade Tracker. This is a presentation and
annotation split, not a second execution system.

- Each execution row's actual date and time are authoritative, not the date the user visits TraderLink or presses Save.
- The primary capture window is the current trading day and recent trading days, when the trader can still reliably record intent, tags, rules, and notes. The initial implementation uses a seven-calendar-day late-entry window. Older dates remain factual read-only execution history, except that an active swing may include its true earlier opening execution and a completed swing may be entered when its closing execution is inside the recent-entry window. Historical factual corrections remain available through Data Decisions.
- One previewed manual batch may contain executions from several trading dates. Every affected date remains separate for day notes and daily rule reviews.
- One TraderLink login may manage multiple separate Journal accounts. The
  dashboard must provide account creation/management and an explicit active
  account selector. Imports, learned statement formats, executions, Data
  Decisions, annotations and analytics stay account-scoped unless a later
  cross-account view is deliberately labeled and designed.
- Journal accounts are user-defined groupings, not one-to-one broker accounts.
  A trader may organize them by strategy, purpose or asset class, and may link
  multiple broker or brokerage-account source identities to the same Journal
  account.
- However they are entered, the Journal assigns executions to their actual trading dates and can present each affected day separately.
- Intentional manual capture uses explicit previewed relationships such as
  start, continue and close a tracked trade. A new trade must begin at a
  supported zero boundary in the canonical ledger. This trade-boundary
  assertion is not a claim that the trader supplied a complete brokerage day
  and does not require routine broker-import opening-inventory confirmation.
  True duplicates, missing facts, contradictory position math and source
  conflicts remain contained in Data Decisions.
- The undated Day Trade Tracker opens the current account trading date/current week and keeps manual entry at the top. A date-specific view represents exactly one trading day. Historical dated routes remain available for factual review without encouraging retrospective subjective annotation.
- Daily notes and daily rule reviews are keyed to owner, account scope, and trading date. Monday, Tuesday, and Wednesday notes are never combined because they were entered on Wednesday.
- Trade notes, tags, and trade-level reviews are keyed to the stable round-trip identity and survive deterministic rebuilds through an identity/alias record.
- A round trip may span days. Executions appear on the days when they occurred; carried positions are visible; realized round-trip P/L is attributed to the closing trading day unless a metric contract explicitly states another basis.
- Day/Swing style is explicit trader-authored lifecycle intent attached to a stable trade/position identity. Holding duration never assigns or changes that label. A Day trade that remains open stays visible as an open Day trade until the trader reclassifies it. An active Swing requires both a supported open position and an active Swing plan. Swing notes are keyed to that stable position and note date so each day remains distinct.
- `/trades/open` remains the factual Open Positions surface for every confirmed open lifecycle, including active swings, open Day trades, unplanned holds and other confirmed opens. Unresolved execution chains stay in Data Decisions and are not presented as confirmed opens.
- If a later broker import may match a manual execution, exact time is supporting
  evidence rather than a hard identity requirement. The manual execution stays
  active and only the provisional imported candidate is withheld while Data
  Decisions offers same, separate, correct or decide-later. Unrelated statement
  rows proceed. Nothing replaces the manual execution before confirmation;
  confirmed one-to-one matches retain its identity and add broker provenance,
  while confirmed grouped fills preserve its history but use the exact broker
  fills as canonical facts.

All displayed execution, price, quantity, P/L, percentage, and other trading-data decimals use at most two decimal places. Canonical database values and editable broker/manual inputs remain lossless and are never rounded before persistence or calculation.

The existing date-specific Day Session work remains the visual and factual input
for the Day Trade Tracker. The linked Day/Swing plan is now the controlling
implementation contract for route ownership, recent entry, manual preview,
style transitions, swing daily notes and Open Positions coexistence.

## 4. Journal Analytics replacement

V3 analytics is legacy implementation, not the replacement's ordinary dashboard dependency.

The replacement keeps the useful safeguards hidden inside V3 or existing persistence code:

- owner and account isolation;
- exact financial values and currency scope;
- source identity, deduplication, correction precedence, and auditability;
- explicit timezone and session rules;
- validated filter allowlists; and
- visible source coverage and limitations.

The replacement does **not** require replay generation, proof receipts, digest chains, authority envelopes, or formal policy registries to render ordinary Journal dashboards.

The first analytics slice is deliberately small:

```text
eligible closed round trips
  -> exact normalized analytics rows
  -> shared aggregation for totals, daily, ticker, and time-of-day
  -> one bounded dashboard response
  -> /workspace, /trades, and /analytics agree
```

This small first slice is a reconciliation checkpoint, not a limit on the finished product. After it proves the shared calculation path, later slices expose every useful capability the accepted facts can support.

Before any metric is implemented, its calculation contract must define its formula, required inputs, treatment of fees and open trades, currency behavior, date/session timezone, display format, and coverage rules. Money must use decimal strings, minor units, or an equivalent exact representation - never JavaScript floating-point values as the source of truth.

Phase 1 creates a complete analytics capability catalog before page implementation. It maps every desired metric and chart to required execution, round-trip, account, market, tag, note, or rule facts; identifies whether those facts exist; and labels the capability `ready`, `requires_new_fact`, `requires_external_data`, or `not_planned`. Pages may expose all supported useful analytics, but they may not invent inputs or calculate finance independently in the browser.

Unsupported metrics remain unavailable with an explanation. Optional missing data affects only the metrics that require it.

## 5. Current development baseline

A previously verified January IBKR local test snapshot produced:

```text
normalized executions: 1,072
saved trades: 336
closed trades: 334
open trades: 2
saved reports: 1
route metadata records: 1
```

These figures are baseline evidence, not proof of which database currently serves the application. Phase 1 must locate the exact snapshot, identify every current reader/writer, and repeat the counts before using them as migration acceptance evidence. Historical-statement upload is a required product capability; the replacement must not treat this dataset as full history or a production migration source.

The current `/workspace` overview patch remains uncommitted and unverified. Database population alone is not a dashboard acceptance result.

The permanent product and architecture name is **TraderLink Platform**. `V4` may be used later as a release-generation label if it helps people distinguish a launch, but it is not a module name, database contract, or reason to create another duplicate folder. Current V3-named paths are legacy reference paths only.

## 6. Storage and migration strategy

Local development uses SQLite outside any repository. The replacement will use its own database and never share writes with the legacy app.

Planned private-data layout:

```text
C:\Users\jerac\Documents\TraderLink\private-data\
  legacy-app\
  traderlink-platform\
    development.sqlite
    backups\
  traderlink-platform-config\
  traderlink-platform-import-artifacts\
```

The configuration and evidence-vault roots are siblings of the database root.
This keeps append-only source evidence and local HMAC authority outside the
database directory and every backup/restore/verification tree.

No repository may contain a working SQLite database, WAL, SHM, import statement, secret, or production data copy.

Before a replacement database is created, inventory every current store and environment fallback. Academy, News, Watchlist, affiliate, Journal, rules, and level-analysis persistence must each have one named module owner. The eventual production target is one hosted SQL database with logical module ownership and migration history; its provider and final schema are decided before production work, not assumed during the local baseline.

Phase 1 found no `v4-temp-sql` folder in the active repository or TraderLink parent because it was mistakenly created in `C:\Users\jerac\Documents\traderslink.pro back up july 29\v4-temp-sql`. That backup folder contains an early `dashboard-test.sqlite3`, a loader script, and the January CSV, but no active source or environment reference points to it. The owner has rejected it as a migration source; preserve the backup without wiring it into the replacement.

The verified legacy source is `C:\Users\jerac\Documents\TraderLink\private-data\v3-dashboard\trading-rules-v1.sqlite`. It is acceptable migration input if it passes the backup, restore, and source-reconciliation gates. Phase 2 created the separately named replacement `development.sqlite` outside either repository with only the verified empty foundation; it does not repurpose or share writes with the legacy source.

Database copies must use a SQLite online backup while the source is active. Every migration snapshot records source path, timestamp, hash, schema version, table counts, reconciliation output, and tested restore instructions.

### Import privacy and security

Statements, source rows, executions, decisions, and notes are private owner data. Import files use authenticated owner-scoped access, private storage without public URLs, strict file type and size validation, safe parsing, and explicit retention/deletion rules. Raw statement contents, account identifiers, and execution details must not appear in client logs, analytics telemetry, public error responses, or shared fixtures. Every read, mutation, rebuild, export, and deletion enforces owner/account isolation at the server boundary.

## 7. Clean replacement workspace, cleanup, and preservation

The current `traderslink.pro` checkout remains the complete legacy reference until final replacement acceptance. No source, route, database, or feature is deleted before then.

The owner authorized and accepted the clean independent-clone checkpoint at `C:\Users\jerac\Documents\TraderLink\traderlink-platform`. That historical checkpoint was branch `codex/traderlink-platform-replacement` at `a3193e19806af955093aa236349d796171d9bf97`. The current replacement folder remains on that branch at published source commit `c0c998d8e456b9e70433e73123e8024b13ece203`, tracks the new repository's `origin/main`, and preserves the former repository as `legacy-origin`. Its active Tracker/Administration work remains unstaged and is not part of the live landing release.

This clean folder is a full, traceable, independent Git clone from the accepted preservation state in the existing repository lineage. It is not an unexplained file copy, an unrelated second product, or another disposable worktree. During migration:

1. `C:\Users\jerac\Documents\TraderLink\traderslink.pro` remains the preserved legacy reference and recovery source.
2. `C:\Users\jerac\Documents\TraderLink\traderlink-platform` is the clearly labeled replacement candidate and the only folder used for new replacement implementation after its creation.
3. The replacement receives capabilities through the migration register and reconciliation gates rather than bulk-copying the confused folder tree.
4. Nothing in the legacy folder is deleted merely because its capability has been ported.
5. Only after complete replacement acceptance is the new folder declared the canonical application. The original may remain as a non-running archive/reference indefinitely.

Phase 1 identified every TraderLink-like folder and registered worktree under `C:\Users\jerac\Documents\TraderLink`, proved where unique work and private data may live, and recorded readable keep/reconcile/archive/remove-later classifications. Those existing folders are preservation sources, not new implementation locations.

Each in-repository replacement slice follows the same cutover rule:

1. Record the current route, data, behavior, and acceptance baseline.
2. Implement the replacement behind an explicit module/service boundary without adding new V3 dependencies.
3. Rebuild or migrate the required data into the replacement database; do not dual-write silently.
4. Reconcile the replacement result to source executions and the accepted behavior inventory.
5. Obtain UI approval for any visible change, then switch the existing public route to the replacement service.
6. Retain a documented rollback point until the slice is accepted; remove legacy code only through the migration-register deletion gate.

The Phase 2 setup checkpoint records the clean checkout's exact source commit, remote, branch, data boundary, process/port, and promotion/rollback lifecycle in [Phase 2 Replacement Baseline Progress](phase-2-replacement-baseline-progress.md). The legacy application remains the preserved production/recovery reference while `traderlink-platform` is the sole active replacement implementation candidate; neither is presented as the other.

The workspace cleanup procedure is controlled by [Workspace and Worktree Cleanup Plan](workspace-and-worktree-cleanup-plan.md). Nothing is deleted merely because its name looks old. Unique commits, dirty tracked files, untracked source, ignored/private data, environment dependencies, active processes, and deployed or scheduled dependencies must be preserved or deliberately reconciled first. The user sees the exact proposed action for every folder before any deletion.

The accepted legacy behavior inventory is frozen as the preservation baseline. New replacement implementation belongs in `traderlink-platform`. The legacy `traderslink.pro` repository receives only explicitly approved emergency or preservation work, and every emergency fix requires a migration-register entry plus an explicit decision whether it must also be ported to a replacement module.

## 8. Inventory and route ownership

Before replacement feature work, create and maintain the following documents under `docs/migration/`:

- `product-inventory.md`
- `route-ownership.md`
- `database-ownership.md`
- `v3-dependency-map.md`
- `module-contracts.md`
- `analytics-capability-catalog.md`
- `workspace-and-worktree-cleanup-plan.md`
- `workspace-inventory.md`
- `phase-handoff-template.md`
- `phase-1-inventory-and-baseline-progress.md`
- `migration-register.md`
- `risk-register.md`
- `acceptance-inventory.md`

The inventory is a controlling target list, not an "at minimum" list. It must classify every page, API route, server action, script, scheduled process, environment variable, table, migration, local-data path, shared component, external service, and untracked intentional source file.

`/workspace`, `/trades`, `/analytics`, `/rules`, `/imports`, and Data Decisions are current Journal surfaces. Phase 1 proved that `/intelligence` was also reachable: it is a 52-page legacy V3 reference family with its own layout and navigation, not the future canonical shell. F5 gives all 52 routes an exact typed preserve, replace, compatibility, operations-only or owner-reject disposition and intercepts ordinary requests before the legacy filesystem route. Source remains protected from deletion through final acceptance.

## 9. Checkpoints and approval gates

| Phase | Scope | Exit condition |
| --- | --- | --- |
| 0. Planning | Finalize this plan, integrity contract, register, and agent direction. | Owner approves the planning package. |
| 1. Inventory and baseline | Complete the controlling inventory, source snapshot manifest, data/store map, analytics catalog, workspace/folder audit, and acceptance inventory. | Owner accepts the legacy baseline, folder dispositions, database source, and exact replacement start point. |
| 2. Replacement baseline | Preserve the accepted legacy source state, create the planned clean `traderlink-platform` checkout in the same repository lineage, establish the module baseline and separate database, and carry forward the approved light Material shell without redesign. | Legacy and replacement paths are unambiguous, the replacement is traceable and independently runnable, and no product behavior is intentionally lost. |
| 3. Journal integrity - complete | Implement the accepted [Phase 3 Journal Integrity Plan](phase-3-journal-integrity-plan.md): preserve every source record, establish one versioned execution ledger, contain Data Decisions, and rebuild exact round trips from full chronological chains. | Accepted: source evidence/history, deterministic reimport and reconstruction, two contained decisions, 331 unrelated ready closed round trips, and focused/disposable/backup/restore/private-source verification all pass. |
| 4. Core analytics | Implement the shared exact analytics slice and its coverage contract. | Real test data reconciles across Workspace, Trades, and Analytics. |
| 5. Module transfer | Port remaining Journal capabilities, Academy, Watchlist, News, Coach, Account, and platform services. | Each inventory item is accepted or explicitly deferred by the owner. |
| 6. Replacement acceptance | Browser review, focused and checkpoint testing, restore test, deployment rehearsal, and owner acceptance. | No active dependency on the legacy app remains. |
| 7. Legacy retirement | Archive, verify recovery, and remove legacy assets only with explicit owner approval. | Replacement is the accepted complete app. |

Phase 6 is locally accepted. The final build generated all 126 pages; the
146-file active replacement guard and all 18 migrations passed; primary and
second-account browser/API checks proved account isolation, annotations,
Data Decisions, broker-neutral mapping and at-most-two-decimal display; and the
final online backup/independent restore pair passed. The real database retained
its accepted main-file hash and zero-byte WAL. See the
[Phase 6 Acceptance Report](phase-6-replacement-acceptance-report.md). Source
publication and the narrow public landing/Academy Vercel cutover completed on
2026-08-03. Real hosted-source credentials/backups, owner Discord linking,
Docker execution, Railway persistent-volume hosting and full application/DNS
cutover remain external. Phase 7 cannot delete any
legacy repository, database, backup or source without explicit owner approval.
Phase 7 therefore establishes a preservation-only retirement boundary: the
replacement is the canonical local development application, while the old
repository stays intact as recovery/current-production reference until an
authorized hosted cutover.

The final dashboard product and go-live review is tracked in
[Dashboard Go-Live QA Progress](dashboard-go-live-qa-progress.md). It uses the
complete accepted product inventory, preserves the live-launch checklist as the
operational authority and retains owner approval for every visible correction.

Within Phase 2, the exact schema digest, migration identity, initialization recovery, versioned account fingerprinting, `WorkspaceAccessScope`, owner/admin/member permission model, separate ownership-seed gate, focused verification plan, and exact implementation-file list in [Replacement Database Schema and Migrations](replacement-database-schema-and-migrations.md) are implemented and correction-verified. The coordinating technical auditor accepted the code, verified empty database, and 10-file/53-test result under the owner's delegated technical checkpoint authority. The follow-on [Development Owner Seed Progress](development-owner-seed-progress.md) checkpoint is also complete: the database was backed up, previewed, atomically seeded, and independently verified at domain counts 1/1/1/1/0 with matching schema/migration digests and no trading data. Phase 3 may proceed and is not blocked on public login. Discord-first login, optional email/password, and user-facing account management are reconciled in the Platform portion of Phase 5 before go-live without changing stable Journal ownership IDs.

Phase 3 completed the required Phase 2 verifier refactor. The five
ownership-foundation table names remain an immutable historical profile; the
complete managed-table set now expands through six manifest migrations and 24
domain tables. Ordinary runtime continues to reject a historical prefix as
pending, while explicit verification may inspect a named accepted prefix
without silently migrating or adopting it. After a verified online backup,
byte-identical restore, and successful restore rehearsal, migrations 3-6 were
applied to the real development database.

The accepted Phase 3 package implements the record-preserving import,
unified broker/manual execution ledger, trader-controlled correction workflows,
atomic decision/rebuild coordinator, and deterministic full-history round-trip
projection. Its audit refined migration 0003 for explicit coverage evidence and
source chain/time containment, migration 0005 for append-only correction and
stale-finding events, and migration 0006 to keep exclusion execution-scoped.
Because migration files are immutable after application, the earlier Slice A
disposable remains preserved as historical evidence. The fresh six-migration
disposable, exact 11-file/129-test suite, static verifier, backup/restore
rehearsal, real preview/import/reimport, and independent verifier all passed.
The accepted database contains 2,284 immutable source rows, 1,072 Stock
executions, 542 preserved unsupported Forex records, 331 ready closed round
trips, zero automatically legitimate-open round trips, and two contained Data
Decisions. Phase 4 must preserve those coverage boundaries.

Any new or redesigned UI must be shown to the owner for visual approval before it is treated as an accepted feature slice. Broad tests, full builds, deployment, process stopping, database creation, and production changes occur only when their checkpoint requires them.

## 10. Chat and phase handoff protocol

A migration phase is an approval and scope boundary, not a mandatory chat boundary. Multiple short phases may continue in one healthy-context chat when the preceding exit condition is satisfied and the applicable delegated technical authority or retained owner gate authorizes the next phase. Conversely, one large phase may require a clearly labeled continuation chat. The owner delegated technical code/database/test/Git checkpoint acceptance to the coordinating auditor; owner involvement remains required for irreversible or external actions and final visual/product approval.

At every completed phase, Codex must still offer the owner a ready-to-copy new-chat prompt. The owner may use it immediately, keep it as a recovery handoff, or continue in the current chat. Recommend a new chat when context is becoming large, the next phase is substantial, the risk or work type changes materially, or a fresh verification boundary would improve safety. Do not force a new chat for a small phase, and do not keep many large phases in one chat merely to avoid a handoff.

Before closing a completed phase, Codex must:

1. update the master plan when a decision changed it;
2. update `migration-progress.md`, the migration register, the phase-specific tracker, and any required inventories;
3. record the canonical repository path, branch/commit state, database and process state, completed verification, unresolved items, owner decisions, and the exact authorized next scope;
4. obtain and record acceptance from the coordinating technical auditor or the owner, according to the applicable retained gate, rather than inferring it from implementation progress; and
5. provide the owner with a ready-to-copy optional new-chat prompt using [Phase Handoff Template](phase-handoff-template.md).

If a new chat is used, the next Codex must read `AGENTS.md`, this master plan, the integrity contract, the migration register, the progress tracker, and the previous phase handoff before taking action. If the current chat continues, Codex must still acknowledge the newly authorized phase and keep the same scope boundary. Neither choice broadens authorization.

If a chat must end before its phase is complete, Codex provides a continuation prompt instead of marking the phase accepted. The prompt identifies the unfinished phase, exact resume point, work already completed, verification status, and remaining scope.

## 11. Acceptance rules

No capability may be marked complete merely because a component renders or a unit test passes. Completion requires the applicable implementation, focused verification, real local route or endpoint result, source reconciliation, visual review when UI changes, documented coverage, and acceptance by the applicable delegated technical authority or retained owner gate. Final visual/product acceptance remains the owner's decision.

For every dashboard metric, acceptance includes:

- exact formula and display contract;
- included/excluded/open/pending counts and reasons;
- reconciliation to eligible source round trips;
- correct owner/account/timezone/filter scope; and
- a documented unavailable state when required source facts are absent.

No deletion is allowed while an item is `UNKNOWN`, while a migration-register row lacks owner acceptance, or while any application, script, schedule, environment variable, or database record still depends on the legacy implementation.

## 12. Non-goals and prohibitions

Do not build a blank rewrite, use V4 as the architecture, create unexplained sibling copies, introduce microservices, build a runtime plugin system, use one database per module, create a summary table for every chart, keep a second permanent analytics engine, perform browser-side financial calculations, mask failures with sample data, or silently exclude records.

Do not deploy, delete the legacy folder, rename folders, or migrate production data as part of the early replacement phases.
