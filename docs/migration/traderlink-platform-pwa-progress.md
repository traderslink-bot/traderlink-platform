# TraderLink Platform PWA Progress

**Status:** PWA 0-4 owner-approved; migration 0064 verified locally; desktop browser acceptance found a Notifications hydration blocker

**Started:** 2026-08-18

**Controlling plan:**
[TraderLink Platform PWA Plan](traderlink-platform-pwa-plan.md)

## Repository boundary

- Canonical implementation:
  `C:\Users\jerac\Documents\TraderLink\traderlink-platform`
- Work directly in the current checkout without creating or switching branches
  or worktrees.
- Preserve concurrent dashboard, Analytics, Rules, notification and Journal
  edits already present in the working tree.
- Stage only explicit PWA files at an accepted coherent checkpoint.
- Do not push, deploy, change hosted configuration or activate production push.
- Keep the existing private `no-store` route headers and canonical Journal
  database authority intact.

## Approved decisions

- [x] Exact icon translation: 23 pixels left and 4 pixels down.
- [x] Complete dashboard remains visible in the installed PWA.
- [x] Daily, Swing and Quick Trade Entry are all first-release offline paths.
- [x] Analytics and Trading Rules have bounded last-synced offline access.
- [x] Web Push is included in the first release and is opt-in/privacy-safe.
- [x] Background Sync is best-effort with foreground and manual fallbacks.

## Checkpoints

### PWA 0 - approved contract and complete inventory

**Status:** Complete

- [x] Audit current Next.js, private-cache, icon, Journal manual-entry,
      notification and navigation contracts.
- [x] Confirm the existing manual preview/commit and idempotency boundary.
- [x] Record the complete navigation inventory rather than a reduced list.
- [x] Create the controlling PWA plan and this progress record.
- [x] Link the plan from every governing migration document.

### PWA 1 - install foundation and first visible checkpoint

**Status:** Owner approved the icon and offline visual direction; dynamic browser/install acceptance remains open

- [x] Translate the original icon pixels exactly and derive the icon family.
- [x] Verify the exact `-23.00, +4.00` geometry mechanically and receive owner
      visual approval.
- [x] Add the Next.js manifest and root metadata.
- [x] Add the privacy-safe service-worker shell and registration.
- [x] Add the first offline/sync status UI.
- [x] Present the corrected normal/maskable icons and offline treatment for
      owner approval. Dynamic browser screenshots remain part of the later
      runtime acceptance gate because the preview connection was unavailable.

### PWA 2 - offline execution outbox

**Status:** Implementation and visible duplicate treatment owner-approved;
controlled browser acceptance pending

- [x] Add the Platform-user/account-scoped versioned IndexedDB store.
- [x] Connect Daily Trade Tracker.
- [x] Connect Swing Trade Tracker.
- [x] Connect Quick Trade Entry.
- [x] Add launch, reconnect, resume, manual and best-effort service-worker
      background retry.
- [x] Add pending-entry review/removal and the exact user-facing states.
- [x] Add a read-only durable idempotency-status check for response-loss retry
      and route account/conflict failures to review without duplicating facts.
- [x] Receive owner approval for the pending-trade panel and status treatment.
- [x] Add an atomic exact-manual-batch replay check for website entry followed
      by delayed PWA sync.
- [x] Receive owner confirmation for the visible **Already entered** and
      **Save as separate** duplicate choices.
- [ ] Complete controlled browser acceptance without writing a Journal trade.

### PWA 3 - rich offline dashboard

**Status:** Visible treatment owner-approved; dynamic browser acceptance pending

- [x] Add bounded server-issued projection contracts.
- [x] Cover every route classified as last-synced read-only in the plan.
- [x] Add shared offline timestamps and online-required explanations.
- [x] Add scope switching, storage limits and Remove offline data.

Implementation assembly now uses a shared dashboard capture boundary rather
than changing each Analytics or Journal page. The server authorizes the route
and issues the projection envelope; the client stores only bounded visible
read-only facts under the current opaque user/account partition. The public
offline shell renders the saved projection and complete navigation without
caching authenticated HTML.

### PWA 4 - Web Push

**Status:** Visible treatment owner-approved; local schema verified; dynamic browser and hosted delivery acceptance pending

- [x] Add encrypted subscription persistence and authenticated endpoints.
- [x] Add category-specific Web Push preferences.
- [x] Add user-gesture enable/disable controls.
- [x] Add generic service-worker push display and click routing.
- [x] Add expired-subscription cleanup and privacy-safe payload contracts.

### PWA 5 - acceptance and hosted gate

**Status:** In progress; protected migration gate passed, desktop browser pass stopped at Notifications hydration

- [ ] Complete focused resource-aware technical checks.
- [ ] Complete desktop and mobile-browser PWA acceptance.
- [ ] Receive owner visual/product approval.
- [ ] After separate deployment authorization, complete real HTTPS phone install,
      Web Push and background-delivery acceptance.

## Current exact resume point

PWA 3 is preserved at local commit `09cda0db`. PWA 4 is preserved at local
commit `c82b6559`, and the full-offline-relaunch correction is preserved at
local commit `6d7b07e2`. The owner approved the visible offline execution form
and Push notifications settings on 2026-08-18. Migration 0064 is now applied
to the protected local database after a verified online backup and restore
rehearsal. No VAPID or push-encryption secret is configured and no Journal
trade or push subscription was written.

The scheduled 2026-08-19 browser run reached a responsive manifest and
authenticated Workspace. Desktop Workspace, the complete navigation,
Notifications Center, Push notifications settings and Offline data settings
rendered. The first confirmed application defect is a Notifications hydration
mismatch: the server renders localized times with `p.m.` while the browser
renders `PM`. `notification-list.tsx` uses the environment-default locale in
both server and client rendering, so the same timestamp is not deterministic.
Fix that formatter through one explicit locale/time-zone contract or a
server-issued display value, then restart the browser gate at Notifications.
Do not infer narrow-mobile, install, offline-relaunch or permission-prompt
acceptance; those checks correctly stopped at the first defect. Real phone
installation, real Web Push and background delivery remain hosted HTTPS gates
after separate deployment and secret authorization.

## 2026-08-18 PWA 1 assembly note

- Preserved the original 512-pixel artwork as a reproducible brand source.
- Generated the corrected root icon, Apple icon, 16/32/48 favicon, 192/512
  install icons and a padded maskable icon from that source.
- Measured the artwork centroid before and after generation: `(278.61, 252.08)`
  to `(255.61, 256.08)`, exactly `-23.00, +4.00` pixels.
- Added the install manifest with `/workspace` start URL and complete `/` scope.
- Added a public static offline fallback, service-worker lifecycle and an
  offline-only dashboard status card without caching authenticated responses.
- Added explicit no-cache service-worker headers and extended the existing
  private/no-store route boundary to Quick Trade Entry.
- Targeted ESLint for the seven changed TypeScript/JavaScript files passed with
  zero warnings or errors. `git diff --check` and both JavaScript syntax checks
  passed. No Vitest, broad suite, server start, database command, push,
  deployment or hosted change was run before the visual checkpoint attempt.
- The resource-aware local dashboard subsequently reached ready on port 3010
  with workers disabled. The in-app preview connection could not initialize,
  so no screenshot or browser-acceptance claim was made. The exact review
  server was stopped and ports 3010/3011 were confirmed closed. This is a
  preview-tool limitation, not an accepted visual/browser result.

## 2026-08-18 PWA 2 assembly note

- Added one IndexedDB outbox partitioned by a non-reversible Platform
  user/workspace ref and the existing opaque selected-account ref. Raw user,
  workspace, account, broker and provider identifiers are not stored.
- Daily Trade Tracker, Swing Trade Tracker and Quick Trade Entry now share the
  same offline save path and keep the existing execution fields, tracker kind
  and stable idempotency key.
- Offline and network-failed submissions show **Saved on this device** and stay
  outside positions, P/L, trade counts, Rule Results and Analytics.
- Launch, reconnect, focus/resume, **Sync now** and supported Background Sync
  all retry the canonical preview/commit flow. The service worker first fetches
  the current opaque user/account scope and cannot submit another user's or
  inactive account's partition.
- Added **Syncing**, **Saved to TraderLink** and **Needs your review** states,
  execution-detail review, deliberate removal and plain account/sign-in/detail
  guidance.
- Added a read-only manual-commit status endpoint backed by durable import and
  boundary evidence. A retry after a lost commit response detects the completed
  idempotent save before creating a new preview.
- Added a server-authoritative exact-fact replay check for the case where an
  offline PWA trade remains pending, the trader enters the same batch on the
  website, and the PWA later reconnects. The check is account/user scoped and
  runs inside the immediate Journal commit transaction, so a concurrent website
  save cannot slip between the check and write.
- An exact different-submission match now stops as **Needs your review** without
  a Journal write. **Already entered** removes only the device copy. **Save as
  separate** requires explicit confirmation, deliberately creates distinct
  execution facts, and records that resolution in the durable import mapping
  evidence. Background sync never makes that choice.
- Reviewed the Daily Trade Tracker, Swing Trade Tracker and Quick Trade Entry
  Help guides. All three required and now include the same offline/website
  duplicate explanation and exact visible choices.
- The owner approved the exact duplicate warning and the visible **Already
  entered** / **Save as separate** actions on 2026-08-18. PWA 2 visual/product
  scope is accepted; controlled browser acceptance remains separate.
- Confirmed that the Notifications Center remains in the complete PWA. Its
  bounded recent-notification projection belongs to PWA 3; dismissals and
  preference changes stay online/server-authoritative, and PWA 4 push opens the
  authenticated destination through the center.
- Targeted ESLint, JavaScript syntax, `git diff --check` and the bounded PWA
  TypeScript project pass. The unrestricted whole-project TypeScript command
  was stopped after it made no progress under current resource pressure and
  reported no error before termination.
- After the website/PWA duplicate correction, targeted ESLint, service-worker
  JavaScript syntax, `git diff --check` and the bounded TypeScript project pass
  again. Per the active feature-review rule, no Vitest or broad suite was run.
- A read-only local server reached ready. Static `/sw.js` and
  `/pwa-trade-sync.js` returned 200, but the dynamic Next route compiler stalled
  under resource pressure before the route list completed. The request and
  exact server were stopped; no Journal mutation was sent, ports 3010/3011 have
  no listener, and no dynamic browser/runtime acceptance is claimed.

## 2026-08-18 PWA 3 assembly note

- Added one versioned projection store beside the existing trade outbox. Each
  record is partitioned by the opaque Platform user/workspace ref and selected
  account ref, and the last 50 route projections are retained per partition.
- A private `no-store` projection-context route authorizes the active scope,
  exact path and offline route mode. The client then stores at most 24 blocks
  and 40,000 visible characters from the server-rendered dashboard page. It
  never stores form values, authenticated HTML, raw statements, source rows,
  broker/provider credentials, identity values or AI request data.
- The shared dashboard template captures all approved last-synced pages without
  editing individual Workspace, Calendar, Rules, Analytics, Trade Analyzer,
  AI Review, notification, tracker-detail or Help implementations.
- The public offline shell keeps the complete navigation visible, shows exact
  last-updated/read-only wording, renders saved values without recalculation and
  explains why online-only routes need a connection.
- Account switching replaces the active device partition before reads. Sign-out
  clears the active device-scope pointer without cross-submitting or deleting a
  prior user's pending outbox.
- Account Preferences now shows saved-page count, last update, approximate
  storage, named limits and **Remove offline data**. The confirmation explicitly
  warns when unsynced trades exist only on the device.
- Notifications Help now explains last-synced updates, Offline data controls and
  the fact that device storage is not a backup.
- Targeted ESLint, three JavaScript syntax checks, `git diff --check` and the
  bounded PWA 3 TypeScript project pass. No Vitest, broad suite, database
  command, Journal write, provider call, deployment or production build ran.
- Desktop, narrow-mobile and real offline reload acceptance remain open for the
  controlled browser/hosted gate.

## 2026-08-18 PWA 4 assembly note

- Added migration 0064 with stable Platform-user/device subscription identity,
  encrypted endpoint and browser-key material, an append-preserving delivery
  queue and bounded retry/expiration state.
- The subscription API requires the authenticated Platform scope, same-origin
  browser evidence and a dedicated mutation header. A browser endpoint can
  belong to only one active Platform user at a time.
- Account Preferences now keeps Discord messages and Push notifications as
  separate choices. Browser permission is requested only when the trader
  presses **Enable push notifications**. Turning push off revokes only the
  current device; category choices remain available for other enabled devices.
- Added a generic service-worker notification with authenticated in-app route
  opening. The payload contains only a version and a bounded same-origin
  destination path; lock-screen content contains no trading, account,
  statement, broker, note or AI Review facts.
- Added best-effort local and hosted delivery entry points. HTTP 404/410
  responses expire unreachable subscriptions; retryable failures use bounded
  backoff and never trigger silent trade upload.
- Removing offline data now also turns push off on that browser before removing
  the current opaque account partition. Sign-out unsubscribes the browser push
  endpoint while keeping prior offline records hidden from a later user.
- The Notifications and Imports Help guide now covers opt-in behavior, generic
  lock-screen text, per-device disable behavior and the authenticated
  Notifications Center destination.
- Added exact `web-push` and type dependencies. No VAPID/encryption secrets were
  generated or configured, no private database migration was applied, and no
  real push, provider, deployment, production build or Journal write ran before
  the owner review gate.
- Targeted ESLint for the PWA 4 files, service-worker JavaScript syntax,
  dependency resolution, `git diff --check` and the bounded PWA 4 TypeScript
  project pass. The first TypeScript command inherited the whole-project include
  and surfaced an unrelated concurrent Workspace `sx` prop error; the corrected
  PWA-only boundary passes without changing that work.
- A production-dependency audit reports five high-severity advisories through
  the current Next.js/PostCSS/Sharp dependency line. None names `web-push` or
  its added dependency chain. This remains a separate release-readiness gate;
  no broad framework or image-library upgrade was folded into PWA 4.

## 2026-08-18 full offline relaunch correction

- Replaced the earlier keep-the-app-open limitation with a safe public-shell
  execution form for Daily Trade Tracker, Swing Trade Tracker and Quick Trade
  Entry. It is available after reopening an installed app with no connection,
  once that selected account was opened online on the device.
- The shell writes the same version-1 manual-trade outbox record used by the
  approved React entry form. It keeps related fills in one ordered batch with
  one stable idempotency key; reconnect still uses the canonical Journal
  status, preview, duplicate check and commit routes.
- Device state version 2 adds only the selected account's three-letter currency
  and IANA timezone, which are necessary to prepare a factual entry. Account
  names, internal IDs, broker/provider identity and credentials are not stored;
  the existing opaque user/account partition remains authoritative.
- The form supports multiple executions, actual dates and times, Buy/Sell,
  ticker, quantity, price and optional reported fees. Daily entries remain one
  trading day, future times are rejected, and related saved batches sync oldest
  first.
- Daily, Swing and Quick Trade Entry Help now explains full offline relaunch and
  keeping related fills together.
- Targeted ESLint, three public JavaScript syntax checks, bounded TypeScript and
  `git diff --check` pass. No test runner, Journal write, database migration,
  provider call, build, deployment or push activation ran.
- A temporary static server served the public shell on port 3012, but the
  in-app preview connection failed its trusted-code setup before navigation.
  The server was stopped and port 3012 has no listener. Desktop/narrow visual
  interaction therefore remains an explicit owner/runtime gate.

## 2026-08-18 approved migration and local runtime gate

- The owner approved both the visible full-offline execution form and the Push
  notifications settings, authorizing the protected local migration and
  read-only browser checkpoint.
- A read-only preflight verified the protected database as the exact
  63-migration prefix ending at `0063_platform_notification_coverage`, with a
  matching schema digest and passing foreign-key, quick and integrity checks.
- Created and restore-verified the pre-migration online backup at
  `backups/pre-0064-platform-web-push-20260819T034216Z/development.sqlite` and
  the independent restore at
  `restore-verification/pre-0064-platform-web-push-20260819T034216Z/development-restored.sqlite`
  beneath the protected TraderLink Platform private-data root. Registry rows,
  all table counts, page geometry, backup/restore file identity and retained
  recovery authority matched.
- Applied only `0064_platform_web_push`. Read-only post-migration verification
  found 64 migrations, the expected final schema digest, passing foreign-key,
  quick and integrity checks, and zero rows in both new Web Push tables.
- Started the canonical checkout twice on loopback port 3010 with workers
  disabled: once with the default bundler and once with webpack. `/sw.js` and
  `/pwa-offline-dashboard.js` returned 200, but the dynamic
  `/manifest.webmanifest` compile returned no bytes on either attempt and the
  authenticated `/workspace` request did not complete on the first attempt.
- The in-app browser connection remained unavailable in the current Codex
  environment, so no desktop, narrow-mobile, install, offline-relaunch,
  permission-prompt or authenticated navigation acceptance is claimed.
- Both exact review processes were stopped and port 3010 was confirmed closed.
  No Journal entry, outbox entry, push subscription, push delivery, provider
  call, VAPID/encryption configuration, build, deployment or hosted change was
  made during this gate.

## 2026-08-19 resource-aware browser retry

- The owner confirmed that the earlier dynamic compilation delay was caused by
  low system resources and requested one new attempt.
- The canonical checkout again reached ready on loopback port 3010 with webpack
  and all background workers disabled.
- `/manifest.webmanifest` produced no bytes within 55 seconds and remained at
  `Compiling /manifest.webmanifest` after roughly two minutes. Browser
  interaction did not start because the first dynamic route boundary was not
  responsive.
- The exact review process was stopped and port 3010 was confirmed closed. No
  application source, Journal data, outbox record, push state, configuration,
  dependency, deployment or hosted service changed during the retry.

## 2026-08-19 scheduled 8:01 PM browser acceptance

- The scheduled webpack launcher exited without starting because an existing
  canonical no-workers development process already owned the checkout's Next
  development lock. That process started at 6:40 PM under a different process
  tree and was not terminated or otherwise changed.
- The existing server returned `/manifest.webmanifest` with HTTP 200 and then
  returned the authenticated `/workspace` HTML with HTTP 200 in 6.4 seconds.
- The in-app browser connected successfully. Desktop Workspace rendered with
  its factual cards, complete Trades, Trade Analyzer and Analytics navigation,
  standalone destinations and five-unread Notifications control. No browser
  warnings or errors were present on the initial Workspace render.
- The Notifications Center rendered current notification cards. Account
  Preferences rendered separate Discord and Push notifications controls plus
  Offline data showing three saved pages, a last-updated time, 6.4 KB device
  storage, bounded limits and **Remove offline data**.
- Browser console evidence then found the first application defect: React
  hydration failed because the server formatted a notification timestamp as
  `p.m.` while the browser formatted the same timestamp as `PM`.
  `app/(dashboard)/notifications/notification-list.tsx` uses
  `Intl.DateTimeFormat(undefined, ...)`, allowing server and browser locales to
  produce different initial markup.
- Per the acceptance stop rule, narrow-mobile, install, offline-relaunch,
  Daily/Swing/Quick offline forms and notification-permission behavior were not
  tested past that confirmed boundary. The QA tab was closed.
- No Journal trade, outbox entry, notification read/dismissal, push permission,
  push subscription, secret, provider call, deployment or hosted state changed.
  The scheduled server process exited itself; the pre-existing process was
  preserved.

## 2026-08-19 resumed browser acceptance

- Fixed the Notifications hydration mismatch without changing the trader's
  local timestamp: the server and first browser render leave the dynamic time
  empty, then the device formats it after hydration. Targeted ESLint and
  whitespace checks passed.
- Desktop and 390-pixel narrow-mobile checks passed for Workspace, complete
  navigation, Notifications Center, notification timestamps, Push notifications
  settings and Offline data controls. No browser warnings or errors were
  present after the fix.
- Install readiness passed: the page exposes `/manifest.webmanifest` and is
  controlled by the registered service worker. The browser had Push permission
  blocked, so the settings correctly showed the non-interactive explanation;
  no permission prompt or subscription was requested.
- Daily Trade Tracker, Swing Trade Tracker and Quick Trade Entry each rendered
  online with their manual-entry controls. No field was changed and no save was
  sent.
- Full offline relaunch remains unverified in this in-app browser. Its provided
  offline toggle continued to fetch the live page, and tab-only request blocking
  retained the existing live document rather than yielding a clean service-worker
  navigation. All temporary network, cache and viewport overrides were restored.
- The pre-existing no-workers loopback server was preserved. No Journal trade,
  device outbox record, notification mutation, push permission/subscription,
  secret, provider call, deployment or hosted state changed during this run.
