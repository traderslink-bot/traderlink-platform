# Real-Data Calibration And Synthetic Fixture Plan - 2026-05-06

## Purpose

Use private real CSV calibration to find import, grouping, session-time, and
coaching misses, then convert any confusing real-data miss into committed
synthetic fixtures.

This branch should improve launch confidence without committing private broker
data or tuning coaching against unsupported market-data claims.

## Scope

## Data Handling Rules

Private calibration files are allowed as local inputs, but committed artifacts
must stay public-safe.

Rules:

- Do not commit private CSV files.
- Do not commit private artifact JSON that contains raw rows, symbols, order
  IDs, account IDs, execution timestamps, exact prices, exact share sizes, or
  broker statement text.
- Do not include private file paths in public docs.
- Public reports may include aggregate counts, percentages, status buckets,
  issue-code counts, session/hour distributions, and pass/fail summaries.
- If an example is needed, recreate it as a synthetic fixture with fake symbols,
  shifted timestamps, altered prices/sizes, and no account identifiers.
- Private reports may be written under private artifact paths only when needed
  for local inspection.

Recommended public output:

- `src/docs/real-data-calibration-public-readiness-2026-05-06.md`

Recommended private output location:

- `artifacts/real-csv-calibration/private/`

### In Scope

- Private real CSV aggregate calibration.
- Public-safe readiness reports with aggregate counts only.
- Decision-review calibration on completed grouped trades.
- Miss detection for import, grouping, lifecycle, session-time, and coaching.
- Sanitized synthetic fixture creation for any repeatable real-data miss.
- Expanded import/coaching regression tests.
- Coach language accuracy sweep after calibration.
- Full verification after changes.
- Public-safe go/no-go summary.

### Out Of Scope

- Committing private CSV files, raw rows, account IDs, or private artifact
  contents.
- UI timezone display toggle.
- New asset-class session rules.
- Production persistence or broker-row writes.
- Production order execution.
- Net-P/L scoring changes.
- Market-context coaching changes when historical candles are missing, stale,
  or price-basis mismatched.
- Treating representative synthetic broker fixtures as official broker
  certification.
- Expanding provider scope beyond the currently supported `ibkr` / `stub`
  app-level provider boundary.

## Inputs And Existing Tools

Use existing project tooling first:

- `npm run summarize:session-time-readiness`
- `npm run calibrate:decision-review`
- `npm run summarize:market-data-readiness`
- `npm run compare:decision-review-calibrations`
- `npx tsx src/scripts/run-ibkr-grouping-review-report.ts`
- existing CSV/import fixtures under `src/docs/trade-execution-import-fixtures`
- existing trade request fixtures under `src/docs/trade-analysis-request-fixtures`
- existing matrices:
  - buy/sell execution fixture matrix
  - CSV dry-run automated QA harness
  - coaching behavior evidence matrix
  - coaching fixture expectation matrix
  - coaching language readiness harness

Use `levels-system` only when a reviewed claim depends on daily/4h
support/resistance or 1m/5m trade-window candles. Use the local IBKR Gateway
only as a private/local backfill check when the candle warehouse lacks a needed
historical window. Tests and committed fixtures must not require live Gateway
access.

## Workstreams

### 1. Private Real CSV Aggregate Calibration

Run available private CSVs through import, grouping, session-time, and coaching
readiness.

Report only public-safe aggregate values:

- parsed row count
- accepted execution count
- rejected row count
- skipped row count
- grouped trade count
- completed/open trade count
- long/short count
- session bucket distribution
- entry-hour distribution
- held-through session counts
- issue code counts
- warning counts
- import readiness status distribution
- grouping diagnostic counts
- duplicate fingerprint counts
- options/non-stock quarantine counts
- timezone diagnostic counts
- cost visibility counts: commissions, fees, broker net amount present

Acceptance criteria:

- No private rows, symbols, account IDs, raw trade contents, or private paths are
  committed.
- Public docs say the report is aggregate-only.
- Any private report stays under private artifact paths.
- The public report clearly separates import health, session-time health, and
  coaching/decision-review health.
- Any "ready" conclusion states the supported scope: imported stock executions,
  gross-only scoring, and U.S. equity session buckets in Eastern Time.

### 2. Decision Review Calibration

Run completed grouped trades through the decision-review calibration path where
appropriate.

Track:

- completed review count
- skipped/open review count
- execution-only fallback count
- market-context source distribution
- trade-window evidence source distribution
- unsafe candle-basis rows
- stale behavior invariant counts
- contradictory behavior/evidence counts
- top headline distribution
- missing required evidence fragments
- forbidden copy fragments
- headline distribution counted by sanitized headline category rather than raw
  private trade details
- skipped reason counts for trades that cannot safely receive decision review

Acceptance criteria:

- Execution-only fallback rows stay honest.
- Daily/4h or trade-window claims appear only when supported by levels-system
  evidence.
- VWAP/EMA feedback remains off.
- Open positions are skipped or review-gated rather than coached as completed
  trades.
- Short-side wording remains direction-aware.
- Any confidence or sample-size language remains cautious when the sample is
  small.

### 3. Miss Detection

Flag cases that need review:

- grouped trade appears split incorrectly
- separate trades appear merged incorrectly
- open/closed lifecycle looks wrong
- side/direction handling looks wrong
- short-trade wording is directionally wrong
- session bucket or held-through flags look wrong
- top coaching behavior feels unsupported
- coaching headline is generic or stale
- skipped broker row should maybe have been accepted
- accepted row should maybe have been skipped
- fees/net amount visibility is misleading
- candle-basis mismatch creates overconfident review language

Miss severity:

- `blocker`: import math, side/direction, lifecycle, or grouping is materially
  wrong.
- `high`: coaching primary behavior is unsupported, stale, contradictory, or
  overconfident.
- `medium`: session/hour classification, skipped-row messaging, or cost
  visibility is confusing but not corrupting trade math.
- `low`: copy is repetitive, awkward, or too generic while still factually safe.

Acceptance criteria:

- Misses are described by safe aggregate facts and a synthetic reproduction
  target, not by private row content.
- Do not change app behavior from a private miss until the miss is reproduced
  synthetically.
- Every blocker/high miss gets either a synthetic fixture or a documented reason
  why it cannot be reproduced yet.
- Low-severity copy misses may be fixed directly if they do not depend on
  private facts.

### 4. Convert Misses Into Synthetic Fixtures

For each repeatable miss:

- build a minimal synthetic CSV or trade request
- preserve the structural behavior
- remove private symbols, prices, sizes, account identifiers, and timestamps
  that could identify the original data
- add expected accepted/skipped/rejected/grouped counts
- add expected lifecycle/session/coaching behavior
- add forbidden copy/evidence assertions when relevant
- add a short fixture note explaining which real-data miss shape it protects,
  without exposing private details

Target fixture families:

- same ticker multiple trades in one day
- partial fills
- same-symbol re-entry after flat
- open positions
- over-reduction / direction flip
- shorts with direction-aware wording
- premarket/open/midday/post-market/overnight edge cases
- skipped broker rows
- fees, commissions, and broker net amount visibility
- execution-only fallback
- positive full-trade management
- broker timestamp/timezone edge cases
- multi-day monthly statement grouping
- repeated same-symbol trades separated by flat positions
- mixed valid executions plus non-trade statement rows

Acceptance criteria:

- Every committed regression is synthetic.
- Tests explain what behavior the fixture protects.
- Private CSV data remains private.
- Synthetic fixtures are minimal enough to review by eye.
- If a fixture needs candle-backed claims, use deterministic levels-system
  fixture services rather than live network/API data.

### 5. Import Regression Expansion

Extend existing import matrices where misses belong:

- buy/sell execution fixture matrix
- CSV dry-run automated QA harness
- broker parser tests
- import dry-run UI tests
- session-time import tests
- route/UI tests only when user-facing state or copy changes

Acceptance criteria:

- Accepted/rejected/skipped/grouped counts are asserted.
- Lifecycle state, final position, gross P/L, session bucket, and issue codes are
  asserted where relevant.
- Existing broker policy remains honest: representative coverage, not official
  certification.
- Skipped informational rows do not block ready imports unless they create
  ambiguity about filled executions.
- Rejected execution rows block readiness when they affect trade reconstruction.

### 6. Coaching Regression Expansion

Extend coaching tests where misses belong:

- coaching behavior evidence matrix
- coaching fixture expectation matrix
- coaching language readiness harness
- decision-review bridge scenarios
- daily coach / coach queue tests

Acceptance criteria:

- Primary behavior is evidence-backed.
- Positive-management cases can become the main story when no stronger mistake
  exists.
- Session-time context supplements coaching without replacing the main lesson.
- Unsupported market-context claims stay blocked.
- Repetitive/generic coach language does not creep back in.
- Decision-review bridge scenarios assert required headline fragments and
  forbidden text fragments where useful.
- Coaching tests distinguish execution-only coaching from daily/4h
  market-context coaching.

### 7. Coach Language Accuracy Sweep

After real-data calibration:

- run the language readiness harness
- inspect warning/failure items
- improve weak, repetitive, or generic phrases
- keep tone direct, useful, and calm
- add tests for any changed phrase family

Acceptance criteria:

- Readiness harness returns zero failures.
- Any remaining warnings are documented or resolved.
- Copy changes do not change lower-layer factual contracts.
- The coach remains direct and actionable without implying emotional intent that
  cannot be observed from executions.

### 8. Public-Safe Readiness Report

Write or update a public-safe report after calibration.

The report should include:

- calibration scope and date
- input source type without private path
- aggregate import counts
- aggregate grouping/lifecycle counts
- session-time distribution
- decision-review readiness counts
- miss summary by severity
- synthetic fixtures added
- verification commands and results
- remaining launch caveats

Acceptance criteria:

- The report can be committed safely.
- It does not include private rows, symbols, timestamps, prices, share sizes, or
  file paths.
- It has a clear "current launch confidence" section.

### 9. Full Verification

Minimum verification:

```bash
npx vitest run src/lib/trader-analytics/__tests__ src/lib/execution-sources/csv/__tests__ src/lib/execution-feedback/__tests__ --reporter=dot
npx tsc --noEmit --pretty false
npm run build
```

Broader verification when touched:

```bash
npm test -- --reporter=dot
npm run verify:levels-system
npm run verify:layer2
npm run verify:layer3
```

Browser verification:

```bash
npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop
npx playwright test tests/e2e/app-first-user-hardening.spec.ts --project=chromium-desktop
```

## Suggested Execution Order

1. Locate available private calibration CSVs under private artifact locations.
2. Confirm no private output path will be committed.
3. Run aggregate import/session readiness.
4. Run decision-review calibration on a bounded completed-trade sample.
5. Identify misses without exposing private details.
6. Rank misses by blocker/high/medium/low severity.
7. Convert the highest-value reproducible misses into synthetic fixtures.
8. Add or tighten import/coaching/session tests.
9. Run language readiness after any copy/coaching change.
10. Write or update the public-safe aggregate report.
11. Run full verification.
12. Update this plan and `src/docs/codex-project-log.md` with results.

## Go / No-Go Criteria

The branch is good to close when:

- Public-safe calibration report exists or is updated.
- No private data is committed.
- Blocker/high misses are either fixed through synthetic tests or explicitly
  documented as not reproducible yet.
- Import/grouping/session/coaching focused tests pass.
- Full TypeScript and build pass.
- Browser smoke for import/analytics/coach-facing routes passes when UI changed.

Do not call the branch launch-ready if:

- trade side, direction, grouping, or open/closed lifecycle has an unresolved
  blocker miss
- coaching makes unsupported candle, support/resistance, VWAP, EMA, or
  market-structure claims
- private data appears in committed docs or fixtures
- real-data calibration exposes a repeated miss without a synthetic regression
  or documented follow-up

## Working Notes

- 2026-05-06: Plan created from the next-branch idea after coaching quality and
  launch verification passed. Next action is to run private real CSV aggregate
  calibration, then convert any repeatable miss into a synthetic fixture before
  committing behavioral changes.
- 2026-05-06: Plan review completed. Added stricter data-handling rules,
  existing-tool guidance, miss severity, public-report requirements,
  go/no-go criteria, and clearer acceptance criteria for import, decision
  review, synthetic fixtures, coaching, and verification.
- 2026-05-06: Private aggregate calibration run completed against an IBKR
  activity-statement sample. Public-safe report generated at
  `src/docs/real-data-calibration-public-readiness-2026-05-06.md`.
  Aggregate result: `918` parsed rows, `574` accepted executions, `0`
  rejected rows, `344` skipped non-trade rows, `208` grouped trades, `206`
  closed trades, and `2` open trades. Session-time distribution covered
  pre-market, market open, midday, post-market, and overnight buckets.
- 2026-05-06: Decision-review calibration reached the import/grouping stage but
  completed `0` reviews because the local historical `5m` trade-window candle
  warehouse coverage was unavailable for the bounded completed-trade sample.
  This is documented as a high-severity market-data readiness miss, not an
  import/grouping/session blocker.
- 2026-05-06: No new synthetic fixture was created from this private run because
  no reproducible private-row import, grouping, session-time, or coaching logic
  miss was found. The next synthetic fixture trigger is a real-data miss that
  can be safely recreated without private rows, symbols, timestamps, prices, or
  sizes.
- 2026-05-06: Verification completed after report generation. Passed:
  focused import/session/calibration/coaching Vitest batch `40/40`,
  `npx tsc --noEmit --pretty false`, `npm run build`, full
  `npm test -- --reporter=dot` with `865/865`, `npm run verify:layer2`,
  `npm run verify:layer3`, `npm run verify:levels-system` with `79/79`,
  full import dry-run Playwright `13/13`, and focused app acceptance
  Playwright `2/2`.
- 2026-05-07: Resumed after the candle warehouse was backfilled by
  `levels-system`. Replay-only decision-review calibration against the private
  aggregate sample completed with `206` analyzable completed-trade candidates,
  `204` completed reviews, `2` market-context-unavailable skips, `5`
  execution-only fallback reviews, `5` unsafe candle-basis rows safely
  evidence-gated, `0` missing trade-window excursion insights, `0`
  fallback/generic headlines, and `0` stale behavior invariant counts.
  Public-safe report was regenerated at
  `src/docs/real-data-calibration-public-readiness-2026-05-06.md` with status
  `ready_with_evidence_gated_limitations`.
- 2026-05-07: No new synthetic fixture was created from the full replay run.
  The remaining limitations were market-data availability/basis gates handled
  by skip/fallback behavior, not import/grouping/session/coaching logic misses.
