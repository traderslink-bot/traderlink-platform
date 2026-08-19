# AI Review Narrative Quality Progress

## Scope

Owner-directed prompt correction for weekly, two-week and monthly AI Reviews.
The goal is to stop reviews from praising the existence of Trade Tracker data
and require a distinct, evidence-backed insight in each review section. This
does not alter Journal facts, account scope, or review presentation. The later
owner-directed hardening continuation updates current provider pricing and the
single-call package boundary, and resets only the confirmed local test reviews.
The owner subsequently rejected the prompt-only review quality as too vague and
delegated the full deterministic redesign recorded in the
[AI Review Insight Ranking Engine Plan](ai-review-insight-ranking-engine-plan.md).

## Design rules

- Completed reflections, tags, saved plans, notes and available analyzer data
  are context, not evidence that the trader executed well.
- `What improved` must state a real supported behavior or result. If none is
  supported, it must say so plainly rather than congratulate recordkeeping.
- `What held you back` must prioritize one supported process issue. It must not
  turn unrelated rule labels or analysis categories into a vague list.
- `Focus follow-through` must compare current evidence with an earlier focus or
  issued review. A focus first saved in the reviewed period is not follow-through.
- Next-period focuses must be distinct, retrospective review questions; they
  cannot repeat generic instructions to compare a trade with its plan.
- Missing/not-reviewed rules and absence of a recorded break are not positive
  process evidence.
- Review P/L is explicitly the result of trades closed in the period; confirmed
  positions still open at period end are counted without guessed unrealized P/L.
- Missing rule rows, explicit not-reviewed statuses and evaluator not-applicable/
  unavailable results remain distinct and use separate denominators.
- Exact preset evaluation is attributed separately from the trader's saved rule
  disposition and never counted as a completed review.
- Whole-day P/L is context for a broken day rule, not the financial result of a
  late violation; only exact evaluator-bounded violation members can support an
  after-break association.
- Every visible rate retains its count and denominator, and a near-tied ranking
  cannot be described as the one exclusive main problem.
- Still-open lifecycles remain outside closed-trade P/L even when they had an
  in-period position reduction.

## Progress

- [x] Confirm the active periodic and monthly issuance paths use the V2 prompts.
- [x] Add the shared narrative-quality constraints to the active periodic prompt.
- [x] Add the equivalent constraints to the active monthly prompt.
- [x] Run focused prompt-text and lint checks without a provider call.
- [x] Run authorized live synthetic reviews across low-input, planning and heavy
  weekly/monthly profiles.
- [x] Remove historical follow-through prose from the provider package while
  preserving the exact earlier `nextPeriodFocuses` arrays.
- [x] Replay the exact low-input Week 3 and planning monthly packages against the
  final provider boundary.
- [ ] Review the revised wording with the owner before accepting this
  prompt-quality slice.

## Owner-delegated insight-engine redesign - 2026-08-18

The owner correctly rejected the live 420-trade monthly-only output because it
repeated broad descriptions such as an inconsistent response after favorable
movement without identifying affected trades, associated P/L, weekly change or
a useful strength. The issue is not solvable by adding more prompt wording.

The [AI Review Insight Ranking Engine Plan](ai-review-insight-ranking-engine-plan.md)
now defines the required deterministic layer between Journal evidence and the
provider. It covers candidate families, exact measurements, separate friction/
improvement/strength/contrast/follow-through rankings, evidence thresholds,
outlier and overlap handling, hidden focus tracking, structured provider
selection, server validation and a true August 2026 acceptance month containing
four actually issued weekly reviews plus all 420 exact-month trades.

- [x] Define the candidate, measurement and ranking architecture.
- [x] Define evidence gates, penalties, overlap handling and shortlist quotas.
- [x] Define structured provider selections and post-generation validation.
- [x] Define the real four-week-plus-month 420-trade acceptance fixture.
- [x] Complete the implementation-readiness QA pass against current v2 input,
  Analyzer, rule, request, attempt, output and retry contracts.
- [x] Complete the second adversarial QA pass against ranking counterexamples,
  stable references, concurrency, prompt injection, resource bounds and a
  realistic four-week-plus-month fixture.
- [x] Complete the third adversarial QA pass against misleading attribution,
  denominator drift, delayed-focus chronology, undefined score components,
  provider choice leakage and fixture overfitting.
- [x] Complete the fourth adversarial QA pass against hybrid database reads,
  overlapping comparison periods, stale weekly prose, partial P/L coverage,
  semantic claim swaps, unsupported provider prose, undefined overlap math and
  secret-dependent ties.
- [x] Complete the fifth adversarial QA pass against whole-review composition,
  plan/catalog growth, strict selection schemas, renderer/output limits,
  retry-version drift, truthful v3 provenance and deterministic provider-
  failure continuity.
- [x] Complete the sixth adversarial QA pass against provider/fallback races,
  duplicate issuance/notifications, cross-request plan replay, complete-package
  context limits, whole-plan alternative quality, canonical bytes and renderer-
  template coverage.
- [x] Complete the seventh adversarial QA pass against provider-data expansion,
  raw logging, frozen model/envelope drift, HMAC rotation/collision, crash and
  recovery-epoch/backup fencing, unknown boundary-crossed-call cost, reservation
  overruns, erasure races and compressed-snapshot integrity/growth.
- [x] Complete the eighth adversarial QA pass against v2/v3 cutover and rollback,
  old-writer fencing, hidden AI SDK retries/repair, OpenAI storage/telemetry/
  endpoint defaults, post-boundary unknown usage, invocation drift and direct
  Railway runtime portability.
- [x] Complete the ninth adversarial QA pass against Day/Swing population mixing,
  day-only Analyzer misuse, missing Swing-note context, result/event/note time
  ownership, ambiguous observation units, gross-versus-net financial rank,
  selective partial P/L, weak-side sample confidence, outlier sensitivity,
  changing opportunity mix, superseded focus baselines and repetitive shortlist
  alternatives, plus bulk one-minute/five-minute Analyzer context masking the
  longer-term signal, unverified RSI calculation and repeated-event weighting.
- [x] Complete the tenth adversarial QA pass against wrong opportunity
  denominators, selectively covered Analyzer/rule evidence, tiny polarity-pool
  financial inflation, non-separated cohort outcomes, latest-week reversals,
  one-sided examples, historical-prose selection influence, loose openings and
  next-focus priorities disconnected from the main held-back finding.
- [x] Complete the eleventh adversarial QA pass against inactive rule
  opportunities, lost preset trigger/violation evidence, sparse-review strength
  praise, structurally incomparable consequence cohorts, conflicting rate/
  median results, unavailable exposure normalization, one-day recency reversal,
  ignored exceptional context, repeated-focus starvation and closed-trade
  results that omit the period-end open-position boundary.
- [x] Complete the twelfth adversarial QA pass against missing-versus-explicit
  rule results, overloaded evaluator `n/a`, wrong rule-rate denominators, late-
  day violation P/L attribution, open-lifecycle partial-result double counting,
  evaluator-only evidence mislabelled as completed review, custom-scope
  applicability, small-denominator percentages, near-tie certainty and sparse/
  no-trade output.
- [x] Implement corrected Wilder RSI 14 calculation and version new saved RSI
  evidence without rewriting legacy Analyzer snapshots.
- [ ] Run the focused RSI reference-vector and compatibility checks at the next
  permitted verification boundary.
- [ ] Implement and calibrate the deterministic insight engine.
- [ ] Run the true-month issuance and provider stability acceptance.

## Deterministic insight-engine implementation checkpoint 1 - 2026-08-18

The owner authorized implementation after the twelve-pass design QA. The first
server-only checkpoint is now implemented but is deliberately not activated in
the customer review path.

Implemented in this checkpoint:

- versioned v3 evidence, measurement, candidate, rule-state and lane-score
  contracts;
- mutually exclusive stored rule outcomes, orthogonal preset-evaluator states,
  typed evaluator unavailability, custom historical-opportunity boundaries and
  conflict-safe violation membership;
- a backward-compatible typed availability reason on the Journal preset-rule
  evaluator, including fail-closed enforcement for every new `n/a` result;
- exact-decimal closed-trade outcomes including winner/loser pools, averages,
  medians, largest results, contribution, profit factor and results with the
  largest winner/loser removed;
- separate period-end confirmed-open and in-period-reduction counts with
  unrealized P/L explicitly unavailable and no partial open-lifecycle result in
  closed-trade P/L;
- exact cohort net P/L, losing-trade P/L, gross loss/profit share, adverse/
  beneficial net contribution and partial/mixed-currency suppression;
- compatible affected-versus-remainder consequence comparison with minimum
  populations, rate/median agreement, exposure-scale guard, fixed structural-
  mix standardization, composition-confounding and outlier resistance;
- reusable recurring behavior, material-outlier, specific-example, strength,
  friction and contrast candidates with general/segment gates, independent
  spread, exploratory multiplicity and count-led small-denominator literals;
- early-versus-later rate trend candidates with the four-week monthly split,
  meaningful-change minimums, coverage guard, fixed-stratum standardization and
  recent-regression detection;
- fixed lane weights, scale-guarded financial scoring, deterministic tie breaks,
  measured-consequence friction guard, rank-certainty states, 50-per-lane
  pairwise cap, containment/Jaccard overlap audit, family collapse, overlap
  penalties, evidence/action-target diversity and lane quotas; and
- a deterministic planted verifier script covering rule-state separation,
  exact outcome money, open-lifecycle coverage, consequence comparison,
  behavior candidacy, monthly improvement and sole-eligible rank certainty.

Verification at this checkpoint:

- focused ESLint passes for every new/changed engine and evaluator file;
- repository TypeScript checking reports no engine error; the remaining check
  failure is the unrelated concurrent `workspace-dashboard.tsx` `sx` prop error;
- no Vitest/test suite, verifier execution, provider call, database write,
  browser change, request issuance or saved-review mutation was performed.

Still required before Slice A is complete:

- one transactionally consistent account-scoped Journal/Analyzer source
  snapshot and prompt-safe identities;
- concrete adapters for every approved rule, Analyzer, entry, add, exit,
  sequence, concentration, segment, positive-process and contrast family;
- deterministic representative selection and complete leave-one-bucket lane
  winner stability;
- exact historical period-end open-position reconstruction from accepted
  executions; and
- permitted execution of the focused verifier plus fixture calibration.

Provider shortlist serialization, renderer/selection validation, immutable v3
persistence, OpenAI dispatch, weekly focus metadata and true four-week monthly
issuance remain later slices. The existing v2 customer path is unchanged.

## Deterministic insight-engine implementation checkpoint 2 - 2026-08-18

The immutable calculation-source boundary is now implemented. It remains
server-only and is not activated in the existing v2 customer review path.

Implemented in this checkpoint:

- one deferred SQLite read transaction freezes the complete account-scoped
  Journal, rule, note, style, Analyzer and prior-issued-review source at one
  timestamp;
- versioned keyed HMAC references replace private Journal, rule, note, Analyzer,
  execution, focus and issued-review identities before any later provider
  serialization, with an exact known-private-identifier leak check;
- canonical recursively key-sorted JSON bytes, byte length and SHA-256 source
  digest provide the immutable calculation-source identity;
- current closed trades use authoritative Eastern close dates and retain exact
  gross/net results, entry/add/reduction/close roles, saved style linkage, tags,
  current trade notes and dated Swing notes;
- complete compact Analyzer evidence remains local, stale round-trip versions
  fail closed, and event/path reads are batched rather than repeated per trade;
- saved rule results remain separate from deterministic preset evaluations,
  including exact trigger/violation members and missing/`n/a` availability;
- confirmed period-end open positions are reconstructed from accepted execution
  allocations through the historical boundary, so a position that closed later
  is still counted as open then; in-period reductions are counted separately and
  unrealized P/L remains unavailable;
- a monthly source selects every actually issued weekly/two-week review ending
  inside the month plus the actual prior monthly comparison. Those narratives
  are marked context-only and prohibited from supplying calculated statistics;
  and
- focus references now include the exact saved daily-note revision identity,
  preventing two otherwise similar revisions from collapsing together.

Verification at this checkpoint:

- focused ESLint passes for every changed source-snapshot and bounded batch-read
  file;
- forced non-incremental TypeScript checking found and corrected the new
  canonical recursive-value type; the only remaining repository error is the
  unrelated concurrent `workspace-dashboard.tsx` `sx` prop error; and
- no Vitest/test suite, verifier execution, provider call, database write,
  browser change, request issuance or saved-review mutation was performed.

Still required before Slice A is complete:

- concrete adapters for every approved rule, Analyzer, entry, add, exit,
  sequence, concentration, segment, positive-process and contrast family;
- deterministic representative selection and complete leave-one-bucket lane
  winner stability; and
- permitted execution of the focused verifier plus true-month fixture
  calibration.

Help Center check: this checkpoint changes no visible behavior or user workflow,
so no guide update is required. The later owner-approved AI Reviews guide change
remains at the final activation boundary.

## Deterministic insight-engine implementation checkpoint 3 - 2026-08-19

The source-to-candidate adapter layer is now implemented but remains disconnected
from requests, persistence, the provider and the visible AI Review page.

Implemented in this checkpoint:

- the immutable source now preserves exact open-position reduction references,
  Eastern day boundaries and a prompt-safe stable instrument reference, so
  counts, historical rule applicability and same-symbol instruments reconcile;
- trade-scoped rules are checked at actual entry time, day-scoped rules use the
  exact Eastern day interval, and rule history reaches back to the earliest
  entry of a trade that closed in the reviewed period without counting that old
  event as current-period behavior;
- saved dispositions, deterministic preset results, missing expected reviews,
  explicit not-reviewed, not-applicable, unavailable and source-conflict states
  are normalized separately for the exact rule version and target;
- the engine generates competing negative and positive named-rule findings,
  rule improvement/deterioration, exact event-bounded preset sequence findings
  and profitable-broken/losing-followed result-process contrasts;
- Analyzer candidates cover green-to-red ended-red, recovery, profitable 50%
  peak giveback, 70% peak retention, add-after-peak, partial-before-red recovery
  and weekly trend changes, with exact Analyzer-path peak/reversal/event-count
  measurements kept separate from Journal net P/L;
- a genuinely strong completed entry can compete as a specific example when
  favorable movement is at least twice adverse movement and net P/L is positive;
  it cannot become a recurring entry-strength claim without the structured rule
  gate required by the plan;
- one-dimension-at-a-time ticker, tag, direction, weekday, fixed Eastern entry-
  time, declared-Day/objective-same-date duration and declared-Swing duration
  cohorts use the predeclared Segment gates and multiplicity penalties;
- largest one/three/five loss and winner concentrations plus worst/best day
  reliance enter as result concentration/examples rather than invented repeated
  behavior;
- corrected-version RSI cohort generation exists but defaults off until the
  prohibited-for-now reference-vector verification is accepted; and
- locale-dependent ordering was removed from all engine comparisons, and lane
  defaults are reserved before global alternative/supporting diversity caps so
  a recorded default cannot disappear from the provider shortlist.

Verification at this checkpoint:

- focused ESLint passes for all changed source, candidate, measurement, ranking
  and shortlist files;
- a focused TypeScript project excluding shared generated `.next` state passes;
- the repository-wide TypeScript command is currently blocked before source
  checking by concurrent corruption in `.next/dev/types/routes.d.ts`; shared
  generated runtime state was not deleted or regenerated; and
- no test suite, verifier execution, provider call, database write, browser
  change, request issuance or saved-review mutation was performed.

Still required before Slice A is complete:

- final family/measurement QA, including provider-forbidden unsupported Analyzer
  interpretation; and
- permitted verifier and true-month fixture calibration.

Help Center check: this remains inactive server-only engine work and requires no
guide update yet.

## Deterministic insight-engine implementation checkpoint 4 - 2026-08-19

Representative evidence and rank-stability replay are now implemented. This
remains inactive server-only work and does not change an issued review.

Implemented in this checkpoint:

- rank ties use canonical non-secret candidate meaning and exact measurement
  semantics rather than prompt-safe HMAC references, so rotating the scoped
  reference key cannot reorder otherwise unchanged findings;
- friction selects the highest aligned material contribution plus a closest-to-
  median affected example, strength selects a typical affected example plus a
  recent independent example, contrast selects typical affected and remainder
  examples, and improvement/deterioration trends select typical early and later
  members;
- exact median selection uses decimal arithmetic and factual timestamp, ticker,
  direction and result ordering instead of source-array or rotating-reference
  order;
- named rule candidates now carry exact per-week reviewed-opportunity counts and
  bounded trade/day representatives rather than leaving rule evidence abstract;
- every behavior, named-rule and rate-trend candidate recalculates its family
  gate, classification, measurements, consequence, confidence and lane score
  after omitting each independent calendar-week bucket, using the exact expected
  population in that week and reselecting valid representative roles from the
  remaining evidence;
- the omission projection includes result-only weeks even when a candidate had
  no opportunity in that week, so changed period loss/profit denominators still
  change financial materiality correctly; and
- the shortlist reruns family collapse, cross-family overlap penalties,
  evidence/action diversity, the measured-consequence guard and final lane
  selection for every omitted bucket. `dominant` is available only when the
  same selected default wins every replay and retains the required score margin.

Verification at this checkpoint:

- focused ESLint passes for the changed contracts, candidate builders, ranking,
  shortlist and source adapters;
- the focused non-incremental TypeScript project excluding shared generated
  `.next` state passes; and
- no test suite, verifier execution, provider call, database write, browser
  change, request issuance or saved-review mutation was performed.

Still required before Slice A is complete:

- final family/measurement QA, including provider-forbidden unsupported Analyzer
  interpretation and the still-disabled RSI reference-vector gate; and
- permitted verifier and true-month fixture calibration.

Help Center check: this checkpoint changes no visible workflow, so no guide
update is required yet.

## Deterministic insight-engine implementation checkpoint 5 - 2026-08-19

The deterministic factual renderer, complete-plan package and hardened provider
selector are now implemented. They remain inactive and do not change existing
v2 requests, issued reviews or the customer page.

Implemented in this checkpoint:

- exact closed-trade result sentences lead every review and show closed-trade/
  trading-day counts, net P/L, winner/loser/flat counts and count-led win rate;
- server-owned templates render one measured improvement or maintained
  strength, one residual friction or mixed-result boundary, eligible focus
  follow-through and up to three distinct retrospective questions;
- financial findings state the affected count/denominator, exact cohort net
  P/L, complete-money coverage and gross losing/winning P/L share when that
  measurement is eligible, followed by a deterministic representative trade or
  day when available;
- missing comparisons, insufficient later focus evidence, no qualifying
  friction and incomplete money/open-position coverage use explicit factual
  boundaries rather than invented advice or praise for data entry;
- globally compatible complete reviews preserve one decision-critical spine,
  prohibit duplicate factual jobs, require a measured strength when eligible,
  cap alternatives at six and retain only alternatives within the whole-plan
  quality-loss gate;
- the provider package exposes only the fully rendered authorized choices,
  strict section facts and bounded selection rationales. Private source/plan
  references remain in a request-local mapping, and recursive exact-key plus
  forbidden-reference checks run before serialization;
- the provider returns only the exact contract version, 22-character package
  key and one request-local choice key. Cross-package replay, unknown fields and
  unauthorized choices fail closed; and
- the new host-neutral selector explicitly uses the OpenAI Responses API at the
  official endpoint with a strict structured schema, one non-streaming call,
  `store: false`, telemetry disabled, `maxRetries: 0`, a frozen timeout,
  minimal reasoning, default service tier, disabled truncation, no tools,
  repair or continuation and a 512-token output ceiling. A one-shot fetch gate
  checks the exact request body before network I/O, forces redirect errors and
  retains only a bounded canonical request digest/byte count. Provider failures
  expose a private transport-started boundary without retaining a raw body or
  error cause.

Verification at this checkpoint:

- focused ESLint passes for the renderer, contracts, candidate/source changes,
  provider package and Responses selector;
- a focused non-incremental TypeScript project excluding shared generated
  `.next` state passes;
- official OpenAI documentation and the installed provider source confirm the
  Responses/Structured Outputs boundary and that the installed Responses
  provider defaults storage to true unless `store: false` is explicit; and
- no test suite, captured transport execution, provider call, database write,
  browser change, request issuance or saved-review mutation was performed.

Still required before provider testing resumes:

- verified compressed immutable v3 persistence, dispatch leases/recovery,
  generation-contract fencing, deterministic fallback and dual v2/v3 reads;
- harden or make unreachable both legacy free-prose v2 provider adapters;
- execute the captured-request verifier at the permitted verification boundary;
  and
- finish weekly focus metadata, then run the real four-week-plus-month
  acceptance flow.

Help Center check: this checkpoint is inactive server-only work, so no guide
update is required yet. The already identified owner-approved AI Reviews guide
change remains part of the final activation boundary.

## Deterministic insight-engine implementation checkpoint 6 - 2026-08-19

The immutable snapshot and provider-dispatch persistence foundation is now
implemented but remains unexecuted and disconnected from the active v2 review
services. No migration, generation-contract transition or local database write
has occurred.

Implemented in this checkpoint:

- additive generation-contract ownership for existing requests and attempts,
  with historical/pre-cutover rows remaining v2 and a singleton guard that
  rejects an omitted old-writer v2 value after verified v3 activation;
- new account-scoped snapshot, dispatch, v3 issued-review and selection-audit
  tables plus database-wide generation-contract and recovery-epoch singletons;
- one-way activation guards, feature re-enable fencing, cross-generation
  request/attempt/output rejection, immutable snapshot/output/audit rows and
  tightly enumerated dispatch lease/transport/settlement transitions;
- an atomic v3 request-and-snapshot insert primitive that returns an existing
  v2 period identity unchanged, discards a losing concurrent calculation and
  preserves periodic carry-consumption ownership;
- a single canonical compressed snapshot artifact containing the complete
  prompt-safe calculation source, candidates, shortlist, catalog, fully
  rendered plans, exact provider bytes, private choice map, strict schema,
  system instruction and invocation manifest without duplicating the large
  provider package as a second raw text column;
- bounded decompression using the recorded exact output length, followed by
  compressed/uncompressed length, SHA-256, canonical-JSON and trailing-byte
  verification before any snapshot is trusted;
- request/snapshot metadata reconciliation on every read, including source,
  candidate, shortlist, catalog, package, invocation, model, default-plan and
  historical v2 input/evidence digests;
- random dispatch fencing tokens retained only by the active worker, monotonic
  lease generations, a persisted pre-network transport authorization callback
  and one-provider-call-per-request enforcement after any transport crossing;
- exclusive startup recovery that rotates the database epoch, permanently
  fences copied workers, classifies pre-transport work as no usage and
  post-transport work as unknown usage without inventing a receipt; and
- exact receipt-overrun fields and a persistent provider-call block boundary so
  later issuance can retain factual usage/cost instead of clipping an overrun
  to its reservation.

Implementation QA corrections in this checkpoint:

- the migration drops the former v2-only request-issued trigger before adding
  the v2/v3 generation-aware replacement;
- accepted provider selection requires a settled dispatch, exact receipt and
  provider response identity; deterministic issuance requires no fabricated
  attempt, dispatch, provider or receipt;
- selection audits reconcile their source/shortlist/catalog/output digests to
  the immutable snapshot and issued row; and
- the provider selector cannot reach its underlying fetch until the caller has
  committed the exact outbound request digest and byte count to the current
  dispatch fence.

Verification at this checkpoint:

- focused ESLint passes for the new storage, codec, snapshot, dispatch,
  recovery, migration and provider-selector files;
- a focused non-incremental TypeScript project excluding shared generated
  `.next` state passes; and
- no Vitest/test suite, migration execution, provider call, database write,
  browser change, request issuance or saved-review mutation was performed.

Still required before provider testing resumes:

- implement the one-winner v3 issuance transaction, exact receipt/overrun
  accounting, rejected-selection audit and deterministic-default fallback;
- finish the verified activation/read-compatibility path and dual v2/v3 saved
  review reads;
- harden or make unreachable both legacy free-prose v2 provider adapters; and
- execute the permitted migration/captured-request/true-month acceptance gates.

Help Center check: this is still inactive server-only work, so no guide update
is required yet.

## Deterministic insight-engine implementation checkpoint 7 - 2026-08-19

The fenced v3 issuance, fallback and late-usage repository is now implemented
but remains unexecuted and disconnected from the active v2 review services. The
0065 migration is still registered source only; no migration, generation-
contract transition, provider call, request issuance or database write occurred.

Implemented in this checkpoint:

- one atomic provider-selection transaction covering the exact receipt, settled
  dispatch, immutable v3 output, accepted selection audit with hidden focus
  targets, attempt/reservation/request finalization and one ready notification;
- an atomic rejected-selection path that retains exact trustworthy usage and
  reservation-overrun facts before issuing the already-frozen deterministic
  default, while the no-usage path retains unresolved maximum exposure without
  fabricating a receipt;
- deterministic issuance with no attempt/provider/model/receipt provenance and
  guards requiring every provider attempt and active selection lease to be
  terminal before the fallback can win;
- exact overrun fields for input, output, total tokens and cost, with the real
  receipt retained even above the reservation and a monotonic persistent block
  on later provider calls rather than blocking the current user's local default;
- post-generation authorization rechecks that settle factual provider usage but
  fail the pending request without an issued review or fallback when entitlement
  or account/platform review controls were revoked while the call was in flight;
- one immutable rejected audit per provider attempt, one accepted audit/output
  per request and idempotent already-issued reads so a provider/fallback race
  cannot replace the chosen output or notify twice;
- a retired-fence digest retained only for a boundary-crossed recovered worker,
  allowing that exact original secret fence to append one factual late receipt
  while remaining unable to validate a selection or regain issuance authority;
- provider-response uniqueness plus idempotent receipt comparison, preventing a
  late/repeated callback from adding or changing usage for the same attempt;
- late receipt reconciliation that converts unresolved reserved maximum exposure
  to actual receipt cost exactly once and finalizes the still-started reservation;
  and
- structured-output failures now retain exact usage and a bounded safe provider
  response identity when available, without persisting raw provider output or
  error causes.

Implementation QA corrections in this checkpoint:

- a reservation overrun disables only future provider transport; it cannot deny
  the already-authorized trader the complete frozen local review;
- startup recovery preserves the old token digest before rotating the live
  selection fence, closing the prior gap where an exact late receipt could not
  prove ownership after recovery;
- a response that arrives after recovery but before fallback is treated as late
  cost evidence and still receives the deterministic default—it cannot use its
  expired fence to select the provider plan; and
- accepted and rejected audit SQL now carries the frozen source, shortlist,
  catalog, rendered-output and focus-target digests needed for later exact
  follow-through reads.

Verification at this checkpoint:

- focused ESLint passes for the provider selector, dispatch/recovery, issuance
  repository and 0065 migration;
- a focused non-incremental TypeScript project excluding shared generated
  `.next` state passes; and
- no Vitest/test suite, migration execution, provider call, database write,
  browser change, request issuance or saved-review mutation was performed.

Still required before provider testing resumes:

- finish generation-contract activation and dual v2/v3 saved-review reads;
- connect the captured v3 coordinator to the frozen snapshot, reservation,
  dispatch, selector and issuance APIs;
- harden or make unreachable both legacy free-prose v2 provider adapters; and
- execute the permitted disposable migration/captured-request/recovery-race and
  true four-week-plus-month acceptance gates.

Help Center check: this remains inactive server-only work, so no guide update is
required yet. The final activation boundary still owns the previously identified
AI Reviews guide/privacy wording check.

## Deterministic insight-engine implementation checkpoint 8 - 2026-08-19

Mixed-generation review compatibility and immutable focus-target recovery are
now implemented but remain disconnected from the active v2 request/runner path.
No generation-contract transition or database migration was executed.

Implemented in this checkpoint:

- one unified account-scoped saved-review reader that works before the v3 tables
  exist and, after migration, returns v2 and v3 reviews in one stable period/
  issuance order without upgrading or rewriting either history;
- collision and partial-schema integrity checks so one request cannot appear as
  both generations and a partly installed insight schema cannot be treated as a
  harmless absence;
- strict v3 reopening through the immutable issued row, accepted selection
  audit and compressed source snapshot, including canonical focus JSON plus
  focus/output/source digest and selected-plan lineage checks;
- explicit `legacy_unavailable` focus tracking on v2 rows, preserving their
  visible narrative for a true mixed first month without inventing hidden
  baseline metadata;
- stable hidden v3 `focusTargetRef` values separate from the visible question,
  with the server-owned intent to reduce, test consistency, examine or repeat a
  strength persisted in the accepted audit;
- v3 target recovery of the originating candidate family/subject, exact
  baseline measurements, population/opportunity/affected members, source-
  version refs, final source-market seal and issuance-time evidence boundary;
  and
- the monthly calculation source now loads all actually issued weekly/two-week
  v2 and v3 reviews in the month, while only accepted v3 targets enter the
  hidden follow-through source.

Verification at this checkpoint:

- focused ESLint passes for the seven changed compatibility, contract,
  renderer, issuance and repository files;
- a focused non-incremental TypeScript project excluding shared generated
  `.next` state passes; and
- no Vitest/test suite, migration execution, provider call, database write,
  browser change, request issuance or saved-review mutation was performed.

Still required before provider testing resumes:

- implement exact later-evidence follow-through candidates and immutable
  already-assessed member boundaries;
- implement and inspect the one-way generation-contract cutover verifier;
- connect the captured v3 coordinator and make the two free-prose v2 adapters
  unreachable after activation; and
- execute the permitted disposable migration/captured-request/recovery-race and
  true four-week-plus-month acceptance gates.

Help Center check: this is still inactive server-only compatibility work, so no
guide update is required yet.

## Deterministic insight-engine implementation checkpoint 9 - 2026-08-19

Exact later-evidence focus assessment is now implemented but remains
disconnected from the active v2 request/runner path. No generation-contract
transition, provider call, database migration or saved-review mutation was
performed.

Implemented in this checkpoint:

- a separately versioned hidden stable SHA-256 tracking reference, scoped to
  the exact workspace/account and private subject identity but independent of
  the rotating prompt-safe HMAC and request period; every stable key and lineage
  key is rejected from the OpenAI selection package;
- exact target identity now distinguishes day-rule from trade-rule
  opportunities, and the entry-quality target measures all profitable entries
  with at least twice the favorable versus adverse excursion instead of one
  chosen example;
- monthly focus history now includes every actually issued weekly/two-week
  review ending inside the requested month plus the immediately prior monthly
  review, while ordinary weekly/two-week requests use their immediately prior
  issued review;
- later evidence starts strictly after both the source-market seal and review
  issuance, requires at least five compatible opportunities across two market
  dates, preserves the original observation unit and never counts pre-focus
  evidence;
- exact metric projections allow a prior problem or strength to reach zero
  occurrences without disappearing from assessment; projections are hidden,
  cannot enter ordinary ranking and cover the accepted rule, preset-sequence,
  Analyzer path, entry, add, exit and versioned RSI targets;
- direct verdict thresholds now distinguish clear 10-point improvement/
  worsening, five-point unchanged, the middle no-clear-change range, mixed
  later weeks, sustained strength and improved-but-still-at-least-20-percent
  inconsistent evidence;
- accepted follow-through stores its canonical assessment JSON and digest in
  the fenced selection audit, including cumulative members, genuinely new
  incremental members and the prior assessment boundary, so unchanged evidence
  cannot be issued as a fresh assessment;
- within 10 lane points, a previously unassessed target displaces an already-
  assessed one unless new evidence produces a material verdict change or a
  worsened repeat;
- baseline lineage now covers current round-trip, trade-style, Analyzer, rule,
  and rule-review revisions across the account, preventing both stale-baseline
  comparison and false invalidation of an unchanged earlier-period rule review;
  and
- the focus sentence now states the original rate, exact later count/rate and a
  direct human conclusion instead of the vague `same measured rate` wording.

The controlling plan was corrected to match the accepted v3 privacy boundary:
four issued weekly reviews remain in the private monthly calculation source;
OpenAI receives only bounded complete server-rendered choices and allowlisted
selection rationales, not weekly prose, raw monthly facts or raw Analyzer rows.

Verification at this checkpoint:

- focused ESLint passes for every changed follow-through, compatibility,
  persistence, repository, renderer and privacy-projection file;
- the focused non-incremental TypeScript project excluding shared generated
  `.next` state passes; and
- no Vitest/test suite, browser run, migration execution, provider call,
  database write, request issuance or customer-visible UI change was performed.

Still required before provider testing resumes:

- implement and inspect the one-way generation-contract cutover verifier;
- connect the captured v3 coordinator and make the two free-prose v2 adapters
  unreachable after activation;
- implement the proper multi-stage extraction-and-synthesis path for a counted
  package that genuinely exceeds the selected model's safe envelope; and
- execute the permitted disposable migration/captured-request/recovery-race,
  zero-case focus and true four-week-plus-month acceptance gates.

Help Center check: this remains inactive server-only engine work, so no guide
update is required yet. Activation still owns the AI Reviews guide/privacy
wording check.

The ninth-pass design retains the eighth pass's single-package/fallback and
Railway boundaries while tightening the engine that decides what deserves to be
shown. It now keeps Day and Swing populations explicit, attributes results and
execution events to their correct dates, scores a behavior from the complete
cohort's net result, prevents partial P/L from winning financial rank, checks
trade-mix and outlier sensitivity, and diversifies near-equivalent alternatives.
Complete Analyzer evidence stays in the immutable local calculation source;
OpenAI receives exact longer-term aggregates and no more than eight unique
representative excerpts across the whole package or two for one candidate, not
every raw one-minute/five-minute observation. Unversioned RSI is gated out of
ranking because the source audit found an incorrect no-loss result and no
accepted Wilder reference-vector proof. The corrected `wilder_rsi_14_v1`
calculation is implemented and new evidence carries that exact version. RSI can
influence a period conclusion only after its focused verification passes and it
then shows a repeated comparable pattern.

The tenth-pass design now keeps full-period prevalence separate from the rate
among trades that actually reached a management opportunity, checks whether
optional Analyzer/rule evidence is selectively concentrated, and prevents a
tiny loss pool from producing a dominant financial score. It also distinguishes
cohort dollars from worse associated outcomes, exposes a sufficiently populated
latest-week regression, requires two-sided examples for mixed findings and
freezes one decision-critical monthly spine before all four weekly narratives
reach OpenAI. The visible review opens with the exact result, and its first
next-period question addresses the selected actionable held-back issue when one
exists.

The eleventh-pass design now reconstructs exact rule active intervals and
retains preset trigger-versus-violation evidence before ranking. It cannot call
sparse `no break recorded` evidence clean execution, compare unlike cohorts as
though rule status explained the outcome, or let one high-volume date reverse a
monthly trend. Trader notes qualify the objective finding without becoming an
inferred excuse or motive; unchanged focus evidence cannot be reassessed again;
paused/retired rules cannot create a future target. The opening is explicitly a
closed-trade result, with the exact confirmed period-end open-position count and
no invented unrealized P/L in the single coverage sentence.

The twelfth-pass design now treats followed, broken, explicit not-reviewed,
missing expected review, not-applicable and evaluation-unavailable as separate
states. Missing custom-rule results use the exact historical Trade Tracker
day/trade projection; they do not create their own opportunity. Exact preset
evaluation without a saved disposition remains separately attributed and does
not raise review completion. Full-day P/L cannot be ranked as money after a
late-day rule break;
only the evaluator's exact violation members can support that association.
Open trades with position reductions remain outside closed-trade P/L until the
lifecycle closes, and their count cannot masquerade as exposure. Visible rates
lead with counts for small samples, while a near tie or sole eligible finding
starts directly with the exact behavior and impact instead of claiming one main
cause. Sparse/no-closed-trade periods retain exact unavailable or example-only
output instead of turning reflections into a recurring pattern.

Help Center check: the active Daily Trade Tracker and Trade Analyzer guides
describe indicators generally but do not state an RSI formula or legacy-value
promise, so this correctness change does not require a guide update.

The eleventh/twelfth-pass review meaning does require a later owner-approved AI
Reviews guide correction when implemented: it must explain closed-trade P/L,
still-open lifecycles including in-period reductions, the no-unrealized-P/L
boundary, rule review/missing coverage and the difference between a recorded
rule status, full-day outcome context and exact preset violation-event evidence.
No Help copy was changed during this documentation-only QA pass.

Once the insight engine is active, TraderLink calculates and renders the
complete review locally from all exact facts. If the full frozen selection
package cannot fit the configured model envelope, it issues the deterministic
default already calculated from that complete local source; it does not split
one review into two independent provider judgments or omit required projected
evidence.

The eighth source audit also pauses further live provider tests through the
current v2 adapters: their installed AI SDK/OpenAI defaults permit hidden retries
and provider storage unless explicitly overridden. Provider testing resumes only
after the planned endpoint, `store: false`, telemetry-off, zero-hidden-retry and
timeout boundary is implemented and captured-request verified. The same library
runs directly on Railway; no Vercel hosting or Gateway dependency is required.

## Owner-directed production hardening continuation — 2026-08-18

The owner requested that the test-account AI Review history be cleared and that
fresh reviews be generated through the real account/request/issuance/saved-review
flow instead of relying only on the benchmark adapter. The five existing local
test-account reviews are January 2026 fixture reviews on the same account that
contains the controlled `AIR..` Journal fixture. Their removal is authorized as
test-data cleanup only; real customer review history remains immutable.

The benchmark remains useful for provider cost and prompt stress, but it does
not exercise request persistence, generation controls, saved-review reopening,
or the customer page. It also bypasses the former 256,000-byte reservation guard.
The current heavy benchmark package is about 884,000 prompt characters because
100 trades carry repeated analyzer detail. The instruction prompt is not the
source of that size.

### Hardening checklist

- [x] Compact the provider-only analyzer representation without altering the
  immutable Journal input snapshot or silently truncating trader notes.
- [x] Keep actual provider usage separate from the deliberately conservative
  one-token-per-byte pre-call spend reservation.
- [x] Remove the mistaken 256,000-byte terminal boundary. Keep 900,000 bytes only
  as the threshold for requesting an authoritative model-specific token count;
  normal smaller packages retain the conservative one-token-per-byte reservation.
- [x] Replace the byte-only single-call rejection with a token-aware reservation.
  Use a multi-stage evidence workflow only when the counted package genuinely
  exceeds the model's safe one-call input budget; never split it into unrelated
  final reviews.
- [x] Require `incompleteRecord` whenever the immutable coverage notice says a
  limitation exists, and reject an invented limitation when it does not.
- [x] Require focus follow-through to contain an exact eligible earlier focus;
  current focuses and older quoted prose do not qualify.
- [x] Reject unsupported explicit ISO dates, ticker references, money values and
  percentages in generated prose when they are absent from the provider input.
- [x] Reject recordkeeping praise, outcome-to-process claims, duplicated next
  focuses and a wider set of forward trading instructions before persistence.
- [x] Persist a server-owned prompt-version marker in each newly issued output
  without changing the customer presentation or invalidating older reviews.
- [x] Back up the local database, remove only the five confirmed January fixture
  review chains, and prove unrelated Journal and platform counts are unchanged.
- [x] Generate fresh sequential weekly/monthly reviews through the actual test
  account coordinator and reopen the saved rows.
- [ ] Inspect the saved reviews through the rendered customer routes. Port 3010
  was no longer listening at the final checkpoint, and the in-app browser
  connection was unavailable because its trusted local plugin path was not
  configured. Neither condition came from the AI Review request or provider.
- [x] Record actual request size, provider usage, estimated cost and any rejected
  attempts from the real-flow run.
- [x] Refresh the active GPT-5.6 Luna rates to the official 2026-08-18 prices
  without rewriting historical reservation or receipt prices.
- [x] Run the complete 420-trade monthly-only package through provider token
  counting, reservation, Luna generation, output validation, cost receipt,
  immutable save and reopen in a synthetic-only in-memory database.

### Size and cost boundary

The provider's documented GPT-5.6 Luna context window is 1,050,000 tokens. The
TraderLink ceiling is therefore a per-call quality, retry and spend boundary,
not a provider limit. The weekly-context monthly package is about 465,000 UTF-8
bytes and remains a normal one-call review.

The added monthly-only heavy scenario preserves all 420 trades, 420 Analyzer
records with 1,680 events, 3,066 tags, 4,200 trade-rule outcomes, 210 daily-rule
outcomes, 21 completed daily reflections containing 58,800 note characters,
and 420 trade notes containing 294,000 characters. Its exact provider prompt is
1,786,512 UTF-8 bytes, while OpenAI's model-specific input-token endpoint counts
the complete Luna instructions and prompt at 506,884 tokens. It fits the model's
one-call context window, but the former 900,000-byte reservation guard would
have incorrectly rejected it. Provider controls now reserve from the
model-specific count with explicit headroom for the structured-output schema
and response. Multi-stage extraction is necessary only if that complete counted
envelope exceeds the safe one-call budget.

The first live provider generation used 506,950 input tokens and 646 output
tokens, passed the structured-output, safety and grounding checks on its first
attempt, and cost $0.25463750 at the current long-context rates. The provider
input-token endpoint's 506,884 count was 66 tokens below the actual generation,
confirming that the reservation needs explicit schema/protocol headroom rather
than treating the count as a perfect ceiling.

The corrected production-style proof used the same 420-trade package in a new
synthetic-only in-memory database. The serialized reservation was 1,961,857
bytes; OpenAI reported 507,175 input and 702 output tokens. TraderLink reserved
515,301 input tokens and $0.2650233, recorded the exact $0.2548508 receipt,
saved and reopened the immutable monthly review, and passed foreign-key checks.
No local Journal database was opened, copied or changed. The generated review
also rendered the exact stored `75.0000` win-rate value as the human-readable
`75%` after the percentage-formatting prompt correction.

Because 506,884 input tokens exceed Luna's 272,000-token long-context pricing
threshold, provider controls now apply the provider's 2x input and 1.5x output
multipliers to both the conservative reservation and the final recorded receipt.
The earlier three saved July reviews stayed below that threshold, so
their recorded $0.01004625 combined cost is unaffected.

The original Luna price configuration was five times the current official
rate. Current settings and live cost tools use $0.20 per million uncached input
tokens, $0.02 cached input, $0.25 cache write input and $1.20 output. Existing
receipts retain the price snapshot recorded when each call occurred.

### Fresh account-flow result

After the January fixture review chains were backed up and removed, three new
July fixture reviews were generated sequentially through the same account
scope, manual request, coordinator, provider-control reservation, provider,
receipt, immutable save and reopen path used for an ordinary customer request:

- July 20-24 weekly: 19,852 reserved input bytes, 5,593 actual provider tokens,
  and $0.00133724 recorded cost.
- July 27-31 weekly: 24,321 reserved input bytes, 6,655 actual provider tokens,
  and $0.00226204 recorded cost.
- July monthly: 29,155 reserved input bytes, 24,669 actual provider tokens over
  three attempts, and $0.00644697 recorded cost.
- Total recorded provider cost was $0.01004625. The first two monthly drafts
  were rejected before persistence because they claimed an improvement that
  the supplied earlier/later evidence did not support. The third draft passed
  and was saved.

The reopened reviews use exact supplied period facts, identify narrower
evidence-backed improvements, keep financial outcomes separate from process
quality, compare only an eligible earlier focus with later evidence, use three
new monthly review questions, and show the server-owned coverage limitation in
plain language. The database ends with exactly those three issued reviews,
five attempts and receipts, no foreign-key violations, and the test account's
original schedule and disabled platform controls restored.

## Live provider QA — 2026-08-18

- The first low/planning/heavy run stopped before heavy generation because the
  benchmark still asserted the former 500-character trade-note limit. The
  fixture already used the approved 700-character limit. The assertion now
  derives from the profile, and `--profile` supports focused low-resource runs.
- Heavy, planning and low-input profile runs completed with no unsafe-output
  rejection or retry. The retained artifacts are local under `.local-logs/`.
- Live output confirmed the main correction: record completion, tags, notes and
  Analyzer availability were no longer praised as process improvement.
- Live review exposed two further weaknesses. Profitable P/L was once described
  as strong execution, and a later weekly review selected an older focus quoted
  inside historical follow-through prose. The prompts now prohibit both.
- The provider serializer now omits only historical `focusFollowThrough` prose
  from prior review context. Exact `nextPeriodFocuses` arrays remain available.
  A static package check confirmed the correct prior focus remained and the
  competing historical prose was absent.
- The final exact Week 3 replay quoted the immediately prior review's AMD focus,
  not the older embedded focus. The final monthly replay quoted an issued focus
  and compared it only with later current-month evidence.

## Verification boundary

The owner authorized both benchmark provider calls and fresh saved test-account
reviews for this QA. The January cleanup is recoverable from the private local
backup at `private-data/traderlink-platform/backups/ai-review-reset-20260818T1840Z/`.
The pricing migration and the three new July fixture reviews changed the local
development database; no real customer review, Journal fact or account setting
was removed. The owner-requested removal of the top-right `Ask AI Chat` action
from weekly and monthly saved-review detail pages is the only presentation
change; the review document itself is unchanged. No broad test suite,
deployment or production activation is part of this correction. The AI Reviews
Help guide already says reviews are retrospective evidence summaries rather
than trading signals, predictions or investment advice, and it does not
describe the removed page action, so no Help update is required. Rendered-route
inspection remains open; owner wording review remains the acceptance gate.

## Insight v3 implementation checkpoint 10 — 2026-08-19

The inactive insight engine is now connected to a one-way generation-contract
boundary and the ordinary AI Review request/coordinator/read paths. No cutover
or provider test was performed.

Implemented in this checkpoint:

- a cutover-readiness repository verifies the required v3 tables/triggers,
  disabled platform intake, zero pending v2 requests/attempts, zero active
  reservations, receipt/usage reconciliation, no premature v3 requests,
  foreign keys and SQLite quick-check before allowing the one-way singleton
  transition;
- activation additionally requires explicit confirmation that intake stopped,
  a verified backup completed, old processes stopped and v2 reads reconciled;
  the activation method is not called by ordinary runtime code;
- manual and automatic request creation now route through the singleton, while
  the database binds every new request and attempt to that active contract;
- the coordinator routes each pending request by its immutable generation
  version, performs one fenced startup recovery per database/runtime and leaves
  legacy v2 issuance reachable only for pre-cutover v2 rows;
- one immediate transaction now owns v3 attempt creation, spend reservation,
  provider-start state and dispatch acquisition, closing the pre-provider crash
  gap; an existing attempt resumes only through its own dispatch fence;
- missing credentials, frozen provider/model drift, counted context overflow,
  spend refusal, invalid provider selection and exhausted attempts resolve to
  the already-rendered deterministic review with truthful provenance;
- a pre-transport authorization failure is no longer treated as possible billed
  usage, while any call that may have crossed transport becomes terminal and is
  never retried automatically;
- first-partial-month calculation now keeps full calendar-month identity but
  restricts trades, dated notes, daily rows, rules, Analyzer evidence, focuses,
  unresolved-record coverage and issued weekly context to the actual enabled
  coverage dates; the rendered limitation states the exact covered dates;
- AI Reviews list/detail pages and AI Chat saved-review reads now reopen both
  v2 and v3 output through one account-scoped compatibility boundary;
- lightweight presentation reads validate the immutable output without
  decompressing the full trade/Analyzer artifact for every saved-review card;
  the calculation engine still uses the full validated artifact when hidden
  focus lineage is required; and
- Administration issued-review counts include both v2 and v3. The existing
  generic account-erasure transaction already discovers all account-scoped v3
  tables, temporarily removes immutable delete guards, defers foreign keys and
  verifies no orphan remains, so no separate erasure writer was added.

The older checkpoint note saying a multi-stage extraction path was still
required is superseded by the accepted bounded-selection architecture. The
complete raw fact set stays in TraderLink's local immutable calculation source;
OpenAI receives only a small set of complete server-rendered review choices. If
that frozen selection envelope cannot fit, TraderLink issues the complete local
deterministic choice. It does not split one review into separate provider
judgments or omit evidence.

Focused verification at this checkpoint:

- the focused non-incremental TypeScript project passes for the cutover,
  execution, compatibility, presentation and AI Chat paths;
- focused ESLint passes for the same owned files; and
- source inspection confirms all cutover-required schema object names match
  migration `0065`.

No Vitest/test suite, migration execution, database write, activation, provider
call, browser run or deployment was performed. Next acceptance remains the
disposable migration/cutover and captured one-shot request proof, deterministic
fixture/holdout execution, recovery and race cases, then the true four-week plus
monthly live flow. The active Help Center needs no change for this inactive
server/read-compatibility checkpoint; Help/Privacy wording remains an explicit
pre-activation owner-review boundary.
