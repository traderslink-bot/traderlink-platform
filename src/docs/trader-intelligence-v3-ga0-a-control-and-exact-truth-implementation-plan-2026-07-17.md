# Trader Intelligence v3 GA0-A Control and Exact Truth Implementation Plan

**Date:** 2026-07-17 America/Toronto  
**Status:** Active file-level implementation plan  
**Architecture authority:** `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`  
**Operating profile:** `private_owner_alpha`  
**Only operational hosting mode:** `local_only`
**Current slice:** GA0-A2 — canonical execution and exact financial truth
**Runtime model calls:** forbidden  
**Analytics tools:** forbidden in GA0-A  
**Chart rendering:** forbidden in GA0-A  
**Support/resistance consumption:** forbidden  
**Production deployment:** forbidden

---

# 1. Purpose

GA0-A establishes the factual and operational constitution required before v3 analytics read real owner data as trusted analytical truth.

GA0-A does not build user-facing analytics, natural-language query handling, charts, or AI.

GA0-A proves:

- the application knows whether it is local-only or privately hosted;
- privately hosted Intelligence routes cannot be anonymous;
- source content has canonical cryptographic identity;
- financial values use exact decimals;
- accepted executions have deterministic identity and ordering;
- duplicate, correction, ambiguity, and collision states are explicit;
- factual inventory cannot be changed by a review action;
- corrections are immutable and temporally replayable;
- datasets are coverage-aware and content-addressed;
- analysis eligibility is per capability;
- one analysis run reads one immutable snapshot;
- evidence references remain stable across persistence changes;
- canonical date/time filters can be represented and hashed before tools exist;
- runtime payloads are validated;
- private data cannot enter Git or normal logs;
- SQLite backup and restore are demonstrably consistent.

---

# 2. Authority and Relationship to Older Plans

Read in this order:

1. `plan.md`
2. `src/docs/trader-intelligence-v3-project-log.md`
3. `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
4. this plan
5. detailed QA reviews only for rationale
6. legacy plans only for preserved implementation evidence

This plan supersedes the file-level execution scope in:

`src/docs/trader-intelligence-v3-gate-0-and-first-internal-slice-plan-2026-07-17.md`

That older Gate 0 plan remains an umbrella/historical artifact. Weekday analytics and the daily-stop simulation belong to GA0-B.

The fifth-pass query and visual-evidence review does not move chart work into GA0-A. GA0-A3 defines only canonical query/filter contracts needed for deterministic snapshots and future tool manifests.

---

# 3. Delivery Shape

GA0-A is delivered in three focused sequential PRs.

## GA0-A1 — Containment and Architecture Boundaries

Recommended branch:

`agent/trader-intelligence-v3-ga0-a1-containment`

## GA0-A2 — Canonical Execution and Exact Financial Truth

Recommended branch:

`agent/trader-intelligence-v3-ga0-a2-exact-truth`

Start only after GA0-A1 is merged or explicitly accepted.

## GA0-A3 — Temporal, Manifest, Eligibility, and Query Foundation

Recommended branch:

`agent/trader-intelligence-v3-ga0-a3-manifests`

Start only after GA0-A2 is merged or explicitly accepted.

GA0-B begins only after all GA0-A acceptance criteria pass.

Do not combine the three slices into one giant PR.

---

# 4. Global Non-Goals

GA0-A must not add:

- an AI provider call;
- an Ask AI route;
- prompt engineering;
- natural-language question parsing;
- weekday analytics;
- daily-stop simulation;
- chart-ready analytical series beyond contract types;
- chart rendering;
- a visual-template registry implementation;
- chart drill-down UI;
- market-candle enrichment;
- setup classification;
- behavioral coaching;
- Rule Lab UI;
- reports;
- vector search or embeddings;
- arbitrary SQL or analytics DSL;
- live broker connections;
- options analytics;
- tax accounting;
- live alerts;
- automated execution;
- `/coach` redesign;
- support/resistance consumption;
- a second level detector;
- production deployment.

An owner-access guard or fail-closed disabling of existing Intelligence routes is allowed because it reduces exposure.

---

# 5. GA0-A1 — Containment and Architecture Boundaries

## 5.0 Independent-audit remediation status on 2026-07-17

- Independent audit accepted the containment direction with required fixes; remediation is in progress on `agent/trader-intelligence-v3-ga0-a1-containment`.
- Draft review: `https://github.com/traderslink-bot/traderslink-trader-improvement-system/pull/102`.
- Acceptance remains pending independent re-review; GA0-A2 has not started.
- Current execution mode is local owner testing only; no Vercel preview or production deployment is requested.
- The machine-readable containment matrix classifies all 51 Intelligence pages and 31 relevant Intelligence APIs.
- Supported development and optimized scripts use a raw Node listener bound to `127.0.0.1`; it rejects non-loopback peers and client-supplied forwarding/proxy/tunnel evidence before Next.js handling, then stamps a per-process assertion for the exact loopback headers Next.js 16 synthesizes internally.
- All owner surfaces require a verified exact loopback request before local owner authorization; forwarded, proxied, tunneled, LAN, public, arbitrary DNS, and malformed requests fail first.
- Only `local_only + local_sqlite` is operational. Hosted profiles/modes and `private_database` fail with stable not-operational reasons.
- Unsafe methods require an explicit configured loopback Origin allowlist and exact scheme/host/port validation before legacy handler/repository work.
- Sample mode uses isolated in-memory persistence. Real-owner mode requires an explicit durable path outside Git and the OS temp directory, and upload entry points require explicit real-owner mode.
- Intelligence pages and APIs are dynamic, private, and no-store.
- Trader Intelligence remains a separate application from Academy. The provisional Discord-session adapter is retained as isolated future compatibility code, but no accepted runtime profile reaches it; the exact architecture exception exposes no Academy role, progress, lesson, entitlement, or product behavior symbol.
- Inventory and legacy hazard register are complete.
- Feature provenance was reconciled with the dirty V2 worktree: committed V2
  engine behavior was deliberately ported to `main`, while uncommitted manual
  entry, AI reflection, and real-coach/Whop prototypes remain external legacy
  sources and are not authorized for implementation in GA0-A1.
- AST architecture and deny-by-default route guards run locally and in CI.
- Private-data guards scan the final tree and every added/modified PR-history blob with exact file/hash synthetic-fixture approval.
- No exact-financial, analytics, chart, AI, support/resistance, migration, or deployment work was added.
- Audit fixes remain in progress until the entire required verification set passes and the revised head is independently re-reviewed. Exact interim results are recorded in the v3 project log.

## 5.1 Current-system inventory

Create or update:

`src/docs/trader-intelligence-v3-current-system-inventory-2026-07-17.md`

For every relevant module record:

- path;
- responsibility;
- consumers;
- source-of-truth layer;
- production/private-alpha readiness;
- classification;
- migration/adapter need;
- risks;
- tests;
- retirement condition.

Classifications:

- `preserve`;
- `adapt`;
- `legacy_provider`;
- `retire`;
- `out_of_scope`.

Minimum inventory:

- broker CSV adapters/core;
- fingerprints and duplicate logic;
- raw trade timeline;
- execution feedback;
- current importer/commit planner;
- SQLite repository;
- all Intelligence pages/APIs;
- auth/session paths;
- market-data adapters;
- level-analysis bridge;
- pattern/scoring/coaching stack;
- current chart contracts/renderers;
- tests/fixtures/CI;
- private calibration paths.

## 5.2 Deployment and hosting contracts

Create under:

`src/lib/trader-intelligence-v3/deployment/`

Required contracts:

- deployment profile;
- hosting mode;
- startup validation;
- owner identity requirement;
- allowed storage mode;
- allowed route mode;
- fail-closed reason codes.

Required states:

- `private_owner_alpha` with `local_only`;
- future hosting/profile/storage declarations that fail as not operational.

Fail closed when:

- hosting mode missing;
- deployed environment claims local-only;
- any hosted mode/profile or private database is requested;
- request Host/URL is not exact loopback or forwarding/proxy/tunnel evidence exists;
- configured mutation origins are invalid or an unsafe request lacks an exact approved Origin;
- storage path is unsafe;
- sample/real-data mode is ambiguous.

## 5.3 Owner route containment contract

Inventory every Intelligence page/API as:

- public-safe informational;
- owner read;
- owner mutation;
- internal diagnostics;
- disabled outside local mode.

Private-hosted requirements:

- server-derived owner session;
- authorization before repository access;
- no demo identity as authorization;
- no anonymous cache;
- mutation audit record;
- generic unauthorized/not-found response;
- all evidence/chart/export routes owner-scoped.

GA0-A1 may implement the containment boundary or disable unsafe routes. It must not redesign product UI.

## 5.4 Minimal v3 boundary

Create:

```text
src/lib/trader-intelligence-v3/
  deployment/
  auth/
  contracts/
  domain/
  testing/
```

No Next.js imports inside domain/contracts.

No direct database, model, market-data, or level-engine dependency in v3 core.

## 5.5 Architecture dependency guard

Add tests/scripts that prevent:

- v3 domain importing `app/`;
- v3 domain importing OpenAI/AI SDK;
- v3 domain importing SQLite/Neon directly;
- v3 domain importing `levels-system-v2` directly;
- legacy coaching importing v3 internals to bypass adapters;
- route code becoming domain authority.

## 5.6 Private-data repository guard

Scan staged/repository content for:

- broker export names;
- likely account numbers;
- private fixture paths;
- raw CSV rows;
- private screenshots;
- secrets/tokens;
- unredacted identifiers.

Use exact file-specific content hashes for synthetic fixtures. Scan tracked, staged, non-ignored untracked, and every added/modified PR-history blob, including content later deleted or renamed. Never print a suspected sensitive value.

## 5.7 Legacy hazard register

Document at least:

- demo identities;
- direct route/repository construction;
- temporary production SQLite;
- legacy 32-bit fingerprints;
- JavaScript-number financial fields;
- user lifecycle overrides;
- browser-side prototype filtering;
- prototype chart contracts lacking evidence metadata;
- request-lifecycle critical jobs;
- JSON blobs as query authority;
- nearest-level coaching;
- fixed coaching templates.

## 5.8 GA0-A1 tests

- deployment profile validation;
- hosted-local mismatch failure;
- owner session missing failure;
- owner route containment matrix;
- unauthorized API mutation failure;
- architecture dependency test;
- private-data guard positive/negative fixtures;
- no runtime analytics/model/chart dependency.

## 5.9 GA0-A1 acceptance

- inventory accepted;
- route containment decision accepted;
- local/hosted startup behavior fails closed;
- minimal v3 boundary exists;
- dependency guard passes;
- private-data guard passes;
- no real data deployed;
- no analytics/chart/AI feature added;
- project log updated.

---

# 6. GA0-A2 — Canonical Execution and Exact Financial Truth

## 6.0 Final focused correction status - 2026-07-18

- Independent re-audit of `c1a1b50379165485d28f0e0a28a21c3917cac820`
  left one required correction/bust scoping fix. The binding scope is
  `src/docs/trader-intelligence-v3-ga0-a2-final-correction-scope-2026-07-18.md`.
- Executable head `8b141633f19e10dfd503e4c1e83f5660e7e4e9b7`
  requires compatible canonical owner, account, resolved stable instrument,
  currency, broker, and source-system identity before stable execution IDs or
  correction references can link a pair. Candidate indexes mirror that exact
  scope.
- Intrinsic unresolved correction/bust state still blocks only its own group.
  No correction application or other GA0-A3 work was added.
- The owner explicitly prohibited local tests and verification for this final
  correction. It is an unverified implementation candidate pending independent
  code review; it is not accepted or claimed regression-safe.
- Keep draft PR #104 open, draft, unmerged, undeployed, and with independent
  review threads unresolved.

## 6.0 Current second-remediation status - 2026-07-18

- The independent re-audit of immutable implementation head
  `88db72e70538e2222ae8467c5245fa4b8eb85600`, recorded at audit-document head
  `480cb480d4ee80e7fe3626a94a1b5622765dd773`, returned A2-R1 through A2-R7.
- All seven findings are implemented and fully verified at executable head
  `9721a2707d936987f3b0e116226dd20de400cf58` on the existing branch and draft
  PR #104.
- Relationship resolution is exhaustive and opaque; raw FIFO cannot bypass
  coverage. Starting inventory is explicit and versioned. Canonical execution
  envelopes are deeply immutable and integrity-verified. Suppression is
  validation- and document-proof-aware. Canonical dictionaries are
  prototype-safe. Unknown timestamp precision cannot create time order.
  `row_number` is a bounded canonical integer string.
- The independent BigInt/reference ledger supports exact accepted prior long
  and short lots without importing production arithmetic or matching helpers.
- Nineteen fixed seeds (`2026071801` through `2026071819`) run 1,000 cases each.
  The consolidated gate passed 14 files/263 tests; full Vitest passed 177
  files/1,763 tests; the 11-test differential, architecture, privacy, Layer 2,
  Layer 3, and 127-page build passed.
- No package, lock, route, browser, Next, CI, E2E, generated-contract, database,
  or persistence file changed. `npm ci` and Playwright were therefore not run.
- The following closeout commit is documentation-only and receives only the
  prescribed lightweight documentation-head checks. No heavy executable suite
  is repeated for Markdown-only changes.
- GA0-A2 remains unaccepted. Keep PR #104 draft and unmerged, leave independent
  audit threads unresolved, and stop for independent re-audit. GA0-A3 remains
  deferred and has not begun.

## 6.0 Implementation status — 2026-07-18

- GA0-A1 is independently accepted and complete. PR #102 merged as
  `4f9e440116258c9548a2d13f7ea057a9075101c6`.
- Active branch:
  `agent/trader-intelligence-v3-ga0-a2-exact-truth`, created from the latest
  `origin/main` after verifying the accepted GA0-A1 ancestor.
- The first independent audit reviewed
  `542992b6a7c54ce871c31bc2831126c850fea04c` and required remediation. All
  findings are implemented and the complete required local verification
  matrix is green at
  `b92b321fab7801212c82125511e58c754e594fea`. GA0-A2 is not yet accepted and
  must return to independent re-audit.
- Only `private_owner_alpha + local_only + local_sqlite` remains operational.
- No hosted mode, database migration, saved-data migration, route/UI change,
  analytics, chart, AI/model, market-data, support/resistance, manual-entry,
  reflection, Real Coach/Whop, or deployment work is authorized in this slice.
- GA0-A3 bitemporal corrections, manifests, eligibility, evidence references,
  query filters, and backup/restore remain deferred and have not begun.
- The focused exact-truth verification, repository regressions, private-data
  and history audit, and build are green. Playwright was not manually rerun
  because no route, server, Next, browser-facing, or E2E configuration changed.
  The implementation must remain in draft PR #104 for independent re-review.

### 6.0.1 Implemented authority

- Four binding ADRs define exact decimals, canonical serialization and digest,
  canonical execution/order/identity, and analytical P/L/reconstruction.
- `domain/exact` owns the sole approved `decimal.js` import plus opaque exact
  decimal and BigInt ratio values.
- `domain/canonical` owns strict nine-digit UTC timestamps, precision
  intervals, NFC/LF canonical JSON, deterministic code-point key ordering, and
  duplicate-key-rejecting raw JSON parsing.
- `domain/identity` owns domain-separated SHA-256 digests and byte equality.
- `domain/execution` owns canonical provenance/evidence, content identity,
  storage versus meaningful ordering, ambiguity/conflict evidence, and pure
  duplicate/re-export/correction/collision classification.
- `domain/accounting` owns policy-v1 exact FIFO inventory and analytical P/L.
- `testing/reference` owns the independent BigInt coefficient/scale and FIFO
  oracle; it shares no production arithmetic or matching helper.
- Thirty-five executable exact synthetic fixtures and fifteen 1,000-run fixed
  property suites cover the required long, short, partial, reversal, fee,
  identity, ordering, currency, prior/open inventory, and fail-closed cases.
- Architecture guards prohibit decimal imports outside the approved module,
  JavaScript-number financial authority, direct legacy/route consumption, and
  use of the isolated engine from current product surfaces.

### 6.0.2 Recorded fixed seeds

- `2026071801` — flat long, 1,000 runs.
- `2026071802` — flat short, 1,000 runs.
- `2026071803` — partial fills, 1,000 runs.
- `2026071804` — reversals, 1,000 runs.
- `2026071805` — duplicate classification, 1,000 runs.
- `2026071806` — canonical property order, 1,000 runs.
- `2026071807` — digest semantics, 1,000 runs.
- `2026071808` — ambiguous ordering, 1,000 runs.

- `2026071809` — short-to-long reversals, 1,000 runs.
- `2026071810` — prior inventory, 1,000 runs.
- `2026071811` — currency isolation, 1,000 runs.
- `2026071812` — relationship resolution, 1,000 runs.
- `2026071813` — blocked states, 1,000 runs.
- `2026071814` — price/quantity scale boundaries, 1,000 runs.
- `2026071815` — 48-digit precision boundaries, 1,000 runs.

### 6.0.3 Verification summary

- Clean install, TypeScript, changed-path ESLint, and `git diff --check`: pass.
- GA0-A2 focused gate: 14 files, 231 tests pass.
- Full Vitest: 177 files, 1,731 tests pass.
- Independent specialized coverage includes SQLite 2 tests, differential 10
  tests, and fixed-seed properties 15 tests/15,000 generated cases.
- Architecture: 371 files, 42 API routes, and 82 classified routes pass.
- Private-data scan at the implementation head: 23,693 records, including
  23,590 final-tree records and 103 PR-history blobs, pass.
- Layer 2 and Layer 3 verification: pass.
- Optimized build: pass, 127 generated pages; existing Academy/Turbopack
  notices remain.
- Playwright was not manually rerun for this remediation because no app route,
  local server, Next configuration, browser-facing code, or E2E configuration
  changed. The previous E2E result is historical baseline evidence only.
- No live model, financial provider, payment, Discord, Vercel, production
  database, production deployment, or any deployment call occurred.

### 6.0.4 Audit handoff

GA0-A2 stops at a draft PR. Independent audit must validate exactness,
canonical identity, ordering ambiguity, duplicate suppression, FIFO/reference
agreement, fixed-seed reproducibility, privacy, and legacy isolation. No GA0-A3
work may begin until a later explicit acceptance entry is recorded.

## 6.1 Exact decimal ADR and wrappers

Select and document:

- decimal library;
- canonical decimal grammar;
- price/quantity/money/fee/percentage types;
- precision bounds;
- signed-zero policy;
- intermediate rounding;
- display rounding separation;
- invalid/overflow behavior;
- SQLite test representation;
- future PostgreSQL exact representation.

Create domain wrappers so business logic does not import the library directly.

## 6.2 Canonical serialization and cryptographic digest

Define:

- UTF-8;
- Unicode normalization;
- key ordering;
- semantic array ordering;
- decimal normalization;
- timestamp format/precision;
- null/omitted semantics;
- enum case;
- line endings;
- duplicate-key rejection;
- domain/schema/canonicalization/hash versions.

Use an approved cryptographic digest.

Exclude random/database/wall-clock/display metadata from content identity.

## 6.3 Canonical execution contract

Required fields include:

- source identity;
- broker/account;
- instrument-resolution state;
- raw broker symbol;
- UTC timestamp;
- source timezone/precision;
- side/position effect;
- exact quantity/price;
- exact fees/commission/net amount where known;
- currency;
- order/execution IDs;
- original row locator;
- correction state;
- canonical digest;
- validation status.

## 6.4 Deterministic ordering

Define ordering evidence and ambiguity:

1. timestamp;
2. timestamp precision;
3. broker execution index;
4. execution ID;
5. order ID;
6. source row location;
7. canonical digest.

Unresolvable meaningful order creates an ambiguity state.

## 6.5 Duplicate/correction/collision states

Implement machine states:

- exact duplicate same source;
- same execution reexported;
- broker correction/bust;
- possible duplicate ambiguous;
- legitimate repeated fill;
- digest collision;
- manual review required.

Only proven exact duplicates are suppressed.

## 6.6 P/L and reconstruction ADR

Define:

- analytical P/L versus broker/cash/tax;
- average cost or FIFO;
- fee allocation;
- partial fills;
- average-fill rows;
- shorts;
- reversals;
- prior inventory;
- open positions;
- corporate actions;
- symbol changes;
- user grouping corrections;
- currency separation.

## 6.7 Reference math

Build an independent exact reference implementation for:

- long round trips;
- partial entries/exits;
- short round trips;
- reversals;
- fees;
- open inventory;
- prior inventory;
- zero/negative fees where valid;
- sub-dollar precision;
- multiple currencies separated.

## 6.8 GA0-A2 tests

- decimal grammar and round-trip;
- cross-platform canonical digest;
- property-order invariance;
- semantic change changes digest;
- persistence ID does not change digest;
- same-timestamp ordering;
- ambiguous ordering;
- legitimate repeated fill;
- exact duplicate;
- correction/bust;
- collision fail-closed;
- differential P/L;
- property tests with recorded seeds;
- no JavaScript-number authority.

## 6.9 GA0-A2 acceptance

- exact decimal ADR accepted;
- canonicalization ADR accepted;
- canonical execution contract accepted;
- cryptographic identity implemented;
- legacy fingerprints marked non-authoritative;
- ordering/duplicate states implemented;
- P/L/reconstruction ADR accepted;
- reference math passes;
- exact synthetic fixtures pass;
- no analytics/chart/AI feature added.

---

# 7. GA0-A3 — Temporal, Manifest, Eligibility, and Query Foundation

## 7.1 Bitemporal correction contract

Define valid/effective, first-public, observed, recorded, corrected, and superseded times.

Corrections are append-only.

Old manifests remain replayable.

## 7.2 Lifecycle versus review disposition

Implement separate contracts.

Only executions/corrections change inventory.

Legacy mark-closed behavior becomes annotation/coverage limitation.

## 7.3 Retrospective/open-position policy

Define:

- closed historical trade;
- same-day closed trade;
- open-position execution review only;
- pending correction;
- coverage incomplete;
- not eligible for coaching.

Every result records `analysisCutoffAt`.

Open positions receive no live directional guidance.

## 7.4 Dataset and coverage manifests

Implement content-addressed contracts for:

- source files;
- accepted executions;
- corrections;
- policies;
- accounts;
- statement periods;
- gaps/overlap;
- exclusions;
- prior inventory;
- open positions;
- currencies.

## 7.5 Eligibility contract

Implement per-capability states and stable reason codes.

Include future `visual_evidence` capability but do not render visuals.

## 7.6 Immutable analysis snapshot

Bind one run to one:

- dataset/coverage manifest;
- correction cutoff;
- policies;
- eligibility;
- enrichment set;
- intent/rule cutoffs;
- analysis cutoff.

Reject mixed manifests.

## 7.7 Stable evidence references

Use manifest-scoped semantic identities.

Test reimport/persistence-ID changes.

## 7.8 Canonical date/time/query-filter foundation

Define contracts only for:

- date basis;
- time basis;
- timezone;
- start/end/inclusivity;
- calendar versus trading sessions;
- relative-date anchor and resolved absolute range;
- account/instrument/direction/session/lifecycle/setup/outcome/currency filters;
- evidence capability filters;
- open-position policy;
- analysis cutoff;
- canonical filter digest.

Do not add natural-language parsing or a query UI.

## 7.9 Runtime validation

Validate:

- canonical executions;
- corrections;
- manifests;
- eligibility;
- evidence references;
- date/time filters;
- analysis snapshots;
- database JSON;
- future adapter/tool payloads.

## 7.10 Stale/invalidation states

Define current, stale-source, stale-policy, stale-eligibility, superseded, blocked, retryable/terminal failure, and deleted-source states.

## 7.11 WAL-safe backup and restore

Document/test:

- consistent backup mechanism;
- encryption;
- integrity check;
- isolated restore;
- execution/manifest digest comparison;
- representative reference result comparison;
- restore-test record.

## 7.12 Parser hardening contract

Plan/tests for:

- duplicate raw/normalized headers;
- mapping collisions;
- malformed/unclosed quotes;
- inconsistent row width;
- unsupported encoding;
- control characters;
- oversized cells;
- ambiguous delimiter;
- conflicting duplicate execution IDs.

Severe defects may be fixed before GA0-B; broader parser refactor remains separate.

## 7.13 GA0-A3 tests

- bitemporal replay;
- effective-time notes/rules;
- review state cannot close inventory;
- open positions excluded from closed analytics;
- manifest digest stable across persistence IDs;
- coverage gaps change state;
- deterministic eligibility reasons;
- mixed-snapshot rejection;
- evidence resolution after reimport;
- date/time filter canonicalization;
- relative-date resolution with fixed clock;
- DST/holiday/early-close cases;
- stale propagation;
- runtime-validator negative corpus;
- backup/restore digest/reference checks;
- parser contract fixtures.

## 7.14 GA0-A3 acceptance

- temporal/correction policy accepted;
- factual lifecycle separated;
- open-position/cutoff policy accepted;
- manifests/coverage implemented;
- eligibility implemented;
- immutable snapshot implemented;
- evidence references implemented;
- canonical filter contract implemented;
- runtime validation exists;
- backup/restore passes;
- no analytics tool exists;
- no chart renderer exists;
- no AI call exists;
- no support/resistance use exists;
- no deployment occurs.

---

# 8. Cross-Slice Quality Requirements

## Comments

Any implementation comment includes the required date/time stamp under the project coding convention.

## Error handling

- fail closed on ambiguous truth;
- expose stable machine codes;
- keep user copy separate;
- never swallow validation errors;
- no raw rows in logs.

## Determinism

- explicit seeds;
- random IDs never influence content identity;
- explicit timezone;
- locale formatting stays outside calculations;
- wall clock injected;
- canonical sorting documented.

## Compatibility

- no current saved-data mutation;
- no migration in GA0-A;
- legacy reads only for inventory/compatibility tests;
- no route consumes new financial/filter contracts for user output yet.

## Privacy

- synthetic fixtures in Git;
- private fixtures outside Git;
- no account IDs in snapshots;
- no private source hashes in public docs;
- no raw CSV in prompts/logs.

---

# 9. Verification Commands

Each PR reports exact commands/results.

Minimum:

```text
npm ci
npx tsc --noEmit --pretty false
npx eslint <changed-v3-paths>
npx vitest run <focused-v3-tests> --reporter=dot
npm test
npm run verify:layer2
npm run verify:layer3
npm run build
```

Additional:

## GA0-A1

- architecture-boundary test;
- deployment/hosting tests;
- owner-route containment tests;
- private-data guard.

## GA0-A2

- exact-decimal tests;
- canonical digest tests;
- reference/differential financial tests;
- property tests with recorded seeds;
- duplicate/collision tests.

## GA0-A3

- temporal replay;
- manifest/eligibility;
- query/filter canonicalization;
- evidence resolution;
- mixed-snapshot rejection;
- runtime-validator negative corpus;
- backup/restore;
- parser-hardening contract tests.

Normal CI must not call a live model or external market-data source.

---

# 10. Review Checklist for Every GA0-A PR

- scope matches only its slice;
- no hidden analytics or chart feature;
- no route/UI product expansion except containment;
- no AI/provider dependency;
- no support/resistance dependency;
- no raw private data;
- exact policy documented;
- runtime validation included where relevant;
- negative tests included;
- deterministic IDs/hashes reviewed;
- changed paths/dependencies reviewed;
- legacy tests green;
- build green;
- project log updated;
- next slice not started prematurely.

---

# 11. GA0-A Exit Criteria

GA0-A is complete only when all three slices prove:

- owner-only containment;
- canonical cryptographic identity;
- legacy fingerprints non-authoritative;
- exact executions and honest ambiguity;
- explicit duplicate/correction states;
- exact/versioned P/L policy;
- passing reference math;
- immutable temporal corrections;
- review state cannot change inventory;
- open positions cannot enter closed-trade conclusions;
- explicit coverage;
- content-addressed manifests;
- per-capability eligibility;
- immutable analysis snapshots;
- stable evidence references;
- canonical date/time/filter contract;
- fail-closed runtime validation;
- proven backup/restore;
- private-data guards;
- no user-facing analytics, chart rendering, AI, support/resistance, or deployment.

Only then may GA0-B implement weekday analytics, the daily-stop simulation, exact tables, and validated chart-ready series.

---

# 12. Final Directive

GA0-A is the factual constitution, not a feature sprint.

```text
contain access
  -> classify legacy boundaries
  -> define canonical identity
  -> make financial values exact
  -> define immutable corrections and inventory truth
  -> bind content-addressed datasets
  -> define date/time filters and capability eligibility
  -> prove consistent snapshots and stable evidence
  -> then build deterministic tables and chart-ready series
```

Do not optimize for visible UI progress.

Optimize for removing silent financial corruption, accidental exposure, ambiguous time ranges, irreproducible analysis, and future text/chart disagreement before those failures reach the user.
