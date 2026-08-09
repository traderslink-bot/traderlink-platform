# AI Reviews Monthly Cost Benchmark Progress

## Status

Completed on 2026-08-09. Production payload integration, exact token counting,
15 accepted Luna generations, output QA and the cost/limit recommendation are
complete. No database migration, Tracker UI change, provider activation,
scheduler activation, deployment or port-3010 action occurred.

## Checklist

- [x] Confirm current Luna documentation and pricing source.
- [x] Audit existing AI Review, rule/tag/note and analyzer contracts.
- [x] Define exact low, midpoint and high-end monthly profiles.
- [x] QA month boundaries, duplicate-evidence risk and note-limit assumptions.
- [x] Add compact analyzer evidence and named rule outcomes to AI Review inputs.
- [x] Add deterministic payload assertions and official input-token counting.
- [x] Add the explicit-confirmation Luna monthly benchmark runner.
- [x] Run four weekly reviews and one monthly review for each profile.
- [x] Audit outputs and publish the cost/limit recommendation.

## Evidence so far

- Current AI Review trades contain rule counts and tag names but no rule names
  or analyzer evidence.
- Daily-note fields are clipped to 700 characters and trade notes to 500 in the
  current Tracker platform-data boundary. Journal services permit longer text,
  so the product currently lacks a disclosed end-to-end limit.
- The approved analyzer contract provides derived 1-minute event snapshots,
  5-minute execution context, green-to-red path summaries, profit-opportunity
  windows and 5/15/30/60-minute post-exit paths.
- Official OpenAI documentation fetched on 2026-08-09 lists GPT-5.6 Luna at
  $0.20 per million input tokens, $0.02 per million cached-input tokens and
  $1.20 per million output tokens. Raw token counts remain authoritative for
  later repricing.
- The accepted 15-call artifact is
  `.local-logs/ai-review-monthly-cost-benchmark-2026-08-09T14-32-17.746Z.json`.
- Uncached four-week-plus-month planning costs were $0.01702520 low,
  $0.06357340 midpoint and $0.23052180 heavy. Five-week extrapolations were
  $0.02051870, $0.07713365 and $0.27993250 respectively.
- The first heavy monthly shape exceeded the context window because it resent
  analyzer details and reflections already represented by weekly reviews.
  The accepted contract keeps all exact-month trade/P&L/tag/rule facts, issued
  weekly narratives and uncovered-date analyzer/reflection facts without
  double-sending represented analyzer/reflection evidence.
- All final outputs passed structured-output and TraderLink safety checks. The
  low-data profile still received useful execution/analyzer feedback without
  being told that daily Trade Tracker participation was required.
- Focused ESLint passed for every changed AI Review contract/runtime/provider
  and benchmark file. The repository-wide TypeScript checkpoint still fails in
  unrelated active Analytics, Calendar, Tracker, Moomoo and legacy test work;
  after the local strict-type corrections it reported no errors in the owned
  benchmark or AI Review integration files.
