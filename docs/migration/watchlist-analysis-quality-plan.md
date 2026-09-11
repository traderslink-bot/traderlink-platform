# Watchlist Analysis Quality Plan

Status: Owner approved implementation; local work in progress. Live release remains separately gated.

Current-state authority: the linked acceptance inventory records open proof and
implementation gaps. Earlier "proposed" language below preserves the design
history; it does not withdraw the owner's implementation authorization or imply
that incomplete items are accepted. The owner waived further implementation UI
approval pauses; rendered production acceptance remains separately gated, and
no local preview may be started.

Owner direction recorded September 10, 2026. This proposal covers the runtime
input packet, candidate selection, AI instructions, validation, publication,
analysis card and downstream recap compatibility. It does not authorize
deployment, real generation requests, live runtime changes or a new migration.

Progress: [Analysis Quality Progress](watchlist-analysis-quality-progress.md).
Acceptance inventory: [Current checkpoint](watchlist-analysis-quality-acceptance-checkpoint.md).
Related: [Watchlist Runtime Dashboard Admin Plan](watchlist-runtime-dashboard-admin-plan.md).

## Product objective

Deliver a professional, coherent micro/nano-cap day-trading analysis. One
unusable optional section must not suppress otherwise useful analysis.
Watchlist posts describe setups for different trading styles, not instructions
to enter at the posted price. Keep meaningful shallow and deep pullbacks,
breakout continuation, farther upside structure and failure/recovery distinct.

## Complete improvement scope for review

1. Trace and, where available, recover the exact generation-time input,
   response, correction attempts and published result for TNON. Separate
   verified historical artifacts from source-derived explanations.
2. Audit the whole move, candidate shortlist and meaningful bases. Evaluate
   shallow/deep suitability against observed volatility, move depth and base
   quality; do not substitute an arbitrary fixed percentage minimum.
3. Review pullback selection and momentum failure together. A tight failure
   boundary must not inadvertently misclassify a useful deeper setup.
4. Audit candle coverage, quote alignment, catalyst selection and historical
   continuation coverage. Preserve TradersLink-first news and existing source
   restrictions; do not fabricate missing market inputs or distant levels.
5. Introduce section-level validation and coherent partial publication as
   specified below, subject to the implementation review.
6. Align card language with actual model semantics, including new recovery
   thesis versus restoration of the original thesis. Consider showing the
   selected pullback's rationale. Exact visible copy remains to be reviewed.
7. Define secure request/response audit retention, including model/prompt/schema
   versions, attempts and omitted-section reasons. Exclude credentials; decide
   bounded retention and access before implementation.
8. Check recap consumption of optional/missing sections and valid deep
   pullbacks. Missing analysis details must not gate a price-move recap or
   restrict the owner's editing and posting control. Recap changes require
   an explicit implementation allowlist and reconciliation with its plan.
9. Align Help documentation and run focused low-resource acceptance checks at
   the approved implementation checkpoint, not during this design review.

## Section-level validation and partial publication

Owner-approved planning principle: preserve valid analysis when an individual
component is unusable. Do not use all-or-nothing rejection by default.

- Validate the shared foundation first: ticker, generation/reference price,
  timing and internally consistent core price structure. Problems that make
  the whole analysis unreliable can still prevent publication.
- Classify each existing rejection as whole-analysis, section-local, or
  dependency-related. Record the actual code rule and affected fields before
  deciding its handling; the examples below are not blanket exemptions.
- If the nearest pullback is invalid, omit it and retain any independently
  valid lower pullback as the next available zone. Do not mechanically relabel
  a deep setup as shallow, invent a replacement or alter its prices.
- Assess unsupported individual upside levels, optional recovery scenarios,
  isolated news claims and malformed optional fields for omission rather than
  rejection of the complete card.
- Revalidate dependencies after omission: confirmations, objectives, ordered
  continuation branches, narrative references and recap inputs. A later branch
  that requires a removed level cannot simply remain unchanged. Retain only
  coherent sections; do not silently rewrite the thesis to make it pass.
- Do not make a new OpenAI call merely to fill an optional section when the
  remaining analysis is publishable. Define bounded correction handling for
  repairable core problems separately; avoid unnecessary retries and charges.
- Owner operations must distinguish fully published, published with omissions,
  and failed requests, with per-section reasons and all request attempts
  inspectable. Member presentation should remain readable without internal
  rejection codes; exact omission-state copy/layout is still proposed work.
- Publish the validated coherent result atomically. Preserve original model
  output and omission decisions for audit rather than overwriting evidence.

## Proposed acceptance cases

- Invalid shallow plus valid deep: analysis and deep remain available.
- Invalid deep plus valid shallow: shallow and unrelated sections remain.
- No usable pullback: other valid analysis still appears.
- One invalid upside level: independent valid levels remain; dependent later
  branches are rechecked, not blindly retained or renumbered.
- Invalid optional recovery or isolated news content: unaffected price
  analysis remains coherent and visible.
- Wrong ticker, conflicting core references or irreparable core ordering:
  no new misleading analysis is published.
- No dangling prose references, false shallow/deep labels, empty broken card
  sections or fabricated substitute values after omission.
- Desktop/mobile rendering, stored payload consumers, owner request history
  and recap behavior all handle omitted sections explicitly.

## Verified evidence and limits

September 10 Railway inspection confirmed production Dashboard connects to the
runtime in the staging environment; staging Dashboard connects to the same
runtime, which publishes to the live public site. See the separate
[Production Runtime Cutover Plan](watchlist-production-runtime-cutover-plan.md).

Today's retained records show TNON primary candidate-ID rejection followed by
successful correction; AEON primary and correction invalidation rejections,
then a successful manual generation; FTFT primary and correction rejected for
shallow zone/reference-price ordering. FTFT incurred $0.1696 across two calls.
Rejected responses retain only 4,000-character previews, length and hash.
Inspected cost/event records do not contain full request packets. These are
confirmed outcomes, not proof that all remaining sections were publishable.

The local source reviewed is runtime revision 9bc3124. Before implementation,
compare the exact deployed service, price-action builder and publication code
with the proposed source parent. Do not assume the local checkout is the full
deployed feature inventory. Preserve newer forward-plan behavior if present.

## One-request contract

- One generation makes at most one OpenAI request containing the complete
  multi-style analysis task. No automatic correction or fallback-model call,
  including on invalid JSON, refusal, model-access failure or timeout. A timeout
  has an uncertain provider outcome and is not permission to send another call.
- Validate input readiness before spending. Keep existing master/session gates,
  spend guard, per-ticker in-flight protection and boundary-refresh limits.
- A later owner-requested refresh or enabled qualifying boundary refresh is a
  separate generation, not a hidden retry. Preserve boundary settings beneath
  the automatic-update control below, which defaults OFF for this trial.
- Publication retry reuses the same validated payload and generation ID; it
  never calls OpenAI. Audit storage/publication failures are not AI retries.
- Remove stale UI wording promising a fallback model. Do not change the selected
  model or effort as part of this work.

## Breakout backup selection — owner delegated decision

The owner authorized choosing the best approach after suggesting a backup
breakout. Include one primary breakout-continuation candidate and at most one
optional alternate in the same generation response. This is not another AI
request and does not add a second breakout box to the published analysis.

- Prefer a valid primary. Consider the alternate only when the primary fails
  its own validation. An alternate must cite supplied observable structure;
  return null when no independent supported alternate exists.
- Preserve `Must clear` as the earlier improvement pivot. It is not the backup
  for `Breakout continuation`; those fields retain their distinct meanings.
- Validate each candidate against the frozen reference, retained must-clear
  pivot, evidence, failure boundary and continuation sequence. Do not merely
  substitute another number into prose or objectives written for the primary.
- Associate candidate-dependent objectives and conditions with candidate IDs.
  Only the selected branch's coherent content may enter the prepared payload;
  revalidate shared downstream levels and omit unresolved dependencies.
- If neither candidate works, omit the breakout branch while preserving other
  complete valid setups. Do not make a repair request to fill that section.
- Keep breakout fields available in the owner editor even when the generated
  section was omitted. A saved owner correction can restore the box; editing
  and preview do not call AI. Technical validation remains distinct from
  trading warnings, and owner edits are not subject to AI evidence selection.
- Audit original candidates, validation reasons, selected candidate identity,
  prepared result and subsequent owner revisions. Publish only the selected
  or owner-edited breakout, never the internal alternate list.

Acceptance: valid primary wins; invalid primary/valid alternate selects only
the alternate; both invalid retain unrelated setups; missing alternate stays
compatible; inconsistent dependent prose/objectives never transfer blindly;
owner restores an omitted breakout without an AI call; original and edited
versions remain distinguishable. Assert one provider call in every generation
case. Prompt/schema/selection/audit/editor coverage must be verified together.
This addition is approved scope, not a claim of completed implementation.

## Rejection-rule disposition

Source inventory: `src/lib/ai/traderslink-ai-read-service.ts`,
`assertTradersLinkAiTradeMap` and `generate` (approximately lines 1400-1655 and
2320-2485 in reviewed revision). Convert throwing validation into typed issues
with field paths; collect all relevant issues rather than stop at the first.

| Existing failure family | Proposed disposition |
| --- | --- |
| Missing usable candles, invalid ticker/reference/time, transport/refusal/empty or unparseable response | No new analysis; no automatic second call. Preserve existing analysis with its actual status/time. |
| Contradictory hold/caution/failure ordering, unsupported core boundaries, material quote conflict | Reject the new analysis if a coherent core cannot be established; do not rearrange prices. Preserve existing stricter quote guard until explicitly reviewed. |
| Must-clear/continuation ordering or unsupported breakout branch | Remove affected breakout branch and dependent upside content; retain independently valid pullback/core content. |
| Individual upside/downside point lacks evidence or violates sequence/spacing | Omit the point; revalidate subsequent points against retained boundaries and explicit dependencies. |
| Pullback lacks candidate IDs, cites unknown ID, mismatches candidate zone, reverses zone, is not below reference, or has invalid confirmation/invalidation | Omit that scenario. Evaluate the other scenario independently. |
| Low-confidence pullbacks, or pullbacks active at/below momentum failure | Omit active pullback scenarios; retain independently valid failure/recovery analysis. |
| Deep invalidation below momentum failure | Omit deep scenario; do not move its prices or relabel it as recovery. A separately valid recovery scenario may remain. |
| Shallow/deep overlap or insufficient separation | Retain the scenario with stronger measured structural support; if indistinguishable retain one with its original semantic label. Never merge zones or promote deep to shallow. |
| Pullback first objective invalid | Null the optional objective and remove dependent objective prose; retain a valid zone/confirmation/invalidation. |
| Recovery zone/candidate/reclaim/establishment ordering invalid | Omit recovery scenario; retain valid core and independent downside checkpoints. |
| Recovery first objective invalid or duplicates establishment | Null that optional objective; preserve a valid recovery sequence. |
| Unsupported premarket-high claim, zero-volume claim, operational-volume commentary, forbidden terminology | Attribute issue to its field/section instead of concatenated whole-card text. Omit affected optional text/section; if core claims depend on it and cannot stand independently, reject the new core. No blind word substitution. |
| Isolated news/source claim or malformed optional section | Omit affected content and references. Preserve TradersLink-first source policy and Stock Titan display suppression. |

An accepted partial card needs aligned identity/reference/time and at least one
complete supported trading scenario with its applicable failure condition.
News alone or isolated prices are not a complete analysis. Optional numeric
omission must be explicit, not normalized into invented values or generic
claims. Existing v2/v3/v4 payloads must continue to parse and render.

Dependencies use field/scenario IDs, not guessed English text. Where prose
cannot safely be disentangled, omit the complete affected paragraph. Keep
independent scenarios, and revalidate the final assembled payload once. The
post-validation outer-resistance augmentation must use the same section-local
rules so a bad added point cannot invalidate an otherwise publishable card.

## Microcap input and setup selection

- Freeze one reference quote/time and the exact input candle set for generation.
  Candidate construction, prompt, validation and published price must all use
  that same reference, not separate live prices sampled during the request.
- Include both recent momentum structure and the broader session move/origin.
  Rank candidates by observed base duration, repeated acceptance/retests,
  recency, move relationship and reported volume when available. Do not prefer
  the highest-priced candidates merely because they are closest.
- Supply candidate distance from reference, zone width, retracement relative to
  the observed impulse, typical candle range and wick behavior. Keep timeframe
  and session explicit. Average high-low range must not be labelled true ATR.
- Distinguish immediate momentum retest, shallow pullback, deeper reset and
  post-failure recovery. A tiny nearby shelf may be useful momentum context
  without earning a shallow-pullback label. The model cannot rename arbitrary
  percentage offsets as observed bases.
- Select failure and pullbacks jointly using structural evidence. A meaningful
  deeper base remains eligible for review even when a tighter provisional
  failure choice would exclude it; final published ordering still must agree.
- Separate numeric rounding tolerance from economic separation and setup
  quality. Use price precision for equality; use measured tape structure for
  meaningful separation. Calibrate on frozen fixtures, not a new universal
  2%, 10% or 15% rule.
- Do not invent float, spread, halt, split-adjustment or volume facts absent
  from available inputs. Preserve farther observed continuation coverage and
  existing source policy; adding a paid data provider is out of scope.

## Full audit capture and proposed visible behavior

Store the exact outgoing JSON body (without transport credentials), original
response body, request/response IDs, reference quote/time, generation trigger,
code/prompt/schema hashes, validation issues, normalized published payload and
cost. Preserve all stages under one generation ID. Full content is owner-only,
never embedded in the public Watchlist payload or browser logs.

Proposed diagnostic storage: runtime durable volume, per-generation bounded artifacts with
atomic writes and a small metadata index. Retain full artifacts 14 days with a
256 MiB total cap and 2 MiB per artifact; prune oldest completed artifacts only.
Oversize/unavailable capture must be explicitly recorded, never described as
complete. Keep existing accounting/history retention unchanged. Capture failure
must not cause another paid call or suppress otherwise publishable analysis.
No hosted storage setup or schema migration is authorized by this proposal.
The retention limits above apply to diagnostic artifacts only. The durable
original-analysis, saved-owner-revision and approved-publication audit below
must not silently expire under this diagnostic pruning policy.

## Owner review, editing and reversible automation — owner direction

This section supersedes earlier assumptions of immediate initial publication
or automatic boundary refreshes during the trial. Preserve existing automation
features for later use; do not delete them.

### Automatic follow-up AI control

- Admin label: `Automatic AI updates`. Default OFF for this trial, including
  the explicit rollout setting for the existing installation, not only new
  installations. Do not change the live setting during preparation.
- Reuse an existing setting only if it covers every automatic follow-up model
  request. A boundary-only switch is insufficient if scheduled, price-move,
  startup, visibility or deferred paths can still generate replacement reads.
  Otherwise add a persisted umbrella switch; preserve the existing subordinate
  controls and their saved values. Re-enabling must not erase previous choices.
- OFF blocks automatic follow-up OpenAI calls, including pending deferred
  follow-ups and restart recovery of them. It does not cancel an already-sent
  provider request or pretend its cost did not occur. ON must not drain stale
  deferred work blindly; reassess current eligibility and existing budget gates.
- Keep `Refresh AI Read` available as an intentional new paid request, subject
  to the existing master/session permission and in-flight/spend safeguards.
- Continue market-data ingestion, live prices, volume and existing non-AI
  updates without OpenAI calls. Initial draft generation remains available
  when the master and current-session settings permit it.

### Initial publication gate

- For a newly added ticker, if both AI generation and the current AI session
  are ON, prepare it privately and show `Awaiting review`. Hold ALL initial
  public Watchlist surfaces and Discord posts until owner approval, not just
  the AI card. Pending ticker data/direct URLs must not leak to ordinary users.
- If the master OR the current-session AI setting is OFF at addition, publish
  normally without review and without an initial AI request. The Top Regular
  exception must not override this owner-defined rule for this workflow.
- Record the admission decision and session. A clock/session transition or
  later switch change must not silently release an already-held draft, generate
  it twice, or retroactively hide an already-published ticker. Recheck model
  permission before dispatch; a held item remains available for owner review.
  The admission metadata and OFF-to-ON preparation-race checkpoint are recorded
  in [Progress](watchlist-analysis-quality-progress.md); complete restart and
  removal/re-add acceptance remains part of the full inventory.
- An AI failure remains private as `Needs attention`; allow owner correction
  and an explicit manual refresh, not automatic paid correction or publication.
- This workflow is reversible. Preserve the normal auto-publication path for
  later use; propose an Admin `Review before publishing` switch, ON for this
  trial, which applies only when master and current-session AI are ON.
- Manual replacement analysis while review is enabled also stays private until
  approved; keep the previously approved public version visible meanwhile.
  Re-enabled automatic updates use this same review gate while review is ON.

### Owner editor and publication

- Show the complete analysis, website preview and Discord preview. Allow text
  edits, individual prices/ranges and hiding/showing optional sections. Retain
  supported momentum, breakout, shallow/deep pullback and recovery structure.
- Actions: `Save draft`, `Preview`, `Approve and publish`, `Refresh AI Read`.
  Editing, saving and previewing never send an OpenAI request. Refresh is a
  distinct paid action and must not overwrite a saved owner revision.
- Show numerical/structural inconsistencies for owner review without silently
  changing prices, undoing edits or applying AI candidate-evidence restrictions
  to owner-authored corrections. Keep technical payload and access validation
  separate from warnings about trading interpretation.
- Approval pins an exact saved revision and the previewed destination payloads.
  Editing after approval creates a new unapproved draft. Reject stale approval
  submissions rather than publish a different revision from the one reviewed.
- Save approval and delivery status durably before dispatch. Website and
  Discord delivery are separately acknowledged and idempotent; partial delivery
  is visible to the owner and retries only the missing destination with the
  same approved payload. Never regenerate AI to repair delivery.
- Hold state survives restart and respects removal/re-add lifecycle identity.
  Existing public/live data refreshes must not bypass the initial publication
  gate. No owner needs to run tests or manage worktrees for this workflow.

### Durable version audit and owner-authorized Codex access

- Preserve the original AI analysis, each explicitly saved owner revision and
  the exact approved/published version. Store revision IDs, original generation
  linkage, actor, timestamps, changed/hidden fields, approval and per-destination
  delivery outcomes. Versions are append-only, not overwritten in place.
- Preserve original reference price/time and model provenance separately from
  owner-editable analysis fields. Identify owner changes in the private audit;
  do not misattribute them to the original AI response.
- Keep these version records durably until an explicit owner-approved retention
  policy permits deletion. Diagnostic caps must not delete them. Handle storage
  failure visibly and preserve unsaved edits; never claim `Saved` or dispatch
  an approval whose revision could not be persisted.
- Provide an owner-only `Export audit` action for selected tickers/generations,
  including original, edits, approved version and available input diagnostics.
  Export no credentials or unrelated account data. The owner may explicitly
  authorize Codex to read selected records; do not add public links, automatic
  sharing or standing third-party access. Record unavailable historical packets
  explicitly rather than manufacturing them.

### Additional acceptance cases

- Master/session ON/ON: no website listing, detail/API exposure or Discord
  delivery before approval; OFF/ON, ON/OFF and OFF/OFF publish normally with
  zero initial AI calls. Include premarket, regular and postmarket cases.
- Automatic updates OFF: zero follow-up model calls across every trigger and
  restart/deferred path, while quotes and live-data updates continue. Manual
  refresh remains distinct; toggling ON restores preserved eligible behavior.
- Review mode, automatic updates and session switches remain separate controls.
  Pending drafts do not leak when switches or sessions change.
- Text/price/section edits save without AI calls; originals and multiple saved
  revisions survive restart and export accurately. Older published revision
  remains intact while a new draft is reviewed.
- Double approval, stale browser revision, concurrent edits, removal/re-add,
  storage failure and one-destination delivery failure cannot publish an
  unapproved version, duplicate a post or lose the audit trail.

Member copy: retain `TradersLink Analysis`; show valid scenarios in their
original order, with no empty placeholders for rejected scenarios. If both
pullbacks are omitted, omit that section. Add the retained scenario rationale
under its existing fields. Replace `Restores original bullish thesis` with
`Recovery setup established above`. Keep omission/error codes in owner Admin.

Owner outcomes: `Published`, `Published with omissions`, `Failed`.
Owner detail labels: `Input packet`, `AI response`, `Published analysis`,
`Omitted sections`, `Reason`, `API requests`, `Estimated cost`. Example:
`Shallow pullback omitted: zone was not below the analysis reference price.`
Show separate generation count and actual API-call count to prevent the current
one-request/two-attempt ambiguity. Do not add generic explanatory card subtitles.

## Implementation boundaries and acceptance

Ordered slices: (1) source reconciliation and secure capture contract;
(2) one-call generation plus section validation; (3) candidate/input improvements;
(4) owner review/editor, publication gates, version audit and reversible
automation controls; (5) compatible rendering, owner history and Help;
(6) focused offline QA and
release-ready handoff. Production cutover is separate and precedes any live
testing of changed generation behavior. Capture cannot recover old missing data.

Runtime candidate allowlist: existing AI service, price-action builder,
cost/run ledgers, manager orchestration, runtime console renderer, shared
live-watchlist payload types and their exact focused tests; new audit-artifact
module/test if needed. Add narrowly scoped settings/persistence, lifecycle,
website/Discord publisher gating and review/version modules plus their focused
tests for the owner-review slice. Resolve exact files before implementation;
this does not authorize broad publisher changes. Resolve the console renderer filename and deployed
source parent before editing. No provider/ingest-engine rewrite or scheduler
redesign. Runtime implementation is authorized in the canonical
`C:\Users\jerac\Documents\TraderLink\levels-system-post-mtf-handoff-stability`
checkout; preserve its branch and unrelated data. Filesystem approval remains
required when an operation exceeds this task's writable roots. Do not create
another checkout or use the deprecated sibling `levels-system`.

Platform candidate allowlist: `app/watchlist/live-watchlist-client.tsx`,
`src/lib/live-watchlist/traderslink-ai-read.ts`,
`src/lib/live-watchlist/live-watchlist-types.ts`, their focused parse/display
tests, applicable Watchlist Help source, and these plan/progress files. Add only
the exact authenticated Admin review/export relay and pending-visibility read
paths required by that slice after identifying them. Global
CSS only if demonstrably needed and explicitly added to the slice allowlist.
Recap implementation is a separately reconciled slice, not permission to edit
another dirty worktree. Do not create a migration speculatively.

At the approved checkpoint use one worker and no file parallelism: focused
runtime validation/candidate/capture/accounting tests, Platform parse/display
checks and scoped type/lint checks. Mock OpenAI: assert exactly one request for
every success, omission, malformed JSON, refusal, timeout and model-access case.
No broad suite, server or production build without a separately required gate.

Fixtures must cover FTFT/TNON/AEON retained excerpts labelled partial; synthetic
complete packets labelled synthetic; missing candidate, rounding boundary,
invalid objective only, overlapping zones, meaningful deep pullback, shallow
miss then rally, full failure/recovery, unrelated bad news, sparse volume,
quote disagreement, truncated response, audit disk failure and publication
retry. These fixtures establish code behavior, not reconstructed historical
market facts. Verify mobile/desktop, older payload compatibility, no dangling
conditions and no restriction on owner-edited recap posting.

## Next gate

Implementation is owner approved and underway. Finish the complete acceptance
inventory and reconcile narrow source ownership before the release handoff;
the progress record identifies verified slices and remaining gaps.
Release requires separate explicit owner approval after market close; reaching
that time is not authorization, and market close must account for enabled
extended-hours publishing rather than assume 4 PM means the runtime is idle.
