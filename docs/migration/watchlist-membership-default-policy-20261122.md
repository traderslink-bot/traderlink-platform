# Watchlist plan access and default visibility

## Owner contract

The shared Watchlist remains available to signed-in free members by default.
Selecting Watchlist in a plan, saving a draft, publishing it, or applying edited
features to existing members must not activate a whole-page paywall. The owner
can still explicitly require a plan for the whole Watchlist under Features.
Plan cards retain Watchlist and the individually selected card features.

Watchlist Admin controls what free members can see for each ticker and card.
The owner wants new tickers protected by default. The controls are reveal
controls: unchecked keeps the Premium restriction; checking reveals the real
ticker or card to free members. Existing saved choices must not be inverted or
overwritten. Concealed rows remain visible as Premium placeholders unless the
owner separately hides the row. Added-date disclosure remains independent.

## Source and ownership

Coordinator assigned `/home/traderlink/projects/watchlist-plans-default-policy-20261122`,
branch `codex/watchlist-plans-default-policy-20261122`, on
`b52c123abd186ee7052ee534c8dc088ab55e0daa`. The controlling allocation is
`operations/watchlist-plans-default-policy-lane-20261122.json` in the Coordinator
workspace. Earlier market-tool source and pinned QA are preserved.

Membership owns the current backend grant-compatibility and regression slice.
Admin Watchlist owns the shared types, card projections and presentation,
first-created ticker defaults and reveal UI. Its frozen locked-card packet is
`aec6e1d9eb2914406c8b0a2a6d26dba23102e1a3`; that packet intentionally precedes
the new default/reveal slice. Source integration must preserve its additive
Levels denial reason and the current canonical member-data wrappers.

## Findings and current correction

1. Whole-page enforcement already defaults to off. Publication has no operation
   that enables it. Preserve that behavior and verify actual save, reopen,
   publish and bulk-member publication with isolated SQLite records.
2. Existing per-ticker Premium readers accepted the Discord role but did not
   accept an active plan's equivalent card feature in legacy Premium mode.
   The correction reads the real effective feature grant. Default-open feature
   policy is never treated as a Premium grant. Ticker details, Analysis, levels
   and indicators remain independent. Explicit selected-plan rules retain
   precedence; private ticker authorization and owner access remain intact.
3. The editor now explains next to the Watchlist choices that adding a feature
   does not close the main page. Shared copy and the membership Help guide
   explain the same separation. No existing custom description is overwritten.

## Separate defaults and remaining integration

The initial Membership packet is preserved locally at
`574ee234c07016766b9b6665c22217cd78a1068f`, parent `b52c123a`. Its source-only
manifest is `/tmp/watchlist-membership-default-policy-handoff-20261123T014049Z/manifest.json`.
The reader successor is authored against that exact frozen postimage, while
the author checkout/index remain on their original base.

The successor consumes the Watchlist owner's `premiumDefaultsVersion: 1`
contract. Explicit saved choices take precedence. Without a choice, a marked
new publication or an unpublished ticker is protected; a valid existing
unmarked publication retains its previous free default. Invalid state or an
unknown explicit marker cannot silently become public. The main list applies
the same marker fallback without exposing the ticker identity. No marker is
written by the access reader.

Ticker and Analysis share one visibility row. Each first INSERT now preserves
the other control's effective value inside the same transaction, so revealing
one cannot reveal the other through the schema's historical zero default.
Updates still change only the requested control. The successor adds regressions
for both first-save orders, legacy records, preserved owner choices and malformed
markers. Its final checks passed as recorded below.

Read-only discovery found that new/missing visibility records currently read
as unrestricted. The first-created write seams are `LiveWatchlistStore.upsertPatch`
and `upsertTickerData`, and their `applyPatch` / `applyTickerDataPatch` builders
in `src/lib/live-watchlist/live-watchlist-store.ts`. Ticker and Analysis settings
are read in `watchlist-analysis-visibility.ts`; levels and indicators have their
own readers. Runtime reveal controls are in `watchlist-premium-control.ts`.
These readers must be composed with the Watchlist-owned creation and type
slice, preserving explicit saved false values and existing tickers. This
Membership packet does not write the creation marker or claim that the whole
new-ticker workflow is installed.

Notification workers have their own current per-ticker decision path in
`canNotifyWatchlistTicker`. Coordinator extended the successor's scope to this
decision-only reader after the audit found that a missing explicit visibility
row was treated as free. It now uses the same marker default and actual matching
grants while retaining selected-plan, private, owner and whole-page checks.
Isolated regressions cover both denied and allowed eligibility. No worker,
enqueue, delivery or provider writer was changed, and no notification was sent.

The existing selected-plan URL includes the real ticker. It must never be added
to a concealed-row payload. The current source has no verified opaque public
selected-offer destination. Legacy Whop and direct known-ticker destinations
retain their existing semantics; the concealed selected-plan context remains
an explicitly recorded routing dependency.

## Verification

The guarded focused batch passed 153 tests in ten files. The new real SQLite
coverage checks a free member with no Premium grant, each independent plan
feature without Discord, all 16 per-card combinations, existing Premium and
owner access, explicit selected-plan precedence, private tickers, grant expiry
and revocation, and the separate optional whole-page policy. Saving, reopening,
publishing and applying edits to existing members leaves page enforcement and
the owner's saved ticker choices unchanged. Existing bundle, access-service,
parent-entry, indicator, owner-authorization and row-projection tests passed.
Request identity and external database access are fixture boundaries; this is
not a claim of a new authenticated browser or hosted acceptance run.

Changed-file ESLint and whitespace passed. The first scoped type driver omitted
the framework's normal CSS declaration and reported two missing CSS-module
types. Without changing source or using a signature stub, the corrected driver
included the installed `next/types/global.d.ts`: 15 roots, 1,626 source files,
zero diagnostics. The original failed type evidence remains preserved.

Receipts:

- `/tmp/watchlist-plans-default-policy-qa-20261123T013822Z/result.json`:
  native, lint and whitespace pass; the initial type-driver finding.
- `/tmp/watchlist-plans-default-policy-types-20261123T013931Z/result.json`:
  corrected actual-framework type check passes on identical source hashes.

Both controllers released only their own guards after child settlement.
No preview, application server or production build was started. No production
policies, plans, grants, prices, providers, accounts, notifications or paid AI
calls are changed. No deployment is requested. The new-ticker defaults/reveal
slice and concealed-row routing dependency above remain separate and open.

## Reader successor verification

The corrected final batch passed 174 tests in ten files, including both first
save orders for unpublished and marker-1 tickers, legacy first saves, independent
explicit choices, malformed marker denials and notification eligibility. The
first run passed 173 tests and failed one legacy-Premium fixture because it
omitted the real authentication-identity migration/link required by the Discord
membership insert trigger. The fixture now uses that actual migration and one
local synthetic linked identity only for this legacy case; ordinary plan-member
cases remain without Discord identities. The full focused retest passed.

Changed-file lint and whitespace passed. Strict actual-dependency types passed
16 roots and 1,627 files with zero diagnostics. Source hashes remained unchanged
through each guarded cohort. Receipts retain both the initial failure and the
clean retest:

- `/tmp/watchlist-plans-protected-defaults-final-20261123T015029Z/result.json`
- `/tmp/watchlist-plans-protected-defaults-retest-20261123T015122Z/result.json`

The actual store/type/reveal contract was reviewed read-only at Admin's frozen
`45b4653e92c98a5c1b9c964c7ac6999b4d6bfcb3`, parent `aec6e1d9`. Both store builders
stamp version 1 only for an absent existing state, and retain the existing marker
or its absence on updates. The four reveal controls invert presentation/request
mapping only; row hiding and Added disclosure remain unchanged. This matches
the reader fallback and first-save semantics verified here.

Final composition with that store/reveal source and combined acceptance remain
required. In particular, the row-control UI fixture must follow the approved
reveal labels after composition. This packet changes no live policy or grants,
sends no notifications, starts no application/build/browser, and requests no
deployment. The concealed-row selected-plan destination remains separate.
