# Full-context Watchlist analysis revision

Status: Local revision checkpoint complete; not deployed. The exact source,
verification and retained hosted gates are in the
[local handoff](watchlist-full-context-analysis-handoff.md). Historical entries
below describe intermediate findings, not the latest completion status.

## Owner-approved direction, September 11, 2026

- Review the entire analysis approach, not merely preserve the current card.
- Start with complete market context. Proposed windows: current and previous
  trading sessions at five minutes, latest 120 one-minute bars, at least six
  months daily context extended for older Levels evidence, three months four-hour
  context and the actual Levels-system observations.
- First response must provide coherent useful micro/nano-cap day-trading setups.
  Passing validators or allowing owner edits is not analysis-quality acceptance.
- Keep one provider request per generation. Optimize recurring input/output
  cost, not by withholding essential context. Testing may experiment reasonably.
- Historical audits require original request AND response; no hindsight packets.
- Preserve approvals, saved drafts, automatic-update settings, live price feeds,
  article selection and unrelated features. No hosted changes authorized here.

## Evidence retained privately

All seven owner additions now have captured original request/response evidence:
TRUG, TNON, AENT, FTFT, FEIM, BDRX and SURG. FEIM original activation has a failed
validation and no prepared payload; it is still an eligible audit case. Owner
manually refreshed FEIM; that separate generation is also captured privately.

Coordinator's bounded older-history inventory found no other paired retained
request/response. September 10 metadata cannot establish historical packet
quality. Raw exports stay private and are not committed or uploaded.

Corrections to earlier interpretation:
- TNON September 10 regular close is 5.30. The quote previous-close field still
  referred to September 9 (2.44) before regular open. Date-labelled daily candle
  is the relevant previous-session record; do not alter owner market facts.
- Owner confirms AENT 27.10 premarket high is correct. Do not discard it as an
  outlier solely because of its magnitude.
- TRUG 0.5195 must-clear cites the 07:41 ET one-minute high even though later
  supplied candles reached 0.5298/0.5299. Observation existence is not sufficient
  justification of its assigned role.

## Confirmed source findings

- One-minute display packet was capped at 60; five-minute/daily data also existed.
- Prior-session history loader returned no window when today's input lacked
  previous-session candles, so it could skip precisely the missing history.
- Daily fetch could be shorter than six months, and transport capped at 180 rows
  even when older Levels provenance required longer coverage.
- Four-hour candles and Levels inventory were absent from captured requests.
- Session coverage flags unconditionally claimed regular and extended sessions.
- FEIM original: 0.5%-of-reference buffer (~0.414) omitted 83.00 confirmation
  above 82.80 and both pullback invalidations (gaps 0.25 and 0.27). Recovery cited
  unrecognized IDs. No complete scenario survived. This explains rejection, not
  whether those proposed tight setups were good.
- FTFT retained two pullbacks but currentRead/targets were empty after processing.
  BDRX deep pullback was omitted for invalidation_order. These require sequence
  and dependency review, not automatic restoration.

## Local implementation checkpoint

Runtime parent: f9b0355dd2a774c9b68f446375a14111c97d831f in canonical runtime.
No overlapping coordinator source ownership; no local port 3010 listener.

Draft source now adds a calendar-derived previous-session window, explicit
dated prior OHLC, current/previous session extrema including latest one-minute
bars, full-session five-minute selection, 120 one-minute bars, longer daily
history, four-hour fetch/context and deduplicated Levels provenance. Outgoing
candle arrays are compacted without modifying typed validator source objects.
Four-hour observations are added to breakout/core price evidence. The analysis
module fingerprint includes the new market-context helper.

Focused checkpoint: five pure helper checks pass (calendar/holiday/DST window,
dated close, >120 session bars, session extrema/cutoff, lossless transport).
Scoped TypeScript check for helper/packet/breakout/test passes. The first tsx
launch failed at Windows userInfo before tests; an in-memory TypeScript loader
ran the five checks without server or provider access. No full suite/build.

Initial remaining-work inventory (historical; latest exits and hosted gates
are recorded in the handoff):
1. Finish loader coverage/provenance/caching, completed-candle cutoff review and
   prompt/validator consistency for four-hour and Levels evidence.
2. Replay packet construction with controlled captured-data fixtures; report
   unavailable historical intervals rather than invent them. Measure actual
   tokens/cost; compact JSON byte reduction alone is not token-cost proof.
3. Independently audit all six candle sequences; compare original and revised
   first responses with dates/reference held fixed. Capture FEIM manual refresh.
4. Redesign candidate selection/scenario semantics/template as evidence requires;
   separate structural quality from numeric ordering/precision and dependency
   removal. Do not claim a shallow percentage alone proves or disproves quality.
5. Verify one-call first-pass output, coherent retained scenarios, owner editor,
   previews and downstream compatibility. Update Help if visible behavior changes.
6. Narrow verified local commit(s), then separate owner-authorized release handoff.

No paid test requests, approval/publication, hosted settings changes, migrations,
pushes or deployments occurred during this checkpoint. Existing live additions
are running the prior deployed code, not these local draft changes.

## Subsequent local checkpoint and external QA gate

### Owner-authorized research-led implementation and API trials

#### First three paid responses: completed, not accepted

All three requests completed in one call each: TRUG 84.9s (32535 input/7184
output tokens), TNON 95.9s (29752/8819), SURG 72.8s (34237/6331).
Conservative cumulative API cost is $0.0478337; remaining allowance $4.9521663.
The private ledger is `openai-qa-ledger-20260911.json` in the existing private
artifact directory. No retries, publication or live changes.

- TRUG chose 0.463-0.4819 as its pullback and 0.53 as the main continuation,
  with no separate must-clear. Still no deep plan. Offline assembly rejected
  its newer observed 0.5299 premarket high because the guard used only 5m data.
- TNON still selected the tiny 7.90-7.96 1m pause despite also proposing a
  broader 7.141-7.471 base. This fails the requested primary dip-buy coverage.
  Offline assembly also exposed precision disagreement between section and
  final validation, and invented hyphenated dependency identifiers.
- SURG correctly described a fade and attempted recovery instead of a fresh
  breakout runner. Full substantive and final assembly review remains open.
- Fixed shared premarket-high guard to include newer 1m observations, separately
  per resolution; corrected prior-close normalization to dated daily evidence;
  aligned final zone matching with the section validator's price precision.
- Moved brief 1m acceptance candidates into momentum-only context, not the
  selectable main dip-buy list. This is a setup-role separation, not a blanket
  percentage rule. Historical Levels-area selection has a focused passing check.
- Removed duplicated breakout/target generation from the new model schema.
  Public payload remains assembled in its existing shape from the selected
  candidate; legacy mirrored responses retain their compatibility checks.
  Updated prompt dependency identifiers and instructed that recovery references
  use pullback candidate IDs only. New schema/prompt iteration not yet sent.
- Added an offline saved-response assembly script (no real fetch or durable app
  imports) to distinguish model-quality findings from postprocessing losses.
- Next: finish intermediate-upside/template contract, candidate-selection
  coverage, schema and replay checks; evaluate revised first responses under
  the same cumulative API cap. Do not call this feature complete or release it.

- Owner approved proceeding and explicitly permits changing the analysis template
  as needed, including during iteration. Preserve preview/edit/approval controls.
  The fixed staircase is not an acceptance constraint. Intermediate upside below
  the main breakout, meaningful dip/deeper-dip setups, broader failure and recovery
  remain the complete target; they are not all implemented yet.
- Removed the remaining candidate-selection requirement for a separate must-clear
  price when a complete supported breakout exists. Updated conflicting prompt
  instructions about obligatory two-pivot breakouts and absent Levels context.
- Added bounded historical Levels-area pullback candidates with exact zone
  boundaries, daily/four-hour provenance and a matching supplied candle observation.
  These remain candidates requiring structural interpretation, not automatic buys.
- Frozen Levels context now rejects calculations and zone observations after the
  generation cutoff. Added a targeted regression case.
- 29 focused Node checks pass; scoped TypeScript for packet/context/breakout and
  associated tests passes. Not an end-to-end or model-quality acceptance claim.
- Owner explicitly authorized sending the QA market packets to OpenAI, superseding
  the earlier payload-approval blocker. Then authorized further task API experiments
  within a cumulative $5 budget for today's work: notify and pause at the threshold;
  conservatively pause before a call whose maximum could exceed the allowance.
- Three refreshed private TRUG/TNON/SURG requests dispatched to the existing
  credential-owning task for standalone execution only. No app publishing or live
  configuration changes. Responses, measured costs and substantive review pending.
  No additional requests should be selected before reviewing these first outputs.

Research checkpoint: [Microcap day-trading analysis research](watchlist-microcap-analysis-research.md)
compares three independent practitioner organizations plus Fidelity, FINRA and
SEC references. It distinguishes local momentum failure from broader structural
failure, reconciles historical versus post-news level relevance, and specifies
proposed packet/quality criteria. Research and documentation only at this
checkpoint; no additional runtime edits, model calls, tests or hosted actions.
The existing trial code is not accepted merely because this research is written.

- SURG original provider response is explicitly incomplete/max_output_tokens:
  8,000 output tokens, including 6,132 reasoning tokens. Not an optional-section
  validation rejection. Preserve this distinct first-response failure cause.
- Five-minute candidate search now scans available current/prior sessions,
  requires consecutive same-session overlapping bodies, and uses majority body
  boundaries so a launch candle cannot stretch a consolidation to its origin.
- Prompt no longer calls the highest nearby shelf the required hold; broader
  structure precedes local context. Removed obsolete 60-bar/no-four-hour and
  unconditional complete-session assertions. Numeric ordering now uses arithmetic
  tolerance, not a 0.5%-of-price economic buffer, consistently in section and
  final validators. A supported continuation with failure no longer requires a
  redundant separate must-clear price to count as a complete breakout setup.
- These are trial changes, not proof of professional first-pass analysis.
- Read-only replay script compared captured candle subsets across all seven.
  Recomputed one-minute derived facts are NOT identical to original all-day
  facts because only 60 original raw bars were captured. Do not represent them
  as a reconstruction of the original runtime input context.
- Standalone historical enrichment for TRUG/TNON/SURG has 127 daily and 128
  four-hour bars each. Prior-day five-minute counts 69/79/76 cover regular hours
  only despite requesting 04:00-20:00 ET. No invented extended-hours candles.
- Prepared three credential-free private request artifacts from those cases,
  with original reference times and explicit enrichment/coverage limitations.
  Selected model/effort unchanged; trial-only output ceiling 12,000. No live
  configuration change. Request JSON byte sizes: TRUG 102407 -> 110301; TNON
  99329 -> 99346; SURG 125876 -> 108546 despite expanded historical context.
  Byte sizes are not measured token costs.
- 21 focused helper/section/fingerprint checks pass in one low-resource Node
  process. Scoped TypeScript passes for helper, packet, breakout, section,
  replay scripts and selected tests. Service/manager syntax/transpile passes;
  this is not their full semantic or end-to-end verification.
- The initial tool approval gate rejected delegated dispatch without direct
  owner approval. The owner subsequently authorized API use in this task up
  to today's $5 ceiling. The same disclosed action was reviewed and approved
  here; three private requests completed, with no publication or retries.
- TRUG/TNON/SURG first-response trials all completed at HTTP 200. Conservatively
  accounted cumulative cost is $0.0478337 (remaining $4.9521663). The private
  `openai-qa-ledger-20260911.json` records requests and usage. This ledger covers
  this task's private experiments, not all live application/account spending.
- Quality remains unaccepted: TNON still chose a tiny nearby pullback; TRUG's
  wide recovery zone and failure rationale need substantive review. Offline
  validation also exposed stale five-minute-only high checking, rounded-zone
  matching and duplicated model branch contracts. Draft corrections are not
  proof of improved first-response output. No further paid calls yet.
- Removed short one-minute acceptance candidates from the selectable dip-buy
  catalog while retaining them as momentum context. Added corroborated dated
  Levels areas as selectable candidates; unsupported areas are not invented.
  Draft schema uses one canonical breakout candidate rather than requiring
  duplicated top-level copies. Intermediate upside coverage remains open.
- Five-minute acceptance extraction now operates independently when fewer than
  12 one-minute bars are available; missing one-minute data no longer erases
  available five-minute bases. Two added regression cases cover this boundary
  and newer one-minute premarket highs while excluding future observations.
  All 10 focused market-context cases pass in a single low-resource Node run.
  No server, build, broad suite, hosted setting change or deployment was run.
- All remaining integration, model-quality, Help and release checks remain
  open. This is not a completed-feature or production-readiness claim.

## Second trial checkpoint

- Added model-only `approachCheckpoints`, independently rooted at reference,
  assembled into existing public `targets` after breakout-dependent pruning.
  Existing Platform parser and card iterate this array; owner editor accepts
  it unchanged. Owner ordering warnings now start at reference rather than
  assuming every upside price must follow the breakout. No new public field.
- Approach resistance uses arithmetic ordering, not an ATR-derived minimum
  distance from reference. It still requires observable price evidence. The
  public combined path uses the same ordering; breakout candidate objectives
  retain their own branch validation. Four dependency and six edit checks pass.
- A separate eleven-case market-context checkpoint passes, including exclusion
  of separated high-volume impulse bodies from the selectable volume shelf.
  Three unrelated advancing candles no longer become one broad recovery area.
- One new Luna/high first response for TNON, private versioned v2 packet,
  completed with 29,833 input and 8,239 output tokens. The new first response
  chose the observed 7.141-7.471 base instead of the earlier 7.90-7.96 pause.
  It supplied 8.10 approach, 8.20 reclaim, 9.30 breakout, and 9.91/10.33/11.41
  daily upside checkpoints. Full offline processing retains the analysis,
  pullback and combined approach/continuation path. This is one case, not
  general professional-analysis acceptance. The volume-shelf correction was
  made after the v2 packet was prepared; do not attribute its effect to v2.
- Cumulative conservative private API cost is now $0.06517875; $4.93482125
  remains. Subsequent calls use runtime private
  `data/analysis-replay/openai-qa-ledger-20260911.json`, initialized with all
  three predecessor entries. Do not resume the old Coordinator runner/ledger
  independently. One request per invocation, no retry, exclusive lock, and
  unknown completion keeps the full cost reservation. No live setting changed.
- Owner permits Terra comparisons when useful; Luna remains preferred and
  production model settings remain untouched. No Terra call made yet.
- Service-inclusive scoped TypeScript check reports an untouched
  `live-watchlist-audit-archive.ts:138` unknown-to-string assignment; no error
  was reported in changed files, but this check is NOT a clean pass. Preserve
  this outstanding verification boundary rather than widening the slice.

## TRUG/SURG first-response and display checkpoint

- TRUG v3 first response completed and offline processing retained both the
  0.463-0.4819 acceptance pullback and deeper 0.3751-0.3785 prior-session area,
  with 0.37 broader failure. The 0.52 approach and 0.5299 breakout remain
  distinct. The same packet includes the volume-shelf correction. These are
  conditional observed setups, not a fixed minimum-percentage policy.
- SURG v3 first response completed and retained its faded-spike/rebound
  narrative, 0.2084/0.2128 approach levels, 0.2493 breakout, 0.2684/0.2933
  four-hour levels, and separate pullback/recovery coverage. A nearby base
  after a fade is not automatically rejected because of its percentage alone.
- Six paid requests total across both experiment rounds. Conservative cost
  $0.09261407; remaining $4.90738593. No active request remains. No Terra call.
- Updated the local default output ceiling to 12,000 to match the successful
  trial envelope: TNON used 8,239 output tokens, beyond the old 8,000 default.
  Explicit environment overrides remain authoritative and must be checked at
  release. No hosted configuration changed and no automatic retry added.
- Website and deterministic Discord preview now label the primary visible
  area Pullback, a second visible area Deeper pullback, and suppress null-price
  level boxes. A lone deeper plan is still stored/audited under deep, preserving
  owner editing and recap identity. Seven owner-edit/preview checks pass.
  Platform client and Help transpile without syntax errors; rendered browser
  verification has NOT occurred. Next.js guidance was used; no dependencies
  installed, no local server or full build started.
- Help explains independent pre-breakout resistance and the possibility of
  only one meaningful pullback. Existing approval/edit/delivery controls remain
  untouched. Optional accounting notification to the release task was blocked
  by tool permissions; no cross-task message or external state change occurred.

## Follow-on consistency checks

- Corrected the scoped TypeScript command to use the repository's `strict:
  true` setting. The previously reported archive assignment was an artifact of
  that command omitting strict mode, not an archive change required by this
  slice. Strict scoped verification now passes including the runtime manager,
  generation service, owner editor and deterministic publication preview.
- New evidence-backed breakout candidates are independent of the optional
  must-clear level. Invalid must-clear ordering/text/evidence omits that level
  without automatically discarding the valid candidate. Legacy undeclared
  dependencies preserve their existing behavior. Twenty-three focused
  section/selection cases pass, including the new optional-pivot regression.
- Core and upper anchor validators now use the same dated daily previous close
  as the market packet rather than the potentially older quote field.
- Confirmed the historical trial daily/four-hour tails for all three symbols
  end September 10, before their September 11 reference times; these paid
  enriched trials do not include a later current-day daily/four-hour candle.
- Loader review confirms historical series are fetched on analysis preparation,
  not every live-price update, and current code retains stored fallback when a
  historical request fails. Provider fetches are not model calls. Coverage,
  as-of semantics and missing source intervals still need final review; do not
  claim complete provider coverage merely because a request succeeded.

## Local closeout

This local checkpoint does not complete the subsequent owner-required
whole-Watchlist acceptance described below.

- Runtime source committed at `ac5fdaa1cbf60fd4cc52f406378c6383281858d0`;
  exact 22-file allowlist and parent are in the handoff. Private runner moved
  into ignored private replay storage; no credential or raw artifact committed.
- Final committed-source service/review-store/owner-edit checkpoint passes all
  63 cases. Separate 61-case checkpoint, nine Platform element-tree/preview
  cases and six real-manager mocked private-admission workflows also pass.
  These overlapping totals must not be summed as unique coverage.
- Owner text without a price is intentionally preserved. The earlier draft
  blanket display filter was reverted; empty model levels are instead cleared
  during generation-only normalization. Tests cover this distinction.
- FTFT, BDRX and FEIM refresh saved subsets were rebuilt read-only. Missing
  daily history and old all-day derived facts cannot be reconstructed from
  their saved 60 one-minute bars. No additional paid requests were needed.
- Runtime scoped strict type check and Platform syntax checks pass. Existing
  public type and recap field identities are unchanged. Actual browser layout,
  hosted data completeness and Discord delivery remain explicit release gates,
  not claimed local proof. No new cache/provider/publisher redesign was added.
- Platform commit contains only three client heading hunks plus relevant Help,
  element-tree tests and analysis documents; older notices/layout/CSS and other
  admin-plan edits remain outside this revision.

## Whole-Watchlist acceptance reopened — September 11

- Owner explicitly requires all current Watchlist symbols, not a few examples.
  Fresh authenticated Admin console read at approximately 11:37 AM ET confirms
  nine active Main Session symbols: TNON, FTFT, TRUG, AENT, FEIM, BDRX, SURG,
  SXTC and PCLA. Top Regular and Post-Market lists were empty. The owner's older
  open tab still showed seven and an upstream error; it was not used as the
  authoritative inventory and its form was not modified.
- SXTC's authenticated read-only run audit confirms one activation request
  completed and its analysis was saved privately for owner review. Subsequent
  automatic preflight events were skipped awaiting review; they are not paid
  requests. This is workflow evidence, not proof of analysis quality or a
  replacement for capturing its full input/response.
- Pending Levels calculation-cutoff correction passed all 11 focused
  market-context tests, including exclusion of observations after reference
  time and calculations after the permitted generation cutoff. No server,
  publication, owner approval, refresh or paid API request was triggered by
  this inventory/checkpoint pass.
- Remaining: capture SXTC/PCLA full diagnostic packets, prepare and execute
  complete bounded first-response tests for the remaining symbols, inspect
  their actual candle support and rendered-section completeness, and reconcile
  results across the entire inventory. Preserve FEIM failure/refresh identity.
  Existing three paid enriched examples alone do not meet owner acceptance.

### SXTC and PCLA original packets captured

- Retrieved complete credential-redacted owner exports through the existing
  authenticated review export route, without triggering generation or approval.
  Private files are `data/watchlist-sxtc-owner-export-20260911.json` and
  `data/watchlist-pcla-owner-export-20260911.json` in this Platform worktree;
  they are test inputs, not source-commit files.
- SXTC generation `SXTC-1789140430796-zsmazpsv` has one request, one response,
  seven validation records and the prepared payload. Reference $2.3203 at
  15:27 UTC; retained raw input contains 60 one-minute, 89 five-minute and
  174 daily candles. The original model used a three-one-minute-body shelf,
  lost its overview on primary/mirror mismatch, and lost recovery on an
  unknown evidence ID. The revised offline candidate builder finds multiple
  five-minute bases, including $2.109-$2.14 and $2.08-$2.11. Selection quality
  still requires a full revised first response and comparison with the tape.
- PCLA generation `PCLA-1789140521697-woytg3xm` has one request, one response,
  six validation records and the prepared payload. Reference $11.0115 at
  15:28 UTC; 60 one-minute, 89 five-minute and 180 daily candles retained.
  Both original and current subset builders find no lower pullback candidate.
  This is a distinct breakdown case, not a successful dip-plan example: the
  latest five-minute bar fell from $12.336 to $11.415 with a $10.53 low,
  after a $15.45 regular-session high. Prior-session/historical lower structure
  must be inspected; do not manufacture a base or treat null plans as proof
  of complete coverage. The paid revised PCLA trial is still outstanding.
- Read-only subset audit script now accepts the owner-export envelope and
  reports generation identity plus diagnostic phase counts. Both files parsed
  and rebuilt successfully. No additional OpenAI cost was incurred.

### Whole-list replay and AENT first response

- Prepared private `all-nine-context-v4.json` in the runtime replay directory:
  ten cases across all nine symbols, preserving FEIM's two original generation
  identities. The preparer no longer hardcodes TRUG/TNON/SURG; it accepts all
  captured envelopes, matches enrichment by symbol/time, labels missing
  enrichment and refuses to overwrite prior trial inputs. The private dispatch
  runner rejects ambiguous symbol selection; offline response validation now
  matches the saved request hash rather than choosing the first same-symbol
  case. Scoped strict TypeScript passed for the preparer/context audit/helpers.
- AENT paid first response saved as
  `trial-aent-965cacb1-4db6-463a-868d-43dc0053a2cb-response.json` under runtime
  private replay storage. Seven total private QA calls now conservatively
  account for $0.10522857; $4.89477143 remains. No live generation/publication.
- AENT reference $7.52: retained overview, hold $7.35, caution $7.20, failure
  $7.00, five-minute pullback $7.059-$7.10, no deep plan, recovery around
  $6.99-$7.058, breakout $7.70, approach $7.56, upside $7.85/$8.12.
  Offline postprocessing retained the first response. This is NOT yet a
  quality acceptance: hold still represents a nearby immediate rebound base,
  and broader upside coverage/wording need review. The daily $7.85 high exists
  January 14/February 3 and $8.12 high December 22 in retained history; generic
  'recent daily' wording is insufficiently precise for those older anchors.
  Do not claim those prices were invented or that validator success proves
  professional setup selection. AENT lacks supplemental four-hour/prior-session
  data in this replay, so complete-context acceptance remains outstanding.

### Remaining private batch running

- Started a sequential, ledger-guarded batch for FTFT, both FEIM originals,
  BDRX, SXTC and PCLA against the same frozen `all-nine-context-v4.json`.
  Each request selects the exact original generation. No automatic retry or
  live publication is permitted. Exec session `94091` was verified live during
  this checkpoint; poll that handle rather than starting the batch again.
- FTFT response saved as
  `trial-ftft-3df1bd1e-9f3f-45c1-857d-227698fb997d-response.json`; cumulative
  accounted completed QA cost $0.11531488. FEIM was subsequently dispatched
  with the normal $0.5466 conservative reservation. These are dispatch/cost
  facts, not assertions of full quality acceptance.
- Prepared private `data/analysis-replay/enrich-missing-history.cjs` for the
  cases missing supplemental history. It fetches bounded completed historical
  daily/four-hour/prior-session five-minute bars via the existing provider,
  caches duplicate FEIM history windows, excludes current-day history and
  records provider failure without fabricating candles. Not executed yet;
  run after the sequential model batch to avoid concurrent local Node work.

### Batch complete; shared failures identified

- Session 94091 exited successfully. All six remaining requests completed once
  and were saved; cumulative private QA cost is $0.17195918, leaving
  $4.82804082. No transport-unknown request or active batch remains.
- Offline hash-matched report: `data/analysis-replay/all-nine-v4-validation.json`
  in the runtime. Includes AENT and all six new responses; the prior three
  enriched symbols remain separately recorded, not silently counted as v4
  requests. All seven new responses retained some analysis, but quality is NOT
  accepted: FTFT lost both pullbacks/overview; first FEIM lost shallow/overview;
  BDRX and SXTC lost overview; PCLA supplied neither pullback nor recovery.
- Specific mechanisms to fix, not ticker-specific rules: FTFT's exact $2.252
  zone low becomes $2.25 under cent normalization, collapsing its separation
  from $2.25 invalidation. FTFT also calls an earlier $2.75 high the current
  premarket high despite the $2.97 current high. FEIM's close zones trigger the
  pair-spacing rule. SXTC's $2.08 downside below $2.10 failure is discarded by
  volatility-based checkpoint spacing, cascading to $1.93. BDRX's cited low
  is rejected by observation matching. Several omission paths blanket-clear
  otherwise partly independent overview prose. Validate fixes using saved
  responses before purchasing another request.
- Completed bounded EODHD enrichment for all six previously missing symbols
  (FEIM window reused for both attempts), saved privately in
  `data/analysis-replay/missing-history-20260911.json`. Each symbol received 126
  daily bars; four-hour counts AENT 116, FTFT 127, FEIM 128, BDRX 127, SXTC 128,
  PCLA 127. Previous-session five-minute counts 26/79/65/24/34/79 respectively.
  These successful fetches do not prove extended-hours completeness. Original
  captured daily history must not be discarded merely because supplemental
  history uses a shorter window. No current-day daily/four-hour observations
  were requested. Rebuild enhanced inputs and verify coverage before reruns.
- Owner clarified success is a general method for active micro/low-float day
  trades, not ticker-by-ticker tuning; this is now explicit in the plan.

### Numeric corrections verified without paid reruns

- Scenario normalization now retains exact finite positive numeric prices for
  pullback/recovery fields instead of rounding their boundaries to cents before
  validation. Saved FTFT response now retains its $2.252-$2.28 deep plan with
  $2.25 invalidation. Shallow remains omitted for its incorrect current-high
  wording; no claim that all FTFT issues are resolved.
- Downside checkpoint ordering now uses numerical tolerance consistently in
  dependency admission, redundant-checkpoint pruning, final dependency assembly
  and final tactical assertion. Actual observation/text/dependency checks stay
  in place. Saved SXTC response now retains $2.08 then $1.93 below $2.10 failure,
  and its original overview survives. This corrects arithmetic rejection, not
  a mandate to crowd every analysis with nearby levels.
- The focused candidate-backed service test passes with a new regression for
  sub-cent invalidation preservation. Its older recovery assertion now expects
  the original exact reclaim, not rounded cents. Saved FTFT and SXTC offline
  postprocessing both retained analysis. No additional provider/model calls.
- Still required: display precision review, comprehensive focused checkpoint,
  broader structure-selection improvements, prose omission handling, enriched
  all-symbol trials and narrow follow-up commits. These changes are local.

### Historical bases available without a Levels snapshot

- Added bounded historical daily/four-hour acceptance candidates directly from
  three overlapping completed candle bodies when available. These supplement,
  not replace, original Levels areas and intraday candidates. Each carries its
  exact observed boundaries, source timeframe, three evidence bars, formation
  dates, later closes below the base and latest historical close. It is not
  asserted to remain support after later breaks or a catalyst regime change.
- Excludes the current day, invalid OHLC, duplicate/non-increasing timestamps,
  widely separated observations, purely directional bodies and overlapping
  duplicate areas; capped at four distinct candidates per timeframe. No ticker
  exceptions or minimum percentage rule. Fourteen focused context tests pass,
  including exact bounds, unfinished candles and later breakdown metadata.
- Actual saved PCLA daily subset now exposes older lower bases, whereas its
  intraday-only candidate set was empty. FEIM likewise has historical areas
  with many later closes below them. These findings establish available context,
  not that selecting a distant historical base is automatically a good setup.
  Revised full-context model selection still needs verification.
- Replay daily enrichment now supplements missing dates without replacing or
  shortening the original captured daily series. The actual captured observation
  takes precedence for a duplicate timestamp.

### Enriched full-list batch and precision display

- Prepared `data/analysis-replay/all-nine-enriched-v5.json` privately, covering
  all nine symbols and both FEIM attempts with matched supplemental history.
  Daily/four-hour cutoff assertion passed before dispatch. Sequential guarded
  batch is running in exec session `29029`; poll it, do not restart. TRUG's
  first enriched response is saved as
  `trial-trug-20001ded-8ee0-441a-8969-008de656acff-response.json`; TNON dispatched
  next. Completed private QA accounted cost is $0.18786664 at this checkpoint.
- Platform scenario-specific price formatting now retains up to eight decimals
  where needed, with ordinary quote formatting unchanged. Applies to pullback
  zone/confirmation/invalidation/objective and recovery figures, including
  generated state text. Prevents validated $2.252 from becoming indistinguishable
  from $2.25 on the card. Discord preview already uses the stored number.
- Added element-tree regression for sub-cent zone/invalidation separation.
  Its execution and final display check remain pending until the active model
  batch ends, preserving the low-resource single-Node work cadence. Next.js
  guidance kept the edit within existing client formatting; no routing, server
  components, styles, permissions or owner-edit controls were changed.

### Important v5 replay validity finding — do not use as acceptance

- Read the original complete TNON request again: its saved broaderSessionMove
  is $5.97 at 08:02 UTC to $9.30 at 11:48 UTC. Rebuilding derived one-minute
  context from only the retained last 60 raw bars changed that broader origin
  to the later $7.10 impulse. AENT's original broader move similarly begins at
  $6.20, not its late rebound. These original derived observations are saved;
  do not conflate incomplete raw-bar replay with the original complete input.
- This is an input-semantics issue affecting interpretation, not proof that a
  near-reference hold is good or bad by percentage. Full five-minute evidence
  must independently identify the broader session expansion, and limited
  one-minute calculations must explicitly remain window-limited. Preserve
  original captured derived facts for comparison; never overwrite the audit.
- Retired `all-nine-enriched-v5.json` from new dispatch in the private runner.
  Session 29029 has an already-dispatched SURG request that must be allowed to
  finish and polled; its next child will exit without another request. Do not
  restart v5. TRUG/TNON/AENT v5 responses saved; completed accounting at the
  last poll $0.21591461, plus the active SURG reservation. Do not claim the
  remaining v5 list completed or these trial inputs are exact original packets.
- Next: correct full-session versus one-minute-window evidence semantics,
  rebuild frozen inputs and verify original-versus-replay origin alignment
  across all symbols before purchasing more responses. The earlier full-list
  v4 trials remain useful failure evidence but not full-context acceptance.

### Session-window correction and expanded verification

- v5 terminal handle is gone; SURG's saved HTTP 200 response and ledger confirm
  completion. No additional v5 requests. Accounted private API spend after SURG:
  $0.23378972. Original audit and retired trial files remain unchanged.
- Added `observedSessionExpansion`: largest low-to-later-high advance within
  supplied same-day five-minute bars, with exact timestamps and coverage.
  Same-bar high/low ordering, prior-day bars, and future bars cannot create an
  advance. It is context, not automatic support, catalyst origin, or failure.
- One-minute evidence now records its observed window and explicitly limits
  `broaderSessionMove` and approximate VWAP to that window. Prompt instructs
  comparison with wider chronology before assigning structural roles.
- Read-only recalculation across all ten cases confirms TNON $5.97 to $9.30,
  TRUG $0.3707 to $0.52, and AENT $6.20 to $27.10 in five-minute coverage.
  These are not necessarily the newest one-minute extrema or selected setups.
- Context tests: 16/16 pass. Scoped strict TypeScript passes. Platform card and
  owner preview node checks: 10/10 pass, including exact $2.252 versus $2.25
  scenario display. No servers, builds, Vitest, migrations, or deployment.
- Owner requested more testing, including fresh market-price/volume reads.
  Fresh authenticated UI confirms all nine held for review, review required ON,
  automatic AI updates OFF. No controls changed and no live refresh dispatched
  yet; live refresh still uses deployed source, not the local revised method.
- Rebuilt exclusive private `all-nine-enriched-v6.json` with corrected window
  semantics; dispatched sequential first-response batch for all nine symbols
  plus both FEIM captures under the enforced private $5 cap. This is ongoing
  experiment work, not an acceptance claim. Fresh-price captures and complete
  output/omission audits remain required.

- Active v6 batch handle: exec session `12601` (poll, never restart on a wait
  timeout). TRUG and TNON first responses are saved; AENT is dispatched at last
  confirmed poll. Completed private accounting $0.26839209 plus active reserved
  maximum $0.5466. TRUG raw response includes main/deep/recovery scenarios;
  TNON remains centered on the later $7.14-$7.47 base and omits a deep reset.
  Neither raw HTTP success nor section presence proves quality acceptance.
- Found a second evidence-scope mismatch: `observableCandleEvidence` discarded
  all but the last 48 intraday bars, despite supplying full-session evidence to
  AI. Matching now uses every supplied usable bar, while range-based tolerance
  still uses the recent 48; no tolerance widening. Added a fake-response service
  regression for an earlier $0.7089 checkpoint. Execution deferred until the
  sequential API batch ends (one local Node process at a time).
- Next private comparison can test Terra on the same ambiguous full-context
  cases before adding more prompt rules; owner explicitly permits both models.
  The live refresh permission is confirmed, but fresh capture/accounting must
  remain separate from revised-method first-response validation and must retain
  the enabled owner-review gate. No live refresh has been clicked yet.

### v6 whole-list first-response checkpoint

- Session `12601` completed with exit 0. All ten cases (all nine symbols and
  both FEIM captures) have saved responses. Accounted private total $0.378192.
- Offline `all-nine-v6-validation.json` completed in session `5467`, exit 0:
  10/10 retain an analysis. TRUG, SURG, FTFT and SXTC retain both pullbacks;
  the other cases retain one. This is mechanical validation, not semantic
  acceptance. FEIM twice and BDRX lose overview text after an optional-section
  omission; the current legacy whole-paragraph dependency policy explains it.
- Earlier five-minute checkpoint regression passes (one fake-response test,
  one request, zero paid calls). BDRX $0.7089 now retains intraday evidence in
  the full replay. Help reviewed: existing guide covers optional sections,
  deeper-only pullback display and owner editing; these internal context and
  precision corrections require no additional member instructions.
- Owner clarified the deeper-only suggestion was commentary on SURG, not an
  instruction for a blanket distance filter. No new percentage/range filter
  has been implemented. A valid deep section is independently retained when
  shallow is absent; do not conflate this with a semantic selection guarantee.
- Official Terra pricing verified at
  https://developers.openai.com/api/docs/models/gpt-5.6-terra : $2 input,
  $0.20 cached input, $12 output per million; cache writes 1.25x input.
  Private runner now supports a bounded same-input Terra comparison, with
  cache-write-inclusive upper accounting and $1 reservation per request.
  No runtime model setting changed.
- Terra comparison source `all-nine-enriched-v6-terra.json` differs only in
  request.model. Sequential TNON/SURG/first-FEIM comparison is active in exec
  session `43434`; TNON dispatched at 16:36:29 UTC with request ID
  `641db459-949f-43b7-af85-1bd49ad0e07e`. Poll, do not restart.
- Fresh live controls at approximately 12:33 ET again confirmed review ON,
  automatic updates OFF, all nine held, and Discord thread IDs pending.
  No live refresh has been clicked. Fresh capture/testing remains outstanding.

### Fresh-price test reservation

- Owner authorized manual fresh reads. Before one TRUG refresh, rechecked live
  required review ON, automatic updates OFF, all nine unapproved, and server
  daily guard ON ($0.6861 known, $1.19 guarded, $1.76 remaining). Reserve the
  entire $1.76 remaining server allowance conservatively for this live test
  outside the currently running private ledger writer. Reconcile its actual
  request IDs/cost before any additional paid batch; do not double-count older
  owner requests. Current private Terra batch has only FEIM remaining, so even
  its full $1 reservation plus this live allowance remains below the $5 cap.
- The live request uses deployed code only to obtain a fresh price/volume
  packet and baseline, not to prove the local revised method. Keep the saved
  original draft history and owner publication gate intact. Do not approve.

### Terra comparison, overlap correction, and fresh TRUG capture

- Terra session `43434` completed exit 0. Three same-input responses saved:
  TNON `641db459-949f-43b7-af85-1bd49ad0e07e`, SURG
  `c162d407-7132-4c03-9765-fb85701c9ddb`, FEIM
  `17513f0b-daa0-4010-b74c-8a4b87fe8b71`. Private total $0.7891779.
- TNON offers the wider $6.147-$6.25 deep base alongside $7.141-$7.471;
  SURG treats the nearby base as a bounce and the historical lower area as
  post-failure recovery rather than forcing dip fields. These differing
  scenarios are useful evidence for an adaptable template, not yet whole-list
  Terra acceptance or a runtime model change.
- FEIM's distinct $79.159-$79.99 and $80.181-$81.35 bases were incorrectly
  called overlapping by percentage/range buffers in TWO validators. Replaced
  both pair and final-map buffers with arithmetic ordering tolerance. Actual
  overlaps still reject one branch, and independent evidence requirements
  remain. No minimum reference-distance filter added. Fifteen focused section
  tests pass, including true overlap, independent deep retention, and FEIM.
- Offline `terra-v6-pair-final-validation.json`: all three retain overview and
  coherent sections; FEIM now retains both pullbacks. Earlier intermediate
  `pair-correction` report records the duplicate final-check failure and is
  superseded, not erased. Existing saved responses were reused for both checks.
- Clicked ONLY TRUG Refresh AI Read once, approximately 12:41 ET. Deployed
  Luna request `TRUG-1789144883016-gxn68cld` returned HTTP 200 incomplete,
  reason `max_output_tokens`: 30,552 input, 8,000 output, 6,079 reasoning.
  Owner gate held; UI Discord thread remains pending. No approval/repost.
- Exact fresh audit saved privately in Platform `data/` as
  `watchlist-trug-midday-owner-export-20260911.json` (218,833 characters).
  Contains request, response, two validation records. Do not commit it.
- Imported this live request once into private ledger with conservative
  $0.078552 (higher deployed estimate; official token calculation is lower).
  The earlier $1.76 external reservation is released/replaced. Total QA
  $0.8677299, remaining $4.1322701. No new paid process currently started.
- Next: finish same-input Terra coverage for remaining seven captures, rebuild
  fresh TRUG input using the current pipeline, run bounded fresh-price tests,
  finish focused regression/semantic audit and narrow local commit/handoff.

### Whole-list comparison continuation

- Rechecked assigned Platform HEAD `c110782d` and the exact runtime dirty-file
  inventory; no local listener on 3010, no server or deployment started.
- The full focused service checkpoint after both overlap corrections passed
  44/44 tests, including earlier-session candle matching. Both worktrees pass
  `git diff --check` (Platform emits only its existing line-ending warning).
- Remaining seven same-input Terra requests are running sequentially in session
  `19190`, with the existing date-specific $5 ledger guard and no retries.
  TRUG, AENT and FTFT responses have completed; FEIM refresh is in flight.
  Accounted completed QA cost at that point is $1.2244605; pending reservation
  remains additional. This is not account-wide production billing.
- Inspected AENT's supplied earlier candles: its $27.10 spike is not merely
  an isolated high field; subsequent five-minute bars record closes $18.50,
  $16.53 and $12.735 before the later decline. Preserve this chronology when
  judging the current recovery instead of treating AENT as an untouched runner.
- Fresh TRUG exact input has reference $0.622 at `1789144860000`, 104 supplied
  five-minute bars from premarket through 16:35 UTC, 50 daily bars, and 60
  retained one-minute bars. A private preparer now combines these with earlier
  completed historical supplementation, preserving fresh captured bars on
  duplicate timestamps and explicitly recording the older four-hour cutoff.
  Execution and paired fresh-price responses are still pending; no additional
  live refresh, approval, publication or Discord delivery has occurred.
- Owner permits per-ticker template simplification. The supplied external TRUG
  example is a readability/coverage comparison, not verified level evidence.
  Current tests must still distinguish local shelves, material bases, broader
  failure, and post-failure recovery using each frozen packet.

### All-symbol paired results and temporal-text correction

- Session `19190` completed exit 0: ten Terra first responses now match the
  ten Luna cases (nine symbols, separate original/refresh FEIM). Paid QA total
  after this batch: $1.7463148. No model setting changed on the runtime.
- Offline `all-nine-terra-v6-final-validation.json` and
  `all-nine-luna-v6-final-validation.json` each retain 10/10 analyses. Both
  models now retain first-FEIM's distinct two bases. Luna FEIM refresh retains
  both bases but loses breakout/overview; Luna BDRX loses deep/overview. Terra
  retains BDRX's two intraday bases and overview, but loses TRUG's overview.
  These reports establish mechanics, not blanket professional acceptance.
- Terra output differentiates continuation (FTFT), post-spike rebound (AENT,
  BDRX, SXTC), and recovery without forced dip fields (SURG, PCLA). TNON has
  both wider bases. FEIM's current post-gap bases remain close to reference;
  their repeated five-minute acceptance, not percentage alone, is the stated
  evidence. Do not claim every response is fully calibrated from these cases.
- TRUG's omission is traceable to `mustClear` text: "$0.52 premarket high was
  crossed briefly" is misread as the CURRENT high despite the later $0.5299
  high. Added a narrow past-crossed/cleared/surpassed/exceeded distinction in
  the high-claim parser; explicit current/today's claims remain checked and
  numerical anchor checks are unchanged. Added a regression pairing a valid
  former-high statement with an invalid explicit current-high statement.
  Tests and saved-response replay pending until the paid process finishes.
- Fresh TRUG replay prepared: reference $0.622, 127 daily, 128 four-hour,
  114 five-minute and 60 retained one-minute bars; limits recorded privately.
  Sequential Luna/Terra session `54335` is active. Luna completed at total QA
  $1.76271897; Terra is in flight with its separate $1 reservation. Poll this
  exact session, do not restart. Live owner state remains unchanged.

### Verified runtime follow-up saved locally

- Both sessions `54335` and `56458` completed exit 0. No paid process remains.
  Final accounted QA total $1.90986467, remaining $3.09013533.
- Both midday TRUG responses retain overview and analysis. Terra intentionally
  returns shallow null and deep $0.5552-$0.576, with a $0.69 breakout; no
  optional omission is needed. Luna retains two zones and a nearer $0.6295
  continuation pivot. The difference remains part of semantic assessment.
- `all-nine-terra-v6-temporal-validation.json`: all ten morning cases retain
  analysis AND overview after the surpassed-high parser correction. No extra
  provider request was made for this revalidation.
- Focused service tests 45/45, context/section tests 31/31, scoped strict
  TypeScript for the four AI modules, and whitespace checks pass.
- Runtime commit `02e5ee6a62169e015749c6bb906d0631087723ed`, parent
  `ac5fdaa1cbf60fd4cc52f406378c6383281858d0`, records the exact eleven-file
  slice listed in the handoff. Runtime tracked worktree is clean; private
  data and pre-existing untracked items remain untouched. No push/deployment.
- Goal stays open: complete semantic acceptance and Platform precision/docs
  checkpoint before presenting the final local handoff as complete.

### Platform precision checkpoint

- Staged only five precision hunks in `live-watchlist-client.tsx`; separate
  title, notices, Company Info/Potential Gain layout and CSS remain unstaged.
- Strengthened the regression to check the rendered Zone and Invalidation
  fields separately: `$2.252-$2.28` must not collapse onto `$2.25`.
- Ten card/preview tests pass against the working file and against the exact
  staged client source. These are element-tree checks, not hosted CSS proof.
  The first index check hit Git's sandbox ownership guard; a process-scoped
  safe-directory setting allowed the same check, without global config changes.
- Next.js boundary review: no server/client prop, routing, data-fetching or
  asynchronous component change. Help reviewed at its optional-section,
  deeper-only and editing guidance; no additional copy is needed for precision.
- Final semantic acceptance remains open. In particular, distinguish model
  selection quality from the mechanical retention results; do not claim
  professional calibration merely because the validator accepts the response.

### Paired assessment and preservation closeout

- Completed [paired quality assessment](watchlist-analysis-paired-quality-assessment.md)
  against the frozen inputs and responses, with all nine symbols and midday
  TRUG represented. Recommend Terra for the initial reviewed trial; no live
  setting changed and no automatic second-call fallback introduced.
- Platform precision checkpoint saved at
  `e0bdd4dfff20203ab56fc56382354846e2dc8fc9`, parent `c110782d`.
- Fresh owner-edit/store/preview tests pass 22/22. Ten selected manager tests
  pass for ON private admission across all sessions/direct and queued paths,
  OFF normal publication, held replacement, automatic OFF and queued recheck.
  All destinations/providers are mocked; no real publication was attempted.
- Actual local recap draft consumes posted/high/latest price facts, not changed
  scenario fields. Richer analysis-based recap implementation is absent here;
  do not claim live richer recap proof from this source. Nullable saved scenario
  identities and shared types remain unchanged for integration.
- Remaining hosted acceptance is explicit in the handoff: exact-parent
  integration, output-cap setting, selected model, backup, build/health,
  desktop/mobile preview and controlled initial/replacement publication.
  No permission to execute those gates is inferred from local completion.
