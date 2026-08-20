# TraderLink Platform PWA Professional Redesign Progress

**Status:** PWA-R0 owner approved; PWA-R1 shared desktop sidebar correction
owner approved on 2026-08-20 and locally checkpointed

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

## Current exact resume point

The revised global-header placement is implemented, browser-verified and owner
approved. It does not change Journal data, IndexedDB, the service worker, Push
state, hosted configuration or mobile navigation. The canonical low-resource
review server remains on loopback port 3010; no test runner or production build
was started. The shared worktree remains dirty with concurrent work that is not
part of this checkpoint.

This implementation and progress update are the required narrow local
checkpoint. The shell staging excludes the concurrent Trade Analyzer hierarchy
hunks already present in the same working file. The exact next PWA-R1 slice is
the real offline React shell and build-versioned update foundation.
