# Demo Trade Data Progress

**Status:** Active implementation

**Controlling plan:** [Demo Trade Data Plan](demo-trade-data-plan.md)

**Fixed Demo clock:** [Demo Fixed Clock Progress](demo-fixed-clock-progress.md)

## Accepted product decisions

- [x] A genuinely new empty workspace receives one isolated Demo Trade Tracker.
- [x] Demo data is persistently labelled and can be cleared only with the
      explicit **Clear demo data and start fresh →** transition.
- [x] Clearing the demo account returns `/workspace` to ordinary onboarding;
      demo data never silently mixes with real manual/imported facts.
- [x] Daily Tracker days are long-only and show notes, tags, selected preset
      rules, custom rules, trade outcomes, and broken day rules after canonical
      annotation materialization.

## Evidence and implementation checkpoints

- [x] Account-isolation, provenance, onboarding, Journal, import, analytics,
      Analyzer, erasure, PWA and Help boundaries audited.
- [x] Server-side demo read-only guards and Analyzer candidate exclusion
      prepared without changing manual/broker provenance semantics.
- [x] Idempotent activation/materialization boundary defined. It refuses a
      missing/incomplete/checksum-mismatched pack and makes no partial write.
- [x] Verified Moomoo market-session evidence captured for 2026-08-26
      YYGH/CRE/SOAR/XPON and 2026-08-27 CELU/PPCB/LGPS/CHOW.
- [x] `WSHP` excluded by owner after provider payload unavailability; it will
      not be retried. `ANF` remains export validation evidence only.
- [x] Add the checksum-gated, synthetic-demo-derived financial source for the
      exact eight verified inputs. Offline construction against the immutable
      attachments accepted all eight sessions and produced 12 long-only closed
      trades / 43 executions for each day. Market-data manifest SHA-256:
      `63e8913b7bcaa002532fa27f42a2279e7956b778160c30af6744f43fc466b106`.
      Derived-fact manifest SHA-256:
      `de1c14790751a28bab47fc0bd512a008763fc64b16bf37637f5c46d55357e9f1`.
- [x] Reconcile and register the future first-class demo schema as migration
      `0095`; production migrations `0092`–`0094` remain unchanged. The
      migration is unapplied and creates no record by registration alone.
- [x] Port bounded activation/materializer and server-side read-only/Analyzer
      guards onto current ancestry. The resolver remains intentionally null:
      canonical Journal financial/annotation/Analyzer materialization is not
      yet wired and no pack is claimed materialized.
- [ ] Add the approved Workspace and data-page demo indicators for owner visual
      review.
- [ ] Materialize the two Daily Tracker days, Dashboard pack, annotations,
      rules, notes and normal Analyzer facts in a disposable review boundary.
- [ ] Complete owner UI review and final focused integration verification.

## Retained boundaries

- No migration execution, database write, local server, provider retrieval,
      push, deployment, paid AI, Discord, or notification work occurs in this
      source slice.
- The source permits no obsolete date/symbol pair and no WSHP or ANF financial
      fact.
- The separate synthetic micro-cap Dashboard inventory remains out of this
      Analyzer-backed Daily Tracker implementation slice.
