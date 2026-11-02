# Private production screeners activation — 2026-11-02

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
