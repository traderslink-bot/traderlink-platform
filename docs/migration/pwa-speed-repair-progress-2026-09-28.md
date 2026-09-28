# PWA speed repairs — 2026-09-28

Controlling scope: the owner approved all five findings in the [speed audit](pwa-speed-audit-2026-09-28.md). Source parent: `705385767d45704320cedb02b967d6341027ecc6`.

## Current checkpoint

Package A was released by the Coordinator and rolled back; it is NOT live. Package B remains excluded and unverified. See the release outcome below. The canonical checkout is older than production and contains unrelated mixed work. Its existing SW, offline-capture and Watchlist files remain byte-identical to their pre-task versions. Exact-production candidate changes are preserved separately as narrow patches; canonical HEAD and index must remain unchanged.

## Coordinator-reported release outcome — 2026-09-28

Follow-up: Coordinator relayed owner authorization to correct the startup blocker. The separately tracked [startup integrity correction](runtime-integrity-startup-progress-2026-09-28.md) precedes a new Package A-only port. Package B remains excluded. This supersedes the earlier hold for preparation only; no new release has been performed by this task.

- Package A `23592e733330864a578c357633412ad20e60f4e1` was pushed to production main and built successfully on Railway.
- During volume-backed startup, public `/api/platform/health` returned HTTP 502 while the mandatory SQLite integrity baseline ran. The Coordinator applied the owner's availability rule and immediately queued fast-forward rollback `f702f7254`.
- Package A subsequently completed startup successfully, then Railway stopped it for the queued rollback. No PWA code/runtime exception was observed. This does not establish complete functional acceptance of Package A.
- The rollback tree exactly restores production `705385767d45704320cedb02b967d6341027ecc6`. Rollback deployment `342ce1d8` is SUCCESS/RUNNING; public health returned HTTP 200, ready, sqlite_single_node, schema 129.
- Remaining release blocker: the known zero-overlap persistent-volume startup outage, not a demonstrated Package A defect. Package B was not released.
- This outcome is evidence reported by the release Coordinator, not a fresh independent hosted check by this task. Existing patch/commit evidence remains the immutable pre-release checkpoint.
- No feature corrections or another release are started by this task. Reconcile the startup availability boundary before another release attempt.

### A — bounded fixes and diagnostics

- Workspace news card: subscribe before initial refresh, one healthy-startup download, coalesce changes during a request, pause the page's stream/downloads while hidden or offline, refresh on return, request timeout and bounded retry. Failed refreshes retain the last successful headlines. Push handlers and alert delivery are untouched.
- Scanner payload: the card requests only ID, ticker, headline and read state. Full content is fetched on article selection; the article drawer is loaded on demand. Existing default and expanded responses remain compatible. Article lookup preserves authentication, active-user validation and scanner channel filtering. Loading/failure copy is plain language.
- Offline page capture: skip hidden/offline scheduling and capture, resume when visible, skip successful duplicate snapshots with identical scope/route/provenance/content. Explicit refresh invalidates the duplicate guard; failed storage does not mark the snapshot saved.
- Navigation: after 12 seconds without a network response, use the existing offline fallback. No authenticated HTML caching or notification behavior changes.
- Workspace latency: add numeric timing for analytics summary, review summary, top tickers and trade library. Ordinary slow-log throttle remains 60 seconds; severe requests at least 2.5 seconds are logged at most once per 5 seconds. No extra query or user data logging. The historical 5.1-second outlier remains unattributed; this is diagnostics, not a claimed server-speed fix.

Source allowlist A:

- `app/(dashboard)/workspace/workspace-news-scanner-card.tsx`
- `app/api/platform/news/workspace-scanner/route.ts`
- `app/pwa/offline-projection-capture.tsx`
- `app/sw.ts`
- `app/(dashboard)/workspace/page.tsx`

### B — Watchlist extraction, awaiting build measurement

- Move detailed analysis cards, supporting render helpers and TradingView chart into `watchlist-detail-content.tsx`, loaded dynamically by the existing detail clients.
- Remove static detail-widget imports from the shared list module. All 62 original function bodies are preserved exactly across the two files; no displayed card or financial calculation is removed.
- Source size is not transfer size. No production chunk/download savings or installed-phone improvement has been measured. This is a separate, unverified experiment and must not be treated as release-ready.

Source allowlist B:

- `app/watchlist/live-watchlist-client.tsx`
- `app/watchlist/watchlist-detail-content.tsx`

## Verification and remaining work

- Targeted TypeScript transpilation/syntax and ESLint were run on the seven candidate source files. Zero syntax/lint errors; one pre-existing unused helper warning in `app/watchlist/live-watchlist-client.tsx`, `@typescript-eslint/no-unused-vars`, `cleanLevelMapCardBody`.
- Source extraction comparison confirms all 62 Watchlist function bodies are unchanged. Original colliding canonical files were checked against exact pre-edit copies.
- At the source handoff, this task had run no Vitest, test suite, full typecheck, production build or hosted browser test. The Coordinator subsequently reported Package A's successful Railway build and startup, followed by rollback as described above. Package B's production-aligned build/chunk measurement remains outstanding; no clone, worktree or branch switch was created by this task to bypass the mixed-checkout boundary.
- Before release: integrate the allowlisted patch on the current release parent, complete focused behavior/type verification, check actual build chunks for B, and verify scanner recovery, article opening, offline fallback and account switching. Real installed Android measurement and phone push receipt remain separate checks.
- Help Center app guide reviewed: it already explains saved-page fallback, last-updated copies and independent push alerts. These changes do not change installation, account selection or alert controls; no guide edit is required for this checkpoint.
- This task made no push, deployment, Railway configuration, database or subscription changes. The Coordinator's later release and rollback are recorded above.

## Preservation evidence

Original canonical blob hashes, restored and verified before candidate preparation:

- `app/sw.ts`: `2462db07e7b9496c18800c531bdd557efe0a3665`
- `app/pwa/offline-projection-capture.tsx`: `be61cb4a4f3de17354b3a7db19821397aa59c8ff`

Patch and commit evidence is recorded in `qa-evidence/pwa-speed-repair-20260928.json` when the checkpoint is finalized.
