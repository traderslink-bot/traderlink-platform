# Main scanner card scroll repair — November 9, 2026

Owner reports missing main-page /scanners scrollbars in all cards; drawer bars still work. New configurable Basic Stats/Indicators/Catalyst ticker-card design remains unimplemented, per prior design-review gate. This repair does not implement that design.

The main ScannerWorkspaceCard constrained CardContent, but DashboardPanel adds an unbounded child Box. Descendant table maxHeight:none!important removed its own cap; the inner Box grew under the ancestor overflow:hidden, clipping rows and the horizontal scrollbar. Fix the exact inner body to be a bounded flex column on desktop, retaining existing table auto overflow and mobile sizing. Headers do not shrink. Drawer styles unchanged.

Actual component SSR/MUI in Chromium, synthetic 50-row/900px-wide table, 300px card: before table clientHeight1602/scrollHeight1602/bottom1687.81 vs cardbottom300, scrollTop stays0, scrollLeft120. After table clientHeight204/scrollHeight1602/bottom290 vs cardbottom300, scrollTop120 and scrollLeft120. This proves bounded vertical scrolling and bottom scrollbar containment. Exact-file ESLint passed. This synthetic component proof is not logged-in production/browser acceptance. No source/Watchlist/API/gateway/schema changes, no deployment. Existing Help already describes internal scrolling, so restored behavior requires no guide rewrite.

Readonly Coordinator evidence: Watchlist release cb7b6ed parent59 contains six Watchlist-only paths, no scanner/globalCSS/theme/shell changes. Do not blame that release for this layout defect.
