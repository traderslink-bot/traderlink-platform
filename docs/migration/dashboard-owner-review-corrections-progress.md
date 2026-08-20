# Dashboard Owner Review Corrections Progress

**Status:** Implemented and static-verified. Owner visual/product review remains. The owner approved the complete correction set and the visible name **Trade Breakdown** on 2026-08-17.

**Plan:** [Dashboard Owner Review Corrections Plan](dashboard-owner-review-corrections-plan.md)

## Approved decisions

- **Trade Breakdown** is the visible name for `/analytics/execution`; the route remains stable.
- The combined Daily Trade Tracker analysis remains visible while a selected execution is emphasized on the chart.
- Candle names retain factual direction, including **Bullish Hammer** and **Bearish Shooting Star**.
- Existing detectors remain unchanged and no additional pattern label is presented without a factual detector.
- The Press Release runtime remains outside this work and must stay running.

## Implementation checklist

- [x] Record and link the owner-approved plan and progress tracker.
- [x] Reuse the Calendar Week presentation on Workspace and remove the obsolete Workspace performance panel.
- [x] Hide empty Workspace Current Focuses, Focus rules and Previous trading-day review cards; place populated previous-day reviews in their own row and add direct Import trades and Quick trade entry actions.
- [x] Correct Daily Trade Tracker analysis selection, Green-to-Red wording, card borders, spacing, and desktop zoom controls.
- [x] Consolidate preset/custom Trading Rules and update the left-navigation order and hierarchy.
- [x] Add the shared candle-pattern presentation catalog and align all affected Help guides.
- [x] Apply the Market Charts and Notifications presentation corrections.
- [x] Correct Trade Explorer copy and the DSY ticker-result explanation while preserving shared Journal annotations.
- [x] Add responsive exact-trade detail drawers to Results and Trade Breakdown.
- [x] Complete low-resource focused static verification.
- [ ] Complete owner visual/product review.

## Factual DSY diagnosis

- The current Journal contains three active completed DSY trades and no DSDY trades.
- All three DSY trades have incomplete trading-cost facts. Net P/L therefore has
  zero eligible DSY rows even though Gross P/L has factual completed trades.
- Trade Explorer now states that exact reason and offers **View Gross P/L**. It
  does not invent fees, substitute zero-cost Net P/L, or alter Journal facts.

## Delivered review details

- Analytics Results ticker rows open a responsive drawer with bounded completed
  trades, their exact executions and factual P/L.
- Trade Breakdown rows open the same detail experience. Where a saved Trade
  Analyzer replay is available, the full trade chart remains visible and
  selecting an execution highlights its marker on that chart.
- Exact execution and Analyzer reads remain owner/account scoped. Unavailable
  Analyzer coverage is stated plainly.
- Trade Explorer notes, tags and rule results continue through the existing
  shared Journal annotation service used by Daily Trade Tracker and AI Reviews.

## Runtime boundary

- Port 3010 was already not listening when this correction set began.
- No dashboard process was stopped.
- The separate Press Release runtime was confirmed active and is not touched by this work.

## Verification boundary

The owner directed that Vitest and other test suites not run during this design-first implementation. Verification is limited to focused source checks, targeted lint, TypeScript/static checks, and later owner browser review.

On 2026-08-17, targeted ESLint passed for every changed TypeScript/TSX source
file, the project TypeScript compiler passed with no errors, and `git diff
--check` passed apart from Git's existing line-ending notices. No test suite,
dashboard server, production build, database mutation, commit, push or
deployment was run.
