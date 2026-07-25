# Trader Intelligence v3 Project Log Addendum — Post-GA0-B Direction

**Date:** 2026-07-25 America/Toronto  
**Status:** latest owner product-direction decision  
**Historical log preserved at:** `src/docs/trader-intelligence-v3-project-log.md`

This addendum extends rather than rewrites the historical project log. Read it before earlier project-log entries when planning work after GA0-B4.

## Accepted state

- GA0-A1 is accepted and merged at `4f9e440116258c9548a2d13f7ea057a9075101c6`.
- GA0-A2 is accepted and merged at `e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a`.
- GA0-A3 is accepted and merged at `72ca53940403dfab63979d403bd6b479539f41db`.
- GA0-B1 is accepted and merged at `7d8d8e03826e4b877b22e9a2a68d381bb42e585d`.
- GA0-B2 is accepted and merged at `4338cab7d46b8a0548b22346f81b42db5fec3bf0`.
- GA0-B3 is accepted and merged through PR #156 at `e46d9fea331aeefc262a6dc7a187b5c73678b398`.
- GA0-B4 remains the immediate required proof-closeout slice.
- No B4 branch or PR existed when this direction was recorded.

## Controlling post-B4 direction

The controlling decision is:

`src/docs/trader-intelligence-v3-post-ga0-b-query-simulation-and-candle-direction-lock-2026-07-25.md`

After B4 acceptance, do not continue with one narrow named tool per major delivery. Build reusable deterministic engines and coherent capability packs.

The next program prioritizes:

1. a generic read-only trade-query engine over verified owner data;
2. evidence retrieval and deterministic similar-trade search;
3. Execution-Only Analytics Pack 1;
4. a generic counterfactual simulation engine;
5. an execution-only rule-simulation pack;
6. a minimal owner-facing query/evidence experience and owner-only AI explanation layer;
7. a private-owner candle relay using owner-provided EODHD access as the primary beta source and an optional limited Yahoo fallback where available and permitted;
8. VWAP, EMA9, EMA20, MFE/MAE, profit-giveback, and other replay-safe market-context features;
9. candle-dependent profit-target, partial-exit, stop, trailing, break-even, and time-exit simulations.

Setup detection and support/resistance redesign are deferred.

## Product and authority rules

- Code calculates and verifies financial truth.
- The AI creates validated plans, selects approved capabilities, and explains verified results.
- The model does not receive unrestricted SQL or direct database authority.
- The model does not calculate from raw rows or candles.
- The read-only query gateway enforces owner/account scope, bounded query plans, currency separation, and evidence resolution.
- Provider credentials stay on the owner computer and are never sent to the browser, website database, model, Git, or logs.
- Candle snapshots are normalized, validated, content-addressed, quality-labeled, and no-lookahead-safe before analytics consume them.
- EODHD is the primary private-beta candle source through the owner-local relay.
- Yahoo is only an optional limited fallback; no fixed coverage promise is recorded.
- Journal-based counterfactual backtesting over actual owner trades is in scope.
- Full market-universe strategy backtesting remains a later separate product surface.

## Pace decision

The foundation was audited one slice at a time because exact truth and the first proof tools required it. Future ordinary analyses should share accepted primitives and be delivered in packs.

- Audit engines deeply.
- Audit closely related presets together.
- Use specialized audits for genuinely distinct simulation or market-data semantics.
- Do not create one PR and audit cycle per ordinary question.
- Do not create one unbounded PR containing the entire roadmap.

## Immediate next action

1. Implement GA0-B4 only from current accepted `main`.
2. Keep the B4 PR draft and independently audited.
3. After B4 merge, perform a short private owner-data calibration and prove the read-only data/candle-relay contracts.
4. Begin the generic query, evidence, and simulation program under the direction-lock document.
5. Do not begin setup detection or support/resistance work unless the owner explicitly supersedes this decision.
