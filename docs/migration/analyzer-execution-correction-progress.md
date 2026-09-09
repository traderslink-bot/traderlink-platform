# Analyzer execution correction repair

Parent: [Moomoo Analyzer plan](moomoo-daily-trade-tracker-analyzer-plan.md).

Owner direction: correct all flagged executions together and reuse saved candles without deducting usage.

- Implemented: correction notice opens the existing atomic whole-trade editor. That editor commits all rows in one transaction with per-row refresh disabled, then refreshes once.
- Implemented: previously analyzed trades can queue cached re-analysis after every correction without requiring or consuming another correction opportunity.
- Implemented: explicit cached analysis selection requires no allowance reservation and works when available usage is zero. Provider acquisitions retain the existing allowance path.
- Cache selection uses the same provider, adapter, symbol, date, interval, session policy and coverage as the worker. Sparse candles remain saved evidence; execution validation occurs in the worker.
- Help updated. No migration or provider change. Historical eligibility unchanged.
- TypeScript syntax transpilation passed for all four changed TypeScript/TSX sources. Complete source diff reviewed, including existing atomic commit and cache-only worker claim paths; diff whitespace check passed. No tests, database execution, provider calls or server started. Production release and owner UI verification pending.
