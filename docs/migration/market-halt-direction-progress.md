# Market halt direction progress

Status: local implementation complete; deployment not requested or performed.

## Approved behavior

- Enrich only a newly observed, timely volatility halt.
- Request recent one-minute candles only for the halted ticker.
- Use the existing owner-authorized Moomoo quote connection first and Yahoo Chart as fallback.
- Label the initial Push and Discord alert `UP` or `DOWN` only when the candle containing the halt shows a consistent move and closes in the outer 20% of its range.
- Omit direction when the provider is unavailable, stale, missing the halt interval or ambiguous.
- Never add direction to news, regulatory, straddle, quote-time or trade-time updates.
- Bound the entire enrichment attempt, including Moomoo token access and Yahoo fallback, to three seconds.
- Resolve distinct new halt candidates concurrently and skip market-data enrichment after the ticker/day initial alert has already been issued.

## Files

- `src/modules/news/server/market-halt-direction.ts`
- `src/modules/news/server/market-halt-alert-repository.ts`
- `app/api/cron/market-halts/route.ts`
- `src/modules/help/tools-guides.ts`

## Verification boundary

- Lightweight syntax diagnostics passed for the three server files.
- `git diff --check` passed.
- Focused ESLint could not start because this isolated checkout has no installed dependency tree; no package installation was attempted.
- No Vitest, broad test suite, live-provider request, production migration, Git publication or Railway action was run.
- Real provider timing and an actual halt alert still require safe live acceptance after release coordination.
