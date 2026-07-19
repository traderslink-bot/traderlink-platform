# Trader Intelligence v3 GA0-A3 Implementation and Independent Audit Handoff

Date: 2026-07-18
Status: implementation candidate complete; independent audit required

## 1. Commit and branch identity

| Item | Identity |
|---|---|
| Branch | `agent/trader-intelligence-v3-ga0-a3-manifests` |
| Accepted GA0-A2 base | `e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a` |
| Accepted baseline PR | #104, merged; do not reopen or modify |
| Executable implementation head | `50d1d9c11883bf6777a0bf9929aef35ebdf2d7d6` |
| Documentation-only handoff head | Resolve with `git log -1 --format=%H -- src/docs/trader-intelligence-v3-ga0-a3-implementation-and-audit-handoff-2026-07-18.md` and require it to match the draft PR HEAD |

GA0-A3 is not accepted. The PR must remain draft and unmerged. No deployment or
GA0-B work is authorized from this handoff.

## 2. Delivered architecture

### Temporal corrections

`correction_record:v1` is an immutable verified content identity over the
semantic target/action, reason, replacement, supersession link, and canonical
valid/effective, optional first-public, observed, recorded, corrected, and
optional superseded timestamps. Correction application verifies every record,
detects cycles, sorts canonically, applies an injected cutoff, and reconstructs
active executions without overwriting originals.

Stable reasons cover missing or contradictory temporal evidence, target not
found or ambiguous, cycles, correction after deletion, correction outside the
snapshot cutoff, unsupported state, unverified records, and oversized sets.
Correction application remains separate from execution-relationship
classification and exact FIFO accounting.

### Lifecycle, review, and open positions

Factual lifecycle and review disposition have different builders and types.
Review disposition cannot create, remove, correct, bust, or supersede an
execution; close inventory; alter P&L; or change canonical identity. Legacy
mark-closed is an annotation state only.

Retrospective policy records analysis and correction cutoffs, included and
excluded lifecycle states, open-position policy, and the policy state. Open
positions may receive execution review only. Live directional guidance is
always false.

### Dataset and coverage manifest

`dataset_manifest:v1` commits to source-document digests and deletion state,
accepted execution and correction digests, policies/versions, owner and account
semantic scope, statement periods, gaps, overlaps, exclusions, prior inventory,
open positions, currencies, coverage states, and reconstruction status.

Canonical identity excludes persistence IDs, UUIDs, insertion order, creation
time, display text, paths, and locale formatting. Equivalent reimports retain
the digest; factual, correction, policy, gap, overlap, deletion, inventory,
position, currency, or reconstruction changes change it.

### Capability eligibility

Eligibility is independent for exact reconstruction, closed-trade analytics,
execution review, behavioral analytics, simulations, coaching, AI explanation,
visual evidence, export, and market enrichment. Each result records state,
stable reasons, manifest, analysis cutoff, evidence references, and a terminal,
retryable, stale, pending-evidence, or no-failure classification. No actual
analytics, AI, visuals, export, simulation, or enrichment implementation was
added.

### Snapshot and evidence identity

`analysis_snapshot:v1` binds one verified manifest, correction cutoff, policy
set, eligibility set, enrichment identity, intent/rule cutoff, analysis cutoff,
canonical filter, and evidence namespace. It rejects mixed manifest, cutoff,
correction, filter, policy, and unverified inputs.

`evidence_reference:v1` binds semantic execution occurrence, canonical
execution, correction version, round trip, policy, or filter evidence to one
manifest and snapshot. References reject foreign scopes and exclude raw broker
rows, account numbers, database IDs, and filesystem paths.

### Canonical filters and runtime boundaries

The filter records date/time/calendar basis, timezone, explicit requested dates,
inclusive/exclusive boundaries, injected relative-date anchor, resolved UTC
range, account/instrument/direction/session/lifecycle/setup/outcome/currency/
evidence-capability filters, open-position policy, correction and analysis
cutoffs, and optional snapshot binding. Arrays deduplicate and sort before the
digest. Contradictory UTC/timezone, temporal, version, range, unsupported value,
and extra-field inputs fail closed. There is no SQL, DSL, natural-language
parser, or query UI.

Strict validators cover corrections, lifecycle/review, policy, manifests,
coverage, eligibility, filters, snapshots, evidence, persisted JSON, and future
adapter/tool payload envelopes. They enforce versions, canonical timestamps,
digest consistency, exact fields, mixed-reference rejection, set and payload
bounds, and structured error codes without private raw-value logging.

### Stale propagation

The deterministic precedence is terminal failure, blocked, deleted source,
superseded, changed manifest/source, changed policy, changed eligibility,
changed enrichment, retryable failure, then current. A changed correction set
changes the manifest and stales dependent artifacts. Equivalent persistence IDs
that preserve the manifest digest do not create staleness. Capability impact is
scoped rather than globally contagious.

### Backup and restore

`createWalSafeSqliteBackup` uses SQLite's backup API and accepts explicit source
and destination paths. Real-data calls reject repository paths, OS temporary
paths, same paths, relative paths, and overwrite. Synthetic tests require an
explicit temporary-path exception.

`restoreAndVerifySqliteBackup` restores into a new isolated destination, runs
`PRAGMA integrity_check`, and compares representative canonical execution,
manifest, snapshot, and exact-reconstruction digests. Its content-addressed
record contains no private values or paths.

Owner-testable workflow:

1. keep the live owner database on the accepted durable path outside Git/temp;
2. select new absolute backup and isolated-restore destinations on
   owner-controlled encrypted storage;
3. call the adapter with those explicit paths and an application probe returning
   the four representative digest classes;
4. retain the returned restore-test digest as the drill receipt;
5. run the synthetic reference drill with
   `npx vitest run src/lib/trader-intelligence-v3/__tests__/ga0-a3/backup-parser.test.ts --reporter=dot`.

This implementation does not encrypt SQLite or its backup. External encrypted
storage is required for real owner backup material. No database, WAL, SHM,
export, account identifier, or backup artifact is committed.

### Parser hardening

The strict ingress preflight rejects duplicate raw or normalized headers,
mapping collisions, unclosed quotes, inconsistent execution-row widths,
unsupported encodings, controls, oversized payload/cells, ambiguous delimiters,
and conflicting duplicate execution IDs. It is wired narrowly before the
existing broker parser. Sectioned IBKR preambles, totals, and non-execution
sections remain supported. The legacy parser remains non-authoritative and was
not broadly rewritten; no live broker API was added.

## 3. Files changed

### Acceptance and controlling documentation

- `plan.md`
- `src/docs/codex-project-log.md`
- `src/docs/trader-intelligence-v3-project-log.md`
- `src/docs/trader-intelligence-v3-controlling-architecture-specification-2026-07-17.md`
- `src/docs/trader-intelligence-v3-ga0-a-control-and-exact-truth-implementation-plan-2026-07-17.md`
- `src/docs/trader-intelligence-v3-current-system-inventory-2026-07-17.md`
- `src/docs/trader-intelligence-v3-legacy-hazard-register-2026-07-17.md`
- the four accepted GA0-A2 ADRs, status-only acceptance reconciliation
- the two new GA0-A3 ADRs and this handoff

### Executable and tests

- `src/lib/execution-sources/csv/broker-execution-csv-import.ts`
- `src/lib/trader-intelligence-v3/domain/index.ts`
- `src/lib/trader-intelligence-v3/domain/identity/content-digest.ts`
- all files under the new `domain/foundation`, `domain/temporal`,
  `domain/manifest`, `domain/eligibility`, `domain/query`, `domain/snapshot`,
  `domain/evidence`, and `domain/state` directories
- `src/lib/trader-intelligence-v3/ingestion/index.ts`
- `src/lib/trader-intelligence-v3/ingestion/parser-hardening.ts`
- `src/lib/trader-intelligence-v3/recovery/index.ts`
- `src/lib/trader-intelligence-v3/recovery/sqlite-backup-restore-adapter.ts`
- `src/lib/trader-intelligence-v3/testing/architecture-boundary-guard.ts`
- the four test files under `src/lib/trader-intelligence-v3/__tests__/ga0-a3`

Auditors should use
`git diff --name-only e6d0183cd03f55fb4b2b396f4f35ac2b2d035a8a...HEAD`
as the exact machine-readable file list.

## 4. Consolidated local verification at executable head

| Command | Result |
|---|---|
| `git diff --check` | Exit 0 |
| `npx tsc --noEmit --pretty false` | Exit 0; 21.4 seconds |
| changed-path `npx eslint ...` | Exit 0; no warnings; 22.7 seconds |
| GA0-A3 plus existing broker-parser focused Vitest | Exit 0; 5 files, 55 tests; 13.73-second Vitest duration |
| `npm run verify:ti-v3:architecture` | Exit 0; 396 files, 42 API routes, 82 classified routes |
| `npm run verify:ti-v3:private-data` | Exit 0; 23,668 records, 23,626 final-tree records, 42 PR-history blobs |

Focused development checkpoints also passed the temporal/lifecycle pack (5
tests), the complete GA0-A3 pack (22 tests), and all adjacent broker-parser
tests. An earlier parser checkpoint exposed three legitimate sectioned-IBKR
compatibility regressions; the hardening scope was corrected and the final 55
test verifier passed. An initial combined TypeScript/test command was
interrupted by the execution wrapper after 124 seconds without output and is not
reported as passed. A later TypeScript run first exposed a stale local
`node_modules` missing accepted A2 dependency `fast-check` plus new branded-test
constant diagnostics; local dependencies and fixtures were corrected, and the
consolidated TypeScript command above passed. No production/private data was
used.

## 5. Commands deliberately not run

- `npm test`
- `npm run build` or `npm run build:webpack`
- Playwright or any browser test
- `npm ci`
- `npm run verify:layer2`
- `npm run verify:layer3`
- any Vercel, deployment, migration, broker, market-data, or model command

`npm install --no-save --package-lock=false fast-check@4.9.0` repaired the clean
worktree's stale dependency junction without modifying `package.json` or
`package-lock.json`. Broader tests, Layer 2, Layer 3, and build are left to
GitHub CI as instructed.

## 6. Known limitations and deferred work

- GA0-A3 contracts have no route, UI, current owner database, analytics, or AI
  consumer.
- No production schema or data migration exists.
- No database or backup-file encryption is implemented.
- Trading-session resolution is an injected calendar contract; a qualified
  calendar adapter is deferred.
- Setup filters are contract-only; setup classification is deferred.
- Eligibility establishes capability authority but does not implement the
  capability.
- Legacy numeric parsing and display remain non-authoritative and unrewired.
- No background backup, refresh, scheduling, job, hosted, public-user,
  entitlement, Whop, Discord, or production-security work is included.
- GA0-B deterministic analytics, visible evidence, charts, AI explanation, and
  owner-facing functionality remain deferred until independent acceptance.

## 7. Independent audit instructions

Read this document first, then:

1. verify branch/base/head and confirm PR #104 is untouched;
2. inspect the two GA0-A3 ADRs and section 7 of the active implementation plan;
3. audit canonical identity for persistence/order/time/display/locale leakage;
4. adversarially replay correction permutations, cycles, cutoffs, deletion, and
   ambiguous targets;
5. prove review state cannot change inventory and open positions cannot acquire
   closed-trade or live-guidance authority;
6. mutate each manifest fact/coverage dimension and verify capability-scoped
   effects;
7. attempt mixed manifest, cutoff, policy, eligibility, filter, snapshot, and
   evidence payloads;
8. inspect runtime extra-field/version/size/cycle rejection and private-error
   behavior;
9. repeat the WAL backup/isolated restore drill and verify digest comparison;
10. run the parser abuse corpus and existing broker parser regression pack;
11. run GitHub CI and distinguish new results from inherited A2 evidence;
12. report findings without marking GA0-A3 accepted or merging the PR.
