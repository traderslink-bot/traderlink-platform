# Watchlist analysis quality acceptance checkpoint

Status: incomplete; not a release approval.

Controlling local plan: [Analysis Quality Plan](watchlist-analysis-quality-plan.md).
Chronological evidence: [Progress](watchlist-analysis-quality-progress.md).

## Current evidence boundary

Known gap reproduced: legacy top-level upside/downside checkpoints with valid
synthetic observed prices but invalid volume text still reject the entire read
with one request. The characterization asserts current rejection, NOT desired
acceptance. Their three-field schema has no dependency identities; normalization
would discard extras. Addressable checkpoint/dependency handling remains required.

Queued automatic ON-to-OFF dispatch now has real-coalescer proof in all three
enabled sessions: one dispatch for duplicate scheduling, zero mocked AI/research
calls and manual eligibility preserved. Three targeted manager checks pass.
Full scheduler/live-data/re-enabled-publication integration remains open.

An orphaned pending generation now retains an interrupted-request failure after
outbox replay, preventing a fresh activation request under automatic-OFF. Two
targeted manager tests pass, including two starts over persisted fake state,
zero mocked provider calls and retained manual eligibility. Full scheduler and
hosted restart acceptance remain open.

Private request diagnostics now include a scoped seven-module code fingerprint
and optional validated Railway commit, alongside existing prompt/schema/body
hashes. Three focused identity/request checks pass. Missing modules are explicit;
this is not whole-runtime or live release provenance acceptance.

Breakout text is now checked before primary/alternate selection; legacy breakout
text uses the dependency-removal path. Candidate objective text is checked before
ID-based retention. Forty-six service/panel tests and strict service TypeScript
pass. Legacy target/downside text and full cross-section dependencies remain open.

Optional shallow/deep/recovery volume and premarket-high text failures now omit
their own scenario with an exact audit reason. Forty service checks and strict
TypeScript pass; core rejection remains intact. Complete optional-field and
cross-scenario dependency coverage remains open, as does live quality acceptance.

Generated core and must-clear decisions now have readable audit entries, with
explicit separation from owner edits and retained-original fallback. Eight
focused panel/export tests and scoped strict TypeScript pass. This does not
establish rendered live acceptance or close the remaining full-feature inventory.

Legacy continuation now requires numeric observation support and omits locally
when unsupported. Candidate/level explanations no longer require tape keywords
in addition to their real evidence. Forty-eight service/breakout tests and strict
TypeScript pass, including independent deep-setup retention. Legacy tolerance,
full text/dependency attribution and economic calibration remain open.

Must-clear now has observed/confirmation-above anchor validation and local
omission. The service proves a bad pivot does not remove an independent deep
setup. Forty-three service/core tests, subsequent missing-explanation checks
and strict TypeScript pass. Legacy continuation and full text/dependency
attribution remain open; no live quality or release acceptance is claimed.

Declared core anchors now use numerical display precision rather than
candle-width tolerance. Explicit derived thresholds remain supported. All 42
core/service checks and strict TypeScript pass. Legacy formats retain their
existing observation-tolerance path; semantic calibration and source-ID
provenance remain separate open acceptance items.

Needs-to-hold/caution/failure now distinguish observed levels from explicitly
anchored lower thresholds. Legacy responses require numeric observation matches;
words alone no longer satisfy these three core fields. Forty service/core checks
plus a subsequent one-request/provenance integration case and strict TypeScript
pass. Anchor tolerance/semantic calibration, legacy breakout/must-clear checks
and complete narrative dependencies remain open.

Reference, packet normalization, checkpoint and breakout paths now share
unambiguous OHLC/time filtering. Conflicting prices cannot win by volume/order.
56 focused checks plus a subsequent packet/catalog consistency check and strict
TypeScript pass. Core observed-versus-derived threshold validation, tolerance
calibration and full narrative dependencies remain open.

One-minute observations now participate in checkpoint evidence; future,
malformed and conflicting bars are excluded by that matcher. Reference-price
selection separately rejects future 1m/5m bars. The 35-check service suite and
one subsequent direct reference test pass, as does strict TypeScript. Core
evidence, tolerance calibration and conflicting-reference selection remain open.

Upside objectives no longer pass solely on tape-like wording: candidate,
normalization and final-validation paths require a price observation. All 34
service checks and strict TypeScript pass; a matching farther observed daily
high still survives. Core-level lexical bypass, one-minute coverage, supplied
map provenance and complete narrative/dependency acceptance remain open.

Delayed live-data replay now has local proof: inactive tickers reject live
patches; new admission timestamps reject older cards/quotes while current
activation publication and live updates continue. Ten selected manager tests
and strict TypeScript pass. Remote in-flight ordering and public read/cache
integration remain open; stale held cards are not automatically deleted.

Delayed-removal outbox restart proof now passes: active re-additions and removals
predating their admission are held, unrelated updates proceed, and later valid
removals deliver. Obsolete queue records remain unacknowledged. In-flight remote
ordering and delayed live-card/ticker-data replay remain unverified.

Reviewed-ticker removal is now content-free and remains permitted by the
publication guard while new data stays held. Six policy and two manager/HTTP
mocked checks plus strict TypeScript pass. Delayed outbox removal versus newer
activation/approval, hosted archives and live cache proof remain outstanding.

Removed-entry admission checks now cover an old held gate on 36 normal OFF
re-additions, plus six ON private workflows starting with an old approved cycle.
Normal re-addition detaches the old gate; private re-addition creates a fresh
unapproved cycle and preserves the old history. Focused mocks and strict manager
TypeScript pass. Hosted stale-card/cache and concurrent removal remain unproven.

Admission-time metadata now persists the original session/time and generation
permission. Eight selected mocked checks pass, including 72 OFF-admission
combinations with/without a settings/date change during preparation, six private
workflow cases, and disk reload/malformed-state coverage. Scoped strict manager
TypeScript passes. Removal/re-add, full startup and live visibility proof remain
open; this is not a production acceptance claim.

Latest narrow runtime correction: `e0801cc` holds legacy public ticker
replacements for review. Ten selected manager/policy checks passed with mocked
providers; scoped review-policy/store and Platform Help TypeScript checks passed.
Follow-up `5f0f8a2` separates automatic request eligibility from live-data
permission; pending/failed replacement requests cannot automatically repeat.
This does not close the broader acceptance gaps below.

Runtime `379d422` persists original validation decisions and makes them available
to the owner inspector without temporary diagnostics. Checkpoint: 45 service/store
tests, eight inspector/export tests and strict service/store TypeScript passed;
the selected manager provenance case passed separately. Mocks only, no live calls.

Runtime checkpoint inspected: `e2caba5`, canonical
`levels-system-post-mtf-handoff-stability`. Platform checkpoint: `d79b6a575`
in the assigned `e70f` worktree. Preserve unrelated Platform working changes.
No live setting, migration, provider request, Discord post, server, push or
deployment was performed for this checkpoint.

Current-run checks, one worker, mocked external services:

- `traderslink-ai-read-service.test.ts`: 31 passed.
- `traderslink-ai-read-audit.test.ts`,
  `traderslink-ai-read-owner-edit.test.ts`,
  `traderslink-ai-read-review-export.test.ts`: 13 passed together.
- Earlier checkpoints in Progress contain the exact smaller policy, panel,
  candidate and multipart-delivery checks. Do not count those as fresh full
  integration or browser proof.

The service test's `Audit capture unavailable: storage_error` messages are
intentional mocked storage-failure cases, not production storage observations.

## Requirement inventory and remaining proof

| Requirement | Evidence now | Remaining acceptance |
| --- | --- | --- |
| One request per generation, no automatic correction/fallback | Service tests cover success, omitted sections, invalid output, unavailable tape, model-access failure and capture failure | Confirm all orchestration/restart/deferred call paths and attempt-versus-generation counts |
| Independent optional sections | Pullback/objective/breakout selection and optional overview/outer-level paths implemented and tested; downside words alone cannot bypass supplied-price validation; candle matcher excludes future/malformed/conflicting observations (34 service checks pass) | Complete upside/core scenario-language and cross-section dependency coverage; remaining evidence sources/claim semantics require review |
| Preserve coherent core and prices | Invalid core ordering still rejects; omitted overview does not change levels | Complete malformed/truncated/refusal fixture inventory and full final-assembly review |
| Micro/nano-cap analysis | Observed candidate selection, precision matching, shared recent-range context, corrected shallow/retest wording | Frozen-fixture calibration for volatility, failure/base joint selection and broader coverage; no live model-quality claim |
| Primary/backup breakout in one response | Candidate and service checks; one selected branch; original response retained | Integrated owner rendering and complete dependent-text coverage |
| TradersLink-first research | Existing service/source behavior retained; unsupported context normalization tests pass | Confirm runtime article-selection and fallback contract end to end; historical missing packets cannot be reconstructed |
| Exact request/response audit | Capture round-trip, bounded artifacts, visible capacity/oversize/corruption results pass; intermediate validation no longer marks unfinished captures as pruneable | Review complete metadata/hash/cost capture, missing-terminal recovery and operational capacity/index behavior |
| Permanent original/edit/approval records | Separate append-only review storage; edit/export checks pass; original validation decisions now persist independently of temporary diagnostics and remain inspectable after diagnostic loss | Complete storage-failure/concurrency and large-history acceptance; diagnostic expiry must never delete revisions |
| Review/edit/preview/approve | Owner editing preserves provenance and corrections; stale/version checks recorded in Progress | Integrated complete editor inventory, unsaved-error handling and website/Discord parity |
| Initial private admission | Real manager methods with fake providers: direct/queued ON/ON private workflow passes all three sessions; corrected review-mode-ON matrix covers 36 Main/Top Regular direct/queued OFF combinations with normal publication and zero AI calls; HTTP guard blocks pending card and quote/data transport | Live listing/detail/API and existing-cache/re-add concealment, full process startup and switch/session transition races |
| Replacement review | Existing approved revision remains independently stored during later draft; legacy public manual refresh now creates a durable replacement-only review before dispatch, without historical approval fabrication; focused policy/restart and manager checks pass | Full replacement publication and re-enabled automation acceptance; actual public-render retention proof |
| Automatic updates default OFF | Persisted control and trigger guards exist; eight automatic trigger names cannot regenerate a pending legacy replacement; failed attempt stays held, manual remains available, approval restores ON eligibility and OFF preserves boundary settings | Full process restart/deferred/scheduler integration matrix and actual re-enabled replacement publication |
| Delivery durability | Verified multipart method/store flow: confirmed part skipped, uncertain part held, receipt verified, remaining part only sent | Full process startup, publisher integration, audience mentions/links, removal/re-add races and hosted acceptance |
| Owner history and operation results | Request/version history, inspection, export and recorded attempt/cost summaries exist; per-stage captured-record counts expose partial diagnostics; latest failure/storage states supersede old published labels; Published with omissions covers recorded removals reconciled to approval | Legacy incomplete metadata, capture-health/retention operations and integrated rendered operation detail display |
| Public rendering and Help | Existing parse/display work and Help checkpoints recorded | Integrated desktop/mobile rendering, older payloads, no empty/dangling sections and mixed Platform edit reconciliation |
| Recap compatibility | Not established by analysis tests | Reconcile separate recap ownership and prove deep/shallow/recovery/omitted-section compatibility without restricting owner edits |
| Release preparation | Separate local cutover plan exists; no live changes | Exact reconciled parent/allowlists, source topology, rollback/backup, after-market owner authorization and release-owner handoff |

## Gates retained

- No local preview server or broad build/test suite on this computer.
- No real model-quality experiment or Discord publication inferred from mocks.
- No new migration is assumed necessary or authorized.
- Live default changes, runtime cutover and production publication require
  separate explicit owner approval after the relevant trading sessions close.
- Browser/live acceptance is outstanding; source-only evidence cannot close it.
- This inventory organizes the whole objective; it does not redefine completion
  around the already-tested subset or authorize a release handoff.
