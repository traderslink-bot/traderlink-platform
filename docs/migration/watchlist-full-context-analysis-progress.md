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
