# Real CSV Miss To Fixture Template

Use this when a real anonymized CSV calibration run produces a bad, weak, or
confusing review. The goal is to preserve the behavior as a synthetic test case
without keeping private user data in the repo.

## Source Report

- batch index path:
- per-file report path:
- CSV filename:
- broker:
- generated at:

## What Went Wrong

Choose one or more:

- import blocked unexpectedly
- trade grouping was wrong
- open trade was not diagnosed clearly
- expected insight was missing
- wrong insight appeared
- headline was confusing
- evidence was missing or misleading
- market context source was wrong
- VWAP/EMA wording leaked into trader-facing feedback
- support/resistance grade or distance felt wrong

Short description:

```text
Describe the miss in trader language.
```

## Expected Review

The review should have said or shown:

```text
Expected headline / insight / diagnostic.
```

Expected insight IDs:

- 

Required title fragments:

- 

Required headline fragments:

- 

Required evidence fragments:

- 

Forbidden fragments:

- 

## Synthetic Fixture Plan

Create a synthetic CSV scenario in:

`src/lib/trader-analytics/__fixtures__/decision-review-csv-scenarios.ts`

Rules:

- Keep headers and row shape representative.
- Replace symbols, timestamps, quantities, and prices only as much as needed.
- Preserve the trade math that caused the miss.
- Use deterministic `levels-system` fixture data when the miss depends on
  daily/4h support/resistance.
- Do not commit real broker account data or personally identifying data.

Candidate synthetic CSV:

```csv
Date,Time,Symbol,Side,Quantity,Price

```

## Verification

Run:

```bash
npx vitest run src/lib/trader-analytics/__tests__/csv-dry-run-decision-review-quality-dashboard.test.ts --reporter=dot
npm run calibrate:decision-review -- --generated-at=2026-05-05T12:00:00.000Z
```
