# Membership feature restrictions and visible previews

Owner direction, 2026-10-14: plan feature configuration, pricing cards and add-ons
are accepted for current use. Member, Discord and payment acceptance remain
pending. This is not production or release approval.

Restricted features should generally remain discoverable. Choose the presentation
with the owner feature by feature: a lock for compact data/actions, an obscured
preview, or clearly identified synthetic demo data. Trade Analyzer is the first
candidate for a demo. Specific designs are still to be reviewed.

## Required behavior

- Derive access from the member's effective plan plus add-ons and allowances.
- Block real restricted data and actions on the server, including APIs, server
  actions, exports, history, streams and background/provider work as applicable.
- Never send protected data to a denied browser and rely on CSS blur or a lock.
  Obscured previews use synthetic or independently public content only.
- Demo data is visibly labelled, isolated from member records, and cannot create
  Journal facts, incur provider charges or consume an analysis allowance.
- Distinguish no access from exhausted allowance, delayed access and expired
  membership. Preserve existing member data on downgrade.
- Keep allowed Journal access and manual entry usable. Rules, tags, accounts and
  imports follow the configured nested options; do not invent a separate tier.
- Support shared Light and Navy Dark tokens, mobile and keyboard access.

## Initial source findings (not an exhaustive enforcement audit)

- `platform-membership-page-access.ts` redirects membership-denied pages to
  `/plans`. Those page-entry paths need feature previews where appropriate;
  API/action authorization must remain independently enforced.
- `membershipFeatureDefaultEnforcement` enables a selected subset of permission
  keys and defaults others to off. Stored feature modes and actual runtime gates
  must be inspected before claiming a plan option restricts a feature.
- Existing Watchlist permissions cover ticker details, Trade analysis, Support
  and Resistance, and Indicator card inside one Watchlist product.
- `SwingLockedPreview` demonstrates a teaser pattern but has legacy Premium/
  Whop-specific copy. Do not copy its commercial assumptions into new previews.

## Next implementation slice

Audit Trade Analyzer and Trade Analyzer Analysis separately: page admission,
read APIs, generation actions, saved results, usage/reset checks and effective
add-on access. Build the route/access matrix before modifying gates. Then prepare
an isolated labelled demo preview and upgrade control for owner review. Preserve
approved plan cards and surrounding dashboard chrome. Review the relevant Help
Center guides with the implementation and update them when behavior changes.

Remaining: complete feature route matrix, per-feature owner-reviewed treatments,
server enforcement corrections, targeted tests and signed-member browser checks.
Discord and real payments remain separate acceptance work. No deployment,
migration or hosted-data change is authorized by this document.


Owner sequencing (2026-10-14): complete Google, email/password and Discord login
before new feature-gating implementation. [Login implementation plan](platform-multi-provider-login-plan.md).
Existing authorization remains intact; real provider and payment acceptance stay pending.

2026-10-15: initial [Trade Analyzer entrypoint audit](trade-analyzer-membership-restriction-audit.md)
completed. Analysis pages/read APIs currently use general Analytics access;
next implementation must align the distinct Analysis product and preserve the
shared Journal single-trade read boundary. Bundle checkout already adds
allowances correctly; independent grants intentionally retain maximum semantics.
No restriction activation in this audit checkpoint.

## Analysis gating candidate — 2026-10-15

Owner confirmed email verification, sign-in and reset and authorized gating.
The eight shared Trade Analyzer Analysis pages now check trade_analyzer.analysis
before account preferences, member facts, saved results or offline captures.
Only an actual membership denial becomes the labelled fictional demo; identity,
account and storage failures remain errors. The demo is a proposed presentation
using shared dashboard components and theme tokens, with a plans/add-ons link.
Owner visual approval remains pending.

Analyzed-trades, candle-occurrence and candle-replay APIs require the same
Analysis feature and deny before their saved-result runtime. The default policy
for this one feature is enforced. Explicit stored off/shadow policies still
apply; no hosted policy was changed. Operator bypass is preserved. Shared
Journal single-trade replay and Trade Analyzer generation remain unchanged.

Verification: 16 focused policy/API tests, 14 existing product-contract checks,
and two denied-page tests (Light/Navy
Dark) pass. Tests cover denial-before-read, allowed effective access, expired
access, operator bypass, explicit rollout modes and error propagation. Effective
add-on access is mocked here; real bundle checkout was not re-tested. Targeted
lint and TypeScript pass. Static browser review at1440/390 widths in both themes
passes overflow/focus checks. These are isolated content artifacts, not a live
signed-member dashboard acceptance. Help Center access guidance updated.

The required legacy dashboard-template command reports four failures in unchanged
layout, navigation destinations, feature-help-link and shell expectations. Those
files match HEAD; this slice does not rewrite the shared shell or test contract.
No build, migration, deployment, hosted configuration or member-data mutation.

Remaining: owner review of the proposed demo, live signed-member integration,
Trade Analyzer metered generation UI/policy and worker acquisition validation,
offline-saved-data policy on downgrade, and the remaining feature access map.
Saved member data is preserved. Login-only preview3036 does not expose these
Analysis routes; do not share it as a gating preview.

## Owner correction: exact existing Demo UI — 2026-10-15

The simplified demo/table screenshot is rejected. Use the existing Demo account
and its suitable saved results exactly, in the real Analysis page components.
No replacement dataset or simplified UI. Copy now says Demo data rather than
fictional. Pagination is explicitly not required for this restricted preview.
See [existing Demo preview plan](trade-analyzer-existing-demo-preview-plan.md)
for inspected entrypoints, read-only source isolation and the next implementation.
This is a planning checkpoint; actual Demo renderer integration is pending.

## Static exact-UI screenshot approach — 2026-10-15

Owner chose static captures instead of interactive Demo-data rendering. Eight
Analysis pages x desktop/mobile x Light/Navy Dark =32 actual screenshots.
Static responsive renderer is implemented, removing the invented table. Only
the upgrade link works. Capture and import utilities verify source mode, Demo
indicator (automated capture), full image set, format, dimensions and hashes;
assets use precompressed WebP with a one-megabyte-per-image budget.

Owner confirmed the source is app.traderslink.pro under a specific account and
offered PC Codex capture. The local approved test DB has no Demo records or
saved analysis records. Normal preview startup refused low_available_memory
(1273376KB available,2097152KB required); no refusal bypassed. No claim that the
live Demo data is missing. Actual assets remain pending PC capture, so the
manifest is empty and the restricted screen reports screenshot preparation.
No mock screenshot or simplified example is substituted.

14 focused rendering/admission tests, targeted lint and TypeScript pass.
Capture/import script syntax checks pass. Complete-image validator correctly
rejects the pending manifest. Actual image/browser acceptance remains pending.
No production build, deployment, database copying or hosted mutation performed.
See [PC capture handoff](trade-analysis-screenshot-capture-handoff.md).

## Actual Demo screenshot import — 2026-10-15

Owner supplied demo-analysis-captures-20261015.zip with the exact32 PNGs.
Safely extracted known flat PNG names only; retained originals and moved the
uploaded ZIP into private storage. Screenshots show the real populated Demo UI
(all94 analyzed trades), matching eight pages in both appearances and desktop/
mobile. All fit full-height WebP bounds; no crops or replacement data introduced.

Imported32 WebPs and populated the manifest. Combined assets7067598bytes;
largest674356bytes. The browser selects one matching screenshot per page,
appearance and viewport; no filters, paging, replay or Demo data requests.
The only real action is the plans/add-ons link. Original screenshots' visible
controls remain pixels, including the Demo-clear button; they cannot execute.

Complete-set format/dimension/checksum validation passes.14 focused tests,
targeted lint and TypeScript pass.32 isolated browser combinations verify the
selected asset, exactly one image download, natural aspect ratio, no horizontal
overflow and keyboard focus on upgrade. Reviewed a contact sheet of all source
captures and day-page preview artifacts. This is component/browser proof, not
a deployment or live signed-member acceptance. No builds or hosted mutations.

## In-app Analysis QA setup — 2026-10-15

Owner authorized signed-member browser verification. Preparing a separately
registered read-only preview with a NEW disposable database and four synthetic
session/membership states: Journal-only restricted, Analysis-entitled, expired
Analysis with retained Journal, and combined active feature grants. This is not
real checkout/add-on payment acceptance. Live providers and all application
mutations are disabled. The existing login-test account/database is preserved.
Only actual Analysis pages/read APIs, image assets and Plans are admitted.
A preview-entry role switch selects fixture sessions without changing access
logic in the app. Production authentication/authorization is not bypassed.
Browser outcomes will be recorded after the guarded server starts. No builds.


## Expanded Demo replacement captures — 2026-10-15

Owner supplied demo-analysis-expanded-20261015.zip to replace captures with
expandable sections open. Imported all 32 exact full-height captures. Entry/Exit
and Scaling Out have eight captures above WebP's 16383px dimension limit
(maximum 19805px); retain those as lossless PNG rather than crop or downsample.
Other 24 remain WebP. Active assets total 18935818 bytes; lazy responsive
selection still downloads only the matching page/theme/viewport image. Removed
the eight superseded WebPs; original archives and captures remain preserved.

Complete asset dimension/format/checksum validation passes. Reviewed expanded
Entry/Exit and Scaling Out in desktop/mobile and both appearances. Import and
validation tools now accept bounded tall PNGs up to 4MiB. Help guide reviewed:
no change required because preview behavior and upgrade flow remain the same.
No builds, deployment, hosted data or provider changes.


## Lazy-loaded screenshot sections — 2026-10-15

Owner requested sections to reduce initial loading on desktop/mobile. Reimported
the exact expanded originals as 160 WebP sections, each at most 2000 source rows.
Both responsive captures use equal section counts; integer crop boundaries
cover every row exactly once. No source resizing or page content changes.
All assets now use WebP, including the tall Entry/Exit and Scaling Out captures.
Total 13431196 bytes (previously 18935818); largest section 183678 bytes.
The renderer uses native lazy loading, asynchronous decoding, paired picture
sources and intrinsic dimensions. No scroll listeners, observers, live data
requests or extra client dependencies. Later sections have empty alt text to
avoid repeating the same preview announcement. Screenshot controls stay inert.

Complete-set validation passes for 32 captures/160 contiguous sections. Targeted
lint, TypeScript and four focused renderer/export cases pass. Browser checks
use SSR from the actual component and local asset responses, separately from
the app server: verify responsive source selection, lazy request deferral, full
scroll/decode, contiguous bounds, natural aspect ratio and no horizontal overflow.
Help guide reviewed: no update needed for this loading-only implementation.
No builds, push, deployment, hosted configuration or database changes.

Browser result: all 32 page/theme/viewport cases pass. Only matching responsive
sources download; all sections decode on scroll without gaps or aspect-ratio
changes. Initial aggregate image bytes 3208436 versus 13431196 for full captures
(about 76% less in these controlled checks; browser/network thresholds vary).
App-level rerun was not completed: the prior full-page check timed out during
Next development compilation. Asset responses and isolated actual-component
browser checks pass; this is not a new deployed or end-to-end app acceptance.


## Trade Analyzer generation enforcement candidate — 2026-10-15

Owner authorized proceeding after the screenshot slice. Audited existing
selection/reservation and worker acquisition paths: both already use the shared
plan allowance reader, with an immediate reservation transaction and a
pre-acquisition membership recheck. The missing default was enforcement off.
The candidate now defaults trade_analyzer.analyses to enforced; explicit stored
off/shadow settings still win. No hosted policy row or database was changed.
Levels Generator's default remains unchanged. Existing saved-result/candle
reuse, corrections/retries, operator exemption and provider protections remain.

Allowance responses distinguish absent feature from included zero/exhausted
allowance. The shared summary explains exclusion and offers the matching Plans
link; included finite/unlimited counts and reset details retain existing copy.
Help guidance now explains user-wide plan/add-on generation allowances, reset
and saved-result retention. No new UI layout or entitlement ledger introduced.

Verified 36 focused cases across five files: 13 real in-memory SQL admission/
accounting cases, six catalog lifecycle cases (including actual bundle
composition with synthetic provider events), seven access-policy cases, three
allowance-copy cases and seven owner/provider/retry regression cases. Initial
fixture-only failures were corrected: provider settings, missing legacy table
and reservation provenance. Final relevant reruns pass. Bundle proof adds
10+20+5=35, charges to34, then retains usage when add-ons end (base balance9).
Other cases cover zero/no feature, expiry before acquisition, last-use holds,
release/TTL, first acquisition excluding its own reservation, UTC resets,
continuation charging once, lifetime usage, member isolation, unlimited
downgrade, explicit policies and global provider capacity/service disable.
Scoped lint and TypeScript pass. These are local code/in-memory/component
checks, not production, concurrent multi-process or signed-browser acceptance.
No build, deployment, migrations, real provider/payment calls or hosted changes.

Remaining: owner/live preview review of the no-feature message, real signed
member generation acceptance with an authorized provider fixture, then the next
feature's enforcement/treatment. Real payment acceptance stays separate.


## Signed-member generation QA setup — 2026-10-15

Owner authorized agent-run signed-member generation testing. Preparing a NEW
disposable fully migrated database, seven real Platform sessions and two Journal
accounts per synthetic member. Fifty-six synthetic round trips are entered
through the actual manual preview/commit service, with no Demo flag. States:
excluded, included zero, finite2, unlimited, expired with retained Journal,
composed finite5 and another member. The composed allowance here is a fixture;
the actual payment-event bundle composition was verified in the prior catalog
SQL test, not a real payment. Real Google/Discord/Resend are disabled; external
network is denied except framework font resources. Development workers stay off.

Generation QA admits only the actual generation POST plus ordinary read routes.
Other mutations remain denied. A separate registered port3038 avoids the owner
login fixture. Paused only this chat's own3037 screenshot preview to free memory.
Browser and signed-route outcomes remain pending. No builds or hosted changes.


## Signed generation checks and expanded entrypoint UI — 2026-10-15

Signed browser/API checks pass for excluded, zero, expired, finite2 across two
accounts, unlimited and composed-fixture5. The real Workspace Analyze Trade
button reserves one use. Duplicate requests preserve balance. Foreign-member
trade and missing mutation proof are rejected. Actual provider transport never
runs: the real acquisition repository admits two reservations, records controlled
provider_unavailable outcomes and keeps charges; continuation charges once.
Queued member expiry blocks first acquisition. A disposable usage anchor models
an imminent reset; signed allowance GET verifies0 immediately before and2 after
the wall-clock boundary, then signed POST reserves another analysis. Foreign
keys remain valid. Composition fixture5 is not payment acceptance; actual bundle
10+20+5 composition was covered by prior catalog integration tests.

Both actual manual-trades and workspace-trades preview/commit handlers pass
real session/account/mutation checks when invoked with signed fixture Requests.
Excluded and zero members save trades while selected generation is denied;
unlimited queues it. Six successful cases preserve all prior trades, with no
foreign-key errors. These are handler-level checks, separate from browser click
proof; no claim that broker market data was downloaded or analysis completed.

Owner broadened the audit and requested a small popup for Workspace's table
icon. Added a compact themed dialog with upgrade link, lookup-error guidance,
and no saved-result/generation request on denial. Added shared inline upgrade
links beside Analyze in Session Tracker/manual review and Workspace Add Trade.
Excluded checkboxes remain visible and disabled. The shared Trades/Workspace
Analyzer drawer now displays allowance/upgrade in all result states, including
indicator-history refresh, and stops pending callbacks when closed. Relevant
Help updated. See expanded entrypoint audit for exact boundaries.

Fixture-only setup corrections: complete first-visit Demo lifecycle; allow three
verified read-only server actions in the preview. Initial UI attempts hit those
fixture restrictions; no production auth bypass was introduced. The preview
process subsequently exited during checks; no cause established. Final popup
browser verification is pending a guarded restart after this checkpoint.


## Add Trade and Session Tracker browser checkpoint — 2026-10-15

Completed the next entrypoint verification slice in the isolated membership
candidate. Fixed Workspace Add Trade's batch analysis response handling: apply
returned availability before checking a denied outcome, so a last-use race no
longer leaves a stale positive allowance and missing upgrade link. Responses
without availability retain the last known display rather than clearing it.

Six actual browser UI cases passed on the running 3038 synthetic preview:

- Add Trade excluded at 390px and 1440px: fixture preview/commit responses reach
  saved review, Analyze is visible/disabled, upgrade links appear, Send selected
  analyses is disabled, and no generation POST occurs.
- Add Trade last-use race at 1440px: initial allowance1, then a simulated409
  usage_exhausted response with balance0; the summary immediately shows0 and
  Increase your Analyzer usage. This checks the corrected response path.
- Session Tracker excluded390, exhausted1440 and unlimited1440: real signed
  allowance API, fixture-only preview response, correct disabled/upgrade versus
  selectable controls, and Save trades remains available. No commit or
  generation was sent. Dialog content has no horizontal overflow.

These browser checks use intercepted synthetic preview/commit/generation
responses where stated; they are not new end-to-end database-save or provider
acceptance claims. The earlier signed actual-handler checks remain the save
and generation-denial evidence. Existing trades, plans and allowances were not
mutated by this checkpoint. Private reproducible harnesses are
/workspaces/private-data/analyzer-add-entry-browser.cjs and
/workspaces/private-data/analyzer-tracker-entry-browser.cjs.

Targeted ESLint: zero errors, the same two pre-existing Workspace warnings.
Help guidance reviewed; its existing trade-entry and upgrade description remains
accurate. No new timers, background polls, dependencies, builds, hosted changes
or provider calls. Source inventory still finds generation requests only in the
shared Analyzer panel and Add Trade batch action, plus manual selection through
the canonical Journal commit paths. Next broader feature work remains separate
from this Analyzer checkpoint and from payment/live-provider acceptance.


## Journal allowances and upgrade guidance — 2026-10-15

Owner authorized Journal account, tag and rule limit verification and fixes.
Account-count default enforcement is now enabled, preserving explicit off/shadow
and operator bypass. Existing immediate creation transactions count active
personal accounts across workspaces and exclude Demo accounts. Authentication's
initial account provisioning, hosted transfer and development seeding stay on
their existing bootstrap paths; this is not a new signup or transfer restriction.
Account creation through the public route and AI draft/confirmation paths retains
the common limit check. Existing over-limit accounts remain intact.

Existing tag/rule transaction gates already count active custom rows across all
of a member's Journal accounts. Preset tags are excluded; preset-to-custom rename
checks capacity. Rule resumption checks capacity, and pausing frees a slot.
Preset activation is independent of custom-rule quantity. Existing records and
history remain after limits shrink. Public preset descriptions remain browsable
with an upgrade notice even when activation is excluded.

Added structured, specific allowance messages and an Explore Journal plans link
to account creation, rule dialogs, trade-tag creation, Day/Swing tag editors and
Notes session-tag creation. Non-membership errors do not become upgrade prompts.
Rule errors render inside the open editor. Shared primary theme tokens apply;
no new permission polling, dependencies, provider calls or schema migrations.
Help for plans, tags and Trading Rules is aligned.

Verification: focused source TypeScript graph passed with zero diagnostics;
scoped ESLint zero errors/seven existing warnings (Notes hooks/Day unused helper).
Account/tag/rule policy and helper tests pass, including default finite/zero/
missing/unlimited account capacity, Demo/other-member exclusion, policy overrides,
shared tags/rules and plain guidance. Nine actual-schema annotation tests passed
on a sequential rerun with20s timeout after seven existing cases exceeded5s while
checks overlapped. New regression covers cross-account creation denial,
preset-to-custom rename denial, paused-rule resumption denial and retained rows.
Actual signed account/tag/rule handlers each returned403 membership_required in
the isolated fixture with unchanged row counts. No member/provider data sent.
Browser verification of the new UI remains pending the guarded preview restart.
No builds, push, deploy, hosted configuration or real member-data changes.


### Journal browser verification completed — 2026-10-15

Source checkpoint24722daa6 and read-only preview harness9e88d601d; registered
profile generation-3038-r6, same disposable fixture. Eight actual browser UI
cases passed: Account creation denial and custom-rule editor denial at1440/390
in both Light and Navy Dark. Values remain entered, upgrade links target
/plans?feature=journal.access, rule notices render inside the dialog and checked
surfaces have no horizontal overflow. Browser writes were intercepted synthetic
denials; actual signed denied handlers were checked separately above. Dark
desktop screenshot visually reviewed. Initial Account cold compile plus privacy
hydration exceeded the first180s browser deadline; the warmed retry passed.
This is development-preview evidence, not a production performance benchmark.

The fixture gained a rules-only grant for two synthetic users so the Rules page
could be reviewed; no Analyzer quantities changed. No real accounts or data were
used. Harness read allowlist now includes only /account/trading and /rules in
addition to prior reads; account/tag/rule writes remain blocked by that harness.

Owner clarified AI Chat is unfinished and unused on the live site. Its existing
account-creation path received only two focused offline regression tests (both
pass): a permitted confirmed creation and an allowance recheck before confirmed
creation. Its old test now explicitly supplies a permitted account allowance.
No AI Chat runtime change, activation or live-user acceptance is implied.
These tests are defensive future-path coverage, outside current live features.

React review: conditional upgrade rendering uses structured policy codes rather
than parsing prose; shared theme tokens, links and existing bounded dialogs are
retained. No new network reads or background polls. Source TypeScript and scoped
lint passed; latest test-only lint also passed. No builds or deployments.


## Owner review transport correction — 2026-10-15

Owner correctly found the public test steps did not work: harness still blocked
Journal POST routes and returned plain text. Prior browser cases intercepted
denials; they did not prove real browser-to-handler transport. Allowlisted only
account, rule and tag creation POSTs in the existing disposable fixture harness,
retaining real handler identity/mutation/membership checks. Other rejected routes
now return structured JSON. Account UI also handles a non-JSON service response
without exposing parser errors. No provider or hosted mutation authorization.
Actual unintercepted browser verification pending this source checkpoint.


Real preview transport verification now passes at6cef5cc3b, profile
generation-3038-r8. Account and custom-rule submissions were clicked through
the actual browser at1440/390 in Light/Navy with NO intercepted responses. All
eight UI cases show the real handler's membership denial and upgrade link,
retain input and avoid horizontal overflow. Four signed browser-fetch tag
creation attempts also return actual403 membership_required. Account/tag/rule
row counts are unchanged. Unsupported preview mutation returns structured
JSON403. Harness syntax and account-client lint pass. Initial mobile automation
clicked an SSR button before hydration; remaining cases passed after awaiting
the actual Rules projection response before interaction. No app source change
was made for that automation timing. No builds or hosted changes. This
supersedes intercepted-response evidence for these owner test instructions.

The preset notice is intentional for a member whose plan excludes preset
rules. It is informational, not a server failure. AI Chat remains unfinished
and unused live; no changes to its runtime or activation.


Owner wording/layout correction: removed “preset rules below”. The bounded
notice now sits above the action buttons and reads “Use Browse presets to
explore the available rules. Choose a plan with preset Trading Rules to
activate them.” Desktop Light1440 and Navy mobile390 real-browser checks
passed: notice above Browse presets, max560px, wrapping/no horizontal overflow.
Scoped Rules lint passed. No build or preview restart for this copy/layout edit.


## Preset rule upgrade prompt at activation — owner direction

Removed all standing preset-restriction notices from the Rules view and preset
library. Browse presets now opens the existing library dialog on desktop as
well as mobile. Members browse and configure a preset normally; Activate rule
uses the real handler, whose preset-permission denial displays the upgrade
prompt inside the editor without adding the rule. Opening the library/editor
clears previous operation errors so an old denial does not become a standing
notice. Help instructions align with the activation-only prompt.

Unintercepted browser checks pass desktop Light1440 and Navy mobile390: no
upgrade prompt on Rules/library/configuration, actual Activate rule403 with
membership_required and an upgrade link, no horizontal overflow, clear library
on reopening. Scoped Rules lint passed. No build, provider call or deployment.
This replaces the earlier standing-notice placement decisions.


## Broker-statement import restriction checkpoint

Enabled journal.imports default enforcement in the local candidate; explicit
off/shadow and operator exemption remain. Existing upload/commit/AI-repair and
Moomoo start/latest/scheduler/claim/worker gates now use that default. No schema
or import parsing/ledger change. History remains governed by Journal access.
Denied requests use a structured membership403 and shared import guidance.
Upload, manual mapping, commit, import AI-review dialog and Moomoo setup show
an upgrade link after an import attempt; no standing restriction banner.
Help is aligned. AI import repair is separate from unfinished AI Chat.

Nine focused access tests, scoped lint and focused TypeScript graph pass. Real
signed Requests against the disposable fixture verify all four POST handlers
deny before formData/json is read. With a synthetic import grant, all four reach
normal empty-body validation (400); no valid statement/provider request sent.
History GET remains200 for both. The invalid Moomoo allowed request creates its
existing local operation-failure audit; it is not an import job/provider proof.
Browser proof pending guarded checkpoint restart. Preview read allowlist adds
/imports and Moomoo status; mutation allowlist adds the four import handlers.
OpenAI credentials/data-control flag are explicitly disabled in that isolated
harness along with existing disabled login/email providers and denied external
network. No builds, real statement data, hosted changes or deployment.


Import browser acceptance: source54b0273e1, profile
membership-imports-3038-r1, real /imports UI with no intercepted responses.
Desktop Light1440 and Navy mobile390 both pass: no upfront upgrade notice,
dummy CSV selection and broker retained, actual Upload403 membership_required,
visible upgrade link, history GET200, no horizontal overflow. Initial automation
used an exact Broker label that omitted the required-field marker; corrected
the locator and both real flows passed. Private proof harnesses:
import-gating-browser.cjs, import-gating-signed-check.cjs and
import-gating-types.cjs. No real broker/AI provider connection acceptance or
valid statement import claimed in this restriction slice. No build/deploy.

## Calendar monthly/weekly restriction implementation checkpoint

Calendar and the Workspace Calendar panel now resolve parent/month/week access
before activity or fact preloading. A week-only member defaults to Week.
Restricted direct routes show Calendar choices and an upgrade link; selecting a
locked view from a permitted Calendar opens a compact upgrade dialog and keeps
the permitted data in place. Workspace permission failures show the same clear
upgrade guidance rather than a generic loading error. Shared MUI theme tokens
are used; Help now describes view access and upgrade behavior. The isolated QA
server read allowlist includes /calendar; no new mutation is exposed.

Focused membership/route suite: 21 tests pass, including denied requests never
invoking Calendar fact prefetch and month-only/week-only defaults. Focused
TypeScript source graph passes with zero diagnostics. Scoped UI lint has zero
errors and the existing unused weekStart warning. This is code/mocked-route
proof only: signed-member Calendar API checks and desktop/mobile Light/Navy
browser acceptance remain pending. No production build, deployment, hosted
configuration, customer data or external provider operation was performed.

Calendar signed/browser acceptance, 2026-10-16 UTC: source e5728d2b6,
profile membership-calendar-3038-r1, disposable generation fixture only.
Actual signed GET handler checks pass all12 combinations of no views,
month-only, week-only and both, each with default/month/week requests.
Denied responses403 membership_required contain no data; permitted views200
and default selection match grants. Calendar-only synthetic entitlements were
added to limited(month), zero(week), unlimited(both); excluded remains neither.
No customer membership or hosted data changed.

Unintercepted Playwright: six Calendar page cases across Light/Navy and
1440/390 widths pass. Correct default, lock upgrade dialog, close retaining
permitted view, denied direct query remaining on Calendar with upgrade link,
and no horizontal overflow. Two actual Workspace entrypoint cases pass:
excluded desktop403 with upgrade instead of generic load error; week-only Navy
mobile200 defaults Week and selecting Month opens the upgrade dialog. Screenshots
visually checked for Light desktop and Navy mobile. Initial automation raced
preview startup; retry after readiness passed. No app code correction needed.
Private harnesses calendar-gating-signed.cjs, calendar-gating-browser.cjs,
calendar-direct-browser.cjs, calendar-workspace-browser.cjs. No network response
interception, production build, provider call, deployment or production data QA.
The guarded preview reports running/HTTP200 at this source. Documentation saved
on a separate local QA ref to preserve the warm source checkpoint.

## Compare Trades restriction checkpoint

Compare Trades admission now checks analytics.compare_trades before reading
Trade Explorer facts, saved studies or creating an offline capture. Excluded
members see a bounded upgrade card in the shared dashboard. Study create/update/
retire server actions now require both Trade Explorer and Compare Trades;
the shared study runtime independently checks Compare Trades before each saved
study read/write. Running comparisons retains its existing independent checks.
An allowance change while the page is open exposes an upgrade link on the
existing operation error. Saved studies are preserved. Help aligned.
Four focused tests prove excluded study list/create/update/retire do not call
storage service reads/writes. Scoped lint passes. TypeScript and real signed
browser acceptance pending at this implementation checkpoint. No build/deploy.

Compare Trades signed/browser checkpoint: source89bc689c7, profile
membership-compare-3038-r1. Focused TypeScript source graph273 roots/zero
diagnostics passes. Real signed fixture scope checks deny saved-study listing
and create/update/retire with valid comparison input; permitted listing passes.
Four focused mocked storage-service tests separately prove denial before storage
calls. Only unlimited received a synthetic Compare+Explorer entitlement.

Three unintercepted browser flows pass: excluded Light1440 and zero Navy390
stay on Compare Trades with the correct upgrade link and no comparison controls;
unlimited Light1440 opens the real comparison editor. All have no page overflow.
This is admission/restriction QA, not acceptance of allowed comparison runs or
allowed saved-study writes. Initial standalone harness failures were wrong cwd,
wrong expected error code and extra Explorer-only fields in query input; fixed
harness and real permission checks pass. The editor's pre-existing query shape
needs inspection when broader comparison calculation QA is scheduled; no
calculation claim is made here. No builds/provider/hosted/deployment actions.
Private proof: compare-gating-signed.cjs and compare-gating-browser.cjs.

## Reports/exports and Session Tracker implementation checkpoint

Reports/exports remain one option inside Trade Explorer. analytics.exports now
defaults enforced with explicit off/shadow/operator exceptions retained. PDF POST
uses signed Request scope and denies before request-body parsing/generation;
the report generator independently checks Explorer+exports before its fact
queries. Structured membership403 is recognized by Download PDF, showing an
upgrade link only after the attempt and retaining Explorer filters/results.
Help aligned. Two focused report-route tests plus policy tests pass; lint clean.

Session Tracker now defaults enforced. Current-day and dated pages check the
feature before onboarding/day facts and before development design-preview
branches. Excluded members see a bounded shared-theme upgrade card. This does
not introduce a manual-entry restriction: shared ledger mutations, Journal
notes/reviews and Swing entry retain their existing Journal permissions. The
session-summary API is also used by the general Journal Notes drawer, so is
not exclusively a Session Tracker product endpoint. Feature UI gates cannot
replace the existing account/Journal authorization on those shared services.
Session policy tests (including off/shadow/operator) and scoped lint pass.
Signed browser checks and final source TypeScript are pending. No builds/deploy.

## Stock Press Releases access, options and delays

Stock Press Releases defaults enforced, including the existing visibility and
notification-delay settings. This remains one selectable product. Its independent
notification option defaults enforced; canReceive/assert notification require
both news product access and that option. Week Ahead notifications also require
Week Ahead access. Existing enqueue and delivery both call the shared check;
preferences/opt-in remain additional requirements and disabling stays available.
Five dashboard article/read-receipt methods independently assert news before
article queries; preference reads/disable are preserved. Denied page copy uses
Stock Press Releases, not Dashboard news. Relevant Help updated.
Tests:22 access-policy cases and10 focused news delay/read-boundary cases pass;
scoped lint passes. No real notifications sent. Final source TypeScript and
signed/browser news checks remain pending.

Levels Generator implementation: levels.generations defaults enforced. Existing
user-wide ledger/reset/minimum-or-unlimited composition is used; old Watchlist
noRequestLimit cannot bypass an enforced plan allowance. Excluded access is
distinguished from included exhaustion in copy and UI upgrade label. Previously
saved maps remain readable.21 focused allowance/service tests pass, including
zero/excluded/unlimited/expired/reset windows, other-user isolation and denied
runtime calls. Scoped lint and final TypeScript pending. No market provider call.

Reports actual signed Requests: excluded403 before json parsing; permitted
normal malformed-body400 after parsing. Tracker initial real browser check
passes excluded Light1440 on current-day and dated design-preview query, no
overflow. First combined browser run timed out cold-compiling Trade Explorer;
that is not a download UI pass. Separate remaining checks are in progress.

News/Levels final source TypeScript graph279 roots passes with zero diagnostics.
Initial Levels check caught missing included metadata in the public quota shape;
added optional boolean for backward-compatible responses, validated when present,
and used strict false checks. Scoped lint passes. Tracker browser separately
passes all four excluded current-day/dated-design cases in Light1440/Navy390.
Included root reached HTTP200 but preview stopped before hydration; no included
browser pass claimed. Combined report UI run timed out during cold Explorer
compilation. Preview recovery proceeds only through a fresh exact-source profile;
no guard bypass, build, foreign workload termination or hosted change.

Signed News/Levels fixture checks pass excluded/delayed-no-notification/
immediate-with-notification cases: article list and direct detail honor delay,
notification eligibility differs independently, Levels missing/finite2/unlimited
metadata matches grants and excluded generation is denied with legacy exemption.
No runtime market request or notification delivery. Synthetic QA articles and
entitlements only. The first news detail harness omitted its required channel;
corrected harness passes. Explicit typechecking of new test roots caught omitted
readAt/channel fields in denial-only tests; test inputs corrected and rerun.

## Remaining route audit queue (current source, not completion claims)

- Trade Explorer parent still defaults off. Page/actions/service assertions exist;
  service checks occur inside fact-prefetch runtime. Saved-view runtime needs its
  own admission guard, as comparison studies now have.
- General Analytics still defaults off. Overview, Results, Timing, Breakdown
  and Lab pages use analytics.access; shared Journal/Calendar single-trade APIs
  deliberately use Journal-or-Analytics and must not lose Journal access.
- Watchlist parent/ticker/analysis/levels still default off. Per-ticker selected
  plan policies already exist and must retain owner-selected symbol restrictions.
  A blanket ticker default change without validating those decisions could
  incorrectly restrict every symbol. Private Watchlist has a separate existing
  product/cost-ledger; audit separately, do not merge it into the group list.
- Academy, AI Reviews, Coaching/Community and broker-connection options require
  their own active-path/ownership review. AI Chat remains unfinished and unused;
  do not activate it. Other Coaching candidate work remains separate.
- Compare editor initialQuery includes Explorer-only fields while comparison
  normalization accepts AnalyticsLab fields. Investigate before claiming full
  allowed comparison-run acceptance; current restriction proof remains valid.

Browser completion at8c1b7c5b1/profile membership-news-levels-3038-r3:
Fresh generated cache restored dev-route compilation (old3038 cache retained,
no active holders before rename). Supported2048MB heap; no production build.
Levels/News eight actual UI cases pass across Light1440 and Navy390:
excluded generation POST returns included:false, finite2/unlimited metadata,
excluded News upgrade, permitted immediate2/delayed1 synthetic articles. Initial
headline locator counted both responsive copies; corrected to article buttons
and waited for client rendering. Levels has no offline projection; its readiness
uses the actual quota GET rather than an inapplicable PWA event.
Actual Download PDF403+structured upgrade passes Light1440 and Navy390 with no
upfront notice/overflow. Included Session Tracker mounts its real data/UI with
Manual Trade Entry, Daily Notes/Rules and Day review after cache recovery.
Prior four excluded Tracker cases pass current-day/dated-design in both themes.
No provider call, generated map, notification send, production data or deployment.
Visual review found an existing near-black news description on Navy; follow-up
uses shared text tokens. Remaining audit queue above stays open; no all-feature
completion claim. Private news-levels-browser.cjs/news-debug-browser.cjs,
report-gating-browser.cjs/tracker-allowed-debug.cjs record actual flows.

## Analytics and Trade Explorer parent implementation

analytics.access and analytics.trade_explorer now default enforced. Four active
Analytics renderers and Explorer return bounded shared upgrade views before
facts/offline capture instead of redirecting members away. Existing API/action
checks remain independent. Shared Journal-or-Analytics trade APIs retain Journal
admission; the common analytics engine is not globally gated.
Explorer execute/report-table/compare/page-model reads check permissions before
prefetch and recheck inside the fact runtime. Saved-view list/create independently
check Explorer before storage access. Analytics trade-details returns structured
membership403; drawer and Explorer action errors offer appropriate upgrade links.
Report upgrade targets exports specifically. Help aligned. Inactive Lab redirect
is preserved. Preview admits only the three read-only Explorer server actions by
manifest filename/export name; no saved-study/view mutation added.

27 parent/access/prefetch tests and the comparison regression pass. The existing
comparison editor spread Explorer-only annotation fields into an AnalyticsLab
query; explicit comparison projection preserves supported facts/precision and
removes unsupported fields, fixing its rejected input. Scoped lint passes.
Full changed-source TypeScript graph found a duplicate imported message name
in the drawer; consolidated to existing message/error helpers, focused recheck
pending. Signed/browser parent checks pending. No builds/deploy/providers.

Parent checkpoint source verification: full changed/new-root TypeScript graph288
roots had only the duplicate drawer import; corrected drawer graph269 roots now
passes zero diagnostics. Scoped drawer lint also passes. No browser was counted
when the prior preview stopped during source editing/typechecking. Next guarded
start uses the immutable new checkpoint with sequential browser verification.
Navy news description is now expressed through sx text.secondary (shared token),
replacing a color prop that computed rgb(23,23,23); visual recheck still pending.

Analytics/Explorer signed checkpoint at a96a89526: excluded Explorer model,
saved-view list/create denied; included model reads; actual allowed comparison
calculation with projected query returns two groups. Both Analytics APIs deny
excluded403 membership_required and allow included200. Shared Journal ticker/
trade-details GET remains200 for the excluded-Analytics member and included
member. Initial harness had invalid saved-view sort and requested unavailable
Analyzer replay; corrected to valid descending sort and the actual shared
Journal ticker-details API. No valid saved-view write performed.
Required legacy template verifier still has the same four known baseline
failures: frame import expectation, catch-all/external nav routes, existing
feature-help-link DashboardShell reference and renamed shell nav contract.
Three checks pass; no new component violation identified. Shared frame/shell
were not modified. Sequential browser checks completed at this source: all four Analytics pages
and Explorer deny excluded Light desktop/Navy mobile members and admit the
included member. Compare groups returns200 and renders its scorecard. Explorer
without exports retains access and shows the targeted PDF upgrade after403.
Navy news description computes white through the shared token. No build, real
provider request, alert send or deployment was performed.

Owner decision: Academy lessons remain public (2026-10-16). Keep academy.access
rollout off; no lesson paywall, progress reset, content/slug move or course-catalog
restriction is authorized by this gating work. Course discovery remains public.


## Market halts permission checkpoint

notifications.market_halt now defaults enforced, preserving explicit off/shadow
policies and operator access. Existing preference, enqueue and delivery checks
share the effective permission; queued deliveries are expired without claiming
or decrypting when the member loses permission. No real alerts were sent.
The drawer stays visible; attempting to enable excluded alerts returns a typed
membership_required result and a targeted Unlock Market halts link. Ordinary
service failures do not advertise an upgrade. Help Center Halt Alerts guide
updated. Existing synchronous effect state clearing moved inside its existing
transition to satisfy scoped lint without changing notification handling.
Preview admits only saveMarketHaltAlertsEnabled from Workspace by manifest
filename/export, in the disposable fixture; other mutations remain blocked.
43 initial focused tests pass, then6 delivery tests including two new denied/
allowed queued-delivery cases pass. Source TypeScript274 roots0 diagnostics;
scoped lint passes after the existing effect correction. Browser verification
pending at the next exact-source preview checkpoint. No build or deployment.
Academy remains public by the owner decision; AI Chat remains inactive.


Market halts browser completion at2fe9c6e50: actual switch server action denial
and targeted upgrade pass excluded Light1440/Navy390; included Light1440 saves
on/off. No initial upgrade, toggle restored on denial, no horizontal overflow.
Signed excluded/zero/included preference checks pass. Initial browser call was
before ready; second attempted a collapsed navigation group. Waiting for launcher
ready and opening Stock Tools corrected the harness; neither was a product defect.
Navy screenshot inspected. No actual delivery/provider operation occurred.

## Watchlist parent checkpoint

watchlist.access defaults enforced; existing ticker-specific plan decisions,
legacy restrictions, private ownership and nested defaults are preserved. Page
denial now returns membership_required rather than redirecting away. Index,
ticker, archive list/detail render a shared bounded upgrade view before loading
Watchlist data, using the existing billing-member dashboard frame. Existing
login copy accepts any connected method instead of requiring Discord. The public
how-it-works guide still renders its public content on denied access.
33 focused policy/access/indicator tests plus2 storage-order tests pass. The
access test previously mocked old Discord-only exports; corrected to current
authenticated identity exports, added Google/email admission and page/API denials.
TypeScript279 roots0 diagnostics; scoped lint and diff checks pass. Actual
Watchlist browser checks pending. No shared shell/nav change; its existing
Watchlist pilot-navigation rule remains a separate ownership boundary.
Owner reminder: add-ons are valid upgrade options, not only a higher base plan.
Audit found filtered catalog can hide every eligible base plan when only an
add-on supplies the requested feature; correction is next. Existing paid
subscription amendments remain unimplemented per the add-ons plan; new-signup
bundle proof must not be claimed as amendment/payment acceptance.


## Add-ons remain upgrade options

Feature-filtered Plans retains matching add-ons plus compatible public monthly/
free base plans for selection. Ticker-specific matching is applied first; context
never reintroduces unrelated/rejected add-ons. Guidance clarifies that the feature
comes from the add-on, not each contextual base. No-base empty copy now distinguishes
available add-ons from unavailable compatible base plans. Editor/card layout and
prices remain unchanged. Current billing scope still excludes amendments of an
existing paid subscription; no second-subscription or real-charge operation added.
Six focused discovery/composition tests pass, including sums10+20=30, unlimited,
currency/reset compatibility and distinct permissions. Initial TypeScript graph272
roots found one readonly assignment in a new test; immutable fixture correction
passes270-root focused graph. Scoped lint passes. Real disposable published
catalog proves requested feature exists only in the add-on while compatible
free base is retained by upgrade selection. Help and add-ons plan updated.
Browser checks pending together with Watchlist parent at next source checkpoint.


Owner amendment decision received: existing paid members start add-ons immediately
with prorated payment, retaining renewal date. Implementation contract recorded in
membership-plan-addons-plan.md, including durable migration allocation, immutable
quote/payment matching, preserved grandfathered bundle terms and usage anchors,
pending/failed payment and ordered event handling. This is a recorded design
contract, not implemented amendment behavior or real payment acceptance.


Watchlist/add-on browser evidence atf68cb4750: four desktop1440 Watchlist upgrade
routes pass (index, ticker, archive list/detail), staying on the requested route
with no horizontal overflow. Navy390 index and ticker upgrade also pass. Direct
signed API checks allow included and deny excluded/zero. Mobile archive browser
checks remain uncounted: dev compilation stalled, then the detached preview
stopped. Long combined browser run closed at Plans; split desktop retry passed
all four routes and actual matching add-on selection inside its compatible base.
No browser OOM is proven (cgroup OOM counters remained0).

After stopping only the verified own foreground preview, zero active file holders
were confirmed before preserving the generated cache as
.next-feature-previews/3038-retained-watchlist-qa-20261015. No cache/source/data
was deleted. Guarded same-source fresh-cache start restored public Plans rendering.
Actual mobile390 add-on/base selector, Total:$0, consent dismissal and no-overflow
checks now pass. No checkout submitted. Desktop screenshot inspected; these
public QA packages exist only in the disposable fixture, never the main catalog.

Final discovery review tightened selected matches from stable plan IDs to exact
plan-version IDs, so a matching add-on cannot pull in another version lacking the
requested feature. Four focused discovery tests pass including that regression;
TypeScript270 roots0 diagnostics and scoped lint pass. Prior browser selection
proof uses the same single-version fixture and is unchanged by this narrowing.
The required template verifier retains its same4 baseline failures/3 passes.
No production build/deploy, real provider charge/alert, hosted change or release.
Academy public and unfinished AI Chat decisions remain preserved.


## Existing-member add-on payment implementation — October15 local date

Owner chose immediate activation after successful prorated payment. The isolated
candidate now includes durable amendments, quote/confirm/status UI and exact
payment reconciliation; see [add-on plan](membership-plan-addons-plan.md).
Current synthetic verification:16 repository/provider tests pass, plus6 existing
catalog/lifecycle regressions. A new empty in-memory database applies all143
manifest entries and passes completed-schema verification;0167 file identity also
passes independently. Full static file verification remains blocked by the known
0156 literal-format baseline. Targeted lint and source-graph TypeScript pass.

This checkpoint is local code/storage proof, not real payment or browser
acceptance. No existing/hosted database changed, no build or deployment performed.
Next: signed-member browser QA of quote/confirm/pending/success in both appearances,
then provider test-mode acceptance under the applicable external-action boundary.


Signed browser checkpoint at b6d28764a: actual authenticated page → server action
→ mocked provider → disposable SQLite → refreshed member UI passes. Desktop1440
Navy and Light, and mobile390 Navy pass quote/confirm/success and no horizontal
overflow. Light also adds a second distinct package to the same subscription;
verified allowance progression10→30→50, one subscription, unchanged renewal.
Owner-only status GET returns200; foreign member and signed-out requests return404
without provider identifiers. Screenshots were inspected. Browser-only consent
hydration timing required awaiting Reject optional before interaction; no product
code change was necessary. Existing logo sizing console warning remains unrelated.
Pending/authentication/void/transport-loss states are verified by focused provider
tests, not by a real Stripe browser challenge. Real provider test-mode acceptance,
release/migration reconciliation and owner visual approval remain outstanding.
Stopped only this owned synthetic preview after QA, preserving all fixtures/caches.


Additional add-on service QA passes21 tests, covering free packages, expiration,
bounded retry, unsupported billing terms, renewal retention and late-payment
cancellation ordering. Existing repository/browser proof remains unchanged.
Real Stripe sandbox acceptance is waiting on a test API credential; neither shell
nor local Next env contains it. Owner asked for setup; secrets must not be pasted
into chat. Pending input does not authorize production configuration or charges.


Owner chose local testing only. Fixed repeated-error recovery so an uncertain
payment remains under review and keeps its purchase fence.22 service +4 storage
checks and1 sequential-invoice ordering regression pass, with scoped lint and
TypeScript271 roots/zero diagnostics. Existing Help wording remains accurate.
Real sandbox acceptance stays deferred; no external payment action or build.


## Private Watchlist default enforcement checkpoint

Audited the existing private page, authenticated server actions, repository,
per-card reads, generation reservations and separate cost ledger. All eight
registered private_watchlist keys now default to enforced; explicit owner rollout
policies still control overrides. Existing parent-denied page shows the Plans
link without reading saved cards. Existing add/archive/generate UI is retained.
Per-ticker shared Watchlist policies, public Academy and unfinished AI Chat are
unchanged. Help guide updated to describe denied-page behavior and preservation.

Five real SQLite restriction tests plus product/access regressions pass46 cases:
no access denies reads/writes/reservations, each selected card needs permission,
slot/addition/generation/budget limits apply, duplicate reservation does not
redispatch, foreign member denied, downgrade preserves entries and permits archive.
The first full-manifest fixture timed out under the5-second test limit; narrowed
to the six relevant schema migrations, preserving real repository behavior.
Signed browser proof pending; no build, provider dispatch or hosted changes.


Private Watchlist signed-browser checkpoint atefd8339d1: four cases pass on the
actual page/server actions with disposable signed Google members: Light1440 and
Navy390 excluded-page upgrade; Light1440 and Navy390 allowed add plus exhausted
allowance rejection. All remain on/private-watchlist with no horizontal overflow.
Screenshots inspected. No generation/provider operation dispatched. The initial
browser harness matched the allowance heading too early and closed during the
second action; rerun waits for the exact returned quota error and drains route
handlers before closing, exiting successfully. No product change for that timing.
Stopped only the owned preview after QA; retained fixture/generated assets.
No build, existing/hosted data change, real payment, notification or deployment.

Next unresolved audit: broker connection quota and token-refresh admission;
shared Watchlist nested ticker policy semantics; legacy AI Review/Whop paths.
Academy remains public; AI Chat stays inactive; Coaching/Community ownership
remains separate. These are still pending and are not counted as complete.

## Continuous goal: finish remaining restrictions and upgrade prompts

Owner authorized steps1–2 in one continuous run. No builds, real provider work,
hosted changes or deployment. Scope: broker quota/token refresh; shared Watchlist
nested permissions and ticker policies; active AI Review generation and legacy
Whop access; appropriate plan/add-on upgrade destinations, preserving saved work.

Current audit corrections in progress:
- Broker authorization start/callback/storage, credential read/token refresh and
  incremental scheduling now share the connection-slot check. Saved rows remain;
  oldest connected rows occupy finite slots, revoked rows free a slot. Disconnect
  and existing import status remain available. Account UI and API failures offer
  broker-compatible plans/add-ons instead of initiating unauthorized OAuth.
- Shared Watchlist ticker details, Trade analysis and Support and Resistance now
  default to enforcement, independently of parent/indicator permissions. Existing
  private-ticker ownership and per-ticker selected-plan rules remain mandatory.
  Accepted bundle snapshots contribute their actual base/add-on stable plan IDs
  to selected-ticker checks; unpublished quotes never grant those identities.
  Public upgrade links no longer fall back to a fixed Whop product. Null selected
  offers still disclose no private plan details. Hidden ticker list links use a
  generic feature destination so they do not reveal the concealed symbol.
- AI Reviews use plan/add-on access OR a currently active legacy Whop projection.
  Global readiness does not require Whop when a plan grants access. Account,
  manual-request, dispatch reservation/start, authored provider work and final
  insight issuance use this access decision. Saved reviews remain account-scoped
  and readable after downgrade. Platform generation controls and budget/cost
  fences remain independent. AI Chat and production launch settings unchanged.
- Private Watchlist quota/card action errors now include the matching feature's
  public plans/add-ons link. Shared form rendering uses the optional destination.

Verification in progress. New focused broker/restriction and membership tests
pass. Older weekly/monthly V1 issuance suites stop at the unchanged schema trigger
coach_ai_review_generation_contract_inactive when enabling their platform control,
before reaching the new access code; do not weaken that guard to make them pass.

Pre-browser verification for the continuous goal:60 focused tests pass across
AI Review admission/provider fences/manual requests, ticker bundle identity and
public filtering, upgrade catalog base/add-on compatibility, shared Watchlist
page/API/indicator admission and detail projection, product contracts and shared
membership access. Broker tests pass5 cases with real disposable SQLite: missing
or zero access stops before decryption/refresh; oldest-slot finite allowance,
unlimited and explicit off policy, and included non-expired token use.
Scoped lint passes with the existing unused cleanLevelMapCardBody warning only;
TypeScript309 roots/zero diagnostics passes. Required dashboard-template verifier
retains its same4 baseline failures/3 passes (layout/navigation/shell contracts).
No shared shell change was made to mask those baseline failures. Guide updates
cover broker allowances/retention, Watchlist nested/bundle access, and AI Reviews
from plans/add-ons plus existing verified Whop subscriptions.

Background audit: incremental broker scheduling checks the slot before creating
a job, and execution-token access checks again before provider use. Watchlist
SSE/list projections retain private-ticker and selected-plan filtering; publisher
candle/quote/refresh/recap endpoints remain publisher-token-only. Reverse-split
review stays on its separate authenticated review boundary. AI automatic request
creation filters excluded accounts; legacy runners skip them; provider reservation
and both dispatch versions recheck access; authored work rechecks before token
counting and each call. Receipt/cost settlement and saved review reads remain
available so downgrade does not discard paid in-flight outcomes or saved facts.

Final follow-up verification (2026-10-15 Toronto): 11 signed browser cases passed
for broker denial/disconnect, AI account access, feature-filtered compatible
base/add-on discovery, Watchlist child payload exclusion and accepted add-on
selected-plan access, plus Private Watchlist quota upsell. Two AI Reviews page
cases passed Light1440/Navy390, and three focused broker/legacy status captures
passed. All used disposable synthetic members, no providers/payments.
Follow-ups retain Disconnect for saved connections needing reconnect, honor
recorded legacy paid-period expiry without deleting projections (4 tests pass),
and retain verified legacy status when provider configuration is absent.
AI Reviews header now resolves shared Navy text tokens in the client theme;
fresh-server verification is pending after a dev client-manifest reload error.

### Steps1–2 local completion

Fresh guarded preview at bb3afd4d9 recovered the client manifest without cache
deletion. AI Reviews browser checks pass again at Light1440/Navy390, with no
horizontal overflow; computed usage text remains rgb(23,23,23) in Light and
uses rgb(255,255,255) in Navy. Mobile screenshot inspected. The earlier HMR
manifest error is resolved after restarting only this task's preview.
Follow-up scoped lint passes, TypeScript274 roots/zero diagnostics passes, and
legacy paid-period tests4/4 pass. Together with the earlier60 focused cases
and broker5 cases, this slice has69 passing focused tests.

The authorized remaining restriction and upgrade-prompt scope is locally
complete: broker connection slot/OAuth/refresh/import boundaries, shared
Watchlist parent/children/ticker-selected bundle access, active AI Review
manual/automatic/provider boundaries and legacy entitlement compatibility,
and precise plan/add-on destinations including private Watchlist quotas.
Saved connections, trading facts, reviews and settlement records are retained.
Help guides were updated in the implementation checkpoint. Academy remains
public and unfinished AI Chat remains inactive.

This is local implementation/targeted QA completion, not production acceptance.
The four existing dashboard-template failures and old V1 fixture schema-trigger
failures remain recorded above; they were not concealed or weakened. No builds,
real Stripe/provider sends, hosted mutations, push or deployment occurred.
Broader payment/Discord/release acceptance is separate from steps1–2.
