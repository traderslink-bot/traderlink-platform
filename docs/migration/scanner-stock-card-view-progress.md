# Scanner stock-card view — prototype progress

Owner direction November 6, 2026: retain the existing horizontally scrolling single-ticker-row table as one selectable view, and experiment with a second view using ticker cards. Each ticker card fills the visible scanner width, has approximately two rows of height and shows every existing table column. Add a Table / Cards switch at the top of both primary scanner cards. The plus action may become a unified ticker sidecard later; that change is deferred.

## First review slice

- Separate Table / Cards controls for Top Gainers and Momentum; table remains the initial choice. No persistence or full dashboard customization is introduced. Both representations consume the same cached response without extra provider or application fetches. Full view follows its scanner's selected representation.
- New deliberate two-line ticker-card composition uses shared low-level MUI tokens and existing chart/news/halt contracts. Top line: tools, ticker, price, gain/day change, Vol+Float for Gainers or Float+Spread for Momentum. Bottom line: all remaining table metrics. Missing values display dashes.
- Fixed tools positions retain 8px separation. Existing row expansion is preserved in Table; card plus expands additional details. Momentum signal descriptions are in expanded card details in this first prototype. No unified ticker sidecard yet.
- Cards use the visible width, internal vertical scrolling and no horizontal scrolling. Measured collapsed height: approximately 60px. Card figures use compact 0.62rem type in this first dense composition, subject to owner review.
- Current-production-source Tailscale preview includes the same component and narrow integration overlay, with existing 20-per-scanner synthetic fixtures. Preview data is static and isolated. No production release or real provider request.

## Verification

22 focused client tests pass, including independent view switching, every metric label, expansion, return to Table and zero extra fetches. Three-file ESLint passes. Actual browser checks at desktop 1536px and mobile 390px/320px show 40 populated cards, 60px collapsed heights, no overflowing metric labels/values and no page exceptions. The initial geometry probe ran before the fixture request finished and saw zero cards; the corrected probe waits for actual rows before evaluating and passes.

Dashboard-template verifier was run: 3 pass, 4 fail on existing shared-layout/navigation/source-assertion mismatches already recorded in historical scanner progress. This slice changes no shell, route or navigation. Do not describe that verifier as passing. No full production build claimed for this prototype.

Help review: current Help has no primary screener display-view guide to update. This document records the prototype's user controls; add published Help instructions when owner accepts the final workflow. Owner visual/product approval remains pending. Next step is owner feedback on metric grouping, readability and density.

## Third view — Two rows

Owner disliked the first card composition but explicitly asked to retain it and try an original-table-based two-row representation. Added a third Two rows choice independently to each primary scanner. First row contains the original metric columns starting with Ticker; the leading tools column is removed. Second row contains chart, reserved news slot and a working plus control, with Momentum's signal text beside them. Eight-pixel control spacing and viewport-sticky tools are retained while metric columns can scroll horizontally. Expanded details are still available; sidecard behavior remains deferred. Existing Table and Cards choices remain unchanged.

Verification: 23 client tests plus exact-file ESLint pass. Actual Tailscale mobile/browser checks found 20 data rows and 20 second tool rows in each scanner, working row/plus expansion and collapse, and zero page exceptions. Table width is reduced by the former 72px tools column (474px Gainers / 558px Momentum). Mobile and desktop screenshots were visually reviewed. No new page/navigation/shell changes; the previously recorded template baseline failures remain unchanged. Help guidance remains prototype-only pending owner selection. No push or production release.

## Two rows — ticker moved beside tools

Owner approved trying the ticker on row two before chart/news/plus, while retaining its column alignment. Row one now leaves the original Ticker cell empty; row two uses that same table column for ticker and halt state, followed by the controls in the remaining columns. Other views and metric columns are unchanged. Focused 23-test suite and exact-file ESLint pass. Actual mobile Tailscale browser measured zero horizontal offset between second-row ticker cell and Ticker header, verified empty first-row ticker cells and controls following ticker in both scanners. Preview service was restarted after slow development requests; its memory soft limit is now 5G with unchanged 6G hard cap. Final page/browser checks passed. Owner visual review pending; no deployment.

## Two rows — ticker returned to top

Owner requested returning ticker/halt state to row one while leaving second-row icons in their current positions. The second-row Ticker cell remains empty; chart starts under Price. Both primary scanners updated. Focused 23-test suite and exact-file lint pass. Actual mobile Tailscale browser verified top-row ticker, empty second-row ticker cell and chart aligned with Price content (1.6px normal cell inset). No release.

## Two rows — group spacing trial

Owner requested 4px below the icons. Both primary scanners now apply explicit 4px bottom padding to the second-row tools region. Column positions and other views are unchanged. Exact-file ESLint passes. Updated the private populated preview for owner visual review; no deployment.

## Base-card scope and stronger grouping

Owner clarified that current visual iteration applies only to Top Gainers, which will become the shared scanner-card baseline after acceptance. Do not propagate subsequent trials to Momentum or other scanners without direction. Added a 2px theme-aware separator beneath each Top Gainers two-row group, retaining the 4px tools padding. Momentum is unchanged by this slice. Exact-file lint passes; owner review pending, no release.

Owner rejected the stronger divider. Removed only that Top Gainers trial; retained the existing 4px spacing and prior subtle border. Lint passes. Further grouping choices remain open.

Owner requested removing $ × Vol from the Top Gainers base card. Removed the column/value from compact and full tables, the Two rows representation and the retained card alternative. Momentum fields and backend facts/qualification are unchanged. Updated column/metric assertions; all 23 client tests and three-file lint pass. Private preview updated; no release.

Owner shortened Top Gainers Turnover to T/O in table headers, expanded details and the retained card view. Momentum remains unchanged. Label assertions updated; 23 client tests and exact-file lint pass. Preview updated; no deployment.

Owner restored $ × Vol after Float in Top Gainers, retaining T/O. Applied across its table/full/two-row/card representations only. Updated assertions; 23 focused tests and lint pass. Private preview updated, no deployment.

Owner began the next desktop slice: widen the Top Gainers chart drawer and add stock context plus an on-demand Generate Levels trial. See [ticker workspace progress](scanner-ticker-workspace-progress.md). Earlier card alternatives remain retained.
