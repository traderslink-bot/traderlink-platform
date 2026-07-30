# Trade Candle Analyzer Experiment Progress

**Plan:** [trade-candle-analyzer-experiment-plan.md](./trade-candle-analyzer-experiment-plan.md)  
**Branch:** `codex/trade-candle-analyzer-experiment`

| Checkpoint | Status | Notes |
| --- | --- | --- |
| Product and evidence contract | Complete | Three analyzers use a primary 30-minute review with up-to-60-minute context and evidence-gated no-feedback states. |
| Design fixture and review route | Complete | Owner visually approved the isolated CYCU, GCTK, and NUWE replay fixture. |
| Yahoo candle preflight | Complete | 2026-07-30 read-only one-minute check for CYCU, GCTK, and NUWE returned HTTP 200. Today's longest continuous usable spans were 162, 349, and 391 minutes respectively; sparse earlier sessions confirm the need for per-window coverage checks. No Yahoo data was persisted. |
| Early-exit simulation research | Complete | In the 09:30–11:00 ET window on 2026-07-30, constructed price-path demonstrations only where candles supported them: CYCU 09:39 simulated long exit at $0.3350 followed by a $0.5496 high at 10:28; NUWE 09:39 simulated long exit at $5.9101 followed by a $6.3999 high at 09:42. GCTK had no eligible profitable-exit continuation under the same rule and remains a no-feedback case. |
| Candle adapter and deterministic analyzer module | Complete | Protected Yahoo adapter normalizes bounded one-minute OHLCV data; the three price-path analyzers remain evidence-gated and return no-feedback per incomplete window. |
| Execution-context candle patterns | Complete | The five approved families now include definitions, compression-break observations, an extended-move requirement for high-volume exhaustion, and execution-zone relevance scoring. |
| Indicator context | Complete | EMA 9/20, RSI 14, session VWAP, MACD, ATR 14, and exact 20-day ADR are derived only after a manual review request; unavailable lookback remains blank. |
| Governed trade connection | In progress | Completed V3 round trips now have an `Analyze this trade` / `View review` / `No coverage` entry point. The detail surface resolves broker facts server-side, saves only derived feedback, and allows another Yahoo fetch after one minute. |
| Focused verification and isolated review | In progress | Focused ESLint and TypeScript checks have passed. The local dashboard route still needs a final visual review once the protected runtime is available. |
| Merge or deployment | Not started | Requires separate explicit approval. |
