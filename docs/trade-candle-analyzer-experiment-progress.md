# Trade Candle Analyzer Experiment Progress

**Plan:** [trade-candle-analyzer-experiment-plan.md](./trade-candle-analyzer-experiment-plan.md)  
**Branch:** `codex/trade-candle-analyzer-experiment`

| Checkpoint | Status | Notes |
| --- | --- | --- |
| Product and evidence contract | Complete | Three analyzers use a primary 30-minute review with up-to-60-minute context and evidence-gated no-feedback states. |
| Design fixture and review route | In progress | Owner approved the plan. Building the fixture with Lightweight Charts; no Yahoo connection yet. |
| Yahoo candle preflight | Complete | 2026-07-30 read-only one-minute check for CYCU, GCTK, and NUWE returned HTTP 200. Today's longest continuous usable spans were 162, 349, and 391 minutes respectively; sparse earlier sessions confirm the need for per-window coverage checks. No Yahoo data was persisted. |
| Early-exit simulation research | Complete | In the 09:30–11:00 ET window on 2026-07-30, constructed price-path demonstrations only where candles supported them: CYCU 09:39 simulated long exit at $0.3350 followed by a $0.5496 high at 10:28; NUWE 09:39 simulated long exit at $5.9101 followed by a $6.3999 high at 09:42. GCTK had no eligible profitable-exit continuation under the same rule and remains a no-feedback case. |
| Candle adapter and deterministic analyzer module | Not started | Server-only Yahoo adapter; no raw candle persistence. |
| Governed trade connection | Not started | Read-only completed-round-trip selection only. |
| Focused verification and isolated review | Not started | No broad test suite during active design. |
| Merge or deployment | Not started | Requires separate explicit approval. |
