# Watchlist notification price copy correction

## Scope and implementation

Owner-directed correction on October 28, 2026, relayed by the active PC
Watchlist chat. Remove generated analysis publication/reference-price and
original-versus-current price/percentage comparisons from Watchlist post and
notification text. This is separate from the plan-only standalone recap work.

Implementation is complete locally. Production release is owner-authorized
and belongs to the Coordinator; no deployment is claimed by this record.

1. Audited initial, first-analysis, manual-update, automatic-boundary, category,
   Free Chat, X, push and email text builders.
2. Removed generated comparison lines from Runtime Discord and Platform
   push/email; removed both obsolete comparison-formatting functions.
3. Kept update/first-analysis classification, automatic or owner attribution,
   category notes, links, mentions and all delivery decisions unchanged.
4. Updated Help descriptions of alert copy and added focused offline coverage.

Initial link posts, category moves, Free Chat and default X captions were
already free of analysis reference-price comparisons in the inspected source;
their builders are unchanged and covered by tests. Analytical levels remain
in analysis content/images. Intentional owner-written Discord or X text can
still contain prices or percentages; it is not filtered or rewritten.

No database/schema changes, stored price/context/history changes, ticker-detail
card changes, Potential Gain baseline/calculation/card/dedicated-share changes,
live-price changes, recipient/tag/toggle/approval changes or historical-post
rewrites. Existing immutable approved chunks and owner text are not rewritten
in storage; these changes apply to newly constructed generated copy. No posts,
notifications, provider requests or AI calls were sent during verification.

## Source and ownership

Coordinator confirmed the existing clean source paths and extended the worker
assignment to this copy slice. No new checkout or worker Git mutation.

- Platform: `/home/traderlink/projects/watchlist-gain-card`, branch
  `codex/watchlist-gain-card-20261027`, parent
  `3115cb6fe60f8543f82b08c157d43d60be204d26`.
- Runtime: `/home/traderlink/projects/watchlist-gain-runtime`, branch
  `codex/watchlist-gain-card-runtime-20261027`, parent
  `255a86173eb9c62ec2c517bda424fae5c2031966`.
- Preserve preexisting Platform `public/sw.js` dirt and untracked
  `docs/migration/standalone-end-of-day-ticker-recap-plan.md` unchanged/excluded.
  Recap plan SHA256 remains
  `ca2952862e690d47c44c8398dcb9f92673bff3e503d7a26356fad97f2f02c0db`.

## Release allowlist

Platform:

- `src/modules/watchlist/server/notifications/watchlist-analysis-update-copy.ts`
- `src/modules/watchlist/server/notifications/watchlist-publication-notification-contract.ts`
- `src/modules/watchlist/server/notifications/__tests__/watchlist-notification-price-copy.node-test.cjs`
- `src/modules/help/watchlist-guides.ts`
- `docs/migration/watchlist-notification-price-copy-progress.md`

Runtime:

- `src/lib/ai/traderslink-ai-read-publication-preview.ts`
- `src/lib/ai/watchlist-analysis-update-context.ts`
- `src/tests/watchlist-analysis-update-time.test.ts`

No change to existing immutable review/event field schemas; stored price/time
context is still parsed and retained for compatibility, but no longer rendered
as alert comparison text. No migration or hosted-variable change required.

## Verification

- Platform: 15 tests passed using `node --test` on the new price-copy CJS test
  and existing `watchlist-move-free-chat.node-test.cjs`. Covers initial/first/
  updated copy, positive/negative/unchanged/missing prices, push/email, category
  destinations, Free Chat, X, preserved custom text and mocked move delivery.
- Runtime: 24 tests passed using `node --import tsx --test --test-concurrency=1`
  on `watchlist-analysis-update-time`, `traderslink-ai-read-publication-preview`,
  `watchlist-discord-heading`, `watchlist-gain-card-label` and
  `approved-analysis-discord-delivery` test files.
- Runtime: four mention persistence/validation/payload/legacy tests passed
  separately with a positive `--test-name-pattern` in
  `watchlist-discord-mentions.test.ts`.
- Runtime full `tsc --noEmit -p tsconfig.json` passed.
- Platform focused strict typecheck of both copy/contract modules and ESLint
  of those modules plus the Help guide passed. No production build needed for
  the narrowly scoped text-rendering change; release verification remains
  Coordinator-owned.
- Explicit source diff/allowlist and whitespace checks; recap plan hash checked.

Known baseline test/tool limitations, not hidden passing results:

- The broader Runtime 29-test run had 28 passes and one preexisting failing
  mention-panel test. Its greedy script regex joins two HTML script blocks,
  producing `Unexpected token '<'`. Unchanged HEAD bytes reproduce the failure;
  both actual scripts parse separately. No unrelated panel/test fix included.
- Legacy Platform `verify-watchlist-publication-notification-contract.mjs`
  cannot run directly through the current TSX ESM/CJS bridge (named-export
  interop error). It is not counted as passed. The native CJS tests cover the
  changed current copy; legacy packaging verifiers remain historical.

## Production boundary

Coordinator must capture exact commits/parents, complete file lists and source
hashes; preserve the two excluded Platform files, serialize the Platform and
Runtime releases, verify deployed source and health, and return deployment
receipts. No real test send or retroactive Discord edit is requested. Newly
generated defaults after release omit the reference-price comparison; already
delivered content and intentional custom text remain untouched.
