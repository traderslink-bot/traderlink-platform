# Help Center And Daily Trade Tracker Guides Progress

Status: Help 1-3 owner approved; scalable collection navigation adjustment implemented; final verification active

Controlling plan: [Help Center And Daily Trade Tracker Guides Plan](./help-center-daily-trade-tracker-plan.md)

Planned Analyzer revision: [Trade Analyzer Help Center Plan](./help-center-trade-analyzer-plan.md)

## Current checkpoint

- [x] Confirmed the Help Center belongs inside the authenticated Material
  dashboard rather than a separate documentation application.
- [x] Inspected the global dashboard navigation, shell, shared dashboard page
  components and route-title behavior.
- [x] Confirmed there is no existing Help route or Help navigation contract to
  preserve.
- [x] Reviewed the Next.js 16 App Router guidance for nested layouts, routes,
  links, metadata, dynamic params and Server/Client Component boundaries.
- [x] Inventoried the live Daily Trade Tracker's visible user workflows and the
  accepted tracker/analyzer plans.
- [x] Defined the Help start page, desktop article navigation, mobile Browse help
  interaction, local search and reusable article template.
- [x] Split the Daily Trade Tracker collection into six focused guides.
- [x] Recorded the full coverage checklist for manual entry, trade review,
  charts, analysis, rules, tags, notes, open positions, day review and data
  timing.
- [x] Added an explicit feature-to-guide map so every supported control and
  result must be explained, not merely named.
- [x] Added the complete current 12-pattern candle-detector list and the
  confirmation/timeframe boundary each pattern guide must explain.
- [x] Added the execution-to-trade lifecycle for Long and Short positions,
  including partial fills, return to zero and a new trade after zero.
- [x] Added the complete Green-to-red result set, recovery behavior, profit
  opportunities, actual-versus-calculated P/L and fee coverage.
- [x] Added a dedicated individual **View analysis** walkthrough covering every
  buy/sell fill, chart focus, Entry/Exit analysis categories, Short-trade
  meaning and return to Combined overview.
- [x] Added Trade rule versus Daily rule definitions, the `/rules` link, all
  rule statuses and the meaning of the Rules broken summary.
- [x] Added the exact purpose and consequences of Mark day reviewed, including
  open-position classification, saved notes, later edits and AI Review usage.
- [x] Corrected the manual-entry guide to match the current UI: any past date,
  one Eastern trading date per save, and server validation without claiming a
  user-visible preview step.
- [x] Recorded the owner-required disclosure that same-day Moomoo candles may be
  finalized once after the session.
- [x] Kept automatic Moomoo execution importing out of current-feature claims.
- [x] Defined plain-language, privacy, accessibility and responsive standards.
- [x] Re-read the complete plan after expansion, checked its linked documents,
  corrected stale manual-entry wording and confirmed the feature-to-guide map
  covers the current Tracker UI.
- [x] Owner approved the Help Center plan and information architecture.
- [x] Added Help Center to the authenticated dashboard navigation.
- [x] Implemented the Help start page, responsive Help navigation and local
  content search.
- [x] Published the Daily Trade Tracker collection overview.
- [x] Published all six Daily Trade Tracker guides and their direct section
  anchors.
- [x] Connected every guide and section to the static search registry.
- [x] Added breadcrumb, in-article, previous-guide and next-guide navigation.
- [x] Completed focused ESLint for the Help/navigation allowlist.
- [x] Completed full TypeScript verification and static content-registry
  integrity checks.
- [x] Confirmed 6 unique guide routes, 28 unique guide-section anchors, 35
  unique search records, 5 populated popular-help links and no unpublished
  Help search target.
- [x] Kept the long-form article library out of the client Help-navigation
  bundle by passing only the small navigation list from the server layout.
- [x] Owner approved the Help Center UI and complete Daily Trade Tracker guide
  presentation.
- [x] Replaced the flat article list with collapsible top-level Help
  collections. Daily Trade Tracker expands to show its six articles, the
  current collection opens automatically, and future collections remain
  collapsed until selected.
- [x] Rechecked user-facing copy against the live Tracker source for View
  analysis, Combined overview, Entry/Exit analysis, analysis section titles,
  rule statuses, all five open-position labels, tag groups and all 12 chart
  pattern names/explanations. The candle-pattern guide now states the exact
  close or following-candle confirmation boundary used by the chart copy.
- [x] Documented the future Daily Tracker Help revision: retain Tracker-specific
  workflow instructions while linking detailed chart, Entry/Exit,
  Green-to-red, candle-pattern and long-term statistics to the standalone Trade
  Analyzer Help collection.
- [x] Published the Trade Analyzer Help routes and stable anchors, then revised
  the Daily Tracker articles to retain workflow instructions and link the
  reusable Analyzer reference without losing current coverage.
- [ ] Complete production-build verification. The first local build reached
  Next.js production compilation and produced partial server/static output,
  but Windows terminated the compiler under local memory pressure before the
  final build manifests were written. No Help TypeScript or lint failure was
  reported.
- [ ] Complete desktop and mobile owner visual review. The LAN preview was
  correctly configured, but Windows classified the home Wi-Fi as Public and
  blocked inbound TCP 3010. Administrator confirmation must wait until the
  owner returns to the computer.

## Product inventory checked

The planning pass verified coverage for:

- week/day navigation and daily summary;
- one ticker card per symbol and multiple completed trades per ticker;
- one selected trade in the ticker chart and expanded details;
- manual execution entry, validation, save and later correction;
- partial entries, adds, partial exits and final exits;
- trade tags, trade notes and the Daily Notes technical recap;
- preset/custom trade and daily rules;
- Daily Notes and day review;
- open Day/Swing position classification;
- 1-minute, 5-minute, 15-minute and 1-hour chart views;
- 1-minute and 5-minute combined and individual execution analysis;
- chart executions, volume, VWAP, EMA 9, candle patterns and zoom controls;
- Green-to-red and profit-opportunity analysis;
- immediate same-day, exit-plus-60-minute and post-session update states; and
- truthful incomplete/unavailable coverage and current overnight boundary.

## Implemented guide collection

The published collection now contains:

1. Getting started.
2. Add and edit trades.
3. Review trades and executions.
4. Chart replay and Trade Analyzer.
5. Rules, notes and finish the day.
6. Data timing and limitations.

Each guide is built from a shared article model. Search indexes both guide
titles and individual section summaries/keywords, so results open the relevant
anchor rather than only the collection landing page.

## Current verification boundary

The initial `/help` runtime check caught and corrected a Next.js 16
Server/Client link-boundary error. The corrected Help start page returned 200
with meaningful content and no error document through both loopback and the LAN
bridge before the bridge was stopped. The full six-guide collection was then
implemented with the development server stopped to reduce memory pressure.

Remaining work is the required production-build confirmation and owner
desktop/mobile visual review when local browser access is available on
2026-08-10. The dashboard-template verifier remains deferred because the active
project instruction explicitly prohibits Vitest during the UI-design cadence.

## Concurrent-work boundary

The working tree contains active AI Reviews work owned by another task. This
Help slice will not edit or stage AI Review files, shared migration records or
unknown untracked files. Any eventual Help commit will stage only the explicit
Help/navigation allowlist.
