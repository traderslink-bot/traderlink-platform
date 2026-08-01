# TraderLink Platform Replacement Plan

**Status:** Approved planning baseline. Phases 0 and 1 are accepted. The Phase 2 database foundation and local development-owner seed are implemented, focused-verified, independently verified, and technically accepted by the coordinating auditor. The exact Phase 3 Journal integrity plan and Slice A schema are technically accepted; Slice B source evidence and canonical execution-ledger services are active. Public login/account integration is deferred until the complete dashboard is preparing to go live.

**Phase 2 foundation preservation:** Local commit `fea56307fbd0142ef99b9f13c020451a6a503cc7` (`feat(platform): establish verified database foundation`); not pushed or deployed.

**Owner:** Project owner and Codex

**Prepared:** 2026-07-31

**Supersedes for future platform work:** the V3 implementation roadmap in `plan.md`. That document remains historical reference only.

**Related documents:** [Import Integrity and Data Decisions Contract](import-integrity-and-data-decisions-contract.md), [Product Inventory](product-inventory.md), [Route Ownership](route-ownership.md), [Database Ownership](database-ownership.md), [Replacement Database Schema and Migrations](replacement-database-schema-and-migrations.md), [Phase 3 Journal Integrity Plan](phase-3-journal-integrity-plan.md), [Phase 3 Journal Integrity Progress](phase-3-journal-integrity-progress.md), [V3 Dependency Map](v3-dependency-map.md), [Module Contracts](module-contracts.md), [Analytics Capability Catalog](analytics-capability-catalog.md), [Operational and Configuration Inventory](operational-and-configuration-inventory.md), [Workspace Inventory](workspace-inventory.md), [Source Snapshot](source-snapshot-and-untracked-manifest.md), [Workspace and Worktree Cleanup Plan](workspace-and-worktree-cleanup-plan.md), [Risk Register](risk-register.md), [Acceptance Inventory](acceptance-inventory.md), [Phase 1 Progress](phase-1-inventory-and-baseline-progress.md), [Phase 2 Progress](phase-2-replacement-baseline-progress.md), [Development Owner Seed Progress](development-owner-seed-progress.md), [Phase Handoff Template](phase-handoff-template.md), [Phase 0 Handoff](phase-0-planning-handoff.md), [Phase 1 Handoff](phase-1-inventory-and-baseline-handoff.md), [Migration Register](migration-register.md), and [Migration Progress](migration-progress.md).

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

The final platform dashboard preserves the owner-approved **light Material UI design**. It is not a dark dashboard. Its identifying structure is the shared left navigation and the complete approved dashboard destination inventory, including Trades, the Calendar with week/month views, Analytics, Analytics Lab, Trading Rules, Workspace, Trade Tracker, imports, manual entry, Data Decisions, and the other accepted destinations recorded in `product-inventory.md` and `route-ownership.md`.

A legacy or experimental dashboard that lacks the light Material treatment, the left navigation, Trades, Calendar, Analytics, Analytics Lab, or Trading Rules is not the approved final dashboard. It may be used only as behavior/reference evidence. Any visible change to the approved baseline requires iterative owner visual approval before cutover.

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
| Source row | preserved, mapped, automatic_non_execution, needs_correction, excluded_by_trader | Every statement row stays traceable. |
| Execution | accepted, needs_decision, excluded_by_trader, superseded | An execution cannot be analytically used unless its required facts are resolved. |
| Round trip | ready_closed, legitimate_open, needs_decision, excluded_by_trader, superseded | A questionable execution makes the dependent round trip questionable; it does not invalidate unrelated round trips. |
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
7. Missing opening inventory, an ambiguous same-time ordering, or a missing required execution creates a contained Data Decision for the affected chain.

This means repeated completed FFAI trades are separate round trips whenever the trader returns to zero between them. A later purchase after zero begins a new trade.

### Data Decisions

Data Decisions is a first-class Journal capability. It must let the trader inspect the affected source rows and executions, understand the derived round-trip consequence, and choose to correct, keep, exclude, or classify an item as open. The journal retains the original evidence, the decision, who made it, and the resulting rebuild.

The trader has final authority over factual records: they may correct a statement fact, add a genuinely missing execution, exclude an erroneous row, resolve a duplicate, or confirm supported opening inventory. The system has responsibility for transparent arithmetic. It cannot label a non-zero position closed or force an unresolved chain into realized analytics without the facts needed to support that result.

For correctness, the first implementation rebuilds the complete affected owner/account/instrument/currency chain after a historical change. Later optimization may begin at the earliest changed execution only if it proves an identical result.

The dashboard must show explicit coverage: included closed trades, open positions, pending decisions, excluded records, and the reason a metric is unavailable. It must never fabricate zeroes or silently drop records.

### Trade Tracker and trading-day records

Trade Tracker is the manual execution entry and day-review surface over the canonical ledger.

- The execution's actual date and time are authoritative, not the date the user visits TraderLink or presses Save.
- The persistence contract must support executions from multiple trading dates, including executions entered days after they occurred. Whether the UI captures them in one batch, separate day workflows, or another presentation is intentionally deferred.
- However they are entered, the Journal assigns executions to their actual trading dates and can present each affected day separately.
- A date-specific Trade Tracker view represents exactly one trading day. The future navigation, undated-route behavior, and multi-day entry presentation require a separate UI plan and owner visual approval.
- Daily notes and daily rule reviews are keyed to owner, account scope, and trading date. Monday, Tuesday, and Wednesday notes are never combined because they were entered on Wednesday.
- Trade notes, tags, and trade-level reviews are keyed to the stable round-trip identity and survive deterministic rebuilds through an identity/alias record.
- A round trip may span days. Executions appear on the days when they occurred; carried positions are visible; realized round-trip P/L is attributed to the closing trading day unless a metric contract explicitly states another basis.
- If a later broker import appears to match a manual execution, the system shows the provenance and match in Data Decisions so the trader can merge/supersede, correct, or keep distinct records without double counting.

The existing date-specific Trade Tracker and daily-note work is preservation input, not automatic acceptance. Trade Tracker will be reviewed and revised later under its own plan. This migration plan approves the data capability only; it does not approve a screen layout or multi-day entry workflow.

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
    import-artifacts\
```

No repository may contain a working SQLite database, WAL, SHM, import statement, secret, or production data copy.

Before a replacement database is created, inventory every current store and environment fallback. Academy, News, Watchlist, affiliate, Journal, rules, and level-analysis persistence must each have one named module owner. The eventual production target is one hosted SQL database with logical module ownership and migration history; its provider and final schema are decided before production work, not assumed during the local baseline.

Phase 1 found no `v4-temp-sql` folder in the active repository or TraderLink parent because it was mistakenly created in `C:\Users\jerac\Documents\traderslink.pro back up july 29\v4-temp-sql`. That backup folder contains an early `dashboard-test.sqlite3`, a loader script, and the January CSV, but no active source or environment reference points to it. The owner has rejected it as a migration source; preserve the backup without wiring it into the replacement.

The verified legacy source is `C:\Users\jerac\Documents\TraderLink\private-data\v3-dashboard\trading-rules-v1.sqlite`. It is acceptable migration input if it passes the backup, restore, and source-reconciliation gates. Phase 2 created the separately named replacement `development.sqlite` outside either repository with only the verified empty foundation; it does not repurpose or share writes with the legacy source.

Database copies must use a SQLite online backup while the source is active. Every migration snapshot records source path, timestamp, hash, schema version, table counts, reconciliation output, and tested restore instructions.

### Import privacy and security

Statements, source rows, executions, decisions, and notes are private owner data. Import files use authenticated owner-scoped access, private storage without public URLs, strict file type and size validation, safe parsing, and explicit retention/deletion rules. Raw statement contents, account identifiers, and execution details must not appear in client logs, analytics telemetry, public error responses, or shared fixtures. Every read, mutation, rebuild, export, and deletion enforces owner/account isolation at the server boundary.

## 7. Clean replacement workspace, cleanup, and preservation

The current `traderslink.pro` checkout remains the complete legacy reference until final replacement acceptance. No source, route, database, or feature is deleted before then.

The owner authorized and accepted the clean independent-clone checkpoint at `C:\Users\jerac\Documents\TraderLink\traderlink-platform`. It exists as the active replacement implementation candidate on branch `codex/traderlink-platform-replacement` at `a3193e19806af955093aa236349d796171d9bf97`, with the intended GitHub remote and no upstream, push, or deployment.

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

`/workspace`, `/trades`, `/analytics`, `/rules`, `/imports`, and Data Decisions are current Journal surfaces. Phase 1 proved that `/intelligence` is also reachable: it is a 52-page legacy V3 reference family with its own layout and navigation, not the future canonical shell. Its routes are inventoried by capability group and remain protected from deletion until each unique behavior receives a preserve, replace, compatibility, defer, or owner-reject disposition.

## 9. Checkpoints and approval gates

| Phase | Scope | Exit condition |
| --- | --- | --- |
| 0. Planning | Finalize this plan, integrity contract, register, and agent direction. | Owner approves the planning package. |
| 1. Inventory and baseline | Complete the controlling inventory, source snapshot manifest, data/store map, analytics catalog, workspace/folder audit, and acceptance inventory. | Owner accepts the legacy baseline, folder dispositions, database source, and exact replacement start point. |
| 2. Replacement baseline | Preserve the accepted legacy source state, create the planned clean `traderlink-platform` checkout in the same repository lineage, establish the module baseline and separate database, and carry forward the approved light Material shell without redesign. | Legacy and replacement paths are unambiguous, the replacement is traceable and independently runnable, and no product behavior is intentionally lost. |
| 3. Journal integrity | Implement the accepted [Phase 3 Journal Integrity Plan](phase-3-journal-integrity-plan.md): preserve every source record, establish one versioned execution ledger, contain Data Decisions, and rebuild exact round trips from full chronological chains. | Source evidence and history are preserved; import/reimport/overlap/manual provenance is deterministic; decisions rebuild correctly; opening/closing inventory and open positions reconcile; one unresolved chain does not hide unrelated valid trades; private-source counts and focused/disposable/backup/restore evidence pass. |
| 4. Core analytics | Implement the shared exact analytics slice and its coverage contract. | Real test data reconciles across Workspace, Trades, and Analytics. |
| 5. Module transfer | Port remaining Journal capabilities, Academy, Watchlist, News, Coach, Account, and platform services. | Each inventory item is accepted or explicitly deferred by the owner. |
| 6. Replacement acceptance | Browser review, focused and checkpoint testing, restore test, deployment rehearsal, and owner acceptance. | No active dependency on the legacy app remains. |
| 7. Legacy retirement | Archive, verify recovery, and remove legacy assets only with explicit owner approval. | Replacement is the accepted complete app. |

Within Phase 2, the exact schema digest, migration identity, initialization recovery, versioned account fingerprinting, `WorkspaceAccessScope`, owner/admin/member permission model, separate ownership-seed gate, focused verification plan, and exact implementation-file list in [Replacement Database Schema and Migrations](replacement-database-schema-and-migrations.md) are implemented and correction-verified. The coordinating technical auditor accepted the code, verified empty database, and 10-file/53-test result under the owner's delegated technical checkpoint authority. The follow-on [Development Owner Seed Progress](development-owner-seed-progress.md) checkpoint is also complete: the database was backed up, previewed, atomically seeded, and independently verified at domain counts 1/1/1/1/0 with matching schema/migration digests and no trading data. Phase 3 may proceed and is not blocked on public login. Discord-first login, optional email/password, and user-facing account management are reconciled in the Platform portion of Phase 5 before go-live without changing stable Journal ownership IDs.

Phase 3 Slice A completed the required Phase 2 verifier refactor. The five
ownership-foundation table names remain an immutable historical profile; the
complete managed-table set now expands through six manifest migrations and 24
domain tables. Ordinary runtime continues to reject a historical prefix as
pending, while explicit verification may inspect a named accepted prefix
without silently migrating or adopting it. The real seeded database remains on
the two-migration prefix until the later backup/restore gate authorizes applying
migrations 3-6.

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
