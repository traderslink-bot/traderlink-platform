# Watchlist legacy retirement progress

Plan: [scope and verification](watchlist-legacy-retirement-plan.md).

Local implementation and focused offline checkpoint complete. Source tracing confirms the old poll shares technical candles with Indicators and Potential Path, so deleting that subsystem would be inappropriate. The separate reversal workflow and snapshot/thesis inputs remain preserved. Production has not changed.

Parents: Platform `0b7a88ce37b0531a3181d3f46c97cbbc54c26d9d`; Runtime `00e2dfc210a8dc27f470b5b199c08f407cef0257`. These already contain queued Swings work. Package only this slice's diff on those parents; never stage the mixed worktree.

## Changes

- Legacy Trader Read and lifecycle-label flags are forced off at startup and compatibility setters. Their Admin controls and old member displays are hidden. Code/history is retained.
- The legacy-only Yahoo polling fallback is disabled. Ordinary tickers no longer run the retired Trader Read publication/volume calculation. Separate reversal calculations and shared snapshot inputs remain intact.
- Per-ticker Indicator card On/Off control persists through runtime restart, publication and Platform state. Existing tickers default to On. Unpublished tickers remain private.
- Runtime skips Off tickers; Platform rejects indicator scheduling for them and checks again after queued scheduling and before each provider transport/retry. Already-sent network requests may finish. On resumes the normal scheduler, not an AI request.
- Help explains the switch and retirement. No migration or secret/configuration change.

## Verification

`node src/scripts/verify-watchlist-legacy-retirement.cjs`: syntax checks for 17 changed source files; actual persistence serialization/validation round trips; default/on/off state reducers; setter persistence and publication gating; disabled runtime poll; provider transport suppression; authenticated scheduler On/Off and queued-Off scenarios; embedded Admin JavaScript parsing; member visibility guards. All offline, no provider calls or hosted writes.

Exact-parent temporary-index diff review/check also passes. No broad suite, full TypeScript build, local server, browser or hosted acceptance was run. After coordinated deployment, verify the switch on a test ticker, persisted Off across restart, absent card/no further indicator provider requests, and On resumption. Check current Analysis/Potential Path/quotes/notes remain available. Owner visual acceptance remains pending.
