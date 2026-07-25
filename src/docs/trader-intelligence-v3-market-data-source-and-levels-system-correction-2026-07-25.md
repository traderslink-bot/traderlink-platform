# Trader Intelligence v3 Market-Data Source and Levels System Correction

**Date:** 2026-07-25 America/Toronto  
**Status:** latest owner market-data direction; highest precedence for market-data source and request routing  
**Supersedes:** all earlier Yahoo, fallback-provider, paired-relay, and direct-provider wording in post-GA0-B planning documents

## Decision

Trader Intelligence uses one candle-data source path:

1. Trader Intelligence requests candle data from the existing Levels System app.
2. The Levels System app is responsible for obtaining the candle data from EODHD.
3. Trader Intelligence consumes only the normalized, validated candle response supplied through the Levels System integration.
4. Trader Intelligence does not request candle data directly from Yahoo or use Yahoo as a fallback.
5. Trader Intelligence does not independently integrate with EODHD in this phase unless a later explicit owner decision replaces the Levels System boundary.

User-facing wording remains simply **market data**. Normal users do not need to know the provider, adapter, cache, or internal request path.

## Missing or delayed candle data

A trade import and all execution-only journal features must continue even when candle data is unavailable.

When the Levels System app cannot yet provide the required candle data:

- the trade remains imported and visible;
- exact execution-only analytics remain available;
- candle-dependent market-context features remain unavailable for that trade;
- candle-dependent simulations remain unavailable for that trade;
- the system must not estimate, invent, interpolate, or silently substitute candle data;
- the trade displays a small, non-blocking note explaining that market data is not available yet.

Suggested user-facing message:

> Market data is not available yet. Candle-based analysis will appear when the data becomes available.

The note should disappear or change state after valid candle data becomes available and the candle-dependent analysis is successfully produced.

## Authority and integration boundary

The Levels System app is the candle-request gateway for Trader Intelligence.

Trader Intelligence may send only bounded, authorized requests containing the minimum required scope, such as:

- canonical instrument or symbol identity;
- requested interval;
- required date or time window;
- intended analytical purpose;
- owner/workspace authority where applicable.

The Levels System response must remain subject to the accepted normalized candle authority, including:

- instrument identity;
- interval;
- requested and actual coverage;
- timezone and session policy;
- ordered OHLCV values;
- missing, duplicate, and out-of-order diagnostics;
- content identity;
- quality and coverage state;
- cutoff and no-lookahead authority.

EODHD credentials remain inside the Levels System app or its existing owner-controlled environment. Credentials must not be sent to the Trader Intelligence browser, model, repository, logs, or ordinary application database.

## Product behavior

The Analytics Agent, Coach Agent, and Simulation Bot may use candle-derived results only after the Levels System response has passed the normalized validation boundary.

When candle data is unavailable, agents must clearly distinguish:

- execution-only results that remain supported;
- candle-dependent questions that cannot yet be answered;
- any trade or period excluded because market data is unavailable.

The absence of candle data must not be described as a trading conclusion or interpreted as evidence about the trade.

## Implementation sequencing

This correction does not change GA1-A, which is the generic deterministic trade-query engine and read-only trade-data gateway and does not require candles.

Before market-context or candle-dependent simulation implementation begins, future plans must use this integration sequence:

```text
Trader Intelligence needs candle data
  -> bounded request to the Levels System app
  -> Levels System obtains EODHD data
  -> Levels System returns normalized candle data or an unavailable state
  -> Trader Intelligence validates the response
  -> deterministic market-context or simulation code runs when valid
  -> otherwise the trade shows the non-blocking market-data-unavailable note
```

## Explicitly rejected directions

Unless the owner later supersedes this decision, do not implement:

- Yahoo candle retrieval;
- Yahoo fallback behavior;
- provider switching inside Trader Intelligence;
- direct browser-to-provider calls;
- direct model access to market-data providers;
- invented or estimated candles;
- blocking trade import because candle data is delayed;
- silent omission of candle-dependent coverage limitations.

## Precedence

For market-data source selection and request routing, this document supersedes conflicting wording in:

- `src/docs/trader-intelligence-v3-post-ga0-b-query-simulation-and-candle-direction-lock-2026-07-25.md`;
- `src/docs/trader-intelligence-v3-project-log-addendum-post-ga0-b-direction-2026-07-25.md`;
- `plan.md`;
- earlier QA, relay, provider, and planning documents.

The broader post-GA0-B direction remains unchanged: deterministic query, evidence, analytics, simulation, owner-facing AI, market context, and candle-dependent simulations continue in the approved order.
