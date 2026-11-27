# Company fundamentals read contract for Scanner

November 26, 2026 · Proposal for Scanner review

Company Details and Scanner read the same persisted snapshot. The server-only Scanner reader accepts a bounded batch of normalized ticker symbols and returns one result per symbol from a consistent persisted read. The Company Details reader accepts a ticker and returns the same snapshot with paged history, source filing links and preliminary earnings. Neither reader calls the providers or triggers a refresh. Transport limits and the final schema follow custody confirmation and cold-start measurements. [Implementation and QA plan](shared-company-fundamentals-plan.md)

## Snapshot

- **Identity and revision** include normalized ticker, stable issuer identity when resolved, CIK when available, and the data revision and time it became visible. A never-loaded ticker returns an explicit pending result.
- **Profile** includes qualified name, business address, industry, IPO date, fiscal year end, company/profile currency and separately sourced float and shares outstanding where available. Numbers carry the source's units and scale. Security-level fields retain ticker identity. The Scanner continues to own price, live capitalization and rule evaluation.
- **Filed financial fields** include the latest applicable annual target and a compatible prior annual reference when available. Provide period-qualified revenue, gross profit, net income and diluted EPS as well as supported statement fields used in Company Details. Keep field-specific scopes for consolidated, parent, continuing, discontinued or share class, and preserve source tax basis. Do not derive a comparable year from metric recency.
- **Ratios** include explicitly mapped Finnhub trailing P/E and P/S, quarterly P/B and trailing dividend yield where qualified. Multiples use `x` and yield uses percentage points. Carry vendor field identity, horizon, provider date if supplied, successful check time and associated trading date. Vendor periods and dates can be null when the feed does not supply them. The check time is a separate field. Derived values, if supported, carry their exact operands and basis. Unsupported derivations are unavailable.
- **Filings** include accession, form, report date where known, filed date, acceptance timestamp where available, document URL and amendment relationship where established. The requested filing date range has its own coverage status. A complete window with zero matching filings and a window with unknown or incomplete coverage are different results.
- **Preliminary earnings** include the 8-K or 6-K announcement, available period-qualified numbers and any matching filed revision. The existing annual filters consume filed figures. A separately defined preliminary filter could consume the preliminary status after Scanner review.

## Field result

A financial field includes a requested period, state and, where the state permits it, a typed observation. The requested period identifies the current statement target even when the observation is missing.

| State | Interpretation for current Scanner rules |
| --- | --- |
| `available` | Use the qualifying observation if it meets the rule's period, unit, currency and scope. Explicit zero is valid. |
| `pending` | First load or new filing pending. Current predicate is unknown. |
| `unavailable` | Successful source check with covered but absent, unsupported, ambiguous, or inapplicable data. Current predicate is unknown. |
| `retrying` | Temporary source failure, with last check and next eligible retry. Current predicate is unknown if it has no eligible observation. |
| `stale` | Retained observation for an older required period or a ratio outside its agreed trading-date freshness. Company Details can display its date. Current predicate is unknown. |

Every SEC observation carries decimal value, unit and reporting currency where applicable, fiscal year and fiscal period when established, start and end or instant, reporting scope, taxonomy and concept, SEC accession, form, filed date, accepted timestamp when known, and source URL. Preserve reported values and mark amended, preliminary and superseded evidence. Keep provider-health state separate from value eligibility so, for example, a confirmed FY2025 fact remains eligible when a SEC discovery check fails and the target is still the last verified filing. Never relabel the prior value when a newer applicable report is known. When historical evidence has a cutoff, use only filings and source revisions available by the cutoff.

Growth, margins and comparisons require compatible periods, scope, currency and share basis. Missing or unusable inputs map to the Scanner's existing unknown/incomplete outcome. A short-lived source failure must become visible at the next successful publication even when other snapshot fields were already populated. Readers may cache a snapshot by persisted revision, or use a cache whose visibility bound is verified in the joint retry test.

## Joint acceptance

Scanner will verify CLRO against the $40M minimum, GMM and SEAT against a filter that exposes stale diluted EPS, MEDS against exact reported facts, and dated filing windows with complete versus incomplete coverage. Company Details will show the same filed period and evidence. Run both readers concurrently against a brief Finnhub failure during a successful SEC write and measure the first read that sees the recovered ratio. Include the real roster cold-start and concurrent-read timing and coverage results in the handoff.

## Private candidate transport

The candidate's full-token server endpoint is `GET /traderslink/v1/company/snapshots`. Send repeated `symbol` query keys for up to 128 distinct normalized tickers. `asOf` selects a publication cutoff in UTC epoch milliseconds. Record the returned `revision` on the first batch and pass it to subsequent batches, detail and alert evidence reads. Use `view=detail` for one ticker to include retained SEC observations and filing-document evidence. Return HTTP 400 for duplicate, malformed or out-of-bounds query parameters. The legacy profile-only token cannot read snapshots.

Each result has the listing and revisioned `profile`, `metrics`, and `sec` sources where resolved. For the private integration, use `sec.value.statements.annual` and `previousAnnual`, preserving the explicit `filing.reportDate` and observation metadata. `sec.health.pendingFiling` carries a newer statement pending structured facts, so an affected older annual record belongs in history while the period is pending. `sec.value.filingCoverage` supplies checked time and completeness. `sec.value.filings` supplies individual accession evidence. Filter to the agreed 30 inclusive UTC days and apply acceptance time and the publication cutoff. `metrics.value.valuation` has the four named ratios, each with a value state, units and reference trading date where available. Keep the source health separate from stale value eligibility in the evaluator.
