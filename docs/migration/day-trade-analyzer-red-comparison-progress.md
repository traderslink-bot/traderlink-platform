# Green-to-red comparison clarification

Owner-approved scope, 2026-09-09: use trades that turned red as the denominator
in the three-block profit-opportunity section and simplify the recovery wording.

- [x] No profit taken and Some profit taken retain their finished-red trade
  membership and dollar amounts, but use the turned-red count as denominator.
- [x] Retain both owner-preferred profit-taking labels.
- [x] Show recovery count, green finishes, recovered-then-red finishes and
  never-recovered count. Describe break-even finishes as flat when present.
- [x] Explain the denominator and overlapping recovery groups in the tooltip.
- [x] When No profit taken has zero trades, replace its four zero-dollar totals
  with "No trades finished red without taking some profit." Keep the percentage
  and count visible; retain all dollar totals when matching trades exist.
- [x] Add the percentage sign to both bounds of zone labels, such as
  `20%–under 30%`, in the highest-zone outcomes and individual trade records.
- [ ] Owner rendered review and separately authorized production release.
- [x] Move the last trade table's rows-per-page selector and Previous/Next
  controls below the table, outside its horizontal scrolling area.

## Analyzed count emphasis

- [x] Increase the top-left count-card title from 0.75rem to 1.125rem (50%)
  across all Day Analyzer views, including the analyzed-trades index.
- [x] Use warning.main for the title and count, matching the Workspace PR
  Scanner ticker colour in both themes. Count sizes and tooltip remain intact.

The supplied example becomes 0 of 10 (0%), 5 of 10 (50%) and 8 of 10 (80%).
Recovery ends with 5 green, 3 recovered but later red, and 2 never recovered.
Source review only; no automated tests or local application build run.
