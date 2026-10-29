# Watchlist price discovery and automatic refresh plan

Status: owner approved implementation, QA and Coordinator production handoff on
October 28, 2026. Implementation is present in the assigned Runtime and Platform
lanes; final verification and release are tracked in
[implementation progress](watchlist-price-discovery-boundary-progress.md).
No paid verification requests, live regeneration, test posts, settings changes,
historical rewrites or notification replay are authorized by this work.

## Intended behavior

When credible supplied history contains no meaningful resistance ahead, keep
Potential Targets visible with a deterministic, code-rendered explanation and
no invented numeric target. Persist an explicit state that prevents repetitive
upper-boundary requests, including the current 15% extension fallback and
breakout/must-clear-derived upper boundaries. Manual refresh and meaningful
lower-boundary updates remain independent and available.

This is not an all-time-high claim. The wording must describe the history that
was actually available, distinguishing a bounded usable sample from missing,
stale, invalid or unusable history. The feature cannot guarantee perfect chart
interpretation; its deterministic control flow and recorded evidence can be
verified.

## Available evidence

Runtime source is the assigned `watchlist-gain-runtime` checkout at deployed
`c2892b45e4e3f2003ef1118a9ab93a558b83eed2`. Platform production is
`a5ead4e35a846ac0d82cd365688b831d36ece8ee`. The bounded live read confirmed
`AIOK`; no `AIPOK` entry was present. No paid symbol lookup was used.

Confirmed in current source:

1. `watchlist-simple-analysis.ts` asks the model to put the no-higher-resistance
   statement in the explanation of its highest numeric area. There is no typed
   coverage field. This can encourage retaining the latest frontier as a row.
2. `watchlist-simple-content.ts` reconstructs accepted fields explicitly; a new
   prompt field alone would be discarded. The service also converts simple
   upside highs into compatibility `targets`.
3. `buildTradersLinkAiReadRefreshState()` includes targets, breakout and must-clear
   in upper boundaries. `decideTradersLinkAiReadRefresh()` uses a 15% extension
   trigger when no upper boundary exists. Simply clearing targets is insufficient.
4. A source-only replay with reference 20 and no upper target deferred at 23.10,
   then requested a read after another observation 31 seconds later. A target
   20.10 also requested a read at 20.50. These are control-flow examples, not
   actual ticker/request evidence.
5. The simple public card hides Potential Targets when its array is empty.
   It needs a real message state, not a dummy/null-price row.
6. In-memory store and disk normalizers independently rebuild boundary state.
   The in-memory normalizer omits existing pending/counter/date fields accepted
   on disk. An isolated replay of the actual in-memory normalizer confirmed
   that an input count of 2, its trading date and its pending confirmation are
   dropped, without mutating the input. Do not attribute hosted request frequency
   to that loss without correlating the audit. Preserve those existing fields
   alongside the new policy; do not add or change configured request caps.

The first read-only hosted probe passed exact deployment/source/original-volume
guards and read 15,763 bytes. At 3:17:38 PM ET, AIOK was active with a last
observed price of 25.86. Its saved boundary state referenced 23.22 and set 23.43
as both breakout and upside target; its lower boundary was null. The saved
generation time was 3:04:19 PM ET, and the last observed-price time was 3:17:28
PM ET. The saved automatic regime/date were null and automatic count was zero;
owner review was required. These are recorded state values, not proof that no
automatic requests occurred.

The owner ended further ticker-specific audit collection. Actual loop frequency,
total cost and complete target lineage have not been established and are not
requirements for this generic correction. Do not start, retry or expand the
additional operational probe. The recorded state and source-level behavior above
are sufficient to implement and test the contract without new live evidence.

## Typed evidence and policy contract

Use one versioned `upsideCoverage` contract in both the generated analysis and
the operational boundary state, with explicit machine discriminators. They are
separate instances: the published analysis describes its frozen input, while
operational state may assess newer shared data without modifying that analysis.

- `MAPPED_RESISTANCE`: meaningful observed overhead areas exist.
- `NO_HIGHER_RESISTANCE_IN_SUPPLIED_HISTORY`: the usable available history was
  assessed and no meaningful forward resistance remains for this context.
- `HISTORY_UNAVAILABLE`: history is missing, stale, invalid or unusable. This is
  not proof that resistance is exhausted.
- `LEGACY_UNKNOWN`: an older record has no trustworthy matching classification.

| Effective state | Member presentation | Automatic upper policy |
| --- | --- | --- |
| Mapped resistance | Existing numeric targets | Existing configured boundary rules |
| No higher resistance in supplied history | Deterministic no-higher message | Wait for distinct real structure; no target/breakout/must-clear/15% bypass |
| History unavailable | Distinct data-unavailable message when applicable | Preserve an existing credible pause; otherwise existing data/error handling, not a new exhausted-history inference |
| Legacy unknown | Existing saved content; no guessed no-higher claim | Existing behavior unless the generic evidence resolver establishes a valid state |

Manual requests and lower-boundary decisions remain separate in all four rows,
subject only to their existing settings and data requirements. This table governs
the classification context being displayed; historical views use saved context,
and a current overlay must identify itself separately.

Store policy version, evaluated reference/time, available historical range and
quality, evidence fingerprint/references, and provenance. Bind operational
state to activation, published generation/body identity and evaluated context.
Keep a separate semantic target/evidence identity: an unrelated owner text edit
changes the body hash but must not accidentally clear the upper pause. Rebind
the audit body identity on its approved edit while preserving the same policy
when targets/evidence are unchanged. An unapproved edit never changes the live
policy or card.

The exhausted state explicitly carries
`upperRefreshPolicy: WAIT_FOR_NEW_STRUCTURE`. No prose matching, sentinel price,
null-price row, percentage projection or empty-array guess acts as the signal.

The model may supply advisory classification/evidence with its existing single
request. Code determines the effective classification against the
actual packet, including daily/four-hour/same-day bars and declared limitations.
The resistance supplement alone is not the full history. A finite credible
sample is allowed with bounded wording; missing required history or a provider
error cannot be presented as proven price discovery. No inference of absolute
all-time highs from sampled history.

The deterministic evidence evaluator must check: matching ticker/activation and
timestamps; usable declared historical coverage and price scale; exclusion of
known synthetic levels; the existing observed resistance candidates corroborated
against supplied bars; and raw-history highs omitted from the compact map. A
missing compact map is not an exhausted inventory. If a raw higher area cannot
be confidently classified by the existing evidence rules, return uncertainty
rather than claim no higher resistance. A current expanding candle's new high
alone is not evidence of a new overhead rejection. Keep genuine prior-session
ceilings and confirmed intraday rejections; do not use fixed distance from price
or a ticker-specific threshold to decide relevance. Isolated fixtures must
exercise these criteria before using the evaluator for operational suppression.

If the model claims no resistance while usable supplied overhead evidence
contradicts it, retain the usable read with diagnostic coverage uncertainty;
do not invent a target, automatically reject the whole read or buy a correction
request just for this field. Old records and unknown future policy versions
remain viewable but do not acquire suppression through an unvalidated value.
Invalid or unsupported optional metadata is ignored for display and diagnosed;
it does not make an otherwise usable analysis fail validation or owner approval.
It also cannot erase a previously valid operational pause for the same activation.

## Generation and deterministic presentation

For verified exhausted history, allow empty simple `upside` and compatibility
`targets`. Preserve the Potential Targets heading and render this code-owned copy:

> No higher resistance is identified in the supplied price history.

For unavailable data render different code-owned copy:

> Higher targets could not be determined from the available price data.

Do not ask AI to compose these explanations. Never create a numeric frontier
row solely to attach the message or meet a target count/coverage percentage.
Suppress supplementation only for the verified exhausted state. Preserve real
intermediate/farther levels and legitimate session-high targets when they are
actually overhead and relevant; this is not a blanket ban on HOD targets.

Keep existing target hide controls and access restrictions: explicit owner
section hiding still hides it; otherwise an empty exhausted state is visible.
Premium-only/ticker restrictions must not leak prices, source evidence or hidden
analysis through message/image/preview output. Members see ordinary copy, not
machine codes. Admin audit records explain why upper requests are paused and
which evidence established it, without cluttering every ticker row.

The public card, inline editor, preview, previous-analysis view and image export
use the same message resolver, with the historical view using its saved context
rather than today's live overlay. An image-only target export must not render an
empty image or a fabricated row: include the real message panel or omit that
attachment with the existing notification text/link behavior preserved.
Image cache identity must include the effective coverage/context version, so
an existing cached numeric-target image cannot replace the new message export.
Apply that identity to new exports/approvals only. Already-frozen approval
images, receipts and retry payloads remain their exact saved derivatives; a
delivery retry is not permission to replace an earlier image with today's view.

## Direction-aware updates and transitions

1. Evaluate manual/forced requests and lower-boundary conditions independently
   before applying upper-only suppression. Never return early in a way that
   prevents a legitimate lower crossing. Preserve existing generation-off,
   session/cadence/cooldown, request-budget and review settings.
2. `WAIT_FOR_NEW_STRUCTURE` blocks automatic rising-price requests through all
   upper paths: target, breakout, must-clear and 15% extension fallback. Higher
   quotes and newly printed highs alone do not purchase another read.
3. Reassess cheaply from existing shared candle/level updates. A newly evidenced
   overhead rejection/range after a meaningful retreat, or newly available real
   historical resistance above price, may rearm the normal upper policy. Reuse
   established observed-level evidence; do not add a new frequent provider poll
   or use every new candle/high as a new structure identity.
4. Rearm against that specific observed price/area, not a null upper boundary.
   The exhausted state must not regain the 15% fallback merely because fresh
   data arrived. The new operational candidate is not an owner-approved target:
   do not insert it into the public analysis before a new analysis is published.
   Require a distinct stable structural evidence identity, not a timestamp of
   the latest quote. Persist the rearm identity and served regime so repeated
   observations, whipsaws, restarts, moves and delivery retries cannot purchase
   the same assessment repeatedly. New evidence rearms normal trigger rules;
   it does not mandate an immediate AI request in the absence of a valid trigger.
   A failed, cancelled, interrupted or uncertain generation does not clear the
   pause or automatically purchase another read for the same consumed event.
   Keep existing configured fallback attempts within one generation unchanged;
   manual refresh remains the explicit retry option. Persist dispatch ownership
   and identity before paid work so concurrent callbacks or restart cannot
   duplicate the same automatic event.
5. Midnight/session changes alone do not clear the state. A new activation has
   its own identity and cannot inherit another activation's state. Changing
   provider coverage to unavailable does not masquerade as new resistance or
   silently restore the 15% loop. Retain the previous credible pause's identity
   operationally while labelling the latest data unavailable; do not keep
   asserting that stale/missing data proves there is no higher resistance.
6. A lower-triggered or manual new read can legitimately update the classification.
   Preserve it through draft/approval/auto-publication/acknowledgement and compact
   projections. A waiting replacement never removes the approved public read.
7. Owner-added/changed numeric targets remain authoritative and unrestricted.
   Record owner provenance, keep exact values, and derive their upper boundary
   rather than falsely describing them as observed historical resistance. A
   valid owner target can re-enable upper behavior. Unrelated edits, section
   hiding and removing a row are not evidence that history is exhausted.
   Only a published owner edit changes live target policy; draft preview state
   is isolated. Preserve owner provenance across future copies and recoveries.

## Existing published read without regeneration

For any existing published ticker, use its recorded packet/current
publication and already-cached trustworthy market/level context to derive a
separate operational state when identities and evidence match. No paid request,
original payload rewrite or historical analysis mutation is needed.

Where existing generated targets are demonstrably exhausted and no higher real
inventory is available, a code-owned current-view context can show the message
in Potential Targets instead of republishing a frontier target. Keep the saved
analysis timestamp/price/history and original screenshot view intact, and label
any changed live context separately from the original analysis. Do not remove
unreached genuine targets or owner-entered targets under this compatibility rule.
If recorded evidence is missing/ambiguous, use `LEGACY_UNKNOWN` and report that
limitation rather than silently classifying from prose. Implement this resolver
generically and test matching, missing and contradictory records offline;
additional AIOK access is not a prerequisite. No hard-coded symbol or price.

Keep the current-context overlay separate from the stored card and original
history. If newer evidence rearms operational monitoring while the old analysis
is still displayed, its original no-higher message remains scoped to that read's
dated input, not a claim about the new inventory. Any live-context message is
clearly identified as current context and must never masquerade as a newly
approved analysis. No new numeric candidate is published by this mechanism.

Optional JSON fields are expected to avoid a database migration. Verify the
complete normalization/serialization chain rather than assuming unknown keys
survive. No global setting is silently disabled and no new approval restriction
is introduced. Notifications remain subject to the owner's existing controls.

## Implementation inventory after owner agreement

Runtime candidate paths:

- New pure `src/lib/ai/watchlist-upside-coverage.ts` and focused tests.
- `src/lib/ai/watchlist-simple-analysis.ts`, `watchlist-simple-input.ts`,
  `watchlist-simple-content.ts`, `traderslink-ai-read-service.ts`,
  `traderslink-ai-read-owner-edit.ts` for schema/input/normalization/edit provenance.
- `src/lib/live-watchlist/live-watchlist-types.ts` and
  `src/lib/monitoring/monitoring-types.ts` for saved contracts.
- `src/lib/monitoring/manual-watchlist-runtime-manager.ts`, `watchlist-store.ts`,
  `watchlist-state-persistence.ts` for direction decisions and every persistence
  path, including archive recovery and current-record compatibility.
- Actual publication/preview/image adapters only where the traced state and
  message contract requires them: `src/lib/ai/watchlist-analysis-image.ts`,
  `watchlist-analysis-image-cache.ts`, `watchlist-simple-preview.ts` and the
  existing publication projection. Detailed shared refresh compatibility must
  honor the same policy without an unrelated detailed-prompt rewrite.

Platform candidate paths:

- `src/lib/live-watchlist/live-watchlist-types.ts`, `simple-analysis.ts`,
  `traderslink-ai-read.ts`, `analysis-inline-edit.ts` and relevant API projection
  contracts so new fields survive read/edit/save/compact publication.
- `app/watchlist/simple-analysis-card.tsx`, actual detailed renderer where needed,
  the Runtime-owned image export contract and
  `app/(dashboard)/admin/watchlist/watchlist-analysis-editor.tsx` for consistent
  code-owned message/preview and owner-defined target handling.
- Existing Help/audit guide sections plus focused serialization/rendering tests.

Finalize an explicit allowlist after tracing the actual image/projection paths.
Do not expand shell/navigation, delivery channels/tags, provider cadence,
Gain/Loss, premium settings, swing/scanner features or the synthetic-level fix.

## Plan QA and mandatory regression cases

The plan QA identified and incorporated these gaps before coding:

1. Empty targets still invoke the 15% fallback: explicit upper policy gates it.
2. Breakout/must-clear can bypass a target-only gate: cover every upper path.
3. A global early return could disable lower/manual updates: direction-aware order.
4. Unknown fields can disappear on parse/clone/save: enumerate all normalizers,
   publication, edit, compact API and restart paths and test round trips.
5. Empty arrays currently hide the targets section: code-rendered message panel.
6. Missing history could falsely suppress valid updates: separate evidence states
   with history/source identity and bounded language.
7. Prose-based backfill could overwrite owner/history: matching-record compatibility
   state and current context only; immutable original/version remains unchanged.
8. Every new high could repeatedly rearm: structural identity, not quote/candle time.
9. Owner edits/moves/retries could reset or trap suppression: preserve identity
   and track owner target provenance without new approval checks.
10. Images or premium projections could contradict/leak: test actual export and
    access-controlled presentation and cache identity, not just the normal
    desktop component. Historical screenshots retain their saved context.
11. Existing frozen notification images must not change during a retry: new
    message/context cache versions apply only to new exports or approvals.
12. Binding only to the body hash would undo suppression after unrelated owner
    edits: retain a separate semantic target/evidence identity and rebind only
    on approval. Held edits do not change the live policy.
13. Rearming a null upper boundary could silently restore the 15% loop: bind
    rearming to a distinct real observed boundary and consumed-event identity.
14. Late or concurrent callbacks could reset state or buy duplicate reads: check
    activation/publication identity and persist dispatch ownership before work.
15. A new typed field could introduce a whole-read validation failure: optional
    malformed metadata degrades to diagnosed uncertainty, not rejected approval.
16. A per-ticker live investigation was becoming an unnecessary dependency:
    remove it; generic recorded/offline fixtures qualify this implementation.

Required tests: repeated highs produce zero upper requests even with fallback
and breakout/must-clear present; lower crossing still requests; manual refresh
still works; off/session/cooldown behavior unchanged; same structure rearmed at
most once; real new resistance/owner targets restore the right boundary; no
false price discovery on missing/stale/unusable history; state survives every
save/read/move/retry/restart path; prior activations stay isolated; genuine mapped
targets unchanged; empty state visible on desktop/mobile/light/dark with correct
premium restrictions; no whole-read rejection or new owner-approval blocker;
concurrent/late events, failures, cancellation and uncertainty never bypass the
same-event rule; ordinary genuine mapped analyses and configured fallbacks retain
their existing behavior.

Use recorded packet replays and isolated decision/rendering tests first. No
live analysis changes or posts are part of verification. After owner agreement
and implementation, Coordinator performs clean allowlisted builds and sequential
single-writer release, followed by read-only existing-ticker/state/audit checks.
No automatic regeneration, replay/backfill or new polling is a rollout step.

## Final plan recheck

The whole plan was rechecked after the corrections above. Every state has an
evidence/compatibility path, member presentation, operational upper policy and
owner/manual/lower behavior. The parser, editor, save/publication, compact API,
normalizer, restart, access and image paths are in the implementation/test
inventory. No remaining plan blocker or additional owner question is identified.
This section records the pre-implementation plan QA. Actual implementation,
verification results and Coordinator release receipts belong in the linked
progress record; a local test or handoff is not deployment evidence.
