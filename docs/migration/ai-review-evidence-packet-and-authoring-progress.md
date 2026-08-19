# AI Review Evidence Packet and Authoring Progress

## Status

The V4 authored-review flow is active in local development. New weekly and
monthly reviews are OpenAI-authored from immutable account-scoped evidence
packets, with provider receipts and immutable saved output. The owner approved
the presentation direction and waived a separate UI-approval gate on
2026-08-19. Earlier issued reviews remain unchanged.

## Current checkpoint

- [x] Reject deterministic complete-review rendering and selection.
- [x] Record OpenAI as the required visible-review author.
- [x] Record the conservative evidence-packet boundary.
- [x] Record the owner-approved weekly presentation target.
- [x] Implement the inactive weekly authoring contract.
- [x] Build and audit the 100-trade evidence packet.
- [x] Run the single Sol-high live authoring call.
- [x] Review exact output, token usage, packet size and numeric grounding.
- [x] Activate the forward-only authored-review contract without rewriting
  earlier issued reviews.

## Checkpoint 1 evidence

The inactive contract now preserves all 100 compact trade rows, the exact five
daily results, varied reflections, notes, rule results, current focus, earlier
weekly context and 11 calculated observation families with explicit overlap
membership. The trade core and Analyzer execution-path matrix are linked by
prompt-safe references, so Analyzer facts are not repeated in every trade row.
OpenAI remains the only prose author.

The provider-free preflight passed on 2026-08-19 with:

- 100 closed trades and five trading days;
- exact daily net P/L of `210.00`, `260.00`, `-260.00`, `90.00` and `84.00`;
- exact weekly net P/L of `384.00`;
- 100 Analyzer-ready rows, 100 trade notes and five completed reflections;
- ten trades after Wednesday's consecutive-loss boundary with combined net P/L
  of `-186.00`;
- no invalid generated Eastern times; and
- a 95,917-byte serialized evidence packet after the approved linked-matrix
  compaction (down from the initial 138,884-byte representation).

Focused TypeScript compilation and ESLint passed for the new contract,
authoring module and acceptance script. No Vitest, broad suite, production build,
database mutation, saved-review UI change or provider call occurred during the
preflight.

## Live Sol-high acceptance result

Exactly one `gpt-5.6-sol` high-reasoning provider call ran on 2026-08-19. It
received all 100 trade rows and the complete 138,884-byte packet. Reported usage
was 37,904 input tokens, 37,901 cache-write input tokens, 2,685 output tokens and
40,589 total tokens. Estimated provider cost was 31.74 cents.

The response passed the substantive review:

- it compared the exact current and previous weekly results;
- it identified 12 green-to-red trades at `-431.00` as the largest loss cluster;
- it correctly recognized that those were the same 12 trades as the planned-risk
  rule breaks rather than adding the two losses;
- it correctly treated eight post-loss-sequence trades as an overlapping subset;
- it explained Monday through Friday in chronological order with exact daily
  activity and P/L;
- it challenged the trader's reflection about later attempts by showing that
  later attempts were positive overall and that the negative relationship was
  specifically the ten trades after the consecutive-loss boundary; and
- it contained no invented motive, trading command, recordkeeping feedback or
  coverage filler.

The initial local audit classified the phrases `lost $431.00` and `lost $186.00`
as positive currency amounts because it understood only an explicit minus sign.
This was an audit-parser false positive, not a model error. The parser now
understands direct loss language, and a provider-free re-audit of the exact
captured output passes with no unsupported money or percentages. No second
OpenAI call was made.

The initial captured output remains inactive and is stored only in the local
ignored acceptance artifact
`.local-logs/weekly-evidence-authoring-sol-high-2026-08-19T13-19-30.362Z.json`.
The saved AI Review page and development Journal database remain unchanged.

## Final compact-packet Sol-high check

After the owner-approved linked core/Analyzer-matrix compaction, one further
`gpt-5.6-sol` high-reasoning call checked the exact 95,917-byte packet. It
received all 100 trade rows and reported 26,210 input tokens (26,207
cache-write), 3,486 output tokens and 29,696 total tokens. Estimated provider
cost was **26.84 cents**.

The output passed the same structural, numeric-grounding, prohibited-inference
and recordkeeping audits. It accurately covered the +$384.00 week, the 12
fully overlapping planned-risk-break/green-to-red trades at a $431.00 loss, and
Wednesday's ten trades after two consecutive losses at a $186.00 loss without
counting either loss twice. Its optional insight correctly separated later
ticker attempts overall (+$148.50 across 40 trades) from the narrower,
negative post-loss subset. The tightened direct-trader wording held: it did not
refer to supplied data, evidence packets or a supplied comparison.

The exact final artifact is local and ignored at
`.local-logs/weekly-evidence-authoring-sol-high-2026-08-19T14-40-12.153Z.json`.
No saved review or review-page UI was changed.

## Controlled Terra-high comparison

At the owner's request, one `gpt-5.6-terra` high-reasoning call received the
exact same 138,884-byte prompt and 100-trade evidence packet. It reported 37,904
input tokens, 37,901 cache-write input tokens, 934 output tokens and 38,838
total tokens. Estimated provider cost was 10.60 cents.

Terra's response passed all structural, evidence-reference, numeric, prohibited-
inference and recordkeeping audits. It correctly identified the fully overlapping
12-trade green-to-red/planned-risk cohort at `-431.00`, correctly kept the ten
post-consecutive-loss trades at `-186.00` inside Wednesday's result, and wrote an
accurate five-day chronology.

Compared with Sol high, Terra's output was much shorter and selected no optional
additional insight. It did not surface Sol's useful finding that third-and-later
ticker attempts and post-11:00 trades were positive overall while the loss was
concentrated specifically in the ten trades after two consecutive losses. Sol
high therefore remains the better weekly-authoring candidate from this controlled
pair despite Terra's lower cost.

The exact Terra response is stored in the local ignored artifact
`.local-logs/weekly-evidence-authoring-terra-high-2026-08-19T13-41-02.814Z.json`.
No database or saved-review UI mutation occurred.

After the controlled comparison, the future authoring prompt was tightened so
visible prose must speak directly about `your trades`, `your results` or what
`you noted`. It now explicitly rejects internal-facing phrases such as `supplied
comparison`, `provided evidence` and `evidence packet`. Neither already-captured
model result was regenerated, preserving the controlled comparison.

## Owner-approved technical-indicator boundary

On 2026-08-19, the owner approved excluding candle-pattern classifications and
raw per-trade RSI, EMA-distance, VWAP-distance and relative-volume snapshots
from weekly and future monthly AI Review packets. The inactive weekly contract
and acceptance fixture now omit those fields. Trade-authored notes remain
unaltered, while financial, rule, tag, time/sequence and execution-path evidence
remain available to OpenAI. No new provider call was required because neither
accepted model response relied on the excluded indicator fields.

## Preservation boundary

- Existing issued reviews remain immutable.
- The current saved-review UI is unchanged during Checkpoint 1.
- No production or live development Journal data is written by the fixture.
- Unrelated concurrent working-tree changes remain untouched.

## Usage feedback and trader-authored context follow-up

- [x] Add a compact `AI Review usage` percentage bar directly below the AI
  Reviews page title. It reads the current subscriber allowance server-side
  and never displays dollars, tokens or provider terminology.
- [x] Tighten weekly and monthly authoring prompts so they actively look for a
  material connection between an earlier current focus, note or reflection and
  later exact results. Context remains optional rather than a forced review
  section, and it cannot independently prove a statistical or financial claim.
- [x] Preserve the requirement that any such connection cite both the
  trader-authored context and the factual period evidence.
- [x] Run the focused TypeScript check for the authored-review packet,
  persistence, issuance and AI Review page files.
- [x] Reserve 60% of each active subscriber-cycle allowance for the
  month-end review before any weekly provider call can use it. Weekly calls
  share the remaining 40%, while the monthly review can use any amount left
  in that pool. The provider-control repository applies the guard to both
  legacy and V4 reservations, so an internal V4 monthly extraction/synthesis
  run is protected just like a one-call monthly review.

## Local database handoff — migration 0065

On 2026-08-19, the local development database was one migration behind the
current manifest: 64 applied migrations through
`0064_platform_web_push`. Before the update, a recovery backup and independent
restore were created and verified against that exact 64-migration prefix. The
backup and restore matched the source registry, table counts, page geometry and
file identity, and the configured recovery authority was verified.

Migration `0065_coach_ai_review_insight_persistence` was then applied first to
the verified disposable restore and then to the development database. Each
application changed exactly that one migration. The final read-only validation
reports 65 migrations through 0065, schema digest
`1381f07f7c47e2c50f028cad970b0ff59be83afa142c6ea82077046e315c2e54`,
zero foreign-key violations and `quick_check=ok`. The protected recovery backup
is retained; no review content, issued-review UI, provider control, scheduler
or Chat setting was changed by this handoff.

## Monthly authoring acceptance — 420-trade full sequence

The monthly authoring slice is now implemented and acceptance-tested without
changing a saved review, the scheduler or the review-page UI.

The test intentionally issued four weekly reviews in chronological order for
August 3–7, 10–14, 17–21 and 24–28, then constructed a complete August review
with 20 further August 31 trades. The monthly authoring packet did **not**
contain any of those weekly review bodies. It retained all 420 closed trades,
420 linked Analyzer execution-path rows, 420 notes, 21 completed reflections,
exact day/week/month totals, rules, overlap relationships and compatible July
comparison measurements.

- The complete serialized month was 371,967 bytes, above the 256,000-byte
  direct-call boundary.
- The fallback retained complete calendar-week partitions of 95,420, 96,093,
  97,706, 95,391 and 27,850 bytes; each stays safely under the boundary.
- Sol high completed five internal factual extractions and one final visible
  monthly authoring call. The intermediate calls produced no trader-visible
  prose.
- The final authoring output passed structural, safe-language, evidence-reference
  and exact numeric grounding checks. It correctly did not double-count the
  61-trade planned-risk/green-to-red cohort, and it separated profitable
  later attempts overall from the narrower post-loss subset that was negative.
- The accepted output is stored only in the ignored local artifact
  `.local-logs/monthly-evidence-authoring-sol-high-2026-08-19T15-23-04.713Z.json`.

The successful four-week-plus-month flow reported 227,908 input tokens,
50,537 cached-input tokens, 177,341 cache-write tokens and 42,311 output
tokens. Its receipted estimated cost was 240.31 cents. An earlier monthly
attempt with a 4,000-token extraction cap returned no structured output and
did not provide usage, so it is not included in that receipted amount. The
extraction cap is now 7,000 tokens and the stage reports the failing partition
or final synthesis explicitly instead of returning an opaque error.

The approximately seven-minute full flow is primarily six sequential Sol-high
provider calls, not local packet construction. Elapsed provider time is not a
separate billing input; the repeated partition context and generated tokens are
what affect cost. The owner chose focused calendar-week partitions over a
faster, larger partition because the monthly review is not time-sensitive.

## V4 local activation and end-to-end evidence

- [x] Weekly authoring contract and compact core/Analyzer packet.
- [x] Monthly authoring contract, bounded fallback and full sequential test.
- [x] Migration 0065 recovery/apply/verification handoff.
- [x] Build the account-scoped weekly packet adapter from Journal facts.
- [x] Build the account-scoped monthly packet adapter and exact prior-month comparison reader.
- [x] Add forward-only persistence and reading for the new authored output.
- [x] Replace the forced old saved-review sections with the owner-approved
  snapshot, recap, chronology, optional-insights and coverage presentation.
- [x] Move new review issuance to the new AI-authored contract while preserving
  already-issued reviews.

Migration 0066 adds the immutable V4 snapshot, provider-call and issued-output
tables. A verified backup/restore preceded the local migration; disposable
initialization then applied all 66 migrations successfully. The implementation
keeps the pre-existing request row only as a scheduling and spend-control
carrier. The immutable V4 snapshot and issued V4 output are the authority for
what the model received and wrote.

A live synthetic weekly run for Aug 3-7 completed one Sol-high provider call,
saved its review and receipt, and passed foreign-key, wording and numeric-format
checks. A live January monthly run completed one Sol-high provider call from
the exact month-wide packet, saved its review and receipt, and passed the same
checks. The monthly run also verified that overlapping observations are
described without adding the same losses twice. The completed calls' stored
receipts cost 11.62 cents and 26.08 cents respectively. The local diagnostic
display now subtracts cache-write tokens from ordinary input before pricing, so
it matches those stored receipts.

The V4 pages compile and route to their authored records. A final runtime page
request could not complete because the locally started low-resource server did
not become responsive on the owner's saturated computer; that temporary server
was stopped. This does not alter the database, saved reviews or historic UI.
