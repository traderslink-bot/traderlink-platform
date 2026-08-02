# TraderLink Replacement Acceptance Inventory

**Phase:** Phases 0-6 locally accepted; Phase 7 preservation boundary established
**Status:** Controlling acceptance target list reconciled on 2026-08-02; remaining unchecked items are explicitly deferred or external below
**Rule:** Checkpoint scope determines what is implemented now. It does not remove later items from this inventory.

## Evidence levels

| Level | Evidence |
| --- | --- |
| Source | Current route/code/schema/config inventory identifies ownership and dependencies |
| Focused | Smallest relevant contract/unit/integration checks for the completed slice |
| Reconciliation | Exact source rows/executions/round trips/metrics and coverage agree |
| Runtime | Real authenticated local route/API/action against the intended database/path |
| Visual | Owner reviews and approves any changed user-facing UI |
| Operational | Backup/restore, process, CI, deployment, privacy, and rollback evidence applicable to the slice |
| Owner accepted | Project owner explicitly accepts the checkpoint in chat/handoff/register |

## Phase 1 exit acceptance

- [x] Canonical repository, branch, HEAD, remote, dirty state, tracked/untracked/ignored ownership recorded.
- [x] All 96 pages, 61 Route Handlers, Server Actions, redirects/layouts, and route-family conflict inventoried.
- [x] Product modules and the 52-page legacy `/intelligence` family classified.
- [x] Current configured DB, relevant schema families/counts/fallbacks, repository copies, and backup-only `v4-temp-sql` recorded.
- [x] Direct V3 dependency scope, safeguards to preserve, and authority prerequisites to reject recorded.
- [x] All 88 immediate workspace folders plus canonical/legacy worktree families classified without deletion.
- [x] Scripts, CI, scheduled automation source, environment names, external services, processes, and resource observation recorded.
- [x] Module contracts and complete analytics capability direction drafted.
- [x] Risks and acceptance gates recorded.
- [x] Reconcile internal document inconsistencies and carry the two access-limited machine-state unknowns forward with explicit evidence gates.
- [x] Owner accepted the route disposition, current legacy source database, backup-V4 conclusion, clean replacement folder boundary, module contracts, analytics first slice, folder classifications, and exact light Material dashboard baseline on 2026-08-01.
- [x] Owner explicitly authorizes Phase 2 and its allowed mutations.

Phase 1 does not require tests, process stops, database copies, UI review, builds, commits, or deployment.

## Platform acceptance

- [x] One canonical repository/path/branch is unambiguous.
- [x] Platform identity derives owner/workspace/account scope server-side.
- [x] Unauthorized cross-owner/account reads and writes fail safely.
- [x] Private cache/no-store and local loopback or hosted-session boundaries are verified.
- [x] Shared shell/navigation preserve all accepted module entry points.
- [x] Dashboard uses the owner-approved light Material UI design and complete left navigation; dark/reduced legacy or experimental shells are not substituted.
- [x] Trades, Calendar with week/month views, Analytics, Analytics Lab, Trading Rules, and every accepted destination in the controlling inventory remain present.
- [x] Workspace module summaries fail independently and distinguish ready, empty, limited, and unavailable.
- [x] The owner approved the current shell/dashboard visual baseline; later feature-specific visual refinement remains normal product work.

## Database and migration acceptance

- [x] Replacement development database path/name/schema owner is documented and owner-approved.
- [x] Legacy source is captured with SQLite online backup, timestamp, SHA-256, schema/migration rows, table counts, WAL state, and restore instructions.
- [x] Restore succeeds into a disposable target and counts/hashes/reconciliation are recorded.
- [x] Replacement never shares writes or silently dual-writes with legacy.
- [x] Every current Platform/Journal table has one logical module owner and migration namespace.
- [x] Academy/News/Watchlist/affiliate/Level Analysis/Journal storage cannot silently fall back to a different module's path.
- [x] No working DB, WAL, SHM, statement, secret, or raw private record is committed.

## Imports and source evidence acceptance

- [x] Supported broker formats and generic mapping behavior are inventoried and versioned; IBKR is the first verified adapter and generic mapping remains available for other brokers.
- [x] Raw source evidence is preserved privately with retention/deletion/export policy.
- [x] File type, size, parser bounds, safe filenames/storage, and authenticated owner/account access are enforced.
- [x] Preview distinguishes systemic blockers from contained row/chain issues.
- [x] Exact reimport is idempotent; overlapping/conflicting rows produce traceable outcomes.
- [x] Upload order does not affect final accepted execution ledger/round trips.
- [x] Source rows, normalized/corrected values, mapping, issues, decisions, and supersession remain traceable.
- [x] Historical January statement source reconciles to the accepted execution count or every difference has a recorded reason.

## Canonical execution ledger acceptance

- [x] Broker and manual executions share one owner/account ledger with source provenance.
- [x] Required facts use exact decimal/time/currency/instrument representations.
- [x] Manual entries use actual execution time/date, not entry/submission date.
- [x] A broker row matching a manual row enters Data Decisions rather than silently duplicating or overwriting.
- [x] Corrections/exclusions/supersession are versioned and original evidence remains.
- [x] Account/instrument/currency chain queries are deterministic under equal timestamps.

## Data Decisions acceptance

- [x] Trader sees affected source rows, executions, chain/round-trip consequence, and plain-language reason.
- [x] Correct, add missing execution, exclude, duplicate resolution, opening inventory, exact current/open position, and merge/supersede actions obey the factual contract.
- [x] Before/after impact preview identifies exact evidence counts, affected chain and downstream trade/day/analytics surfaces without guessing post-save financial values.
- [x] Decision records actor, time, reason, old/new facts, and rebuild result.
- [x] System rejects impossible “closed” outcomes while leaving factual final say with the trader.
- [x] Deep links connect an import's coverage issue to its filtered decisions and connect decisions to the affected trades, trading day and analytics.
- [x] One unresolved chain never hides unrelated valid records.
- [ ] Further Data Decisions visual refinement is owner-deferred; the current factual form is technically accepted and usable.

## Round-trip and open-position acceptance

- [x] Full history is ordered by owner/account/instrument/currency, execution time, and deterministic tie break.
- [x] Zero -> non-zero starts; partial entries/exits remain; return to zero closes; next execution begins a new round trip.
- [x] Flip execution allocation closes the old direction and opens the new direction exactly.
- [x] Random statement upload order and later historical correction rebuild identically.
- [x] Legitimate open positions remain visible and excluded only from unsupported realized metrics.
- [x] Missing opening inventory/ambiguous ordering contains the affected chain.
- [x] Stable identity/aliases preserve notes, tags, rules, reviews, and Level Analysis links after rebuild.
- [x] 1,072 January executions reconcile to 331 ready closed / 0 automatically legitimate open / 2 decisions; legacy 334 closed/2 open were not assumed truth.

## Trade Tracker and trading-day acceptance

- [x] Execution rows persist on their actual trading dates; UI presentation remains pending.
- [x] The data contract supports a round trip spanning days while executions retain actual dates and P/L defaults to close date.
- [x] Daily notes/rule reviews are owner/account/date-scoped and never merged because entered together.
- [x] Users can return to a specific trading date and see the factual day record.
- [x] Multi-day entry persistence works independent of final presentation.
- [ ] Separate future Trade Tracker swing/multi-day UI plan remains intentionally owner-deferred; current persistence does not guess the presentation.

## Journal Analytics acceptance

- [x] Each metric has versioned formula, facts, gross/net/fee, open/pending/excluded, currency, timezone/date, zero, display, and coverage policies.
- [x] Financial math is exact server-side.
- [x] Totals, daily, ticker, time-of-day, filters, and groupings share one calculation path.
- [x] Group totals reconcile exactly to headline totals/population.
- [x] Net/fee metrics become unavailable or partial when charge coverage is incomplete; missing fees are not zero.
- [x] No cross-currency sum occurs without conversion facts.
- [x] Realized drawdown/P&L path is not labeled account equity/mark-to-market.
- [x] Market/setup/risk/order metrics remain unavailable until their required facts and coverage exist.
- [x] Every response shows closed/open/pending/excluded coverage and reasons.
- [x] `/workspace`, `/trades`, `/analytics`, Calendar, and ticker consumers agree for identical scope.
- [x] The owner approved the current visible Analytics/dashboard baseline; later feature refinement remains normal product work.

## First analytics slice reconciliation

- [x] Closed count, win/loss/flat, gross profit/loss/P&L, average/median, best/worst, profit factor, expectancy are exact.
- [x] Daily, ticker, and entry-time groups reconcile to the same eligible population.
- [x] Legitimate open, pending decision, excluded, missing-fee and unavailable counts are displayed separately.
- [x] Deterministic tie/median/zero-denominator behavior is verified.
- [x] Authenticated local `/workspace`, `/trades/roundtrips`, and `/analytics` use the replacement DB/service and show no sample fallback.
- [x] Owner approves the visible result.

## Peer-module acceptance

### Academy

- [ ] Protected slugs/aliases validate and transfer tooling preserves existing progress/session/user facts; real production progress transfer remains externally pending.
- [x] Academy store has explicit ownership/configuration and Workspace summary failure is isolated.

### Watchlist

- [x] Current, symbol, archive, recap, stream, ingest, access and retention behavior are preserved.
- [x] Publisher/admin mutations are authenticated and storage is explicitly Watchlist-owned.

### News/content

- [x] Article routes/content/provenance/access and ingest are preserved.
- [x] Big Time automation is separated from Journal and retained for separate future scheduling/deploy review.

### Level Analysis/market data

- [x] Delivery validation/quarantine/idempotency/as-of provenance and trade links are preserved.
- [x] Provider/warehouse path is explicit; no cleanup-driven auto-discovery change.
- [x] Journal remains source of executions/P&L; market facts are supporting evidence with coverage.

### Coach/Review

- [x] Every accepted legacy coaching/review capability consumes published Journal/Analytics facts.
- [x] Execution-derived review signals do not claim trader motive; AI suggestions are labeled and trader-accepted facts remain distinct.

### Account/Affiliate

- [x] Account/profile/access/referral facts are preserved and explicitly owned.

## Route and legacy retirement acceptance

- [x] Every page/API/action/redirect has preserve/replace/compatibility/defer/reject disposition.
- [x] Every unique `/intelligence` behavior is mapped and technically accepted under delegated authority.
- [x] No public/bookmarked link is removed without redirect/communication decision.
- [x] V3 direct runtime/source/script/CI/env/storage dependency count is zero outside accepted archive evidence.
- [ ] Legacy route/code deletion list is exact, reversible by documented commit/archive, and owner-approved.

## Workspace cleanup acceptance

- [x] Planned `traderlink-platform` checkout was created only from an accepted preservation commit with the correct remote/branch and documented data/process boundary.
- [x] The original `traderslink.pro` folder remains intact as a non-running recovery/current-production reference; deletion is not required.
- [ ] Unique commits and dirty/untracked/private files are reconciled for each target.
- [ ] Active process, environment, scheduled task, provider warehouse, deploy, and backup dependencies are checked.
- [x] Exact target paths and proposed dispositions are recorded; no removal batch is authorized.
- [ ] Registered worktrees are removed through Git, not recursive folder deletion.
- [x] Separate projects/private-data/backups are never swept into app cleanup.
- [ ] Inventory is repeated after each batch and canonical app behavior is preserved.

## Operational/final acceptance

- [x] Replacement-focused checks pass at slice checkpoints; full regression/build/browser acceptance ran at the authorized Phase 6 boundary.
- [x] Backup restore and rollback rehearsal succeed.
- [ ] Production config uses one clean synchronized `main` and guarded deploy path.
- [x] Privacy/log/telemetry review finds no raw Journal leakage.
- [x] Resource/process plan avoids unnecessary persistent servers and identifies required scheduled processes.
- [ ] Final owner product acceptance remains intentionally after hosted preparation or the next complete dashboard review; only non-destructive local retirement classification has occurred.

## Explicit remaining items after Phase 6

- The Trade Tracker swing/multi-day presentation is owner-deferred. Current
  executions, dates, open positions and annotations persist without guessing a
  combined-day design.
- Real Academy and other hosted-source adoption waits for the four source
  credentials, reviewed fresh source backups and the authorized runbook.
- The replacement source is not yet on a clean synchronized `main`; no stage,
  commit, push, PR, merge or deployment is authorized by local acceptance.
- Broad folder/worktree reconciliation and physical cleanup remain optional.
  The preserved legacy app is inactive for local replacement development and
  no deletion is required.
