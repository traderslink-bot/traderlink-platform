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
