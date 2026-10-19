# Unified membership plan editor

Owner approved the complete redesign and combined QA on October 10, 2026.
Status: implementation and technical QA passed; owner UI review remains open.
No deployment authorized. No paid AI calls, payments or real notifications.

### Add-on card appearance and zero-price alignment - October 13

Added a separate Add-ons section below main plan cards and wide horizontal
package cards with corner badge, title/price, descriptions and expandable
features. Editor add-on preview uses the same wide shape and badge. Kept the
existing selection/checkout controls inside the chosen base plan. Free prices
now use numeric 0 plus the shared small currency symbol and USD/configured
currency row, matching paid price typography and top alignment. Free-plan
price blocks reserve the /month row height so the content below also lines up.
Help aligned. Five focused price tests, targeted lint and focused TypeScript passed
(QA overlay/generated declarations excluded in memory). Real browser fixture
confirmed identical price tops, dollar-sign sizes and full price-block heights,
wide labeled add-on below plans and no mobile overflow. Forwarded owner
editor verified the wide Add-on-badged preview with title/price; no draft saved.
No plan records or billing behavior changed.

### Free-plan price display - October 13

Owner requested $0 in place of Free as the displayed price, with Free used as
the owner-selected plan name. Updated shared card/offer formatting and add-on
price totals. No billing or stored plan changes. Help aligned. Five focused price
card tests, targeted lint and focused TypeScript passed (temporary QA overlay
and generated declarations excluded in memory). Live owner preview verified
Free as the title and $0 as the price; no draft saved.

### Watchlist feature grouping - October 13

Grouped shared Watchlist permissions under watchlist.access: Ticker details,
Trade analysis, Support and Resistance, and new Indicator card. Preserved existing
permission identities and values, removed separate card rows, and added nested
editor controls and default brief. Private Watchlist stays separate. New indicator
permission checks protect ticker/archived page projections and the indicator API;
client refresh retains the returned permission and hides restricted content.
Default indicator enforcement is enforced; explicit off/shadow policies remain
respected. Owner grants still bypass commercial limits. Existing ticker-specific
policies are unchanged. Help aligned. Sixteen focused product/projection/API
tests passed. Focused TypeScript passed with the temporary QA auth overlay and
generated declarations excluded in memory. Targeted lint passed with one existing
unused-function warning in the shared Watchlist client. Forwarded browser verified
Watchlist as a single feature, four nested options with exact labels, independent
Indicator card toggle, one preview row and mobile controls; no draft saved. No plan publication,
database mutation or deployment performed.

### Plan add-on implementation - October 13

Added New add-on/package type with the existing editor and optional Journal.
Backward-compatible presentation JSON stores package type/component offers;
no migration required. Public monthly/free cards list optional packages and live
combined totals, with description/feature expansion. Standalone addon enrollment
is rejected. New combined signup derives a buyer-bound aggregate offer/version
from server-validated source packages, summed compatible limits, unioned access,
unlimited preservation and existing usage anchors. Stripe charges the exact
combined monthly price; existing event authority activates/cancels the aggregate.
Free base access survives cancellation. Pending checkout retries are idempotent.
Generated bundles stay out of owner/public plan lists.

Twenty-one focused tests passed, including exact price, multiple addons, signed mocked
payment/duplicate/cancellation, no paid access before payment, additive limits,
free-base retention, buyer binding and standalone rejection. Real browser widget
verified selection/deselection and totals on mobile. TypeScript and targeted lint
passed. Full application build passed, including its TypeScript and 280 static
pages. Forwarded owner browser verified New add-on, optional Journal, shared
controls, preview, mobile actions and clearing features; no draft saved. Help aligned.
Limitations: matching reset periods for overlapping finite meters, Stripe combined
checkout, new signup only; existing paid subscriptions cannot start a duplicate
bundle. Real provider acceptance and mid-cycle amendments remain open. No owner
plans/drafts changed or real payment performed.

### Plan add-ons design - October 13

Owner requested reusable add-on packages, multiple selections and a combined
monthly price. Audited editor, one-offer claims, Stripe checkout and effective
access composition. Recorded [design](membership-plan-addons-plan.md); existing
checkout cannot yet bill/project a bundle. Owner confirmed additive allowances
and monthly/free base plans for initial delivery. Multiple add-ons share a
monthly payment; annual/lifetime support remains future extensibility.
No plan, draft, payment or database state changed.

### Catalog visibility, draft clarity and Delete plan - October 13

Read-only diagnosis: public preview shows Pro and published test plan 1. Starter
is an editing draft of test plan 1; archived test plan 2 is excluded. Starter
publication fails the stale published-revision check. No live data changed.
Added distinct published/draft names, Discard draft changes wording, publication
errors beside buttons, explicit baseline refresh preserving draft edits, and
Delete plan for published active/archived entries. Deletion retires enrollment,
discards linked drafts and records an audit tombstone; owner list excludes it
and reopening/publication is blocked. Historical versions, billing and existing
memberships remain intact. Help updated. Three focused in-memory lifecycle tests
passed, covering active/archived deletion, unchanged entitlements/history, linked
draft removal, idempotency, stale revision checks, explicit draft reconciliation
and successful publication clearing drafts. Targeted lint and focused TypeScript
passed (QA auth overlay/generated route declarations excluded in memory). Live
forwarded 3027 browser verified published/draft names, recovery control, active
and archived Delete plan buttons, cancelled deletion confirmation and public
visibility. No owner plans, drafts or membership data were changed by verification.
Preview supervisor restarted after it expired, preserving the same fixture.

### Separate Analyzer analysis and Levels Generator title - October 13

Restored Trade Analyzer; added separate boolean Trade Analyzer Analysis with
brief/expanded copy describing analysis pages using Analyzer data. Changed Levels
Generator title and moved allowance/reset facts into its brief, including when
custom copy is used. Existing quantities, reset settings and permissions preserved.
Help aligned. Thirteen focused product tests, targeted lint and focused
TypeScript passed (QA auth overlay/generated route declarations excluded in
memory). Forwarded 3027 browser verified both distinct Analyzer titles and
Levels Generator allowance in the brief. No drafts saved, runtime gate changes
or plans published.

### Trade Analyzer Analysis - October 13

Updated existing analyzer product title to Trade Analyzer Analysis; no duplicate
permission added. Allowances, resets, ordering and descriptions are preserved.
Paid Plans help aligned. Twelve focused product tests, targeted lint and focused
TypeScript passed (QA auth overlay/generated route declarations excluded in
memory). Forwarded 3027 browser verified title and brief in the preview.
No drafts saved or plans published.

### Import broker statements - October 13

Promoted existing journal.imports to the visible Import broker statements feature.
Removed the duplicate nested Journal checkbox; retained permission identity,
existing import selections, shared/per-plan descriptions and Journal brief copy.
No limits, migration or runtime access change. Help updated. Fifteen focused
product/order tests, targeted lint and focused TypeScript passed (QA auth overlay
and generated route declarations excluded in memory). Forwarded 3027 browser
verified selectable feature and preview title/brief; no draft saved.
No plans published or deployment performed.

### Session Tracker plan feature - October 13

Added Session Tracker to the feature catalog as a boolean Journal product, with
shared brief and expanded descriptions and per-plan copy overrides. Existing
editor/card ordering and serialization apply; no quantity/reset controls or
migration are needed. Paid Plans help updated. Targeted lint and focused
TypeScript passed (QA auth overlay/generated route declarations excluded in
memory); forwarded 3027 browser verified selection and card title/brief.
This slice adds plan configuration/display; it does not change Session Tracker
runtime access gates or publish any plan.

### Plan card feature order - October 13

Owner requested a way to arrange card features. Added a Plan card feature order
list with keyboard-accessible Move up/down buttons and disabled edge controls.
Reordering updates the preview immediately and is stored in the existing feature
array in the serialized plan document. Public/private cards and reopened editors
restore that order; unknown/unranked older rows remain stable. Nested settings,
quantities, prices and permissions are preserved. No migration is needed.
Paid Plans guide updated. Three focused ordering tests, targeted lint and focused
TypeScript passed (temporary QA auth overlay and generated route declarations
excluded in memory). The forwarded 3027 browser verified immediate card reorder
and disabled boundary controls. No draft was saved and no live plan changes,
publication or deployment were performed.

### Reports and exports inside Trade Explorer - October 13

Owner requested reports/exports as a per-plan option inside Trade Explorer.
Moved `analytics.exports` into its nested settings and removed the standalone
feature row. Existing export grants and enforcement keys remain unchanged;
saved choices reopen and publish as before, with inclusion described under
Trade Explorer. Deselecting Explorer removes its export setting. Verification
passed: 12 focused tests, a final targeted export-copy check, focused TypeScript,
targeted lint, a read-only publication projection with exports enabled/disabled,
and actual forwarded browser checks. Browser verified Explorer stays enabled
while reports/exports toggles independently and appears only in the brief.
Paid Plans and Trade Explorer guides are aligned. No draft was saved by browser
verification; no live plan changes or production publication occurred.

### Feature titles and allowance descriptions - October 13

Owner requested Trade Analyzer (not Trader Analyzer plus quantity/reset text)
and one Trading Journal feature (no separate Journal accounts feature).
Journal account allowance is nested within Trading Journal; existing finite or
Unlimited values are preserved. New plans without an account setting default
to one account. Account quantity is explained in the Trading Journal brief.
Trade Analyzer quantity/reset period moves from the title line into the brief
for both editor and public cards. Custom owner copy retains these factual
allowances rather than silently omitting them. Storage keys, prices and server
allowance enforcement are unchanged. Paid Plans guide updated. Verification
passed: 17 focused tests, targeted lint, focused TypeScript and actual forwarded
browser checks on editor/public cards. The browser verified a single Trading
Journal row, nested account allowance, Trade Analyzer's bare title and brief
descriptions for 3 accounts and 3 analyses every 5 days. No draft was saved;
live plans and production were not changed.

### Tags inside Journal - October 13

Owner requested Tags as part of Journal, matching the Rules configuration.
Moved custom-tag quantity/Unlimited into Journal, removed the separate selectable
and listed Custom tags feature, and included the allowance in Journal's card copy.
Preset tags remain included and outside the custom allowance. Defaults explicitly
use 0 custom tags when no allowance is configured; saved finite/Unlimited values
are preserved on reopening/publication. Existing server enforcement and active
counts across accounts are unchanged. Paid Plans guide updated. Verification
passed: 19 focused tests, targeted lint, focused TypeScript and actual forwarded
browser checks of finite/Unlimited/zero values, Journal copy and no standalone
Custom tags checkbox/card row. No draft was saved by the browser; live plans/data
and production remain unchanged.

### Journal and Rules in every plan - October 13

Owner clarified that every plan includes Journal and Trading Rules. Journal is
fixed as included, with manual entry, optional statement imports, preset rules
on/off and an active custom-rule allowance of 0, a number or Unlimited. Rules is
not separately listed or selectable. Journal's description includes the selected
rule options. Clearing optional features retains this foundation. Publication
normalizes old drafts as well, so Journal/Rules cannot be omitted by skipping
the browser controls. Existing custom counts and preset choices are preserved;
missing custom-rule settings default to 0, and presets are not silently enabled.
Reopening existing plans uses the same foundation for editing, without amending
the current live entitlements. Verification passed: 24 focused tests, targeted
lint, focused source TypeScript, a read-only empty-draft publication projection,
and the actual forwarded browser check. The browser verified fixed Journal,
nested rule options, finite/Unlimited descriptions and retaining the foundation
when optional features are cleared. No draft was saved by verification and no
publication/deployment ran.

### Product features and nested settings - October 13

This owner revision supersedes the earlier independent notification checkboxes
as standalone features. Stock Press Releases (`news.access`) owns reading delay,
press-release notifications on/off and notification delay as nested settings.
Public and editor cards generate the requested description from these settings
unless the owner supplies custom copy. The stored keys and exact delays stay
unchanged, and hidden settings survive publication and reopening.
Journal includes manual entry automatically; broker imports are nested inside
Journal, with manual-only or manual-and-import descriptions. Dashboard admission
is derived internally from dashboard products and is not owner-selectable.
Trader Analyzer replaces the allowance's old feature label. Week Ahead is a
separate product with notifications included; reopening a legacy published plan
preserves its previously stored Week Ahead permission.
Added Trading Rules with preset access and active custom-rule quantity/Unlimited
across all member accounts. Server checks serialize capacity and rule creation;
paused/retired custom rules free a slot and reactivation requires capacity.
Preset creation/revision/reactivation require preset access; history is retained.
Trader Calendar includes independently selected month/week views; page and panel
checks enforce selected views, with the weekly-only plan opening Week by default.
Compare trades has its own permission at the action and comparison service; its
necessary Explorer access is derived internally and not added as a duplicate
listed feature when Compare alone is selected.
New product permissions default to enforced while retaining owner/global-policy
overrides. Existing live plans/grants are not amended; release requires deliberate
plan reconciliation before activation. No migrations, publication or deployment
ran. Paid Plans, Trading Rules and Calendar guides are updated.
Verification passed: 31 focused tests across product settings, notification
derivation, custom-tag/rule allowances and Journal annotations; a final targeted
preset-revision regression and 10 allowance tests passed after the last guard
change. Targeted lint and focused TypeScript passed. The compiler excludes the
temporary QA auth overlay and concurrently generated route declarations in
memory; source declarations and implementation are checked without changing
the running preview. A read-only publication projection preserved nested
settings and derived permissions without duplicates or database writes.
The actual private forwarded browser verified all requested feature labels,
hidden technical features, nested delay/notification settings and dynamic
description, Journal import copy, Rules preset/count settings and Calendar views.
No draft or plan was saved by that browser check. Owner review and production
release/build/reconciliation gates remain separate.

### Independent News notifications - October 13

Owner requested News access without automatically allowing news notifications.
Dashboard news, Press release notifications and Week Ahead notifications are now
independently selectable. News alone derives neither notification permission.
Selecting either category includes general notification access without duplicate
publication rows. Other parent-feature notifications retain their existing rules.
Existing published permissions reopen checked from the stored feature rows;
existing plans/grants are not rewritten by this source change. Admin guidance and
the Paid Plans Help Center guide are updated. Seven focused tests, targeted lint
and focused TypeScript passed (the temporary QA auth overlay is excluded only
in the compiler's memory). Actual forwarded browser check verified Dashboard
news stays selected while each news notification checkbox remains independently
off or on. No draft was saved. No deployment or publication is authorized.

### Custom-tag allowance - October 13

Owner requested a set number of custom tags or Unlimited per plan, and confirmed
the allowance is shared across all Journal accounts belonging to a member.
Added `journal.custom_tags` as a count feature using the existing allowance
editor and publication workflow. Empty allowance means Unlimited; 0 means none.
The allowance counts active custom tags created by that member across accounts;
preset names and retired tags are excluded. Retiring frees a slot. Existing
tags and assignments remain intact after a downgrade, and renaming an existing
custom tag does not require another slot. Renaming a preset into a custom tag
does require a slot. Count checks and creation share the Journal transaction.
The old 200-tag account ceiling no longer contradicts Unlimited.
Custom-tag membership enforcement defaults to enforced when the membership
policy system exists, honoring explicit off/shadow policies and owner bypass.
This means a plan must include Custom tags before members can create them after
release; older plans are not silently amended. No production activation,
publication or database migration occurred. The Tags Help Center guide is updated.
Focused lint, focused TypeScript and 15 tests passed on the isolated 3027 review
checkout (Journal fixture tests use a 20-second initialization timeout).
Actual private forwarded browser check passed: owner login, New plan, select
Custom tags, enter a numeric allowance, then clear to Unlimited. No draft was
saved and no existing plan was changed by verification.

### Pricing page integration correction - October 13

Owner accepted the current pricing design for now. Design review checkpoint
complete; publishing remains separate and unauthorized. Final appearance:
full #173b78 background, centered white title/description, matching 4.53rem
spacing above the title, below the description and below the cards, existing
compact cards and white frames with a navy outer outline, and 5% smaller prices.
Shared homepage navigation/footer is present without the extra cookie strip.
Focused lint and whitespace checks passed; browser checks verified both cards,
368px desktop width, 5px frames, and no mobile overflow or footer gap before
the final spacing/copy tweaks. Full TypeScript/build verification is not claimed.

Owner rejected the white-background and bounded-panel trials. Current review
restores the full #173b78 page background with white title and description.
The bounded grid backdrop and its extra padding are removed. Existing cards,
centered enlarged heading and shared website navigation/footer stay intact.
Owner supplied the title "Your Trading. Your Goals. Your Plan." and the
description beginning "Take control of your trading with powerful journaling";
applied that copy with the accidental duplicate "and" removed.
Owner requested space above the title about equal to its height. Page top
padding is now 4.53rem, approximately one heading line at the current size.
The description-to-card gap now also uses 4.53rem. Removed the previous Stack
spacing so the existing gap does not add to the requested spacing.
Owner requested a further 5% price font reduction. Both the maximum amount size
and its responsive fit are multiplied by 0.95; other price labels stay unchanged.
Owner requested the same space below the cards, above the footer. Bottom page
padding now matches the 4.53rem spacing above the title and below the description
on desktop and mobile.

The owner identified port 3027 as the actual card-design review. Preserve its
368px card width, 5px white frame, compact feature list, price layout and
purchase spacing. Applied a white page background, 1px navy outside outline,
centered enlarged heading and navy description, and the shared public website
navigation/footer without the extra Cookie choices strip. Header sign-in and
billing links are removed on public plans. Card content and data are unchanged.
Focused lint and diff whitespace checks passed. Owner visual review remains
open. The development review uses the same retained synthetic fixture; no
database initialization, migration, publication or production deployment ran.
Help Center guide updates are unnecessary for these visual changes.

### Owner card-density feedback - October 13

The owner requested standard pricing-card proportions while retaining the approved
blue colours and fonts. The public/private catalog now uses a 368px maximum card
width, compact divided feature rows, inline allowances and a feature-row disclosure
arrow instead of a separate More details line. Brief descriptions stay visible;
expanded descriptions remain keyboard accessible. Cards use their own content
height, avoiding a large blank area beneath shorter feature lists. Mobile remains
one column. Pricing, eligibility, plan data and checkout actions are unchanged.

Owner follow-up places the blue plan name at the top left and the white price at
the top right. The amount targets 128px, five times the 25.6px title; long amounts
shrink to fit their column. Currency and billing period remain smaller. Missing
price fields show an em dash with a price-confirmation note; option names never
become prices. The owner's saved prices and other plan values were not changed.
Feature titles are now 13.3px (5% smaller than 14px), and brief/expanded
descriptions are 10.5px (5% larger than the preceding 10px). Editor preview and
public/private cards share the same price and feature presentation.
Owner's next colour adjustment makes both brief and expanded feature descriptions
black on the existing pale feature surface. Help was reviewed; this colour-only
adjustment requires no guide change.
Latest price styling adds the currency symbol beside the amount (`$` for USD),
retains the currency code and billing period, and reduces the amount font and its
responsive fit by 10% (128px maximum becomes 115.2px). The symbol is smaller than
the amount so the numeric price remains prominent. This presentation change
shares the public/private/editor component and needs no additional Help update.
Browser check passes at 1440/390/320px: `$12` is visible, 115.2px at desktop and
390px, shrinking to fit at 320px, with no horizontal overflow. Targeted lint
passes. Evidence: `card-density/dollar-price-result.json` in `run-JYe2OD`.
Owner's bottom-button correction restores a blue Buy now button below
the features on display-only paid cards (Get access for free cards), including
the editor preview. It is disabled, with a purchases-unavailable note and no
checkout form. Available-plan checkout actions are unchanged. Help explains the
visible disabled button. Synthetic plan data and purchase availability remain
unchanged.
Targeted lint and live-browser checks pass at 1440/390px: both Buy now buttons
are visible below the features at the card bottom, disabled, with no checkout
forms or horizontal overflow. Evidence: `card-density/bottom-button-result.json`.
The owner then requested a narrower button: its shared public/editor style is now
160px wide, capped by the available width and centered at the card bottom. This
size-only adjustment requires no Help change.
The owner approved the spacing above and below the button. The purchase notice
now occupies a reserved slot (one line on wide cards, two on narrow cards), so
clearing its text preserves that spacing. The current display-only explanation
remains visible; the shared slot also keeps the editor preview aligned. No Help
change is needed for this spacing-only adjustment.
Live browser verification removes the notice text temporarily at 1440/390/320px
and confirms identical button gaps before/after, matching the approved spacing.
Evidence: `card-density/button-spacing-result.json` in `run-JYe2OD`.

Price-entry follow-up: the two owner-created synthetic display-only plans had
`12.00` in the field labelled “Price or access option name” and blank initial and
renewal amounts. The field is now “Access option name” with guidance directing
amounts to the price fields; Help and the browser QA selector are aligned. The
owner requested that the entered amount display on the cards, authorizing a
correction of those two review plans through the editor. This does not introduce
automatic inference of money from arbitrary option names.
Correction verified through the actual forwarded browser: both plans saved and
published with initial/renewal USD 12.00 per month, display-only retained, and
existing-member updates unchecked. Public cards show USD 12/month at 1440px and
390px. Read-only comparison confirms preserved feature settings, descriptions,
internal notes and visibility (the editor normalizes feature order). Targeted
lint passes. Evidence: `card-density/price-correction-result.json` and
`configured-prices-*.png` under `run-JYe2OD`. Preview interruptions delayed the
check; the runtime was restored with the same fixture. No production change.

Evidence is in the review fixture's `evidence/card-density/`. Five focused price
presentation tests pass, targeted lint passes, and the source TypeScript check
reports six roots with zero diagnostics. Help now explains expanding a feature
row. The earlier full behavior matrix remains the preceding checkpoint; the
latest visual revision has a separate desktop/mobile disclosure review.

Final live-browser styling check PASS at 1440, 768, 390 and 320px through the
actual private forwarded URL: blue title, white 128px amount, 10.5px descriptions,
13.3px feature titles, no horizontal overflow and keyboard disclosure toggles.
Populated editor preview also passes at desktop/mobile with no checkout controls.
Evidence: `card-density/layout-result.json`, `after-*.png`, and
`editor-preview-*.png` under synthetic review run `run-JYe2OD`. No plan values
were saved during this check.

The full build attempts for this visual revision ended with SIGTERM, without a
compiler diagnostic; they are not passing build evidence. The earlier checkpoint
build remains historical. Owner review now uses the isolated `review-dev` mode
on private port 3027, with external transports denied and the same disposable
fixture. Its temporary authentication environment adapter is restored on exit
and is excluded from application commits. It preserves real synthetic session,
owner-grant and member authorization checks. The QA-only Next configuration
allows the exact private preview origin. Review entry: `/__membership-qa`;
public catalog: `/plans`. Preview interruptions were observed and restarted;
their cause is unconfirmed. Owner visual approval remains pending.

## Current Codespaces QA - October 13, 2026

Owner override: develop, test and review in Codespaces. No push, production
preparation, Railway action or deployment until the finished feature is reviewed
and the owner explicitly authorizes publication. No production coordinator was
contacted from this environment. Older release instructions below are historical.

### Source and preservation

- Worktree: `/workspaces/traderlink-membership-qa`.
- Branch: `codex/membership-unified-editor-local-qa-recovery-20261013`.
- Reconciled checkpoint: local `d55ad85d8`, parent source
  `96519f0d36f549f85981372126099e3f3f47183a`; not pushed.
- Recovery used immutable corrected carrier
  `61999740607297280cb881819e39a7ba1d56004a`, with a narrow migration-manifest
  reconciliation. No staging/Coaching carrier was imported. Main's unrelated
  staged, unstaged and untracked work remains untouched.
- Current disposable lineage: 141 actual migration rows, ending with
  `0165_platform_membership_unified_editor`, execution order 178; zero foreign-key
  violations. Suffix, execution order and applied count are different quantities.
- Exact checked source patches/hashes and harness hashes are in each private
  fixture's `evidence/<phase>/source.json` and `source.patch`. Fixture secrets,
  databases, sessions and screenshots must never be committed.

### Batched corrections

- Admin uses the authorized owner's saved Light/Navy Dark appearance through the
  existing shared provider and text tokens. The Discord editor/grid can shrink
  on mobile; the observed 19px horizontal overflow is fixed.
- Node-only instrumentation uses Next's positive runtime guard, preventing Node
  transport dependencies from being compiled into Edge.
- Notification form identity now changes for access/readiness boundaries, rather
  than every saved preference. Saving retains success feedback and unsaved choices
  in another channel. Stored explicit OFF preferences remain intact.
- Membership page authorization denials defer to the parent layout's existing
  login/locked-access UI instead of surfacing an unhandled 500. Authorization
  still runs before reading Membership data.
- Help explains shared admin appearance. Existing notification guidance remains
  accurate; no additional guide change is needed for the save-feedback correction.

### Current evidence

Fresh compiled Playwright run `run-uay7Js/evidence/all/` passes the interactive
matrix below. Its early dark-mobile screenshot captured loading; it is superseded
by `run-uay7Js/evidence/layout/`, which explicitly waits for populated fields and
passes both appearances at 1440px and 390px. Screenshots are supporting evidence,
not owner visual approval.

| Case | Status | Evidence |
| --- | --- | --- |
| 1 Empty/new/draft/delete | PASS | Blank editor, validation/input retention, keyboard input, save/collapse/reopen/delete. |
| 2 Complete readback | PASS | Every rendered input/select/textarea compared before save and after reopening; draft excluded publicly. |
| 3 Publication | PASS | Current-form publish, success/collapse, public card brief/expanded details, populated edit. |
| 4 Duplicate/private | PASS | Private display-only duplicate, secret page, public exclusion, no checkout, noindex, invalid-secret rejection; exact-copy invariants also pass inert proof. |
| 5 Concurrency/retry | PASS | Two browser contexts reject stale save; lost response after commit then retry creates exactly one version and retains input. |
| 6 Enrollment/trials | PASS | A free/B zero-cost three-day end-access trial without Discord; no subscription; repeat blocked after republication; independent grants expire independently. |
| 7 Quotas/enforcement | PASS | Real-schema synthetic Levels/private Watchlist usage, exhaustion, reset/cost limits, news delays, cross-user isolation and HTTP analysis/indicator denial. Trade Analyzer proof recorded separately below. |
| 8 Bulk access updates | PASS | Unchecked retains old access, new enrollment receives new terms; checked preserves sources/expiry/usage/unrelated grant. |
| 9 Notifications | PASS | Missing preferences ON, named upgrade link, explicit OFF survives bulk publication and another-category save; untouched categories stay ON; feedback/unsaved-email-choice regression passes. |
| 10 Archive/layout | PASS | Archive stops public signup and preserves grants; populated desktop/mobile Light/Navy Dark have no horizontal overflow. |

Focused TypeScript: 22 roots, zero diagnostics. Targeted lint passes the application
corrections and QA harness. Inert integration, mocked read-only Discord discovery
and SSR proofs pass; SSR is not browser QA. Academy registry validation passed
with its existing 26 unregistered archive/draft warnings.

Trade Analyzer proof `run-analyzer-FIK8HK/evidence/analyzer-result.json` passes
actual-schema consumed/active/expired/waived reservation accounting, exclusion,
expiry boundary and A/B isolation without generating analysis. Current app fixes
leave those tested allowance sources unchanged. Inert proof also covers atomic
rollback, commercial history, disabled nested settings, Discord cohorts/role
eligibility, trial lineage and delivery-time opt-out checks with zero real sends.

Cleanup PASS for `run-rimbJM`, `run-uay7Js` and the analyzer clone: published plans
archived, drafts discarded, synthetic links/grants revoked, sessions ended,
zero active offers/links/grants/sessions or external delivery rows, zero foreign-key
violations. Immutable audit/version/trial/usage history remains. Earlier disposable
runs were also cleaned. No real customer record was a fixture.

### QA environment and remaining gates

The compiled browser server binds loopback port 3027. It uses actual compiled
routes/actions and production session authorization. A recorded QA-only bootstrap
adapter disables hosted workers/migrations; tests refuse to run unless that guard
engages. Runtime transports are denied. No permission prompt, Send test, paid AI
call, real payment, real notification or fake delivery verification was used.

Push permission is denied in headless Chromium and the fixture has no verified
email destination. Browser persistence therefore uses another Discord category;
channel-specific backend preservation is covered by inert proof. Unsaved email
form choices are tested without verification or enabling email delivery.

Full-application build PASS: `run-uay7Js/evidence/all-full-final/build-default-result.json`
records exit 0 at `2026-10-13T12:15:28.709Z`; `evidence/full-final-build.log`
contains webpack compilation, full TypeScript and all 280 generated static pages.
Earlier selected-route builds are supplemental evidence. The full build uses a
4 GB TypeScript worker and 2 GB compiler workers after earlier QA heap exhaustion;
no application correction was made to compensate for that harness limit.

QA build settings enable Next's documented webpack memory optimizations, separate
compiler worker and two page-data workers. Next 16.2.6 split generation renames a
proxy artifact twice; the harness restores the byte-identical compiled filename
before generation and records its hash. No dependency or production configuration
was modified. Unchanged public Geist/Geist Mono assets are cached with source CSS
and 11 hashes in `membership-qa-fixtures/font-cache/provenance.json`; the QA font
loader avoids the observed Google timeout without changing application fonts.

### Owner review and actual next steps

The synthetic review instance runs from the worktree/branch above on loopback
port 3027, forwarded privately by GitHub Codespaces. Entry:
`https://literate-carnival-wvgrj7p47gvc5q95-3027.app.github.dev/__membership-qa`.
Choose **Review as owner** to open Plans, or member A/B to inspect published plans.
The QA-only entrypoint is in the custom test server, never in an application route.
Entry smoke PASS through the actual private URL:
`run-JYe2OD/evidence/all-owner-review/forwarded-review-smoke.json` records owner
and A/B login, Secure/HttpOnly/SameSite cookie and blank/create/save/delete draft.
The owner's access-denied report exposed a gap in the earlier loopback simulation:
Codespaces rewrites Origin and Host to `http://localhost:3027` / `localhost:3027`.
The synthetic review server now restores the public Origin only when the exact
local Host, expected forwarded host, matching public Referer origin and browser
`Sec-Fetch-Site: same-origin` all agree. Application authorization and Next's
Server Action checks remain in place; no application source changed for this fix.
`forwarded-origin-checks.json` proves foreign/missing Referer and cross-site
requests still reject. The forwarded browser test uses configured Codespaces
authentication only for that private origin, blocks other origins, and uses the
documented tunnel interstitial header; no credential values are logged or saved.
The local TLS simulation now reproduces the observed header rewriting as well.
The review fixture `run-JYe2OD` intentionally retains its synthetic sessions for
owner review. It is separate from the cleaned acceptance fixtures listed above.
On ending review, run the guarded cleanup for that exact fixture and stop only
its recorded review process. Preserve immutable history.

1. Complete owner visual acceptance in this private Codespaces preview; batch any
   feedback before another focused QA checkpoint.
2. Keep the verified correction slice recorded in a narrow local Git commit.
3. Production deployment/live acceptance are NOT RUN and not authorized. Real
   payment-provider checks remain deferred. Only a new explicit owner instruction
   can authorize publication after feature acceptance.

## Controlling inventory

- Compact searchable/filterable collapsed plan list; edit, duplicate, draft delete,
  stop new signups/archive actions distinct from existing-member revocation.
- One populated editor: details/descriptions, feature selections, allowances/reset
  periods, news delays, prices/access, payment providers, trials, Discord rules,
  public/private placement. Internal plan keys and version history stay hidden.
- Atomic current-form save/publish, validation preserving entries, unsaved-change
  warning, stale-edit protection, retry protection, success then collapse.
- Exact configuration duplication into a separate unpublished plan; never duplicate
  members, subscriptions, usage, invitation tokens or activate checkouts implicitly.
- Bulk existing-member access update with impact summary; preserve unrelated grants,
  usage, trial history and provider billing terms. Price changes do not silently
  change existing subscriptions. Preserve future-renewal behavior deliberately.
- Edit existing price/trial configuration without overwriting historical purchases.
- Public publish includes configured public purchase options; provider readiness
  checks distinguish configured, test and verified. Display-only is explicit.
- Trials include duration, price, repeat eligibility, capacity, dates, payment method
  and end behavior. Whole-app selection belongs in the plan rather than a second flow.
- Plan-scoped Discord eligibility/free/special pricing; readable server/role selection
  where existing verified integration supports discovery. Preserve independent access.
- Private-page placement in plan plus separate multi-plan page management; stable
  secret URLs, noindex and audience boundaries preserved.
- Notifications derive from included features; eligible preferences default ON,
  explicit OFF survives edits/upgrades. Locked settings name qualifying plans.
  Device permission/address verification remain delivery prerequisites, not defaults.
- Shared feature descriptions versus plan overrides clearly distinguished; effective
  enforcement displayed. No invented tiers or commercial restrictions.
- Compact desktop feature grid/mobile stacking, no repeated unrelated cards,
  retired/test records outside normal selectors, usable preview and readiness summary.
- Align Help and stale status documents. Members, subscriptions, global provider
  connections, billing health and audit remain separate operational screens.

## Design checkpoint

Approved workflow: Create -> configure everything -> Save/Publish -> collapse;
Edit restores all settings; Duplicate opens a complete unpublished copy.
Editor sections: Details, Features, Prices and access (nested provider/trials/Discord),
Private pages, Preview and publish. Feature-specific allowances sit beside features.
Desktop uses the existing admin frame and a dense responsive grid; mobile one column.
Owner visual acceptance remains a checkpoint, not permission to deploy unfinished work.

Owner clarification: New plan opens a blank editor above the list (or the main
content when no plans exist). It does not require or create a placeholder row.
Save creates the collapsed row. Edit opens beneath its saved row; Duplicate opens
a populated new-plan editor above the list. Only one editor is open at a time.

## Historical source boundary - October 10

Canonical checkout is shared and extensively dirty/staged. Do not alter that index,
switch branch, or include other work. October10 recorded production ba5e4a3b is the
comparison baseline, not necessarily latest remote. Editor/action source matches that
baseline; local repository implementation is stale for reset_days and must be
reconciled explicitly. Coordinator notified for schema reservation/remote QA.
Coaching/Communities changes are handed off and excluded from this scope.

## Historical QA gates - October 10

1. Pure contract/round-trip validation and incomplete-draft preservation.
2. Disposable database: exact copy, atomic rollback, stale/retry handling, draft
   deletion, publish/availability, bulk migration, renewal and usage preservation.
3. Mocked provider readiness and notification defaults/explicit opt-out/locked plans.
4. UI hydration/edit/save/reopen, failed-save retention, publish submitted values,
   duplicate, compact list, preview, desktop/mobile keyboard accessibility.
5. Integrated remote typecheck/build and authenticated browser acceptance with
   synthetic records only; no paid provider calls or real notification dispatch.
6. Narrow exact-parent release handoff only after all required gates pass.

## Historical implementation progress

### Continued integration checkpoint — October 10

- Owner-authorized save/publish actions now call the atomic publication command;
  the admin Plans route uses the unified workspace. Old price/trial/Discord tabs
  route to Plans; global provider configuration stays separate. Overview metrics
  and private-page controls no longer repeat under every section.
- Publication writes immutable commercial terms, descriptions, private-page
  placement and associated notification permissions in one transaction. Free
  publishing automatically provisions the internal free provider when absent.
- Bulk updates preserve grant identity, expiry, billing and unrelated grants.
  Direct and currently eligible Discord members are counted once. Unchecked
  updates preserve eligible Discord cohorts under ongoing role/freshness checks.
  Usage anchors/carryovers prevent a changed reset interval from clearing usage.
- Archive stops enrollment while preserving direct and retained Discord access.
  Applied version-change history is kept; only pending transitions are superseded.
- Migration-gated default-ON preferences are connected to account reads and
  platform/news/halt delivery eligibility. Existing stored OFF remains OFF.
  Saving one delivery channel leaves others intact; locked categories are not
  silently recorded as opt-outs. Queued deliveries recheck opt-outs.
- Locked notification links now show qualifying public plan names. Help copy
  describes associated notification access and default-ON behavior.
- QA fixes: free-provider initialization, disabled nested trial/Discord settings
  retained on reopen, compatible MUI layout props, target-compatible BigInt usage,
  and preservation of already-applied version-change history.
- Focused compiler checkpoint expanded to 18 roots, zero diagnostics. Batch lint
  passed across the unified UI, actions, publication/member/default implementation,
  account settings, news/halt readers, Help and QA files.
- Expanded in-memory SQLite checks pass for current-form publication/reopen,
  idempotence, stale rejection, transaction rollback, bulk expiry/usage preservation,
  Discord cohort/role checks, trial-repeat lineage, private display-only catalog,
  and notification ON/OFF persistence. No network calls, real database changes,
  paid AI calls or real sends. Archive follow-up passed. Added actual Levels
  allowance read proof across the carryover/reset and queued remote-message
  opt-out suppression proof; both passed.
- Read-only Platform bot server/role discovery added, with paginated servers,
  refresh controls, readable choices and explicit advanced-ID fallback. Mocked
  discovery checks confirm GET-only paths, validation and safe errors. No real
  Discord request or role change was performed.
- Paid/card-required trials can use a configured processor even on a free access
  option; offline publication verifies exact trial amount and currency.
- Help now covers the unified owner workflow, archive, bulk access, per-plan copy,
  default-ON notifications and provider-independent enrollment.
- Coordinator reserved migration 0165 / execution order 178 after Communities
  0164 / order 177. Added the descriptor and narrow manifest registration/table
  inventory. No production schema changed. The canonical checkout's older
  migration inventory is NOT an integration parent: coordinator is reconciling
  current production with the accepted complete migration lineage.
- The private Watchlist period guard exposed a publication-order defect: insert
  the version as draft, write features/periods, then mark published inside the
  same transaction. Corrected and covered by actual private allowance/reset reads.

### Earlier implementation record

- Read-only audit completed. No implementation QA pass claimed.
- Full scope recorded; current source and framework form contracts inspected.
- Draft contract/store, editor fields, readiness checks and compact list components
  are local implementation in progress; not connected to the live route yet.
- List supports empty-state New plan, inline Edit, Duplicate, draft deletion,
  search/status filtering and visible success/error feedback. Server wiring pending.
- Reopen projection now retains saved trial end behavior, Discord display names and
  non-purchasable display-only/disabled price configuration.
- Earlier focused offline draft/contract proof passed; this is NOT full feature QA.
  Publication, grandfathered access, trial lineage, notification defaults, migration
  registration and integrated browser acceptance remain open. No deploy performed.
- Continued implementation: opening an existing plan is now read-only until Save;
  duplication retains private-page placement selections but copies no URL secrets or
  member records. Owner-authenticated open/discard actions added. Legacy unpublished
  drafts have a recoverable, audit-preserving removal path; published history is kept.
- Preview now reuses the existing blue public-card stylesheet, including editable
  brief/expanded descriptions, formatted USD budgets, allowance periods and trial
  wording. Preview checkout buttons cannot start checkout. News delay input supports
  minutes or seconds instead of requiring conversion to seconds.
- Added publication preparation and immutable commercial-term insertion helpers.
  These are not yet the complete atomic publication command and are not wired live.
  Removed an incorrect Stripe price-reference requirement: the existing checkout
  already builds price data from the configured amounts and billing interval.
- Trial family tracking added so revisions share enrollment/repeat history; claims,
  catalog capacity and admin counts use that family when the new schema exists.
  Explicit trial end behavior now flows to checkout and public wording; end-access
  trials on recurring options must not silently create a recurring subscription.
  These runtime changes still need the final permitted verification checkpoint.
- Associated-notification derivation added to publication preparation. Parent
  features determine categories, with Market halts retained as a standalone feature.
  Default-ON preference persistence and locked-plan account links remain pending.
- Focused ESLint completed without errors on the continued 19-file slice and the
  final four-file follow-up. No test suites, dev server, production
  build, provider calls, notification dispatch or deployment were run in this
  continuation, following the current design-first/resource instructions.
- Help review: `src/modules/help/paid-plan-guides.ts` requires updates for unified
  plan descriptions, associated notifications, default-ON and trial behavior when
  route integration is complete. Existing guide copy has not yet been replaced.

## Current resume boundary

### Exact-parent reconciliation checkpoint

- Coordinator supplied integration parent `71e9aa2a05ba2b36406cb07d699f584557c54cda`.
  Migration reservation remains 0165 / order 178 after 0164 / order 177.
- Narrow file overlays preserve newer account Appearance, reverse-split and
  Watchlist settings, and the complete halt lifecycle/revision/expiry behavior.
  Do not stage those stale canonical files wholesale. The explicit candidate
  inventory and overlays are in `artifacts/membership-unified-editor/`.
- Corrected a newly found default-ON gap in the newer Watchlist preference and
  recipient paths. Explicit opt-outs, active accounts, verified delivery targets,
  membership checks and delivery-time checks remain required.
- Exact Git-tree offline proof passed for publication, complete editor readback,
  duplication, retry/stale protection, bulk grants/expiry/usage, Discord retained
  access, trial lineage, private display-only placement, notification defaults
  and opt-outs, and server-rendered empty/new/populated editors. Zero network
  calls. This proof used the real integrated 0148 membership migration, not the
  obsolete split migration files in the shared checkout.
- Exact-parent type checking is NOT passed: the first virtual-reader attempt
  exposed a harness dependency-directory lookup defect (corrected); the rerun was
  stopped after it noticeably slowed the shared machine. Do not rerun heavyweight
  local checks. Exact-parent type/lint/full-manifest/browser gates remain pending
  for the coordinated remote QA slot. Remote build and
  interactive browser acceptance remain open. Coaching owns the existing staging
  slot; coordinator was notified to queue membership QA, not deploy production.

This remains an uncommitted feature slice in the shared checkout, not a release
packet. Publication, bulk updates, defaults and route integration are now connected.
Remaining: coordinated integration-parent/provenance reconciliation and
integrated non-production build/browser acceptance. Preserve all other
tasks' staged work. No deployment authorized by this checkpoint.
Do not equate focused lint or the earlier draft-store proof with full QA acceptance.


Owner checkpoint (2026-10-14): plan feature configuration, prices and add-ons
are accepted for now; member, Discord and payments testing remain pending.
Next: [Feature restrictions and visible previews](membership-feature-restrictions-progress.md).
Most restricted features should remain visible with an appropriate locked or
synthetic preview; server data/action denial remains required.
