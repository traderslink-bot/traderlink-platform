# TraderLink Platform PWA Plan

**Status:** Owner approved; implementation authorized

**Approved:** 2026-08-18

**Canonical application:**
`C:\Users\jerac\Documents\TraderLink\traderlink-platform`

**Controlling replacement plan:**
[TraderLink Platform Replacement Plan](traderlink-platform-replacement-plan.md)

**Implementation progress:**
[TraderLink Platform PWA Progress](traderlink-platform-pwa-progress.md)

## 1. Outcome

Make the complete TraderLink Platform dashboard installable as a Progressive
Web App without creating a smaller second dashboard. The first PWA release adds:

1. offline execution capture through Daily Trade Tracker, Swing Trade Tracker
   and Quick Trade Entry;
2. retry-safe foreground and opportunistic background synchronization;
3. rich, bounded, last-synced read access across the useful dashboard;
4. opt-in, privacy-safe Web Push notifications; and
5. one corrected TraderLink app-icon family derived from the existing favicon
   artwork.

The online dashboard does not have to be free of every unrelated bug before
this work starts. PWA acceptance is its own checkpoint and does not make an
unfinished dashboard feature complete.

## 2. Fixed owner decisions

- The installed PWA is the complete dashboard, not a reduced trade-entry app.
- Analytics, Trading Rules, Rule Results and the complete accepted navigation
  remain visible in the installed app.
- Offline execution capture is included in the first release for Daily Trade
  Tracker, Swing Trade Tracker and Quick Trade Entry.
- Background sync is best-effort. Foreground, app-resume, reconnect and a
  visible **Sync now** action are required fallbacks.
- Push notifications are included in the first release and remain off until
  the trader deliberately enables them.
- Pending offline entries never enter official positions, P/L, trade counts,
  rules results or Analytics before the Journal server accepts them.
- The PWA uses the existing selected-account Journal preview/commit contract,
  idempotency protection, Data Decisions and factual reconstruction. It does
  not create another trade ledger.
- The app icon remains the existing white chain-link artwork on the navy
  background. The source artwork is translated exactly 23 pixels left and 4
  pixels down on its 512 by 512 master canvas; it is not redrawn.
- The manifest name is **TraderLink Platform** and its short name is
  **TradersLink**. The installed start route is `/workspace` and the application
  scope is `/`.

## 3. Complete installed-app inventory

Every current navigation destination stays visible and works normally while
online.

| Group | Visible destinations |
| --- | --- |
| Home | Workspace |
| Trades | Daily Trade Tracker, Swing Trade Tracker, Quick Trade Entry, Calendar, Trade Explorer, Compare Trades, Open Positions, Trading Rules, Rule Results |
| Trade Analyzer | Day Trade Analysis, Entry & Exit, MFE & MAE, Green-to-Red, Candle Patterns, Analyzed Trades |
| Analytics | Overview, Ticker, Timing, Trade Breakdown |
| Standalone | AI Chat, AI Reviews, Account, Import Trades, Market Charts, Data Decisions, Help Center |
| Header and contextual routes | Notifications, dated Daily Tracker pages, Swing trade detail, AI Review detail, Account subsections, Candle Review, Reflection Loop and Help articles |

Analytics Lab remains governed by its existing product gate. Installing the
PWA does not restore a route that the online dashboard intentionally hides or
redirects.

## 4. Offline behavior by product surface

Offline support is a capability of the same route, not a second route tree.
Each offline screen clearly shows `Offline · Last updated ...` and never
presents cached values as current.

### 4.1 Full offline interaction

- application shell and complete navigation;
- Daily Trade Tracker execution entry;
- Swing Trade Tracker execution entry;
- Quick Trade Entry;
- pending-entry review, retry and removal; and
- previously downloaded Help Center guidance.

### 4.2 Last-synced, read-only access

- Workspace;
- Calendar week and month views;
- Trade Explorer and Compare Trades;
- Open Positions;
- Trading Rules and Rule Results;
- Analytics Overview, Ticker, Timing and Trade Breakdown;
- all current Trade Analyzer pages;
- saved AI Reviews;
- Notifications;
- recent Daily Tracker dates and Swing details; and
- other explicitly downloaded bounded Journal detail projections.

The browser does not recalculate financial metrics. These screens display
server-issued projections with their server calculation version, account scope
and last-synced time.

### 4.3 Visible but online-required actions

- AI Chat and any new AI generation;
- new AI Review requests;
- live Market Charts and market-data refreshes;
- statement or broker imports;
- Data Decision mutations;
- broker connection and reauthorization;
- account, identity and security changes;
- Trading Rule mutations; and
- any action whose current server facts are required for safe completion.

The route remains visible offline and explains that the action needs an
internet connection. It does not disappear from navigation.

## 5. Offline execution outbox

### 5.1 Stored envelope

Each pending submission stores a versioned, account-scoped envelope in
IndexedDB containing only what is required to retry the existing Journal
command:

- a stable local submission ref and idempotency key;
- tracker kind: Daily, Swing or Quick;
- the exact execution-entry fields the trader entered;
- the opaque expected account-selection ref;
- creation/update timestamps and schema version;
- current sync state and a bounded plain-language failure state; and
- no server preview ref until an online preview succeeds.

The UI states are exactly:

- **Saved on this device**;
- **Syncing**;
- **Saved to TraderLink**; and
- **Needs your review**.

### 5.2 Sync state machine

1. Offline form validation confirms required fields, decimal shape, dates and
   non-future local times without claiming that server facts were checked.
2. The submission is stored atomically before the UI reports **Saved on this
   device**.
3. When connectivity is available, sync sends the existing authenticated
   preview request.
4. A deterministic preview uses the same relationship/style selection as the
   current online tracker and immediately sends the existing commit request
   with the stored idempotency key.
5. An account-selection conflict, changed position, expired/rejected preview,
   validation issue or genuinely ambiguous result becomes **Needs your
   review**. The service worker never guesses.
6. A successful commit records the bounded result, removes private execution
   payload fields from the pending outbox and refreshes affected projections.
7. Response-loss retries reuse the same idempotency key and cannot create a
   second execution.
8. Before an offline outbox commit, the server checks the exact execution-fact
   multiset against accepted manual batches for the same Platform user,
   workspace and Journal account. The check excludes the outbox's own
   idempotency key and runs inside the same immediate Journal write
   transaction as the commit.
9. An exact match from a different manual submission becomes **Needs your
   review** before any Journal write. **Already entered** removes only the
   device copy. **Save as separate** requires a plain-language confirmation,
   creates distinct execution facts and records the trader-confirmed separate
   resolution in the import mapping evidence.
10. The canonical execution-identity planner remains a second safeguard. A
    concurrent website save cannot silently create a counted duplicate while
    the PWA is waiting for the Journal write lock.

Unsynced entries remain separate from server-issued facts. Offline screens may
show a distinct pending count, but they cannot add those rows to official
positions or metrics.

### 5.3 Sync triggers

Required triggers are:

- immediate sync after an online save;
- browser `online` event;
- installed-app launch or resume;
- a visible **Sync now** action; and
- Background Sync when the browser and operating system provide it.

Background Sync is an enhancement, not the only delivery mechanism. Browsers
may delay or omit it, and mobile operating systems may suspend the app.

## 6. Rich offline dashboard storage

Authenticated HTML and Journal API responses retain their existing
`private, no-store` network contract. The service worker must not apply a
blanket cache-first rule to them.

Instead, the application writes explicit, versioned offline projections to
IndexedDB after an authorized online render. Each projection includes:

- an opaque Platform-user/offline-scope ref;
- the selected Journal account-selection ref where applicable;
- route/data-contract version;
- generated-at and last-synced timestamps;
- a bounded payload designed for that surface; and
- enough coverage metadata to preserve `unavailable` and excluded-with-reason
  states exactly.

The first release bounds storage to recent and useful data rather than a full
Journal mirror. Exact limits are named constants and displayed in Offline Data
settings. The user can refresh or remove all offline data from the current
device.

Offline storage excludes:

- raw statements and source rows;
- broker account identifiers, tokens, credentials or connection secrets;
- raw Discord/Whop/provider identities;
- statement evidence vault material;
- AI prompts or provider request payloads;
- encryption, signing or recovery keys; and
- owner-administration data.

## 7. Account and privacy boundary

- Offline records are partitioned by an opaque signed-in user scope and, for
  Journal data, the exact selected-account scope.
- A different user or selected account cannot enumerate or render another
  scope's projections or outbox.
- Account switching changes the active partition before any cached data is
  read.
- Sign-out hides the prior scope immediately and offers to remove its device
  data. It never silently submits that scope's outbox under a later session.
- **Remove offline data** clears the current device's cached projections,
  pending entries and push subscription after an explicit warning about
  unsynced trades.
- Storage eviction is possible. The UI never calls browser-local storage a
  backup and tells the trader whether a pending entry is only on this device.

## 8. Service worker and app shell

The service worker precaches only versioned public shell assets, the offline
fallback and the install icon family. It does not precache authenticated HTML
or indiscriminately cache Journal endpoints.

The service worker owns:

- install/activation and version cleanup;
- navigation fallback to the safe offline shell;
- best-effort outbox sync;
- push display and notification-click routing; and
- messages for explicit cache/projection cleanup.

The visible dashboard owns:

- service-worker registration;
- install readiness;
- online/offline and last-updated status;
- outbox status and manual retry;
- scope-aware projection writes and reads; and
- the user's notification and offline-data controls.

## 9. Web Push contract

- Permission is requested only from a user gesture in Account notification
  settings or an equally explicit PWA setup control.
- Denial or dismissal does not block the app and is not repeatedly prompted.
- Subscriptions are stored server-side against the stable Platform user and a
  versioned device ref, never a Journal account as identity.
- Endpoint and key material are encrypted at rest and never logged or exposed
  in Admin list responses.
- Push reuses the current notification categories: AI Review, broker
  connection, broker import, chart update, Data Decision and statement import.
- The user can enable/disable Web Push separately from in-app and Discord
  delivery.
- Lock-screen text is deliberately generic. It contains no ticker, P/L, price,
  quantity, account, statement name, broker identity, note or AI-review text.
- A push opens the authenticated in-app destination where normal account and
  entitlement checks run.
- Push events always create a visible notification; they are not used to
  silently upload trades.

Local device notifications may report only generic sync states such as
`Your saved trades were added to TraderLink` or
`A saved trade needs your review`.

## 10. App icon contract

The existing 512 by 512 favicon artwork is the source of truth. Its detected
white chain-link centroid is approximately `(278.56, 252.11)` on a canvas
centered at `(256, 256)`. The approved deterministic translation is therefore
23 pixels left and 4 pixels down.

The correction must:

- move the existing pixels without regenerating or reshaping the chain;
- preserve the navy background and white artwork colors;
- produce the root icon, Apple icon, 192 and 512 PWA icons and a maskable-safe
  512 icon from the same corrected master;
- keep the chain visually centered inside normal and masked app-icon crops; and
- pass an automated centroid measurement plus owner visual review.

## 11. Implementation checkpoints

### PWA 0 - approved contract and complete inventory

- Create this plan and progress record.
- Link them from the controlling replacement documents.
- Record the complete navigation inventory and offline behavior matrix.

### PWA 1 - install foundation and first visible checkpoint

- Correct and derive the icon family.
- Add the Next.js manifest and metadata links.
- Add the privacy-safe service-worker shell and registration.
- Add a small, plain-language offline/sync status surface.
- Present desktop and narrow-mobile screenshots for owner approval.

### PWA 2 - offline Daily, Swing and Quick Trade Entry

- Add the versioned, account-scoped IndexedDB outbox.
- Connect all three entry surfaces to save locally when offline.
- Add foreground/resume/reconnect/manual/background retry.
- Preserve existing preview/commit/idempotency and review boundaries.
- Stop exact website/PWA replay matches for an explicit **Already entered** or
  **Save as separate** decision under the Journal write lock.
- Add pending-entry review and removal.

### PWA 3 - rich offline dashboard

- Add versioned server-issued projections for every surface in section 4.2.
- Add the shared last-updated/unavailable presentation.
- Keep online-only actions visible with plain-language explanations.
- Add Offline Data settings, scope switching and removal.

### PWA 4 - Web Push

- Add encrypted subscription persistence and authenticated endpoints.
- Add separate Web Push preferences for the existing categories.
- Add user-gesture subscription/disable controls.
- Add generic push display, destination routing and expiration cleanup.

### PWA 5 - acceptance and hosted gate

- Complete targeted static checks and resource-aware verification.
- Verify install, offline reload, all three offline entry paths, retry,
  duplicate prevention, account isolation, projection timestamps, removal and
  push permission behavior.
- Complete owner visual/product approval on desktop and narrow mobile.
- Treat real phone install, real Web Push and background-delivery acceptance as
  a hosted HTTPS gate. Local implementation does not authorize deployment.

## 12. Acceptance checklist

- [x] Owner approved the exact 23-pixel-left, 4-pixel-down icon correction.
- [x] Owner approved the complete installed-app inventory and offline boundary.
- [ ] The app installs as TraderLink Platform and starts at `/workspace`.
- [ ] The corrected icon family is exact and visually approved.
- [ ] Every accepted dashboard destination remains visible in the PWA.
- [ ] Daily, Swing and Quick Trade Entry can be saved offline.
- [ ] Pending entries remain outside official Journal facts until commit.
- [ ] Foreground and best-effort background sync are retry-safe.
- [ ] A website save followed by delayed PWA sync cannot silently add the same
      manual execution facts twice.
- [ ] Rich offline pages show bounded server-issued facts and timestamps.
- [ ] Online-only actions remain visible and explain the connection need.
- [ ] Account switching/sign-out cannot expose or cross-submit offline data.
- [ ] Offline data can be deliberately removed.
- [ ] Web Push is opt-in, category-aware and privacy-safe.
- [ ] Targeted technical, browser and hosted phone gates pass.
- [ ] Owner approves the complete PWA experience.

## 13. Explicitly deferred

- A separate native iOS or Android application.
- Silent background trade upload through push events.
- A complete raw Journal or statement mirror on the device.
- Offline AI generation, live market data, imports, account/security mutations
  or Data Decision resolution.
- Public deployment, Railway changes, DNS cutover, production VAPID secrets or
  real push activation without separate owner authorization.
