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
- GA0-B4 is accepted through PR #158 at
  `608f0854d14a70bef1e2220e66f97289c0bcf9be`.
- The post-B4 direction lock is merged through PR #157 at
  `b640ba599a4b9604395d203b6224b45d9de21208`.

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
7. a private-owner market-data relay and normalized candle authority;
8. VWAP, EMA9, EMA20, MFE/MAE, profit-giveback, and other replay-safe market-context features;
9. candle-dependent profit-target, partial-exit, stop, trailing, break-even, and time-exit simulations.

Setup detection and support/resistance redesign are deferred.

## Product and authority rules

- Code calculates and verifies financial truth.
- The AI creates validated plans, selects approved capabilities, and explains verified results.
- The model does not receive unrestricted SQL or direct database authority.
- The model does not calculate from raw rows or candles.
- The read-only query gateway enforces owner/account scope, bounded query plans, currency separation, and evidence resolution.
- The normal user-facing product describes this capability simply as **market data**. Users do not need to know which provider, relay, cache, or adapter supplied the candles.
- Provider choice and relay mechanics are internal implementation details. Provider names may appear only in owner/admin diagnostics where they are useful for setup, coverage, or troubleshooting.
- For the private beta, Yahoo supplies same-day intraday candles needed for trades analyzed on their execution date.
- For the private beta, EODHD supplies earlier historical candles after the trading day.
- Both sources are sufficient for the planned beta market-context features and journal-based simulations when their returned coverage passes the same normalized quality contract.
- All provider responses pass through one provider-neutral normalization, validation, content-identity, coverage, and no-lookahead boundary before analytics consume them.
- Provider credentials stay on the owner computer and are never sent to the browser, website database, model, Git, or logs.
- The website and AI consume provider-neutral market-data status and normalized candle snapshots, not raw provider payloads or provider-specific assumptions.
- Journal-based counterfactual backtesting over actual owner trades is in scope.
- Full market-universe strategy backtesting remains a later separate product surface.

This market-data routing decision supersedes any earlier wording that described EODHD as the source for same-day candles or Yahoo only as an optional fallback. It does not change the normalized candle authority, security boundaries, or deferred setup/support-resistance decisions.

## Pace decision

The foundation was audited one slice at a time because exact truth and the first proof tools required it. Future ordinary analyses should share accepted primitives and be delivered in packs.

- Audit engines deeply.
- Audit closely related presets together.
- Use specialized audits for genuinely distinct simulation or market-data semantics.
- Do not create one PR and audit cycle per ordinary question.
- Do not create one unbounded PR containing the entire roadmap.

## Immediate next action

1. Implement GA1-A, the generic deterministic query engine and read-only
   validated gateway, from accepted `main`.
2. Keep GA1-A domain-only: no UI, AI/model, simulation, candle, broker,
   database-write, payment, auth, hosting, or deployment work.
3. Publish one draft PR and stop for independent audit.
4. Do not begin GA1-B, setup detection, or support/resistance work unless the
   owner explicitly authorizes the next slice.

## PR #157 direction-lock closeout

- PR #158 was merged into `main` at
  `608f0854d14a70bef1e2220e66f97289c0bcf9be` before this direction-lock
  closeout.
- The known direction-lock head remains
  `06a99685348371acf02c063f86a98e354a903287`. The verified pre-sync PR #157
  head was `254ebc536a531b86b088b1cc16eb985f5dcc0a25`, a documentation-only
  descendant containing no executable, test, workflow, package, or
  configuration changes.
- Current `main` was merged into the direction-lock branch only because the
  PR became conflicting after PR #158 merged. The sync merge is
  `ffc985cca75022e919bab99ca7be5fb80f9a5f30`; its only conflict was a stale
  `plan.md` header, resolved by preserving this direction-lock branch's
  approved content.
- The final PR #157 closeout remains documentation-only, records no feature
  implementation, and is ready for merge after lightweight documentation
  checks. The next authorized phase is a separate owner-approved
  implementation task under this direction lock; no GA0-C or feature work is
  implied by this closeout.
