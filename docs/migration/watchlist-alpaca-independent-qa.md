# Watchlist Alpaca independent QA

## November 12 — separate new moves from delivery retry

Owner requested narrow mobile layout and retry-state fixes. The owner-only
category-move GET now reports the exact Free Chat receipt for the current move.
Explicit Free Chat retry rechecks current placement and updates only its
failed, nonexpired, non-cooling-down receipt. It never forwards a placement POST
or writes a new notification intent. Duplicate ordinary move requests no longer
reset failed Free Chat receipts. Discord/cleanup retries go directly to the
paired Runtime's retry-only path without requeueing Free Chat or member alerts.
No schema or owner-authorization changes.

Twelve focused in-memory Platform tests, targeted ESLint and changed-graph
TypeScript (1430 files, zero diagnostics) pass. Paired Runtime verified mobile
and desktop layouts and mock move/retry requests. No live effects from tests.
Deploy both slices through Coordinator, Runtime first; no Help change needed
for the restored workflow. Preserve unrelated AGENTS assignment overlay.

## November 10 — remove Day-trade impact

Remove only the catalyst's Day-trade impact subsection from detailed and simple
cards, premium previews and the analysis editor. Catalyst summary/status and risk
notes remain. Saved JSON fields, original history and owner edits are preserved;
no migration is required. New runtime requests omit the retired field and keep
an empty compatibility value when normalized. Both formats' stored cards use
the updated renderer without regenerating analyses. No existing image/post was
regenerated or sent. React review preserves existing composition, theme tokens,
hooks and access behavior; no SDK/provider/dependency migration was introduced.

The 17-test parser/card suite passes, including actual static markup for both
formats and premium/editor regression assertions. Focused changed-graph type
check and targeted ESLint results are recorded at the local checkpoint; lint has
zero errors and one existing unused-helper warning in live-watchlist-client.
No deployment or production data change has occurred for this slice.

## November 9 — Potential Path session-high reference

Owner reported that CKX's only resistance kept following its latest HOD. This
slice identifies a mapped intraday/session-high row matching the saved HOD as
"High of day / session reference", including the nearest-level heading and full
ladder. A short notice explains that a new high alone does not establish
resistance and that a retest's reaction matters. Independently mapped daily/4h
resistance is not relabelled; prices and level selection are not changed. The
notice and prices remain concealed under the existing levels access restriction.
Help now documents the HOD distinction, paired automatic price-discovery guard,
durable daily usage cap and review-control loading behavior.

Two focused Vitest files passed, nine tests including card markup, ladder,
historical-level preservation and premium concealment. No production build was
started. Full TypeScript initially exhausted Node's default 2 GiB heap; a bounded
4 GiB rerun completed with eight diagnostics in unchanged scanner test files
(foundation, scroll-styles, live-feed, runtime and snapshot-pacing). Two new card
fixture diagnostics were corrected by supplying its required source field.
Focused TypeScript over the changed card/helper/Help/tests and their imports
passed, as did targeted ESLint. The focused command uses the existing tsconfig
options and Next's global declarations; no config or dependency was changed.
Full-repository TypeScript is not claimed green. Paired Runtime evidence is in docs/watchlist-alpaca-status-qa.md in the
assigned runtime worktree. No live analyses/data/settings or posts were changed.
This is a local source correction, not a deployed or owner-accepted visual claim.

## November 9 follow-up corrections (supersedes old-trade display rule below)

Owner clarified that Not live means the feed is not connected, not that a halted
or thinly traded stock has an old last trade. Runtime now observes actual Alpaca
transport health from existing polls. Platform hides Not live when that feed is
live; when off, actual last-trade time remains unchanged and visible. Individual
quote freshness still controls fixed overnight reference replacement independently
of the note. Potential Path respects both facts. No extra provider requests.
Help updated to match. Fake disconnected/halted/expired/BOATS tests and real
manager tests remain distinct from live halt observation after release.

Owner also requested removing the embedded TradingView chart from ticker detail.
Removed its mount, widget script loader, responsive effects and unused symbol
mapping; no change to other detail cards, access controls or providers. No new
layout, chart replacement or scanner edits. Existing Help contains no TradingView
instructions requiring deletion. A regression prohibits reintroducing its mount
or external embedding script. Sixteen focused Platform tests pass. Component
browser checks pass at 1440/390px with actual row/CSS and synthetic healthy-feed
old trades, no misleading Not live, no overflow and preserved keyboard access;
not authenticated full-page E2E. Focused lint has no errors; one pre-existing
unused helper warning remains. Focused strict TypeScript passed across 1,936
transitive source files. Source-only changes, not yet deployed.

SMX history correction is separately committed in Runtime. Real replay of its
original failure cutoff now supplies 173 five-minute, 127 daily and 247 four-hour
bars through the actual manager; both outgoing formats capture them without any
OpenAI call. See paired Runtime docs/watchlist-alpaca-status-qa.md. This corrects
the missed downstream legacy EODHD loader, not the previously verified raw Alpaca
loader. Existing live analyses and notifications were not changed.

## Scope and source

Audit the owner's deployed Alpaca Watchlist, AI candle packet, price status and
indicators. Correct the requested live-price wording and remove the main list's
Price Time column. Do not generate analyses, publish, send notifications, change
provider settings, restart services or deploy during this work.

The active scanner successor confirmed no overlapping Watchlist edits. Its
scanner, screener, gateway, shared provider and unfinished chart work stay out
of scope. Coordinator assigned clean Platform and Runtime worktrees, preserving
all mixed checkouts. Platform base ffb309d4717f0de72959d65f3acac9201a455b07;
Runtime base 849b6d991de45fa596d90e3a031ae5e6f45c2aaf. Local commits are allowed;
release remains Coordinator-owned. No dependency, schema or provider changes.

## Independent deployed observations

Read-only Railway metadata confirms Platform b805245a-5acc-45ea-a72f-bc62b8f489b4
SUCCESS from main ffb309d4, and staging-named live Watchlist runtime
eaa89124-201c-4614-b188-b6d8ec3dbc0c SUCCESS. Platform's selected provider is Alpaca.
Runtime status is authenticated with existing credentials held only in process
memory; no credentials, private URLs or account identifiers are retained here.

* Runtime status: HTTP 200, startup ready, three active tickers. Overall market
  data status was offline and provider health was closed even while an actual
  accepted price was 573 milliseconds old. This is a reproducible status defect,
  not evidence of missing live prices.
* The deployed AI candle bridge returned HTTP 200 ready, provider alpaca and 31
  NWGL one-minute bars for November 6, 09:30–10:30 Eastern. All timestamps were
  ordered, unique, in range and in milliseconds; OHLCV values were valid.
* Direct configured gateway history for NWGL returned SIP, split adjustment and
  complete coverage: 741 five-minute, 263 fifteen-minute, 20 four-hour and four
  daily bars over the requested November 2–6 sample. This proves those actual
  history paths, not every symbol or minute of a thinly traded session.
* Actual runtime prices and source times were returned for PARA, TGE and NXXT.
  NXXT's price was from an older session while the other two updated overnight.
  The overall feed status must not imply every ticker has a fresh last trade.

## Consolidated findings and correction batch

1. Runtime status mapper omitted Alpaca, falling through to disconnected IBKR
   even when the selected Alpaca feed received prices. Add Alpaca to the existing
   non-IBKR health mapping; preserve startup, error and legacy-provider behavior.
2. Manager health and per-ticker restart readiness forced closed for all hours
   outside 04:00–20:00. Add a provider-aware overnight capability callback and
   explicit Eastern Sunday–Thursday evening/Monday–Friday morning window. Keep
   the existing two-minute actual trade freshness requirement. Selection alone
   never implies live, and stale/waiting/weekend states remain distinct.
3. Member UI claimed a fixed 15-second delay and Not live based only on the
   incorrect global status. Remove the fixed-delay claim. Fresh timestamped
   prices in a live feed have no stale warning. Old individual ticker prices
   still show Not live with the actual market-data time, not publication time.
4. Remove the separate Price Time field on desktop/mobile. Keep the time in the
   not-live price note when needed; align the remaining mobile price/Added row.
5. Help now explains live-price status and that indicators do not calculate an
   overnight session merely because the price updates overnight.
6. A retained one-time overnight reference pinned Potential Path's price and
   level distances until premarket. Release it when the selected overnight feed
   supplies a genuinely newer, fresh trade, and reject a late reference lookup
   that races with such a trade. Legacy day-session release behavior stays intact.
7. Preserve BOATS' actual initial trade timestamp as optional observedAt through
   both reference normalizers. Older saved references remain valid without one.
   The fixed-reference fallback can now display its real quote time; checkedAt
   is never substituted. Potential Path also honors a confirmed fresh live
   price while an older reference is still present.

## AI packet parity

The migration does not change any src/lib/ai source files between the prior
timestamp-repair revision 127edddf and the deployed 849b6d99 runtime. Both analysis
formats retain the same context pipeline: current/last completed session 1m,
completed 5m aggregation, preceding completed-session 5m, daily history, 4h
history, dated prior regular close, level output and cutoff. The bridge keeps
seconds at the MarketDataRequest boundary and milliseconds in Runtime candles.
Alpaca identity is explicitly accepted and reported; strict Moomoo mismatches
remain rejected. No news, research or trader-note input path was changed by
this provider delta. This is source/contract parity, not identical candle values
between vendors or a claim that a newly generated model response was tested.

The existing exact-parent verifier independently passed 56 assertions for
source identity, actual manager context, completed aggregation and strict
mismatch/error guards. It uses fixture responses, not a new OpenAI request.
An additional actual-service regression captures the outgoing request body with
a fake transport for both simple and detailed formats, using identical
synthetic OHLCV under Moomoo and Alpaca identities. Both retain nonempty 1m, 5m,
daily and 4h candle groups with identical evidence and a research context. The
test passes without obtaining a model response or touching saved analyses.

An existing saved analysis generated before the cutover is not retroactively
an Alpaca analysis. A fresh post-cutover full recorded request has not yet been
inspected; no live generation was requested to manufacture one.
The bounded runtime SSH diagnostics probe failed, so no full saved post-cutover
request is represented as having been read. Runtime audit GET was available;
its latest TGE events were preflight skips, not evidence of a new model request.

## Indicator and overnight limitations

Indicators select Alpaca alone and keep split-adjusted provider identity and
activation isolation. The adapter does not require a connected Moomoo account.
Their session normalizer and refresh service intentionally stop at 20:00 and
resume at 04:00, using the last completed session while closed. Current history
requests specify SIP, not BOATS. Keep this honest: overnight price updates are
not overnight EMA/RSI/ATR/volume/VWAP updates.

Read-only inspection of the deployed indicator audit confirmed successful
Alpaca calculation publication for PARA and TGE across 1m/5m/15m/daily, followed
by session_closed records overnight. Data-through times stayed at the last
completed session. The 1m coverage recorded 216 missing minutes for PARA and
808 for TGE; those counts do not distinguish missing provider data from no
trades. This explains why the strict VWAP coverage check can remain unavailable.
No forced refresh or audit write was performed by this inspection.

Potential follow-ups, not silently implemented:

* The indicator adapter drops Alpaca's per-bar VWAP, and the current VWAP engine
  uses typical price times volume. Session VWAP also requires every minute or
  explicit no-trade evidence; missing intervals on thin stocks can leave it
  unavailable. Use real feed-specific trade/bar coverage before changing this.
* Live regular-hours prices reuse the shared SIP WebSocket cache through a
  five-second gateway poll. Overnight currently polls BOATS latest trades per
  ticker; it is not yet a BOATS WebSocket consumer. Avoid describing all paths
  as unlimited socket delivery. Consider shared BOATS streaming separately with
  the gateway owner, without adding a second conflicting provider connection.
* Indicator HTTP history reuses coalescing and bounded request concurrency, but
  Alpaca correctly bypasses Moomoo-only admission and cooldown. Its 15-second
  transport deadline is shorter than the gateway's historical pagination budget;
  audit cold history loads before independently tuning that deadline.
* Native Alpaca 4h/daily aggregation and split adjustment may differ from prior
  vendor candles. Preserve source labels and test anchor/session comparisons
  before changing levels or model prompting.

Alpaca documents distinct SIP and BOATS feeds, and overnight history limitations:
[overnight feeds](https://docs.alpaca.markets/us/docs/245-trading-for-trading-api),
[historical bars](https://docs.alpaca.markets/us/reference/stockbars),
[stock WebSockets](https://docs.alpaca.markets/us/v1.1/docs/real-time-stock-pricing-data).

## Verification status

Initial independent offline discovery passed 21 tests across five provider,
route and indicator engine files; 56 AI-provenance assertions; 84 indicator
refresh assertions; and 24 audit persistence assertions. Isolated synthetic
data only. Initial systemd launch lacked Node in its inherited PATH and never
ran tests; the explicit-PATH retry passed. All exact units ended and the matching
feature resource lock was released. No other preview was touched.

Correction tests before the final metadata batch: ten runtime tests (including
actual manager health/restart rows and both outgoing AI formats) and 31 Platform
tests pass. The metadata batch additionally passed six targeted component and
overnight-adapter tests. Full Runtime TypeScript passes; focused
Platform TypeScript covers 1,940 source files with zero diagnostics. Its first
harness omitted generated next-env.d.ts in the clean source worktree; using
Next's actual installed ambient declarations resolves CSS-module typing without
adding a fake source declaration or suppressing diagnostics.

The actual extracted Watchlist row and price-status components, real CSS and
synthetic data pass browser checks at 1,440 and 390 pixels: four fields, no
separate Price Time field, no fixed-delay claim, no stale warning on fresh
prices, a dated warning on an old price, keyboard focus and premium-ticker
concealment. Mobile Price and Added share a row, and neither viewport overflows.
Screenshots /tmp/watchlist-alpaca-price-ui-96bYlS were inspected. This uses a stub
for Next Link and decorative badges, not a full authenticated app browser test.

Source edits are not live changes. Hosted acceptance and release authorization
remain separate from these local checks.

## Final correction verification

The final metadata-inclusive batch passes **35 Platform tests in eight files**
and **11 Runtime tests in four files**. Full Runtime TypeScript passes. Focused
Platform TypeScript covers 1,942 files with zero diagnostics, using the installed
Next ambient declarations. Exact changed-file lint has zero errors and one
pre-existing unused-helper warning in the large Watchlist client. Initial lint
found a test-harness variable named module; it was renamed without changing the
rendered component. No diagnostics were suppressed.

Both reference-contract implementations are byte-identical, including optional
actual BOATS observedAt and backward compatibility. Existing unknown trade times
are not repaired by inventing one. The source batch adds no market-data requests,
provider/subscription changes, generation limits, approval restrictions or
notifications. Help was updated with status and overnight indicator semantics.

Release integration should include the paired Runtime correction before the
Platform presentation correction so the health publisher can supply truthful
Alpaca status. No schema migration is needed. Scanner/gateway/shared-chart
sources remain untouched. A complete authenticated browser session on the
deployed corrected release remains a hosted acceptance check; component browser
fixtures and read-only live provider probes do not substitute for it.


## November 10 — Admin connection failure handling (local only)
## November 10 — Admin connection failure handling (released)

Final integration Platform9e7db6c1ba36e8a174132b7d221019b20d2ef8f2 onto exact
2aba52e3 parent, configured main; deploymentcf96a9ee-01ec-49dd-9a00-010e78e14bbe
SUCCESS/sole RUNNING. Paired Runtime0c292650 onto07ffc5dd, deployment
abf1ec8d-cf3b-4c8b-9b4e-4ffd5ce86cd5 SUCCESS/sole RUNNING. Coordinator reports
canonical build/TypeScript/284pages passed, working relay and provider settings
preserved. Independent final read-only checks from NEW Platform configuration:
root200/305648B with new reader and retained-review notice; old misleading session
warning absent; watchlist200/5825B and healthz200/38B valid JSON; public Platform
health200. No mutations, fabricated owner access or delivery. Exact Runtime parent
CI comparison found zero new failure titles, not full CI green. Historical local
qualification below describes the pre-release boundary, now superseded above.

Owner requested continuing the repair after the live connection recovered.
Non-JSON failed Runtime API responses now become safe JSON retaining the upstream
status, without retrying requests or changing owner authorization. Structured
API errors and successful payloads are unchanged. A failed initial embedded
console load now shows a readable explanation and explicit reload link rather
than raw rate-limited text. No automatic reload, mutation replay, credential
change, data edit or delivery was added. Runtime's paired correction preserves
same-cycle review controls on transient errors and avoids blind JSON parsing.

Five isolated transport tests pass (429/502, structured errors/success, console
fallback, healthy rewriting and unconfigured connection); focused changed-graph
TypeScript including installed Next global declarations reports zero diagnostics;
targeted ESLint and diff checks pass. Runtime has three new focused regressions,
an existing embedded-script syntax check,
seven existing panel checks, full TypeScript and isolated Chromium recovery
coverage. Four unrelated old row-test failures were reproduced against unchanged
HEAD using in-memory git-show sources and remain separate test debt. No production
build/release or signed-in production editing acceptance is claimed. Existing
Help reviewed; existing workflow is unchanged, so no guide change is needed.
Preserve the AGENTS assignment overlay. This slice is not deployed and is separate
from the queued catalyst Day-trade-impact removal. Coordinator was not contacted
for coding/testing; ordinary integration/release remains its responsibility.

## November 10 — remove Day-trade impact

Remove only the catalyst's Day-trade impact subsection from detailed and simple
cards, premium previews and the analysis editor. Catalyst summary/status and risk
notes remain. Saved JSON fields, original history and owner edits are preserved;
no migration is required. New runtime requests omit the retired field and keep
an empty compatibility value when normalized. Both formats' stored cards use
the updated renderer without regenerating analyses. No existing image/post was
regenerated or sent. React review preserves existing composition, theme tokens,
hooks and access behavior; no SDK/provider/dependency migration was introduced.

The 17-test parser/card suite passes, including actual static markup for both
formats and premium/editor regression assertions. Focused changed-graph type
check and targeted ESLint results are recorded at the local checkpoint; lint has
zero errors and one existing unused-helper warning in live-watchlist-client.
No deployment or production data change has occurred for this slice.
## November 18 — provider rollback evidence and shared connection boundary

The immediate pre-cutover configuration is recorded in Coordinator evidence
`operations/alpaca-runtime-settings-switch-20261107.json`, `before`:
EODHD historical, EODHD live, Moomoo same-day. This is recorded configuration,
not a reconstruction from today's environment. Runtime AI historical loading
uses the selected historical provider; the Stock Levels historical fallback
was constructed as Alpaca or EODHD at startup and must also change with the
profile. Existing separate provider POSTs cannot implement an atomic profile.

Shared Moomoo access now selects the first active quote-authorized connection
in the configured owner-subject order. Both authorized owner accounts being
connected no longer creates an artificial cardinality failure. The existing
indicator callback signature and hashed admission scope are preserved.
`readSharedMoomooConnectionStatus` checks local authorization without acquiring
or refreshing a token. Same-day candle access uses the same selector and
revalidates the connection after token refresh. No credentials are exported.

Verification: 24 injected-repository assertions exercise deterministic selection,
first-owner unavailable, no authorized connection, local readiness without
acquiring a token, revoked scope after refresh, and cleanup on failure. No live
settings, provider requests, analyses, notifications, preview, or deployment
were changed. This is a shared-access dependency; the complete provider toggle
and transactional Runtime profile are not yet qualified by this checkpoint.

### Paired profile facade and consumers — source checkpoint

`watchlist-market-data-profile.ts` exports `readWatchlistMarketDataProfile(env)`
and `changeWatchlistMarketDataProfile(profile, expectedRevision, env)` for the
Scanner lane's common admin row. The authenticated Runtime is the durable
three-role authority. Platform acknowledges only a read-back verified pair;
provider `moomoo` in its Watchlist selector means the verified previous profile,
not Moomoo live prices. Lost POST acknowledgments trigger GET, not a repeated
mutation. An interrupted local save remains visibly unsynchronized; GET never
repairs it by mutation. An explicit same-profile Apply completes the pair.
Custom Runtime combinations return profile null, not an inferred preset.
Before switching to previous, local shared Moomoo authorization must be ready.

Indicator workers and the same-day candle relay now read the per-feature
Watchlist selection. Provider/revision changes retire the old in-memory series,
reject obsolete refresh results, stop obsolete queued transports and prevent
new setup calculations consuming obsolete provider results. The single
existing scheduler/shared feed is reused; no additional worker is installed.
Alpaca uses only Alpaca; previous retains the existing Moomoo/Yahoo indicator
behavior. Same-day relay responses preserve actual source labeling and reject
a changed selection during the request. Both Moomoo candle and indicator HTTP
paths require the existing shared transport queue with the explicit effective
environment, avoiding a disabled-queue direct-request bypass. Stored analyses
and approval settings are not rewritten.

Checks: facade recovery/concurrency/validation scenarios pass; shared connection
26 assertions pass; recorded-candle shared-feed 37 assertions pass including
Alpaca/previous switching, same-provider revision invalidation, zero requests
on member reads, no extra OAuth under Alpaca and return to the shared Moomoo
source. Focused Platform TypeScript passes against the Scanner lane's actual
`provider-settings.ts` dependency using a temporary paths override; that shared
module remains owned by the Scanner lane and is not copied into this commit.
An initial whole-worktree TypeScript attempt exceeded the default 2GB heap;
that attempt is not a pass. Combined-current-source full checks belong to the
integration checkpoint. No hosted or notification effects occurred.

Focused commands: `node --experimental-vm-modules
src/scripts/verify-watchlist-provider-profiles.mjs` and the corresponding
`verify-watchlist-indicator-connection.mjs`; recorded feed uses
`WATCHLIST_RECORDED_CANDLES_PATH=<existing recorded fixture> node
--experimental-transform-types --experimental-vm-modules
src/scripts/verify-watchlist-setup-feed-runtime.mjs`.

The profile response also reports `persisted:false` if effective Runtime roles
and the saved role configuration diverge after a failed rollback. The facade
then reports unsynchronized and refuses a complete-pair acknowledgment. An
explicit same-profile Apply repairs durable configuration before acknowledgment.
The isolated facade test covers this persisted/effective mismatch.

### November 17 Eastern — after-close combined release handoff

The owner authorized coordinating today's ready Watchlist work and the combined
provider-switch source in one serialized after-close release window, never before
8:00 PM Eastern. Sent the migration-specific handoff directly to active VPS New
coordinator `01a19f74-8e08-7742-8646-ba1c46ce9e58`. Preserve the separately armed
Home 10 p.m.–2 a.m. Eastern window and its prerequisite order; this handoff does
not advance that timer, activate Moomoo, or authorize concurrent writers.

Provider switch `45beacbe439c84300d08eb2c1dcd2b98ed930059` plus paired Runtime
`68e2e0f0f7dc624aa7c272b59b37299fcd7730ca` has no database migration. Alpaca stays
selected. The only pending migration-bearing Watchlist feature identified here
is the Free Chat composer: `platform/0213_watchlist_free_chat_owner_copy`, adding
one nullable `owner_copy_json TEXT` receipt column. The Coordinator's reconciled
reservation is execution order 270 after Home 269; do not reuse the old donor's
268 metadata. Its exact 10-Platform/2-Runtime allowlist and qualification remain
in `operations/watchlist-composer-post-home-preparation-20261117.json` in the
coordination workspace. Conditional donor sources are Platform
`c9b2c5535183eb721a5b18cdd24ba1937cfe4f5f` and Runtime
`5a3ef89cd4f8ee70a9aa9d90857f41aac843506d`. That donor's Runtime row-review source
is byte-identical to the paired Runtime 68e2e0f; retain the newer paired Runtime
manager/provider changes and live owner-edit repair during integration.

Historical qualification includes 21 Platform tests, 15 Runtime move tests,
Runtime types, actual disposable predecessor backup/restore and migration,
preserved sent/uncertain legacy receipts, foreign keys and quick check. Before
release the Coordinator must refresh actual source/ledger, all reservations,
service/volume identity and exact main parent; qualify final/recovery images
and actual backup/restore for that combined predecessor. Historical row counts
are not current hosted verification. This chat performed no hosted operation,
settings change, migration, provider switch or notification send during handoff.

The owner subsequently authorized safely independent migration-free releases
now, while retaining migration-bearing Composer for after 8 p.m. Eastern.
Sent the Coordinator the narrow Runtime separation proof: the seven provider
code paths at pre-slice `e832928^` are byte-identical to recorded live source
`5c726c4b11369759ca3127594eb8fdc734cb6315`; extract only those seven final paths
from 68e2e0f onto the refreshed actual live parent. Do not integrate the full
donor ancestry or its 137-line-different `manual-watchlist-row-review.ts`
Composer change. The owner-edit helper matches the recorded live repair.
Coordinator must still qualify the extracted/current-schema candidate and
refresh actual hosted source. No hosted action was taken by this chat.


## November 18 — per-ticker complete row hiding (implementation)

Owner requests an independent checkbox to hide the whole main Watchlist row
from members without paid ticker access, preserving the existing masked-ticker
placeholder and Premium controls. Planned control: Hide row from members without
paid access, in the existing access-control group. Default off. The server list
and per-viewer live stream omit selected rows for ineligible members; owner and
eligible paid/selected-plan access are retained. Changing this option does not
change ticker-detail, analysis, levels, publication, generation or notification
settings. Unchecking restores the existing row/placeholder policy.

Store the setting and append-only changes in an additive dedicated visibility
table/audit migration; Coordinator allocation requested before migration source
is finalized. No production writes, notifications or deployment are authorized
by this implementation task. Validate all 16 combinations of the old three
Premium controls and this new control; free/Premium/owner/selected-plan roles;
list/SSE omission; save/restore/failure; authorization/CSRF and audit rollback.
Help plan-access copy will be aligned. Existing Composer migration/work remains
separate.


Row-hiding qualification: 51 focused tests pass across row visibility, existing
owner authorization and migration-file contracts. Changed-graph strict TypeScript
passes (8 roots, 911 files). Targeted ESLint passes. Isolated Chromium exercises
the actual injected control with the existing Runtime access-control CSS at
320x844, 390x844, 844x390 and 1280x800 in light and dark appearances: all eight
contexts pass saving, restoring the saved value after a failed request, reopening,
keyboard focus and no overlapping/overflowing controls. This is isolated-control
QA, not an integrated owner browser acceptance or hosted save. One browser-harness
assertion initially expected an unchecked state even after an intentionally failed
save; the harness now clicks and asserts the required rollback. No product
behavior was changed to satisfy that mistaken harness expectation.

Fresh GitHub main readback confirms the five existing core preimages (access API,
access policy, ticker projection, injected control and Watchlist event transport)
match this assigned branch. No scanner/provider source is touched. Hidden quote
updates are omitted entirely from a free viewer's stream rather than producing
placeholder events that would repeatedly refresh their page. The existing visible
page's 15-second list refresh applies changed row access. This option affects the
main list only; detail, archive, analysis, levels and notification rules remain
under their existing separate controls. The Help plan-access guide is updated.

Migration candidate is currently `0214_watchlist_row_visibility` / order 271,
subject to final allocation by active Primary Coordinator
`01a1ec9c-a655-7f01-aa7a-1024fa236e13`. The former production sub-lane is closed.
Fresh main already contains `0214_platform_home_page_preference`; no inference of
a reserved number or release slot is made from this donor. The existing held
Composer migration remains untouched, including its historical donor numbering;
only the new migration's manifest additions belong to this feature handoff.
No live rows, saved analyses, notifications, provider settings or deployments
were changed. Integrated full CI/build and owner visual acceptance are release
checks, not claimed here.


## November 18 — remove Top Regular label

Removed only the Manually Curated eyebrow above Top Regular Hour Watches.
The section title, counts, ticker rows and controls remain unchanged. Static
source verification and targeted ESLint were used for this copy-only removal;
no new behavioral tests or build are needed. No Help change is required because
the feature and workflow are unchanged. This separate slice needs no migration
and does not depend on the pending paid-only row visibility feature. Not deployed.


## November 18 — identify move notifications as moves

Changed generated category-move push/email headings from added to moved. Free
Chat's optional move share carries the confirmed move destination into its
preview and payload, with masked ticker text retained when Premium-only. Normal
new-listing and analysis-update copy remains independent. Saved owner text,
links, tags, attachments and existing approval/delivery/retry rules are preserved.
No already-sent post or frozen approved Discord receipt is rewritten. Paired
Runtime changes its shared category-move heading and supplies the selected
destination to the Free Chat confirmation preview. No migration is required.

Focused isolated tests: 27 Platform notification/Free Chat cases and 23 Runtime
heading/move cases pass, with no real notifications or hosted writes. Tests
cover all six public destination types and all eight Premium combinations for
Free Chat, including unchanged image/privacy behavior. Help channel guidance
is aligned. Changed-graph TypeScript passes (4 roots, 867 files, including the existing
Twitter ambient declaration); targeted ESLint passes. Coordinator integration
and full CI remain release checks; this source change is not a deployment.


## November 18 — owner-scheduled deployment handoff

Owner requested a reminder at 8:15 PM America/Toronto on November 18 to send
all completed remaining Watchlist work to the active coordinator for deployment.
Installed and verified the one-time unprivileged user timer
`traderlink-watchlist-release-reminder-20261118.timer`: November 19 01:15 UTC
(November 18 20:15 Eastern). It queues the reminder into this same thread and
requests resumption through the existing running Codex daemon. Timer is active;
its service has not run early. No hosted or application service was changed.
The saved prompt includes exact source checkpoints, all four pending features,
paired-service release responsibility and migration-ledger reconciliation.

Coordinator subsequently confirmed current main1806d747/schema182; Home0214
order269 is live, Composer0213/order270 is held, and combined staging already
contains Stats0215/order290, Premium0216/order291, Stats0217/order292. The row
visibility migration remains provisional and unallocated; do not rename it into
any of those reserved identities. One coordinated release remains possible,
subject to the coordinator's exact predecessor/order/recovery verification.


## November 18 — shorten main Watchlist description

Owner supplied the replacement sentence exactly: The watchlist uses a
combination of code, algorithms, AI and human analysis. Removed only the
following market-data/history sentence and retained the paragraph's existing
italic styling. Static exact-text/markup verification and targeted lint apply;
no behavior, migration or Help workflow change. Include this copy-only slice
with the scheduled 8:15 PM Eastern deployment handoff. Not deployed.


## November 18 — final row-visibility migration allocation

Active Primary Coordinator allocated `platform/0218_watchlist_row_visibility`,
execution order 293. This supersedes the provisional local0214/order271 records
above. Updated only its filename, literal identity/order, manifest references
and focused test references. The SQL statements and product behavior are byte
unchanged. Canonical Home0214/order269, held Composer0213/order270 and the shared
combined sequence through0217/order292 remain unchanged. Do not import the donor
manifest wholesale or infer hosted migration authorization from this allocation.
The coordinator must qualify the actual predecessor and full schema/catalog for
the selected release; this task applies nothing to combined205 staging or live.

Metadata correction qualification: 30 row-visibility and migration-file contract
cases pass; targeted ESLint and diff whitespace checks pass. Exact source
comparison after substituting only migration identity/order confirms no SQL
change. Earlier access/API/browser/type evidence remains applicable because no
product or SQL behavior changed. No build, provider request, migration, hosted
write, notification or deployment was performed for this metadata-only slice.


## November 18 — consolidated QA of all pending Watchlist work (discovery)

Owner requested QA of the complete remaining batch before tonight's handoff.
Inventory: held Free Chat composer/listing-only share; retained custom Discord
move draft; full row hiding with final0218/order293; moved wording across
Discord, push/email and optional Free Chat; removal of Manually Curated; exact
short italic paragraph. Source at discovery: Platform884f21a2c, Runtime70a9bca.
No product correction is included in this discovery pass. Preserve owner edits
and approval rules; no real provider/generation/delivery or hosted data writes.

Run current contract/role/move suites and isolated Chromium against actual
embedded scripts, actual Free Chat admin/store functions and synthetic SQLite.
Exercise normal, cancelled, unpublished/listing-only, pending/sent, failed and
lost-acknowledgement cases; all Premium combinations; defaults, save/reopen and
access failures; direct versus move shares; and both text removals. Both additive
migrations get isolated legacy-data and restore checks. This fixture validates
feature contracts and UI, not the coordinator's then-current integrated205
predecessor or final production build. Record one consolidated findings ledger
before any product fix. Temporary helper/evidence home: exact directory
`/tmp/watchlist-pending-qa-20261118`, synthetic-only SQLite/source-reading probes,
no credentials; retain until the QA ledger/release purpose ends, then review
exact-path cleanup. No repository/source tree or dependencies are copied.


### Consolidated discovery ledger — complete before product corrections

120 focused cases pass: access/owner/migration-file51, notification/Free Chat27,
Runtime row/move/heading32, and current-donor migration framework/backup10. Both
changed dependency graphs pass TypeScript (911 and867 files). Chromium normal
composer cases pass at320,390,844 and1280 widths in both themes, including
listing-only shares, single-dialog receipt progression, reopen, focus and size.
Cancellation, failed-before-commit preservation and masked move preview pass.
Existing row-control eight-context and custom-move Close/Escape/destination
checks pass. Exact copy/markup assertions pass for both text removals.

Synthetic predecessor fixtures preserve sent, uncertain, pending and retry
receipts, automatic preference and existing access flags through both additive
SQL migrations; new copy values are null and visibility tables empty. SQLite
quick_check and foreign_key_check pass; backup restoration returns the original
schema and four original receipts. This does not qualify canonical combined205.

| ID | Severity | Reproduced behavior | Correction needed |
| --- | --- | --- | --- |
| QA-1 | Medium | A Free Chat send commits but its response is lost. An edited retry leaves the first immutable queued copy intact (correct), while the dialog previews the second unsaved copy as queued. | Reconcile the actual receipt and saved copy; never retry delivery automatically or overwrite the first queued message. |
| QA-2 | High | An access setting commits but its response is lost. Hide can remain checked/cached while the saved row is actually public. The shared handler covers existing Premium controls too. | Read back saved policy; if it cannot be checked, show an unknown state instead of a contradictory confirmed checkbox. |
| QA-3 | Medium | Automatic Free Chat sharing commits On but its response is lost; the dialog restores Off. No actual post was sent by the probe. | Read back the preference and show uncertainty if that read also fails. |

Evidence: `browser-discovery-output.log` and `automatic-ack-output.log` under
the recorded synthetic QA directory. Actual embedded scripts, actual admin/store
functions and SQLite produce these findings; they are not conjectured failures.
Keep these discovery artifacts unchanged during the coherent correction batch.
Primary Coordinator confirmed these are technical correctness defects within
the existing approved behavior and requested narrow repairs before handoff.

Inventory correction: exact live Runtime08/c2db source already contains
pendingMoveText/saveMoveText and the await-save-before-move call. The35ab
ancestry alone was misleading; edited move preservation is a regression check,
not an additional unshipped fix. Pending source differences are the composer
and move-destination preview context. Do not reintroduce35ab wholesale.


Additional concrete finding from final larger-list validation (QA-4, Medium):
the four independent access controls issued80 initial GETs for20 tickers; the
actual protected API accepted60 and denied20 because each GET repeated owner
authorization and the shared120-access window was exhausted. A synthetic
Vitest probe used the real owner-authority/rate-limit code and SQLite adapters;
no hosted request was made. Its source is preserved as
`access-budget-before.test.ts` in the recorded QA directory, with observed
counts80/60/20. Fix by loading all four flags together once per ticker and
authorizing that read once; retain the existing limiter, owner checks and
individual mutation semantics. No bulk public endpoint or relaxed limit.


### Consolidated correction and final retest — November 18

All four recorded findings are corrected in one coherent source batch:

- QA-1: the Free Chat dialog reconciles a lost send acknowledgement with GET
  only, and displays the immutable saved message belonging to the exact cycle
  and approval revision. Manual status recovery also adopts that message;
  closing the dialog cannot be undone by a late response. No automatic POST
  retry, duplicate delivery or new approval gate was added.
- QA-2: access controls read back the actual saved setting after a failed
  acknowledgement. If readback fails too, an accessible mixed checkbox and
  explicit unknown message replace the misleading confirmed value. The next
  explicit owner choice and reopening remain available.
- QA-3: automatic Free Chat sharing reads back its saved preference, including
  same-cycle validation, and shows an unknown state if unavailable. Recovery
  neither posts nor changes the preference automatically.
- QA-4: one owner-only combined initial read supplies all four access flags
  per ticker. The GET authorizes once and retains the existing owner evidence,
  audit and rate limiter. Scalar GET and individual POST contracts remain
  compatible; mutations invalidate the initial-read cache. Real-authority
  synthetic tests for both approved owners accept all20 reads for20 tickers
  with20 authorization records. Free members cannot use the combined read.

Final focused verification:133 passing cases total (Platform access, owner and
migration-file56; Platform notification/Free Chat27; Runtime recovery, row,
move and heading40; existing donor migration framework/backup10). The final
checkbox accessibility adjustment was additionally rechecked with29 row tests
and targeted ESLint, both passing. Runtime full TypeScript and the Platform
changed dependency graph pass (9 roots,912 checked files). No full application
build or integrated canonical CI was run in this feature QA.

Actual embedded-script Chromium retest:18 workflow scenarios pass, no findings,
including synthetic real-SQL admin handlers, listing-only sharing, unchanged
receipt identity, cancel, explicit retry, lost acknowledgements, unknown/reopen,
manual delivery recovery, late committed response after closing, and masked
move preview. Eight additional width/theme cases (320,390,844,1280; light/dark)
pass saved-state recovery, keyboard focus, mixed-state accessibility and no
control overlap/horizontal overflow. Retained custom move text survives Close,
Escape and reopening and remains destination-specific. Source assertions pass
for the short italic paragraph and removed Manually Curated copy.

Final synthetic evidence remains under the previously recorded directory:
`final-browser-complete.log`, `final-controls-unknown-layout-fixed.log`,
`final-types-complete.log`, `final-runtime-types.log`, `final-row-unit.log`,
`final-lint.log`, and `batch-4.log`. The first mixed-layout attempt timed out
because its fixture accidentally allowed the second POST to succeed; the fixed
fixture deliberately fails both write acknowledgement and readback. It then
passes all eight cases; no product change was needed for that fixture repair.
Preserve the original discovery logs separately. Synthetic migration/restore
checks described above pass, but do not qualify the canonical205 predecessor.

No live data, analysis, provider, Discord, email, push, service, dependency or
migration was changed. No deployment or push. New source corrections add no
migration beyond held Composer0213/order270 and row0218/order293. Coordinator
must retain canonical Home0214/order269 and the current combined catalog,
qualify the exact predecessor, run integrated release checks and verify hosted
behavior after authorized deployment. Rollback qualification must account for
old readers ignoring owner_copy_json and the new row-visibility tables; an old
binary is not automatically privacy-equivalent after those settings are used.
The existing20:15 America/Toronto handoff timer remains the release checkpoint.


## November 18 — optional Added date for concealed tickers

Owner requested a per-ticker setting beside the existing Premium controls to
show Added when a ticker is hidden. Implement independent default-off
Show Added date for hidden ticker. An otherwise omitted row can show an opaque
Premium placeholder plus actual firstPostedAt and Access Premium; masked ticker
rows use the same display. Never include the ticker, company, price, detailed
URL or analysis data. Private-list entries remain omitted. Eligible members
and owner retain their ordinary rows; date choice never changes access rights,
publication facts, notifications or provider work. Turning the date choice off
restores previous mask/complete-hide behavior. Unknown/absent publication time
must not be replaced by activation, last price, update or deployment time.

Coordinator allocated independent0219_watchlist_masked_added_date/order294.
Existing settings lack a safe generic independent store, so use dedicated
setting/audit tables rather than overloading Premium flags or mutating0218.
No existing migration SQL changes. Preserve Composer0213 canonical270 (donor
268 is historical), Home0214/269, row0218/293 and the combined catalog. Release
integration/predecessor verification remains Coordinator-owned. Extend actual
SQL/role/API/UI tests across32 combinations and confirm no accidental ticker
leakage in HTTP or SSE, default/reopen/recovery, mobile/desktop and both themes.
Synthetic temporary helper/receipt home for this slice:
`/tmp/watchlist-added-date-qa-20261118`; no provider or live delivery effects.


Added-date slice final QA:89 focused SQL/role/API/control/migration tests pass,
including all32 independent flag combinations, real handler save/reopen,
rollback on failed audit write, absent-schema/default-off, explicit false and
invalid-time handling, selected-plan eligibility, owner/Premium unchanged rows,
Private omissions and matching date-only SSE projection. Five admin checkboxes
still share one initial GET per ticker. New checkbox is last in the existing
compact access-control group, without another card or toolbar.

Actual masked-row JSX and existing publication formatter plus actual global and
compact CSS pass16 Chromium cases (date on/off, four widths, both themes), with
no clipping, overlaps or identity-bearing links. Added aligns with the Added
column on desktop; mobile places the date beside Access Premium under the
masked title. Actual five-control browser fixture passes8 contexts, including
unknown mixed state, save recovery/reopen/focus. No external network allowed.

Changed server/test dependency graph passes TypeScript:10 roots,913 files.
Broader UI dependency checking is NOT green in this donor: its existing candle
bridge imports the missing market-data/server/provider-settings module (already
absent at parent1facad9d7). Initial helper also lacked generated next-env.d.ts;
using installed Next global declarations removes those CSS diagnostics, leaving
only the existing missing provider module. Do not stub it or transplant provider
source into this feature. Coordinator must typecheck/build the exact integrated
current provider source. Targeted ESLint has no errors and one unchanged
cleanLevelMapCardBody unused warning in the existing large client file. No
application build or hosted acceptance is claimed. Final evidence is under the
previously recorded added-date directory. No live writes, notifications or
service changes, and no new Runtime source changes for this slice.


## November 18 — Trader Notes alerts and bottom-row placement (owner approved)

Owner approved independent optional notes notifications and moving Trader Notes
beside Risk Notes. Publish notes gets Notify users about updated notes, default
off. Draft saves remain silent. Owners leave it off when a move, analysis or
other normal alert will cover the update; no speculative automatic suppression
or additional approval gate. Notes-only alert is text/link only, titled TICKER
Trader notes updated by "This Guy", using current category Discord and existing
Watchlist email/push opt-ins. No automatic Free Chat or X share. Empty notes do
not produce an alert. Notification failures never undo saved/published notes.

Use a distinct durable operation ID and independent outbox, not analysis draft
or approval revisions. Retry preserves identity/text, requires website receipt,
rechecks activation/category, published-note hash, recipient eligibility and
preferences, and never retries uncertain Discord sends blindly. Respect current
mention settings and category webhooks; include notes receipts in ticker/move
post deletion. Retain original analysis/posted time/price and existing move or
analysis notification behavior. Private notes remain drafts and never alert.

Both analysis formats move notes from top-right to bottom-right below Risk
Notes. Desktop notes widen the right column modestly (60/40 target/sidebar);
mobile stacks targets, remaining sidebar sections, Risk Notes, then Trader Notes.
Use existing Risk Notes title/body typography. No empty Trader Notes card.
Tests must use synthetic storage and fake transports, no live notifications,
provider requests, analysis generation or deployment. Temporary probe home:
`/tmp/watchlist-notes-update-qa-20261118`. Coordinator owns new migration identity
allocation, integration and release; existing20:15handoff stays in effect.


### Notes slice final QA and release boundary

Coordinator reserved platform0220_watchlist_trader_notes_notifications/order295.
It adds only independent notes-intent/member-delivery tables; no prior migration
SQL or checksums changed. Apply backend/schema before the newer Runtime notes
checkbox UI. Existing ordinary notes, analysis approvals and saved publication
identity stay intact. Runtime adds its own notes receipt files under the
existing durable storage root and never appends notes events to analysis heads.
Older rollback code does not drain these new queues: recovery must preserve the
records and compatible relay/worker or disable only the newer notes alert UI.
Do not treat an older backend as notification-compatible automatically.

Final tests:103 focused Platform cases,41 Runtime notes/API/row/composer cases,
and27 existing Free Chat/move/notification-copy regression cases pass (171 total).
The new tests cover default-off/draft/empty silence, website failure with draft
preservation, immutable request identity, retry/reopen, lost Discord response,
confirmed cooldown, uncertain-send protection, expiry, current-cycle/category
and published-body checks, changed access/opt-outs, independent email/push,
superseded notes, and saved notes receipts in optional move cleanup. A final
same-timestamp regression prevents an older failed publish overwriting a newer
note by using durable operation order, not timestamp inequality. The old Free
Chat relay test explicitly mocks the new notes import and fails if a move retry
calls notes preparation or delivery; its existing assertions are preserved.

Chromium:48 card cases pass using actual SimpleAnalysisCard and actual detailed
bottom-row JSX with actual global/layout CSS, widths320/390/844/1280, both themes,
and absent/short/long notes. Font sizes match Risk Notes, titles are bold, no
clipping/overlap and mobile order is correct. Eight actual embedded-console
cases pass default-off, silent draft, explicit notify, empty-note disable and
same request ID after lost response plus Close/reopen. Helpers send no network
traffic. An initial admin helper extracted the unexpanded template; evaluating
its real import/interpolation corrected the fixture before those eight passes.
React review checklist: no new hooks, render-time requests, dependency additions
or inline component identities; conditional bottom-column layout and existing
rendering/escaping are retained.

Runtime full TypeScript passes. Platform changed server/Simple-card graph passes
(9 roots,885 files), including the existing twitter-text declaration. Initial
helper omitted that declaration, which was a helper setup error; no product stub
was added. The inherited detailed-client graph provider-settings limitation
recorded above remains an integration check, not a claimed full app build.
ESLint:zero errors, one existing unused cleanLevelMapCardBody warning. Final
logs are in /tmp/watchlist-notes-update-qa-20261118; Runtime and Platform type,
unit, browser and existing-notification receipts are retained. No dependency
changes, live notes/data, provider calls, generated analyses, notifications,
services, hosted migrations, push or deployments during development/QA. Final
integrated source/build/schema/hosted review belongs to Coordinator. Include
this accepted slice in the existing20:15America/Toronto handoff; no early deploy.


## November 18 — breakout follow-up rule (paired Runtime)

Owner requested research into breakout selection and explicitly approved
retiring replacement breakout sections after the original published level is
crossed. Paired Runtime source owns optional Simple prompt clarification,
activation-bound durable tracking, existing quote/candle observation and
new-generation projection in both formats. Full findings, sources and131-case
fake-generation/Runtime/notes regression evidence are in its
`docs/watchlist-alpaca-status-qa.md`. Existing published cards, historical reads,
owner edits and approval controls remain unchanged. This Platform slice updates
Help only; actual Simple component/detailed grid SSR checks confirm null/empty
breakout fields omit the section without dropping other content. No UI source,
DB migration, provider, setting, live analysis, notification or deployment
change here. Model-selection improvement is not claimed empirically validated
by a paid replay; real responses were not generated during these tests.
Include this source/Help pair with the existing20:15Eastern handoff, preserving
all other newer Help/provider/worker integration.

## November 18 — full Watchlist Admin information audit

Owner requested explanation of Showing17/Published5/Needsattention0 versus
Failed131/Missing46/Requests505; moving the three historical totals to Runtime;
removing obsolete information and suggestions across every Admin section.
Audit is of source/rendered fixtures, not a newly signed-in hosted walkthrough.
No existing authenticated live-browser tool is available in this session.
The last verified live Runtime08d5c5a page differs from the assigned donor only
in the pending move-preview destination argument, so its metric-renderer source
is directly comparable. Do not claim a fresh hosted metadata check here.

Findings: Showing counts filtered AI audit rows (current entries plus retained
recent-event symbols), not public listing rows. Published counts read-status
published, excluding ticker-only publications. Failed/Missing count ledger
outcome events, potentially several for a single request; Requests counts
request_started generation events, not the billed API attempts in Cost Explorer.
The summary uses the retained ledger and the current audit query/filter. Audit
refresh is separate from the ordinary live list refresh. The old subtitle's
active-only statement does not match the source's all-current/retained union.
Legacy AI service/model/generated counters read aiCommentary, default gpt-5-mini;
Clean Read model is a different disabled legacy service. Current analysis uses
status.aiReadConfigured/aiReadModel/aiReadReasoningEffort and explicit fallback.
Legacy thread-post ages likewise do not establish current approved website or
Discord analysis delivery. Internal filenames/config paths do not help normal
owner operation. Indicator Audit also hardcoded Moomoo/Yahoo wording despite
an actual Alpaca-capable provider field.

All11 main sections inspected:

| Section | Audit decision / remaining recommendations |
| --- | --- |
| Watchlist | Preserve approved row actions, preview/edit/history/access controls. Rename Showing to Audit tickers and Published to Published analyses; keep historical totals off this surface. Recommend actual public/listing-only/Private/awaiting-review totals from durable publication state, rather than reusing audit counts. |
| Runtime | Move Failed/Missing/generation-start totals here with retained-event scope. Remove disabled legacy AI and internal path/file cards and misleading old thread-post health. Show actual current analysis service/model/effort/fallback. Keep real startup/feed/preparation diagnostics. Recommend last successful actual generation, in-flight requests and real per-channel delivery queues instead of old commentary counters. |
| Market Data | Keep provider controls. Do not change saved providers, streams, credentials or request behavior. Recommend selected/effective provider and price-versus-candle health with last accepted timestamps, not unconditional old broker warnings. Legacy alias/profile rendering needs current hosted effective-provider evidence before further changes. |
| AI Controls | Keep primary/fallback/effort/format/session/master/boundary/review/auto-publish/notify/research/budget controls. Keep Cost Explorer and audit history. Remove no working toggles. Recommend compact readable summary of saved publication/notification policy. |
| Discord notifications | Keep role/everyone mention editor and deletion preference/retry recovery. Recommend one current destination-and-delivery-status summary, masked webhook values, and per-channel pending/failure counts. Never expose tokens or send a test post during audit. |
| Live Website Controls | Keep working Gain, Top Regular and Reversal visibility controls. Trader Read and Lifecycle controls are already hidden; do not revive. Deterministic Day Trade Adapter is explicitly a Runtime-only test surface; recommend removing it from normal Admin presentation while preserving source pending retirement scope. |
| Automatic Low-Float Selection | Implementation and persisted controls still exist. Off is not obsolete. Preserve settings and do not enable/disable it. Recommend advanced placement if it is no longer part of the owner's normal workflow; do not infer authorization to retire the underlying selector. |
| Usage | Keep member/ticker/day visit history. Already labels recorded visits and excludes owner/archive; not guaranteed complete activity. Recommend last loaded time and an explicit Refresh button, rather than stale snapshot confidence or automatic extra polling. |
| Daily Recaps | Keep date/candidates/draft edits/selection/final body/publish receipts; this is a separate feature. No Generate/Send operations during audit. Recommend compact pending/generated/posted totals and latest saved/loaded timestamp. |
| Indicator Audit | Keep provider/timeframe/accepted bars/missing inputs/retention/export evidence. Replace hardcoded Moomoo/Yahoo attempt labels with provider-neutral labels while retaining the recorded actual provider. Recommend failures first with raw IDs/inputs collapsed; no data/retention deletion. |
| Setup Detection + Results | Keep detector/session/member visibility/owner-only controls and stage/results/audit data. Setup alert delivery is explicitly not connected; its preference alone is not a working sender. Preserve that honest notice and the owner's saved toggle. Quality calibration is separate pending work, not a reason to discard evidence or silently disable detection. |

This slice implements only provably obsolete display removal, the owner's
explicit counter move, truthful model/counter labels and provider-neutral audit
copy. Broad navigation/feature retirement and new metrics remain concrete
recommendations, not silently implemented changes. Existing source, saved data,
settings, approvals, provider requests, paid generation, notifications and
operational behavior stay intact. Synthetic evidence home:
/tmp/watchlist-admin-audit-20261118. Preserve newer Help/provider/worker work.

Final verification for this information-only cleanup:14/14 focused Runtime
renderer/row-review cases, full Runtime TypeScript and Platform targeted ESLint
pass. Isolated Playwright actual-page/navigation fixtures pass8 viewport/browser
scheme cases (320/390/844/1280, light/dark preference), with all network blocked:
3 audit summary cards remain at top,3 historical counters remain only in Runtime,
17 audit rows survive switching tabs, actual configured model/fallback displayed,
legacy model labels absent. Render fixtures stub provider controls; this is not a
signed-in live walkthrough, all-controls behavioral QA or production theme
acceptance. Receipts: /tmp/watchlist-admin-audit-20261118. Runtime service label
says Configured, not Ready, to avoid claiming current external provider health.
Help explains these populations and retained event counts. No migration/settings/
provider/notification/data changes, no push/restart/deployment. Add this slice to
the standing20:15 Eastern handoff; preserve unrelated AGENTS overlay and newer
Help/provider/worker changes during integration.

## Nov18 — owner accepted Runtime detail additions

Added SELECT-only watchlist-runtime-delivery-summary helper and enriched existing
owner-authorized detailed Runtime status responses. Compact status reads do not
query Platform queues, and no additional frontend request/polling is introduced.
All existing authorization, error status/body, no-store and approval contracts
remain. A failed/unavailable database or schema produces an unavailable summary
without losing the Runtime analysis status. Aggregation uses fixed table/column
allowlists and a read transaction via the existing readonly database opener;
never call store initializers/workers/recovery. No migration, settings changes,
real provider calls, notifications or production reads/writes were performed.

Rows cover retained FreeChat, member email/push publication/update/move/notes,
owner Discord, notes Discord, Gain, Recap and X/Buffer queue receipts. Counts are
per saved delivery; email/push are per recipient/device. Pending includes retry
and waiting/preparing/ready states. Failed and unconfirmed stay distinct; terminal
successful/cancelled/expired/disabled states do not become failures. Notes Discord
excludes expired/cancelled intents. Missing tables or unknown states are
Unavailable, never assumed0. No secrets, recipient identities, message contents
or target references are returned. X status ends at Buffer acceptance. Runtime
companion supplies current active public approval/move receipts, actual in-flight
analysis count, last validation success across full retained history and explicit
source refresh timestamps. Last Price Age presentation removed; existing source
health logic and price freshness behavior are unchanged. Help updated.

QA39/39 focused tests total:20 Runtime and19 Platform, including actual relay
owner denial, compact/full behavior, preserved429 error response, failed summary
lookup, query-only queue aggregation without mutation, incomplete schema,
unknown states, cancelled/expired intents, distinct recipient counts and existing
FreeChat move/ticker-only regressions. Full Runtime TypeScript, targeted new
Platform helper TypeScript and changed Platform TypeScript lint pass. Eight
isolated actual Runtime page/Platform navigation rendering cases pass at
320/390/844/1280 and light/dark browser preference with blocked network: compact
refresh preserves detailed cards/queues, zero running is0, unavailable sources
are not0, source timestamps use ET, delivery scrolling stays within viewport and
tab switching preserves data. Browser fixtures stub provider controls; no hosted
walkthrough or production theme acceptance is claimed. Receipts:
/tmp/watchlist-runtime-details-20261118. Preserve AGENTS overlay. Include these
local commits in the existing20:15 Eastern inventory; no early deployment.

## Nov18 — final entire held-batch QA discovery (before corrections)

Owner requested one final QA of all remaining changes for tonight. Source at
start: Platform51f8e591d, Runtimefd944b9. Complete held inventory includes FreeChat
composer/ticker-only sharing/current Premium rechecks; retained destination move
copy and moved wording; row hiding and optional masked Added date; shortened
main intro/removed curated label; notes layout/default-off optional notifications;
optional/crossed-breakout rule; Admin information cleanup and Runtime activity/
queue/timestamps. Earlier live fixes are regression context, not new release work.

Discovery uses isolated synthetic storage under
/tmp/watchlist-final-release-qa-20261118, with secrets removed from test environment,
no live reads/writes/generation/delivery/service changes. Common heavy lock and
exclusive lease serialize all tests/browsers/types. Entire discovery batch finished
before product/test corrections. Runtime131 cases, Platform114 cases, four-additive-
migration legacy-state backup/restore, both dependency typechecks, access/date/
notes/Admin browsers and actual breakout render pass. Node/editor/history batch
and one old combined browser harness exposed stale fixtures:

| Finding | Evidence | Correction scope |
| --- | --- | --- |
| Final-QA1 | Simple-card Node loader does not register CSS or resolve the now-required shared price-order alias; its data/assertions predate catalyst/risk fields, numbered pullbacks and removed invalidation. | Test loader and fixture/assertions must follow current approved card while preserving escaping, hidden sections, prices and immutability checks. |
| Final-QA2 | Previous-analysis real-card Node loader lacks price-order alias. | Resolve actual module; retain original timeline/text/price assertions. |
| Final-QA3 | Manual Loss route tests still mock Journal authorization while actual route uses Watchlist owner authority. | Update mock to actual owner module, retaining denied owner/origin and body-size assertions; no route/auth change. |
| Final-QA4 | Retained combined FreeChat browser helper bulk-access stub supplies4 flags after Added-date made5. | Save a corrected helper alongside new evidence, supply explicit Added=false; preserve original evidence. |
| Final-QA5 | Main owner-review Help paragraph still describes top-right notes despite the newer bottom-right section. | Correct that sentence only; no UI or runtime behavior change. |

These are test/Help compatibility corrections, not evidence that production
analysis, auth or notification behavior failed. Exact integrated canonical build,
predecessor/manifest and post-release authenticated checks remain Coordinator-owned.
The active reminder still targets Nov18 20:15America/Toronto. No early release.

### Final held-batch QA correction and release readiness — Nov18

All five discovery findings corrected as one test/Help-only batch. Simple SSR
loader resolves the real price-order module and CSS import, uses complete current
card inputs and checks numbered pullbacks/removed invalidation while preserving
prices, escaping, hidden-section and immutable-original assertions. Historical
real-card loader resolves the actual price-order dependency; saved timeline,
notes and price assertions remain. Manual Loss tests now mock actual Watchlist
owner authorization while retaining denied-owner/origin and bounded-body checks.
The old combined browser helper was copied into the new evidence directory and
updated to supply all5 access flags; original evidence is untouched. Contradictory
owner-review Help now matches the actual bottom-right/mobile-below-Risk layout.
No production implementation, auth, approval, feature rule or delivery changed.

Final consolidated results (latest source implementations remain unchanged):
- Runtime16 focused files:131/131 tests pass.
- Platform8 Vitest files:114/114 tests pass, including access/roles, notes,
  transport and donor migration framework/contracts.
- Platform8 Node editor/history/notification files:62/62 pass after fixture
  correction, including real history/Simple rendering and Manual Loss safeguards.
- Total307 tests pass; no remaining functional findings in the applicable scope.
-106 isolated browser/workflow cases pass:18 FreeChat/recovery/masked-move,
  8 five-access controls,16 masked Added-date rows,48 Simple/detailed notes cards,
  8 notes publishing controls and8 Runtime summary/activity/queue/navigation.
  Actual source/JSX/CSS used where recorded; fake transports/queues and blocked
  network mean no signed-in hosted or full-platform acceptance is claimed.
- Actual Simple and detailed breakout grids retain non-breakout content while
  omitting crossed/absent sections. No paid prompt replay/accuracy claim.
- Full Runtime TypeScript passes; Platform changed server/card/schema graph
  passes9 roots/886 files; corrected Help lint and changed CJS syntax pass.
- Four additive migration fixture checks pass together: Composer0213, row0218,
  Added0219, notes0220; legacy sent/uncertain/pending/retry receipts, preferences
  and access flags preserved; new data stores empty; SQLite quick_check ok,
  no FK violations; backup restoration recovers original schema/receipts.
  This synthetic predecessor does not qualify the exact canonical release DB.
- Source/working-tree review: no package/lock changes, Runtime clean before
  this QA documentation; unrelated Platform AGENTS overlay preserved/excluded.
  Reminder timer active at Nov18 20:15America/Toronto (Nov19 01:15UTC).

Receipt home /tmp/watchlist-final-release-qa-20261118 retains original discovery
failures, consolidated results.json and separate retest-results.json plus corrected
browser helper and all logs. Shared-slot wait did not change another task's lease.
No real provider/AI/Discord/X/push/email, production data, service/previews, hosted
migrations, Git push or deployment touched. Existing ordinary notification flow
was never globally disabled by QA.

Feature source is ready for tonight's Coordinator integration. Mandatory release
checks remain exact canonical source/provider/Help/worker reconciliation, final
build/type checks, canonical predecessor/schema/backup validation and authenticated
post-release reads. Preserve canonical Composer0213/order270 after live Home0214/
269; row0218/293, Added0219/294, notes0220/295. Backend/schema must precede new
Runtime composer/notes UI. Do not overwrite the combined manifest with this donor.
Earlier binary rollback is not privacy/notes-notification equivalent. No early
release is requested; the existing20:15 owner checkpoint stands. Coordinator was
asked for current release-level inventory/blockers; do not invent a response or
hosted result. Send exact new test/Help commit and paired Runtime QA record.

## Nov18 — compact per-provider summary extension

Owner requested replacing misleading Moomoo Connection/waiting and narrowing
that card plus Watchlist Market Data, with one card per market-data provider.
Paired Runtime derives marked provider cards from actual selected runtime roles
and recorded candle fallback diagnostics. Platform top summary now clones those
marked cards plus overall Market Data, excludes the legacy Moomoo Connection
card even with an older Runtime, and uses compact responsive widths/padding with
small role subtitles. Heading is Market Data Providers. In use identifies roles,
not verified live connectivity; Standby is a configured fallback, Off means no
assigned role, Unknown means status lacks complete evidence. Help updated.
No provider probe/selection/credential/config/request/worker changes; existing
status polling and observation update cards after a profile change.

QA18 focused Runtime Admin/provider/row tests pass, full Runtime TypeScript and
changed Platform ESLint pass.8 isolated actual page/navigation browser cases at
320/390/844/1280 with light/dark preference pass exactly6 summary cards, unused
Moomoo Off despite legacy waiting state, correct Alpaca/mixed roles, observed
profile changes, narrow desktop cards (<180px), contained mobile grid and existing
Runtime activity/audit/navigation behavior. No external requests or hosted
walkthrough. Receipts /tmp/watchlist-provider-cards-qa-20261118. No migration or
dependency, data/analysis/notification effects, push/restart/deployment. Preserve
AGENTS overlay; extend tonight's20:15Eastern handoff and retain current canonical
provider/navigation/Help work. Previous whole-batch307-test/106-case qualification
remains for unchanged features; this extra shared-summary UI has its own focused
verification above.

## Nov18 — owner reaffirmed complete tonight handoff and reminder scope

Owner explicitly requested the new compact provider cards be included with ALL
other remaining updates tonight, and the reminder tell Coordinator to deploy.
Verified existing user-systemd timer is active for2026-11-18 20:15America/Toronto
(Nov19 01:15UTC /02:15CET). Updated its existing oneshot service message, without
creating a duplicate schedule or starting the queued chat early, to enumerate the
complete held scope and expressly include compact provider cards and a request
to complete tonight's approved deployment. Source checkpoints provider slice:
Platform59a10bb79c1c3a9ec1cc42303b3a8cfdcbad8d66 and
Runtime06660ff5861cc7f02a5caf27f7a664ffac20c19c. The reminder must refresh actual
HEADs/progress and hosted state at execution, including later verified work.
Service remains codex queue --resume into this existing Watchlist chat, which
must message active Coordinator01a1ec9c-a655-7f01-aa7a-1024fa236e13 and report a
real release outcome or concrete blocker. Existing Coordinator ownership,
canonical source/schema checks, backend-before-Runtime order and no real test
posts remain. User timer daemon reloaded/rescheduled only; no application service,
production data, provider, worker, deployment, push or real queue invocation.
Timer ActiveState/next schedule and exact provider/scope/deploy phrases verified.

## Nov18 — Needs attention card drill-down

Owner requests a clear route from Needs attention count to affected tickers and
reasons. Paired Runtime adds View details inside the existing card and reuses the
same cached audit/filter without requests or changing classification. Existing
AI Controls audit shows matching rows with explicit current-failure, missing,
pending-publication or historical flag explanations; zero state is clear. Existing
ticker inspection retains saved reasons/history. Platform local navigation opens
AI Controls and parent wrapper synchronizes the selected tab through its existing
same-origin/exact-frame/source checks. Opening does not generate, approve, publish,
retry or change a ticker. New explanatory heading receives focus/scroll; stale
selected audit detail is cleared. Help updated.

QA20 Runtime tests +1 real-wrapper-message-handler test, full Runtime TypeScript,
changed Platform ESLint and8 actual page/navigation browser cases pass with all
network blocked. Tests cover3 matching reasons, navigation/current tab/focus,
zero-attention state, actual trusted/untrusted parent-message handling and prior
provider/Runtime summary/navigation. Four widths/light-dark browser preferences
remain isolated fixture evidence, not production/signed-in acceptance. Initial
case/date expectation errors were fixture-only and corrected; preserve both
original/final receipts in /tmp/watchlist-attention-qa-20261118. No migration,
dependency, provider/settings/data/approval/delivery change or real sends,
restarts/push/deployment. Preserve AGENTS overlay and canonical navigation/Help.
Add this later owner-requested verified extension to tonight's20:15Eastern batch;
reminder already instructs refreshing all subsequent completed work at runtime.

## Nov18 — Overnight naming simplification

Owner requests all Overnight Watches wording shortened to Overnight, including
posts/notifications. Active public section title, tooltip/aria labels, Admin
Add/move/group display, category Discord, FreeChat moves, email/push move/update
copy and Help now use Overnight. Group IDs stay top_watches:YYYY-MM-DD, so saved
assignments/calendar/routing/provider behavior is unchanged. Both context readers
accept old saved category notes and normalize to Now on Overnight. for newly
rendered notifications; pure email/push formatter normalizes direct legacy input
too. Existing immutable approvals/owner-edited post text/historical evidence are
preserved, without live post edits or data conversion. No migration required.

QA77/77 focused cases pass (49Runtime+28Platform), including fixed legacy BRAI
input preserved/normalized output, actual new Discord headings, date IDs/move
copy, all FreeChat Premium combinations and old/new email/push metadata with
input immutability. Runtime full TypeScript, Platform changed server/card graph
and ESLint pass (0errors; one unchanged cleanLevelMapCardBody unused warning).
Search active UI/template source: no old label remains except explicit legacy
input normalization. Historical package scripts and evidence records are not
active presentation and remain preserved. Receipt home:
/tmp/watchlist-overnight-label-qa-20261118. No live analysis/provider/data/sends,
settings/dependencies/service/push/deployment change. Preserve AGENTS overlay,
canonical notification time/context work and current provider/Help/nav/worker
source by narrow diffs. Add this later verified owner request to the same20:15
Eastern reminder/deployment inventory with all earlier changes.

## Nov18 — FreeChat generic-sentence removal and editable empty message

Owner requests removing See what's available on the ticker page and ability to
edit that post. This is the public-ticker/restricted-analysis-or-levels text-only
FreeChat default. Removed that sentence without replacing it. Existing held
Post to FreeChat composer already offers editable Post message before confirming
for this variant. Server and embedded preview now agree on an intentionally blank
message (no reinserted fallback or extra blank paragraph); default headings,
links, mention, immutable saved owner copy and current Premium rules remain.
Other variants keep their existing default until an owner explicitly clears it.
Help identifies this editing/clearing behavior. Existing approval/move checkbox
confirmation remains its own existing workflow; this task verifies the standalone
editable Post to FreeChat composer, not a new edit capability in that confirmation.

QA40/40 focused tests (17 Runtime+23 Platform) plus20 actual-script/synthetic-SQL
browser workflow cases pass, including both custom and blank body persisted for
this exact variant, one queued send, existing lost-ack recovery, Premium and
move cases. Runtime full TypeScript, Platform changed graph and targeted ESLint
pass. Network blocked/fake handlers; no Discord posts were sent. Receipts
/tmp/watchlist-free-chat-copy-qa-20261118. No new migration beyond already-held
composer0213 canonical270, dependency/settings/provider/approval/data/service/
push/deployment change. Preserve AGENTS overlay and current canonical source.
Include this later owner-requested change in tonight's20:15Eastern full batch.

## Nov18 — initial dual-channel message editing and obscured dialog (in progress)

Owner reports Edit Discord post beside Also post to Free Chat contains the paid
image/footer text, asks whether Premium FreeChat image protection deployed, and
whether both initial messages can be edited separately before publication. Also
reports editor heading pinned beneath dashboard navigation.

Read-only coordinator metadata refreshed00:21:09UTC: live Platform1806d747,
deploymentaccdec37-67ad-4f59-b6de-17a433a00db8; live Runtime08d5c5a,
deploymentc2db86e8-c806-4bd5-bf3d-d53555349e80. Source checked directly: live
initial-approval relay records FreeChat intent, reconciler invokes guarded
FreeChat delivery with current visibility, and preview explicitly sets no images
for ticker/analysis/levels restrictions, payload uses only allowed images and
suppresses embeds for protected posts. Paid editor footer is not FreeChat output.
No actual live send was used as evidence. Editable standalone composer remains
held, not live. Existing initial Also FreeChat confirmation is read-only: this is
an actual workflow gap separate from already-deployed image protection.

Implementation adds separate editable initial FreeChat confirmation, scoped
cycle/draft/policy message memory and recovery of immutable queued copy. Chosen
copy is durably recorded in existing composer owner_copy_json before approval;
relay strips FreeChat copy from paid Runtime payload. Existing visibility/input
validation and delivery-time recheck remain. Copy preparation errors cannot veto
paid Watchlist approval; response/UI identifies the independent FreeChat warning.
No new DDL/approval gate: this rides held Composer0213 canonical270. Existing
move/published confirmation modes are not given a nonfunctional editing field.
Standalone composer and paid channel editor stay separate.

Modal position helper uses actual fixed/sticky parent header bounds and visual
viewport, adjusts on parent scroll/resize/keyboard viewport events and removes
listeners on close. Applied to paid editor, initial confirmation and standalone
FreeChat composer. Paid dialog explicitly identifies Watchlist channel text.
No source change to shared dashboard header, scanner, News or other workspaces.

Backend/row regression and semantic checks pass; targeted geometry test covers
header exclusion, scroll, virtual-keyboard height and cleanup. Final8-case real-
clock same-origin iframe acceptance queued behind another task's heavy slot.
Retained browser attempts exposed fixture setup gaps (wrong raw-runtime URL
prefix, listed-versus-initial button text, paused scroll clock, and missing normal
app row repaint after Cancel); corrected helper preserves these earlier logs.
Do not claim feature ready or hosted acceptance until final receipt below.
Evidence home /tmp/watchlist-initial-free-chat-qa-20261118. No production data,
provider/AI/delivery/services/hosted migrations/push/deploy operations performed.

### Initial dual-channel editor correction — final qualified

Final57/57 tests pass:32 Runtime (row/recovery/owner API/real geometry helper) and
25 Platform (initial copy, existing privacy/receipt/move and actual relay failure).
Runtime full TypeScript, Platform9-root changed graph and targeted lint pass.
28 browser workflows pass:8 real-clock same-origin iframe cases plus20 existing
standalone cases. New iframe fixture exercises independent saved paid/free text,
initial approval copy actually queued to synthetic SQL, Cancel/reopen, Premium
masking/image notice, actual fixed72px parent header with scroll and contained
modal height across320/390/844/1280 and light/dark browser preferences. Geometry
unit additionally verifies reduced visual viewport and listener cleanup.

Earlier browser helper setup/timing issues are resolved and retained: actual raw
Runtime URLs differ from Platform rewrite, initial button differs from listed
analysis, parent native scrolling needs a real clock, normal app repaint must be
modelled after Cancel, and dialog closing is earlier than approval response.
Final fixture waits actual response and models ordinary row repaint; these
corrections did not require changing app behavior. Header geometry and editing
were the real owner-reported defects corrected in source. All network is fake
RPC/SQL; no live Discord/email/push/X/provider/AI or signed-in hosted acceptance.
Receipts /tmp/watchlist-initial-free-chat-qa-20261118 retain failures and final
*qualified.log. No tests were silently dropped due to shared heavy-slot waits.

Both initial message editors are now independent before the approval request.
The existing inline Edit Discord post dialog explicitly labels itself Watchlist
channel, and its image/footer text remains correct for that channel. Also post
to FreeChat confirmation edits a separate, policy-specific body; current Premium
rules still protect the actual FreeChat post. Optional body, pinned heading/links/
mentions and delivery-time rechecks stay intact. New copy metadata never enters
the paid Runtime approval payload. Saved copy recovery is owner/cycle/draft/policy
scoped, and duplicate requests retain the first immutable intent. Independent
FreeChat preparation failure does not veto paid approval. Existing initial
confirmation count/workflow is retained; no additional approval requirement.

No new migration: initial copy uses the already-held Composer0213 canonical270.
Schema/backend must precede this Runtime UI; preserve paired rollback/order and
all existing approved source, API error handling, providers, Help and worker work.
No app/preview restart, push, deployment or hosted data change. Qualified source
ready for inclusion in tonight's existing20:15America/Toronto handoff.


## Nov 18 owner follow-up — Premium preview composition

Owner supplied the actual INHD card and requested one Potential Targets heading, original section order/layout, only prices concealed, dates readable, and entirely readable catalyst/risk cards at the bottom. Simplified protected reads now project a whitelisted, price-sanitized presentation model and reuse SimpleAnalysisCard itself, including its existing responsive target/sidebar layout. Prices are server-removed (numeric display fields become placeholders); original saved reads and approvals are unchanged. Dates, clock times, percentages and candle lengths remain context. Catalyst/risk prose and article-title facts remain intact as requested. Legacy detailed targets are grouped under one heading and catalyst/risk are placed at the bottom.

Verification: 104/104 focused Vitest tests across eight files; 8/8 existing owner row Node tests; owner-row/editor/Simple semantic check; ESLint and diff checks pass. Tests render actual protected and original React cards, compare section order, target count, hidden sections, price exclusion, date/percentage readability, original immutability and bottom sidebar. No real data, generation or delivery calls. No new migration for this preview correction.

Expanded 9-root/2069-file semantic check passes using the exact immutable canonical main1806d747 provider-settings.ts and provider-contract.ts supplied in compiler memory. Bare donor graph still lacks those pre-existing canonical modules; no stub or source files were added or changed for that dependency. Canonical integration must preserve current provider modules. New Chromium screenshot/layout acceptance is not claimed: shared guard is occupied by Root/News operations; unchanged layout CSS and real-renderer DOM parity were checked in isolated tests. No preview stopped or production changed.


## Nov 18 owner follow-up — independent Premium-only indicators

Added Premium-only indicators immediately after Premium-only support & resistance, using the existing single initial settings GET and audited per-control save/recovery flow. Independent default-off preference; no changes to analysis generation, approvals, notifications, feed selection or provider request cadence. Server enforcement covers current detail SSR, detail refresh, archive SSR and direct indicator snapshot GET. The snapshot API denies before reading cached provider data. Restricted member projections remove technicalContext and prevent the indicator component from mounting; toggling back restores ordinary saved visibility and existing plan entitlements. Owner and Premium access remain available. Unrelated ticker/analysis/levels controls remain independent.

Coordinator confirmed source-only slot 0222_watchlist_indicators_visibility/platform/order297 (Nov19 UTC). Dedicated preference and audit tables reference platform_users; current manifest table catalog includes both. Account-erasure closure regression removes that owner's preference/audit rows while preserving another owner's rows and passing foreign_key_check. Retention follows existing access-setting audit lifecycle: persists for owner audit, removed through account erasure; no new autonomous retention worker. Existing migrations and checksums unchanged. Reservation is not proof that earlier migrations are applied or that hosted admission is complete; Coordinator must reconcile canonical prefix/order and backups.

Qualification: prior eight-file batch104/104 passed; added erasure test plus migration file-contract retest6/6 passed (105 distinct tests in combined inventory), and owner editing regressions8/8 passed. Control UI is exercised against actual SQL routes in jsdom: save, reopen, unchanged Added/analysis values and one combined GET. Expanded semantic check2069 files/9 roots passes against exact canonical1806d747 provider-settings and provider-contract dependencies loaded only into compiler memory; no source stubs. ESLint/diff checks passed. Browser screenshot acceptance remains unrun because News owns shared heavy guard; no locks stolen or active preview disturbed. Hosted verification/deployment remains Coordinator-owned; no hosted data, delivery or provider requests made.



## Owner-scheduled complete deployment reminder — Nov 18 8:15 PM Toronto

Refreshed actual worktrees rather than using stale provider checkpoints. Platform source13b69b6c (parentb675b078), Runtime92e4ca9 (parentbf2d986); only Platform AGENTS.md overlay dirty. Complete immutable provenance inventory is [watchlist-complete-reminder-inventory-20261118.json](watchlist-complete-reminder-inventory-20261118.json): Platform31 commits/74 paths and Runtime25 commits/48 paths since recorded Admin recovery checkpoint. Each path includes base/candidate/cached-live blob IDs. This is a provenance superset for Coordinator reconciliation, never an instruction to copy donor whole files or manifest. Some provider/privacy/error fixes are already hosted; compare actual hosted source and current canonical preimages before selecting remaining diffs. Cached live metadata is explicitly not a fresh Railway admission check.

Request to active Primary Coordinator: deploy ALL completed remaining approved Watchlist work tonight, including compact provider cards and later verified slices. Prior307tests/106workflow acceptance and provider18tests/8render extension remain recorded, followed by initial dual-message57tests/28browser and laterPremium preview/indicator source qualification105distinct tests+8ownerNode regressions. Latest Premium slice browser screenshot check remains unrun; complete its genuine final acceptance under shared guard before admitting it. No invented build/browser/hosted passes. b675 alone is not a clean independent cherry-pick to current1806 because it expects pending Trader Notes layout preconditions; keep coherent combinedbatch. Existing Composer0213/order270,row0218/293,Added0219/294,notes0220/295 plus confirmedindicator0222/297; preserve liveHome0214/269 and News0221/296 and all canonical migrations. Backend/schema before compatible Runtime92e4, pairedrollback required; older consumers are not access/notification-equivalent rollback. No self-release, notifications, generation, restarts or production mutations. Coordinator owns exact canonical build, schema/backup/restore and actual Railway/runtime/health receipts.



### Premium browser closure after shared guard became available

Eight actual-source static Chromium workflows now PASS at320/390/844landscape/1280 in light/dark. Final harness loads real Tailwind preflight, globals, CSS-module source and academy-shell/data-academy-theme; verifies actual theme tokens, no horizontal overflow, one targetheading/four prices concealed, catalyst/risk entirely unblurred and correct desktopsidebar/mobile stacking. Original renderer headings/order match protected renderer. Final screenshots visually inspected desktoplight/mobile dark. Initial static harness lacked academy-shell/preflight and was corrected; earlier appearance-only captures are not theme acceptance. Browser inspection also prompted a small robustness fix: masked price fragments stay inline despite the existing target-list span rule.3/3 renderer tests pass after this change. All network requests blocked; no hosted data or real effects. Receipts /tmp/watchlist-premium-preview-qa-20261118/browser-final.log and screenshots. Shared guard/RAM checked and owned marker removed on exit.

Fresh read-only Railway metadata at this reminder follow-up confirms Platformdeploymentaccdec37 SUCCESS with source1806d747 and Runtimec2db86 SUCCESS. Neither is tonight's pending candidate. PublichealthHTTP200/ready. Coordinator is completing ordered canonical integration/CI; no featurechat push/deploy.



### Canonical source reconciliation support for tonight's release

Coordinator requested immutable conflict guidance against qualified Platform3707b05a and live Runtime08d5c5a, not edits to the integration checkout. Prepared private source-only /tmp/watchlist-integration-packet-20261118/manifest.json for17 conflicts:12 suggested source/test postimages and5 guidance-only documents/catalog files. Each records exact current/donor blob IDs plus proposed hashes, retains canonical nonconflicting auto-merged context, and keeps canonical provider-specific candle diagnostics. New owner-approved FreeChat/notes/admin/runtime behavior is retained only in the relevant conflict hunks. Manifest entries and migration contract remain Coordinator-owned; no donor-wide catalog replacement. Ten suggested TS sources syntax-check; integrated semantics/CI are not claimed. Packet includes c3b9b9b4 inline-mask/browser follow-up patch. No integration-workspace changes, branches, resets, rebase or actual Git merges performed. Original donor history and unrelated AGENTS preserved. Coordinator notified and owns final canonical build/schema/backup/rollback/deploy/health evidence; production remains prior release at latest read-only check.


### Combined188 source audit — notes erasure and asynchronous send fences

Core source auditor identified non-FK actor/recipient snapshots in unapplied0220; existing incoming-FK closure does not scrub these. Root authorized smallest technical contract repair, no new UX or DDL. New type-only SQLite watchlist-notes-privacy.ts helper requires the original whole-Platform-user erasure transaction, scoped/bounded by existing closure row/time budgets. It preflights original owned Discord sending/uncertain/lost-ACK and in-flight recipient/author deliveries before mutation, preserves unresolved originals, strips only erased recipient snapshots, redacts/cancels authored authority without deleting settled foreign receipts, and leaves Journal/workspace-only clearing unchanged (Core owns the actual full-user service hook). Foreign delivery target rows follow existing user FK closure; all historical SQL/checksums untouched. Terminal/expired snapshot copies were historically retained; this patch scrubs attributable copies on full-user erasure, no invented TTL policy.

Adjacent writer race correction: recheck current intent after awaited status reads, materialize from fresh recipient snapshot, atomically claim persisted Discord sending/attempt before POST, and require delivery CAS changes===1 plus active parent before sender effect. Throw/lost transport stays unresolved;60s timeout and1h expiry do not reset its original. Known429 retry remains retryable, confirmed receipt readback still settles a lost Discord acknowledgement. Optional uncertain outcome metadata added to existing email/Watchlist sender adapter; normal consumers retain existing retry behavior, notes alone consumes the flag to retain the original. No provider/delivery calls in qualification.

27/27 notes-helper/writer/actual fake-email-adapter tests PASS; existing14 notification assertions retained, plus multi-user recipient/actor/target cleanup, rollback, bounds, uncertain/expired holds, async cancellation/no recreation, actual SQL recipient deletion during preflight/no effect after lost CAS, pre-send marker, no60s/expiry resend, and known429 vs unknown transport. Strict semantic graph and lint/diff checks pass; existing twitter-text declarations included, no stubs. One test fake initially used the wrong public-origin setting; corrected isolated process fixture, not product code. Root's combined-source baseline prior to this later repair was130/144 Vitest +30/30 Node:1 physical registry-order error fixed by Root,13 default5s native fixture deadlines to rerun at finite30s without dropping assertions. Full188 erasure service/retention contract and actual composed requalification remain Core/Root responsibilities; do not reuse earlier standalone passes for the new whole-user hook.


#### Notes privacy boundedness follow-up before Core188 qualification

Core reviewed the source and correctly flagged the initial aggregate .all/map and ASCII instr predicate. Replaced them with explicit indexed keyset scans: one small delivery row or one intent JSON body at a time, original maxRows/time guards checked per step, no synthetic empty cursor sentinel, and actual parsed userId comparison handles escaped JSON. No predicate-hidden unbounded JSON scan or all-bodies preflight cache. The same original transaction restores earlier edits if a later malformed/unresolved row fails. Two regressions cover escaped userId without a plaintext targetRef shortcut, valid empty first PK, and later-row rollback. Final notes batch29/29 PASS; lint/diff checks pass. Existing per-row JSON has no SQL byte cap, so one legacy JSON.parse is not preemptible and memory for that single body remains bounded only by existing SQLite/body size; no invented cap/DDL introduced. Global explicit scan can hit existing row/time budget and hold, rather than silently skip data. Core actual whole-user hook/native188 qualification remains required; earlier27-test immutable packet is superseded only by this later narrow source checkpoint.


## Nov 19 — per-ticker Premium only disclosure

Owner requests grouping per-ticker Premium controls in an expandable section matching the existing More actions treatment, titled exactly **Premium only**. Platform injection now places all six existing ticker/analysis/levels/indicator/row/Added controls inside a native details/summary using the existing action disclosure class and full available width. It starts collapsed, retains expansion per symbol across normal row redraws, and avoids duplicate controls on repeated attachment. Saved values, coalesced reads, lost-ack readback, authorization, member access and posting behavior are unchanged. No Runtime source, schema or migration is needed.

Focused existing access suite: **52/52 PASS**, including actual SQLite policy and injected-DOM save/reopen/recovery checks. Added assertions verify collapsed default, exact heading/shared class, expansion retained after repaint, all six options inside the disclosure and no duplicate attachment. Targeted ESLint and diff checks pass. This small isolated one-file Vitest run used the qualified12.9 native tree with one worker384MiB heap, no global pristine snapshot/build/browser batch; about1.56seconds under available6.7GiB RAM while the unrelated provider browser retained its own heavy guard. No provider, AI, real delivery or hosted calls.

Help's old inline-checkbox location sentence is updated to point to Premium only; keep this as a contextual hunk against canonical Help, whose other content has advanced since this donor. The actual control preimage is byte-identical to current recorded FCD main (SHA256 e42f79401b9781969cd8fd5d9312076e6d263fa837d0c81e89f660c8aa2184b7). Coordinator must integrate only the narrow control/test/Help/doc delta; do not reapply this donor's already-released ancestry, unrelated AGENTS overlay or held Chart/source repairs. Source QA is complete; no production deployment is claimed or requested by this implementation-only instruction. Root retains Git publication/release authority.


## Nov19 — CHSN distant target context Help companion

Paired Runtime85ffa6e narrows only the simplified target explanation instructions after read-only review of CHSN's saved two generations/packet. This Platform delta adds two Help sentences explaining distant stretch references and that a gap between selected rows is not proof of absent intermediate resistance. No application/UI/access/API/schema/policy changes in this companion. Preserve canonical Help changes using this exact small contextual hunk, not donor-wide replacement. Runtime17/17 existing simple/input/integration tests and offline synthetic request/render check pass; no real AI replay, market-data reconstruction, saved-read edit, publication or delivery. Implementation-only owner instruction: release not performed. Earlier Premium only disclosure69a38 remains a separate ready change, not implicitly deployed by this Help companion.

## Nov 20 — completed release and section-specific summary placement

The Coordinator's supplied final closeout supersedes the two earlier held statuses: Premium disclosure and distant-target context are deployed and closed. Reported Platform c0e3824f29223dc942a98ef8591c24b2ccc9f0a8, deployment 1ffa87a6-4309-4651-93ac-650c96a8f298, and Runtime ef7276de8497dbb20e225e438f37b44118d5420e, deployment b5a7cfb4-c481-4be8-8ba7-7b416c4c511b, succeeded with health ready210 and exact-head CI44695774474 passing. This paragraph records the supplied release receipt, not a new hosted check by this chat.

New owner request: show the cost/request/accounting and audit summary grids only at the top of Runtime. Show the compact Market Data Providers summary only at the top of Watchlist and Runtime. Hide both summaries on all other embedded sections; the existing outer wrapper already hides the whole embedded console for Usage, Daily Recaps, Indicator Audit and Setup Detection.

The section-navigation injection now applies visibility when selecting a section and when adopting/refilling summary grids after refresh. Explicit hidden CSS overrides the existing grid display rule. Provider source cards remain mounted for the existing refresh renderer but are concealed in the lower Provider Health grid, avoiding duplicate provider cards in Runtime; unrelated health cards remain visible. The original cost/audit nodes and their listeners are moved, not copied. Provider selection, data requests, polling, saved settings, audit calculations, approvals, notifications and the Runtime service are unchanged. The edited source preimage matched the recorded deployed c0e3824f version before this narrow change.

Qualification: isolated jsdom execution of the actual rewritten document passes all seven embedded sections, standalone initial Watchlist selection, genuine wrapper-message selection, top placement, hidden-style precedence, retained input/node/click-listener identity, automatic cost/provider updates, replaced audit-grid adoption, and nonduplicated provider display. Network calls were prohibited and remained zero. Existing owner wrapper attention-navigation test passes; targeted ESLint and git diff whitespace check pass. Evidence: /tmp/watchlist-summary-placement-20261120/check.cjs. No full build, hosted/browser visual acceptance, schema/migration, provider/AI/delivery calls or deployment was performed. This new section-placement slice is source-ready and remains undeployed.


## Nov 22, 2026 — shared locked-card correction in progress

Owner directly authorized the Custom Plans handoff, then clarified that locked Potential Paths must show each real strength/confluence descriptor while concealing prices and dates; Formed/Confirmed/Tested remain readable. Work stays in this assigned Platform lane. No schema, grants, plan activation, runtime configuration, AI/provider/delivery call or deployment is assigned.

Acceptance inventory: legacy Whop opens separately; explicit selected-plan strings and null privacy remain intact; whole-ticker locks share presentation; Analysis uses its existing sanitized preview for both Premium and Membership denial; Potential Paths keeps the normal nearest/row/column/ladder composition with a positive-allowlisted descriptor DTO and no private numbers/dates; Indicators reuses one renderer with a separate static SAMPLE wrapper that never mounts the polling component. Retain independent ticker/analysis/levels/indicator authorization. Verify all allowed/denied combinations, safe refresh/archive projection, normal polling, tabs/help, and desktop/mobile portrait/landscape in light/navy dark.

Current source discovery: several assigned-source files differ from published b52 through independent signal/provider-neutral changes. Integrate only the final local delta, preserving the canonical memberWatchlistMarketData wrapper, VWAP signals and RSI momentum label. Never replace donor files wholesale. Focused checks and isolated browser rendering pending; common heavy lock currently belongs to Scanner browser QA and is not disturbed.

### Locked-card correction checkpoint — Nov 22, 2026, 8:34 PM EST

Completed the approved shared presentation slice. Legacy Premium ticker-row/detail, Analysis, Levels and Indicator upgrades use the exact interim Whop destination in a protected new tab. Existing explicit public selected-plan links retain in-app navigation; explicit null retains no public offer. Whole-ticker and Analysis Membership denial now reuse the same components instead of bare sentence placeholders. Simplified and detailed Analysis use the existing sanitized preview; Catalyst/Risk remain readable, with one targets heading and the original bottom layout. No gate decision, saved restriction, owner approval, publication, or notification logic changed.

Locked Potential Paths now shares the real level-row renderer. Its new public preview includes only allowlisted strength/source descriptors, nearest/reference flags, and Formed/Confirmed/Tested labels. It excludes actual prices, distances (which could reveal prices), raw labels, dates and evidence timestamps. Existing protected cards/numeric maps remain stripped. Client refresh carries the safe preview, and re-projection/archive rendering remains safe. A read-only `levels` result was added to the existing feature-access helper solely to distinguish global Membership denial from legacy Premium denial when choosing the upgrade destination; existing authorization remains authoritative, including an allowed owner override.

The Indicator SAMPLE uses the same groups, summary tiles, tabs, chips, explanations and help as the real card. The static wrapper never mounts the connected polling component and cannot receive a real ticker/snapshot. Diagonal SAMPLE watermarks are pointer-transparent and decorative; a visible sample label identifies the readings accessibly. The real card retains its normal polling and saved timeframe; preference hydration now uses the external-store hook rather than effect-driven synchronous state. Shared orange notices support both existing dark-theme attributes.

Final coherent batch: 8 focused files / 103 tests pass, including all 16 independent analysis/levels/indicator permission combinations, legacy vs global/selected-plan/null routing, both Analysis formats, safe serialization, input preservation, actual indicator polling, preference restoration, tabs/help, and existing owner/free/Premium row/indicator authorization regressions using isolated fixtures/in-memory storage. Actual-component Chromium rendering passed 18 cases (1440x1000, 390x844, 844x390; Light/Navy Dark; allowed/legacy Premium/Membership), zero page errors and ZERO network requests. Verified real card DOM/groups, one targets heading, field privacy, orange/bold/underlined destination treatment, Whop new-tab attributes, tabs/keyboard/help, expandable ladder and no page overflow. Screenshots inspected for desktop Light Premium and portrait Navy Dark Membership; artifact directory `/tmp/watchlist-locked-cards-6hqUE8`, reproducible via `traderlink-browser-env node src/scripts/verify-watchlist-locked-cards.mjs`. Browser harness startup/fixture corrections were confined to the synthetic harness, not product guards.

Targeted TypeScript check (8 component/projection/test roots with actual Next CSS declarations and Node types) reports zero diagnostics. Targeted ESLint and whitespace checks pass. Used the common VPS QA lock for the final test/browser/type cohort. No app-wide build, hosted/owner acceptance, real provider request, database migration, AI generation or Discord/email/push/X delivery. This is a source checkpoint, not deployed.

Remaining separate dependency: current concealed ticker-list projection has no safe selected-plan destination; existing contextual plan URLs contain the hidden ticker. Legacy row navigation is corrected to Whop without exposing the ticker. Asked Custom Plans for an opaque/public-offer routing contract; do not forward the existing symbol-bearing URL or represent this future concealed-row routing as qualified. Direct known-ticker selected-plan strings/null and all locked-card presentation parity are qualified. New owner reveal-checkbox/new-ticker default instructions arrived during this checkpoint and require a distinct follow-on slice with source ownership confirmed; no saved choices were inverted in this card correction.

Release integration must apply only this commit delta to the current canonical parent, preserving its provider-neutral member projection wrapper, VWAP signals/RSI momentum annotations, Help and all newer public source. Runtime has no changes in this slice. The earlier missing-price-time wording commit is a separate PR38 release candidate; it is not evidence that these new card changes are live.


## Nov 22, 2026 — new-ticker defaults and reveal controls (separate source slice)

Coordinator reservation: `operations/watchlist-new-ticker-defaults-source-lanes-20261122.json`, author parent aec6e1d9. New contract is optional `LiveWatchlistSymbolState.premiumDefaultsVersion: 1`. Both first-state creation paths (`applyPatch` and `applyTickerDataPatch`) establish it only for a missing state. Every known state preserves its prior marker or absence, including ordinary updates, moves, removals/reactivations and restored archive context. Caller/publisher patch fields cannot establish or clear it. Ticker-price updates still cannot publish an unknown ticker. No table/schema change.

The four existing access inputs now express reveal actions: Show ticker / Show analysis / Show support & resistance / Show Indicator card to free members. Only their presentation and outgoing checkbox mapping invert. Persisted/API `premiumOnly=true` continues to mean restricted, and `false` continues to mean revealed. Opening/reopening never writes or bulk-converts saved values. Unknown initial/readback status remains unchecked/indeterminate rather than asserting free access. Independent row-hide and Show Added controls retain their existing direction and saved meaning. Disclosure placement/expanded state remain unchanged.

Standalone control verifier was modernized from its obsolete Windows/donor-only harness to load the actual current injected source and synthetic saved API values. It passes 22 isolated control workflows covering restricted/previously revealed values, all six save mappings, reload/deduplication, disclosure persistence, and successful/lost/unavailable acknowledgement recovery with exactly one mutation and read-only recovery. The two store files pass 45 tests using disposable SQLite memory and a mocked Neon transport, including concurrent first insertion, legacy contention and marker preservation. Targeted five-root TypeScript check reports zero diagnostics. Script/control lint and whitespace pass. This is author-source qualification, not combined reader/hosted acceptance.

Runtime source identity was reconciled by Release after the provided public main7f121a2d lacked the existing wrapper hook. Current installed artifact is separately backed by ca04dcf7b6d9b254d54720887a500e63bc828d2d; bounded source receipt `operations/watchlist-runtime-reveal-installed-source-20261122.json` rehashes installed page/row TS and compiled modules, confirming the exact attach seam. No Runtime edit is required or made. Any browser style check uses the exact ca04 public row/page sources and synthetic DOM/API only, never the running console or private data.

Plans retains active readers/writers and their tests. Required composition: absent explicit control choice + marker1 => restricted; known legacy unmarked state => preserve legacy behavior; no state (unpublished new Admin ticker) => restricted before publication. Explicit owner choices and selected-plan grants remain authoritative; row/Added do not inherit the marker. The combined ticker/analysis table requires preserving the OTHER effective control on the first insert: old ticker insert seeds analysis0 and old analysis insert seeds ticker0. Sent this finding to Plans, which owns those active writers, with both first-save orders required as regressions. Their existing UI fixture must adopt the four reveal labels/checked expectations while preserving row/Added tests. Do not count the earlier frozen103-case card result as a pass of this still-uncomposed successor.

No rollout until the frozen reader/default composition and its final combined QA are complete. Keep the new marker-aware access readers with this writer on rollback; older readers ignore the marker and do not preserve the new default protection. Existing source choices, owner approval, publishing, notification paths and live settings/data remain untouched. No hosted effect, provider/AI/delivery call or deployment performed.

Reveal UI browser checkpoint: actual injected controls with exact ca04 Runtime page/row CSS passed desktop1440x900, portrait390x844 and landscape844x390 (3 cases; zero network requests), including checkbox-to-saved-value mapping, all six visible/reachable labels and no horizontal overflow. Portrait screenshot inspected at `/tmp/watchlist-reveal-controls-WF3i4g/portrait.png`; full artifacts reproducible with `traderlink-browser-env node src/scripts/verify-watchlist-admin-layout.cjs --browser`. Final script lint passes. No complete live Admin route or backend default-reader acceptance is implied by this isolated source fixture.


## Nov 22, 2026, 08:58 PM EST — owner-requested final card QA, deployment handoff HELD

Owner first requested one final QA/fix and immediate release handoff, then explicitly withdrew sending to Coordinator: finish QA but do not send yet. No final deployment handoff or release request was sent. Earlier pre-QA coordination asked Release to await the final passed packet and is not deployment completion. Keep the corrected source local until a new owner instruction.

Final discovery found a genuine visibility regression: locked Analysis/Indicator previews could render when their actual card was disabled by the owner. Correction makes the saved Analysis visibility take precedence and clears a cached masked preview when hidden. A separate public `indicatorCardOwnerVisible` presentation flag preserves the owner selection across safe re-projection, while existing permission-derived `indicatorCardVisible=false` continues suppressing indicator data fetching. Full snapshot refresh copies this flag. No permission, stored visibility, approval or publishing rule changes. Actual archive/detail card rendering regressions now test hidden cards for allowed and denied viewers, plus the enabled-but-locked sample. Removed redundant narrowed visibility comparisons; no new TypeScript diagnostics.

Final card release-slice suite passed 106 tests across 8 files. Because separately held reveal/default45b4653e is NOT part of this release slice, the isolated Vite source loader supplied only the frozen aec6e1d9 premium-control module to those tests, without changing the working tree or absorbing Plans work. Config artifact: `data/watchlist-locked-card-qa/final.vitest.config.mts`; all source loading otherwise uses current actual components/projection. Chromium retest passed 18 cases (desktop/mobile portrait/landscape, Light/Navy Dark, allowed/Premium/Plans), zero page errors, zero network requests; receipt `/tmp/watchlist-locked-cards-9BUx96/result.json`. Targeted ESLint and whitespace checks pass.

Extended component TypeScript comparison now imports actual detail/archive rendering. Candidate and exact aec6e1d9 baseline both report the identical inherited missing dependency `src/modules/market-data/server/provider-settings` in the assigned donor checkout; the current canonical B52 Git source contains that module. Comparison reports ZERO new diagnostics. This is not a claim that the full donor tree or final canonical build passed. Exact canonical integration/build/CI remains a Release checkpoint; no placeholder source or provider-setting shim was added.

Completed card delta is aec6e1d9 plus this visibility correction only. Its local ancestry includes separately held45b4653e, which MUST NOT be included by blindly using HEAD. The new-ticker/default-policy and concealed-row selected-plan dependencies remain separately held as previously documented. No migration, runtime edit, hosted/configuration change, provider/AI request or Discord/email/push/X test post.


## Nov 22, 2026, 08:59 PM EST — renewed owner release authorization, repeated QA passed

Owner explicitly requested another QA, correction of any findings, then immediate deployment handoff. This supersedes the preceding handoff hold for the completed card slice. Repeated discovery found no additional defect after aa8f0f473. The same bounded release-slice suite passed 106 tests / 8 files with the frozen aec6 premium-control loader, followed by 18 actual-component browser cases, zero page errors and zero network requests. Browser receipt `/tmp/watchlist-locked-cards-J9Ftqj/result.json`, SHA256 f41dde9fb7961872880900492baea518ff6789ce0c3fe80ade915e2411fa13fc. Targeted lint and whitespace pass. The previous exact baseline/candidate TypeScript comparison remains unchanged: zero added diagnostics, one inherited donor-only missing provider-settings module; final canonical integration/build is not claimed by this result.

Release handoff now authorized for aec6e1d9eb2914406c8b0a2a6d26dba23102e1a3 + aa8f0f473edb08647983aba1dcabe0fa287d289b and this QA record, integrating only their deltas onto the actual current canonical source. Explicitly exclude intervening45b4653e new-default/reveal slice until its reader/writer dependency and combined QA are complete. Preserve current neutral public projections, indicator signals, providers, Help, stored analyses, owner edits and all access/approval rules. No migration or Runtime source change is needed for the completed card slice. No real analysis generation or notification/provider test send is authorized by this QA. A sent handoff/local commit is not deployment evidence.


## Nov 22, 2026, 09:18 PM EST — priority fix for confirmed whole-dollar preview disclosure

Release reprioritized Plans' actual probe findings over the separate B52-default rollback hardening. Corrected the shared gated-prose masker for labeled whole-dollar prices and complete linked ranges, including Support: 4 / Resistance: 5, Buy zone 4–5 / target 6, and Support is 4 and resistance is 5. Context/label and currency/decimal forms use one range-aware replacement before the existing numeric pass. Dates, times, percentages, candle lengths, ordinary counts and explicit numbered-target context are preserved. Both simplified setup and detailed currentRead public previews pass real card-render checks.

The raw Risk-note probe is NOT a bug under the original explicit owner instruction (verified by Plans/Release): Catalyst / recent news and Risk notes remain unblurred/readable, including their financial context. This correction leaves both exceptions unchanged. No broad risk masking, price mutation, AI regeneration, approval restriction or access-policy change.

Only the focused Analysis preview/render file was run: 6 tests PASS, including the new exact reported failing strings and whole valid simplified/detailed preview cases; targeted three-root TypeScript reports zero diagnostics; targeted lint and whitespace PASS. No unchanged whole-feature/browser suite was repeated. No provider/notification/hosted effect. Release delta is only premium-analysis-preview.ts, premium-analysis-layout.test.ts and this record. Store/default materialization helper and exact B52-reader regression draft remain separate uncommitted work, explicitly excluded from this urgent masking fix.
