# Entry Price Results: return-based comparison

Owner approved September 9: remove combined Under $1 / $1+ narrative; show
five individual bands with average and median return, dollar totals/averages,
win rate and counts. Highlight highest/lowest average return with median/count.
August data is sufficient; no multi-period consistency claims.

## Contract

- Return = selected-basis trade P/L / entry notional * 100. Each eligible trade
  contributes equally to mean and median; no dollar-size weighting.
- Keep all existing five bands, correct rational metric handling, and preserve
  30 total selected-direction trades for highlights (not per band).
- Separate long/short band results where both exist, default long if present.
- Calculate over full server population, never the table's paginated rows.
- Preserve selected date range, Gross/Net coverage, account isolation and offline.
- No claim of best stocks, causality or consistency across nonexistent periods.
- UI uses existing card/table structure and short tooltip-backed headings.
  Owner has waived intermediate visual review; integrated visual review pending.

## Progress

- [x] Engine metrics, server data, UI and offline wiring.
- [x] Focused TypeScript, ESLint and whitespace checks pass; no tests/build.
- [ ] Separate owner-authorized release.

Implementation notes: per-trade return uses exact decimal division retained at
12 decimal places before mean/median calculation. Display uses two decimals.
Highlights tie at displayed mean precision. Nonpositive entry-cost denominators
make return unavailable rather than fabricating a zero. Net uses the existing
fee-eligible population. Independent direction queries use full server populations
and the same date/basis filters; other page charts keep their existing scope.
Execution saved-view key moves v2 to v3. Legacy offline models show a reconnect
notice rather than presenting old dollar-based findings as return-based findings.
Existing legacy serialized comparison fields are retained for compatibility but
are not rendered. No help edits until owner accepts the page.

Static review: every selected trade contributes one return, not one dollar of
weight. Both mean and median preserve loss signs. Odd/even median delegates to
the existing exact-decimal helper. Direction selection changes only this card;
no new global page filter is implied. Display-matched ties list every tied band.
No invented results for empty bands or missing entry-cost authority.
React/Next.js review preserves plain serialized props, direct imports, accessible
selector/tooltip controls and existing horizontal-scroll behavior. Integrated
rendered and live-account numerical verification remain pending.

## Approved explanation and control placement

- Exact owner-approved three-paragraph explanation below the table caption,
  with extra vertical spacing. Native details/summary is collapsed by default,
  whole-row keyboard/click toggle, question-mark icon and rotating chevron.
- Date range and Update moved beside Measure above the table/chart group.
  Single original control retained with custom dates, query preservation and
  date-range help link; redundant date caption hidden.
- Offline card retains the same explanation; online date control remains online.
- Focused TypeScript, ESLint and whitespace checks pass. Fixed unavailable icon
  import to the established HelpOutlineRounded variant. No rendered acceptance
  or production release claimed.
