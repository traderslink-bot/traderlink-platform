# TraderLink Platform Migration Progress

**Current phase:** Phase 6 local acceptance is complete. Phases 0-6 now pass their local technical/product gates; the owner-approved light Material dashboard is preserved, port 3010 is temporarily active for the owner's integrated review, and the accepted Journal fact counts remain intact with a zero-byte WAL. Local Journal Administration review now appends expected Platform audit events, so the live database file hash is no longer treated as immutable after Admin access begins. The replacement source was published to the new `traderslink-bot/traderlink-platform` repository on 2026-08-03, and the narrow landing/Academy release is live on Vercel. Public owner linking, real hosted-source preview/transfer, Docker execution, Railway persistent-volume deployment and full replacement application/DNS cutover remain external. Phase 7 retirement cannot delete preserved assets without explicit owner approval.

**Focused analytics pages:** The owner-approved [Analytics Page Architecture Plan](analytics-pages-architecture-plan.md) separates Overview, Results, Execution and Timing so they do not become duplicate metric pages. Overview implementation is complete under its [progress record](analytics-overview-progress.md). Results is now in focused local review under its [progress record](analytics-results-progress.md): it begins with a date-filtered, searchable and sortable ticker table using only trader-relevant P/L, win-rate, profit-factor, completed-trade and trading-day calculations and replaces the retired Trades by Ticker page. Execution is now in implementation under its [progress record](analytics-execution-progress.md): its charts and table use factual completed-trade construction data and replaces the retired Round Trips page. Analytics Lab is retained but removed from public navigation and redirects to Analytics until a later owner-approved scope restores it. The owner removed the separate Performance page because its calendar-based P/L views overlapped with Overview and Calendar; it is not a future implementation requirement.
**Historical pre-runtime implementation state:** The [Phase 3 plan](phase-3-journal-integrity-plan.md) and [tracker](phase-3-journal-integrity-progress.md) preserve the complete pre-runtime design and execution history. The accepted state immediately below supersedes former queued/unexecuted and 331/1/1 planning claims.
**Phase 2 foundation commit:** `fea56307fbd0142ef99b9f13c020451a6a503cc7` (`feat(platform): establish verified database foundation`), preserved locally without push or deployment.
**Phase 3 implementation commit:** `8f6a4d4e4dec20ef6edcd50f476b14d368bde505` (`feat(journal): complete phase 3 integrity foundation`), preserved locally without push or deployment.
**Phase 4 implementation commit:** `4575dafd0fb62804ac090c4a149152506d8db7b1` (`feat(analytics): complete replacement route cutover`), preserved locally without push or deployment. See [Phase 4 Handoff](phase-4-core-analytics-handoff.md).
**Phase 6 accepted source commit:** `b9575e2ed8ba93c23c3c4b8e35d80c26f71477c6` (`feat(platform): complete replacement application candidate`), preserved locally without upstream, push or deployment.

**Phase 5 plan:** [Phase 5 Module Transfer Plan](phase-5-module-transfer-plan.md) and [progress tracker](phase-5-module-transfer-progress.md) are accepted for implementation under delegated technical authority. Slice A has exact replacement Calendar/Ticker/Open-Positions/Trade-Tracker reads, V3-free active adapters and at-most-two-decimal displays. Broker-neutral imports/Data Decisions, retry-safe manual executions, local account management and user-defined multi-account selection are connected. Slice D provides replacement Journal rules, tags, daily notes, trade notes and trader-authored reviews; its empty schema and focused persistence/isolation/rebuild gate passed, and legacy annotation test data is deliberately excluded. Slice E connects the complete 210-capability Analytics Lab registry/query surface, account-scoped immutable saved views, explicit account/version-scoped Candle Review, normalized immutable market facts, and immutable Level Analysis deliveries plus stable Journal round-trip link versions through migrations 0008-0011. Every new E2-E4 table intentionally began empty. `/account` remains login-free on loopback, while Discord-first public login is activated only before go-live. Port 3010 remains off until a broad integrated visual boundary.

**Phase 6 acceptance:** [Replacement Acceptance Plan](phase-6-replacement-acceptance-plan.md), [progress tracker](phase-6-replacement-acceptance-progress.md), and [acceptance report](phase-6-replacement-acceptance-report.md) record the completed resource-aware local gate. Sequential one-worker regression, compile/lint/build, packaged runtime, browser/API/privacy, multi-account and final recovery rehearsal passed without authorizing production transfer or deployment.

**Phase 7 boundary:** [Legacy Retirement Progress](phase-7-legacy-retirement-progress.md) makes `traderlink-platform` the canonical local development application and freezes `traderslink.pro` as recovery/reference source. Source publication and the landing/Academy cutover are now recorded operations; no physical cleanup or full replacement hosted cutover is authorized by that classification.

**Journal Administration implementation:** The owner-approved [Journal Administration Dashboard Plan](journal-admin-dashboard-plan.md) and [progress tracker](journal-admin-dashboard-progress.md) define `/admin/journal` as a separate Platform/Journal operations surface and keep Watchlist, V3 and Level Analysis administration out of scope. Technical Admin 1-6 is assembled in the active unstaged package: migrations 0019/0020, fail-closed owner authorization, bounded request security, import attempt/recovery and format evidence, privacy-safe read models, 14 private route handlers, audited format lifecycle/merge/developer-package/consented-source actions and the complete light Material UI. Fifteen focused files/31 tests, full whole-project TypeScript, full lint with zero errors, the 126-page production build, the 83-file Admin verifier, all 21 migration-file checks and the 156-file active replacement guard pass. Live browser acceptance now passes for Overview and all six Admin subsections with clean console/overlay and sidebar-navigation checks; real support-vault configuration, production operator grant, owner visual/product review and production Discord activation remain open. The code-owned supported-format registry is intentionally empty until exact adapter/fixture evidence exists; separately authorized automatic orphan cleanup remains report-only.

**Day/Swing Tracker implementation:** The owner approved the [Day Trade Tracker And Swing Trade Tracker Plan](day-and-swing-trade-tracker-plan.md) on 2026-08-02 and authorized implementation through one integrated technical/UI review. The [progress tracker](day-and-swing-trade-tracker-progress.md) is active. `/trade-tracker` is the Day Trade Tracker, `/trade-tracker/swings` is the separate Swing Trade Tracker, and both use the same Journal execution ledger. Migrations 0019-0021, manual multi-date preview/confirmation/save, shared style and dated Swing notes, Day/Swing/Open Positions UI integration and manual/broker reconciliation are implemented. The complete five-file tracker/service/route gate passes 75 tests with one worker; shell/navigation, privacy headers, full TypeScript/lint/build and the 156-file active replacement guard also pass. Manual-save responses return affected Day Tracker dates and stable Swing position references. Live browser acceptance passes for Day Tracker, Swing Tracker and Open Positions with meaningful content, expected controls, clean overlays and no browser page errors; only integrated owner visual/product review remains.

**Quick Trade Entry:** The owner authorized `/quick-trade-entry` on 2026-08-05 as the direct selected-account Journal execution form for any past trading date, without Daily Tracker notes/tags/rules/review or Swing Tracker notes. It reuses the canonical manual preview/commit path and records visible `Quick Trade Entry manual executions` provenance; it does not create a second manual store or classify trades as swings. The [Quick Trade Entry progress record](quick-trade-entry-progress.md) tracks the focused implementation and visual checkpoint.

**Currency preference and reporting:** The owner authorized a user-selected Account Settings reporting currency on 2026-08-05. U.S. equity Journal executions remain USD facts; the initial Workspace dashboard checkpoint will show a labelled reporting equivalent using cached daily Bank of Canada indicative rates, with USD originals and unavailable coverage preserved. The [Currency Preference And Reporting Plan](currency-preference-and-reporting-plan.md) and [progress record](currency-preference-and-reporting-progress.md) control this Platform-owned preference slice.

**Current Focuses:** Daily Trade Tracker now carries the selected account's latest saved Current Focuses text to later editable trading-day pages. The existing immutable daily-note revision history retains every edit, which is the future weekly AI-review input rather than a single overwritten Friday value. The owner visually approved the current UI on 2026-08-05; focused verification remains deferred under the [Journal Review Workflow Corrections progress tracker](journal-review-workflow-corrections-progress.md).

**AI weekly-review fixture:** The owner approved a realistic two-week local
test-account fixture before AI review implementation. The controlled scenario,
safety boundary, expected trader notes, Current Focuses revisions, rule
coverage, and reviewed-day coverage are recorded in the [AI Weekly Review Test
Fixture Plan](ai-weekly-review-test-fixture-plan.md).
The guarded local seed is now complete: it added the planned 34 test
executions, 17 closed test trades, trader-authored notes, dated Current Focuses
history, and nine reviewed days without changing the pre-existing six Data
Decisions. The next slice is the actual weekly-review package and issued-review
workflow; no mock AI response is stored.

**AI weekly review:** The owner-approved [AI Weekly Review Plan](ai-weekly-review-plan.md)
and [progress record](ai-weekly-review-progress.md) define the active Coach
slice. The factual weekly package now includes account-scoped day/trade notes,
review state, rule outcomes, selected trade tags and dated Current Focuses
revisions. Migrations `0025_coach_weekly_reviews`,
`0026_coach_monthly_reviews` and `0027_coach_ai_generation_cost_tracking` are
applied locally with immutable request/output storage, Friday/Saturday/Sunday
Eastern delivery settings, calendar-month eligibility records and private
provider/cost-receipt storage. AI Reviews replaces the retired Reflection Loop
page; the next work
is the issued-review service, automatic runner and saved review list/detail.

**Daily Trade Tracker Yahoo Analyzer implementation:** The owner approved the [Daily Trade Tracker Yahoo Analyzer Plan](daily-trade-tracker-yahoo-analyzer-plan.md) and [progress tracker](daily-trade-tracker-yahoo-analyzer-progress.md) on 2026-08-04. The shared extended-hours ticker/session cache, durable automatic work, per-event analyzer, and real Daily Tracker manual-save queue are now implemented locally. After a recovery backup/restore verification, migration 0023 applied cleanly to the local development database and the protected local worker loop restarted. Yahoo remains the provider; the product is Daily Trade Tracker-only, excludes Round Trips and Market Charts, captures every entry/add/partial-exit/final-exit snapshot, and retains 5/15/30/60-minute post-exit paths. The temporary readable analysis-details presentation is next.

**Journal review workflow corrections:** The owner's integrated review found
redundant deterministic-trade confirmation, unavailable saved-manual editing,
overlapping Day/Swing lifecycle presentation, broken parameterized rule presets,
missing preset tags, over-expanded Data Decisions, repeated non-dismissible
coverage notices and missing Calendar annotation indicators. The owner-approved
[correction plan](journal-review-workflow-corrections-plan.md) and
[progress tracker](journal-review-workflow-corrections-progress.md) are active.
The owner-approved [Cooldown After Loss Rule Progress](cooldown-after-loss-rule-progress.md)
records the active addition of a trader-configured, automatically evaluated
Day-trade cooldown preset; owner visual review remains required.
The correction preserves server preview/validation, immutable evidence,
account isolation and Data Decisions while replacing internal/system language
with focused trader questions. Earlier Tracker browser acceptance remains
historical evidence, not acceptance of these newly identified product issues.
Corrections 0-7 are now implemented: deterministic capture no longer requires
the redundant confirmation screen; saved manual rows are append-only editable
from Day and Swing; rule presets validate by template; categorized preset/custom
tags and trade-rule review are available on Swing; Data Decisions use collapsed
direct questions and digest-bound dismissible notices; and Calendar shows
server-composed notes/rules/tags counts, including dated Swing-note activity
without invented closed-trade values. Focused lint, four one-worker files/17
tests, whole-project TypeScript, zero-error full lint, the 165-file active
replacement guard, whitespace verification and the final 126-route production
build pass. A fresh protected-port browser pass is clean across Workspace,
Day/Swing Trackers, Swing detail, Data Decisions, Rules and Calendar; the exact
corrected UI is ready for owner visual/product review.

**Temporary Data Decisions review examples:** Four `TLDEMO` synthetic broker
imports were added to the one active local development Journal account on
2026-08-04 so the owner can inspect open-position conflict, missing-price,
same-time-order and invalid-import-row workflows. They are contained pending
decisions, not real trader data and not completed-trade Analytics results. The
accepted real-data baseline remains historical evidence; current local pending
decision counts include these review-only examples until they are deliberately
retired or archived under a later approved cleanup action.

**Planned Data Decisions repair/review:** The dedicated [Data Decisions Repair
and Review Plan](data-decisions-repair-and-review-plan.md) and [progress
tracker](data-decisions-repair-and-review-progress.md) consolidate the
owner-reviewed repair-first follow-up. The existing technical integrity
contract remains controlling; implementation is active under the accepted
repair-and-review plan.

**Planned corporate-action integrity:** [Journal Corporate Actions and Share
Adjustments Plan](journal-corporate-actions-plan.md) and its [progress
tracker](journal-corporate-actions-progress.md) record a required future
Journal slice. The current Journal does not yet model share adjustments. A
split/reverse-split must become separately preserved, trader-confirmed evidence
before it alters an affected chain's quantity, basis, P/L or Analytics; it must
never be inferred from a quantity/price pattern alone. No implementation is
included in this planning checkpoint.

**Planned Trade Explorer:** The [Trade Explorer Plan](trade-explorer-platform-plan.md)
and [progress tracker](trade-explorer-platform-progress.md) record the
owner-requested full-capability comparison workspace. It will reuse accepted
Journal Analytics exact calculations and coverage rather than revive the V3
Explorer or create a duplicate engine. The plan includes side-by-side factual
comparison groups, complete-trade scorecards, breakdowns, evidence drill-down,
saved studies and later stored analyzer-snapshot comparisons. It remains a
draft pending owner review; no route, migration or implementation is authorized
by this planning record.

**Independent readiness QA:** A pre-review QA pass revalidated all 21 database
migrations and SQLite integrity, the Admin and active-replacement static guards,
whole-project TypeScript, zero-error full lint and the 126-page production
build. A full dashboard/Admin browser sweep found one Account MUI status-chip
hydration mismatch, corrected it, and then completed with zero page errors or
framework overlays in a fresh session. Admin and saved Swing-note timestamps
use deterministic UTC formatting. No browser QA trade was committed.
The private Admin route checks appended their expected access-audit events;
`platform_admin_audit_events` moved from 86 to 153 across both QA passes while all Journal domain
counts remained unchanged.

**2026-08-03 Git and public landing checkpoint:** The accepted replacement lineage is published at `https://github.com/traderslink-bot/traderlink-platform`; published `main` and the local replacement HEAD are `c0c998d8e456b9e70433e73123e8024b13ece203`. Local `origin` names the new repository and `legacy-origin` preserves the former repository. The Vercel production release `dpl_4MGMs3jqaYbQ7Wx3FQKdaHRxt6vW` serves the approved landing page and preserved Academy from clean commit `2d7bdd2370b0781c8157ed11f54337c20a4e68cd`; live `/` and `/academy` both returned HTTP 200 with no error/fatal logs for that deployment. A full-replacement Vercel promotion was immediately rolled back after its persistent `/data` readiness contract correctly failed on a dynamic Academy request. The complete replacement remains a single-node persistent-volume application intended for the later hosted cutover, not the current Vercel landing runtime.

Slice F1 now connects Reflection Loop and the latest Coach/Review APIs to one
read-only replacement service using published Journal Analytics, Data
Decisions and trader-authored annotation facts. No V3/sample fallback remains
in those active files. TypeScript/lint/static and real-database reconciliation
pass with the database hash unchanged. The written two-file/seven-test focused
Vitest gate remains policy-deferred after the approval layer refused its
execution; it is retained for Phase 6. F2 established migrations 0012-0013,
stable multi-provider Platform identity, user-level Academy completion history,
guarded login-free local access and unchanged protection for all 107 launch
slugs. F3 established explicit Watchlist-owned storage and separate publisher
authority; its legacy local source had zero rows and was not copied. F4
established versioned News storage, copied the one reconciled local article
exactly once, and keyed Affiliate first-touch attribution to stable Platform
users. F6 has now replaced the temporary public identity/storage adapters and
added exact hosted-transfer tooling; actual production transfer remains
pending.

At the F5 checkpoint, the fixture-driven dark `/platform-readiness` runtime was replaced with a
privacy-safe `/workspace/readiness` page in the approved dashboard. Its typed
registry gives every one of the 52 preserved `/intelligence` pages exactly one
canonical, compatibility, operations-only or owner-rejected disposition.
Temporary configuration redirects run before the filesystem, so ordinary
browser requests no longer enter the V3 layout while all legacy source remains
available for recovery. Focused TypeScript/lint/static verification passes over
122 active V3-free files. The real read-only readiness proof confirms 16
migrations, 59 domain tables plus the registry, stable owner/workspace/selected
account access and an unchanged 11,268,096-byte database with SHA-256
`9f14fade99348729336044c36f30edd4c9f0ad53a75dcb2de7b3eb5b9b9fae5d`.
The focused registry test subsequently passed in the Phase 6 sequential gate.

F6 now provides guarded loopback review plus hashed revocable Discord-first
Platform sessions, exact new-user provisioning, current Discord-membership
entitlement and a separate fail-closed initial-owner link command. The hosted
package uses standalone Next.js, a private-data-safe Docker image, one Railway
service/replica and one persistent `/data` volume, production startup
verification and a safe health endpoint. Migration 0018 adds the immutable
hosted-transfer-event ledger. Dedicated preview/execute/reconcile tooling can
adopt accepted Academy, Watchlist, News and Affiliate facts only after exact
backup/hash/source-snapshot authorization. It never reads or transfers legacy
Journal executions, trades, tags, rules or notes; that content was test data
and is excluded. A disposable four-module/eight-row proof reconciled exactly
and its second preview was idempotent. The real database passes read-only
schema/integrity/readiness verification at 18 migrations and 61 domain tables
plus the registry, while Discord memberships, public sessions and hosted
transfer events remain empty. No production source, Railway resource, secret,
push or deployment changed.

**Accepted Phase 3 runtime state:** The exact 11-file focused suite passed all
129 tests with one worker and no file parallelism; the static verifier passed;
and fresh disposable, online backup/restore rehearsal, real migrations,
privacy-safe preview, source-identity preparation, append-only evidence import,
exact reimport, and independent verification passed. `development.sqlite` now
has six migrations, schema digest
`75571914c5fa4bbfe7876c8e9a72cc7d584eab91704d70cf889bf5f1b374a55a`,
2,284 source records, 1,072 Stock executions, 542 preserved unsupported Forex
records, 331 ready closed round trips, zero automatically legitimate-open round
trips, and two contained Data Decisions. The main file is 10,522,624 bytes with
SHA-256 `31101395dafb7bb14c2bf934e3288b40f63a5f8736a1da03cf549c996463af3b`;
its WAL is zero bytes and its SHM is 32,768 bytes. No server, push, deployment,
production, or legacy mutation occurred.

**Historical Slice D source-identity preparation record:** Automation source and dedicated
synthetic coverage are written but unexecuted. Private-source handling
begins with an unscoped privacy-safe parse preview. After verified backup and
migrations, initial creation may link the statement to the seeded Journal
account only at the exact one-globally-active-workspace/one-active-account/
zero-source-identities/no-conflict boundary. If a completed link is encountered
after interruption, exactly one
identity may continue without mutation only when the in-process fingerprint
resolves unambiguously under complete configured retained HMAC authority to that
same sole account. All other existing, missing-authority, mismatched, conflicting, or
ambiguous states stop for factual review/recovery. The command verifies exactly
one link before scoped read-only preview. Normal product imports never auto-link.
This Journal source link is distinct from login: the development-local owner is
authoritative now, and Discord/email remain deferred. Both CLIs load the source
path only from required environment variable
`TRADERLINK_PLATFORM_JOURNAL_IMPORT_SOURCE_PATH` and reject source-path
arguments. The reader accepts a validated preserved-backup CSV while always
rejecting the active replacement repository plus any additional injected test
root, database-like/non-regular/malformed/oversize/evidence-mismatched input,
and descriptor identity changes; it never returns the source path. The locked
preparation proves exactly one globally active workspace before reporting that
count. No real database/private-source operation has begun.

**Historical Slice D import/integrity automation record:** The remaining source is written but
unexecuted. The import uses the same environment-only source path and requires
`NODE_ENV=development` exactly plus a separate action/enable gate, the exact confirmed preview
evidence, the complete retained account and Journal HMAC maps, one prepared IBKR
identity, and the accepted six-migration/owner/account state. The configured
vault must be outside all repository/storage/source boundaries; it promotes an
exclusive flushed hash-addressed object before the normal atomic Journal command,
removes failed pre-promotion temporary files, and reports only a relative
recoverable key plus truthful newly-created-unreferenced or
already-present-reference-unverified state on later failure. Exact
reimport verifies the same object and batch with zero new data. The independent
read-only verifier was designed around the then-proposed post-import 331-ready/one-open/one-needs-decision
gate, ordinal source/fact/execution/provenance evidence,
relationship/allocation/rebuild/idempotency/vault/sidecar proof, and
backup-restore stop on failure. The read-only pre-commit preview no longer claims
round-trip counts it cannot derive. Read-only WAL sidecar absence remains a
runtime gate, not a static proof.

## Completed planning decisions

- The product direction is a modular platform; Journal Analytics is not the platform architecture.
- A practical replacement analytics path may replace V3 for ordinary dashboards.
- Data correctness remains strict at source-row, execution, round-trip, and metric scope.
- Data Decisions is a required Journal foundation; the trader makes the final factual decision from statement evidence.
- Valid unrelated round trips must remain visible when another round trip needs a decision.
- Statement upload order is irrelevant; reconstruction uses the full chronological execution history for the affected account/instrument/currency chain.
- A round trip starts when position leaves zero and closes when it returns to zero; the next execution after zero begins a new trade.
- Broker-imported and manual Trade Tracker executions share one canonical ledger while preserving source provenance.
- Manual executions use their actual per-row execution date/time and never combine daily notes across trading dates. Intentional manual entry uses previewed start/continue/close trade-boundary assertions and does not routinely require the broker-import opening-inventory or whole-day coverage workflow. Genuine duplicates, contradictions and impossible arithmetic still enter Data Decisions. The Day Trade Tracker focuses on the current/recent day workflow; the separate Swing Trade Tracker follows stable intentional swing positions across dates. Day/Swing intent is authored at the trade/position level and is never inferred from duration.
- Displayed trading-data decimals use at most two places while editable source/manual values and canonical calculations remain lossless.
- January IBKR data is test data, not a complete live customer migration source.
- The architecture is TraderLink Platform; V4 is optional only as a later release label.
- Workspace/folder cleanup requires a user-visible Git and data audit before any removal.
- The current legacy application remains preserved until complete owner-approved replacement acceptance.
- The approved dashboard preservation baseline is the light Material UI design with the complete left navigation. A dark or reduced legacy/experimental shell is not the final dashboard.
- The accepted Calendar has week/month views and sits under Trades in that same dashboard navigation.
- The replacement is now in one clean, traceable full checkout at `C:\Users\jerac\Documents\TraderLink\traderlink-platform`. The current `traderslink.pro` folder remains intact as a recovery/reference archive and need not be deleted.
- `v4-temp-sql` was located inside `C:\Users\jerac\Documents\traderslink.pro back up july 29`; it is an early experiment, not configured, and owner-rejected as a migration source.
- The selected replacement development database is `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\development.sqlite`; it now contains seven accepted migration rows, the Phase 3 Journal evidence summarized above and 13 empty Slice D annotation tables. Legacy annotation test data was not copied. The earlier two-migration/five-table foundation remains historical recovery evidence.
- The owner accepted one active workspace owner, owner/admin access to every active account in the same workspace, member denial until grants are designed, two initial migrations, five empty domain tables, and empty initialization without private seed data.
- The owner-accepted design uses `WorkspaceAccessScope`, versioned broker-account fingerprint/canonicalization/HMAC identities, globally unique migration IDs, exact post-migration schema digests with fail-closed drift detection, separate runtime/initializer modes, canonical UUID-v4/numeric UTC validation, workspace-versus-account isolation, a separate ownership-seed approval gate, the accepted focused verification plan, and the accepted exact implementation-file list.
- Big Time weekly content automation is preserved but explicitly deferred as a low-priority News operation outside the core Journal/database replacement.
- The Phase 3 runtime evidence reconciles all 2,284 source records, including 1,072 Stock execution records and 542 preserved-but-unsupported Forex records. Zero-to-zero arithmetic produces 331 ready closed round trips and two contained decision chains; legacy session/time-gap trade counts are not the target.
- Before adding migration 3, verifier semantics must separate the immutable five-table Phase 2 ownership-foundation profile from the expanding current migration manifest. Ordinary runtime remains strict and never auto-migrates.
- Slice A completed that verifier split and implemented migrations 3-6 in code. The accepted current manifest has six rows and 24 domain tables; the final fresh-disposable and real schema digest is `75571914c5fa4bbfe7876c8e9a72cc7d584eab91704d70cf889bf5f1b374a55a`.
- Slice B code now preserves every CSV record, maps IBKR Stock executions and
  position facts, retains unsupported Forex coverage, unifies manual and broker
  provenance, enforces exact reimport/manual idempotency, reconciles overlaps,
  rejects changed manual facts under a reused idempotency key,
  gives strong provider fill identity precedence without collapsing two
  distinct same-fact provider fills, preserves trader exclusions during later
  broker enrichment, and stores immutable execution versions. Import preview boundaries return
  aggregate, privacy-safe counts and issue/coverage summaries; scoped previews
  plan exact reimports and overlaps without returning broker tokens, raw rows,
  executions, or symbols or mutating source identities. Exact commit retries
  resolve the accepted file digest before parser/mapping work. Its synthetic
  tests later passed in the complete one-worker Phase 3 verification gate.
- Provider identity retained only as conflict provenance becomes an active
  privacy-safe alias after the trader chooses `keep_distinct` or a supported
  duplicate merge. Conflicting alias ownership fails closed. Focused coverage
  later passed in the complete one-worker Phase 3 verification gate.
- Slice C code now atomically connects accepted imports to source/chain Data
  Decisions and full-account deterministic rebuilds. It supports zero-to-zero
  long/short/partial/multi-day/repeated/flip grouping, statement-supported open
  positions, position-checkpoint containment and later recovery, exact
  allocation conservation, stable identities, stale-finding supersession,
  consequential full-chain same-time order decisions, exact import-state
  reconciliation, evidence-bound source-row actions, supplied missing
  position facts, honest accepted source limitations, all accepted trader
  actions including reviewed statement-coverage supply, statement-only
  carried-position visibility, stale-chain retirement after an instrument
  correction, and a privacy-safe aggregate coverage read model with explicit
  account timezone/currency, gap, overlap, and mismatch counts. Manual batch
  order is not treated as authoritative execution order. Its synthetic
  tests later passed in the complete one-worker Phase 3 verification gate.

## Current verified local baseline

| Measure | Value | Meaning |
| --- | --- | --- |
| Normalized executions | 1,072 | January IBKR test dataset |
| Saved trades | 336 | Derived current local data |
| Closed trades | 334 | Candidate realized-P/L population after eligibility checks |
| Open trades | 2 | Must remain visible separately from realized analytics |
| Workspace overview | Unverified | Existing repair is uncommitted and not accepted |

The currently configured local source is `C:\Users\jerac\Documents\TraderLink\private-data\v3-dashboard\trading-rules-v1.sqlite`. `v4-temp-sql` exists only inside the July 29 backup and is not the configured database.

## Phase 1 inventory findings

- Current source has 96 page routes and 61 Route Handlers: 24 dashboard pages, 52 legacy `/intelligence` pages, and 20 Platform/peer-module pages.
- The dashboard family is real source, not redirected wholesale into `/intelligence`; older route documentation is stale.
- 107 source files directly reference V3. Default local runtime and CI remain V3-coupled.
- Current local storage fallbacks can mix Platform/Academy, News, Watchlist, affiliate, Level Analysis, rules, tags, and Journal data under confusing paths.
- The parent workspace has 88 immediate folders. Seventeen canonical worktrees have commits outside current main, and the old `trader-intelligence-v2` repository/worktrees contain substantial dirty/unique work.
- Node PID 3160 serves port 3000 and used roughly 1.28 GB working memory at observation; it and the active database were not stopped.
- The Big Time scheduler source can mutate Git and deploy production; installed Windows task state/path is still unknown because task enumeration was denied.
- Module contracts, the 126-metric migration catalog, additional possible analytics, risks, and acceptance gates are now drafted under `docs/migration/`.

## Phase 0 exit checklist

- [x] Master replacement plan created in `docs/migration/`.
- [x] Import Integrity and Data Decisions contract created.
- [x] Migration register created.
- [x] Per-phase chat and handoff protocol created.
- [x] Legacy V3 plan and agent guidance marked as superseded for future platform work.
- [x] Project owner explicitly accepted the Phase 0 planning package on 2026-07-31.

## Phase 0 acceptance and handoff

The approved closure record is [Phase 0 Planning Handoff](phase-0-planning-handoff.md). It records the repository and working-tree state, the unverified database/process boundaries, accepted decisions, deferred work, exact Phase 1 scope, and prohibited actions.

The owner explicitly authorized Phase 1 in the current chat on 2026-07-31. Phase 1 remains limited to inspection and migration-document work. Its live tracker is [Phase 1 Inventory and Baseline Progress](phase-1-inventory-and-baseline-progress.md).

## Phase 1 acceptance and next boundary

1. The owner accepted the Phase 1 inventory, folder dispositions, current legacy source, backup-only V4 conclusion, approved dashboard/Calendar baseline, clean replacement path, module contracts, analytics first slice, risks, and replacement-start boundary on 2026-08-01.
2. Carry the two machine-state unknowns forward with explicit evidence gates: the installed Big Time scheduled-task target must be proven only before that low-priority automation is changed/reactivated or its related folder is considered for cleanup, and the exact process holding the legacy database must be proven before a later authorized stop/copy.
3. The owner explicitly authorized Phase 2 and accepted its preservation-commit and independent-clone checkpoint on 2026-08-01.

## Phase 2 preservation, clone, and database-backup checkpoint

- Legacy reference: `C:\Users\jerac\Documents\TraderLink\traderslink.pro`, `main` at `a3193e19806af955093aa236349d796171d9bf97`.
- The legacy worktree retains exactly two tracked product modifications and 22 untracked preservation files. They remain outside the replacement checkout.
- Replacement: `C:\Users\jerac\Documents\TraderLink\traderlink-platform`, branch `codex/traderlink-platform-replacement`, remote `https://github.com/traderslink-bot/traderslink-trader-improvement-system.git`.
- The replacement was clean at the accepted clone checkpoint. No upstream, push, deployment, dependency installation, environment copy, or server start occurred.
- Accepted backup-baseline commit: `405acf08ce8ac7be6c984cb52082052d18642acc`. It records the corrected backup baseline in exactly eight documentation/agent files and was not pushed.
- Accepted empty-foundation implementation commit: `fea56307fbd0142ef99b9f13c020451a6a503cc7`. It records exactly 37 accepted source/test/script and controlling-documentation paths and contains no database, sidecar, private data, environment file, dependency tree, log, or unrelated file. It was not pushed or deployed.
- At this Phase 2 checkpoint, the selected replacement database contained only the verified two-migration, five-empty-domain-table foundation. Later owner seed and Phase 3 records supersede that historical state.
- The configured legacy source was backed up with the SQLite online backup API while PID 3160 remained running. The completed backup is `C:\Users\jerac\Documents\TraderLink\private-data\legacy-app\backups\phase-2-20260801T053759Z\trading-rules-v1-online-backup.sqlite`, SHA-256 `92B814735EFF41BAEAFB6BC1F2E8B7E0D4EFDD137416D0C0C80708DB50F5E737`.
- The backup was restored to a separate disposable private-data target. All 24 table counts, four migration rows, schema DDL digest, page geometry, and `quick_check=ok` match the legacy source and completed backup.
- No sidecars existed immediately after the main backup and restore operations. Later read-only verification of the WAL-mode files created zero-byte WAL and 32,768-byte SHM sidecars beside both new databases; the main database hashes remain unchanged and identical. The sidecars remain preserved pending a separately authorized cleanup decision.
- Complete evidence and restore instructions are in [Phase 2 Replacement Baseline Progress](phase-2-replacement-baseline-progress.md).
- The owner accepted that corrected backup/restore checkpoint and the corrected exact schema/migration design. The accepted [Replacement Database Schema and Migrations](replacement-database-schema-and-migrations.md) package fixes the empty database foundation, migration registry and schema digest, Platform identity, Journal account boundary, versioned identity recovery, `WorkspaceAccessScope`, permission model, future Journal table map, separate ownership-seed gate, recovery rules, exact implementation files, and focused verification cases.

Current boundary: the coordinating technical auditor accepted the completed
[Phase 3 Journal Integrity Progress](phase-3-journal-integrity-progress.md)
runtime and database evidence; no separate personal owner review is required.
Phase 4 Slices A-D are technically accepted. Slice A passed targeted lint,
dependency-scoped TypeScript, and 2 focused files/9 tests with one worker. Slice
B passed targeted lint, dependency-scoped TypeScript over 14 roots/imports, and
6 focused files/34 tests with one worker and no file parallelism. The result is
one Journal-owned fact set, exact normalized populations and fee handling, 22
first-slice metrics, and reconciling daily/ticker/30-minute groups without
touching the real database. Slice C then passed targeted lint,
dependency-scoped TypeScript over 22 roots/imports, the 8-file/45-test
one-worker suite, a 10,000-execution scale proof and the static verifier. Its
registry has all 126 legacy candidates plus 84 additional capabilities: 181
implemented/conditional and 29 explicitly unavailable, digest
`bc49aaceebff2af7b2a35bc16f99f89e9c1d3ceb461b234d2ac21992cfd3049e`.
Slice D then passed targeted lint, dependency-scoped TypeScript, 1 focused
file/2 tests with one worker, and the privacy-safe real-database verifier. It
proved 331 ready closed, zero legitimate open, two contained decisions, 331
fee-complete rows, identical production/independent exact row digests, six
reconciling service reads, complete 331-row keyset pagination, unchanged main
database hash/size and no non-empty WAL. Slice E then implemented the
development-only scope/launcher and cut Workspace, Round Trips, the overview
API, and five standard Analytics routes to replacement services. Focused lint,
scoped TypeScript, two files/11 one-worker tests, the static route verifier and
real browser/API checks passed; the database hash/size and zero-byte WAL remain
unchanged. The owner approved the preserved light Material dashboard on
2026-08-02, closing the remaining Slice E gate. The temporary review process
was stopped and port 3010 is not listening. The owner's review also confirmed
the Phase 5 entry list: Calendar, Trade Tracker and Rules still depend on
inherited V3 access; Ticker/Open Trades, Data Decisions, Manual Entry and
Analytics Lab remain incomplete replacement surfaces. Public
login/account integration
is not a prerequisite: Discord-first login is reconciled before go-live, with
email/password left optional. Broad lint, full-project TypeScript, full
regression, build, browser/E2E, and CI-equivalent checks remain deferred to the
final replacement acceptance gate without being removed from it. No push,
deployment, deletion, production change, or legacy retirement is authorized.

Phase 5 broker-neutral import progress now includes a user-confirmed generic
CSV mapper, immutable account-scoped exact template reuse, privacy-safe support
packages after both failed and successful mapping, and active-account mismatch
protection. The Platform boundary now supports multiple separately selected
Journal accounts through an opaque server-resolved cookie, shared dashboard
switcher, bounded account creation and stale-mutation conflicts. A newly
recognized IBKR identity requires explicit confirmation into the selected
account. Four focused import files pass 34 one-worker tests and five focused
account files pass 16. Multiple IBKR/generic broker sources in one user-defined
Journal account are disposable-proven. The Data Decisions product adapter
exposes every currently permitted typed action and passes 2 focused tests; the
underlying append-only command/decision engine passes 30 focused tests. The disposable
write verifier also passed private exact reimport, canonical manual swing
executions, partial-coverage resolution, generic mapped commit/template reuse,
second-account isolation, stale-selection rejection, explicit new-broker
linking, `quick_check=ok`, cleanup and unchanged real database evidence. The
multi-account-aware read-model verifier also passed against the unchanged real
database. A Windows upload-staging read-back defect was found and corrected
before any real product-route write. At that verification checkpoint, port
3010 remained off and no commit, push, deployment or real database mutation
occurred. The accepted package was subsequently preserved in the Phase 6 local
source commit recorded above; the database remained unchanged.
