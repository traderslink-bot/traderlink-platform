# TraderLink Platform PWA Professional Redesign Plan

**Status:** Owner approved on 2026-08-20; PWA-R1 implementation authorized

**Prepared:** 2026-08-20

**Canonical application:**
`C:\Users\jerac\Documents\TraderLink\traderlink-platform`

**Original PWA contract:**
[TraderLink Platform PWA Plan](traderlink-platform-pwa-plan.md)

**Redesign progress:**
[TraderLink Platform PWA Professional Redesign Progress](traderlink-platform-pwa-professional-redesign-progress.md)

## 1. Outcome

Deliver an installed TraderLink Platform experience that is visually and
behaviorally the same product as the website dashboard. Offline capability is
a state of the real application, not a second simplified dashboard.

The redesign must:

1. preserve the approved light Material design, complete grouped navigation,
   icons, responsive shell and page hierarchy;
2. reuse the website application's design components and route-specific view
   components;
3. retain the proven offline trade outbox, retry, duplicate-review, Web Push,
   account-scope and privacy safeguards;
4. replace text-scraped page projections with explicit versioned view models;
5. give every accepted dashboard route a deliberate offline experience;
6. update installed applications safely when the website UI or content changes;
7. pass owner screenshot review throughout implementation; and
8. withhold PWA product acceptance until the complete desktop and mobile
   experience is professional and coherent.

## 2. Owner rejection and reset boundary

On 2026-08-20 the owner reviewed the installed PWA's genuine offline Daily
Trade Tracker, Swing Trade Tracker and Quick Trade Entry screens and rejected
their presentation. The screens used a separate static offline renderer that:

- reduced the real sidebar to text links and lost the website's icons,
  collapsible group behavior and hierarchy;
- converted page content into generic cards made from copied visible text;
- repeated instructional copy above a generic execution form;
- separated offline entry from each tracker's established workflow; and
- did not retain the professional TraderLink tracker feel.

Earlier approvals of the icon, feature boundary, offline-entry safety and Push
settings remain valid. Earlier visual approval of the current offline shell,
projection cards and tracker presentation is withdrawn. The current visible
PWA is a functional technical proof only and is not a product-accepted release.

### 2.1 Preserve

- the corrected owner-approved icon family;
- manifest identity and install start route;
- account-partitioned IndexedDB storage;
- the manual-trade outbox and exact entry facts;
- foreground, resume, reconnect, manual and best-effort background sync;
- canonical Journal preview/commit and idempotency paths;
- website/PWA exact-fact duplicate detection;
- **Saved on this device**, **Syncing**, **Saved to TraderLink** and
  **Needs your review** states;
- explicit **Already entered** and **Save as separate** decisions;
- encrypted, opt-in Web Push subscription and generic lock-screen content; and
- private `no-store` network contracts and server-authoritative calculations.

### 2.2 Replace

- `offline.html` as a hand-authored standalone visual application;
- the visible UI produced by `public/pwa-offline-dashboard.js`;
- visible-text DOM scraping as the offline page data contract;
- generic heading/line projection cards;
- the plain-text recreation of dashboard navigation;
- duplicated tracker instructions and the bolted-on generic form; and
- manually maintained service-worker cache names as the application update
  mechanism.

The old renderer stays available only as a rollback point while the new shell
is developed. It is removed from the active service-worker fallback only after
the owner approves the replacement shell and all three tracker screens.

## 3. Non-negotiable product principles

### 3.1 One application

There is one TraderLink Platform. Installation changes the browser chrome and
adds offline capabilities; it does not select a smaller product or a different
design system.

### 3.2 Real design-code reuse

The redesign uses these existing sources of truth:

| Concern | Existing authority |
| --- | --- |
| Dashboard route layout | `app/(dashboard)/layout.tsx` |
| Shell, logo, desktop sidebar and mobile drawer | `app/dashboard-shell.tsx` |
| Navigation groups, routes, hierarchy and icon keys | `app/dashboard-navigation.ts` |
| Theme, typography and actions | `app/mui-theme.ts` |
| Page, panel, metric, status and action components | `app/dashboard-template.tsx` and `app/dashboard-ui.tsx` |
| Route-specific presentation | Existing page/client components beneath `app/(dashboard)` |
| Shell enforcement | Dashboard template contract and verifier |

The PWA must not maintain a second navigation array, icon map, theme or card
system. When the website navigation changes, the installed application receives
the same configuration through the normal application release.

### 3.3 Shared view components, separate data providers

Authenticated Next.js Server Components cannot run without the server and
private authenticated HTML must not be cached. The professional solution is to
share presentation rather than cache server execution:

```text
online route Server Component
  -> server-authorized serializable page model
  -> shared TraderLink page view component

offline PWA shell
  -> account-partitioned versioned saved page model
  -> the same shared TraderLink page view component
```

Each supported route family gains a plain serializable view-model contract and
a presentation component that does not query the server. The existing online
route supplies current facts. The offline shell supplies the most recent
compatible saved model from IndexedDB. No metric is recalculated in the
browser.

### 3.4 Professional offline state

Offline state is a compact part of the real page:

- one small header status: **Offline · Last updated [time]**;
- one account-aware sync indicator when trades are waiting;
- normal page title, controls, sections, charts and tables;
- unavailable live actions disabled in their normal locations with a concise
  explanation; and
- no stack of introductory offline cards above the page.

## 4. Application shell and navigation contract

The installed PWA must reproduce the website shell at the same viewport.

### Desktop

- real TradersLink logo and spacing;
- the same collapsible left navigation;
- semantic icons on every destination and group;
- real **Trades**, **Trade Analyzer** and **Analytics** groups with their
  current expanded/collapsed behavior;
- the same standalone destinations and Notifications access;
- the same active-route treatment;
- the same full-width page container and header actions; and
- no horizontal page overflow at accepted desktop widths.

### Mobile and narrow widths

- the same compact header and menu control as the website;
- the real Material navigation drawer with icons and group structure;
- 44-pixel minimum interactive targets;
- page-owned title and one compact offline status;
- trade-entry controls that fit without document-level horizontal scrolling;
- contained table/chart scrolling where the website already uses it; and
- safe-area support for installed standalone display.

### Navigation inventory

| Group | Destinations retained in the installed app |
| --- | --- |
| Home | Workspace |
| Trades | Daily Trade Tracker, Swing Trade Tracker, Quick Trade Entry, Calendar, Trade Explorer, Compare Trades, Open Positions, Trading Rules, Rule Results |
| Trade Analyzer | Day Trade Analysis, Entry & Exit, MFE & MAE, Green-to-Red, Candle Patterns, Analyzed Trades |
| Analytics | Overview, Ticker, Timing, Trade Breakdown |
| More | AI Chat, AI Reviews, Account, Import Trades, Market Charts, Data Decisions, Help Center |
| Header/context | Notifications Center and route-aware Help |

Hidden, redirected, compatibility and administrative routes do not become new
PWA navigation merely because source files exist. Analytics Lab remains hidden
under its current product gate. The PWA consumes the accepted navigation
configuration at build/runtime rather than freezing this table in a second
implementation.

## 5. Complete route and offline-behavior matrix

Every route keeps its real online behavior. The matrix below controls what the
same presentation may do without a connection.

### 5.1 Workspace and Trades

| Surface | Offline presentation | Offline actions |
| --- | --- | --- |
| Workspace | Same card/grid layout with the last server-issued summaries, coverage and timestamp | Navigate saved pages; no local metric recalculation |
| Daily Trade Tracker | Same current-week/day hierarchy, date context, trades, notes/rules/review sections and entry placement | Save execution batches to the device; existing server-authoritative notes, tags, rules and review mutations remain disabled |
| Dated Daily Tracker | Same selected-day presentation when saved | Save execution batches only when a saved policy envelope says the date is eligible; otherwise factual read-only view |
| Swing Trade Tracker | Same active/recent swing hierarchy, cached position cards and tracker entry placement | Save execution batches to the device; no offline lifecycle classification or note mutation |
| Swing detail | Same position heading, execution history, notes chronology and normal action locations | Add offline executions through the shared entry flow; relationship/classification is confirmed by the server after reconnect |
| Quick Trade Entry | The real focused Quick Entry form is the primary page content | Save one ordered multi-execution batch to the device |
| Calendar | Same week/month presentation for downloaded date windows | Move among downloaded windows and open saved day details; no unsaved local financial calculations |
| Trade Explorer | Same filters, results, scorecards and detail affordances for an explicitly saved query model | Client-only presentation controls may operate on saved rows; a query requiring new server facts explains that reconnection is required |
| Compare Trades | Same selected comparison layout for saved comparison models | Inspect the saved comparison; creating a new server-calculated comparison requires a connection |
| Open Positions | Same factual position list/cards and coverage | Read only; stale status is prominent and no close/reclassify action is implied |
| Trading Rules | Same rule list, categories and disclosures | Read saved rules; create/edit/retire remains online-only |
| Rule Results | Same factual result summaries, evidence and pagination for saved models | Read and inspect saved evidence; no local rule evaluation |
| Candle Review | Same saved trade/candle review presentation when explicitly downloaded | Read-only; provider refresh and Journal-link mutations require a connection |

### 5.2 Trade Analyzer

| Surface | Offline presentation | Offline actions |
| --- | --- | --- |
| Day Trade Analysis | Same summary metrics, coverage and drill-down layout | Inspect saved model only |
| Entry & Exit | Same charts, summaries and execution evidence | Inspect bounded saved rows; no candle/provider request |
| MFE & MAE | Same metrics, comparisons, filters and measured rows | Client presentation over saved rows only; no new calculation |
| Green-to-Red | Same result hierarchy and evidence | Inspect saved model only |
| Candle Patterns | Same pattern names, summaries, occurrences and saved evidence | Inspect saved facts; live candle replay requires a connection |
| Analyzed Trades | Same table, pinned ticker treatment, pagination and detail affordance | Inspect downloaded pages/details; requesting uncached rows requires a connection |

Trade Analyzer values remain server-issued and retain their calculation,
coverage, reporting-currency, account and date-filter versions.

### 5.3 Analytics

| Surface | Offline presentation | Offline actions |
| --- | --- | --- |
| Overview | Same metrics, charts, coverage and date-range presentation for the saved query | Inspect saved model; changing to an uncached query requires a connection |
| Ticker | Same searchable/sortable ticker table and trade-detail affordance for saved rows | Local search/sort/pagination over the bounded saved model only |
| Timing | Same charts, groupings and evidence table | Inspect saved model only |
| Trade Breakdown | Same factual construction breakdown, charts and exact-trade detail | Inspect saved model only |

Analytics Lab remains hidden/redirected online and is not restored as an
offline feature.

### 5.4 Platform, Coach and support

| Surface | Offline presentation | Offline actions |
| --- | --- | --- |
| AI Reviews list/detail | Same saved-review list and issued weekly/monthly review layout | Read downloaded issued reviews; no new review generation |
| AI Chat | Real Chat page/drawer visual context with one concise connection-required state | Read support text only in the first redesign; generation and Journal proposals require a connection |
| Account | Same Account section navigation and page hierarchy | Device-local offline storage/outbox controls remain available; identity, security, reporting and server preference changes require a connection |
| Import Trades | Same import page frame and source guidance with a connection-required state in the normal intake area | No file staging, parsing, provider connection or import commit |
| Market Charts | Same page frame and controls with a connection-required state where the live chart belongs | No live market-data request |
| Data Decisions | Same page frame and normal hierarchy with a connection-required state | No stale correction/exclusion/decision mutation |
| Help Center and articles | Same Help navigation, search presentation and article typography | All shipped first-party guides are available offline; links to uncached external material remain clearly external |
| Notifications Center | Same notification list/cards, category treatment and destination links for the saved bounded list | Read saved notifications; read/dismiss/preference changes require a connection |

### 5.5 Contextual and compatibility routes

- recent dated Daily Tracker pages use the Daily view model;
- Swing position detail uses the Swing-detail view model;
- weekly and monthly AI Review detail uses the issued-review view model;
- Help article routes use the shipped Help registry;
- Account subsections use the same Account navigation and online-required
  mutation boundary;
- legacy canonical redirects resolve to the accepted destination when online;
- when offline, a known safe canonical destination opens its saved model;
- `/workspace/readiness`, Admin, hidden Analytics Lab and operations-only routes
  are not ordinary offline product pages; and
- no V3 route or renderer becomes a PWA dependency.

## 6. Tracker interaction design

The three offline entry experiences must look and behave like their website
counterparts.

### 6.1 Placement

- Daily entry remains in the established Daily Tracker entry section.
- Swing entry remains in the established Swing Tracker workflow.
- Quick Entry remains a focused form without unrelated tracker sections.
- Offline status never creates a second form below a copied page.

### 6.2 Entry controls

- reuse the website input components, labels, spacing and row behavior;
- keep date, ticker, side, time, quantity, price and optional fees;
- keep Add execution and Remove in their normal hierarchy;
- use Eastern Time/account-timezone wording already approved by the product;
- use plain trader-facing validation;
- retain lossless input values and at-most-two-decimal display outside editing;
  and
- never label an offline save as accepted Journal data.

### 6.3 Saved-trade status

Pending entries appear as a compact, deliberate part of the page—not a large
introductory card stack.

- a header/status badge shows the waiting count;
- a compact disclosure or drawer lists saved batches;
- each batch shows tracker, saved time, execution count and state;
- **Needs your review** opens the existing factual detail and duplicate choices;
- **Sync now** appears only when it can act;
- successful entries remain briefly visible as **Saved to TraderLink**; and
- Notifications Center includes sync outcomes using the same status language.

## 7. Explicit offline data contracts

The current `traderlink-visible-page-projection-v1` text-block format is not a
professional presentation contract and will not drive the redesigned UI.

### 7.1 View-model envelope

Every saved model contains:

- schema and route-view version;
- opaque offline user/workspace scope;
- exact selected-account ref when applicable;
- route and normalized query identity;
- server generation time and device save time;
- reporting currency and account timezone where needed;
- calculation/data version;
- coverage and unavailable-with-reason facts;
- bounded route-specific presentation data; and
- no server mutation capability or reusable authorization secret.

### 7.2 Per-surface models

Models are owned by their source module, not one generic Platform text scraper.
Journal owns tracker/open/rule/calendar models; Journal Analytics owns Analytics
and Trade Analyzer models; Coach owns issued-review models; Platform owns
Workspace, Notifications, Account device controls and shell state; Help owns
shipped guide content.

### 7.3 IndexedDB migration

- introduce a new versioned saved-view store rather than rewriting records in
  place;
- preserve every unsynced manual-trade outbox record exactly;
- keep the old text projections during the review/rollback period;
- ignore incompatible page models with a clear **Reconnect once to update this
  page** state;
- never clear outbox data during a service-worker or UI update; and
- remove the old projection store only in a later explicit cleanup after the
  redesigned PWA is accepted.

## 8. Service worker and application updates

The redesign follows the Next.js PWA guidance and uses a build-generated
precache manifest rather than a hand-maintained cache-version string. The
planned integration uses `@serwist/next`/Serwist as the narrow asset-manifest
and service-worker build layer because the application already provides a
Webpack build path.

Serwist must not use a broad default runtime cache. TraderLink supplies an
explicit allowlist:

- precache only the public offline React shell, its hashed JavaScript/CSS,
  fonts required by that shell, manifest assets and icon family;
- network-first navigation for authenticated application routes;
- never cache authenticated HTML, React Server Component payloads, Journal API
  responses, imports, statements, account responses or provider data;
- keep explicit IndexedDB projections as the only offline account-data source;
- preserve existing push, notification-click, logout cleanup and outbox sync
  handlers; and
- serve the React offline shell only after a navigation genuinely fails.

### 8.1 Update lifecycle

1. A website deployment publishes new hashed application assets and a new
   service-worker manifest.
2. The installed PWA checks the service worker without HTTP cache reuse.
3. The new public shell downloads in the background.
4. If there is no unsaved form work, the update activates on the next safe
   navigation/reopen.
5. If the user is editing, TraderLink shows **Update ready** and waits. It never
   discards form work.
6. Activation removes only obsolete public shell caches, not IndexedDB outbox
   or saved account models.
7. Incompatible saved page models show a refresh requirement rather than
   malformed or misleading data.

The user does not reinstall the PWA for normal website content or UI releases.

### 8.2 Technical references

- [Next.js Progressive Web Application guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
  documents App Router manifests, service-worker update headers, Push and the
  supported Serwist offline option.
- [Serwist Next.js integration](https://serwist.pages.dev/docs/next/getting-started)
  provides build-generated precache manifests. TraderLink will use only its
  narrow build/asset facilities and the explicit allowlist above, not a broad
  default cache policy.

## 9. Privacy and factual integrity

- private authenticated network responses remain `private, no-store`;
- saved models are explicit, bounded and partitioned by opaque scope;
- account switching changes the active partition before rendering;
- sign-out hides the prior partition and revokes the current push endpoint;
- no raw statement, source row, broker identifier, credential, provider token,
  identity evidence, AI prompt, recovery key or owner-admin data is stored;
- cached values are always marked last updated and never represented as live;
- financial facts are not recalculated from copied page text;
- pending offline trades remain outside positions, P/L, counts, Rules and
  Analytics until accepted by the Journal; and
- duplicate review remains server-authoritative.

## 10. Implementation checkpoints and owner review

### PWA-R0 - redesign contract

- approve this complete scope and route matrix;
- record withdrawal of current offline-shell visual acceptance;
- preserve the safety layer and rollback point; and
- authorize only PWA-R1 after owner approval.

### PWA-R1 - real shell parity

- add the public React offline bootstrap;
- reuse the real shell, navigation configuration, semantic icons and theme;
- add the build-generated public-shell asset manifest and safe update flow;
- render a compact offline/header state and a native online-required state;
- do not connect route data or tracker writes yet; and
- present screenshots at desktop, 390-pixel mobile with drawer open/closed, and
  installed standalone window for owner approval.

### PWA-R2 - tracker parity

- extract/share the real Daily, Swing and Quick Entry presentation components;
- connect existing outbox behavior inside those components;
- add the compact saved-trade status disclosure;
- preserve exact duplicate review behavior; and
- present each tracker online/offline at desktop and narrow mobile for owner
  approval before continuing.

### PWA-R3 - Trades, Analyzer and Analytics saved views

- implement explicit module-owned view models;
- complete Workspace and every section 5.1-5.3 last-synced surface;
- preserve charts/tables/details and factual coverage;
- review in three visual batches: Workspace/Trades, Trade Analyzer, Analytics;
  and
- do not mark a batch accepted until the owner approves its screenshots and
  actual installed-app behavior.

### PWA-R4 - Platform, support, Push and updates

- complete AI Reviews, Account device controls, Help and Notifications saved
  views;
- complete native online-required states for AI Chat, Imports, Market Charts,
  Data Decisions and server-only account actions;
- verify Web Push still opens the real Notifications Center;
- verify safe application update activation and outbox preservation; and
- receive desktop/mobile visual approval.

### PWA-R5 - complete acceptance

- cap read-only offline page data at 50 MB across the browser, remove the
  oldest saved page copies first and never automatically remove an unsynced
  or review-required trade;
- report the browser's estimated app storage together with the current
  account's saved-page and pending-trade state;
- resource-aware focused static and contract checks;
- real installed Chrome/Edge desktop acceptance;
- genuine offline close/relaunch across the complete inventory;
- Daily, Swing and Quick offline-save/reconnect acceptance;
- duplicate, account-switch, sign-out, removal and version-update acceptance;
- narrow-mobile browser and hosted phone install acceptance;
- real hosted Web Push and background-delivery acceptance after separate
  deployment/secret authorization; and
- final owner product approval of the complete PWA.

## 11. Visual review evidence

Every visible checkpoint supplies actual screenshots from the app, not DOM text
or component-code inference.

Required evidence includes:

- desktop online and offline comparison for the same route;
- desktop sidebar expanded and collapsed;
- narrow-mobile page with drawer closed and open;
- Daily, Swing and Quick Entry with no saved entries, waiting, syncing, saved
  and review states;
- one representative page from every saved-view family;
- every online-required state;
- Notifications Center and Push destination;
- update-ready state with an unfinished form; and
- installed standalone window chrome and corrected icon.

The browser review checks hierarchy, typography, density, alignment, focus,
keyboard use, 44-pixel mobile controls, scrolling, empty states, error states,
console errors and framework overlays.

## 12. Verification cadence

During implementation:

- preserve concurrent work and stage only explicit PWA files;
- do not run Vitest or broad suites during active UI design;
- use targeted lint/type/syntax checks only after a coherent slice;
- run the dashboard-template enforcement, larger contract checks, production
  build and broad browser acceptance only at the final checkpoint explicitly
  authorized for them;
- keep background workers disabled during local review;
- start only a verified loopback review server and stop only a server started by
  the PWA task; and
- keep hosted deployment, production secrets, provider calls and hosted state
  outside this plan unless separately authorized.

## 13. Acceptance checklist

- [x] Owner approves this complete redesign plan.
- [ ] The installed app uses the actual dashboard shell, theme and navigation.
- [ ] Navigation preserves all groups, hierarchy, icons and responsive behavior.
- [ ] The PWA maintains no independent visual navigation or theme source.
- [ ] Daily, Swing and Quick Entry preserve their website layouts offline.
- [ ] No generic text-projection card renderer remains in the accepted path.
- [ ] Every accepted destination has the section 5 offline behavior.
- [ ] Saved pages use explicit module-owned view models.
- [ ] All cached financial values are server-issued, scoped and timestamped.
- [ ] Outbox, idempotency, duplicate review and Journal authority are preserved.
- [ ] Service-worker updates are build-versioned and preserve unsynced entries.
- [ ] Normal website UI/content releases reach installed apps without reinstall.
- [ ] Private HTML/API/statement/provider data is never broadly cached.
- [ ] Read-only saved pages stay within the 50 MB browser budget without
      automatically removing an unsynced or review-required trade.
- [ ] Desktop and narrow-mobile screenshot gates pass throughout.
- [ ] Genuine installed-app offline relaunch passes across the complete inventory.
- [ ] Hosted phone, Push and background-delivery gates pass when authorized.
- [ ] Owner gives final visual/product approval.

## 14. Explicitly deferred

- native iOS or Android applications;
- offline AI generation;
- offline imports, Data Decision mutations, live market data or account/security
  mutations;
- a complete raw Journal mirror on the device;
- browser-side financial recalculation;
- hidden Analytics Lab or operations/admin routes as ordinary PWA pages;
- production deployment, Railway changes, DNS cutover or production secret
  activation without separate authorization; and
- deletion of preserved PWA code/data before the accepted rollback boundary.
