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
- [ ] Implement and calibrate the deterministic insight engine.
- [ ] Run the true-month issuance and provider stability acceptance.

The sixth-pass design supersedes the prompt-only path's proposed multi-stage
oversize handling. Once the insight engine is active, TraderLink calculates and
renders the complete review locally from all exact facts. If the full frozen
selection package cannot fit the configured model envelope, it issues that
complete-source deterministic default; it does not split one review into two
independent provider judgments or omit monthly evidence.

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
