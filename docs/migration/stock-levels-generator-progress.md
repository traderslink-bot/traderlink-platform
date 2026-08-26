# Stock Levels Generator Progress

**Status:** Source implementation and corrective local commits complete;
Railway staging build and owner visual review pending
**Controlling plan:** [Stock Levels Generator Plan](stock-levels-generator-plan.md)
**Approved route:** `/levels`

## Confirmed workspace and ownership boundary

- [x] Coordinator confirmed the assigned Platform worktree is
  `C:\Users\jerac\.codex\worktrees\8fe4\traderlink-platform`, branch
  `codex/stock-levels-generator-20260826`, at production parent
  `5cf778be8f05372e6da1ab4c0e110b0278b788a3`.
- [x] Coordinator confirmed the canonical Levels runtime is
  `C:\Users\jerac\Documents\TraderLink\levels-system-post-mtf-handoff-stability`,
  branch `codex/levels-runtime-recovery-20260825`, at
  `9c51bfd7a6c981f0045813f47fa1c679f3e8d18e`.
- [x] Preserved the runtime's unrelated untracked `.git.orphaned-worktree-link-20260825`,
  `.vscode/`, and `data/` entries.
- [x] Checked the Coordinator register: no active worker owns the shared
  navigation, Help registry, Platform migration registry, reusable Potential
  Path component/CSS, or the new runtime endpoint.
- [x] Confirmed official Watchlist and Community Watchlists remain separate
  products. The existing Watchlist runtime is the sole publisher and this
  slice must not activate any Watchlist lifecycle.

## Contract and design inventory

- [x] Recorded the complete owner-approved product, API/runtime, quota,
  component/CSS, Help, migration and documentation inventory in the controlling
  plan before implementation.
- [x] Located the accepted visual baseline: `WatchlistV2PotentialPathCard` in
  `app/watchlist/live-watchlist-client.tsx` and its `watchlist-v2-*` selectors
  in `app/globals.css`. The existing card already supplies nearest levels,
  side-by-side support/resistance rows, level provenance and a closed `Full
  ladder` `<details>` control.
- [x] Confirmed the canonical runtime has EODHD daily/4h history and EODHD
  extended quote support; Moomoo is the currently selected same-day provider
  and Yahoo remains selectable. Same-day candles are supplementary context
  only; no provider selection or setting was changed.
- [x] Confirmed the canonical engine can produce output when 5-minute data is
  unavailable if daily or 4h candles remain usable. Daily/4h are the product's
  main structural context and same-day is supplementary, but this feature does
  not filter, re-rank, or otherwise change the established generator result.
- [x] Audited the original Stock Levels DTO mapping and removed its independent
  zone projection, nearest-level selection, and Full ladder formatting. The
  endpoint now uses the exact pure Watchlist snapshot-to-Potential-Path map,
  label/provenance, role-flip, ordering, nearest-level, and ladder/card
  construction; the Dashboard passes that result directly into the shared card.
- [x] Extracted the existing engine-output-to-`LevelSnapshotPayload`
  preparation boundary. The Watchlist manager passes its current state/context
  unchanged; the on-demand endpoint supplies only fresh engine output and
  factual symbol/reference-price/time, without reading or mutating Watchlist
  state, monitoring, a publisher instance, Discord, AI, session fallback, or
  prior-close state.

## In progress

- [x] Add the isolated runtime calculation endpoint, narrow DTO, exact
  Nasdaq/NYSE equity validation, EODHD reference-price requirement,
  in-flight deduplication and fifteen-minute shared cache.
- [x] Add Platform authenticated relay, persistent account quota receipt
  migration and truthful remaining/reset feedback.
- [x] Refactor the exact existing card/CSS into a shared renderer, build
  `/levels`, add the Stock Tools navigation item and contextual Help mapping.
- [x] Add the dedicated Stock Levels Help guide and registry coverage.
- [x] Update route/migration ownership records at the implementation
  checkpoint.
- [x] Complete focused source/diff review and create narrow corrective commits
  in both repositories.
- [ ] Send the Coordinator the revised preview-ready handoff; Railway staging
  build and owner visual review remain external release boundaries.

## Local commit checkpoint

- Platform feature baseline: `cd8b24651758abedbdead5b2e2a960d57182d3bf`
  (`feat(stock-levels): add dashboard generator boundary`).
- Platform reuse correction: `3547a059` (`fix(stock-levels): reuse canonical
  levels surface`).
- Canonical Levels runtime: `ba2ab19` (`feat(stock-levels): expose canonical
  generator safely`).
- Runtime presentation correction: `3bf9f26` (`fix(stock-levels): share
  Watchlist presentation`).
- Platform card-data correction: `2bc30703` (`fix(stock-levels): share
  Watchlist card data`).
- No commit was pushed, and no server, test suite, build, browser automation,
  provider call, migration execution, deployment, restart, or configuration
  change was performed.

## Constraints retained

- No local server, Vitest/broad test run, provider call, migration execution,
  browser automation, build, staging, push, deployment, restart or variable
  change has been performed.
- UI approval is the first acceptance goal. No visual approval, staging result
  or production approval is claimed.
