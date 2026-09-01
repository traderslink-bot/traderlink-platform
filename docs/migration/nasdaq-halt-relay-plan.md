# Nasdaq Halt Relay Plan

**Status:** Owner authorized connection trial

**Extends:** [Nasdaq and NYSE Halt Alerts Plan](nasdaq-nyse-halt-alerts-plan.md)

## Outcome

Use a private, stateless Railway relay in US East only if it can retrieve the exact official Nasdaq Trade Halt RSS feed that the production web service in US West cannot reach.

## Boundaries

- The relay has no database, volume, public domain, user, device, Push data, or market-event persistence.
- It exposes only `/healthz` and a bearer-guarded internal RSS endpoint; its caller uses Railway private networking.
- It requests only Nasdaq's official Trade Halt RSS feed, no more than once per caller invocation. It does not alter, interpret, cache or supplement the RSS body.
- The production SQLite service remains one replica in US West. Do not move its volume, add a database writer, or enable a public relay domain.

## Checkpoints

1. Deploy the relay without a public domain in one US East replica and confirm its startup probe reaches Nasdaq.
2. Confirm the protected internal endpoint rejects missing/invalid callers and returns only the official RSS body to an authorized internal caller.
3. Only after both checks, add the main scheduler's signed private relay read and confirm a fresh run marks both sources ready.
4. Keep the relay only while Railway-US-West cannot reach the official source directly; remove it deliberately after a direct path is verified.
