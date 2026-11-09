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
