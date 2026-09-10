# Green-to-red zero-profit classification repair

## Implemented locally

- Replace Decimal.isPositive() with gt(0) for the headline profit-taking count and both finished-red profit-taking groups. Decimal.isPositive() accepts positive zero; zero-dollar trades were incorrectly classified as taking profit.
- Finished red now leads with combined realized Gross loss using the existing large financial-color value. Percentage and trade count are underneath, still using the reached-20% population.
- In the finished-red panels only, rename Opportunity not retained to Profit opportunity + realized loss. Preserve the underlying maximum opportunity minus final P/L calculation and full precision.
- Recovery remains an overlapping path classification, not an additional finished-red population.
- No saved Analyzer data, demo data, calculations of exit profit, routes, or table layouts changed. Help files remain deferred by owner instruction.

## Verification and release boundary

- Owner follow-up: exact +20% records now show Recovered [time] · Finished green/red, or Never recovered · Finished red, based on the recovery timestamp and final Gross P/L. A zero-dollar finish is labelled flat. Removed No later recovery measured. Timing values and recovery calculations are unchanged.

- Focused ESLint and git diff whitespace checks passed.
- Read-only Decimal arithmetic reconciliation of the eight user-pasted red finishes: seven no-profit trades (53.8% of 13), $0 secured, -$7,086.88 final Gross; one some-profit trade (7.7%), $40.04 secured, -$45.42 final Gross. Combined eight red finishes: -$7,132.30.
- This is reconciliation of supplied displayed records, not independent verification of stored executions or live browser rendering. No test suite, app build, or deployment run.
- Source slice complete; integrated browser verification and production publication pending owner release authorization.
