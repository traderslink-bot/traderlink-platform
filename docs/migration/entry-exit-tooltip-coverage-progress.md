# Entry & Exit: tooltip coverage and compact cards

## Implemented locally

- Added plain-language explanations to Entry and exit snapshot, its four metrics, Factor, Execution mix and its four metrics, Entry execution context, Exit execution context, and Price reached after exits.
- Added tooltips to all six indicator/volume/volatility headings in both entry and exit sections, all breakdown column headings, all exact execution-table headings, and after-exit path column headings.
- Shortened detailed indicator headings and exact-table labels. Preserved the meanings, controls, column order, scroll regions, data values and default collapsed sections.
- Moved long section and metric descriptions into tooltips, including the clipped Median profit given back sentence. The adds/no-adds average comparison and partial-exit gross profit remain available in the relevant metric tooltip.
- Entry/exit metric labels and values can wrap; grid rows stretch their cards to equal height. Long explanations do not make individual cards taller. Shared MFE metric rendering remains unchanged apart from a neutral helper rename.
- Corrected strict-positive checks: zero-profit final exits no longer count as green, zero-profit partial exits are excluded from profitable-exit aggregation, and zero opportunity is excluded before dividing to calculate giveback.
- Tooltips distinguish fill counts from position counts, final exits from one-shot full exits, completed-position P/L from individual-exit profit, one-minute volume from daily RVOL, and price movements from realized profit.

## Review findings / outstanding

- The saved-trade count/result discrepancy and exit-window coverage were subsequently corrected with owner authorization. See [saved-trade correction and deeper QA](entry-exit-saved-trade-qa-report.md) for the exact changes, 38 focused checks and remaining rendered-verification boundary. Tooltip wording now describes the saved-trade basis.
- Focused ESLint, TypeScript syntax transpilation and diff checks only. No test suites, builds, data mutation, reanalysis or deployment. Integrated desktop/mobile Light/Dark visual verification remains pending; source wrapping rules are not rendered acceptance.
- Existing Help content was located in the Help registry. Article updates remain deferred until owner acceptance of the pages, as requested.

## Release boundary

Local implementation complete for tooltip/caption scope and the subsequently authorized saved-trade corrections. Not sent to the coordinator or production. Live rendered acceptance remains pending.
