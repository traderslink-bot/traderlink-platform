# Day Trade Analyzer Version 2 Progress

**Plan:** [Day Trade Analyzer Version 2 Plan](day-trade-analyzer-v2-plan.md)

**Active follow-up:** [Profit Zones Progress](day-trade-analyzer-profit-zones-progress.md)

**Audit:** [Day Trade Analyzer Version 2 Data Audit](day-trade-analyzer-v2-data-audit.md)

**Status:** The page, calculation, navigation and offline implementation is
technically complete in the assigned worktree and is ready for the separately
authorized online visual review. Help copy is explicitly deferred until the
owner accepts the pages. No release is in progress.

## Safe pause checkpoint — 2026-09-04

- [x] New scenario engine and long-term read-model wiring are saved.
- [x] Shared date presets, direction-aware presentation and core V2 page
  composition are saved.
- [x] Scaling Out route, navigation and offline contract wiring are saved.
- [x] Complete page-level data and calculation review, including exact records.
- [x] Complete focused lint and TypeScript verification without Vitest.
- [ ] Complete separately authorized online visual review and owner acceptance.

## Git and ownership checkpoint — 2026-09-04

- [x] Visible release coordinator assigned
  `C:\Users\jerac\Documents\TraderLink\worktrees\trade-analyzer-v2`.
- [x] Branch confirmed as `codex/trade-analyzer-v2-dacc469`.
- [x] Exact authoritative parent confirmed as
  `6f720a42f65628a1bcdd8a7f133aa836266a6b59`.
- [x] Assigned worktree verified clean before work.
- [x] Dirty canonical checkout excluded from all edits and Git operations.
- [x] Release boundary recorded: no push, merge, deployment, migration,
  Railway/configuration change or hosted data mutation.

## Product decisions recorded

- [x] Small/micro-cap completed-close matrix: 50%/3, 30%/5, 20%/10,
  15%/15.
- [x] Potential result, actual completed result and difference remain prominent.
- [x] Both scale-out and no-scale ended-red behavior included.
- [x] One new focused page: Scaling Out.
- [x] Post-exit data remains within Entries and Exits.
- [x] Full ordinary date presets and custom dates apply to every result.
- [x] No per-group 30-trade gate; automated high/low language can use 30 total.
- [x] Conditional Long/Short views and explicit direction wording.
- [x] Direction-consistent raw Green-to-Red totals and exact candle-pattern
  occurrence evidence.
- [x] Entry-price high/low statements rank every populated price band by
  average P/L after 30 total trades; exact rows remain visible before then.
- [x] No improvement claim, advice, prediction or default comparison view.

## Phase 1 — saved-fact and capture audit

- [x] Reconciled chronological fill/candle path and Gross/Net basis.
- [x] Audited meaningful opportunity, no-scale and scale-out requirements.
- [x] Audited 5/15/30/60 event and final-exit path persistence.
- [x] Audited Session VWAP, 1-minute/5-minute EMA, volume, ATR and ADR.
- [x] Audited missing-minute behavior and halt-evidence limitation.
- [x] Audited short costs, route/venue, quote/spread, market cap and float.
- [x] Audited historical eligibility and saved-candle reuse.
- [x] Inventoried route, offline and reporting consumers needed by the pages.
- [x] Determined Scaling Out passes the new-page admission rule.
- [x] Determined no additional page is currently justified.

## Visual specification

- [x] Create the first lightweight responsive Light/Dark mockup covering the
  shared controls and all seven route compositions.
- [x] Owner directed implementation to continue without intermediate UI
  approval because the local computer is resource constrained.
- [x] Complete the implementation against the internal visual specification.
- [x] Prepare the complete work for coordinator handoff and a separately
  authorized online review; owner changes follow that rendered review if
  requested.

## Implementation

- [x] Lock the new contract/version and exact scenario types.
- [x] Implement chronological Gross and fee-complete Net paths.
- [x] Implement matrix qualification and gap reset.
- [x] Implement scale-out/no-scale populations and evidence rows.
- [x] Expose saved entry/add/partial/final 5/15/30/60 paths.
- [x] Add shared date presets without discarding query state.
- [x] Add conditional Long/Short presentation.
- [x] Separate initial entry/add and partial/final exit aggregates, expose exact
  execution context, and use the last completed 5-minute EMA candle.
- [x] Use microcap-scale VWAP/EMA, volume and ATR bands while retaining exact
  sample counts, totals, averages, medians and records.
- [x] Update route navigation and offline page rendering.
- [x] Run targeted non-Vitest verification.
- [ ] Update Help only after owner page acceptance.
- [x] Create a narrow allowlisted local implementation commit for coordinator
  handoff.
- [ ] Complete integrated responsive Light/Dark browser review.
- [ ] Obtain owner acceptance after the separately authorized online release.

## Verification performed

- Focused ESLint passed for the changed page, calculation and offline files.
- Focused TypeScript compilation passed with incremental caching disabled to
  respect the isolated-worktree and low-resource constraints.
- Scale-out classification was audited to count only profitable partial exits
  after the sustained-profit level and before the first later red point or
  final exit.
- `git diff --check` passed.
- Production visual inspection was not attempted beyond the ordinary page URL;
  it redirected to Discord authentication, which was left untouched.
- No Vitest, broad suite, production build, server, provider request, database
  write, migration, push, merge or deployment has been performed.

## Owner-requested QA rerun — 2026-09-04

- [x] Re-ran focused ESLint across all changed TypeScript and TSX files.
- [x] Re-ran focused TypeScript compilation with incremental caching disabled.
- [x] Ran a direct five-scenario calculation harness covering Long, Short,
  Gross/fee-complete Net, missing-minute sequence reset, and profitable partial
  exits before versus after sustained-profit qualification.
- [x] Confirmed all seven Day Analyzer routes exist and Scaling Out is wired to
  dashboard navigation and offline routing.
- [x] Confirmed every requested date preset remains present.
- [x] Confirmed candle-pattern evidence follows the selected Long/Short view.
- [x] Confirmed the Day page source contains none of the retired vague movement,
  missed-opportunity, or 1%-3% giveback presentation.
- [x] Rechecked React component structure, unconditional hook order, bounded
  pagination, accessible control labels and direction-dependent rendering.
- [x] Confirmed the worktree returned to a clean state after temporary QA files
  were removed.

The source and calculation QA boundary passes. Integrated desktop/mobile
Light/Dark rendering remains deliberately deferred to the separately authorized
online release review and is not claimed by this checkpoint.

## Profit-zone collective analysis follow-up — 2026-09-05

- [x] Owner approved the collective progression-chart and profit-zone matrix
  direction.
- [x] Visual release coordinator assigned a clean branch at current production.
- [x] Exact cumulative-threshold, exclusive-fill-band, Gross-money and
  supporting-record contracts are recorded in the plan.
- [x] Implementation and focused source QA are complete and tracked in the
  linked Profit Zones progress record; online rendered review remains pending.

## Owner wording follow-up — 2026-09-04

- [x] Rename the left-navigation link and page heading from `Candle setups` to
  `Candle patterns`.
- [x] Keep the overview capability link, browser metadata, route title, Help
  target label, offline title and V2 visual specification consistent with the
  accepted page name.

## Entries and Exits disclosure refinement — 2026-09-06

- [x] Keep `Execution mix` expanded when the page opens.
- [x] Start `Entry execution context`, `Exit execution context` and `Price
  reached after exits` collapsed so the deep-dive data is available without
  overwhelming the initial page view.

## Scaling Out Gross P/L refinement — 2026-09-06

- [x] Remove the Gross/Net selector from Scaling Out.
- [x] Force every Scaling Out calculation, record and offline query identity to
  Gross even when an old URL requests Net or the saved account preference is Net.
- [x] Add `Results use Gross P/L` at the top right of the Profit Taking by Price
  Zone chart.
- [x] Focused ESLint, targeted TypeScript, React best-practices review and
  `git diff --check` pass for the Gross-only refinement.
## Entry/Exit summary and shared control placement — 2026-09-06

- [x] Move the date-range and Gross/Net controls below the analyzed-trade count
  on every applicable Day Trade Analyzer route, including Analyzed Trades.
- [x] Preserve Scaling Out's Gross-only chart-level filter placement.
- [x] Add the Entry and Exit snapshot for adds, partial exits, green final exits
  and median calculated profit giveback.
- [x] Add the six-factor context summary with selected-basis gain, average P/L,
  loss and supporting trade counts.
- [x] Add visible MFE and MAE terminology to Room after entry while retaining
  plain-language direction and per-share explanations.
- [x] Complete focused TypeScript, ESLint, diff and React review for this slice.

## Green-to-Red evidence and outcome refinement — 2026-09-06

- [x] Make later red and recovery chronology symmetric with the +20% evidence:
  exact executions and direction-aware completed-candle extremes are used.
- [x] Do not invent the order of a high and low inside one candle, and do not
  use the full range of a candle that began before a position-changing execution.
- [x] Carry the saved logical trade ID and execution count in every supporting
  Green-to-Red record while retaining the representative member ID only for the
  existing grouped Trade Details lookup.
- [x] Expand the finished-red split to show maximum Gross opportunity, exact
  profit taken, final Gross loss and opportunity not retained.
- [x] Split recovered trades by their final above/below-$0 outcome.
- [x] Add an exclusive highest-profit-zone outcome table with explicit
  denominators and Gross dollar totals.
- [x] Replace the finished-red-only evidence table with filterable exact +20%,
  turned-red, finished-red and recovered records.
- [x] Add first-red/recovery timing, peak stock price per share and a same-page
  Trade Details drawer to each exact record.
- [x] Replace ambiguous column labels with `Maximum gain` and `Opportunity not
  retained`, backed by concise formula/evidence tooltips.
- [x] A direct calculation harness passed Long, Short, exact-exit red,
  later recovery, same-candle ambiguity and mid-candle position-change cases.
- [x] Focused ESLint and targeted TypeScript compilation passed. The broad
  repository TypeScript process was stopped by Node's 2 GB heap limit and was
  not repeated on the resource-constrained computer.
- [x] A focused React server-render harness rendered the damage summaries,
  highest-zone table, exact evidence table and same-page Details action.
- [ ] Integrated desktop/mobile Light/Dark rendering remains for the authorized
  online review; no local server, build, push or deployment was performed.

### Production follow-up

- [x] Keep the exact-record table at 10 rows per page by default and show its
  pagination controls even when the selected filter currently has ten or fewer
  trades.
- [ ] Publish the previously omitted Entry/Exit summary and shared Day-page
  control-placement parent slice together with this pagination correction.
