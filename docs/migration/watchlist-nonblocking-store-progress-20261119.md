# Watchlist store responsiveness — November 19, 2026

## Assignment and scope

Coordinator-assigned workspace `/home/traderlink/projects/community-admission-production-repair-20261119`, branch `codex/community-live-store-nonblocking-20261119`, exact base `fcd190742d7f35a3d9bf1b76d50ab36d9bf7fe01` (parent `08cf326aa9326c40bf354142fc7f2eae8eaa907c`). Root owns integration, commits and any release. This source-only repair is separate from the already-live Watchlist feature batch and held Chart work.

The synchronous SQLite writer wait in `upsertHealth` and `upsertPatch` can freeze unrelated Node requests while another connection owns the writer. Normal card archive lookup/pruning and archive insertion contain the same write wait and must be covered, or that path can still freeze after the card write. Reads themselves, the Neon branch and standalone owner actions are not broadly redesigned.

## Correction

- Use Core's borrowed nonblocking SQLite helper for health/card transactions and their normal archive prune/insert writes. The helper acquires `BEGIN IMMEDIATE` with temporary zero busy timeout, restores the exact original timeout on every attempt, and yields between attempts within its existing five-second acquisition budget. Only acquisition contention retries; callback/commit failures propagate.
- Keep process-local card submissions in per-symbol order, including archive lookup/finalization, and health submissions in their own order across store instances. Each original caller receives its own result or failure; failure releases the next submission. Settled tails remove themselves. This is neither a durable queue nor permission to coalesce/drop work. Acquisition budgets start when an ordered operation reaches its write; queued requests can wait for earlier accepted work. No globally configured timeout changes.
- Read the current symbol inside the newly acquired write transaction before merging a card, retaining newer durable ticker prices and revisions. Do not regenerate incoming card/event times, archive identities or prune cutoffs during retries. Existing publication identities and saved owner content remain intact.
- Preserve `upsertTickerData` byte-for-byte, including its existing yielding retry loop. Ingest already awaits these store calls before recap capture, broadcast and success acknowledgement; no caller, authentication/revocation, cursor, scanner, provider, approval, notification or worker change is needed.
- Keep archive insertion's existing insert-or-ignore identity and fixed serialized committed snapshot. Archive retention remains three days with the same strict-less-than cutoff and same-day reactivation rules. No migration or dependency change.

## Verification

Exact borrowed dependency: `src/modules/platform/server/database/nonblocking-sqlite-write.ts`, SHA-256 `07c39202988638c4f7425121b24ddbc638eb411c63fd595e6205e018627c4909`. This untracked file belongs to Core, was not edited, and is excluded from our allowlist. Root must integrate its approved exact helper before this consumer. Source qualification of that helper remains Core's own gate.

Final focused native store suite: **49/49 passed**, including six new cases (two parameterized health/card ordering cases, fresh durable-state merge, non-busy rollback followed by a successful queued request, original expiry cutoff and lock-contended archive insertion). Tests use actual two-connection SQLite writer locks with timer-based release, so the old synchronous busy wait would prevent timely release. Existing tests retain ticker stale/revision rules, publication identity, gain behavior, immutable archives and same-day reactivation.

Strict focused TypeScript 5.9.3 graph: **503 source files, zero diagnostics**. Targeted ESLint: **zero errors and zero warnings**; the external-package harness reports React-version auto-detection fallback because the assigned checkout has no dependency directory. No React source was changed. `git diff --check` passes. The six tests initially omitted two required `priceWhenPosted` fields; these fixture typings were corrected and all49 tests rerun. The initial external type harness also needed explicit Node/native/Chai declarations; initial diagnostics are retained rather than reported as product failures.

No dependency install/copy/symlink was created. Focused tests used the Root-qualified dependency tree at `/home/traderlink/projects/community-combined-production-review-20261117/node_modules`: Node24.22.0, better-sqlite3 **12.9.0**, native SQLite **3.53.0**. External Vitest config resolves this assigned source and initializes the current210-migration pristine fixture in isolated temporary storage; no hosted database access. One test process/worker,512MiB heap, common heavy flock plus exclusive QA marker, actual MemAvailable about7GiB and no pressure. Own guards released after both suites.

Machine receipts and exact reproduction harness: `/tmp/watchlist-nonblocking-qa-20261119/` (`vitest-final.log`, `types-qualified.log`, `lint-final.log`, `run.py`, `vitest.config.mjs`, `typecheck.cjs`, `lint.cjs`). Earlier evidence remains untouched. This is technical source acceptance only, not an exact integrated build or hosted acceptance. No build, browser batch, production query, restart, real provider/AI/delivery, commit, push or deployment performed.

Help review: `src/modules/help/watchlist-guides.ts` does not need copy changes; existing user workflow and display remain unchanged. Do not claim that this scoped repair removes every synchronous SQLite writer elsewhere, or that a five-second failed acquisition silently queues durable work. Existing caller errors remain errors and are never falsely acknowledged.

## Handoff

Our explicit allowlist is the store, its existing focused test file, this progress document and the one-link addition to the existing Watchlist Runtime Dashboard Admin Plan. The untracked Core helper is a separately pinned dependency. Root owns combined caller/erasure/native verification, final Git integration, release approval and Railway one-writer checks. No staged files or refs were changed.
