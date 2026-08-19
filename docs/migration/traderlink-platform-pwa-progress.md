# TraderLink Platform PWA Progress

**Status:** PWA 0-2 owner-approved; PWA 3 implementation assembled for owner/runtime review

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

**Status:** Implementation assembled; owner/runtime review pending

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

**Status:** Pending

- [ ] Add encrypted subscription persistence and authenticated endpoints.
- [ ] Add category-specific Web Push preferences.
- [ ] Add user-gesture enable/disable controls.
- [ ] Add generic service-worker push display and click routing.
- [ ] Verify expired-subscription cleanup and privacy-safe payloads.

### PWA 5 - acceptance and hosted gate

**Status:** Pending

- [ ] Complete focused resource-aware technical checks.
- [ ] Complete desktop and mobile-browser PWA acceptance.
- [ ] Receive owner visual/product approval.
- [ ] After separate deployment authorization, complete real HTTPS phone install,
      Web Push and background-delivery acceptance.

## Current exact resume point

PWA 2 owner approval and its narrow local checkpoint are complete at
`58f62e9d`. Implement PWA 3 with bounded server-rendered page projections and
the current opaque user/account partition. Preserve private `no-store` network
headers and do not cache authenticated HTML or raw Journal source records.

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
