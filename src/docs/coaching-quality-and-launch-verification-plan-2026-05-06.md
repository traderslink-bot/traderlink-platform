# Coaching Quality And Launch Verification Plan - 2026-05-06

## Purpose

Move the app from "the analysis runs" to "an end user can trust the coaching."

This branch focuses on coaching quality, evidence alignment, representative
fixtures, and launch verification. It should improve the app's usefulness
without widening the market-data contract or making unsupported claims.

## Current Answer

Yes, Codex can build the small fixture/sample trades needed for this work.

The fixture set should be synthetic and deterministic, with prices, executions,
timestamps, and expected outcomes chosen to exercise specific behaviors. Real
IBKR CSVs can be used for private smoke testing, but misses from private data
should be converted into synthetic fixtures before they become committed tests.

`levels-system` and its candle warehouse may be used when a scenario needs
candle-backed movement, support/resistance, or trade-window evidence. The IBKR
Gateway can be used for local historical data checks if the warehouse is
missing a needed candle window, but gateway/API access should remain a local
verification path, not a required unit-test dependency.

## Scope

### In Scope

- Coach language quality for existing behavior coverage.
- Coach accuracy checks against expected behavior/evidence.
- Synthetic sample trade fixtures for common end-user scenarios.
- Real CSV aggregate verification using private artifacts when available.
- Public-safe readiness summaries that do not expose private trade data.
- Tests that prevent stale, generic, contradictory, or overconfident coaching.
- Documentation of remaining honest product limits.

### Out Of Scope

- User-local timezone display toggle, currently parked.
- New broker account persistence.
- Production order execution.
- Net-P/L scoring changes.
- New unsupported asset-class session rules.
- Tuning coaching against missing, stale, or price-basis-mismatched candles.
- Committing private IBKR CSVs or account artifacts.

## Guiding Principles

- Coaching language must be evidence-backed, specific, and calm.
- The app should identify the highest-value behavior first, not list every
  detected pattern equally.
- Positive behavior deserves useful coaching too, not only mistake detection.
- If market context is unavailable, the coach must say less rather than guess.
- Synthetic fixtures protect regressions; real CSVs discover gaps.
- Real-data misses should become sanitized synthetic fixtures before they drive
  permanent tests.

## Workstreams

### 1. Coaching Language Audit

Review current coaching outputs across:

- trade decision review headlines
- core issue
- what went wrong or right
- what to change next time
- coach home
- session prep card
- daily coach report
- review queue items
- confidence language

Improve wording so it is:

- specific to the trade behavior
- direct but not shaming
- actionable in the next trade/session
- explicit about evidence limits
- non-repetitive across nearby cards
- positive when the trader made a good decision

Acceptance criteria:

- No generic fallback headline appears in calibrated paths unless no stronger
  evidence exists.
- Every fix-first label has visible supporting evidence.
- Positive management cases produce useful preserve/repeat language.
- Execution-only rows do not imply candle-confirmed continuation, support,
  resistance, VWAP, EMA, or market-structure claims.

### 2. Coaching Accuracy Audit

Build a compact expectation matrix that checks whether the coach emphasizes the
right behavior.

Target checks:

- chase entry is not mislabeled as structured execution
- adding into weakness beats weaker generic scaling labels
- premature exit requires continuation evidence
- poor profit protection requires failed-protection evidence
- structured execution is not selected when a stronger mistake exists
- positive management can become the main story when no major mistake dominates
- session-time context supplements the lesson without taking over the coaching

Acceptance criteria:

- Matrix cases define expected primary behavior, required text fragments, and
  forbidden text fragments.
- Tests fail when stale labels, contradictory labels, or unsupported claims
  reappear.

### 3. Synthetic Fixture Library

Create a small coaching fixture library. These should be committed test fixtures
or fixture builders, not private CSVs.

Initial scenarios:

- clean long winner with structured entry and constructive exit
- chase entry near highs with limited remaining room
- add into weakness / averaging-down loser
- under-pressed winner that never reached useful size
- timely trim into strength with constructive final exit
- timely trim into strength with premature final exit
- profit giveback after peak open profit
- stop-like forced exit after breakdown
- short winner with direction-aware wording
- same-symbol re-entry later in the day
- premarket-to-open hold
- market-open-to-midday hold
- post-market-to-overnight hold
- open position that should be review-gated
- execution-only fallback with no candle-backed claims

Fixture design:

- Keep fixtures minimal and readable.
- Prefer builder functions over large static JSON when the scenario is easier
  to understand from named parameters.
- Include expected behavior IDs, expected headline fragments, forbidden
  fragments, expected session bucket/hour where relevant, and evidence
  requirements.
- Use levels-system deterministic candle fixtures only where market context is
  part of the assertion.

Acceptance criteria:

- Fixtures cover both mistake and positive-management cases.
- Fixtures cover long, short, completed, open, and multi-session trades.
- A future real-data miss can be copied into this library as a sanitized
  synthetic reproduction.

### 4. Real CSV Verification Expansion

Use local private CSVs only for aggregate/readiness checks.

Checks:

- parse accepted/rejected/skipped counts
- grouped trade counts
- completed/open trade counts
- session/hour distributions
- decision-review completed/fallback counts
- stale invariant counters
- unsafe candle-basis rows
- market-context source distribution
- top coaching headline distribution
- private path/artifact exclusion from committed docs

Acceptance criteria:

- Public-safe report includes aggregate counts only.
- Report states what was verified and what remains private/local.
- No private CSV content or account identifiers enter committed files.

### 5. Market-Data / Levels-System Validation

Use this only when coaching claims depend on candle-backed movement or
higher-timeframe levels.

Preferred order:

1. Use deterministic existing fixtures in this repo.
2. Use `levels-system` deterministic fixture services.
3. Use `levels-system` candle warehouse for local historical windows.
4. Use IBKR Gateway only as a local fetch/backfill tool if warehouse coverage is
   missing.

Acceptance criteria:

- Tests do not require live IBKR Gateway.
- Market-data-backed coaching says which basis was used.
- Missing candle windows produce execution-only/fallback coaching, not
  overconfident movement claims.

### 6. Product Surface Verification

Verify the surfaces an end user would touch:

- `/import-dry-run`
- `/analytics`
- `/coach`
- `/review`
- `/session-recap`
- `/trades/[tradeId]`

Checks:

- coach copy is readable on desktop and mobile
- review queue actions point somewhere useful
- evidence cards match the headline
- session-time facts render without crowding out the main coaching lesson
- import safety and gross-only policy remain visible

Acceptance criteria:

- Focused Playwright tests cover the highest-risk routes.
- Production build passes.
- Screens with fixture/sample states do not imply production persistence or
  live trading execution.

## Implementation Sequence

### Phase 1: Audit And Snapshot

- Inventory current coaching output builders and templates.
- Add a small snapshot/readiness harness for current coach language.
- Record current weak/generic language cases in this plan.

### Phase 2: Fixture Library

- Add the synthetic coaching scenario fixtures.
- Include positive and mistake-side cases.
- Add expected primary behavior and language/evidence assertions.

### Phase 3: Language And Accuracy Patch

- Improve templates/selectors where the fixture matrix exposes weak wording.
- Tighten priority rules only when evidence shows the current order is wrong.
- Keep lower layers factual; do not push coaching language into Layer 1 or
  Layer 2.

### Phase 4: Real-Data Readiness

- Re-run available private IBKR CSV calibration in aggregate-only mode.
- Convert any confusing real-data miss into a sanitized synthetic fixture.
- Produce or update a public-safe readiness report.

### Phase 5: Browser And Build Verification

- Run focused unit tests.
- Run TypeScript.
- Run production build.
- Run focused Playwright route checks for coach/import/review surfaces.

## Verification Commands

Start focused:

```bash
npx vitest run src/lib/trader-analytics/__tests__/coaching-behavior-evidence-matrix.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts src/lib/trader-analytics/__tests__/trader-improvement-intelligence.test.ts --reporter=dot
npx tsc --noEmit --pretty false
```

After fixture/library changes:

```bash
npx vitest run src/lib/trader-analytics/__tests__/coaching-behavior-evidence-matrix.test.ts src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-bridge.test.ts src/lib/trader-analytics/__tests__/build-trader-analytics-report.test.ts --reporter=dot
```

Before closing the branch:

```bash
npm run build
npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop --grep "prototype analysis|renders the required product panels"
npx playwright test tests/e2e/app-acceptance.spec.ts --project=chromium-desktop --grep "opens every sample trade|filters analytics"
```

Use broader verification if shared behavior or layer contracts change:

```bash
npm test
npm run verify:layer2
npm run verify:layer3
```

## Launch Readiness Answer

The app should be launchable for the current intended scope when:

- IBKR/generic import parsing works for representative cases.
- Buy/sell math and grouped trade lifecycle tests pass.
- Coaching fixture matrix passes.
- Real CSV aggregate smoke has no unexplained blockers.
- Market-context-backed claims have valid levels-system/candle evidence.
- Execution-only fallback rows remain honest.
- Production build and focused Playwright tests pass.

## Working Notes

- 2026-05-06: Plan created. Next step is Phase 1 audit/snapshot, then the
  synthetic coaching fixture library.
- 2026-05-06: Phase 1 started. Added
  `buildCoachingLanguageReadinessReport(...)` to collect coach-facing copy from
  daily coach reports, coach home, session prep, confidence language, mistake
  severity, coach review queue, and session recap.
- 2026-05-06: First readiness pass on the sample analytics state checked `54`
  coach-facing text samples. Hard failures were `0`; warnings were `21`, mostly
  repeated exact copy across surfaces. This confirms the next useful slice is
  reducing repetitive coach language and then building the fixture-specific
  coaching expectation matrix.
- 2026-05-06 verification:
  - `npx vitest run src/lib/trader-analytics/__tests__/coaching-language-readiness.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts --reporter=dot`
    passed with `8/8` tests.
  - `npx tsc --noEmit --pretty false` passed.
- 2026-05-06: Completed the first coaching-language polish slice. Added
  taxonomy-specific review actions, reduced exact copy duplication across coach
  home, severity ladder, review queue, session prep, and session recap, and
  tightened the readiness test so the sample coach language must pass with zero
  hard failures and zero warnings.
- 2026-05-06: Latest readiness pass checked `54` coach-facing text samples and
  returned `pass` with `0` failures and `0` warnings.
- 2026-05-06 polish verification:
  - `npx vitest run src/lib/trader-analytics/__tests__/coaching-language-readiness.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts src/lib/trader-analytics/__tests__/trader-product-polish.test.ts src/lib/trader-analytics/__tests__/trader-improvement-intelligence.test.ts --reporter=dot`
    passed with `21/21` tests.
  - `npx tsc --noEmit --pretty false` passed.
- 2026-05-06: Phase 2 started. Added
  `buildCoachingFixtureExpectationMatrix(...)` and
  `runCoachingFixtureExpectationMatrix(...)` as a committed expectation matrix
  over representative synthetic/sample trade fixtures.
- Current matrix coverage:
  - clean long winner
  - direction-aware short winner
  - open-position review gating
  - adverse-add loser
  - structured partial-exit strength
  - inconsistent sizing
  - rapid-fire management
  - daily coach session-time text
  - coach queue primary behavior visibility
  - premarket into market-open holds
  - market-open into midday holds
  - midday into post-market holds
  - post-market into overnight holds
  - overnight into premarket holds
  - execution-only limitation copy
  - constructive full-trade management with controlled scale-in and staged exits
- 2026-05-06 fixture-matrix verification:
  - `npx vitest run src/lib/trader-analytics/__tests__/coaching-fixture-expectation-matrix.test.ts src/lib/trader-analytics/__tests__/coaching-language-readiness.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts src/lib/trader-analytics/__tests__/trader-product-polish.test.ts src/lib/trader-analytics/__tests__/trader-improvement-intelligence.test.ts --reporter=dot`
    passed with `22/22` tests.
  - `npx tsc --noEmit --pretty false` passed.
  - `npm run build` passed.
- 2026-05-06: Removed remaining app/source/test/README references to the
  unused removed historical provider. App-level request validation and env
  runtime validation now surface `ibkr`/`stub` only.
- 2026-05-06: Broader hardening pass completed:
  - Fixed stale automated import QA expectations for skipped non-trade and
    non-filled rows.
  - Fixed the duplicate-fill mutation so it duplicates an actual IBKR trade row
    instead of an activity-statement metadata row.
  - Updated stale shared `levels-system` fixture assertions and snapshot values
    after the shared engine began returning `6` support levels and `3`
    resistance levels in the sample context.
  - Updated the Schwab import browser expectation from a review-needed row to
    the current informational skipped-row policy.
- 2026-05-06 full verification:
  - `npx vitest run src/lib/trader-analytics/__tests__ src/lib/execution-sources/csv/__tests__ src/lib/execution-feedback/__tests__ src/lib/trade-analysis/__tests__/trade-analysis-request-contract.test.ts src/lib/trade-analysis/__tests__/classify-trade-analysis-failure.test.ts src/lib/trade-analysis/__tests__/run-trade-analysis.test.ts --reporter=dot`
    passed with `267/267` tests across `40` files.
  - `npm test -- --reporter=dot` passed with `865/865` tests across `98`
    files.
  - `npx tsc --noEmit --pretty false` passed.
  - `npm run build` passed.
  - `npm run verify:layer2` passed.
  - `npm run verify:layer3` passed.
  - `npm run verify:levels-system` passed with `79/79` tests across `21`
    files.
  - `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop --grep "renders the required product panels|prototype analysis"`
    passed with `3/3` browser tests.
  - `npx playwright test tests/e2e/app-acceptance.spec.ts --project=chromium-desktop --grep "filters analytics|opens every sample trade|coach"`
    passed with `2/2` matching browser tests.
  - `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop`
    passed with `11/11` applicable browser tests and `1` desktop-project skip.
  - `npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=chromium-desktop`
    passed with `7/7` applicable browser tests and `1` Firefox-only skip.
  - `rg -n "twelve[_ -]?data|Twelve" src app tests package.json README.md -g "*.ts" -g "*.tsx" -g "*.md" -g "*.json"`
    returned no matches.
