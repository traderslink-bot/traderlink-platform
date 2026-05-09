# Feature Completion Plan: Saved Import To Coaching Loop

## Summary

Implement the highest-value launch path: a user can paste/upload broker
executions, review/repair the import, save it to local SQLite persistence, and
see `/trades`, `/analytics`, `/coach`, and `/review` update from saved trades
instead of sample-only data.

Auth, billing, and visual redesign are out of scope for this branch. The v1
implementation uses a deterministic local demo workspace/account until auth is
added later.

## Key Implementation Changes

- Add local SQLite persistence using `better-sqlite3`.
  - DB path default: `data/trader-intelligence.sqlite`.
  - Env override: `TRADER_INTELLIGENCE_DB_PATH`.
  - Store import batches, rows, issues, repair items, normalized executions,
    saved trades, execution links, grouping diagnostics, execution-feedback
    summaries, decision-review jobs, analytics report snapshots, and route
    metadata.
  - Do not store raw CSV text by default.

- Replace the in-memory-only import commit path with a durable repository
  adapter.
  - Keep `buildImportCommitPlan()` as the source of commit truth.
  - Commit all import artifacts in one SQLite transaction.
  - Enforce duplicate file and duplicate trade fingerprint checks before commit.
  - Save open trades, but keep their decision-review jobs blocked until flat.

- Add server routes for the real import flow.
  - Preview, commit, discard, import-batch summary, saved trades, latest
    analytics, latest coach, and latest review read APIs.
  - Saved-data APIs fall back to clearly labeled sample data only when no saved
    imports exist.

- Wire the end-user feature loop.
  - `/import-dry-run` can save a ready import.
  - `/imports` shows committed/import-preview batch summaries.
  - `/trades` and `/trades/[tradeId]` read committed saved trades.
  - `/analytics`, `/coach`, and `/review` use saved data first.

- Generate saved analytics and coaching after import commit.
  - Build a saved report from committed closed trades.
  - Persist execution-feedback summaries produced by the commit planner.
  - Queue decision-review jobs for closed trades.
  - Persist diagnostics for skipped/open/unavailable decision-review cases.

- Continue improving generic imports inside the same launch path.
  - Preserve mapping review for `generic_execution_csv`.
  - Show delimiter, detected fields, missing fields, mapping confidence, and
    required acknowledgements before save.
  - Keep broker-specific and generic mapped CSV paths under the same commit
    workflow.

## Latest Status - 2026-05-08

The saved import loop is now past the first launch-path implementation slice:

- local SQLite persistence is in place for saved imports, trades, reports,
  review jobs, diagnostics, and route read models
- `/import-dry-run` can preview, repair, and save imports into SQLite
- `/imports`, `/imports/[batchId]`, `/trades`, `/trades/[tradeId]`,
  `/analytics`, `/coach`, and `/review` now prefer saved data over sample data
- import history/recovery and batch detail pages now expose clearer duplicate,
  repair, saved-output, and decision-review diagnostic actions
- repaired CSV values can carry forward into save attempts without storing raw
  CSV text by default
- generic broker CSV hardening now covers odd headers, mixed timestamps,
  partial exits, fee/cost columns, duplicate-like fills, zero/blank quantity
  repair cases, and defensive short import parsing

Important scope correction:

- Trader Intelligence remains a long-side day-trade review and coaching product
  for the current beta.
- Short executions may be parsed and saved defensively when they appear in a
  broker CSV, but short-specific coaching is not part of this launch path.
- Do not expand short-trader coaching, short-seller SEO, borrow/locate logic,
  squeeze-risk alerts, or short-specific performance promises unless a later
  plan explicitly adds that scope.
- If a saved short trade appears before that future scope exists, app copy and
  read models should stay conservative: import/storage can be factual, while
  coaching should avoid overconfident short-specific claims.

## Test Plan

- Unit tests:
  - SQLite migrations create the V1 tables.
  - Repository commits ready imports transactionally.
  - Rejected rows, duplicates, open positions, mapping review, P/L review, and
    anomalies block or require acknowledgement correctly.
  - Saved trade/read-model queries return committed data and ignore discarded
    previews.
  - Analytics/coach/review read models prefer saved reports and use sample
    fallback only when no saved data exists.

- Integration tests:
  - CSV preview route returns commit plan and batch ID.
  - Commit route saves executions, trades, diagnostics, summaries, and jobs.
  - Committed import appears in `/api/trades`.
  - Latest analytics/coach/review APIs update after import commit.
  - Duplicate import is detected on the second commit attempt.

- Browser tests:
  - User opens `/import-dry-run`, pastes a valid generic/IBKR CSV, reviews
    required decisions, saves import, and lands on an import summary.
  - Saved trade appears in `/trades`.
  - `/analytics` and `/coach` no longer show sample-only state after a saved
    import.
  - Rejected-row import cannot be saved.
  - Generic mapped CSV requires mapping review before save.
  - Open-position import saves as open but does not create completed-trade
    coaching.

## Assumptions And Defaults

- Persistence target: local SQLite via `better-sqlite3`.
- Feature priority: complete import executions -> save trades ->
  analytics/coach/review updates.
- Auth is deferred; use deterministic local workspace/user/account IDs.
- UI redesign is deferred; add only minimal controls needed to complete the
  feature loop.
- Raw CSV text is not stored by default.
- Market context remains owned by `levels-system`.
- Generic imports remain review-gated before commit.
- Open trades are saved but excluded from completed-trade coaching until flat.
- Short-trade imports are defensive/limited support only for this branch; the
  current launch focus is long-side execution review and coaching.
