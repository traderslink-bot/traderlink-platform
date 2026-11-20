# Stock Levels Generator Plan

**Status:** Current-source and real-market audits recorded; owner-authorised Generator reference-price correction verified locally; not deployed
**Progress:** [Stock Levels Generator Progress](stock-levels-generator-progress.md)
**Approved feature boundary:** Authenticated Dashboard Stock Levels generator
**Route:** `/levels`

**Related owner administration:** [Stock Levels Admin Activity Plan](stock-levels-admin-activity-plan.md)

## Owner direction - 2026-11-20 (Eastern)

The primary audience trades micro-cap and nano-cap stocks. The Generator must
prioritise meaningful, useful support/resistance areas and an uncluttered map.
Finding more candidate levels is not, by itself, an improvement.

- Select levels for convincing structural evidence, such as clear reactions,
  substantial rejection, repeated defence or agreement across timeframes. A
  single decisive reaction may matter; repeated minor fluctuations alone do
  not establish a useful level.
- Consolidate nearby or overlapping evidence into distinct areas. Evaluate
  selection and spacing against the volatility and liquidity of the intended
  stocks so minor price variations do not become a stack of redundant rows.
- Treat volume as supporting evidence alongside price behaviour. Increasing
  volume influence must demonstrate better level selection before adoption.
- Show fewer levels when fewer qualify. Do not fill a side or a price interval
  merely to reach a desired count. Preserve meaningful farther-away structure
  for large moves when evidence supports it.
- Apply the same relevance standard to Full ladder: it can expose additional
  useful structure, but must not become a dump of every detected candidate.
- Assess future tuning for relevance, distinctness, readability and useful
  coverage on micro/nano-cap examples, including sparse trading and large
  moves. More rows or stronger labels alone do not establish an improvement.

This direction records selection/quality requirements for future work. It does
not itself change scoring, provider settings, the approved daily/4h input
boundary, the shared Watchlist presentation, or the live runtime.

### Owner working and retention rules

- The owner subsequently directed this chat to select stocks below $20M market
  capitalisation and generate/test levels itself using available market-data
  access. An existing offline warehouse is not a prerequisite: use the
  established market-data gateway and dedicated standalone Generator endpoint
  for the bounded audit, without copying credentials to disk or creating
  account saved maps, quota receipts or Watchlist entries. The feature chat
  owns selection, generation and quality review; release/Git authority remains
  with the Coordinator.
- The owner expanded the audit to the exact tickers AKAN, MEDS, LABT, BNAI,
  ELOG, VWAV, NXAT, NIVF, RAYA, GNLN, GDHG, CYAB and SPRC. Test every requested
  symbol and explicitly account for reverse splits. Compare adjusted history
  against raw prices/volumes and effective split factors; verify the 4h basis
  against raw intraday evidence. Account for ticker changes, repeated splits,
  provider rounding and announced future events. Do not double-adjust
  already-adjusted candles, classify large historical prices as invalid solely
  because of their size, or treat missing current-symbol event metadata as
  proof that no split occurred. Split-adjusted price correctness and practical
  usefulness of an old level are separate assessments.
- Audit first. Before any feature-code edit, explain the demonstrated issue,
  the smallest proposed change, expected effect and how it will be verified.
  Preserve behavior that is already working. A different implementation,
  newer scoring path or additional indicator is not itself a reason to change
  the feature; a valid outcome of the audit is to recommend keeping it.
- Reference-price follow-up: the controlling September AGRZ correction in
  supporting Runtime `docs/stock-levels-agrz-freshness-2026-09-09.md` superseded
  the older 20-minute delayed-price allowance with a 60-second active-session
  limit. The current Alpaca path retains that limit. The November 20 ELOG/CYAB
  failures exposed its availability trade-off for quieter stocks. Distinguish
  acquiring a fresh price more reliably from accepting an older price. Do not
  silently relax the limit, switch providers or label an old observation as
  current. After the historical-input/reference-price distinction was explained,
  the owner delegated the choice ("you do what works best"). Implement a
  Generator-only policy accepting a genuine last trade from the same New York
  date and trading phase without the one-minute limit. Preserve its actual
  timestamp and label new trade-backed maps "Last traded price". Reject
  future, missing, invalid and prior-session trades during active trading;
  preserve the existing 96-hour closed-market rule and Yahoo freshness limit.
  Keep Private Watchlists on their existing strict policy and leave historical
  inputs, scoring, split adjustment and provider selection unchanged.
  Old saved maps without trade provenance retain the Reference price label.
- Track the exact paths, purpose and provenance of any temporary audit data
  or generated outputs created for this work. Use existing approved data
  read-only when possible. Delete this audit's temporary copies and outputs
  once comparison and review no longer need them; retain only the small
  findings/evidence record needed to explain the result. Do not delete shared
  source datasets or another task's files as part of that cleanup.

## Proposed review and improvement sequence - 2026-11-20 (Eastern)

1. **Qualify the baseline.** Establish the deployed scoring mode, effective
   calculation settings and historical-data source through read-only evidence.
   Trace the Generator's daily/4h calculation through candidate detection,
   clustering, ranking and both displayed inventories. Preserve other feature
   lanes; reconcile overlapping ownership before an edit touches their scope.
2. **Establish representative comparison cases.** Use real historical candles
   with documented provenance and confirmed micro/nano-cap relevance at the
   case date; low share price alone does not establish market capitalisation.
   Include sparse trading, large moves, reversals, repeated tests, split
   adjustments and limited-data cases. Separate generation inputs from later
   outcome candles and reserve unseen dates/stocks for evaluation. Qualify
   available source data first; synthetic fixtures test mechanics and do not
   establish real-world level quality.
3. **Complete discovery before tuning.** Record one consolidated findings
   ledger covering redundant rows, weak evidence, missing useful areas,
   overstated strength, stale/broken structure and insufficient data. Assess
   clutter alongside useful near-price and farther-away coverage. Review the
   chart evidence as well as counts and forward outcomes; a later break alone
   does not establish that a level was invalid.
4. **Explain justified changes before implementation.** Present the findings,
   evidence, smallest proposed correction and expected effects before editing
   feature code. Recommend no change where no defect or measured improvement
   is established. Any correction proceeds as one bounded batch, including
   volume treatment and spacing only where comparison supports them. Keep
   calculation and selection in the canonical engine; preserve accepted
   Watchlist behavior and avoid a separate Platform engine or cosmetic
   filtering that conceals poor selection. Do not choose an arbitrary output
   count or force empty areas to contain levels.
5. **Verify against the frozen baseline.** Run focused checks, then the
   applicable broader regression and held-out comparisons at the completed
   slice. Compare evidence quality, redundant/closely overlapping areas,
   useful coverage, missing structure and label calibration. Check shared
   Watchlist consumers and factual unavailable states. Record improvements
   and regressions rather than declaring success from fewer rows alone.
6. **Review and hand off.** Present before/after maps with the reason each
   retained or removed area matters. Any requested private preview uses the
   coordinated isolated VPS lane; review applicable responsive/theme states
   and Help alignment. Preserve owner visual acceptance and Coordinator
   authority for commits, integration, Railway staging and release.

This is the planned sequence, not a claim that discovery, data qualification,
comparison runs or implementation have occurred. Existing provider-call,
preview, shared-resource and hosted-operation boundaries still apply.

## Owner-approved correction - 2026-09-09

This correction supersedes the earlier quote, same-day context, timestamp, and result-cache provisions below: current price uses EODHD first and Yahoo on failure/invalid/stale data; historical daily/4h candles remain EODHD-only, with no same-day inputs to the level engine. Price observation and calculation times are displayed separately. Static Support/Resistance sides follow reference price. New requests re-resolve price rather than reusing a 15-minute generated result; successful calculations retain the existing quota policy and owner exemption.

- [x] Local repair implemented.
- [ ] Hosted release and rendered acceptance.
- Progress: [Stock Levels price repair](stock-levels-price-repair-2026-09-09.md).

## Product contract

This plan records the complete owner-approved first version. It is not a
Watchlist feature and does not alter Watchlist membership, monitoring,
Discord publishing, AI generation, Premium access, or live Watchlist state.

1. Add an authenticated Dashboard route at `/levels` and a `Levels Generator`
   entry under `Stock Tools`.
2. Accept a syntactically valid ticker and provide a `Get Levels` action.
   Missing exchange or security metadata is not a rejection reason. Invalid
   tickers or requests without sufficient trustworthy reference/candle data
   receive the factual unavailable result `Data is not available for this
   ticker right now, try again later.`; the feature never invents a map.
3. Reuse the existing Watchlist ticker-detail **Potential Path Levels**
   component, outer card hierarchy and its exact responsive CSS rather than
   redesigning or recreating the card. The Dashboard embeds the established
   Watchlist card CSS context without its public navigation.
4. Render the ticker, the price when levels were generated, one calculation
   date/time, complete support and resistance columns, level
   strength/type/provenance, and a collapsed-by-default expandable Full ladder.
5. Get the calculation-time reference price through the existing EODHD quote
   path. It is labelled `Reference price`, not real-time or live. If a
   trustworthy positive reference price is unavailable, return an honest
   unavailable state and do not produce a map.
6. Invoke the canonical Levels runtime for all calculation and use its real
   market data. The primary map is structural daily/4h evidence. Keep EODHD
   daily/4h history and use the currently selected same-day provider (Moomoo
   at this checkpoint; Yahoo remains selectable) only as supplementary
   current-session context. Platform does not copy or reimplement Levels
   calculations.
7. Add a dedicated runtime endpoint protected by a server-only token. Its
   response is the narrow factual DTO required by the card; it validates the
   syntactically valid symbol, coalesces concurrent requests, and shares a
   fifteen-minute result cache.
8. Enforce Platform account-scoped persistent limits: five fresh calculations
   per rolling hour and fifteen per New York trading day. A runtime cache hit
   does not consume a limit. The UI reports factual remaining/reset information
   and never fabricates availability. The configured stable owner Discord
   subjects used for Watchlist navigation are exempt: they do not consume or
   receive quota receipts, and every `/levels` response adapter (initial
   saved-map load, generate/regenerate, and delete) renders their null quota
   payload exactly as `No request limit`.
9. Keep the approved Help mapping and link the on-card question-mark directly
   to the public Watchlist how-it-works guide. Do not retain a separate Stock
   Levels Help button or a local `How to read this map` explainer panel.
10. Preserve the current card's responsive behavior and its existing visual
    language exactly. Session-history details are container-only adapters: on
    desktop they span the full original card width, use the same closed-card
    surface treatment and page-title-sized blue summary text; the first prior
    map has a doubled vertical gap. Mobile uses smaller proportional spacing
    and title sizing without overflow or a narrower card.
11. Save each successfully generated map privately to its authenticated
    account for 72 hours. Saved maps load newest first after a page reload;
    they are facts captured at generation time and are never silently
    refreshed.
12. `Get Levels` saves a separate new map. `Regenerate` on a saved map uses
    the normal cache/quota path, replaces that saved map with the newly
    generated result and moves it to the current top card slot. `Delete`
    removes only that account's selected saved map immediately and never
    affects Watchlist state.

## Page information and trader guidance

The page Help and dedicated guide must explain only product truth:

- The map uses real market data and historical candles.
- The primary displayed map normally reaches roughly 30 percent around the
  reference price and can extend farther when structural evidence supports it.
- Support and resistance are price areas for context, not price targets,
  predictions, or advice.
- A trader can request a new map after price moves.
- `Weak`, `Moderate`, `Strong`, and `Major` describe the available structural
  evidence; strength is not a probability or trade instruction.
- Level type, clustering/confluence, role flips when present, and agreement
  across timeframes explain why a level may matter more.
- Dates identify when the displayed evidence formed, was last tested, or was
  last confirmed only when the runtime supplied that provenance. Missing
  provenance stays visibly unavailable.

## Architecture and complete implementation inventory

### Platform Dashboard

- `app/(dashboard)/levels/page.tsx`: authenticated route, page metadata, and
  server-side access boundary.
- `app/(dashboard)/levels/stock-levels-client.tsx`: ticker entry, request
  lifecycle, remaining/reset feedback, factual unavailable state, 72-hour
  saved-map load/regenerate/delete controls, and rendering of the shared card.
- `app/watchlist/potential-path-levels-card.tsx`: the single shared Watchlist
  Potential Path card, including its original outer article/topline/kicker/
  guide hierarchy and inner Full ladder behavior, level rows and responsive
  semantics. Generator-only `Support and Resistance` header, price-note and
  nearest-summary choices are explicit adapters around this component; the
  Watchlist keeps its default `Potential Path Levels` header.
- `app/watchlist/live-watchlist-client.tsx`: consume that shared component so
  the existing Watchlist detail remains the visual source of truth.
- `app/globals.css`: existing Academy-shell and Potential Path selectors
  remain the shared CSS; preserve their rendered values and mobile rules
  exactly. No Dashboard look-alike card CSS is introduced.
- `app/dashboard-navigation.ts`: `Levels Generator` item, route title, and
  Dashboard contextual Help target under the existing `Stock Tools` group.

### Platform API, account limits, and runtime relay

- `app/api/levels/route.ts`: authenticated, no-store Platform route accepting
  one symbol and returning the display DTO plus quota feedback. It neither
  accesses Watchlist data nor performs any publisher, Discord, AI, monitoring,
  or activation action.
- `src/modules/stock-levels/server/stock-levels-service.ts`: authenticated
  orchestration, ticker validation result translation, cache-hit treatment,
  account-scoped quota reservation/finalization, and DTO validation.
- `src/modules/stock-levels/server/stock-levels-runtime-client.ts`: server-only
  bearer-token client for the narrow runtime endpoint. Runtime URL/token remain
  environment-only and are never sent to the browser or committed.
- `src/modules/stock-levels/stock-levels-contract.ts`: shared narrow
  request/response types, factual unavailable reasons, the already-mapped
  Potential Path card facts, saved-map identifiers and quota feedback contract.
- `src/modules/platform/server/database/migrations/0089_platform_stock_levels_usage.ts`:
  persistent account-scoped fresh-calculation receipts, New York day identity,
  and indexes required for atomic quota enforcement. It contains no quote,
  level, Watchlist, or provider data.
- `src/modules/platform/server/database/migrations/0090_platform_stock_levels_saved_maps.ts`:
  private per-user mapped-card snapshots, saved/replaced/expires timestamps and
  ownership/expiry indexes. It contains no candles, provider secrets or
  Watchlist data and is registered but not run by this implementation slice.
- `src/modules/platform/server/database/platform-migration-manifest.ts`,
  `src/modules/platform/server/database/platform-migration-registry.ts`, and
  the applicable migration contract inventory: register the new migration only;
  do not execute it during this slice.

### Canonical Levels runtime

- `src/runtime/manual-watchlist-server.ts`: add one separate token-protected
  `POST /api/runtime/stock-levels` handler. It remains outside every
  `/api/watchlist/**` lifecycle path.
- `src/runtime/stock-levels-generator.ts`: request validation, EODHD
  reference quote retrieval, the canonical engine invocation,
  selected same-day context, in-flight coalescing, fifteen-minute shared cache,
  and factual unavailable results. It passes the engine result to the shared
  pure snapshot-to-Potential-Path adapter; it does not construct rows, nearest
  levels, or Full ladder content itself.
- `src/lib/monitoring/manual-watchlist-runtime-manager.ts`: exposes the pure
  engine-output-to-`LevelSnapshotPayload` preparation boundary. The existing
  Watchlist manager supplies its unchanged state/context inputs; on-demand
  Stock Levels supplies only fresh output plus factual symbol/price/time.
- `src/lib/live-watchlist/live-watchlist-publisher.ts`: exposes the existing
  pure Potential Path mapping and Full ladder/card construction. The existing
  Watchlist snapshot path and Stock Levels endpoint use this same mapping;
  neither path is allowed to duplicate its selection, nearest-level, label,
  provenance, ordering, role-flip, or ladder behavior.
- Existing canonical engine, EODHD historical/live providers, selected
  same-day provider, Watchlist runtime manager, and pure Watchlist Potential
  Path presentation remain reused dependencies; no duplicate calculation or
  display-mapping implementation, provider change, cache format mutation,
  Watchlist entry creation, state read/write, or publisher event is allowed.

### Help

- The shared card's top-right question-mark links directly to the public
  [Watchlist how-it-works guide](https://traderslink.pro/watchlist/how-it-works).
  `/levels` has no separate Stock Levels Help button or local explainer panel.
- `src/modules/help/stock-levels-guides.ts` and
  `src/modules/help/help-content-registry.ts` remain the existing Dashboard
  contextual Help mapping; they do not add a second `/levels` help control.

### Documentation

- This plan and its linked progress record remain current throughout the work.
- `docs/migration/route-ownership.md` gains `/levels` and `/api/levels` only
  when the implementation checkpoint is complete, keeping legacy Level
  Analysis and Watchlist ownership separate.
- The migration register gains the registered `0089` quota-receipt migration
  and `0090` private saved-map migration only; neither is executed by this
  implementation slice.

## Data and safety rules

- Reference price must be finite and greater than zero, carry the EODHD source
  and as-of/calculation time, and be shown as a reference price.
- DTO fields expose only the existing card facts: symbol, reference-price
  provenance, generated time, shared Potential Path map and Full ladder card,
  and factual availability/cache status necessary for quota accounting. No
  account IDs, tokens, configuration, full raw candles, provider secrets,
  Watchlist records, or unpublished runtime state cross the boundary.
- The runtime cache key is the normalized symbol and calculation contract
  version. A concurrent matching request joins the in-flight calculation.
- Platform treats only an explicitly declared runtime cache hit as free. A
  failed/unavailable request does not falsely claim a completed fresh map or
  available quota.
- Quotas are checked and reserved transactionally per authenticated Platform
  account. A fresh calculation consumes exactly one allowed receipt; repeated
  cache hits consume none. New York day boundaries are computed centrally, not
  from a browser clock.
- The runtime endpoint rejects missing/incorrect bearer tokens before doing
  market-data or engine work. Platform's outward API requires the normal
  authenticated Dashboard boundary.
- Daily/4h are the product's main structural context and same-day evidence is
  supplementary. This Dashboard surface must not enforce that hierarchy by
  filtering, re-ranking, or otherwise changing the established generator's
  returned result. Missing same-day candles cannot make an otherwise
  trustworthy daily/4h map unavailable.

## Explicit exclusions

- No Watchlist rows, activation, monitoring, scheduling, publisher event,
  Discord post, AI request, Community Watchlist access, or Premium Watchlist
  access is created or mutated.
- No provider switch, EODHD setting change, runtime restart, Railway variable
  change, deployment, staging request, push, or migration execution is part of
  implementation.
- No mocked candles, price, quote timestamp, level, fallback ladder, quota
  remainder, or unavailable explanation is allowed.

## Acceptance order

1. Record this approved contract and the progress record before product edits.
2. Implement the runtime DTO/cache/auth isolation and Platform account quota
   boundary without activating or altering Watchlist state.
3. Refactor and reuse the existing card/CSS, build `/levels`, add navigation
   and Help, and keep the written records current.
4. Perform source/diff-only checks while the owner has prohibited local
   servers, tests, provider calls, migrations, browser automation and builds.
5. Send the Coordinator a preview-ready, complete-file allowlist and
   constraint handoff. Request Railway staging review only after the complete
   UI slice is ready; do not stage or deploy from this worker.
6. After owner UI approval and separately authorized checkpoints, perform the
   focused verification and release preparation required at that time.
