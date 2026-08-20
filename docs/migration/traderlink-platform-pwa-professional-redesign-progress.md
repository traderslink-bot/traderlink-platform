# TraderLink Platform PWA Professional Redesign Progress

**Status:** PWA-R1 through PWA-R5 source work and local installed-Windows
acceptance are complete. Hosted phone installation, hosted Web Push and real
background-delivery acceptance remain separate deployment-authorized gates.

**Started:** 2026-08-20

**Controlling plan:**
[TraderLink Platform PWA Professional Redesign Plan](traderlink-platform-pwa-professional-redesign-plan.md)

## Repository boundary

- Canonical implementation:
  `C:\Users\jerac\Documents\TraderLink\traderlink-platform`
- Current branch: `codex/traderlink-platform-replacement`.
- Work directly in the shared checkout without creating a branch or worktree.
- Preserve concurrent dashboard, Analytics, Rules, Calendar, notification,
  navigation, shell and Journal work already present.
- PWA-R0 did not edit the already modified `app/dashboard-shell.tsx` or
  `app/dashboard-navigation.ts`. PWA-R1 began only after auditing that
  concurrent state.
- The PWA-R0 planning checkpoint did not stage, commit, push, deploy, change
  hosted configuration or activate production Push.
- The PWA-R1 shell checkpoint stages only its audited shell hunks and PWA
  documents. Concurrent navigation hierarchy work remains outside this slice.
- The accepted PWA-R1 source checkpoint is local commit `30954abf`. The earlier
  owner-approved shared-shell checkpoint is local commit `08434c78`.

## Owner decision that opened the redesign

On 2026-08-20 the owner reviewed genuine installed-PWA offline screenshots for
Daily Trade Tracker, Swing Trade Tracker and Quick Trade Entry. The owner found
that the pages looked like copied text placed into generic cards, the tracker
feel was lost, the left navigation lost its real group behavior and icons, and
the result was not professional. The owner required a serious redesign using
the website application's design code and confirmed that the complete app,
including Trade Analyzer, Analytics and the other dashboard pages, belongs in
scope.

The owner also established that normal website UI/content updates must reach
the installed PWA without a separate manual PWA release or reinstall.

The owner approved the complete professional redesign plan and authorized
PWA-R1 on 2026-08-20.

## Shared navigation correction discovered at PWA-R1 entry

The owner reported that condensing the desktop website navigation with the
left-chevron control leaves no apparent way to expand it again and asked for a
more professional control. Source inspection confirms that the expand control
is placed at the bottom of the condensed rail, separate from the top collapse
control. This creates an inconsistent and poorly discoverable toggle even when
the bottom control renders.

The owner approved one persistent, icon-only sidebar button using the familiar
menu/menu-open treatment and no visible state label. The first implementation
put that control at the start of the content-only toolbar. Owner screenshot
review confirmed that the icon itself was acceptable but its placement looked
detached from the navigation. The owner then selected the most common desktop
application treatment: one full-width global header with the toggle at the far
left and the TradersLink logo immediately beside it. The sidebar now begins
below that header, so the toggle stays at the same screen position in both
desktop states. A short hover tooltip and screen-reader label identify it as
**Toggle sidebar**. The desktop preference is remembered on the device, and
subtle separators retain the navigation groups in the icon rail. Mobile keeps
its existing full-width drawer pattern: hamburger opens, X closes, and no
condensed rail state is offered.

## Audit evidence

- The website design authority is the shared dashboard layout, shell,
  navigation, theme and dashboard template components.
- The current offline UI is a separate public HTML/JavaScript renderer.
- Current offline projections extract headings and visible text from rendered
  pages and store generic blocks rather than route-specific view models.
- The current offline navigation stores labels and routes but discards the
  semantic icon keys and the shell's real responsive/group behavior.
- The current service worker uses a manually named `traderlink-pwa-shell-v4`
  cache and cache-first handling for its public shell assets.
- The existing technical foundation has passed local install, real offline
  relaunch, Quick Entry offline save/reconnect, exact duplicate protection and
  Windows Push/Notifications Center delivery evidence.
- The original PWA outcome already required the complete dashboard and stated
  that offline support is a capability of the same routes. The implementation
  presentation did not meet that contract.

## Preserved foundation

- [x] Corrected icon family.
- [x] Manifest/install identity.
- [x] Account-partitioned device storage.
- [x] Daily/Swing/Quick manual-trade outbox.
- [x] Foreground/resume/reconnect/manual/background retry triggers.
- [x] Canonical Journal preview/commit and stable idempotency.
- [x] Website/PWA exact-fact duplicate review.
- [x] Opt-in encrypted Web Push and Notifications Center routing.
- [x] Private `no-store` network boundary.

## Rejected presentation

- [x] Owner withdrew acceptance of the standalone offline shell.
- [x] Owner rejected generic text-projection cards.
- [x] Owner rejected the plain-text navigation recreation.
- [x] Owner rejected the detached generic tracker form treatment.
- [x] Owner required actual website design-code reuse.

## PWA-R0 checklist

- [x] Re-read the controlling replacement, integrity, migration and PWA plans.
- [x] Audit the current dashboard design sources and complete route inventory.
- [x] Audit the current projection and service-worker implementation.
- [x] Confirm the Next.js Server/Client boundary and official PWA guidance.
- [x] Define real shell/navigation parity.
- [x] Define the complete route-by-route offline behavior matrix.
- [x] Define explicit module-owned saved view models.
- [x] Define a build-versioned safe update lifecycle.
- [x] Define iterative desktop/mobile screenshot approval gates.
- [x] Create the professional redesign plan and this progress record.
- [x] Receive owner approval of the complete PWA-R0 contract.

## PWA-R1 shared desktop sidebar toggle

- [x] Receive focused owner approval for the icon-only industry-standard
  treatment.
- [x] Preserve the concurrent Trade Analyzer navigation hierarchy changes
  already present in `app/dashboard-shell.tsx`.
- [x] Remove the split top collapse and bottom expand chevrons.
- [x] Add one persistent 44-by-44-pixel desktop toolbar control using the
  menu/menu-open icon treatment.
- [x] Record owner rejection of the first content-only toolbar placement while
  retaining approval of the icon treatment.
- [x] Relocate the control to the far left of a full-width global header with
  the TradersLink logo immediately beside it.
- [x] Start the desktop sidebar below the 64-pixel global header so the control
  remains at the same screen position in both rail states.
- [x] Keep state wording out of the visible interface; use only the short
  **Toggle sidebar** hover and assistive label.
- [x] Preserve the 76-pixel icon rail, item tooltips and visible group
  separators.
- [x] Remember the selected desktop state on the device while keeping the
  default server-rendered state hydration-safe.
- [x] Leave mobile unchanged: hamburger opens the full drawer and X closes it.
- [x] Focused ESLint and explicit-file Git diff checks pass.
- [x] The worker-disabled loopback review server started from the canonical
  repository on port 3010.
- [x] Browser verification at `/workspace` confirms one toggle, a 272-pixel
  expanded rail, a 76-pixel condensed rail, reliable reopen behavior, saved
  condensed state after reload, meaningful page content, no error overlay and
  zero captured console errors.
- [x] Expanded and condensed desktop screenshots were captured for owner
  review.
- [x] Revised browser screenshots confirm the toggle stays at x=20 in both
  states, the logo begins at x=76, and the 76/272-pixel sidebar begins below the
  global header.
- [x] A 390-by-844 regression check confirms the existing mobile hamburger
  opens the full drawer and the existing X control closes it, with no error
  overlay or captured console errors.
- [x] Help Center references were reviewed. No guide change is required because
  this corrects a standard shared-shell control without changing a trader
  workflow or feature behavior.
- [x] Receive owner visual approval on 2026-08-20.
- [x] Create the required narrow local checkpoint commit after visual approval.

## PWA-R1 React offline-shell foundation

- [x] Add the public React offline route using the real shared dashboard shell,
  grouped navigation, semantic icons and Material theme.
- [x] Add a compact header-level **Offline** state and a native
  connection-required page state without generic projection cards.
- [x] Keep AI Chat visibly in place but disabled while offline; preserve the
  normal Notifications control and complete navigation inventory.
- [x] Make offline-shell navigation use full document requests so the service
  worker can handle genuine network failures safely.
- [x] Add Serwist as the Webpack build-manifest layer with an explicit public
  asset allowlist and no broad runtime response cache.
- [x] Move the maintained worker source to `app/sw.ts`; preserve Push,
  notification-click, logout cleanup and background outbox-sync behavior.
- [x] Configure the next worker to wait for a close/reopen rather than forcing a
  reload over unfinished work.
- [x] Focused ESLint and explicit-file diff checks pass.
- [x] Full TypeScript reached only unrelated concurrent Workspace and AI Review
  errors; it reported no PWA-R1 file error.
- [x] Desktop and 390-pixel mobile route review passed, including the real
  mobile drawer open/closed states.
- [x] Stop the exact loopback review server and close review tabs before the
  owner's 03:55 press-release runtime; port 3010 is free with no orphaned
  TraderLink server process.
- [x] Create narrow local commit `30954abf` without staging the concurrent
  navigation, shell-depth, Analytics, Rules, Calendar or AI work.
- [x] Complete the route-scoped Webpack production client compilation and
  prove the generated manifest/worker bundle. Next.js 16.2.6 required a
  command-scoped Windows path workaround because its documented debug-path
  filter compared `/offline/page.tsx` with `\offline\page.tsx`.
- [ ] Obtain a complete zero-exit full-site production build at a later final
  checkpoint. The client/worker compilation passed, but the separate
  TypeScript worker exhausted a 1.28 GB safety ceiling while concurrent
  application work and the protected press-release runtime shared the machine.

## PWA-R2 tracker parity

- [x] Audit Daily Trade Tracker, Swing Trade Tracker and Quick Trade Entry and
  confirm all three website routes already share `ManualExecutionEntry` and
  the exact Journal outbox behavior.
- [x] Replace the large **Saved trades on this device** card stack with a slim
  **Trade sync** row, waiting/review count and on-demand saved-batch
  disclosure.
- [x] Keep tracker, saved time, execution count and the four exact status names
  in each disclosed batch.
- [x] Preserve the exact **Already entered**, **Save as separate**, **Sync now**
  and removal confirmations without changing the outbox or Journal contracts.
- [x] Connect the React offline fallback to the same `ManualExecutionEntry`
  component used by the online Daily, Swing and Quick Entry routes.
- [x] Read only the validated account-partitioned device state; when that safe
  state is absent, require one online account visit instead of inventing an
  account, currency, timezone or date context.
- [x] Preserve automatic reconnect, foreground and resume syncing inside the
  offline React shell in addition to the existing background-sync request.
- [x] Focused ESLint and explicit-file diff checks pass with a 512 MB Node
  memory ceiling. No server, browser, test suite, TypeScript-wide check or
  build was started.
- [x] Close the screenshot/installed-app review gate by explicit owner waiver
  on 2026-08-20; no additional visual review is required for this checkpoint.
- [x] Prove the generated production worker includes the shared offline-entry
  route chunk and its two hashed dependencies. The emitted allowlist contained
  only three hashed shell chunks plus `/offline`, the manifest, logo, icon
  family and `pwa-trade-sync.js`; it did not include authenticated HTML,
  Journal responses or a broad runtime cache.
- [x] Create narrow local source checkpoint `4384f572` after auditing and
  staging only the five PWA-R2 files from the shared dirty checkout.

## PWA-R3 saved-view foundation

- [x] Introduce IndexedDB schema version 3 with a new `savedViews` store rather
  than rewriting the accepted `manualTradeOutbox` or legacy
  `offlineProjections` stores.
- [x] Update every maintained page, worker and rollback-path database opener to
  install the same schema and indexes so no current client opens the upgraded
  database with the obsolete version.
- [x] Add a versioned saved-view envelope containing opaque scope, selected
  account, route/query identity, generation/save times, reporting context,
  calculation version, explicit coverage and module-owned JSON data.
- [x] Enforce account partition agreement, bounded identities, valid timestamps,
  currency/timezone validity, explicit unavailable reasons and a two-megabyte
  per-view size ceiling before storing a model.
- [x] Add account-partitioned save/read APIs, a 75-view retention ceiling,
  storage-summary counts and exact partition deletion covering the new store.
- [x] Preserve the old text projection store for rollback; no migration deletes,
  rewrites or promotes those records.
- [x] Review Help Center impact. No guide change is required for this internal
  storage foundation because no trader-facing workflow or control changed.
- [x] Focused ESLint, JavaScript syntax checks and explicit-file Git diff checks
  pass. No Vitest, server, browser, provider, hosted mutation or deployment ran.
- [x] Preserve the foundation in narrow local commit `20bc6fe3` without staging
  any concurrent dashboard feature work.
- [x] Add the first Platform-owned Workspace saved-view model, bounded to the
  five displayed metrics, the active five-day calendar week, current
  focuses/rules and the latest completed review.
- [x] Capture the model only from the authenticated online Workspace using the
  existing private `no-store` context endpoint for opaque user/account scope.
- [x] Render the saved model through the shared `WorkspaceDashboard`, real
  dashboard shell and current responsive calendar instead of projection cards.
- [x] Show one compact **Offline · Last updated ...** status, keep Quick Trade
  Entry available and disable Import Trades with a reconnect explanation.
- [x] Reject incompatible or malformed Workspace models and show a factual
  reconnect-once empty state without deleting the saved-view store or outbox.
- [x] Preserve the ongoing AI Chat task's two professional-agent remediation
  documents and every unrelated dirty checkout file. The PWA work does not
  stage or edit those records.
- [x] Review Help Center impact. No guide update is required in this source
  slice because capture is automatic and introduces no new online control;
  final PWA guidance remains part of release acceptance.
- [x] Focused ESLint and explicit-file diff checks pass with a 512 MB Node
  ceiling. No Vitest, broad TypeScript run, server, browser, build, provider,
  hosted mutation or deployment ran.
- [x] Preserve the Workspace saved-view slice in narrow local commit
  `0e7935f7` after staging only its explicit files and PWA-owned hunks from the
  dirty shared Workspace component.
- [x] Extract Open Positions into one shared responsive renderer without
  changing the accepted desktop table, mobile cards, classification labels,
  descriptions or Help links.
- [x] Add a Journal-owned Open Positions model containing only confirmed
  displayed position rows and classification labels. Do not store the reusable
  position reference used by the online classification API or undisplayed
  Data Decision rows.
- [x] Keep classification changes online-only by supplying their existing
  controls as online-only React content. The offline renderer does not import
  `PositionStyleControl`, its confirmation dialog or POST behavior.
- [x] Add one reusable authorized saved-view capture component and migrate the
  Workspace capture to it without changing the Workspace contract or storage
  identity.
- [x] Render saved Open Positions in the real dashboard shell with the normal
  desktop/mobile presentation, **Offline · Last updated ...** status and a
  reconnect explanation in the normal classification section.
- [x] Reject incompatible or malformed Open Positions models and retain a
  factual reconnect-once state without clearing saved data or the trade outbox.
- [x] Review Help Center impact. The existing Open Positions and position-type
  guides remain accurate; offline makes the existing classification control
  unavailable and explains reconnection in place, so no guide copy changes are
  required in this slice.
- [x] Focused React best-practices review, ESLint, capability-boundary search
  and explicit-file diff checks pass with a 512 MB Node ceiling. No Vitest,
  broad TypeScript run, server, browser, build, provider, hosted mutation or
  deployment ran.
- [x] Preserve the Open Positions saved-view slice in narrow local commit
  `6e6a1ba2` without staging the concurrent AI Chat, Analytics, Calendar,
  Rules, notification, shell or other dashboard work.
- [x] Add the Journal-owned Swing Tracker saved model and reuse the normal
  `SwingTrackerView` for its active/completed hierarchy, metrics, tags, saved
  notes and execution history.
- [x] Exclude real position/note/manual-edit references, available-tag IDs,
  rule mutation data and editor payloads from the saved Swing model. Generate
  local display-only keys when rendering offline.
- [x] Keep the accepted offline execution outbox in the normal Swing entry
  location. Replace classification, tag, note and execution-edit controls with
  read-only facts plus concise reconnect guidance.
- [x] Move the four online Swing mutation editors to conditional chunks so the
  offline shell does not request their dialogs or POST behavior.
- [x] Focused React best-practices review, ESLint, capability-boundary audit
  and explicit-file diff checks pass with a 512 MB Node ceiling. No Vitest,
  broad TypeScript run, server, browser, build, provider, hosted mutation or
  deployment ran.
- [x] Preserve the Swing Tracker saved-view slice in narrow local commit
  `a1265506` without staging the concurrent AI Chat, Daily Tracker, Analytics,
  Calendar, Rules, notification, shell or other dashboard work.
- [x] Add the Journal-owned Daily Tracker saved-view model and renderer,
  preserving saved empty-day notes/reviews and disabling every
  server-authoritative mutation except the accepted offline execution outbox.
- [x] Save current and visited Daily Tracker dates separately, reuse the real
  `DaySessionView`, retain the normal current-day execution entry placement and
  show dated routes read-only without an invented local-date policy.
- [x] Remove real execution edit references, account mutation references,
  server revisions, tag IDs, rule IDs and analyzer candle payloads from the
  Daily saved model. Generate local display keys and state exactly that Trade
  Analyzer market data requires reconnection.
- [x] Prevent the Daily read-only renderer from mounting execution editors,
  tag management or the unsaved-review confirmation dialog. Disable AI Chat
  from the saved Daily view and keep notes, rules, tags and review facts visible.
- [x] Add the remaining Journal Trades saved-view models and renderers for
  Calendar, Trade Explorer, Compare Trades, Trading Rules, Rule Results and
  Candle Review.
- [x] Reuse the real Calendar, Trade Explorer, Compare Trades, Trading Rules,
  Rule Results and Candle Review components. Do not reintroduce projection
  cards or a second visual system.
- [x] Keep saved Calendar day inspection and saved Rule Results search,
  filters and paging available locally. Block Calendar requests for other
  periods and live ticker execution details until reconnection.
- [x] Place Trade Explorer and Trading Rules behind native disabled interaction
  boundaries offline; remove the Trade Explorer review editor. Keep Compare
  Trades saved-study inspection/local group drafting available while guarding
  compare/save/update/remove server actions in both handlers and buttons.
- [x] Preserve saved Candle Review charts and factual feedback while removing
  analyze/refresh actions and replacing real trade/review identifiers with
  local display identifiers in the saved model.
- [x] Show the shared **Offline · Last updated ...** treatment and a concise
  reconnect explanation on every new saved Journal route.
- [x] Review Help Center impact. The online feature workflows are unchanged and
  each offline page explains its unavailable actions in place, so no existing
  feature guide requires a source update in this checkpoint. Complete PWA
  offline guidance remains part of release acceptance.
- [x] Focused React best-practices review, 512 MB ESLint, capability-boundary
  search and explicit-file diff checks pass. No Vitest, broad TypeScript run,
  server, browser, build, provider, hosted mutation or deployment ran.
- [x] Add Journal Analytics-owned saved-view models for Analytics Overview,
  Ticker, Timing and Trade Breakdown plus Day Trade Analysis, Entry & Exit,
  MFE & MAE, Green-to-Red, Candle Patterns and Analyzed Trades.
- [x] Reuse the normal Overview metric cards/monthly chart, Ticker table,
  Timing charts, Trade Breakdown charts/table and shared Trade Analyzer
  renderer in the installed app instead of creating offline projection cards.
- [x] Preserve the exact server-issued values, coverage populations, selected
  date range, money basis, reporting currency and timezone. Do not recalculate
  or invent analytics in the browser.
- [x] Replace real round-trip and execution identifiers with local display
  keys before saving Analyzer and Trade Breakdown models. Save only the first
  reported Analyzed Trades page and remove its server continuation cursor.
- [x] Keep saved chart controls, local filters, sorting and paging available.
  Disable live ticker/trade drawers and Candle Pattern occurrence requests,
  and open saved Daily Tracker dates without replay identifiers offline.
- [x] Review Help Center impact. The online Analytics and Trade Analyzer
  workflows remain unchanged and the shared offline status explains that
  date changes, details and updates require reconnection. Existing feature
  guides therefore need no source change in this checkpoint; complete PWA
  offline guidance remains a release-acceptance item.
- [x] Complete the React best-practices review, focused 512 MB ESLint,
  capability-boundary search and explicit-file diff checks. No Vitest, broad
  TypeScript run, server, browser, build, provider, hosted mutation or
  deployment ran.

## PWA-R4 Platform and support

- [x] Add a Platform-owned, account-partitioned Notifications saved view using
  the real Notifications list and privacy-safe server-issued title, summary,
  category, time and destination fields.
- [x] Replace each real notification reference with a local display reference
  before saving it. Keep destination navigation available while disabling
  read, dismiss and delivery-preference mutations offline.
- [x] Render Account subsections through the normal Account navigation. Keep
  the existing device-local offline-data summary and confirmed removal control
  available under Preferences; require reconnection for identity, security,
  reporting, delivery, broker, AI-plan and erasure changes.
- [x] Include every shipped first-party Help collection and article in the
  React offline shell, reusing the normal Help search, collection and article
  typography instead of caching authenticated Help HTML.
- [x] Add deliberate same-shell connection-required pages for Links AI Chat,
  Import Trades, Market Charts and Data Decisions. Do not stage files, call
  providers, create chats or permit stale Journal decisions offline.
- [x] Review Help Center impact. The existing Notifications and imports guide
  already explains saved offline updates and removal behavior; the source
  guides themselves remain current. No guide text change is required.
- [x] Add Coach-owned issued AI Review list and weekly/two-week/monthly detail
  saved models. Reuse the normal issued-review cards and document renderers;
  do not expose generation, benchmark or schedule controls offline.
- [x] Keep only issued prose and displayed authored metric labels in the
  offline document. Do not save the authored evidence packet, request data,
  round-trip identifiers or provider-generation material.
- [x] Finish the PWA-R4 source gate with the React best-practices review,
  focused 512 MB ESLint, no-write capability search and explicit-file diff
  checks. No Vitest, broad TypeScript run, server, browser, build, provider,
  hosted mutation or deployment ran.
- [x] Complete the static route inventory against the real navigation. Every
  visible destination plus Notifications, dated Daily Tracker pages, Account
  subsections, Candle Review, Help articles and issued AI Review details now
  resolves to a deliberate offline renderer.
- [x] Canonicalize the safe compatibility destinations used by Manual Entry,
  Reflection Loop/Coach, old Analyzer, old Import, Repair Wizard and the former
  Trader Intelligence entry point without restoring hidden Analytics Lab,
  readiness, debug or Admin routes offline.
- [x] Verify Web Push destination routing, safe application update activation
  and outbox preservation at the final installed-app checkpoint.

## PWA-R5 storage hardening

- [x] Add one 50 MB browser-wide budget covering the read-only legacy
  projections and explicit saved-view stores.
- [x] Remove only the oldest read-only page copies when the budget is exceeded;
  never automatically remove a pending, syncing or review-required trade.
- [x] Make Account Preferences include both saved-view stores and offline trade
  records in its local estimate, and show the browser's origin-level
  usage estimate when supported.
- [x] Update Notifications Help with the exact storage and non-eviction
  behavior.
- [x] Complete focused static checks and preserve the slice in narrow local
  commit `422bfe92` without staging concurrent AI Chat or Journal-plan work.

The storage write path first preserves each store's existing per-account count
limit, then checks the browser's origin-level usage estimate. When the estimate
could cross the budget, one transaction measures both read-only page stores and
deletes their oldest records until no more than 50,000,000 serialized bytes
remain. That transaction cannot access `manualTradeOutbox`. The Account summary
now includes outbox records in its local byte estimate and uses
`navigator.storage.estimate()` for the installed app's origin-level usage when
the browser provides it. Focused 512 MB ESLint, a temporary PWA-only TypeScript
configuration and `git diff --check` pass. No Vitest, broad suite, server,
browser, IndexedDB mutation, Journal write, provider call or deployment ran.

### PWA-R5 installed-app acceptance preflight

The canonical loopback port was free while the protected press-release runner
remained live. A worker-disabled Webpack development server started with a
768 MB Node heap and returned `/manifest.webmanifest` with HTTP 200 in 2.8
seconds. The authenticated `/workspace` request then failed closed with
`TRADERLINK_PLATFORM_MIGRATIONS_PENDING`: the shared source requires 67
migrations while the protected database has 66. Migration 0067 belongs to the
concurrent Links AI Chat task, so this PWA checkpoint did not apply or bypass
it. The exact PWA review server was stopped and port 3010 was confirmed free.
No production build, browser interaction, IndexedDB mutation, Journal write,
database migration, provider call, Push change, deployment or protected
press-release process change occurred. Final installed-app acceptance resumes
only after the concurrent migration owner completes that database boundary.

### PWA-R5 installed Windows acceptance

The concurrent Links AI Chat owner paused its build/server work and explicitly
handed migration 0067 to this checkpoint. Pre-migration backup and restore,
canonical application of `0067_coach_ai_chat_relationship_memory`, post-
migration backup and restore, exact registry/schema verification, SQLite quick
and integrity checks and foreign-key checks all passed. The four new AI Chat
memory tables were empty and existing Journal table content remained unchanged.

The first genuine installed-app server-off relaunch found two product defects
that static checks had not established:

1. the worker returned cached `/offline` HTML while retaining the requested
   private route URL, preventing the Next App Router document from hydrating;
2. the narrow worker manifest omitted shared Next bootstrap/layout scripts,
   and Swing Trade Tracker hid offline entry when no saved swing view existed.

The worker now redirects a failed same-origin navigation to the real static
`/offline?path=...` route after validating and encoding only the intended
pathname. The offline route reads that validated pathname after hydration.
The Serwist build boundary now includes only the Webpack runtime, main App
Router, root layout and offline-page chunk groups, plus the dynamically named
Next polyfill asset. A build artifact check proved that all 44 script URLs in
the generated offline document are present in the worker precache; zero are
missing. Swing Trade Tracker now renders the normal manual execution form even
when no saved swing dashboard view exists, matching Daily and Quick Entry.

Focused ESLint and `git diff --check` passed for the changed PWA and build-
configuration files. The complete low-resource production package completed
with the official two-stage Next 16 Webpack flow:

- `next build --webpack --experimental-build-mode compile` exited zero;
- `next build --webpack --experimental-build-mode generate` exited zero and
  generated all 212 static pages, including static `/offline`.

The installed Chrome PWA was then opened online, closed and reopened to prove
safe worker activation. Workspace rendered with no console errors. Codex
stopped only the exact worker-disabled review backend and production-asset
proxy it started; ports 3010 and 3011 were confirmed free before the decisive
relaunch. With the origin genuinely unavailable, the installed app proved:

- standalone display mode was true;
- Workspace hydrated through `/offline?path=%2Fworkspace` and showed its exact
  no-saved-view state instead of a dead fallback heading;
- Daily Trade Tracker, Swing Trade Tracker and Quick Trade Entry each opened
  through its encoded offline destination, displayed its correct page title,
  complete `Enter trades` form and Trade sync status, with zero console errors;
- Notifications opened through `/offline?path=%2Fnotifications` and displayed
  its exact no-saved-notifications state with zero console errors;
- the shared navigation dialog retained Workspace, the Trades, Trade Analyzer
  and Analytics groups, Links AI Chat, AI Reviews, Account, Import Trades,
  Market Charts, Data Decisions and Help Center.

No form field was changed and no trade was previewed or submitted. This
acceptance did not create an outbox record, enable Push, change notification or
account settings, call a provider, deploy or alter hosted state. The earlier
owner-observed Windows notification and Notifications Center delivery remain
the local Web Push evidence; hosted phone Push/background delivery still
requires the separate hosted gate. The Swing Trade Tracker Help guide already
states that the installed app can reopen its execution form after a full
offline relaunch, and Notifications Help already describes its bounded saved
offline copy. These fixes restore the documented behavior, so no Help copy
change is required.

### Mobile Workspace rule and offline-logo polish

The owner-approved mobile correction replaces margin-based spacing on every
wrapping Workspace rule group with real flex gaps. Wrapped preset-rule badges
now keep the same left edge and gain consistent horizontal and vertical space.
The Focus Rules panel also uses a 12 px row gap and explicit full-width rule
rows so later rules cannot inherit an accidental indent.

Both dashboard-shell logo instances now request the static
`/logo-horizontal-main.png` asset directly. That exact asset is already part of
the PWA public-shell precache, so the navigation drawer no longer depends on an
uncached image-optimization request after the app goes offline. At the 411 px
mobile viewport, the live Workspace render showed the two trade-rule badges on
equal left edges with visible space between them and showed the TradersLink
logo in the open navigation drawer. The served Workspace HTML uses the direct
logo URL, the served worker contains that asset, focused ESLint and the live
development compile passed. No broad test suite or production build ran while
the concurrent AI Chat work and low-resource boundary remained active. This is
a layout and asset-delivery correction, so no Help Center guide change is
required.

### Android Push enable correction

Direct Android acceptance found that both Chrome and the installed WebAPK could
report notification permission as granted while the normal Enable action still
failed before creating a Push subscription. The client had awaited the remote
Push configuration before requesting permission and subscribing. On Android,
that delay detached the browser-sensitive subscription work from the trader's
button tap. Push configuration and worker readiness are now prepared while the
page loads. The Enable action receives that prepared state and performs the
permission/subscription work immediately from the button interaction. A failed
preparation has a separate Retry Push setup action instead of a dead Enable
button.

Discord and Push results no longer share one alert location. Discord save
results stay in the Discord messages section; Push enable, save and disable
results render inside Push notifications.

The connected Android acceptance used only the `127.0.0.1:3010` review origin
and proved notification permission granted, an activated service worker, an
FCM-backed browser subscription, one active encrypted local subscription and
all six Push categories enabled. The phone UI then showed Save push preferences
and Turn off push notifications with all six Push checkboxes selected. One
privacy-safe test update containing no trading facts was enqueued and the Push
delivery record reached `delivered` with no failure code. Focused ESLint, the
live low-resource Next development compile and the phone render passed. No
Vitest, broad suite, production build, deployment or hosted-state change ran.
The existing Notifications Help already describes permission, category and
privacy behavior, so no Help copy change is required.

### Installed-app Push setup notice

The installed PWA now shows one top-of-page **Turn on notifications** notice
when the current device has no Push subscription. It is limited to standalone
display mode, stays out of the ordinary website and the Account Preferences
destination itself, and remains hidden while offline or when Push support
cannot be checked safely. The approved notice text is **Turn on TradersLink
notifications on this device**. Its setup action opens the exact Push section
at `/account/preferences#push-notifications`.

The notice disappears as soon as this device has an active Push subscription.
**Don't show again** records a device-local choice so a trader who does not want
Push is not repeatedly prompted on later PWA launches. Turning Push off from
Preferences records the same choice. A blocked browser permission uses
**Notifications are turned off** and **View setup steps** without attempting to
open the browser permission prompt automatically. The normal Enable action
remains the only gesture that requests permission.

Notifications Help now names the installed-app setup path and the optional
**Don't show again** choice. This keeps the guide aligned with the new visible
behavior; no Journal, provider, notification category or hosted-state contract
changed.

## Current exact resume point

PWA-R1 is preserved at local commit `30954abf`; PWA-R2 source is preserved at
`4384f572` with its checkpoint record at `70b21428`; PWA-R5 storage hardening is
preserved at `422bfe92`. The professional local PWA boundary is complete after
the final installed-app acceptance above. The remaining release work is not
another local UI slice: it is the explicitly separate hosted HTTPS phone
installation, hosted Web Push/background-delivery and final deployment gate.
No local review server remains on port 3010 or 3011.
