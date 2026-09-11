# Watchlist Analysis Quality Progress

Plan: [Watchlist Analysis Quality Plan](watchlist-analysis-quality-plan.md).

Status: implementation and acceptance incomplete. This is an append-only-style
chronological working history, not a current release manifest. Earlier entries
describe their checkpoint, including limitations later superseded by newer work.
Use the [acceptance inventory](watchlist-analysis-quality-acceptance-checkpoint.md)
for remaining requirements; do not treat an old "not yet wired" note as current
without inspecting source. No live completion is claimed by local test results.

## Latest local checkpoint bookkeeping

### Must-clear evidence and local omission checkpoint

- Added strict internal `mustClearEvidence` schema/prompt with observed-level
  or confirmation-above basis. Declared anchors use numerical observation
  precision. Legacy responses must match observed prices directly instead of
  passing on tape-like wording. Unsupported evidence or a missing explanation
  omits the breakout branch and dependent content, not independent valid setups.
- Proof and reasons use the existing captured/permanent validation decision
  path. Internal evidence does not become a public card property or constrain
  owner edits. The earlier pivot remains distinct from breakout continuation.
- Synthetic base/premarket fixtures now explicitly declare their proposed
  confirmation thresholds rather than claim they were tested prices. No market
  observations or levels were added. A service case proves unsupported
  must-clear evidence clears that branch but keeps the valid deep setup.
- Forty-three service/core tests passed, followed by four focused core tests
  including missing explanation. Strict service TypeScript passed. Audit
  assertions were updated for the additional evidence record: seven captured
  records are still one AI request, not seven calls. No live actions occurred.
- Legacy continuation evidence, complete unsupported-text attribution, economic
  calibration and remaining acceptance inventory are still open. No new Help
  workflow/UI control was introduced; existing partial-omission guidance applies.


### Declared core-anchor numerical precision checkpoint

- Declared core anchors now match unambiguous candle OHLC/prior close using
  existing two/four-decimal numerical precision only. A wide candle cannot
  enlarge the matching radius. Explicit lower-threshold derivation remains
  valid; no arbitrary minimum percentage or new owner-edit restriction was added.
- Legacy response formats without `coreEvidence` retain their existing direct
  observation-tolerance compatibility path. This distinction is intentional;
  it does not mean new declared anchors can use that wider tolerance.
- Tests prove wide candles do not authorize a different anchor, rounding-level
  differences remain accepted, and future/conflicting observations are excluded.
  The service rejects a claimed 0.94 anchor when the supplied low is 0.95 while
  still accepting an explained 0.91 threshold derived from 0.95. Forty-two
  core/service tests and strict service TypeScript pass with mocked providers.
- Semantic setup quality, explicit source IDs, legacy breakout/must-clear
  grounding and broader calibration remain open. No UI/Help workflow change,
  live request, migration, deployment or hosted configuration occurred.


### Core observed-level versus derived-threshold checkpoint

- Replaced the needs-to-hold/caution/failure wording-only evidence check with
  numeric anchor validation. New strict generation schema/prompt requests
  `coreEvidence`: anchor price, observed-level or lower-threshold basis, and
  explanation. Lower decision thresholds can differ from traded prices without
  being falsely called observed levels. Existing core ordering and scenario
  validation still apply; unsupported anchors and unexplained/incorrectly
  directed thresholds reject that generation without another paid request.
- Legacy generated responses without metadata must match observed prices
  directly; missing metadata is not an evidence bypass. Previously persisted
  member cards and owner editing are unchanged. Proof/decisions are captured by
  the existing permanent original-validation callback and temporary diagnostics,
  not exposed as a public card property.
- Three premarket fixtures relied on unobserved proposed thresholds and were
  updated to declare that derivation from their actual supplied 0.325 low,
  without changing the levels or inserting market data. Forty service/core
  checks passed. A subsequent service integration check also passed: unsupported
  legacy threshold fails, explicitly anchored threshold succeeds, unsupported
  anchor fails, and exactly three requests occur for those three generations.
  Strict service TypeScript passed.
- Core numeric provenance is not proof of trading merit or every textual claim.
  Anchor matching currently uses the existing observation tolerance; joint
  microcap selection/calibration, explicit source IDs, and whole-card narrative
  dependency checks remain open. Must-clear/legacy breakout validation remains
  a separate acceptance boundary. No UI control/Help workflow change, owner-edit
  restriction, live setting, migration, paid call or deployment occurred.


### Shared unambiguous price-observation checkpoint

- Added one price-observation filter used by reference selection, model-packet
  candle normalization, checkpoint matching and breakout evidence construction.
  Positive finite ordered OHLC and an at-or-before reference timestamp are
  required. Conflicting OHLC at the same timeframe/timestamp excludes that
  observation regardless of volume or input order; identical price duplicates
  remain usable. Packet volume selection among identical prices retains the
  existing highest-reported-volume behavior.
- This closes the differing duplicate/future handling between these paths.
  Breakout evidence now checks the complete OHLC, not only high/low. Its old
  high/low-only synthetic fixtures were completed with explicit valid OHLC;
  invalid range/conflict cases remain invalid. No historical market facts were
  manufactured or altered.
- 56 service/price-action/breakout checks passed with one worker. A subsequent
  direct packet/catalog consistency check passed; strict service TypeScript
  passed. All generation checks use mocks, and no additional provider call,
  hosted configuration, new persistence store or migration was introduced.
- This is groundwork for core evidence, not its completion: proposed thresholds
  may differ legitimately from observed anchors. The core lexical bypass,
  explicit observed-versus-derived threshold contract, economic tolerance and
  complete narrative dependency checks remain open. Help workflow is unchanged.


### One-minute checkpoint evidence and future reference checkpoint

- Checkpoint observation matching now includes supplied one-minute candles,
  with the existing positive/finite OHLC, time cutoff and conflicting-duplicate
  safeguards. Evidence identifies its one-minute source. This preserves useful
  finer-grained observations without inventing a five-minute match or spending
  another request. Existing intraday/daily matching remains available.
- Twelve mocked generation cases cover upside/downside one-minute observations,
  identical duplicates, future bars, malformed OHLC and conflicting duplicates
  in both orders. A failing future-bar case exposed a separate reference-price
  issue: general candle normalization allowed five minutes of clock tolerance
  and reference selection could choose that future bar. Reference selection
  now explicitly filters against its reference time for both 1m and 5m.
- All 35 service checks passed after the correction; one additional direct
  reference-selection test then passed for both timeframes, including the
  fallback when only a future bar is supplied. Strict service TypeScript passed.
  No live/provider experiment was performed. This is not a calibration claim
  for every microcap setup or a fix for conflicting reference duplicates.
- Core-level evidence, tolerance calibration and final narrative dependencies
  remain open. No owner-edit restrictions, new UI or Help workflow were added;
  no hosted action, migration or production configuration changed.


### Upside price-evidence checkpoint

- Confirmed that `TAPE_EVIDENCE_LANGUAGE` previously let upside prices pass
  solely because their labels/conditions said words such as holds or daily high.
  Removed that bypass from ordinary upside normalization, candidate-dependent
  objective validation, and the final upside assertion. A matched prior close
  or eligible candle observation is now required for those prices.
- Unsupported points are omitted locally, without a second request or loss of
  independent core/pullback sections. Candidate dependency checks still remove
  dependents of an invalid objective. The full original response and recorded
  normalization/selection decisions remain available for owner review/editing.
- One fixture incorrectly relied on a 2.20 daily-high assertion with no matching
  price observation. It now proves rejection without that observation and
  acceptance after adding a real matching candle to the mock input. Earlier
  1.80 word-only expectations were corrected to omission; observed farther 2.30
  resistance remains retained. All 34 service checks and strict service
  TypeScript pass, using mocked providers only.
- This does not close core-level word-only validation, one-minute evidence
  coverage, observation tolerance calibration, supplied-map-only provenance,
  or complete prose/dependency acceptance. Do not claim all setup-quality
  checks complete. No change to owner edits, model choice, hosted settings or
  provider costs was made. Existing Help already explains partial omissions.


### Delayed live-data replay checkpoint

- Review approval alone allowed legacy queued live data to publish after
  removal. Manager authorization now requires an active ticker or the normal
  `activating` preparation state for non-removal patches. For new admissions,
  payload timestamps must not predate the saved admission decision. Approval
  probes and legacy rows without admission metadata remain compatible.
- Disposable outbox restart coverage queues both a card and a quote while
  offline, removes the ticker, then re-adds it. Neither old payload sends;
  a current activation card and current live quote do send. Existing quote
  coalescing replaces the old queued quote with the new one; the stale card
  remains held. The initial assertion incorrectly expected both old records
  retained and was corrected without changing coalescing behavior.
- Ten selected manager tests pass: both replay scenarios, the 72-case OFF
  admission matrix, legacy replacement workflow, and six private re-addition
  workflows. Strict manager TypeScript passes. No actual HTTP/AI/Discord call,
  migration, deployment or live setting change occurred.
- Already-in-flight remote writes and public read/cache integration remain
  open; dispatch-time checks do not prove remote ordering. No Help copy or
  owner control change is needed for this stale-data transport correction.


### Delayed removal versus re-addition checkpoint

- The manager now rejects deactivation patches while a ticker is active, and
  rejects removals older than its latest saved admission time (legacy fallback:
  activation time). This check also covers old snapshot-bearing removal patches,
  not just the new content-free form. Runtime HTTP and outbox checks both use
  the manager policy before dispatch.
- A real disposable outbox restart test proves an old queued removal cannot
  remove a re-added ticker; unrelated publication continues. After that ticker
  is removed again, the old removal stays blocked while a newer removal sends.
  The obsolete queue record remains retained and unacknowledged. No queue
  cleanup/deletion or new retention policy was introduced.
- Two focused manager/removal replay checks and strict manager TypeScript pass.
  These are mocked transports, not proof against a request already accepted by
  the remote server. Delayed live-card/ticker-data replay and in-flight server
  ordering remain separate open acceptance items. No UI/Help change is needed
  for this transport correction; no hosted action occurred.


### Content-free reviewed-ticker removal checkpoint

- Inspection found that ordinary website removal built a level snapshot and
  then used the same publication guard as new data. A held review could block
  removal; bypassing the guard for any deactivation would instead risk exposing
  that private snapshot. Reviewed-ticker removal now emits only symbol, removed
  status, timestamp and empty cards. Previously published data remains the
  website archive source; private prepared levels are not read for this patch.
- Policy permits only this exact content-free removal shape even with missing
  review evidence. Attached cards, prices, extra fields and live status do not
  receive the exception. Runtime manager and configured HTTP publisher share
  the same policy. No Platform schema or hosted changes were needed.
- Six policy tests plus two focused manager/HTTP mocked transport checks pass;
  strict manager TypeScript passes. This is not an end-to-end hosted cache or
  archive proof. Delayed outbox removal versus a newer activation/approval and
  full concurrent removal/publication still require acceptance review.
- Help already says reviewed drafts stay private and covers Watchlist removal;
  no new owner control or user-facing workflow was introduced here.


### Removed-ticker review gate checkpoint

- Ordinary re-addition previously inherited `publicationReview` from the
  inactive entry. That stale required gate could block normal publication when
  the new admission had AI OFF. The normal direct/queued paths now detach that
  old gate before thread creation; no review history files are changed or removed.
- The 72-case OFF matrix now includes 36 inactive, previously held re-additions
  alongside 36 fresh additions. Seven selected manager checks pass, and strict
  manager TypeScript passes. The six private workflow cases were then extended
  with a real prior approved cycle: each creates a different unapproved cycle
  while historical original/approval data remains unchanged and accessible.
  All six extended cases pass (mocked AI and delivery only).
- This proves the local admission gate behavior, not hosted cache invalidation,
  concurrent removal/publication races, or old public-card replacement. Those
  remain in the acceptance inventory. No production actions occurred.


### Admission-time generation decision checkpoint

- Confirmed a gap: ordinary activation scheduled its initial request after
  awaited preparation using current settings, without retaining the OFF
  admission decision. Saved `aiReadAdmission` now records the original time,
  session and initial-generation permission for direct, queued and private
  additions. Public admission methods replace caller-supplied metadata.
- An OFF admission cannot receive an activation-triggered request after a
  settings/session change. Manual refresh and separately enabled follow-ups
  retain their current permission checks. Existing legacy rows remain compatible;
  malformed admission records cannot authorize an initial request.
- Existing Watchlist state persistence saves/reloads this metadata; no migration,
  hosted storage, live setting or provider call was introduced. Help aligned.
- Eight selected mocked checks passed with one worker: 72 direct/queued,
  Main/Top Regular, master/session OFF combinations including settings/date
  changes during preparation; six private-admission workflow cases; one
  save/reload and malformed-state case. Scoped strict manager TypeScript passed.
- The first test invocation's final result was not retained; its exact process
  was confirmed absent before the completed verification above. No process
  was stopped. Existing-cache/removal/re-add and full startup acceptance remain
  open; this checkpoint does not claim those scenarios or production readiness.


- Corrected an OFF-admission QA weakness: the earlier fixture implicitly had
  review mode OFF because no review store was supplied. The revised fixture
  explicitly enables review mode and asserts it, then exercises direct/queued
  additions across three sessions, Main/Top Regular and OFF/ON, ON/OFF, OFF/OFF
  (36 combinations). All complete normal publication with zero AI calls.
  Queued manual adds return an acknowledgement before completion; test now awaits
  the actual pending activation promise and reads final store state. No runtime
  behavior change was needed. One focused matrix test passed; no live calls.

- Fixed diagnostic retention marking every validation phase complete. Only
  transport failure, explicit failed validation or saved prepared payload now
  creates a completion marker. Intermediate optional-section, valid-core and
  usage records remain protected from expiry/space reclamation. Seven focused
  audit-store cases and strict module TypeScript pass, using disposable stores.
  Owner revision directories are not enumerated by diagnostic cleanup. Missing
  terminal artifacts/capacity recovery and operational indexing remain open;
  no live retained diagnostics were deleted or modified.

- Export/inspector now reports separate captured-record counts for input,
  response, validation, prepared payload and transport error. Counts are derived
  only after exact selected-generation/ticker diagnostic identity checks. A
  zero explicitly means no available record, not no provider activity. Missing
  response/prepared stages can no longer hide behind a generic available label.
  Eight focused export/panel checks and strict scoped TypeScript pass. Existing
  API-attempt counts/cost and permanent original validation remain separate.

- Extended revision-aligned omission status to rejected/absent breakout,
  selected-branch target removals, optional outer-daily omission and narrative
  explicitly removed by branch selection. A valid backup alone is not an
  omission; unused-primary target errors do not count against the alternate.
  Point/risk removals accumulate across stages. Owner-supplied replacement
  entries reconcile counts without reapplying generator price restrictions.
  Six pure reconciliation checks plus 34 service checks (40 total) and strict
  service/helper TypeScript pass. Service now captures omitted branch narrative
  explicitly, avoiding inference from absent overview fields in older records.
  Rendered integration, legacy incomplete metadata and broader claim/dependency
  quality remain separate acceptance concerns.

- Added display-only published omission reconciliation for recorded optional
  section/objective/overview and checkpoint-normalization removals. It follows
  the approved draft's parent chain to its own immutable original; natural
  optional absence does not count. Owner restoration and hiding are reflected
  without restricting edits or publication. Nine focused manager/pure checks
  and scoped helper TypeScript pass. Breakout-selection/outer-extension decisions,
  broader ambiguity handling and rendered status acceptance remain open.

- Integrated runtime-manager strict TypeScript check passed with the 512 MiB
  cap. Found/fixed completed-generation-without-draft status falling through to
  an older Published label. It now reports Analysis storage needs attention.
  The manager fixture injects an actual draft-save failure after a mock provider
  result: old draft hash preserved, zero analysis publication, one request only,
  automatic repeats held. Selected fixture passes; no real storage was damaged.

- Documentation preservation checkpoint: reviewed and registered the controlling
  plan, this chronological history, and the separate cutover plan in local Git.
  Removed the obsolete runtime-workspace authorization instruction; preserved
  after-market live approval and no-local-preview boundaries. Inspected runtime
  ancestry `9bc3124..e3f5c49`: it contains the recorded analysis-quality sequence,
  not permission to publish that entire range. Platform source remains mixed.
- Latest source-only checkpoint: runtime
  `e3f5c499fa9718d2cda1e3288e396e73c49d5b06`, Platform
  `2bed10b632971eeb9d041680a016752266b4910a` before this docs-only checkpoint.
  Production topology remains an earlier inspection, not freshly verified here.

- Checkpoint candle matching now uses the frozen data-as-of cutoff, positive
  finite coherent OHLC, sorted observations and timestamp conflict exclusion.
  Identical valid duplicates remain usable; malformed duplicates invalidate
  that timestamp rather than permitting an arbitrary surviving version.
  Seven source variants pass within the focused service fixture; 34 service
  tests and strict service TypeScript pass. Existing Help already describes
  recorded optional omissions; no new owner interaction or Help copy required.
  Upside/core lexical bypass and complete dependency validation remain open.

- Downside checkpoint price validation no longer accepts evidence-sounding words
  alone. It requires an observed candle/prior-close match or containment in a
  supplied support zone (single-price zones retain their representative price).
  Unsupported checkpoints are omitted locally and normalization is audited.
  All 33 service checks passed; exact audit counts now include the additional
  normalization record. Strict typing caught optional zone edges and was fixed
  with the source representative-price fallback. Broader upside/core semantic
  wording, candle-quality/time bounds and omission dependencies remain open.

- Runtime `379d422`: eight-file validation-provenance checkpoint; all 45 focused
  service/store tests and eight inspector/export tests passed, plus the selected
  manager provenance case and strict service/store TypeScript. No live changes.

- Validation decisions now travel from service to immutable original-review
  metadata independently of temporary diagnostic capture. Original decisions
  cannot be replaced under the same generation ID; owner edits remain separate.
  Inspector reads saved original decisions when diagnostics are absent, without
  fabricating request counts/costs. No new storage service or migration.
- Three focused provenance/service/manager cases and eight inspector/export
  cases passed; strict service/store TypeScript passed. Fixture credential
  `test-key` accidentally matched existing `test/tests` evidence-language regex;
  changed redaction fixture to a neutral credential. The underlying lexical
  evidence weakness remains part of semantic validation acceptance, not fixed here.
- Final published-with-omissions classification remains open: generation
  decisions must be reconciled with the exact owner-approved version, not simply
  carried forward after an owner restores/changes a section.

- Review queue now gives a newer started/failed generation precedence over an
  older approved/delivered draft. Preparing/failed replacement labels preserve
  access to the prior version. Seven focused real-manager mocked workflows pass,
  including direct/queued admissions across all sessions and legacy adoption.
- Published-with-omissions remains open: optional absence is not proof of a
  validation omission, and owner restoration must not retain a false final
  omission label. It needs durable revision-aligned validation provenance.

- Separated public data permission from automatic request eligibility. Required
  review cycles with an unapproved draft or a newer generation attempt (including
  failed attempts) block automatic repeats, even when a legacy public analysis
  remains visible. Manual refresh remains allowed. Eight real trigger names are
  covered by the manager fixture, with zero extra mock AI calls. Approval restores
  automatic eligibility when ON; OFF still blocks and preserves boundary settings.
- Seven focused manager checks passed before expanding the trigger inventory;
  the expanded legacy replacement case passed again. This is central dispatch
  evidence, not full scheduler/process restart or hosted acceptance.

- Runtime local commit `e0801cc` closed a legacy public ticker replacement-review bypass: central generation
  now starts/persists a required replacement review before dispatch when review
  is enabled. Immutable begin metadata preserves existing non-AI publication,
  not a fabricated historical approval. Explicit AI writes/removal remain held.
- Ten focused mocked checks passed: manual legacy replacement and OFF transition,
  six existing private direct/queued session cases, legacy/malformed policy,
  original frozen-cycle behavior and replacement-policy store reconstruction.
  No port-3010 listener was found; no local runtime was started. Full automatic
  replacement, hosted retention and process restart acceptance remain open.

- Runtime `3c3c600` preserves admission matrix; Platform `dbfa52309` updates
  the acceptance inventory. Private ON/ON workflow now also exercises queued
  additions across all three sessions (six direct/queued cases pass).
- Read Platform list and detail handlers: both read ingested LiveWatchlistStore
  data, not runtime private drafts. Added HTTP boundary proof that pending card
  and typed quote/data payloads never reach transport while unrelated symbols
  continue. This supports the publisher-boundary design but is not a live route
  or existing-cache/re-add concealment proof. Strict focused gate-test typing
  passes after correcting an initially incomplete quote fixture.

- Runtime `748ec14` and Platform `1394df9ef` preserve recorded request/cost
  inspection; 37 focused service/panel checks passed at that checkpoint.
- Added actual manager activation coverage for master OFF/session ON, master
  ON/session OFF and both OFF across premarket, regular and postmarket, for
  Main and Top Regular (18 combinations): active normal website/card and
  Discord snapshot publication, no review hold and zero AI calls.
- Expanded the real private-activation/edit/approval/reconstruction fixture to
  ON/ON in all three sessions: three tests pass. This uses fake providers and
  durable temporary storage, not hosted routes or a full process restart.
  Direct URL/API concealment and session-transition races remain open.

- Following the persistence skill's identity/usage guidance, each provider
  attempt now captures structured `api_attempt` diagnostics, including rejected
  output. Unknown usage is null; incomplete token cost inputs do not imply zero
  estimated cost. Existing cost ledger/pricing behavior is unchanged.
- Owner Inspect request shows distinct recorded client-request IDs and summed
  available estimated costs, separate from history-row counts. Missing/partial
  cost data displays Unavailable, not zero; recorded counts do not certify a
  complete expired or partial capture. Help aligned. Focused service checks
  cover rejected-response usage, missing usage and capture-failure/no-retry;
  six panel checks pass. One old capture-count assertion was updated from four
  to five because the new metadata record is intentionally added.

- Added [acceptance checkpoint](watchlist-analysis-quality-acceptance-checkpoint.md)
  covering the complete objective and explicit missing proof. Runtime `e2caba5`
  service file: 31 focused tests passed. Capture/edit/export: 13 passed. Intentional
  mocked storage-error logs are not hosted failures. No full-completion claim;
  remaining items distinguish source changes, mocked checks and live gates.

- Runtime `43cb3e7` preserves aligned microcap pullback prompt and shared-tape
  range context. Model-output quality acceptance remains separate.
- Optional overview/currentRead and individual risk-summary paragraphs now
  pass the existing language validator independently after the numeric/core
  setup has passed. Invalid paragraphs are omitted with exact text/path/reason
  in `optional_overview` audit; good independent notes and prices remain.
  Per-paragraph checking prevents a correct overview from masking a later
  wrong premarket-high claim. Invalid core ordering still rejects without an
  extra request. Owner inspector summarizes these text omissions.
- Focused tests verify wrong-high overview removal, valid overview retention,
  conflicting risk-note removal, provider-volume omission, preserved valid
  notes, original audited text and unchanged core rejection. Scoped strict
  service TypeScript passes. An initial test edit had a syntax error; it was
  corrected before passing verification. Remaining optional scenario/news
  language families and complete dependency coverage are not closed here.

- Runtime `5665f83` preserves multipart delivery acceptance.
- Removed contradictory prompt wording equating shallow pullback with an
  immediate momentum retest. The prompt now distinguishes meaningful observed
  pullbacks from ordinary candle noise and explicitly selects candidate bases
  jointly with the final evidence-backed failure, without forcing percentages.
- Added a shared recent one-minute mean high-low range context (window, count,
  timeframe) and each candidate's distance in those ranges. Existing per-base
  range distance remains separate. This addresses quiet-base denominators that
  can exaggerate apparent separation. Focused packet calculation and outgoing
  prompt/candidate service checks pass. Actual model-quality calibration remains
  pending; this is not proof TNON/FTFT/AEON live output has improved.

- Runtime `0627f57` and Platform `d79b6a575` preserve owner audit summaries
  and matching Help. Six focused panel checks and scoped TypeScript passed.
- Added a three-part delivery acceptance fixture exercising actual manager
  delivery/verification methods and the durable review store with mocked
  gateways. After reopening storage, retry skips the acknowledged first part
  and stops at uncertain second; verification sends nothing; subsequent retry
  sends only third; another reopened-store retry sends nothing. Three distinct
  chunk identities, three receipts, one channel acknowledgment and zero AI
  calls verified. No monitoring runtime, server or real Discord was started.
  This proves the isolated method/store flow, not full process startup or live
  Discord integration. The first edit attempt timed out before mutation; the
  verified unchanged file was then edited successfully on one retry.

- Runtime `96a1721` records approval-probe typing; strict scoped API/panel
  checks and 13 focused policy/API checks passed.
- Added owner-only `Analysis checks` within Inspect request: readable optional
  section/objective omissions, primary/backup selection and outer-daily omission.
  Exact diagnostics remain expandable below. Unknown issue codes direct the
  owner to the raw validation record; missing diagnostics do not imply success.
  Six panel checks and scoped strict panel TypeScript pass. Help aligned.
  This is generated-request audit history, not a claim about the latest owner
  edits or live publication status. Browser acceptance remains unverified.

- Runtime `3eb513d` preserves independent outer-daily extension validation.
- Corrected earlier TypeScript evidence: the `companyName: unknown` archive
  report came from a scoped command missing the repository's `strict` option.
  With `--strict --esModuleInterop --resolveJsonModule`, the service-root check
  passes without archive edits. It is not a confirmed archive source defect.
- The correctly configured review-API check found five authorization probes
  typed as complete publish payloads despite carrying no `updatedAt`. The
  approval predicate now explicitly accepts the symbol/cards projection it
  reads, alongside full publication patches. No runtime authorization logic
  changed and no timestamp was invented. Strict scoped API/panel checks pass
  with a 512 MiB process cap; this is not a full runtime build or deployment.

- Runtime `bcb3890` preserves the pullback evidence precision correction.
- Reproduced a whole-analysis rejection caused solely by the post-validation
  $2.30 daily-resistance addition. The extension now validates independently;
  failure preserves the already-validated analysis and captures the omitted
  point/reason. Daily-high confirmation copy requires a matching nonconflicting
  daily observation in the same frozen packet/time. Three focused mocked
  service checks pass: ordinary candidate selection, unsupported extension
  omission, and supported farther daily extension, all with one AI request.
  This does not establish complete farther-level coverage for every structural
  source or replace the remaining microcap calibration acceptance.

- Runtime `0fe4733` preserves the conflicting-candle breakout correction.
- Pullback/recovery candidate matching and overlap ranking now distinguish
  numeric rounding precision from economic spacing: matching cited zone edges
  permits half of a four-decimal unit below $1 or half a cent at/above $1,
  not 0.5% of the reference quote. Volatility-based scenario spacing is unchanged.
  Twelve focused section checks pass, including accepted rounding, rejected
  penny/dollar mismatches and retention of the independent deep branch.
  This applies to generated candidate validation, not owner corrections.

- Platform local checkpoint `e48abe086` records the verification relay and Help.
- Breakout evidence now excludes conflicting high/low versions at the same
  timeframe/timestamp, including malformed or below-reference duplicates,
  instead of choosing the first supplied version. Independent observations
  remain available, and a supported alternate can still be selected. Nine
  focused selector checks and scoped module TypeScript pass; no hosted calls.
- Source inspection confirmed current candidate target selection and later
  spacing cleanup use the same spacing formula, and candidate support checks
  match the later evidence-normalization retention condition. That inspection
  did not reproduce a later target-removal bug for the current candidate path;
  it is not proof of complete cross-section dependency handling.

- Local runtime checkpoint `d28de6a` records the 11-file uncertain Discord
  receipt verification slice. Six panel checks, ten API checks and the two
  selected manager/gateway fixtures pass. Help TypeScript and diff whitespace
  checks pass. This checkpoint is not the complete quality-plan acceptance.

- Receipt controls now clear stale message IDs when reviews refresh. Six
  focused panel checks pass, including current-approval uncertain-part filtering,
  historical read-only behavior, and preserving unsaved edits while invalidating
  a prior preview. Retry also refreshes receipt controls without replacing edits.
- The mocked manager activation/delivery fixture passes concurrent owner-edit
  and ticker-deactivation checks during verification: neither appends a stale
  receipt. The exact-message gateway success/mismatch fixture also passes.
  No real AI, Discord, browser, hosted configuration or deployment was used.
  Partial-message delivery and integrated live acceptance remain open.

- Connected the verification POST path through the existing owner-only Platform
  relay, preserving mutation-request security and trusted actor injection. Help
  now explains message-part/ID verification separately from retrying delivery.
  This is local source only; verification UI interaction and race acceptance
  remain open, and no hosted request or publication was performed.

- Added runtime POST verification API and owner message-part/message-ID controls.
  Actor comes only from the trusted owner context; exact head/approval, nonnegative
  integer part and Discord ID are required. Unsaved draft edits are preserved
  when verification succeeds, and historical views have no verification action.
- Ten focused API tests pass, including unauthorized/wrong-method/forged actor/
  malformed receipt inputs. Existing panel checks pass. Platform POST relay
  allowlist, Help, verification-control interaction tests and race coverage
  remain required; the new control is not ready for hosted use yet.

- Added router/audited-gateway forwarding and manager receipt verification.
  Requires current active cycle, exact approval/head and an uncertain started
  chunk; rechecks state after GET verification before appending the receipt
  with the owner's actor. Verification never sends remaining chunks itself.
  Owner API/UI wiring and mismatch/race/partial-delivery acceptance remain open.

- Started uncertain Discord receipt reconciliation with a read-only gateway
  verifier for an owner-selected message ID. Checks configured channel, current
  bot author, exact approved text, no webhook, timestamp at/after the claimed
  send, and nonce equality when returned. It never resends or marks a missing
  message undelivered. Focused mocked success plus six mismatch cases passed,
  all using GET only. Manager/store/router/API/UI integration remains pending.
- Reviewed official Discord message resource documentation:
  https://docs.discord.com/developers/resources/message . Specific-message GET
  requires channel/history permissions; nonce is optional and must not be the
  sole receipt-recovery mechanism. No actual Discord requests were made.

- Request inspector now has four passing focused panel checks including lazy
  expansion, one-time rendering, explicit 100,000-character display shortening,
  literal source text and unavailable diagnostics with retained saved versions.
  Added matching Help section; scoped Help TypeScript/whitespace checks passed.
  These are VM/component checks, not browser rendering or penetration-test proof.

- Added owner `Inspect request` beside export. It uses the same protected,
  selected-generation redacted export response and presents input/response,
  validation, prepared-analysis and version records as collapsed text sections.
  No additional API route, model request or publication action. Large display
  sections explicitly truncate at 100,000 characters, with full available
  content remaining in export. Changing request/ticker clears prior inspection.
- Three existing panel checks pass after this addition. Detailed audit-render
  interaction tests, Help wording and rendered browser proof remain pending;
  this is not complete audit-UI acceptance.

- Runtime `2c9d343` preserves the compact evidence request and outgoing-ID test;
  `183b5f8` preserves the fixed-clock live quote/volume no-follow-up check.
  Earlier owner restoration checkpoint is `a62dce7`; persisted initial-request
  guard is `4c7110e`. All are local only, not release approval.
- Help now covers omitted-breakout restoration, nonblocking ordering warnings,
  one-request backup selection and historical-cycle export. Scoped Help
  TypeScript and whitespace checks passed. Historical lookup adds only one GET
  path to the existing owner-protected Platform relay.
- Complete analysis quality, delivery reconciliation, omitted-section owner
  reporting, microcap calibration and rendered acceptance remain open. No
  production handoff has been authorized or sent for these checkpoints.

## Breakout backup — owner delegated decision recorded

- Manager integration fixture now starts the replacement draft with an omitted
  breakout, restores owner price `0.54321`, reloads the append-only store and
  checks original null versus edited exact price with unchanged generation ID.
  Preview contains owner text; saving/preview do not increase AI-call or website
  publication counts. Explicit later approval publishes the corrected price.
  Cross-ticker historical reads are denied. The focused manager fixture passed.
  This uses fake publishers and does not prove real hosted delivery or rendering.

- Owner restoration checkpoint: five owner-edit tests pass, including restoring
  an omitted/hidden breakout with exact owner-entered precision, unchanged
  original/generation provenance and corrected text in the Discord preview.
  Added nonblocking warnings for below-reference breakout, breakout at/below
  must-clear and inverted upside sequence; values are neither rewritten nor
  rejected on those trading grounds. No AI evidence IDs are required for owner
  corrections. End-to-end manager save/audit plus website rendered proof remain
  separate acceptance items; this pure edit/preview check does not prove them.

- Scoped TypeScript check passed for breakout selection and its imports with
  a 512 MiB process cap. Service-root check reported TS2322 in existing
  `live-watchlist-audit-archive.ts:138` (`companyName: unknown`); that file's last
  change is `ebc6164`, outside this slice. Do not describe the service check as
  passing or change that unrelated contract without reconciliation.
- Reduced request catalog duplication: send ID and price only, as IDs already
  encode timestamp/timeframe/high kind. No eligible observations removed.
  Integrated fixture checks the selected anchor ID occurs in the captured
  actual outgoing request. This is not a real token/cost measurement.

- Integrated nonempty-target fixture now verifies independent target retention,
  dependent target omission, audit reasons and one provider call. Primary/top-
  level mismatches also trigger legacy dependency cleanup and an audit flag,
  rather than leave prose attached to conflicting top-level values.
- Combined focused checkpoint: 37 selection/service tests passed, one worker,
  saved in four-file local runtime commit `3d1f5fd` (not pushed or deployed),
  mocked provider only; diff whitespace check passed. No broad build or live
  call. This does not close full semantic dependency, packet-size, TypeScript,
  microcap calibration or owner editor/rendered acceptance requirements.

- Breakout candidate upside levels now have explicit IDs and prior dependency
  lists in the response schema. Local filtering omits invalid/unsupported or
  misordered levels, then omits dependent levels while retaining independent
  valid ones. Duplicate IDs and cross-candidate/forward references are rejected.
  Public targets retain the existing shape; internal IDs remain in raw audit.
- Eight focused selection/evidence/dependency tests pass; the integrated
  candidate service fixture also passes after wiring the filter. A dedicated
  service fixture with nonempty candidate target dependencies, broader prose
  dependency coverage and full TypeScript checkpoint are still required.

- Malformed-response QA: a present-but-null/array/string candidate section now
  omits the breakout rather than falling through to unchecked legacy fields.
  Malformed primary prices/types are omitted independently so a valid alternate
  can survive. Invalid optional target shapes are recorded and omitted rather
  than replaced with generic conditions. Parsing decisions join the audit.
- Expanded integrated mocked fixture passed: malformed primary/valid alternate
  and three malformed section forms preserve unrelated valid deep analysis,
  with exactly one provider request in each case. Full dependency checks for
  prose referencing an omitted optional target remain unfinished.

- Generation now sends breakout observation IDs (including one-minute highs),
  requests primary/optional alternate branches in the strict response schema,
  selects locally and audits decisions. Only the selected level/objectives
  enter the existing public payload. Existing 29 service tests passed before
  adding the new integrated fixture. The new fixture covers alternate selection,
  primary preference, both invalid with independent deep retained, and exactly
  one provider call per case. Existing normalization rounds prices over $1 to
  two decimals; expectations preserve that contract rather than demand raw
  candle precision in the published result.
- Still unfinished: candidate-linked prose dependencies (current legacy
  cleanup is conservative), optional target validation before selection,
  complete malformed-candidate handling, packet-size review and full final
  acceptance. This wiring is not a release-ready claim.

- Added a pure internal selector in
  `src/lib/ai/traderslink-ai-read-breakout-selection.ts`: valid primary wins;
  invalid primary may yield to an independently validated alternate with its
  own objectives. Candidate copies protect original audit evidence. Missing
  must-clear, missing price/evidence and invalid ordering cannot select a
  candidate. Evidence validation is a required caller contract, not inferred
  merely from narrative keywords.
- Four focused selector tests passed. This module is not wired into generation
  yet: prompt/schema, frozen-packet evidence IDs, branch dependencies, audit
  capture and service integration tests remain required before backup behavior
  exists in the feature. No extra provider calls or live changes were made.

- Added an observed-high evidence catalog with timestamp/timeframe IDs and
  exact cited-price checking. Five focused selector/evidence tests pass;
  future, malformed, duplicate and below-reference observations are excluded.
  This is an observation primitive, not the complete breakout-quality policy:
  candles alone do not establish a professional breakout setup, and legitimate
  confirmation thresholds above a structural pivot still need an explicit
  price-to-anchor contract. Do not activate high-only selection as the finished
  behavior. The outgoing packet/schema are unchanged at this checkpoint.

- Added explicit `observed_level` versus `confirmation_above` candidate basis
  and a separately cited anchor price. Confirmation may exceed its observed
  anchor; an exact-level claim must match it within price precision. Six
  focused tests pass, including an allowed $0.55 confirmation above a $0.54
  observed anchor and rejection of an invented anchor. This checks structural
  provenance, not economic quality of an arbitrarily distant trigger; final
  retained upside sequence and full candidate suitability remain integration
  requirements. No universal percentage threshold was introduced.

- Owner authorized choosing the implementation approach. Added a primary plus
  optional evidence-backed alternate within the same AI response, with only
  one final breakout displayed and no extra provider request.
- Inspected current service: schema has one mustClear and one
  breakoutContinuation; generation uses validateBreakoutOrdering. Alternate
  selection is not implemented yet. Must-clear remains a separate pivot.
- Plan now requires candidate-linked dependencies and auditable selection,
  not blind price replacement. Owner restoration of omitted breakout fields
  remains part of editor acceptance, without paid regeneration.
- Preserved pending historical-cycle audit changes and unrelated Platform
  changes. This checkpoint updates plan/progress only; no tests, AI requests,
  live configuration, deployment or runtime edits performed.
- Removed stale next-gate wording that still asked for initial plan approval.
  Full implementation and verification remain in progress, not release-ready.

## Historical-cycle API checkpoint

## Automatic initial-request exception QA

- Added a fixed regular-session quote/volume fixture with an AI-call spy after
  activation. Two monitor price updates reach the fake website publisher with
  their actual price/volume values while automatic updates remain OFF and
  the follow-up AI-call count remains zero. Focused fixture passes. This proves
  the manager's quote callback path, not real provider connectivity or every
  boundary/scheduler callback. The fixed clock avoids a closed-session false
  positive from running this check outside market hours.

- Reconstructed-manager fixture with a copied Watchlist entry and reopened
  durable review store confirms initial activation remains blocked while manual
  refresh remains eligible. The two focused manager fixtures also cover seven
  automatic-trigger availability checks across premarket/regular/postmarket.
  Both pass. This is manager reconstruction, not a full process/host restart or
  live quote-stream test; those broader boundaries remain unverified.

- Found that a private successful draft intentionally lacks public boundary
  state, so the initial-activation exception could still admit a repeated
  activation-trigger request with automatic updates OFF. Added a persisted
  review-history check: any prior generation/original disqualifies that cycle
  from another initial request. Missing history fails closed; manual refresh
  remains separate. The check is restricted to activation with updates OFF.
- Two focused manager fixtures passed: repeated held-draft activation spends
  no additional AI call, manual replacement remains available, and all seven
  explicit automatic follow-up trigger checks remain blocked. Complete restart,
  session and live-feed acceptance are still open; no live action was taken.

## Historical-cycle checkpoint details

- Runtime eight-file checkpoint committed locally as `64c75aa` after 24 focused
  store/API/panel tests passed with one worker. Includes 203-cycle pagination
  without duplicates or cross-ticker results and corrupt-origin rejection.
  No push/deployment. Full manager lifecycle/browser acceptance remains open.

- Added `Ticker history` and paged `Load more histories` controls to the runtime
  owner panel. Selecting a cycle loads request/version history read-only;
  selected-generation export includes its cycle ID. Current-review actions
  reset historical mode only after a successful current review load.
- Historical views hide editing/publication actions and their handlers also
  reject historical mode. Opening a record confirms before discarding unsaved
  edits; listing histories alone preserves the draft. Failed reads preserve
  current state. Historical saved analysis is currently inspectable through
  export, not an inline member-card preview.
- Panel checkpoint: 3 focused Node tests passed, including historical drafts
  retaining five export choices without editor/publication controls. These are
  script/component checks, not rendered browser or full interaction proof.

- Historical review/export requests preserve explicit ticker and cycle IDs.
  Added rejection of cycle-selected preview, queue, settings and mutation URLs
  rather than silently returning or acting on the current cycle.
- Focused mocked API tests: 9 passed, including exact historical read/export
  selection, invalid pagination cursor and no fallthrough to current actions.
- Historical-cycle store/list and manager integration remain local pending
  work. UI selection, paging/corruption edge cases and full lifecycle acceptance
  still need completion; this is not complete history-feature verification.
- No local listener on port 3010, server launch, real AI request, live change
  or deployment. Existing unrelated work is preserved.

## September 10, 2026 — planning update

- Recorded owner direction to preserve useful analysis through section-level
  omission rather than rejecting an entire card for an isolated invalid zone.
- Included candidate quality, volatility-aware setup classification, core
  dependencies, request auditing, card semantics and recap compatibility.
- Local source and runtime record locations were inspected read-only. The
  exact recent TNON generation packet has not been recovered; do not describe
  source-level hypotheses as a confirmed replay of that generation.
- Existing mixed worktree changes are preserved. This update changes only
  planning documents and adds a related-plan link.
- No feature implementation, tests, AI calls, migration, commit, push or
  deployment performed for this planning update.

## September 10 — completed implementation proposal

- Added source-mapped rejection dispositions, dependency revalidation and
  minimum coherent-card contract; optional objective failures need not remove
  otherwise valid pullback/recovery zones.
- Specified at most one OpenAI call per generation, with no hidden correction
  or fallback calls; existing manual and boundary refreshes remain separate.
- Added frozen-reference inputs, whole-move candidate selection, microcap
  calibration cases, compatible card/Admin copy and bounded full audit capture.
- Recorded verified Railway topology and actual seven-call TNON/AEON/FTFT
  history. Only partial rejected drafts were recovered, not complete packets.
- Added the separate [Runtime Cutover Plan](watchlist-production-runtime-cutover-plan.md)
  with preserved state, staged activation, single-writer rollback and staging
  isolation. Preparation is not deployment authorization.
- No feature code, tests, runtime changes, AI calls or deployments in this
  planning completion. Existing unrelated work remains untouched.

## Owner-review and editing addition

- Added master/session-conditioned private preparation and explicit approval
  before initial website or Discord publication.
- Added automatic follow-up AI control default OFF for the trial, preserving
  existing options, manual refresh and no-AI live-data updates.
- Added text/price/section editing, previews, saved draft revisions and exact
  approved-publication version tracking; editing never calls OpenAI.
- Separated durable version history from diagnostic retention, with owner-only
  selected audit export for explicitly authorized Codex investigation.
- Added session-transition, pending visibility, restart, stale approval,
  partial delivery and audit persistence acceptance cases. The proposed review
  switch defaults ON for the trial; automatic AI updates defaults OFF.
- Planning documents only; no live settings or feature code changed.

## Implementation started — first local checkpoint

- Owner explicitly authorized implementation and creation of a completion goal.
- Confirmed local AI service, price-action builder and runtime manager match
  the live runtime source byte-for-byte using SHA-256. Runtime parent: 9bc3124.
- No listener was found on local port 3010; no local server was started.
- Canonical runtime tracked tree was clean before edits. Preserved its existing
  untracked data/editor/orphan-link files and Platform's unrelated mixed changes.
- Implemented one provider request per generation (no paid correction/fallback)
  and durable bounded diagnostic request/response/validation/prepared-payload
  capture. Prepared payload is not represented as delivered or owner-approved.
- Saved the exact four-file runtime slice as local commit
  `028a2ea3ef78eb2edb512f48ab9416c2239a5143`; not pushed or deployed.
- Added audit storage tests and updated service contract tests. Focused Node
  checkpoint: 34 passed, 0 failed, one worker, mocked provider only. The initial
  run hit the existing Windows userInfo ENOMEM issue; reran with the existing
  process-local fallback helper, which is not committed.
- Capture includes original response text even if it is invalid JSON; excludes
  transport credentials. Oversize/storage failures are explicit and cannot
  cause another model request. Version/owner audit storage is still pending.
- Remaining: typed section recovery, candidate improvements, settings and
  review/editor/private-publication flow, owner audit/export, UI/Help integration,
  complete focused QA and release handoff. This checkpoint alone is NOT a
  deployable completion of the feature. No hosted settings or source changed.

## Second local checkpoint — automatic follow-up guard

- Runtime local commit `8692899` adds the default-OFF automatic updates setting,
  preserves the existing boundary-refresh settings, and blocks startup,
  scheduled, visibility, price/range/boundary and other automatic follow-ups.
- Initial activation and explicit manual refresh remain subject to the master
  and session switches. Failed activation cannot silently retry through another
  activation dispatch. The Top Regular override is retained as stored state but
  no longer bypasses the owner's session switches.
- Rechecks availability after awaited preparation, immediately before the paid
  call. Does not stop quote/volume processing or cancel a request already sent.
- Version 9 settings load versions 1–8, default review ON and automatic updates
  OFF, and preserve the new switches through older settings-save paths. Review
  ON is persistence groundwork only: private publication enforcement is NOT yet
  implemented. Admin switch UI remains pending.
- Generation-settings endpoint persists before changing in-memory controls.
- Focused checkpoint: 4 persistence tests and 2 selected runtime-manager tests
  passed with one worker and the existing process-local Windows helper. Syntax
  checks passed for manager/server and `git diff --check` passed. No broad suite,
  full build, local server, real provider request or hosted action ran.
- Five-file allowlist: runtime `src/lib/ai/traderslink-ai-read-settings.ts`,
  `src/lib/monitoring/manual-watchlist-runtime-manager.ts`,
  `src/runtime/manual-watchlist-server.ts`,
  `src/tests/manual-watchlist-runtime-manager.test.ts`,
  `src/tests/traderslink-ai-read-settings.test.ts`.
- Remaining scope above is unchanged. Existing follow-up tests that explicitly
  exercise enabled automation must opt into the new setting at the final
  focused feature checkpoint; no broad test pass is claimed.

## Typed scenario validation foundation

- Added runtime `src/lib/ai/traderslink-ai-read-section-validation.ts` and its
  focused test file. Collects typed codes, field paths and omission actions for
  independent shallow/deep/recovery scenarios instead of parsing error strings.
- Invalid optional objectives can be nulled while retaining valid zone/reclaim
  prices. Legacy section prose is omitted conservatively when it could depend
  on the rejected objective; original objects remain unchanged.
- Seven focused tests passed, standalone TypeScript check passed, and whitespace
  check passed. Cases include invalid shallow/valid deep, failed momentum,
  low confidence, unknown candidates, invalid recovery and no input mutation.
- This is a foundation only, not yet wired into generation. Next integration
  must handle whole-card prose dependencies, pair separation/structural ranking,
  breakout/upside/downside sections, minimum coherent scenario and the final
  assembled-payload validation. Existing all-or-nothing generation behavior has
  not yet been replaced, and no live rejection is claimed fixed.

## Initial generation integration of optional scenario recovery

- Wired typed shallow/deep/recovery validation into the actual service before
  tactical-map validation. Unknown/reversed/above-reference shallow zones can
  be omitted while valid deep and core facts survive; invalid objectives can
  be nulled without dropping otherwise valid scenarios.
- Records typed issues and changed paths in diagnostic capture. Conservative
  legacy behavior removes whole-card currentRead/riskSummary paragraphs after
  omission because they lack dependency metadata. This is intermediate, not
  the final professional narrative presentation.
- Service suite passed 28 tests; added explicit above-reference shallow case
  and reran its selected generation test successfully. No provider calls.
- Remaining before acceptance: structured cross-section prose dependency
  handling (including rationale references), overlap ranking, remaining
  optional branches and minimum coherent-card check; do not release this
  intermediate integration as the complete feature. UI, owner approval/edit
  workflow, candidate improvements and full checkpoint scope remain outstanding.

## Microcap candidate evidence and ordering

- Replaced highest-price-first ordering with a documented evidence heuristic:
  observed bar/minute coverage, subsequent observed close-in-zone returns and
  reported-volume coverage, with recency as tie-breaker. Keeps bounded eight
  candidates and evidence-kind diversity rather than dropping broader origins.
- Packet now includes explicit timeframe, candle-range/wick metrics, distance
  below reference, zone width, distance in mean candle ranges and retracement
  of the observed broader move (or impulse when no broader move exists).
- Corrected candidate observation timestamps to chronological bounds even when
  source bars were selected in volume order. Covered minutes count sampled bars,
  not gaps between observations. Mean range is not represented as ATR.
- Prompt asks the model to distinguish immediate momentum shelves from useful
  shallow/deep setups using whole-move structure, without inventing/widening
  observed candidate zones or enforcing universal percentage floors.
- Focused price-action/service checkpoint passed 38 tests. After metric precision
  and explicit timeframe refinements, all 10 price-action tests passed again.
  This is synthetic/source verification, not a replay of missing historical
  FTFT/TNON packets or proof of future model choices. No real AI request ran.
- Still outstanding: richer prose/section dependency integration, owner review
  and durable revisions/publication gating, UI/Help and full feature acceptance.

## Owner review persistence foundation

- Traced activation: queueActivation calls ensureThread before performActivation;
  performActivation posts stock context/levels and website snapshot before AI
  generation. A UI-only pending flag cannot implement the approved workflow.
- Added runtime review-store module and tests: append-only, exclusive immutable
  revision files on the existing durable volume, hash-chain integrity checks,
  original generation IDs, owner edit parents, exact draft approvals, cancellation,
  separate website/Discord delivery events and frozen review-required decision.
- Duplicate capture of identical generation content is idempotent and cannot
  replace an owner edit; conflicting reuse of the same generation ID fails.
  Stale save/approval and corrupt history fail closed. Prior approved version
  remains recorded while a manual replacement draft is awaiting approval.
- Seven focused tests passed, standalone TypeScript check passed before the last
  small idempotency refinement, and whitespace check passed. No live data used.
- Not connected to activation, generation or admin routes yet. Before enabling:
  add technical payload validation/authenticated API boundary, pending-publication
  concealment, delivery claims/idempotent send handling, late/cancelled delivery
  policy, bounded history pagination/indexing and integrated editor/preview UI.
- Generation-persistence skill informed stable IDs and recoverable provenance;
  retained the approved Railway-volume architecture without adding hosted services.

## Frozen activation review policy and watchlist persistence

- Added a frozen publicationReview cycle reference to WatchlistEntry and wired
  it through in-memory clone/upsert plus durable watchlist save/load paths.
- Policy requires master and actual-session generation for initial review;
  no Top Regular override. Later publication uses the original recorded review
  decision, not mutable settings. Missing/corrupt/mismatched review history fails
  closed; legacy entries without a review field retain existing behavior.
- Prior approved payload stays eligible during a later draft, but draft-only,
  cancelled or ticker-mismatched cycles cannot satisfy the publication gate.
- Three focused policy/persistence tests passed, including real disposable
  save/load through watchlist storage and review revisions. Whitespace check passed.
- Policy is not yet installed at website/Discord send boundaries and activation
  does not yet create review cycles. Next wiring must avoid the early ensureThread
  side effect, prepare private data/analysis, and approve exact-version delivery.
  This checkpoint must not be described as enforced owner approval.

## Website send/outbox review gate

- Added publication authorization before outbox enqueue, during persisted replay,
  and before every HTTP attempt. Held items neither send nor acknowledge and do
  not head-of-line block unrelated ticker publications. Legacy replay/coalescing
  behavior remains covered by existing publisher tests.
- Connected the runtime server publisher and manager-created default publisher
  to the frozen review policy. Reviewed AI card bodies must exactly equal the
  approved draft payload, not merely reuse its generation ID. Other approved
  ticker data updates can continue. Unknown ticker entries fail closed.
- Server supplies a review store under its existing durable directory. No live
  directory, environment variable or settings were modified by this source work.
- Four new gate tests, 63 existing publisher tests and three review-policy tests
  passed. Policy tests now include exact approved versus changed body checks.
  Manager/server syntax checks and whitespace check passed; no full build ran.
- This is not complete end-to-end approval: activation still must create private
  review cycles before ensureThread; Discord guards, private preparation,
  approval delivery, edit/preview/API/export and Help remain to implement.

## Discord router review guard

- Added a manager-connected authorizer to DiscordAlertRouter for ensureThread,
  announcements, alerts, level snapshots and extensions; errors fail closed.
  Rechecks before thread creation after lookup and before a second ladder send.
- Three focused gateway-stub tests passed with zero live Discord requests:
  every denied send path, unavailable lookup, approved normal route and approval
  changing during thread lookup. Whitespace check passed.
- Activation still has not started creating required review cycles; therefore
  this guard is preparatory, not a claim that new live additions wait for review.
- Next private path must seed levels without maybePostStockContext/ensureThread,
  retain actual timestamped quote evidence, start monitoring privately and save
  generation output to its cycle before any publication state advancement.
- Startup currently ensures a Discord thread for every active entry. It needs
  a separate pending-review restoration path so a held ticker neither creates a
  thread nor stops other symbols restoring. Awaited gateway ensureSymbolRoute
  also needs cancellation/idempotency review at final delivery acceptance.

## Initial private activation/generation integration

- Canonical server supplies its persisted review switch (default ON). When
  master/current-session generation is ON, new activation now saves a unique
  cycle and private WatchlistEntry before seeding/monitoring or model work;
  does not call the ordinary thread/snapshot/announcement activation path.
- Uses actual recent candle reference evidence (no positive fallback invented)
  and passes the prepared price-action context into generation without fetching
  that context again. Preserves a newer already-observed live quote in storage.
- Reviewed generation saves its original payload privately before publication
  state advancement. Manual replacement also stays a draft; no pending website
  publication or published boundary is created for these drafts.
- Preparation failure stays private and retains its failure; session changes
  cannot bypass the saved decision. Startup skips thread/visibility publication
  and automatic model scheduling for pending review while restoring its levels.
- Three selected manager tests passed, including private activation, duplicate
  activation, manual refresh and default-OFF/session guards. Market seeding and
  monitoring were stubbed in the private-path test; not an end-to-end feed proof.
  Manager/server syntax and whitespace checks passed. Last tiny per-ticker
  visibility refinement has syntax coverage only until the next checkpoint.
- Remaining high-priority integration: approval API and exact-version delivery,
  editing/preview/export/UI/Help; private restart/live-feed failure tests;
  activation cancellation/queued HTTP timeout handling; legacy ticker manual
  review adoption and durable original capture after cancellation; all remaining
  analysis-section/prose/coverage acceptance. NOT release ready.

## Private preparation cancellation checkpoint

- Private activation now participates in activation epochs; stop invalidates
  existing epochs, and generation rechecks active state, cycle identity and epoch
  immediately before the paid call after awaited preparation.
- Added cancellation-during-seeding coverage to the private activation test:
  no additional model request, Discord thread or website card occurs. Three
  selected manager tests passed; whitespace check passed.
- This does not cancel an already-sent provider request. Preserving a late
  original response after cycle cancellation and precise delivery cancellation
  still need their separate lifecycle/audit checks. Approval/editor/UI/Help and
  the other open scope above remain unfinished; no release action authorized.

## Owner editing backend

- Added explicit editable analysis fields: narrative, core levels, upside and
  downside points, shallow/deep/recovery plans, context summary/relevance,
  risk notes, bias/confidence and section-hide choices. Generation identity,
  timestamps, usage and original source provenance are not overwritten.
- Technical malformed inputs reject; trading inconsistencies return warnings
  without changing the owner's entered values or invoking AI validation again.
  Owner-supplied scenario prices do not inherit misleading AI candidate IDs.
- Manager read/save operations now verify active cycle/current revision, apply
  the edit and append an actor-attributed private revision. Stale edits reject.
- Four focused validator tests passed; standalone TypeScript passed after fixing
  a typing error. Selected manager integration test passed for edit persistence,
  stale-save rejection and zero additional AI/publication calls. Whitespace clean.
- ownerHiddenSections is stored but rendering support still pending. API must
  supply authenticated actor identity, not trust a browser-provided actor. UI,
  previews, approved delivery, export and other acceptance items remain open.

## Durable per-channel delivery claims

- Review store now claims website/Discord delivery using stable cycle/approval/
  channel keys before sending. Duplicate calls or restart cannot claim another
  send while the prior attempt is uncertain or acknowledged. Confirmed failure
  can retry with the same key; another channel remains independent.
- Eight focused review-store tests passed, including restart/duplicate claims
  and separate channel retry keys; whitespace check passed.
- Sender integration must honor shouldSend and resolve uncertain outcomes using
  provider receipts/idempotency, not classify every timeout as confirmed failure.
  Actual approval delivery and UI remain unimplemented; no live sends occurred.

## Website approval delivery backend

- Added manager operation to approve an exact current draft, claim website
  delivery, assemble snapshot plus exact analysis and publish without AI calls.
  Published-boundary state advances only on matching delivery acknowledgement.
- Matching outbox acknowledgements can complete the durable website receipt;
  duplicate approval is idempotent. An uncertain transport attempt replays the
  existing outbox rather than enqueueing another generation.
- Extended selected manager workflow test passes: initial private draft,
  approval, private manual replacement, owner edit, exact edited publication and
  duplicate approval with unchanged AI call count. Snapshot construction and
  provider gateways are stubbed; this is not rendered/live-feed acceptance.
- Remaining: Discord approved-content delivery, authenticated routes/editor/UI,
  first-publication ordering with concurrent quotes, late superseded delivery
  receipts, uncertain receipt recovery and all other open acceptance scope.
  No local server, real request, hosted write or deployment was performed.

## First publication ordering correction

- Reviewed tickers now hold non-analysis background patches until at least one
  approved website delivery is acknowledged. The initial exact approved analysis
  patch can publish; later quote updates continue while replacement drafts wait.
- Discord guard accepts ticker identity from an alert's event when absent from
  its top-level fields, while unidentified messages fail closed under the guard.
- Six focused policy/router tests and the selected private-activation/website
  approval workflow test passed. Whitespace check passed. No live requests.
- Approved Discord content delivery and Admin UI remain open, along with the
  remaining recorded QA and feature acceptance requirements.

## Approved Discord transport checkpoint

- Local runtime checkpoint: `4428588` (six-file transport/test allowlist).
- Added a distinct approved-analysis chunk path through the guarded router,
  website wrapper, audited gateway and REST sender. It preserves exact supplied
  text (including VWAP/EMA lines), suppresses body-driven mentions, and returns
  the channel/message receipt without another website publish or AI call.
- The path performs no automatic transport or audited-gateway retry. A stable
  chunk nonce adds Discord's short-window duplicate protection, but is not a
  substitute for the durable review ledger across restarts or long delays.
  See [Discord message contract](https://docs.discord.com/developers/resources/message).
- All 18 focused gateway/approved-transport tests pass. One existing announcement
  fixture lacked the already-required Premium role; supplied a synthetic role
  and asserted the existing server-configured audience behavior. Production
  announcement behavior was not changed. Whitespace check passes.
- Remaining: pinned preview payloads and per-chunk ledger integration, uncertain
  receipt reconciliation, approved Discord manager orchestration, authenticated
  routes/editor/UI, and the other open plan acceptance items. The transport is
  not yet a complete publishing workflow. No real Discord/AI requests were made.

## Exact publication previews and multipart Discord delivery

- Local runtime checkpoint: `2abc22c` (six-file preview/store/manager/test allowlist).
- Added deterministic analysis-to-Discord previews with retained shallow/deep/
  recovery identity, editable labels/prices/text and hidden-section handling.
  Splitting preserves text and Unicode pairs without the legacy line filters.
- Approval now stores exact website and Discord payloads. Preview hashes reject
  changed content; a duplicate approved revision uses its persisted payload,
  not newly computed live levels. The combined manager action requires a hash;
  the older website-only internal helper retains its optional-hash signature.
- Durable per-message claims/receipts prevent duplicate or out-of-order sends.
  Confirmed messages can be skipped after restart. Uncertain messages remain
  held for reconciliation, and late receipts after cancellation are retained
  without reopening the cycle. Website confirmation precedes Discord sending.
- Eleven focused preview/store checks and the selected private-activation /
  website-and-Discord approval workflow passed. Standalone preview/store
  TypeScript checks and whitespace check passed. Manager workflow stubs feed,
  snapshot construction and delivery gateways; this is not rendered acceptance.
- Remaining: distinguish confirmed provider rejection from uncertain delivery,
  receipt reconciliation, server-configured announcement audience integration,
  full public-card/preview parity, authenticated API/UI/Help, and the other open
  analysis-quality/acceptance requirements. No live sends or deployments.

## Protected review API and Platform proxy

- Local checkpoints: runtime `b9fe5e9` (three files), Platform `3d17d4c48`
  (two proxy files only; unrelated dirty work remains preserved).
- Runtime now exposes read, preview, save, approve and Discord retry routes.
  Every review route requires the runtime bearer token even outside Railway,
  plus a server-provided owner audit identity. Body-supplied actor fields are
  rejected; revisions and preview hashes are checked before manager calls.
- Platform proxy allowlists the exact review routes, obtains audit identity
  through existing owner/admin authorization, and requires existing same-origin
  mutation protection on POST. It never forwards a browser-provided actor.
  Review fetches refuse redirects; private review responses are not cached.
- Four focused dispatcher tests passed (authorization context, methods, forged
  actor, revision/hash requirements, retry routing, safe error messages).
  Runtime server/API and Platform route/client syntax checks pass; whitespace
  checks pass. These are not a full authenticated browser/proxy integration test.
- Next: visible Admin editor/control wiring and its request header, audit export,
  full proxy authentication cases and end-to-end review/delivery verification.
  Earlier open analysis/delivery acceptance items remain. No live settings,
  runtime processes, migrations, providers or deployments were changed.

## Admin review editor implementation checkpoint

- Local runtime checkpoint: `bca31c7` (three editor/page/test files).
- Added Analysis Review within the existing AI Controls section, before AI Read
  Operations. The editor loads a ticker's saved draft, exposes text/price fields,
  bias/confidence, shallow/deep/recovery setup controls, optional-section
  visibility, add/remove levels and risk notes, and saved-version history.
- Save preserves unsaved inputs on failure and displays returned warnings.
  Preview requires saved edits, pins the server preview hash, and displays the
  exact Discord chunks. Approve and publish uses that revision/hash; Discord
  retry uses the approved revision. Browser owner identity is never submitted.
  Unsaved edits have navigation/load warnings. No AI calls are made by edits.
- Generated-script parsing, single embedding, proxy rewrite and API checks
  pass (six focused tests). DOM construction uses textContent, not owner HTML.
  These checks do not prove browser interactions or responsive rendering.
- Remaining UI: website-card preview, pending ticker discovery/state labels,
  automatic-update/review toggles, selected audit export, and browser acceptance.
  Public-card hidden-section parity, delivery reconciliation, Help and the other
  analysis-quality acceptance items remain open. Nothing is live/deployed.

## Separate owner review / automatic-update switches

- Local checkpoints: runtime `a343d18` (six files), Platform `c2645938e`
  (one proxy allowlist file).
- Analysis Review now includes Automatic AI updates and Review before publishing,
  loaded from the protected owner settings endpoint. Controls remain unavailable
  until their saved state is read; saving preserves unrelated settings and
  persists before changing the manager. Defaults remain OFF/ON respectively.
- The prior generation endpoint no longer accepts the new automatic-update
  override: this control is writable only through the owner-protected review
  route. Master/session changes continue preserving its saved value.
- Changing review mode applies only to future activations. The selected manager
  workflow verifies that a pending cycle stays held after review is switched off.
- Seven focused API/panel checks plus the selected private-activation workflow
  pass; whitespace checks pass. Rendered browser acceptance and full persistence
  failure/restart proof remain open. This is local implementation only.

## Pending review list

- Local checkpoints: runtime `0911869` (five files), Platform `1a92e3169`
  (one protected proxy allowlist addition).
- Added an owner-only active review queue and Review buttons in Analysis Review.
  States distinguish preparation, failed analysis held for review, ready draft,
  new replacement draft, published, delivery attention and unavailable storage.
- Refreshing the list does not overwrite the open editor. Loading a different
  ticker asks before discarding unsaved changes. Cancelled/inactive cycles do
  not masquerade as active pending posts; their durable history remains stored.
- Eight focused API/panel checks and the selected real-review-store manager
  workflow pass, including ready -> published -> replacement draft transitions.
  Whitespace checks pass. Rendered browser verification remains pending.
- Help inventory: current src/modules/help has no Watchlist guide (Stock Levels
  only mentions it for separation). Add appropriate Watchlist help coverage at
  final integration rather than claiming existing guides describe this workflow.
  All previously recorded incomplete acceptance items remain open.

## Selected owner audit export

- Local checkpoints: runtime `492b58a` (six files), Platform `b7e017de8`
  (one protected proxy allowlist addition).
- Added Export audit with explicit generation selection. The private endpoint
  exports that generation's original, edits, approvals and delivery events plus
  matching captured diagnostics. It does not create a share URL or standing
  Codex access. Missing/corrupt/mismatched diagnostics are explicitly labelled.
- Export redacts credential fields, configured credential values and credential
  URL parameters without rewriting stored originals. Unrelated generations are
  excluded. Exported source hashes refer to the complete private history and
  are not presented as a self-contained hash chain after selection/redaction.
- Ten focused export/API/panel cases pass across the checkpoint runs; standalone
  export-module TypeScript and whitespace checks pass. Actual browser download
  interaction has not yet been verified (the current Admin iframe is unsandboxed).
- Remaining audit scope: rejected attempts with no saved draft need durable
  generation linkage and selection; export paging/large selections above the
  explicit 16 MiB response bound, diagnostics health/retention, and browser proof.
  All other previously recorded analysis/UI/delivery acceptance work remains.

## Rejected generation audit linkage

- Local runtime checkpoint: `156b9bd` (six audit/manager/editor/test files).
- Review cycles now persist generation identity before provider invocation and
  completed/failed outcomes afterward. A rejected generation no longer needs a
  valid draft to appear in the export selector. Initial generation audit-write
  failure prevents the paid call; outcome-write failures retain the started
  identity and do not trigger another provider request.
- The export includes selected failed-generation events and any available
  diagnostics. Failed rows can be inspected from the review list. Late original
  results are preserved after cancellation only for a recorded completed
  generation; cancellation still prevents approval and new publication.
- Thirteen focused store/export/panel cases and the selected manager workflow
  pass, including rejected manual replacement with no extra publication.
  Standalone store/export TypeScript and whitespace checks pass.
- Historical requests that predate capture are still not reconstructed.
  Capture-health display, legacy-cycle adoption, browser interaction proof,
  website preview/public section parity, delivery recovery and all other open
  analysis-quality acceptance work remain. No live requests or deployment.

## Public analysis section visibility and omission rendering

- Local Platform checkpoint: `8ce27e015` (four files, only owned JSX hunks).
- Member analysis card now honors all editor section-visibility keys. Omitted
  shallow/deep plans leave no empty pullback section and cannot fall through to
  the legacy derived plan. Empty objectives/recovery no longer render misleading
  placeholder rows. Retained plans show confirmation price and rationale.
- Current-read and risk-note text can display when present/not hidden. Recovery
  copy is now Recovery setup established above. Sources and other independent
  existing context remain intact. Original payloads are not mutated by rendering.
- Added parser validation for optional ownerHiddenSections. Two focused Node
  component-tree tests exercise the real parser/card functions with external
  dependencies stubbed; both working-tree and separately staged source pass.
  Syntax/whitespace checks pass; this is not browser/layout/whole-app acceptance.
- Staged only the two owned JSX functions using a HEAD-based Git blob, explicitly
  preserving pre-existing title/Stock Titan/news/notice changes unstaged. No
  unrelated changes were absorbed. Full release reconciliation remains required.
- Website Admin preview parity, browser acceptance, richer optional-section
  validation/dependencies, delivery recovery, Help and other open scope remain.

Production release waits for separate explicit approval in an agreed
after-market window. The feature and cutover are not complete.

## Admin website preview integration (in progress)

### Empty omitted-level presentation

- Member card no longer renders empty breakout/core boxes when both price and
  rationale are absent. The level grid disappears when no visible level remains.
  Nonempty owner explanatory text still renders even without a fixed price.
- Three focused component-tree checks pass, including absent breakout headings,
  preserved owner explanation and no empty grid wrapper. This is not rendered
  browser proof; owner visual review remains production-only after approval.
- Saved the two-file display checkpoint using only the owned card block and
  focused test. Three staged-source checks also passed. Unrelated existing
  title/news/notice edits remain unstaged and preserved.
- Breakout integration checkpoint is runtime `b376411` (two files); entire
  AI service test file passed 29 mocked checks. Full goal remains incomplete.

### Breakout omission integration checkpoint

- Integrated the ordering classifier into generation: invalid breakout fields
  and dependent upside points are omitted before final validation. Independent
  validated pullbacks/recovery can remain; the minimum-setup check still applies.
- Cleanup removes explicit removed-price/branch references from dependent setup
  confirmations, optional objectives, rationale and downstream downside points.
  Whole-card unstructured summary text follows existing omission handling.
  It is conservative legacy-text handling, not a complete semantic dependency
  graph. Other optional evidence/language rejection families remain open.
- QA corrected over-broad matching of generic target/upside words. Independent
  pullback text now remains intact. Percentage/bar/minute/share quantities are
  not treated as price references merely because the number matches.
- Entire AI service test file: 29 mocked tests passed with one worker. The
  integrated fixture covers retained independent setups, removed dependent
  confirmation/objective, no regenerated upside points, and one AI call.
- Pure breakout classifier checkpoint was `087c890`; no live requests, local
  servers, migration or deployment. Full acceptance remains incomplete.

### Optional breakout ordering classifier (integration pending)

- Added a pure classifier for invalid breakout reference prices and continuation
  ordering, with exact omitted paths including dependent targets. It does not
  move prices. Missing values remain absent; invalid shared reference is a core
  failure. Eleven section checks passed, with the selected breakout case also
  covering near-tolerance spacing, null values and non-finite inputs.
- NOT yet wired into generation: narrative/objective dependencies on removed
  breakout levels must be handled before retaining other scenarios. Current
  whole-card breakout rejection is therefore still present. Source confirms
  appendFactualOuterDailyResistanceTarget returns unchanged when continuation
  is null, so integration must retain that guard against recreating targets.
- Minimum generated-setup checkpoint is runtime `976e730` (four files).
  This is a partial implementation checkpoint, not final acceptance or release.

### Minimum generated setup checkpoint

- After retained-section evidence and ordering validation, generation requires
  a pullback, recovery, or breakout path with its failure level. News alone or
  isolated prices do not produce a prepared analysis. This generator-only check
  is not applied to owner-edited drafts or recap posting controls.
- Ten section checks pass. Three selected service checks pass: complete and
  partial setups remain available; a news-only response records failed validation
  with no prepared payload and no second provider request.
- The first edit-helper attempt timed out before any modification; read-only
  Git verification confirmed unchanged source before the successful retry.
- Normalization audit checkpoint is runtime `af327f3` (two files). Release task
  confirmed that unfinished Watchlist checkpoints and mixed notice changes will
  not be deployed. No live or local-server action occurred.

### Pre-validation normalization audit

- Source audit confirmed TARGET_SCHEMA carries label/price/condition but no
  explicit dependency links. Remaining breakout/point/core-language rejection
  work must address dependent prose, not just suppress validator exceptions.
- Existing checkpoint spacing and observable-evidence normalization now record
  their changed fields and before/after values as separate validation events.
  Original response capture remains separate; this does not change normalization
  behavior or imply all optional rejection paths are implemented.
- Three selected service checks pass: removed-checkpoint audit contents,
  exact request/response credential exclusion, and audit-storage failure with
  no second provider request. Earlier candidate/omission checks also passed.
- Structural overlap selection checkpoint is runtime `f250481` (three files).
  Full dependency/minimum-card, audit lifecycle and release acceptance remain.

### Plan-conformance correction: overlapping setup selection

- Supersedes the earlier always-retain-deep overlap behavior. The approved
  plan requires the stronger supported setup. The pair validator now uses the
  packet's existing structural candidate ordering, considering only cited
  candidates whose prices match the scenario. Unrelated high-ranked citations
  cannot boost another zone. Equal/unknown ranks retain deep without relabeling;
  otherwise either shallow or deep may be retained, with exact original prices.
- Nine focused section tests and the selected generation-service scenario pass.
  The service fixture continues asserting exactly one request per generation.
  This is synthetic fixture proof, not reconstructed TNON/FTFT market replay.
- Discord rejection recovery checkpoint: runtime `729c1c6` (seven files).
  Full acceptance remains open, especially other optional rejection families,
  coherent-card dependencies, audit access across cycles and real delivery
  reconciliation. No live requests, deployment or local server.

### Confirmed Discord rejection recovery

- Approved-message transport distinguishes explicit HTTP rejection responses
  from ambiguous timeout/408/server errors. Only a typed confirmed rejection
  marks the exact chunk retryable. Retries retain its approved text and stable
  delivery key; acknowledged chunks and uncertain sends are not blindly resent.
  Other Discord transport callers retain their existing retry behavior.
- Ten review-store tests pass. The selected transport check covers eight HTTP
  response cases with exactly one attempt each. The selected manager workflow
  passes rejection -> retry -> acknowledgement with identical content/key,
  then timeout -> held without another HTTP attempt or AI generation.
- Real receipt reconciliation after an uncertain send is still outstanding;
  this correction does not claim that recovery path is complete. No real
  Discord or OpenAI requests occurred. Owner offered a private Discord channel
  for later live verification; setup/send/deployment authorization is not yet
  granted. Failed request-history checkpoint is runtime `ba89614` (two files).

### Failed request history and request counting

- Request/version history now renders even without a valid draft. Loading a
  failed request clears stale edit/dirty state but leaves export available.
  Distinct generation IDs receive consistent request numbers and a request
  count, so started/failed events do not inflate that count.
- Three focused panel checks pass, including executing the no-draft rendering
  functions with lightweight element stubs and five distinct failed requests
  (ten status events). No browser/server or paid provider call was used.
- This covers the current review cycle. Older cycles and requests predating
  capture remain separate audit-access/availability concerns, not reconstructed
  by this UI change. Help checkpoint is Platform `cbc9ec238` (three files).

### Watchlist Help coverage

- Added member analysis and owner review guides, registered in the public Help
  collection, navigation and search. Existing dynamic Help routes consume that
  collection without adding a new page shell. Guidance covers session-dependent
  review, saved edits, both previews, separate delivery status, default-off
  automatic follow-ups, manual refresh and explicit audit export.
- Focused guide TypeScript check passes. An isolated source-module check verifies
  both guide URLs resolve through the collection/navigation/search and section
  IDs are unique. This is not rendered browser acceptance. No local server ran.
- Optional-overlap runtime checkpoint is `6bfcf28` (four files); selected service
  and eight section checks passed. Remaining full-scope acceptance stays open.

### Follow-up optional overlap correction

- The generation pipeline now checks separation after independently validating
  shallow/deep branches. A conflicting shallow branch is omitted while the
  valid deep branch retains its exact prices, evidence and identity. This uses
  the existing final validator's separation rule; it does not widen zones or
  make another provider request. Omission paths enter the diagnostic audit.
- Eight focused section-validator cases pass, including overlap, range-based
  separation, absent branches and original-data preservation. Whitespace passes.
  Selected service-level candidate/recovery fixture now also passes, including
  overlap omission and exact retained deep-branch equality. Its mock asserts
  one provider request per generation across all cases. This does not prove
  the complete analysis-quality acceptance matrix or historical ticker replay.

- Added a Website preview button beside the saved Discord preview. It passes
  the saved website card to the authenticated dashboard parent, which uses the
  actual member card in a responsive dialog. No preview server or local app is
  started. The member renderer is loaded on demand.
- The parent accepts messages only from its exact same-origin Admin iframe.
  Payload shape/size is checked; preview uses analysis reference pricing and
  does not invent a live feed status. Saved dip visibility is preserved.
- Four focused Node preview/card checks pass. These are not browser proof.
  Runtime panel script parsing/proxy checks also pass. Local checkpoints:
  Platform `894ebf42e` (four files, only owned member-card hunks), runtime
  `a36d630` (one file). Four staged-source checks also pass. Unrelated
  member-card changes remain unstaged and preserved.
- Owner clarified that visual review is production-only because local app
  servers/browser previews freeze the computer. Do not start one. Rendered
  review remains a separately approved production checkpoint, not a local gate.
- Remaining scope above is unchanged; no hosted actions or paid AI calls.
