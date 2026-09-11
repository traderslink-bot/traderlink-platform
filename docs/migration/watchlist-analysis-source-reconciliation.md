# Watchlist analysis source reconciliation

Status: required before release; reconciliation not yet implemented.

Controlling plan: [Analysis Quality](watchlist-analysis-quality-plan.md).

## Verified source boundary

Read-only runtime `git ls-remote origin refs/heads/main` returned
`7f121a2d6b0e1c9266e3e5f414b3e24ada95911e`. This agrees with the locally stored
origin/main ref. It does not prove Railway's deployed SHA or configured branch.
No fetch, push, migration, restart, deployment or setting change occurred.

The current analysis branch is missing these three commits from that main:

- `894f2db4f36ff768f415c64d85c74310fbd9d165`: authenticated canonical article
  lookup, processed content/provenance in AI input, fail-closed RSS authorization,
  and exclusion of private content from public recent-news serialization.
- `a7a6bc6d2539603a6b743cf0b12aa2e30065a2e9`: matching packet-source assertion.
- `7f121a2d6b0e1c9266e3e5f414b3e24ada95911e`: narrowed recency type contract.

Current branch source still uses cached/local-script research and turns lookup
errors into empty research before RSS fallback. Its prior green analysis tests
do not establish the required authenticated article-source behavior. Preserve
the newer main implementation instead of recreating a competing selector.

## Exact runtime reconciliation surface

New files already present in main, absent on this feature branch:

- `src/lib/live-watchlist/official-watchlist-article-source.ts`
- `src/tests/official-watchlist-article-source.test.ts`

Existing files requiring selective integration:

- `src/lib/live-watchlist/recent-website-articles.ts`
- `src/lib/live-watchlist/stocktitan-catalyst-feed.ts`
- `src/lib/monitoring/manual-watchlist-runtime-manager.ts`
- `src/lib/ai/traderslink-ai-read-service.ts`
- `src/tests/stocktitan-catalyst-feed.test.ts`
- `src/tests/traderslink-ai-read-service.test.ts`

Preserve this branch's one-call, reference/admission, owner-review, audit,
automatic-OFF and dependency changes in overlapping files. Do not replace the
manager or service with the older full main file. Do not blanket cherry-pick a
historical range or absorb unrelated source differences.

## Platform boundary and next proof

Platform Git history contains `34fcc57c6` for the canonical authenticated route
`app/api/news/watchlist-ai-source/[ticker]/route.ts` and News store selection.
That route is absent from this assigned worktree. Its locally stored origin/main
contains that feature, but this checkpoint did not verify Platform's remote or
Railway tip. Reconcile its exact current route/store/display changes separately,
preserving mixed Watchlist UI edits already in this worktree.

After selective runtime integration, use mocked official lookup fixtures to
prove one eligible article and its exact processed content enter the request;
only an authenticated no-eligible result enables RSS fallback; unavailable,
malformed and wrong-ticker/session results do not. Ensure existing generation
tests cannot call a configured real endpoint. Recheck private-content exclusion.
Then reconcile Platform source and repeat the relevant combined contracts.

No historical packet is reconstructed by this work. No claim about live PDSB,
TNON, FTFT or AEON behavior follows from these branch comparisons.
