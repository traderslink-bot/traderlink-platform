# Private production screeners activation — 2026-11-02

The prior timestamp-qualification policy incorrectly rejected every premarket
row and discarded thin stocks when their last-trade clocks were more than 30
seconds old. Current Moomoo snapshot responses now use their receipt time as
the observation clock in every active session. The provider trade timestamp is
retained as provenance and display context, but it no longer decides whether a
current response is usable. Wrong trading dates, malformed rows, impossible
future clocks, missing session prices and rejected provider envelopes remain
invalid. Rolling activity still derives only from observed price and cumulative
counter changes; unchanged responses add no invented movement or volume.

## Owner authorization and scope

The owner explicitly replaced the earlier no-deployment/no-production-access
instruction in the Admin Watchlist conversation. Authorized result: enable and
verify the production screeners for only the two existing approved accounts,
“this guy” and “TraderLink.” Coordinate a clean Railway integration/release,
enable the necessary feature flags and stored scanner configuration, use the
existing read-only Moomoo connection and today's real uploaded universe, and
verify both approved accounts plus denial of unapproved users.

Keep all scanner Discord, push, email and trade-alert delivery disabled. Do not
make screeners public, alter unrelated work, or touch Coach on port 3011. Keep
the single hosted writer and Coordinator release ownership. Ordinary Watchlist
notifications must not be disabled as a side effect of suppressing scanner alerts.

## Source boundary

Previous qualified candidate: `0339ee07d33c3d14c011ca885bea33367251fc7f`.
The audit delta from already-published scanner source `5487cd19` contains 23
paths. Do not replay the entire older feature ancestry: it also includes Public
News and older application code. Integrate narrow source changes against the
fresh current `main`, preserving all subsequently deployed Watchlist repairs.

Page, navigation, live-data, settings, Float and audit access use the existing
`hasWatchlistDashboardNavigationAccess` predicate and its active Discord
identity allowlist. The separate Scanner Early Access variable is not the
current page/API gate. Confirm the actual configured allowlist contains exactly
the two intended active identities; do not guess account identifiers or expose
them in reports. Do not change unrelated membership or Journal admin authority.

## Scanner delivery correction

The universe missing/recovery alert previously used the ordinary Watchlist
owner-review Discord webhook without its own disable control. Add
`TRADERLINK_SCANNER_DELIVERY_ENABLED` as an explicit opt-in guard in
`sendScannerUniverseAlert`; absent or `false` must return before any delivery.
The private activation keeps this control `false`. Do not remove or unset the
shared Watchlist webhook. Existing enabled-alert behavior remains tested.

Verification: 98/98 scanner tests across eight files, one worker, no file
parallelism; targeted ESLint passed. Two new default-off/explicit-off cases
verify zero fetches despite a valid configured webhook. Bounded unit
`scanner-private-delivery-qa-20261102` exited successfully; all descendants
closed and its owned common QA lock released. No notification was sent.

## Required activation evidence

1. Fresh Railway production source branch, exact release parent, service,
   replica count, original persistent volume and deployment health.
2. Required credential variable presence and active quote-read connection
   cardinality, without printing keys, tokens, account IDs or credential rows.
3. Today's actual universe date, count, collection time and content hash.
   Never substitute the synthetic browser fixture or a made-up ticker list.
4. Bounded authenticated live snapshot samples: HTTP/provider result, shape,
   field types, millisecond provider time, ET date, freshness and counter values.
   Keep credentials server-side; do not export the production database or start
   a second token/shared-budget writer.
5. Only after evidence qualifies provider semantics, resolve the three
   currently-false qualification flags correctly. Documentation alone is not
   recorded live evidence and must not be presented as such.
6. Enable feature flags and stored configuration through the coordinated
   single-writer release/configuration process, while preserving existing
   thresholds and all unrelated settings.
7. Measure full-universe batch requested/returned counts, total duration,
   dispatch spacing, quota/cooldown, stale/malformed/missing quotes, results and
   audit-cycle completeness. Observe long enough to validate rolling one- and
   five-minute price/volume behavior against recorded facts.
8. Verify the intended accounts can use the actual production page and an
   unapproved account cannot; distinguish real browser sessions from source
   policy checks. Never manufacture user sessions or weaken access to prove it.

## Provider contract reference

Use the OAuth Web API, not the older OpenD interface. The current official
[Market Snapshot contract](https://open.moomoo.com/api/quote/realtime/market-snapshot)
documents the 400-symbol request and `snapshot_list`, `update_time` milliseconds
and market-local `data_date` fields expected by this candidate. The official
[rate-limit page](https://open.moomoo.com/api/overview/rate-limit) describes a
100/minute same-IP quote limit; the application's existing lower 90/minute cap
and 500ms minimum spacing remain unchanged. Live evidence is still required.

## Current progress

- Owner authorization relayed directly to the Coordinator and original Scanner
  task; implementation ownership remains in Admin Watchlist.
- Scanner-only delivery-off guard and regression tests are ready.
- Read-only production metadata confirms `main`, one replica, a mounted `/data`
  volume and a successful existing deployment; no staged changes were present.
- Read-only production inspection at 17:15 UTC: both required feature flags
  already true; saved configuration enabled, revision 1. The two configured
  active approved identities exist; one has the shared active quote-read
  connection. No account identifiers or credential material were exported.
- Today's real upload has 1,251 symbols, accepted 08:00:10.826 UTC, SHA256
  `8460d7030a659f9e40f64a11e29f082a3efeb7760db43e5c24be855a75911391`.
  At 17:24 UTC its genuine persisted float cache contains 1,232 facts; 19
  missing facts must not block repeated quote observation.
- At 17:16 UTC a single bounded read-only Moomoo snapshot request returned
  HTTP 200 / provider code 0 and all four requested rows in 210ms. The AAPL
  control and AARD had 787ms / 18,734ms quote ages; AACG / AAME were stale at
  1,328,880ms / 271,045ms and must remain excluded from fresh comparisons.
  Production token decryption remained inside production memory, with no token
  refresh, budget write, database copy or additional background worker.
- Regular-session timestamp/counter qualification now uses that actual packet
  and recorded regression cases. This does NOT qualify premarket/after-hours
  semantics; those sessions retain unqualified status pending live evidence.
- Missing float refreshes now run independently of quote collection, with one
  in-flight refresh and a five-minute retry delay. Persisted positive facts are
  used immediately; missing facts remain missing, never invented.
- Rolling volume now accepts the existing bounded at-or-before quote anchors
  rather than requiring exact millisecond matches. It subtracts actual recorded
  counters across 60–70s / 300–310s observed windows without interpolation or
  extrapolation. Help explains the window tolerance. Gap/reset/freshness rules
  remain in effect. Irregular timestamp arithmetic has regression coverage.
- Consolidated activation QA passed 105/105 scanner tests across eight files and
  targeted ESLint, including actual-packet freshness/regular qualification,
  nonblocking float refresh/deduplication/recovery, irregular rolling counters,
  delivery-off guards, audit and route tests. Bounded user unit
  `scanner-private-activation-final-20261102` exited 0; descendants exited and
  its owned QA lock was released. Coach remained listening on 3011 untouched.
  No production settings or delivery state have been changed by this task yet.
- The Help working-tree file contains unrelated unfinished work. Its scanner
  paragraph change is prepared against the candidate version in the qualified
  source archive only; the mixed working-tree Help file is preserved unchanged.
- A final arithmetic review corrected acceleration and five-minute spike ratios
  to compare elapsed-time-normalized observed rates. Displayed volume still
  uses actual counter differences; unequal observed windows do not create a
  false acceleration. The additional constant-rate/irregular-clock regression
  and full 106-test suite pass with targeted lint in bounded unit
  `scanner-private-activation-ratios-20261102` (exit 0, descendants closed).
- At 17:30 UTC the actual configured allowlist was independently matched to
  exactly the active display names “this guy” and “TraderLink.” Anonymous real
  production scanner/settings GET requests returned 404 with private/no-store
  headers. No signed-in production browser session is connected to this VPS
  chat or the Coordinator, so real two-account browser acceptance is not yet
  claimed. No session will be fabricated to fill that gap.
- Isolated VPS browser storage has no configured real connection or dated
  universe. That absence is not evidence about the real Railway upload.

Continue until private activation is verified, or identify the exact remaining
owner action from actual evidence. The passing earlier synthetic tests and
browser QA do not prove live provider qualification or production activation.

## First release and actual product failure

Coordinator published `f900502f33afce69361cc71fab3dc4253f7de24a` to `main`,
parent `76d43f48ca54a1b30c6b8c2603a923707948ec5e`. Deployment
`bb9d8f6e-b5a2-4fbd-9d24-6c69069405b2` succeeded. Original volume and single
writer remained intact; installed source, unchanged schema/ledger, feature flags,
saved enabled revision 1 and scanner-delivery-off were verified. Health returned
HTTP 200 / ready / 149 migrations. One timeout was observed during the deploying
transition; no uninterrupted-cutover claim is made and no rollback was needed.

At 17:55 UTC genuine scanner evidence contained nine cycles of today's 1,251
symbols, four requested batches (400/400/400/51), latest collection 1,984ms,
69 accepted fresh observations, 1,182 stale/missing quotes and four qualifying
gainers. Budget had 36 starts/minute, no cooldown/recovery. Rolling windows
had not warmed yet. This is partial real coverage, not 1,251 fresh quotes.

The owner then reported the actual page still said **disabled** with empty
tables. Product activation acceptance therefore FAILED despite healthy
infrastructure and a collecting worker. The runtime's module-local singleton
allows separately compiled instrumentation/API bundles to create different
feed instances. The API can return a new disabled instance while the worker's
other instance continues writing evidence.

Correction: use a process-global, database-root-keyed scanner runtime registry
and a shared start marker. Repeated imports/read-before-start return the same
feed/settings/audit queue, without starting a second worker. A genuine startup
exception releases its marker for retry. Separate isolated roots stay separate.
Apply the same process-global, ledger-keyed identity to Moomoo's request queue
so compiled bundles cannot each maintain an independent request budget.

Verification: **134/134 tests passed across 12 files**, including five new
independent-module reload/start-order/isolation/recovery/shared-transport cases,
all scanner tests and existing Moomoo access/monitor/refresh tests. Targeted
ESLint passed. Bounded unit `scanner-runtime-bridge-qa-20261102` exited 0,
descendants ended and its owned common lock was released. Tests made no real
provider requests and did not write production data. A clean correction release
and actual owner-page acceptance remain pending; do not call the feature
functional based solely on the audit worker.

## Owner-observed production behaviour and provider-first investigation

The Coordinator's successor `7b723620a8b0ff99556572b6c73ea2be46022aeb`
deployed the runtime bridge. The owner confirmed actual Top Gainers rows and
updating prices. This does not establish both-account browser acceptance or
correctness of either ranking. The owner then observed counts fluctuating and
whole lists disappearing before returning on the next refresh.

Read-only evidence on November 2, 2026 (all receipt times below UTC):

- The owner saved broader filters at configuration revision 4. Earlier revision
  3 still held regular-session minimum volume 300,000, dollar volume 500,000,
  minimum gain 3%, and maximum spread 2%. A separate settings defect allows
  entering zero into fields whose server-side minima exceed zero and reports
  only a generic save error. Filter changes explain part, not all, of the
  initially short lists. No settings were changed by this investigation.
- A bounded direct OAuth market-snapshot request at 18:51:32 returned HTTP 200,
  `ret_code: 0`, message `success`, and all 400 requested symbols in 483ms.
  Every row supplied price, prior close, volume, turnover, bid, ask, timestamp
  and data date. One market-cap value was zero. Only 33 price timestamps were
  at most 30 seconds old; 367 were older (41 between 30 seconds and two minutes,
  157 between two and 15 minutes, 169 over 15 minutes). These are raw response
  counts, unlike the application's post-normalization accepted counts.
- Fifty recorded natural cycles ending 18:51:32 included four entirely empty
  cycles and seven additional cycles with unavailable batches. At 18:50:58
  all four response bodies were rejected and zero rows displayed; the next
  cycle at 18:51:04 displayed 20 gainers with 26 qualifying. Existing audit
  evidence preserves only `snapshot_batch_unavailable`, not the provider body,
  so its exact historical error code cannot be retrospectively asserted.
- A seven-request bounded diagnostic, spaced ten seconds after each completed
  request and using the first 400 actual universe members, captured the provider
  explicitly rejecting requests at 18:51:55, 18:52:48 and 18:52:58. Each returned
  **HTTP 200 with numeric `ret_code: -11` and exact message `rate limit exceeded`**,
  and no snapshot list. Four intervening requests succeeded and returned all
  400 symbols. The diagnostic ended; no second collector was installed.
- The shared ledger at 18:52:33 recorded 34 starts in the preceding minute,
  all scanner priority, 18 starts in the preceding 30 seconds, and no active
  cooldown/recovery. Diagnostic requests were additional read-only calls and
  did not write that ledger; their contribution must not be omitted from any
  aggregate-rate calculation. This does not establish the actual account/IP
  allowance, or exclude other clients outside this process.
- Current transport detects only HTTP 429, treating HTTP 200 as accepted without
  examining its business-level error. The normalizer subsequently rejects the
  `-11` payload; the feed evaluates the incomplete/empty set and replaces its
  displayed model. This is a confirmed missed rate-limit signal and a confirmed
  mechanism capable of clearing the list. The observed timestamp-age rejection
  is a distinct coverage problem, not an explanation of every empty cycle.

No provider credentials, tokens, user identifiers or raw private responses were
exported. No filters, stored configuration, live analyses, delivery, workers,
services, source deployment or production databases were changed. Corrections
and actual post-correction acceptance remain outstanding. Next implementation
must recognize business-level throttling, determine conservative shared pacing,
preserve successful data honestly through failures, distinguish actual missing
quotes from age rejection, and keep Top Gainers qualification separate from
Momentum activity requirements. Do not infer an undocumented numerical limit
or silently lower the owner's qualification thresholds.

### Owner-authorized timing experiment

The owner explicitly requested trying wider request gaps. A subsequent passive
95-second recording made **zero additional provider requests** and observed
natural failures near minute end while successful and failed batches shared
similar rolling request counts. It does not prove a numerical OAuth cap.

The narrow pacing trial changes only scanner snapshot dispatch spacing from the
shared 500ms floor to a provisional **1,500ms scanner-only floor**. Existing
shared admission, single sequential worker, five-second post-pass pause, request
timeout, qualification settings, owner allowlist and delivery-off remain intact.
Long responses do not incur a second unnecessary wait. For later controlled
trials `TRADERLINK_SCANNER_SNAPSHOT_SPACING_MS` accepts integer 500–5,000ms;
invalid configuration fails rather than dispatching without spacing. This is
an experimental cadence, not a claimed Moomoo entitlement or proved remedy.

Eight clock-controlled pacing regressions cover 500/1,000/1,500/2,000/5,000ms,
sequential ordering, long responses, early timer wakeups and invalid bounds.
All **142 tests across 13 files passed** in the bounded scanner-pacing QA unit;
no provider requests or production writes were made by tests. These are local
timing tests, not live comparisons of those five cadences. The first real trial
requires Coordinator integration/release and passive before/after evidence.
Recognition of business-level throttling and stable last-known result handling
remain separate outstanding corrections; the pacing trial does not claim them
fixed. No Help text changes are required for this scanner-only internal cadence
trial; visible controls, data meanings and available actions do not change.

### Timing-trial release and live comparison

Coordinator integrated only the four pacing/evidence files as
`5468d1c5f30824f0af51f116f488463bdb0a6830`, parent
`7b723620a8b0ff99556572b6c73ea2be46022aeb`, on configured Railway `main`.
Deployment `4cd87b93-82c4-435a-ae48-b801da971f6a` succeeded. The installed
source was independently read back; `/api/platform/health` returned ready,
149 migrations. One writer/original volume and owner-only access remain;
scanner delivery is OFF, pacing override absent (1,500ms default). The owner's
newer saved configuration revision 5 was preserved rather than overwritten.

Before the trial, a read-only aggregation of 115 saved cycles found **exactly
30 normalizable batch envelopes in every complete UTC minute from 19:02
through 19:14**, with another 2–6 rejected envelopes per minute. Exact earlier
raw error bodies prove provider throttling, but historical generic audit
failures do not retain their own exact code. This is strong evidence for an
effective 30-success/minute allowance on this connection/endpoint, not a claim
about the published general OAuth quota or other accounts.

At 19:23:08 the installed ledger showed 24 starts in the preceding minute.
The complete 19:22 minute contained 24 valid envelopes and zero rejected ones,
although that minute includes the deployment transition and is not a wholly
new-worker sample. A later passive check at 19:25:25 verified roughly 1.5s
within-pass dispatch gaps (minimum recorded ledger difference 1,499ms), 25
starts in the rolling minute, and **18 consecutive post-transition scans from
19:22:35 through 19:25:23, all displaying 20 gainers, with zero unavailable
batches**. Full scan cycles were approximately 9.8–10.5 seconds. These checks
made no extra provider requests and did not alter settings or production data.

The wider gap is working in this bounded live sample; sustained higher-load or
other-session acceptance is not implied. Existing `stale_or_invalid_provider_time`
warnings remain. Business-level `-11` cooldown recognition, honest retained
results on failure, and the separate timestamp/rolling-activity corrections
remain outstanding and are not represented as fixed by this pacing release.

## Momentum receipt-clock correction — owner requested November 2

Story: the private owner views Momentum; the existing worker collects Moomoo
snapshots, the rolling book computes recent movement/activity, and the existing
scanner API/table displays stocks meeting unchanged qualification settings.
The broken boundary is the rolling book: it interpreted an unchanged last-price
timestamp plus increasing volume as conflicting data, and used jumps in that
price timestamp as proof of an interrupted HTTP observation sequence.

Correction uses actual `receivedAt` for ordering, continuity, window anchors,
retention and elapsed-time rate calculations. A newer real snapshot with the
same price timestamp can carry legitimate cumulative volume/dollar updates.
Identical counters contribute zero activity, never invented trades. Duplicate
receipt conflicts, changed price at the identical provider timestamp, backward
observations, counter decreases, real receipt gaps and date/session changes keep
their rejection/reset behavior. Recent price provenance remains separate:
prices over the existing 30-second age threshold still do not produce Momentum
metrics. No normalizer eligibility, filters, sensitivity, request pacing, access,
delivery, schema, API contract or visible table layout was changed.

Read-only export selected only public normalized observation fields from 72
existing cycles for three symbols (216 observations); no new provider requests,
raw credentials, account identities, private paths or news data were included.
The sanitized fixture is `src/modules/scanner/live/fixtures/moomoo-receipt-clock-20261102.json`.
These are recorded normalized snapshots, not raw provider bodies or candles.
Replaying identical saved inputs through the previous and corrected books gave:

| Symbol | Before: usable 1min / 5min | After: usable 1min / 5min |
| --- | --- | --- |
| INO | 48 / 0 | 64 / 41 |
| RBNE | 50 / 28 | 64 / 41 |
| SEGG | 48 / 23 | 64 / 41 |

Each symbol has 72 observations. Readiness is not qualification or profitability.
Counter differences and price changes at the final one/five-minute windows are
independently reconciled against the saved receipt-time anchors. No ticker has
special runtime rules.

Verification: 151 tests across 14 files passed, including nine new receipt-clock
regressions and the complete scanner plus existing Moomoo access/monitor/refresh
suite. Strengthened duplicate/counter-reset assertions also passed their final
nine-test rerun. Targeted ESLint passed. The primary bounded unit verified its
1.5GiB/no-swap/one-CPU cgroup before importing tests, exited successfully and
released its owned QA lock after descendants closed. No production writes or
provider calls occurred in tests. Browser UI is unchanged; no new signed-in
production browser acceptance is claimed. Live rollout and warmed natural
one/five-minute verification remain pending.

Help's rolling-observations paragraph is updated to explain receipt timing,
unchanged price timestamps, actual counter differences and genuine unavailable
conditions. Only that paragraph is part of this correction; unrelated unfinished
Help work in the assigned working tree is preserved. The previously observed
business-level rate-limit handling and general last-known-result retention are
not included in this owner-requested timestamp correction.

## Post-market preparation — owner requested fix and deployment

Owner prioritizes the 4:00 PM ET news window, including new runners outside Top
Gainers and renewed momentum in established day gainers. On November 2 the
owner clarified “fix the issue” and authorized deployment when fixed.

Discovery: the former static qualification function returns false for every
extended session, so all after-hours rows are rejected before the price/volume
adapter can run. Public snapshot documentation describes flat `after_price`,
`after_volume` and `after_turnover`, but no saved real snapshot response proves
their post-market clock semantics yet. Existing October 12 **stock-quote**
captures provide a related, explicitly different-endpoint example: SMTK after
price changed 1.44 to 1.5479 and after volume 726,391 to 965,123 while general
`data_time` stayed at 20:00:00.366 UTC (the regular close that day). Those
captures must not be mislabeled as raw snapshot evidence.

Correction, using only the already-scheduled snapshot responses:

- Regular-session validation is unchanged; premarket remains unqualified and
  is not silently activated by this post-market work.
- A session/date-scoped qualifier inspects actual current after-hours fields.
  It records a public-data witness and qualifies their observed timing/counters
  only after two sequential responses for a requested symbol show increasing
  after-hours share and dollar counters within 30 seconds. Invalid/repeated,
  duplicate, unrelated, wrong-date or provider-rejected evidence cannot qualify.
  The verified calendar controls the session, including early closes/holidays.
- The normalized snapshot preserves the original `providerAt` even if it is the
  regular-close clock. Explicit optional `priceTimeBasis: session_observation`
  identifies the different time basis; no receipt is passed off as a supplied
  after-hours trade timestamp. Receipt time supports rolling after-hours price
  and cumulative-volume observations. Identical values add zero activity.
- The normalizer uses after-hours price/volume/turnover, never regular-price or
  regular-volume fallbacks. Current market-date checks and future-time guards
  remain; observed session time must be within the verified after-hours window.
  It does not require a regular-hours trade first, preserving fresh thin-stock
  runners whose earlier current-day quote clock predates the regular session.
- Engine eligibility and focus confirmation honor the explicit observed-session
  basis; regular-session timestamp guards are unchanged. Date/session changes,
  real observation gaps and counter resets start fresh windows. Minimum gain,
  volume, liquidity, spread and all owner settings remain unchanged.
- A small optional public `sessionEvidence` witness accompanies existing batch
  audit evidence, including before a session becomes qualified. No database
  migration, extra collector, extra request, delivery or access expansion is
  introduced. Request spacing remains 1,500ms.

Verification: **170 tests across 15 files passed**, including 19 new session
qualification tests and the existing 151 scanner/connection regressions. Tests
cover the real feed→normalizer→engine→audit path with exactly two mocked existing
requests, early close/holiday/boundaries, proof reset, invalid fields, preserving
the frozen source clock, 1/5-minute counter math, 10-minute rate comparison and
no invented activity. The sanitized related-endpoint fixture is
`src/modules/scanner/live/fixtures/moomoo-after-hours-quote-20261012.json`.
Its test explicitly adapts quote fields to a synthetic snapshot envelope; it is
not represented as live snapshot qualification. Targeted ten-file ESLint passed;
bounded final QA verified its resource limits, completed and released its lock.
Help adds the session-source and honest 1/5/10-minute warm-up explanation.

The separate receipt-clock correction is already live at source
`cb6221d7709ef21f7db5edc2d2b077fbf404d305`, deployment
`d6704b40-2a96-4bf5-8bfa-56cf7197ef8c`; source/health149/owner revision8 and
delivery-off were verified by the Coordinator. This post-market successor needs
its own clean integration/release. Actual post-market acceptance remains pending
until incoming snapshot fields update after 4:00 PM ET; the new worker can then
qualify directly from its natural responses without another activation deploy.
Keep both after-hours gainers and Momentum private to the two approved accounts;
all scanner notifications remain disabled. Do not claim the session qualified
or working live solely because these preparation tests pass.

## Missed-scan rolling-window correction — November 2, 3:35 PM ET

The post-market preparation release is installed at main
`5b419642f9919b5b6f9d814cf556629e12b60ec2`, Railway deployment
`124ccec9-c351-4fad-8f39-836dfd850b9e` (SUCCESS), with health ready/149,
unchanged owner configuration revision 8 and scanner delivery disabled.
Actual after-hours qualification remains a separate market-open acceptance.

Read-only production audit identified a second window reset after the deployment:
INO/INLF received a 26,314ms accepted-observation gap, SEGG 25,271ms,
and ABOS 24,298ms around 3:29 PM ET. The old 15-second continuity rule
discarded their accumulated history. Five-minute readings returned for
INO/INLF/SEGG around 3:34 PM; FNGR had later gaps and remained incomplete.
These are recorded observations, not a claim that those symbols qualify forever.

Owner approved correcting the reset. Keep the 15-second **current receipt**
freshness limit and the regular-session 30-second provider-clock guard. Do not
erase earlier history merely because an intermediate scan is absent. Each
1/5/6/10-minute anchor must still be a genuine observation at/before the
boundary and within the existing ten-second tolerance. Missing endpoints
withhold only dependent metrics. Cumulative volume/dollar differences and
price changes use actual endpoints, not interpolated quotes or fabricated
candles. Session/date/basis transitions, conflicting observations and counter
decreases retain their protections. History retains its existing bounded size.

The sanitized public-data fixture
`src/modules/scanner/live/fixtures/moomoo-observation-gap-20261102.json`
contains the actual INO/SEGG observations around the gap. Regression coverage
reconciles each usable one-minute endpoint independently; the short fixture
must not produce five-minute results. Synthetic cases cover surviving
five-minute windows across a two-minute gap, withholding a missing boundary,
recovery without an additional full-window wait and long-outage expiry.
No changes to qualification filters, ranking, requests, pacing, access,
notifications or production settings are part of this correction.

Help was reviewed: update only the rolling-observations paragraph to distinguish
preserved history from current-quote freshness and missing-boundary coverage.
Focused scanner/connection regressions passed: **174 tests across 15 files**,
including four new gap cases plus the updated missed-scan regression. Targeted
three-file ESLint also passed. The bounded QA unit exited zero, its resource
preflight passed, and its own lock was released after the unit was inactive.
No Moomoo provider requests or hosted writes were used for these tests.
Live deployment and browser acceptance of this correction are not yet claimed.

## Day and Post-Market Gainers tabs — owner-approved implementation

Owner selected two views in the existing Top Gainers card, not a new page:
Day Gainers compares the actual current-session price with the previous trading
day's regular close and keeps updating during post-market. Post-Market Gainers
compares the after-hours price with today's regular close. Use existing saved
gainer filters; do not lower liquidity/spread requirements to fill either view.
Both views use the existing current-session volume and dollar-volume filters.
No premarket-open/previous-post-close baseline or candle downloads are added.

Real read-only OAuth snapshot evidence on November 2 at 4:35:51 PM ET:
PARA `last_price=1.69`, `prev_close_price=3.17`, `after_price=2.72`,
`after_change_rate=60.946`; INO `last_price=1.89`, prior close `0.6024`,
after price `1.9185`; VCIG regular close `8.16`, prior close `3.0402`,
after price `7.0972`. These public source fields demonstrate why the two
comparisons rank different opportunities. `open_price` was present but is
not used by this approved two-view design. No previous post-market close
field was established. A separate Oct 30 PARA historical query returned zero
bars; that does not prove the endpoint cannot return other stocks/dates.

Implementation contract:

- Preserve `baseline` as yesterday's regular close. Carry today's regular
  close separately only for after-hours normalization; never substitute the
  current after price or yesterday's close if today's close is unavailable.
- Engine calculates both rankings from one observation/rolling-metrics pass.
  Primary `gainers` becomes session-appropriate (post-market after close),
  with a separate `dayGainers` result. Momentum gain/filter/score is unchanged.
- Audit records the primary gainer comparison price, gain and basis separately
  from the unchanged day gain. Existing immutable history remains interpretable;
  new optional fields require no schema migration.
- Both desktop and mobile reuse the same selected view and count. Accessible
  tabs show Day Gainers / Post-Market Gainers with comparison-basis text.
  The existing five-second client poll drives the default switch from the
  server's verified session (including early closes), without a reload or
  another provider request. Manual selection persists for that trading date;
  a new trading date restores automatic defaults.
- Preserve private two-account access, disabled scanner notifications, saved
  settings, request spacing, shared budget, News links and chart behavior.
  Include visible symbols from both views in the same existing news lookup.

Acceptance inventory before release: actual field normalization; independent
ranking/filter comparisons; missing close without wrong fallback; unchanged
regular/premarket/Momentum behavior; default switch on live poll and early
close; manual selection retention; next-date reset; mobile/desktop shared
state; zero additional fetch on tab clicks; one snapshot pass for both views;
news enrichment for both; audit reconciliation; targeted lint/type verification;
Help alignment and Coordinator clean release gates. Work is not yet deployed.

Verification checkpoint: all **191 tests across 17 files passed**, including
15 new normalization/engine/feed/selection cases and two actual React card
interaction/polling tests. The one mocked snapshot pass feeds both rankings;
clicking tabs issues no fetch. Ten changed TS/TSX files passed ESLint with one
unused test-argument warning subsequently corrected. Full archive TypeScript
checking reported five diagnostics in unchanged baseline files only: a missing
jsdom declaration in the membership embed-host test and required NODE_ENV
in scanner runtime/pacing test fixtures. It reported no diagnostic in this
feature's changed files. Do not call that a passing full typecheck, alter
unrelated membership dependencies, or hide the baseline diagnostics.
Final closeout after the Coordinator's Shared build: both React interaction
tests passed again. The required legacy dashboard-template guard ran: three
assertions passed and four failed on pre-existing contract assumptions about
the old template/frame, configured legacy route locations and shell/title
ownership. The relevant layout, navigation, shell and test bytes exactly match
the pre-feature candidate. The edited scanner client's forbidden structural
token counts are unchanged: no local shell/header/main, and the existing chart
Drawer import remains one. Do not change unrelated application architecture to
satisfy that legacy guard. The warning cleanup's one-file lint passed with no
warnings. These baseline failures are retained explicitly, not reported as
passing full architecture/typecheck acceptance.

All bounded test/typecheck units are inactive with empty groups; their own
locks were released. Normal index and package/lock files remain unchanged;
all 770 unrelated dirty entries retain their original byte fingerprint.
Feature source is frozen at local candidate
`04b95985539a6a0b287da16ba9736f1e138f7d09`, parent
`c120aeff82a2f4bd9f1b932edc4d5b680ca53169`. This documentation closeout
does not alter that implementation. Coordinator clean integration/build and
actual hosted verification remain required before claiming live completion.

## Momentum Day % / Post % context — additive owner approval

Owner approved showing both percentage contexts in the existing Momentum
scanner, not a second Momentum view or the future compact-card/drawer redesign.
Day % remains the previous regular-close comparison. During after-hours,
Post % uses the same verified current after price and today's regular close
already available for Post-Market Gainers. Reuse that computed value in both
places. No additional API calls, candle downloads or stored settings are needed.

Desktop: rename Momentum Gain% to Day %, add Post % only during after-hours,
and keep the one-/five-minute movement, volume and volume-spike columns.
Adjust the expanded detail colspan for the extra visible column. Both headers
describe their comparison basis. Mobile retains its compact main row and adds
Day % / Post % to the existing expandable details. Unknown post gain is n/a,
not zero or a substituted previous-day comparison. Outside after-hours the
Post % field is absent, not a misleading zero. Qualification filters, ranks,
scores, confirmations and upper-section selection remain unchanged.

New regression inventory: independent percentage math; missing regular close;
unchanged full Momentum rows/rank/score when only context baseline changes;
unchanged regular-hours context; actual desktop column alignment and colspan;
mobile expandable details; session transition through the existing poll and
no extra fetches. Existing Day/Post Gainers and private access/delivery tests
remain in the combined regression batch. No extra scanners or layout redesign
are included. Final combined regression passed: **196 tests across 17 files**,
including three new engine context/qualification checks and two new actual
React desktop/mobile/session-transition cases. Six-file targeted ESLint passed
without warnings. The one bounded 1.5GiB/CPU1 unit passed its resource preflight,
exited zero and closed its original group; its own common lock was released.
All 770 unrelated entries retain their original byte fingerprint; normal index,
package/lock files and protected Coaching listener remain unchanged.
No extra provider requests, production data/settings writes or notifications
were performed by these tests. Earlier baseline-only broad TypeScript and
legacy architecture diagnostics remain recorded, not recast as passing checks.
Coordinator will combine this additive successor with the frozen gainer tabs
for one clean integration/build/release. No deployment of this successor has
occurred yet; live/browser acceptance remains separate.

## Member-only status presentation — later additive request

Owner requested keeping all detailed provider, universe, warming, coverage,
session and fetch diagnostics in Admin. Do not change the in-flight frozen
Gainer/Momentum release for that request; prepare a source successor.

Member presentation in each existing scanner card:

- Disabled configuration: `Disabled` (including overnight).
- From 8:00 PM inclusive to 4:00 AM exclusive Eastern: exact owner copy
  `Active 4:00am - 8:00pm est`, rather than detailed closed/provider notices.
- During operating hours, failed fetch/top-level unavailable/missing universe:
  `Temporarily unavailable.` Do not expose internal provider/error details.
- Ready, partial coverage and warming: no global member status banner.
  Existing values, n/a cells and empty qualifying results retain their own
  meanings; no sensitivity, filtering or data-collection rule changes.

The operating-hours clock uses America/New_York, not a fixed UTC offset or
the device timezone, despite preserving the owner's literal display text.
It updates with the existing polling response/failure; no extra clock/provider
request or worker is added. Both desktop scanner cards and the selected mobile
card reuse the same helper. Member notices replace the card's empty result
notice when present; do not stack duplicate global notices above the cards.
Admin retains its detailed status block, quote coverage, diagnostics and
normal results. Private access and disabled scanner delivery remain unchanged.

Regression inventory: winter/summer Eastern boundaries, disabled precedence,
missing-universe/error presentation, no warming/partial diagnostics on member
page, notice inside each card, overnight-to-premarket change without reload,
failed-fetch generic copy, unchanged Admin detail and existing Gainer/Momentum
behavior. Tests queued behind the Coordinator's already-selected clean build;
no overlapping heavy operation and no production changes from this slice.

Final verification after that slot cleared: **215 tests across 18 files passed**,
including 12 new pure member-notice cases and seven new React member/Admin
checks. Five-file targeted ESLint passed without warnings. The existing poll
crossed the actual 4 AM boundary in the component test without a reload or an
extra fetch. Admin still shows its original detailed partial-provider notice;
both desktop cards and the mobile selected card show only allowed member copy.
The bounded 1.5GiB/CPU1 unit passed its resource preflight and exited zero;
its original group is empty and its own lock released. All 770 unrelated dirty
entries retain their original byte fingerprint. No provider/settings/delivery
effects occurred. This is a separate successor for Coordinator clean release,
not permission to overlap or mutate the in-flight frozen Gainer/Momentum release.

Member-status release installed at 6:32 PM ET: main
`e35f9b55fad899ca7e8dce86e18c0010779ae867`, parent
`b5610a450a4d21d1ae245b13ae65ac913ca2aef0`, Railway deployment
`1da9139b-fadb-46ac-9612-fbb25893cfc2` SUCCESS. Coordinator verified exact
installed source, HTTP 200 ready/149, unchanged owner revision 10/settings
hash, original volume and old writer removed. Scanner delivery remains off,
private access scope unchanged and spacing remains 1,500ms. The six-file
release changes only the approved member status presentation/tests/Help/record.
The earlier live Gainer/Momentum audit math remains recorded above. Actual
owner browser appearance and the next live 8 PM/4 AM boundary are not claimed
as observed merely from source installation or the passing synthetic UI tests.

## Owner-requested compact desktop layout — 2026-11-03

Design: four equal desktop scanner slots per row. Top Gainers and Momentum
each occupy one slot; PR Scanner occupies two slots and shows one newest-first
column, not three columns. Only overflowing lists scroll; local 5px/thin
scrollbars use different light/dark thumbs. Lists retain keyboard-focusable
scroll regions and desktop table headings stay visible. Each scanner has a
top-right full-view drawer action; existing per-ticker expansion and charts
remain available. Mobile retains selected-scanner tabs and one PR list below.

No scanner/provider/filter/session/notification contracts change. Full views
reuse the same polled model; the PR board is mounted once across responsive
layouts. Help wording is updated with this layout. Focused regressions cover
compact columns, expansion, full-view open/close and shared polling, the single
PR request stream/article order, and theme-aware auto-overflow styling. Source
and UI-test qualification are in progress; no browser visual acceptance or
deployment is claimed for this layout yet.

First bounded check: 216/219 tests passed (20 files, 15.9s). All feed,
provider-budget, session, ranking and connection tests passed. The new drawer
test needed to wait for MUI's exit transition and check removal, rather than
expecting an `aria-hidden` attribute; the correction is under recheck. A React
warning was corrected by moving Stack alignment into `sx`. The two unchanged
audit tests also failed after the UTC date advanced: the review test selects
Nov 3 when that is already its initial date, and the overflow test records a
Nov 2 gap with no saved cycle while health defaults to today's UTC date.
Those candidate files match their committed blobs and are outside this layout
slice; they are not presented as new layout regressions or as passing checks.
The unit exited, its entire control group was empty and its own lock released.

Correction recheck completed: **15/15 UI/style tests passed** across three
files; targeted seven-file ESLint passed with zero warnings. Escape closes
the full-view drawer after its exit transition, shared polling updates the
compact and drawer tables together, and PR remains one thirty-article list
with one news/float fetch pair per existing refresh. Theme tests verify auto
overflow and different thin scrollbar colors. The bounded unit completed
successfully in 10.4 seconds, group empty and own lock released. The two
fixed-date audit-test failures remain separately recorded above; no global
green-suite claim is made. Browser visual review and owner acceptance remain
pending, with no deployment requested by this source checkpoint. All 770
unrelated dirty entries retain the recorded byte fingerprint; package files
and Coach on port 3011 are unchanged. The React checklist preserved existing
MUI tokens, one PR instance, shared model fetching, keyboard row expansion,
drawer dismissal and responsive mobile behavior.

## MERC disappearing from Top Gainers — Nov 2, evening ET

Owner reports a sustained after-hours leader repeatedly disappearing. Read-only
production audit inspection at installed main `e35f9b55fad899ca7e8dce86e18c0010779ae867`
covered 90 cycles from 7:35:45 PM to 7:50:39 PM ET. MERC had an accepted
observation in all 90, but was displayed in only 29 with 28 visibility switches.
All 61 exclusions were `spread_above_maximum`, against revision 10's 3% spread
ceiling. This was not a missing quote or failed Moomoo request. Sample: at
7:41:06 PM, $0.314 against $0.126 regular close (+149.21%) with 2.79% spread
ranked first; ten seconds later $0.3002 (+138.25%) with 5.08% spread was hidden.
The last observation was $0.2979 (+136.43%), 19,772,510 after-hours shares,
6.73% spread, and hidden solely by that spread filter.

Correction: Top Gainers Day and Post-Market use effective filters with no
spread exclusion, including existing saved configurations. Spread is still
recorded and shown where applicable; Momentum's filter and score are untouched.
Other owner filters, universe, valid-price/comparison, float and freshness rules
remain unchanged. Gainer audit reasons use the same effective filter as actual
ranking. Hide the now-inapplicable Gainers spread control; retain it for Momentum.
No live settings, data or notification changes are part of implementation.

Focused tests cover wide/narrow/missing spread changes with constant percentage
leadership, unchanged Momentum rejection, settings immutability and preserved
universe/gain-basis/volume/market-cap/display-limit behavior. Spread values used
in the sequence are taken from MERC's recorded evidence; test order-book prices
are synthetic constructions, not claimed to be its original bid/ask quotes.
The compact-grid layout is a separate unapproved local slice and must not be
included implicitly in an urgent release of this correction. Verification and
clean Coordinator release remain pending here.

Verification complete for the source correction: foundation 38/38 and feed
22/22 tests passed. The final Gainer engine/view and actual Admin UI recheck
passed 34/34; five-file targeted ESLint passed without warnings. The first
added universe test correctly triggered duplicate-symbol validation because
its fixture reused a symbol; changing only that fixture to distinct excluded
symbols resolved it. No runtime guard was relaxed to make tests pass. Final
unit `scanner-gainer-spread-recheck-20261102` exited zero in 8.8 seconds with
the 1.5GiB/CPU1/swap0 preflight passed, group empty and own lock released.
Recorded wide/narrow/missing-spread sequence now retains percentage ranking
and consistent audit results; Momentum still rejects above its own ceiling.
No requests, settings writes, market data changes or deliveries were added.
Production installation and post-release audit observation are not yet claimed.

### Owner reversal — Nov 2, evening ET

The owner clarified that the 16% setting had been saved for premarket, not
post-market, and explicitly declined the code change removing spread filtering.
Restore the original configurable spread filtering and its Gainers Admin
control. Reverse only the spread-removal source/tests/Help delta from
`97784ed766910a9811c5b5094ec327ad1803a2c9`; preserve the separate compact-layout
slice at `1a7be51131960d8bcf5aa0de7e82657dcb6fc63b`. No saved settings are changed.
The earlier release handoff is withdrawn by the owner's explicit instruction;
no new release or Coordinator handoff is authorized. Historical diagnosis and
test receipts above are retained as evidence, not an active implementation plan.

## Rapid Drops / Top Losers — local implementation, Nov 2 ET

Owner authorized building this next card after the market closed. No release,
production writes, provider calls or notifications are authorized by this slice.

- One card, Rapid Drops first tab and Top Losers second. Compact summary,
  expandable ticker context, themed overflow-only scrolling and a full-view
  drawer. PR remains one two-slot column; existing scanner layouts are preserved.
- Top Losers ranks negative percentage change: after-hours vs today's regular
  close, premarket/regular vs previous trading day's regular close. No invented
  baseline if it is missing. Existing universe membership still governs requests.
- Rapid Drops starts at 30% within five observed minutes; admin can adjust the
  threshold, window, list limit and retention. It uses the highest actual observed
  price in that window, not HOD or an interpolated candle. No startup backfill.
- Keep one episode through bounces and continued lows. Pre-drop/detection prices
  stay fixed. Track lowest observed price, maximum fall, current distance from
  origin, rebound from low, distance back to origin and observed duration.
  Retain for 15 minutes after the latest new low by default; rebounds do not
  immediately remove it. Expiry consumes old anchors so it cannot instantly
  recreate the same fall. A later fresh rise and decline can create a new episode.
- Cumulative session-volume difference from origin to lowest point is shown as
  shares during the observed fall, not selling volume, tape or an exact candle.
  Missing or reset counters do not become invented volume. No minimum volume,
  float or spread filter excludes these lists; spread stays visible as context.
- Valid normalized observations only; out-of-order, future or stale data is not
  a new drop. Session/date changes, changed controls, disable and counter/basis
  resets clear relevant history. Kept episodes retain their real quote receipt
  time when a later provider batch misses them. In-memory episode/history state
  starts fresh after service restart; there is no claim of complete market tape.
- Reuse the same engine snapshot pass, float map and one unioned News lookup.
  No extra Moomoo/Yahoo/candle request, timer or provider subscription is added.
  Optional version-1 configuration field supports old saved configurations
  without migration or writes during reads. Existing Gainer and Momentum
  settings, filters, access controls and notifications remain unchanged.
- Per-cycle compressed audit evidence includes the result rows, effective
  controls and episode anchors/math. Existing audit-page aggregates are still
  for Gainers/Momentum; a new decline-specific reporting page is not claimed.

Validation inventory: percentage/duration/volume math, thin and unknown volume,
large slow declines vs quick drops, stable episode through rebound, new low,
expiry/re-arm, date/session/clock/counter reset, stale/future/backward data,
correct session loss basis, display limits, old/new configuration validation,
shared-pass/news/audit integration, tab/row/drawer/chart behavior, status states,
unchanged existing scanners and no extra provider requests. Tests in progress;
actual live-session calibration and owner visual acceptance remain pending.

Initial consolidated QA: 106/107 tests passed across seven files. All existing
Gainer/Momentum, shared-feed and current layout tests passed. The new re-arm
test found that an expired episode's older high could overshadow a later fresh
rebound peak. Candidate peak selection now excludes consumed observations,
allowing a genuine later decline without recreating the original episode.
No threshold was loosened to pass the test. Correction and semantic checks are
pending. The first unit closed in 9.3 seconds with group empty/own lock released.

Final local source qualification:

- 15/15 pure decline/configuration cases, 2/2 actual card-interaction cases and
  1/1 shared-feed integration case pass. A rapid fall is detected even while
  the stock remains +140% for the session; it need not be a Top Loser.
- Existing Gainer/Momentum/view tests 31/31, foundation 38/38 and feed 22/22
  passed in the initial combined batch. No extra provider pass, float lookup
  or News request is introduced; the existing News call uses a union of symbols.
- Twelve-file targeted ESLint passed with zero warnings. An unused mock argument
  warning was corrected by asserting that the News symbol list is deduplicated.
- Strict TypeScript qualification of all eleven feature source/test roots and
  their dependencies passed with zero diagnostics across 1,941 files, using
  the existing compiler options and three existing ambient declarations. No
  dependency diagnostics were hidden or suppressed. The final bounded 2GiB
  unit completed in 18 seconds, group empty and own lock released.
- A preceding whole-archive TypeScript attempt exhausted its 2,304MiB Node heap
  before producing diagnostics. It is recorded as incomplete, not passed; no
  unrelated source or dependency was changed to resolve it. No production build
  or actual browser-geometry/light-dark visual acceptance is claimed.
- Local tests are synthetic, not proof of live market detection quality. A
  future authorized live session must calibrate the adjustable 30%/5-minute
  default and retention. New card access inherits existing private scanner
  authorization; no new public route, navigation grant or alert delivery exists.

Rollback note: old saved configurations remain readable without migration.
Once the owner saves the optional `declines` settings, an older strict codec
does not recognize that new key; a future rollback needs compatible code or a
reviewed settings restore. Default reads do not write that key to storage.
The new result and effective controls are stored in compressed cycle evidence;
new decline-specific Admin aggregate reporting remains a separate future scope.

Source is saved as a narrow local checkpoint only. Owner's no-deployment hold
remains in force; this is not a release handoff. Unaccepted compact layout is
still separate from production, saved spread filters remain fully functional,
and normal Watchlist notifications are unchanged.

### Gainer card copy cleanup — owner request Nov 2 ET

Remove the repeated Top Gainers card heading on desktop and mobile, and remove
the Day Gainers caption “Since the previous trading day’s regular close”. Keep
both comparison tabs, percentage calculations, filters, expand action and
full-view drawer identification unchanged. The post-market caption was not
requested for removal and remains. This is local-only under the no-deploy hold.

Source equivalence check confirms exactly those three presentation replacements
against the preceding local checkpoint, with no calculation/filter/feed changes.
Help coverage was reviewed; its comparison explanation remains correct and no
guide text needs changing for this cosmetic removal. The focused card test and
two-file lint are queued behind the shared build; not yet reported as passed.

Queued verification now completed: 13/13 actual client tests passed, including
absent Gainer heading/Day caption, intact comparison tabs, polling, member
notices, drawer and Momentum context. Two-file ESLint passed without warnings.
The bounded unit completed in 7.7 seconds, original group empty and its own lock
released. No browser visual acceptance, provider effect or deployment occurred.

### Premarket High Pullbacks — local implementation, Nov 2 ET

Owner authorized this fourth scanner, excluding inferred recovery/holding/retest
statuses. It uses current price and the dedicated Moomoo premarket aggregate,
not regular-session HOD. Display both percentage below PM high and percentage
gain needed back to it. Initially enter at 20% below and remove below an 18%
distance; adjustable alongside enable/list limit in existing Admin settings.
No volume/float/spread exclusion, extra quote requests or candle backfill. News
uses the same deduplicated lookup, audit cycles retain effective controls/rows.

Read-only current OAuth snapshot probe at Nov 2, 9:46 PM ET returned five of
five requested symbols, HTTP 200, ret_code 0, in 769ms. Four retained positive
PM highs after close: INO 2.27 (PM volume 53,289,759), PARA 3.10 (13,270),
VCIG 3.45 (29,646), INTJ 3.10 (193). SEGG had zero PM high and is unavailable,
not substituted. No credentials, token refresh or settings/data writes occurred.
Current API reference: https://open.moomoo.com/api/quote/realtime/market-snapshot.
Docs and actual retention must be distinguished: this probe verifies retention
for those responses, not a universal provider guarantee. No exact time of the
PM high is supplied or invented; quote receipt is not labeled as high time.

Normal scanner scheduling remains 4 AM–8 PM ET. Late start is an outage/restart
exception, not intended operation. Existing source qualification still marks
premarket session snapshots unverified; this feature does not broaden that gate.
Its current source path is regular/post-market qualified observations with
provider-retained PM aggregates. Actual 4 AM premarket qualification remains
a separate live verification boundary, not a claimed pass.

Optional settings preserve old reads without migration or read-time writes.
Rollback after saving this new key needs a compatible strict codec or reviewed
settings restore, as with declines. Existing private access and disabled alert
delivery remain unchanged. The bounded QA unit completed in 17.954 seconds:
125/125 tests across nine suites and thirteen-file ESLint passed. Coverage
includes actual provider-field normalization through the shared feed, one
existing snapshot/float/news budget reservation per cycle (no additional
request), audit evidence, PM reference freezing/missing fields/date/session
resets, entry/exit band, sorting/limits, strict optional settings and actual
card expansion/news/chart/drawer without a separate fetch. Existing Gainer,
Momentum and decline regressions also passed. New tests use isolated synthetic
fixtures; PARA's public PM high/volume verifies the field interpretation, not
future price behavior. No inferred recovery stages are displayed.

Unit terminal state inactive/dead, MainPID 0, original cgroup absent and own
common lock released. Unrelated 770-entry workspace fingerprint remains
f92b64fe7e96d4969e3c3731f764d49267a632ef6a27720ab5b39f0b294b961c;
package/lockfile hashes and normal index remain unchanged. Strict focused
TypeScript passed: fifteen roots and all dependencies, 1,943 source files,
zero diagnostics in 17.994 seconds, 904.7MiB peak under the 2GiB cap. No
incremental or emitted output. Exact user-1001 cgroup absent, MainPID zero,
unit inactive/dead and own common lock released. No deployment or browser
visual acceptance claimed. React review preserved the existing MUI design, direct imports,
derived row values, keyboard expansion and a shared no-fetch drawer.

### Owner-requested independent QA — Nov 2 ET, candidate aee811fc2e

Scope: PM Pullbacks selection, formulas, normalization/shared feed, old scanner
regressions, actual Admin toggle/save, private HTTP authorization, worker
singleton, request pacing, missing-data statuses, receipt clocks and theme-aware
scroll styles. No coordinator messages, preview starts, provider calls, live
data/settings writes, delivery, Git publication or deployment. Tests used the
existing isolated dependency archive, not another checkout. No runtime changes
were made during this QA.

Consolidated findings:

1. **Confirmed defect, medium:** `premarket-pullbacks.ts:41–45` freezes volume
   together with the final PM high. If the initial valid high has null PM
   volume, a subsequent valid same-high response with volume 12,000 leaves the
   card's PM volume null. New isolated regression reproduces expected 12,000,
   actual null. The correction should allow later valid PM volume to fill or
   update independently while keeping the final high frozen and avoiding a
   volume value associated with an inconsistent reference. No extra API calls
   are necessary. Correction is not implemented by this QA-only task.
2. **Existing integration limitation, not a new regression:** production
   `SnapshotSessionQualifier.observe` still declines premarket qualification.
   A synthetic 8 AM response with a valid pre_price/pre_high_price/pre_volume
   produces zero normalized snapshots and session_timestamp_unverified.
   Therefore this feature is not qualified for live 4–9:30 AM operation yet;
   the retained-PM-high path during regular/qualified post-market is separate.
   A real premarket evidence/qualification checkpoint remains required; the
   QA does not bypass or silently change the existing source gate.
3. **Acceptance unrun:** actual browser geometry, phone/dark-mode appearance,
   drawer focus restoration and live-market calibration remain unverified.
   DOM interaction tests and theme-style assertions do not establish these.

Execution: `scanner-pm-audit-20261102`, 18 suites / 198 tests: **197 passed,
one failed** (finding 1). Duration 19.757s under 1,536MiB/CPU1/swap0/120s.
All 17 other suites passed, including the actual Admin enable/save test,
shared snapshot/float/news reservation counts, 19 session qualification tests,
12 private HTTP authorization/settings tests and eight request-pacing tests.
No duplicate Moomoo calls were introduced by the new card; no notifications
or inferred holding/recovery/retest statuses are added. Exact original cgroup
absent, unit inactive/dead, MainPID zero and matching own common lock released.
Package and lockfile hashes remain unchanged; normal Git index remains empty.
This is **not a clean QA or release-ready claim**. Existing prior 125-test and
focused TypeScript receipts remain historical; they did not cover finding 1.
Help text was reviewed and remains aligned; QA-only evidence requires no guide
change until the correction changes behavior. Preserve the failure regression
and owner no-deployment hold for the next correction task.

### Delayed premarket volume correction and release request Nov 3 ET

Owner requested scanner deployment if ready, then explicitly requested sending
the unsent bug fix to the Coordinator. The earlier blanket no-deploy hold is
superseded by that conditional release instruction, not a claim that unrun
release/visual/live qualification checks passed.

Finding 1 is corrected: after freezing the final premarket high, later valid
same-high responses can fill or increase its premarket volume. Missing, reset
or inconsistent-high aggregates cannot erase or replace the accepted counter.
Zero remains a valid known value. The frozen high, ranking, thresholds, original
Gainer/Momentum filters, request cadence, authorization and notification state
are unchanged. No extra requests or fallback provider calls are introduced.
Help guide coverage remains correct; this restores the described volume field
rather than changing the user workflow.

Final relevant regression run: **200/200 tests across eighteen suites passed**,
including the previously failing regression, new missing/reset/conflicting-high
cases, actual Admin save and no-extra-request checks. Two-file ESLint passed.
The first tiny TypeScript root inventory omitted Node ambient declarations and
reported node:crypto unresolved; no source/dependency change was made for this
harness omission. The corrected focused check explicitly includes the existing
Node type prerequisite, retains every diagnostic and passes 251 source files
with zero diagnostics. Test/lint unit 26.091s and typecheck unit 3.028s finished;
exact groups absent, MainPIDs zero and matching common locks released.

Release source is candidate 7cf4ee4a78ded85464ec44780255c19720937514 plus only
three working-tree overlays: premarket-pullbacks.ts, its QA test, and this
record. Full feature delta starts at checkpoint
952596badbce2a178e3527bdf0732bccd1ecf12b; do not publish the mixed working
tree or copy its unrelated Help edits. Restore-spread cancellation remains
respected; existing owner-selected spread filters still apply.

Findings 2 and 3 remain separate: the existing premarket source qualifier has
not been qualified live, and actual browser visual/phone/focus checks are not
claimed. No Platform build, preview update, production change or notification
occurred during this correction. Coordinator handoff must retain these gates,
private-account scope and disabled scanner delivery; do not represent this
green code regression suite as complete hosted acceptance.

### Browser checkpoint and Coordinator preservation Nov 3

Coordinator preserved the three correction overlays as
e29bca77cf7c9e51c5857408105e83aa2b3dedc4 and integrated the complete allowlisted
feature as local candidate eda37c804ae3c0d3d8a18214754958ff42adf371.
This is integration evidence, not deployment evidence.

An isolated browser batch passed eight cases: four equal desktop cards, the
double-width PR area, PM keyboard expansion, each of the four full-view drawers
with Escape/focus restoration, thin overflow scrolling and mobile layout with
no horizontal page overflow. Zero page exceptions were recorded. The ninth
theme case failed because the probe assumed light mode while the fixture was
already dark; light/dark switching is therefore not yet accepted. Screenshots
remain at /tmp/scanner-card-browser-3rZDc2. Browser APIs used synthetic fixtures;
the 24 non-document feature source files matched the preserved correction.
This does not verify live market behavior or the final integrated build.

The first bounded preview attempt hit its compilation memory limit; one
larger bounded retry served the Admin page successfully. Local isolated health
returned 503 and is not claimed healthy. Both preview lifetimes have ended;
no live service, production data, provider request or notification was changed.
The outstanding real premarket qualification remains explicitly unrun.

### Consolidated remaining readiness checks Nov 3, 08:26 UTC

The previously unexplained local `/api/platform/health` 503 is classified:
`verifyPlatformHostedRuntimeReadiness` explicitly throws
`TRADERLINK_HOSTED_RUNTIME_PRODUCTION_REQUIRED` when NODE_ENV is not production.
It additionally requires Railway's exact /data volume layout. The isolated
worker-disabled runner intentionally uses development and a different local
data root. Thus this is the expected hosted-only readiness contract, not a
scanner or preview startup defect. Do not change the endpoint, set fake hosted
paths or weaken storage checks to get a local green response. The real Admin
route and local fixture data APIs returned 200. Hosted health remains the
Coordinator's separate production gate.

Completed theme acceptance with actual responsive visible switches and settled
layout. Intermediate probe failures were (1) two responsive switches matching
the same label and (2) measuring immediately during viewport transition. Both
are recorded harness defects, not hidden product fixes. Final bounded probe
passed both dark and light modes on desktop and 390px mobile, without page
exceptions. Dark row contrast was 16.59:1 (white on rgb(21,31,45)); light was
16.27:1 (rgb(23,32,51) on white). Four-card geometry, thin auto-overflow and
theme-specific scrollbar colors passed in both modes. Mobile document and
viewport widths both measured 390. Original fixture appearance was restored.
Screenshots in /tmp/scanner-card-browser-e9pa0A were visually inspected; the
existing analytics-choice banner is unrelated and was left intact. These
complete the previous eight browser cases; this remains synthetic UI evidence,
not a live market or final integrated production-build claim.

Added two contract regressions to premarket-pullbacks-qa.test.ts, exercising the
actual SnapshotSessionQualifier -> normalizeSnapshotBatch ->
PremarketPullbackBook path in regular and after-hours sessions. Both demonstrate
that the frozen PM high remains 10 while initially missing volume fills to
12,000 and the correct +42.857% return distance persists. The after-hours case
first rejects an unqualified observation, then qualifies only after advancing
session counters. All six tests in this file passed in 1.436s; the prior full
200-test pass is unchanged evidence, not a claimed repeated 202-test batch.
No runtime code or request cadence changed during this completion.

Readiness decision: the selected delayed-PM-volume correction works during
regular and already-qualified post-market sessions. The premarket rejection
does NOT block these paths. It is not necessary to widen the source contract
to release this correction. Full live premarket scanning, however, remains
unsupported by the existing qualifier; this is not newly caused by the repair.
Any premarket-enablement correction must independently validate the pre_price,
pre_volume/pre_turnover and timestamp/session relationship and preserve the
fail-closed gate. Do not copy regular/after-hours evidence, use HOD instead of
PM high or invent a live 4 AM receipt. Recommend releasing the selected verified
regular/post-market fix subject to Coordinator build/hosted checks, with the
premarket limitation explicitly retained rather than blocking unrelated repair.

All operations used fresh feature-owned common-lock admission, bounded user
units, the existing archive/dependencies, synthetic isolated data and no real
provider or delivery effects. Coach and Paid/Shared previews were untouched.
