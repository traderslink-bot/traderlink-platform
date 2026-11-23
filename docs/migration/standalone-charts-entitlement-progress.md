# Standalone Charts entitlement

The Charts source is based on `ca619bf9fb90f98f4507aa5fe18038baea45274f`, the common Scanner and Plans integration parent. Custom Plans supplies the catalog entry, membership reader and navigation. The release Coordinator composes the selected source and Scanner owns combined browser qualification.

`hasChartsDashboardAccess(identity)` is the synchronous server export in `src/modules/market-data/server/chart-dashboard-access.ts`. The Charts page, standalone tabs and main layout use this export. Shared frame and Home can use it directly. A hosted owner with the active Platform operator grant retains Charts access independently of paid policy. Ordinary dashboard members can open Charts when its policy is absent, off or in shadow mode. When the owner explicitly enforces the Charts policy, ordinary dashboard members need a current `charts.access` grant. The Plans reader owns the policy lookup and grant selection. The Charts page and HTTP endpoints resolve the dashboard identity before invoking the chart gate. Home and any frame using a billing or sign-in-only identity must establish dashboard access before showing the Charts entry. The existing local-development identity admits the local chart.

| Surface | Admission |
| --- | --- |
| `/charts`, `/api/charts/tabs`, `/api/charts/layout?workspace=main` | Charts |
| `/api/charts/layout?workspace=scanner`, Scanner indicator reads, `/api/charts/provider?feature=scanners` | Existing Scanner or Trading Workspace decision |
| Chart bars, history, archive, stream, calendar, VWAP seed, preferences and chart provider generation | Charts, Scanner or Trading Workspace, enabled Stock Screeners with access, or a current Journal grant with an active Journal account |
| Admin market data and Journal-specific routes | Their existing admission |

The page checks admission before resolving a Scanner evidence link. Shared requests keep the same no-store, revision, ownership, mutation and provider-generation behavior. The plain bars and stream requests cannot select internal Scanner indicator history.

Focused coverage exercises the page, the decision helper, tabs, layouts, preferences, provider generation, calendar, VWAP, proxy streams and history. The launch-policy tests use the real Plans reader, catalog, and operator repository with disposable SQLite policy and grant rows. The route tests inject the chart admission decision. Scanner reported passing the enforced paid browser flows on `2b04203d0f07fd8a6073e3dc8d6fa9c9c3b5bcb4`. Native open-launch browser qualification belongs to the successor joint candidate.

The initial Charts author patch carries a route-level test for main layout denial. The joint candidate separately reconciles the Scanner-owned Watchlist-off expectation for an unlisted identity.
