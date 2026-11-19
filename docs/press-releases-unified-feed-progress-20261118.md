# Unified Press Releases — implementation and QA

Status: local feature complete; News-layer QA passed; Membership handoff ready. Not deployed. Source: assigned `news-outbound-links-20261118` worktree, base `1806d747028b77e6f50f9dad0903f83555eb6233`. All edits remain uncommitted; Coordinator owns Git/integration/release.

## Final behavior

- One Press Releases navigation link. Old News Scanner/market-cap routes redirect to `/press-releases`, preserving valid article deep links, including the two larger bands. Other Market News products remain separate.
- Filters and sorting are currently open to existing readers. A separate future `news.filters_sorting` policy controls advanced browsing without denying the basic feed. No live commercial policy/grant/catalog changes.
- Search, up to 20 exact tickers, market-cap bands/custom limits/known-or-unknown, Eastern date presets/custom dates, recorded news types, read status, summary availability; newest/oldest/cap ascending/cap descending/ticker ordering. Market-cap minimum includes the amount; Below excludes it. Unknown caps sort last. Dates appear in historical feed rows.
- Filters apply before a 100-row page limit across eligible stored articles; ingestion, delay eligibility and read-filter membership use a stable asOf snapshot. Current read markers use the live receipt join. No newly-read row can shift later unread pages. Permission changes reset an advanced view to the basic feed. Preferences are scoped by stable user on this browser; invalid/unavailable storage does not block reading.
- Dashboard PR summary views expose no public TradersLink news/article action. Failed AI shows the exact unavailable message and, only when valid, an original publisher action; NuntioBot is blocked. Both screener PR views share this behavior. Local scanner news links use dashboard article deep links; public/Discord successful-summary link behavior remains separate.
- Collector/source identity, existing articles, read history and notification subscriptions remain intact. No migration/index/storage writer changes.

## QA evidence

Final applicable checks:

- 39 Vitest checks in 7 files passed: actual in-memory reader queries, permissions/policy rollout, delays, snapshot/read pagination, every offered sort/category, invalid input/injection, legacy redirects/navigation, existing screener/detail behavior and dashboard architecture. Not a full repository suite.
- 6 actual-source Node outbound-link tests passed, including the dashboard-only no-public-link rule and publisher/SEC fallback.
- Focused TypeScript: 5 actual source roots, 791 source/declaration files, zero diagnostics. This covers filter/URL/query contracts plus filter/drawer component types, not a full application typecheck.
- Targeted lint passed without warnings. Source whitespace check passed.
- 19 actual React component browser checks passed: unified feed, invalid range/cancel/apply, user-isolated preferences/reopen, sort, snapshot load-more, error/retry, focus restoration, summarized/BW/NuntioBot/source-only SEC drawers, Navy Dark native date controls, mobile portrait/landscape overflow and future restricted basic view. External network blocked; synthetic rows/identity/actions/router only; no Next server or hosted Auth.
- Visual inspection: desktop Light feed and mobile Navy Dark filters fit and keep controls readable/reachable. The date-picker icon initially failed to inherit Dark; it now uses the shared theme mode's native color-scheme and the affected type/lint/browser checks passed again. The filter drawer has a top close control and bottom Cancel.
- Production-shaped synthetic cap query: 12,000 eligible rows, 100M <= cap < 300M, ascending sort, 100-row result; measured 33.13 ms. This is an isolated local benchmark, not production latency. Current production unfiltered article count from read-only Coordinator evidence was 11,261; no new index was justified by this evidence.

Machine results/screenshots: `/tmp/traderlink-news-unified-qa-20261118/`. Compact durable results: `press-releases-unified-qa-20261118.json` in this docs folder. Actual cap metadata receipt `news-market-cap-metadata-readonly-20261118.json` under Coordinator operations, SHA `d31e38f538838c157fb9fdc70aa622263ded39182ce1cf2a1cd01b69f71ad672`: 998 text and 2 null values in 1,000 recent insertions, representative values `3.0 M`, `2.8 M`, `17.5 M`; no article IDs/body/source URLs were returned. Numeric `marketCapValue` is USD according to the verified existing publication writer and takes precedence when available.

## Consolidated QA corrections and limits

Initial discovery found a search-state synchronization effect rejected by React lint; draft search now updates conditionally without an effect. The type harness initially omitted the project's ESNext library and the browser harness initially used classic JSX; their configuration was corrected to match the actual project. No dependency install or product-wide module-type change was needed. The complete affected batch then passed; later native-date theme correction received focused retesting. No unresolved News-layer failure remains.

Full Next startup/build, native authenticated whole-page navigation and integrated subscription-plan behavior were not exercised by the component harness. They remain integration/release checks, not silently counted as passes. No hosted Auth, providers, deliveries, replay, production writes, new server, staging/deployment or Git mutation occurred. Shared Chart QA guards were respected; finite QA acquired/released both normal guards after the Chart owner finished.

Next: send the approved [Membership contract](press-releases-membership-handoff-20261118.md) to Custom Plans and Coordinator. Membership must keep enforcement off, qualify its catalog/plan changes and report whether any migration is needed. Coordinator then applies the existing conditional production authorization and owner timing gate; never publish merely because local checks pass.

Owner extension: account-backed preferences, named views and custom filtered notifications are now being implemented under [the account views plan](press-release-account-views-and-alerts-plan-20261119.md). The prior combined44 checkpoint passed full build and24native desktop/mobile checks before this extension. Its receipt is not final QA for the new scope. Premium enforcement remains OFF; production publication is held and a required migration must also respect the20:00Toronto gate.


2026-11-19 final account views/custom-alert local acceptance: all28 actual native cases PASS/0JSerrors; fullbuild+57focused+6outbound/types/lint pass. Final runtime/port/guards closed01:08:02UTC. Account restore across empty browser, independent custom ranges/Settings persistence, error recovery and real syntheticqueue opt-out proven; premium enforcementOFF. See press-release-account-views-and-alerts-qa-20261119.md. Coordinator owns staged release: baseline5f014 is independently migration-free/24casequalified; latest account features require coherent28-path extension+0221/order296, selectedprefix/backup/catalog qualification, migrations8:15pm–4amToronto. No worker publication/hostedDDL. Final documentation-only updates follow frozenQA closure.
