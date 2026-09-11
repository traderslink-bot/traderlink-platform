# Analyzer Tooltip Interaction Progress

**Status:** Complete locally; release authorization pending.

## Scope

Make explanatory tooltips in the saved Trade Analyzer card, Day Trade Analyzer
pages, and summary cards readable and tappable on mobile without changing any
Analyzer data or calculations.

## Delivered

- Replaced the standard auto-dismissing controls with one shared explicit-help
  control.
- A tap opens help until the trader taps that icon again or taps outside it.
  Tapping tooltip text leaves it open.
- Help controls stop their event before an accordion/card action receives it.
- Only the analyzed-trade count itself is a link; opening its separate help
  control never follows that link.
- Mobile help icons now have a 36px touch target and a visibly larger question
  mark; desktop sizing remains compact.
- Mobile tooltip copy is larger with a readable line height and viewport-safe
  maximum width.
- Applied the control to the written per-trade Analyzer card, chart availability
  help, Green-to-Red, Scaling Out, the shared Day Analyzer pages, Analytics
  Overview, Analyzed Trades, and Rules summary cards.
- Audited all dashboard card candidates with one-line clipping rules. Long
  explanatory card captions now use help icons; the remaining one-line cases
  are deliberate compact data such as table cells, tickers, filenames, dates
  and headline previews.

## QA

- Targeted ESLint passed. The only warning is a pre-existing dependency warning
  in `daily-trade-analyzer-chart.tsx`.
- `git diff --check` passed.
- Source inventory confirms no legacy transient Tooltip controls remain in the
  Day Analyzer or written-card surfaces.
- The small component-preview server could not bundle in the restricted
  worktree because esbuild was denied its parent-directory read; no app server
  or background worker was started.
