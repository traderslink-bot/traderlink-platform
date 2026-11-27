# Scanners and Screeners page split

Owner approved a page-URL split, relayed by PC chat 01a183a6-998f-7281-a03c-8a43e9156693. This authorizes implementation and the existing private preview update, not production release.

- `/scanners`: Scanners, the existing continuous live workspace, retaining cards, polling, chart/details side card and pending mobile/scroll/launch-control fixes.
- `/screeners`: Screeners, a separate Coming soon panel reserved for future filter-and-run snapshot tools. No redirect, live workspace, live polling or future filter tools on this page.
- Navigation now has distinct Scanners and Screeners entries with correct shared route titles; Screeners is marked Coming soon. Live workspace Help target moves to `/scanners`; its existing Help slug remains stable.
- Both pages retain the former live page's identity check and hasWatchlistDashboardNavigationAccess guard. Both sidebar links use the existing corresponding navigation-access flag. No new account entitlement is granted.
- Side-card tab and selection group say Scanners to distinguish the live cards from the reserved Screeners page. Help labels aligned. Existing legacy `/scanner` remains a separately guarded tool and is outside this split.
- Existing `/api/screeners/...` and `/api/admin/screeners/...` contracts, component-source paths and engine names remain stable. They are internal API/module contracts, not links to the newly reserved page. No provider/detector/levels math changes.

Applied selected overlays to existing owner preview artifact, without copying newer shared-shell/layout work from the mixed assigned checkout. No Railway operations or production settings changed. Preview required a restart after reaching its development memory soft threshold during initial route compilation; first stalled browser attempt is not a pass.

Verification: three focused route contract tests pass: distinct live versus placeholder content and metadata, same denied/unauthenticated access handling, separate navigation/help destinations. Edited route/navigation/help/client lint passes. Shared dashboard-shell lint reports a pre-existing setState-in-effect violation outside the added navigation guard lines; not changed in this slice. Required dashboard-template enforcement ran: 3 pass/4 fail on existing layout-import/shell expectations, unrelated missing navigation destinations and pre-existing feature-drawer inventory. Both new pages exist under app/(dashboard), consume DashboardPage and introduce no local shell. No all-green architecture/lint claim. Initial .test.tsx test filename did not match this repository's .test.ts inventory; converted to .test.ts with createElement and the focused run passed.

Next checkpoint: owner review of the two routes and preserved workspace interactions, then normal Coordinator integration only when explicitly requested.

Private HTTPS browser PASS after preview restart: /screeners HTTP200 retains exact URL, Coming soon visible, zero scanner polls; /scanners HTTP200 live cards, real NWGL chart history and stream HTTP200. Mobile all-five-card scroll geometry777/2107px, touch chaining450to675, full Market Events card reachable; desktop remains grid/hidden outer overflow. Phone link now https://traderlink-live-preview.tail41b7ab.ts.net/scanners with Tailscale on.

## Scanner Admin changeover

Owner requested the corresponding admin changeover. Scanner Admin now lives at `/admin/scanners`; its audit page lives at `/admin/scanners/audit`. Old admin page routes are removed without redirects. Sidebar label, page metadata, access gating, audit link and Help labels follow the new name. Internal API/module paths remain stable, including `/api/admin/screeners/...`; existing saved controls, audit evidence and provider selection are preserved.

Product scope: support up to 4,000 symbols as capacity, not the default active scanning population. The current $100M universe setting remains unchanged. $150M or $200M are possible later owner tuning decisions, not approved settings changes. The app's current scanner niche remains micro/nano-cap, low-float moves. No threshold, ranking, universe refresh or provider-runtime changes in this slice.

Help review: affected Scanner Admin references and live scanner enable/disabled labels aligned; existing Help slug retained. Four focused route tests pass, covering admin controls/audit destinations, metadata/navigation/Help, denied and unauthenticated access, and absence of old page files. Targeted new-route/navigation/test lint passes. Required dashboard-template check remains 3 pass/4 existing failures as recorded above. Private HTTPS browser confirms new admin HTTP200, Alpaca selected, Moomoo off, current-provider switch disabled, provider GET200, no admin JavaScript errors, audit link reaching its new route, old admin and audit URLs404 without redirect, and live Scanners HTTP200 with grid visible. Initial browser request during preview startup returned502; only the subsequent ready-server checks count as passing. No production release authorized.

## Scanner filter layouts and canonical page · November 25, 2026 Toronto

The upgraded Scanner now renders at `/scanner`. The existing Scanner access check applies to that page and to the `/scanners` redirect. The redirect preserves live view and evidence parameters. Saved Home page preferences retain their existing identifiers and now open the canonical page. The earlier broker scanner can still be opened at `/scanner?view=legacy` through its existing access check. Build and shared-scan URLs continue to work at their existing paths.

The editor offers Side card and Top controls with the same filter definitions, values, and rule groups. Adding a filter opens its settings and moves focus to it. Switching layouts preserves the draft, and the browser remembers the selection for the account. Apply sends the draft to the existing results path. Cancel restores the last applied filters. Help covers the new controls.

Focused tests cover the canonical and compatibility routes, existing access, saved Home page choices, evidence, and adding filters in both layouts. The actual Scanner client also passed local Chromium with synthetic results at desktop and phone widths in light and dark themes. The browser check exercised layout switching with unapplied edits, form validation, adding a rule to a group, Apply, Cancel, focus after closing, preference restoration and Escape. Live signed-in review and release are pending.

The owner requested a private VPS preview. Release and Shared Charts confirmed cleanup of nine old generated outputs. The managed preview now serves `http://127.0.0.1:3010/scanner` from this checkout with an isolated database and workers disabled. The local-server runner now explicitly honors its Webpack flag so the development server can use the assigned dependency symlink. Chromium verified HTTP 200, adding a rule in the side card, switching to top controls with the draft intact, applying it, and reopening the side card at 390 px. Keep the preview available for owner review. [Cleanup receipt](/home/traderlink/projects/traderslink-coordinator/operations/scanner-ui-two-layouts-20261125/scanner-preview-cleanup-complete.json)

The owner found the layout entry hidden on the default live scan. Scanner now opens with Top controls and Add filter visible above the default results, and Side card is available in the same toolbar. The draft shows the public starter until Apply runs an editable scan. Four focused tests and lint passed. After restarting the managed preview, actual Chromium verified both first-screen layout buttons, preserving an edit through both layouts, Apply, and the 390 px side card. The private preview remains available for review.

The owner then reached the older live-card view via the Live scanner layout link. That link and alternate page were removed. The main Scanner now serves both the original URL and old live-view links. Evidence remains available on the same Scanner page. Verified the named controls on both URLs, the old plural redirect in the running preview, and nine focused route and evidence tests. No release was made.

The responsive filter update puts Price, Float, RVOL, Volume, Day change and Session above results on desktop. Each category has a dropdown, and the searchable Add filter menu accepts multiple checked choices in one batch. Phones open the same draft in an expandable Filters card. The Scan menu labels the original TraderLink scans Presets and lists the editable starters separately. Exact preset values use the existing server-side path. Fourteen focused tests, scoped TypeScript and lint passed. The running private preview passed Chromium at 1440 px and 390 px, including the combined Price, Float and RVOL request leaving the browser on Apply. The updated preview remains available at `/scanner`.

## Filter catalogue and saved combinations · November 26, 2026 Toronto

The [full filter audit](scanner-filter-audit-20261126.md) records the 96 selectable filters, the legacy 52-entry catalogue, the plan gaps, sampled provider coverage and the cases that would benefit from conditional or ordered rules. All 57 focused tests passed. Chromium verified both mixed All/Any layouts through Apply, Save and reopening on the private Scanner. The 61-minute press-release window changed by 1.2 seconds on reapply and is recorded for correction. This checkpoint contains audit and test changes only.


### November 26 — PR windows and session RVOL

Custom filters now offer same-time RVOL for premarket and after-hours in the Volume category and the desktop RVOL selector. The PR editor preserves the exact duration through unit changes and reopening. The [updated filter audit](scanner-filter-audit-20261126.md#follow-up-verification-for-pr-windows-and-extended-hours-rvol) records the private browser cases, including exact cutoff matches and saved definitions.


### November 26 — filter catalogue and ordered catalysts

The private Scanner source adds 56 filter types to the previous 98. The editor supports ordering a PR before a VWAP reclaim and a trading resumption before volume expansion. Authorized article evidence follows the qualifying release through matching. Coverage, calculation boundaries and the combined Apply, Save, reload and reopen checks are recorded in the [filter audit](scanner-filter-audit-20261126.md#implemented-filter-batch).
