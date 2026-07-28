# v3 Execution Analytics Dashboard Operationalization Plan

## Status

Milestones 0 and 1 were completed on 2026-07-27. Milestone 1 persists a
content-verified raw source document and binds it
to one owner-guarded, local-only v3 import route. The route derives owner scope,
account, private storage, and instrument declarations on the server; it accepts
only raw CSV bytes and explicit broker parsing declarations. No legacy route,
database, import, or dashboard consumer was changed.

## Decision

The Trade Execution Analytics Engine v3 is the only planned authority for
execution-derived analytics. The existing SQLite saved-trade/analytics store is
disposable test data. Do not migrate it, convert it to v3, preserve it as a
fallback, or use it to fill a missing v3 result.

### Safe default for incomplete statements

An imported broker statement may end with an open position or omit the prior
history needed to establish its cost basis. Preserve those executions and show
the resulting position as open or unresolved; do not require the trader to
verify it before keeping it. The dataset builder must exclude only unsupported
realized-P/L analytics, disclose the missing basis or correction authority, and
must not call a value `unrealized P/L` without separate current-market-price
authority. For the current safe-default resolver, those missing authorities
keep the execution-analytics dataset, currency partitions, and queries
unavailable instead of manufacturing a partial P/L result. The raw lifecycle
remains available and disclosed. A later resolver may narrow an exclusion only
after explicit opening-inventory, correction, and statement-period authority
has been attached.

The open-position review marker is derived from current position lifecycle, not
stored as a sticky user task. When a later broker-confirmed execution closes the
position, the marker automatically clears. A separate missing-basis or
correction limitation may remain if the close does not establish an exact
realized result.

The eventual runtime has one path:

~~~text
raw broker CSV
  -> v3 source-document and execution authority
  -> v3 FIFO and analytical dataset authority
  -> v3 deterministic query engine
  -> authenticated server-only dashboard adapter
  -> normal dashboard panels and stricter embedded-AI tool wrapper
~~~

Until the v3 import-to-dashboard smoke path succeeds, the old SQLite path
remains temporarily operational but is a retirement target, not an alternative
execution-analytics owner. Normal panels and embedded chat are parallel
consumers of the same server-only v3 adapter. Neither calculates financial
analytics.

## Scope and boundaries

This work connects v3 broker import, durable authority, verified dataset and
partition resolution, a server-only dashboard adapter, normal dashboard panels,
and a governed embedded-AI consumer. It does not implement candle, market-data,
VWAP, setup/optimal-exit, Coach, simulation expansion, LLM-memory,
notifications, deployment, or a second analytics engine.

| Layer | Owns | Must not do |
| --- | --- | --- |
| v3 ingestion | Raw broker bytes, source identity, validation, accepted/rejected coverage | Infer incomplete rows or use the legacy importer |
| v3 persistence | Documents, canonical executions, FIFO inputs, receipts | Store duplicate dashboard totals |
| v3 query engine | Exact evidence-linked analytics and unavailable states | Render UI or trust browser owner scope |
| Dashboard adapter | Authorization, scope/dataset resolution, validation, packet serialization | Recalculate analytics or expose unrestricted raw data |
| Dashboard UI | Formatting and rendering packets | Calculate from displayed rows or suppress limitations |
| Embedded AI | Governed requests and explanations | Estimate, infer, or fabricate analytics |

## Required runtime contracts

Every v3 import must preserve a source-document receipt/digest; attempted,
accepted, and rejected counts; canonical executions and correction/bust
relationships; owner/account/broker/source/currency/timestamp authority; charge
coverage; and dataset/partition receipts. Rejected rows are quality facts, not
financial authority. Local-time rows remain unavailable until a governed
timezone/DST policy exists. Combined charges remain combined; a named commission
metric requires complete reconciled charge-kind allocation.

The one server-only resolver accepts authenticated owner scope plus account,
currency, and date scope, and returns a 'VerifiedTradeQueryDatasetSource' with
a compatible 'AnalyticalPartitionReceipt'. It enforces isolation, uses only
persisted v3 authority, isolates currencies, returns honest empty/unavailable
states, and binds responses to authority receipts. It has no SQLite or legacy
migration fallback.

The server-only adapter exposes generic query-plan-backed operations:

| Operation | Dashboard use |
| --- | --- |
| 'getCapabilities' | Enable/disable views and explain missing authority |
| 'getOverview' | Headline P/L, outcomes, fees, sample/data quality |
| 'getPerformanceSeries' | Period chart and period table |
| 'getBreakdown' | Ticker, time, session, direction, price, size, hold-time, sequence, repeat-attempt views |
| 'getDistribution' | Histogram, quartiles, tails, outliers |
| 'getAttribution' | Contribution and period comparison |
| 'getEvidencePage' | Bounded drill-down evidence |
| 'getFindings' | Evidence-backed optional insights and later AI tools |

Each response retains metric key, exact value/ratio, unit, availability, query,
result, and evidence identity, sample disclosures, limitations, and unsupported
codes. Presets compile to generic v3 query plans; a card never owns a second
calculation. Browser code must not import 'analytics/query/' internals.

Server components may call the adapter directly. Interactive controls may use a
versioned authenticated namespace such as
'/api/intelligence/execution-analytics/v1/...'. Every request derives owner
identity from authentication, validates account/currency/date/filters/grouping/
metrics/ordering/pagination against v3 registries, retains v3 limits (or
stricter ones), and rejects arbitrary expressions, SQL, paths, and unbounded
evidence requests. No client-side currency conversion or fee-label inference is
allowed.

The eventual AI wrapper is stricter than dashboard rendering: capability
discovery first, packet identity stored in tool state, no raw execution rows,
no metric calculation, no unsupported inference or causal claim, no
chart/candle answer from execution data, preserved limitations/sample state,
and date-scope clarification. It only begins after the owner accepts the tested
Milestone 4 dashboard design.

## Milestones

### Milestone 0 — Direction lock and disposable SQLite retirement rule — complete

- Record that v3 has no SQLite conversion, fallback, or parallel runtime.
- Inventory the legacy execution routes solely to plan later retirement.
- Define the reversible disposable-data reset procedure.
- Keep the store and routes untouched until v3 import-to-dashboard proof.

Exit: v3 is the documented future execution-analytics owner; the legacy SQLite
path is explicitly temporary and has no migration/fallback role.

### Milestone 1 — v3 import, persistence, and restart proof — complete

- Complete the controlled v3 import entrypoint over the persisted source
  document boundary; it must not call the legacy SQLite importer.
- The initial controlled entrypoint is `POST /api/intelligence/execution-import/v1`.
  It is owner-guarded, Origin-protected, requires real-owner data mode, limits
  raw CSV bytes, and stores only under the validated private persistence parent.
  It derives canonical owner/account scope and uses a server-held instrument map;
  unknown symbols remain explicitly unresolved rather than acquiring browser
  supplied instrument authority.
- The initial persistence batch records raw source bytes, declared mapping and
  timezone/charge settings, accepted canonical executions, rejected-row
  receipts, and a content-addressed persistence digest. A fresh local store
  rehydrates and replays the identical source receipt and execution digests.
  The server-scoped service also reads that same digest after reconstruction,
  using only its derived owner/account scope.
- Source selection is bounded, deterministic, and owner/account scoped. It
  rejects duplicate receipt digests and retains each selected source's currency
  and charge-coverage declarations without netting or converting currencies.
- Selected receipts now produce a lifecycle-only projection: an incomplete
  statement can remain open without a required user-verification task, and a
  later broker-confirmed offsetting fill automatically clears the open marker.
  This is intentionally not a realized or unrealized P/L calculation.
- The persisted-source resolver now produces a content-addressed unavailable
  receipt when opening-inventory, correction, or statement-period authority is
  absent. It intentionally returns no dataset, partition, or query identity;
  a fresh service instance produces the same receipt and source/lifecycle
  identities after restart.
- Cover corrections, rejected receipts, charge coverage, owner/account
  isolation, and multi-currency behavior.

Exit: fresh broker data is durable v3 source authority readable without legacy
data, with restart-stable safe-default readiness that cannot manufacture an
unsupported dataset, partition, or query.

### Milestone 2 — Dataset/partition resolver and server-only adapter foundation

- Implement the owner/account/currency/date resolver.
- Accept explicit correction and opening-inventory authority before claiming a
  realized-P/L dataset. Until it is attached, preserve raw lifecycle but keep
  the safe-default dataset/query unavailable. Once attached, exclude only an
  affected realized analytic rather than requiring user verification.
- Implement capabilities, overview, and generic grouped breakdowns.
- Return client-safe, identity-bound packets and cover authorization, invalid
  requests, empty data, unsupported metrics, and bounded limits.

Exit: server code can render core execution analytics from v3 only.

### Milestone 3 — Stable dashboard contract and formatting-only view models

- Add period series, distributions, attribution, evidence pagination, and
  findings operations.
- Add typed client-safe contracts, fixtures, and formatting-only table/chart/
  limitation/evidence view models.

Exit: dashboard work can proceed without touching v3 internals.

### Milestone 4 — Normal dashboard panels

- Build overview, period chart, ticker/time/session views, limitations, and
  evidence drill-down first; add remaining execution-only panels incrementally.
- Keep candle and Coach panels behind their own providers.

Exit: every execution value is traceable to a v3 packet and the owner has
tested and accepted the design.

### Milestone 5 — Embedded dashboard AI consumer

- Start only after Milestone 4 acceptance.
- Add the stricter server-only wrapper over the shared adapter and verify all
  packet identity, limitation, unsupported-claim, raw-row, calculation,
  causation, and chart/candle guardrails.

Exit: chat explains the same governed v3 packets without becoming an engine.

### Milestone 6 — Legacy SQLite/test-store retirement

- Confirm imports, reads, drill-downs, and AI tools use v3 only.
- Remove legacy execution-analytics read paths, then reset/delete disposable
  SQLite test data and dead UI dependencies.

Exit: one v3 execution import/read/query path remains.

## Verification

At each milestone, run focused import, adapter, or dashboard-contract tests and
the relevant v3 engine gate. A rendered card alone is not proof of financial
correctness. Completion evidence must prove raw-byte ingestion, restart identity,
owner/account isolation, packet equality, honest unavailable/limited states,
bounded evidence identity, and (when applicable) AI-wrapper guardrails.

## Dashboard handoff rule

At Milestone 3, hand the dashboard session this plan, the capability catalog,
adapter contracts, and fixtures. The dashboard must not import query internals,
use legacy execution calculations, calculate displayed values, use
chart/candle/Coach data to fill execution metrics, or hide unavailable,
insufficient-sample, or limitation states.
