# Live Market Scanner Audit, Replay and Calibration Plan

## Purpose

The live Top Gainers and Momentum screeners need durable evidence showing what
the scanner saw, what it calculated, why each stock qualified or failed, where
it ranked, and what happened afterward. The audit system must support factual
review and algorithm improvement without slowing the five-second live scan or
turning a missing observation into a market fact.

This system is an internal owner/admin tool. It evaluates scanner behavior; it
does not claim that a highlighted stock was a profitable trade or that a future
move was predictable.

## Questions the system must answer

1. What exact provider facts were available for every ticker at a given time?
2. Which required gate rejected a ticker, and which score components helped or
   hurt it?
3. When did a ticker first qualify, leave, re-enter, or materially change rank?
4. Did Momentum find meaningful activity before the ticker became an obvious
   top gainer?
5. Which runners were missed, and which rule or missing fact caused the miss?
6. Which highlighted stocks immediately faded, stalled, or continued?
7. How did a proposed rule perform on the same recorded session compared with
   the live production rule?
8. Were apparent algorithm problems actually caused by delayed, stale, partial,
   or unavailable provider data?
9. Did changes improve early discovery without flooding the list with illiquid
   one-print moves?

## Core boundaries

- The production scanner remains the source of the member-facing list.
- Audit writes are asynchronous and bounded. Audit failure must never delay a
  Moomoo request, scanner calculation, or user response.
- Every calculation is tied to an immutable algorithm version, settings version,
  universe version, and market session.
- Provider timestamps and local receipt timestamps are both retained.
- Missing, stale, partial, unverified, and rejected values stay distinguishable.
- Replays consume recorded evidence and make no external market-data calls.
- A replay cannot rewrite the historical production decision. It produces a
  separate result under a named candidate algorithm version.
- No market-data token, webhook, account identifier, or production secret is
  written to audit evidence.

## Capture model

### 1. Trading-day session

Create one audit session for each U.S. trading date. Record:

- trading date and open/closed calendar decision;
- premarket, regular-hours and after-hours boundaries;
- process/runtime instance ID and start/restart times;
- scanner enabled state;
- exact and retained universe dates, universe count and content hash;
- algorithm and settings version IDs;
- expected five-second cadence;
- session completion state and final data-coverage summary.

A process restart continues the trading-day session with a new runtime instance;
it must not silently begin an unrelated audit history.

### 2. Scan cycle

Record one cycle for every scheduled scanner evaluation, including cycles that
cannot produce a list. Each cycle records:

- scheduled, started and completed timestamps;
- Eastern trading session;
- duration and cadence delay;
- requested, returned, missing and rejected symbol counts;
- Moomoo batch count and shared-budget reservation result;
- float/news enrichment coverage and source freshness;
- feed status and machine-readable issue codes;
- algorithm/settings/universe identities;
- audit write status.

This distinguishes “no stocks qualified” from “the scan was incomplete.”

### 3. Provider batch receipt

For every bounded provider request, record:

- cycle and batch sequence;
- requested symbol count and a hash of the ordered symbol list;
- request start, response arrival and provider-data timestamps;
- HTTP/provider status without credentials or response headers containing
  secrets;
- returned, duplicate, unexpected, stale and malformed symbol counts;
- latency, retry count and normalized error code;
- sanitized payload hash.

Raw provider payload samples are retained only for contract verification and
anomalies. Normal five-second replay uses normalized observations so secrets and
irrelevant provider fields do not enter the archive.

### 4. Ticker observation

For every returned universe member, preserve the inputs required to reproduce
the scanner decision:

- symbol, exchange and security identity;
- provider update time and local receipt time;
- current/session price, previous regular-session close, bid and ask;
- cumulative volume and session volume fields supplied by the provider;
- day/session high and low used by the application;
- market cap plus universe source/date;
- float, float source, float retrieval time and availability state;
- news/SEC presence used by the list, with stable internal article identifiers;
- every source qualification or missing-data issue;
- a schema version and normalized-observation hash.

The first version must benchmark actual normalized record size before enabling
full-universe retention. Fields should use compact typed keys inside compressed
segments while the documented reader returns descriptive names.

### 5. Derived metrics and decision trace

For each ticker and cycle, record both the final value and the inputs/status for:

- Gain%, spread%, Below HOD, dollar volume, RVOL and float turnover;
- rolling 1-minute and 5-minute price change;
- rolling 1-minute and 5-minute volume;
- 1-minute and 5-minute volume-spike ratios;
- any liquidity, freshness, price, market-cap, float and volume gates;
- Momentum score total and every weighted component;
- Top Gainers and Momentum eligibility;
- rejection reasons, including the first blocking gate and all failed gates;
- rank before display limits, displayed rank, and whether the row was returned;
- focus/secondary-selection state if that feature returns later;
- exact rounded member-facing values separately from lossless calculation values.

Decision reasons must be stable codes with human-readable definitions. A single
opaque `qualified: false` field is insufficient.

### 6. Candidate lifecycle events

Create compact durable events when a ticker:

- first becomes observable;
- first passes discovery gates;
- first qualifies for Momentum or Top Gainers;
- enters or leaves the displayed top N;
- changes rank by a configurable material amount;
- reaches a new best score or new session high;
- loses qualification and records the exact reason;
- re-enters after losing qualification;
- encounters a data-quality gap;
- reaches session end.

These events power the admin timeline without requiring the UI to read millions
of raw observations.

## Outcome measurement

Outcome calculations run from captured evidence after sufficient future time has
elapsed. They never alter the original detection.

For each first qualification and material re-entry, calculate:

- price after 1, 5, 15, 30 and 60 minutes;
- maximum favorable excursion and maximum adverse excursion at each horizon;
- highest and lowest subsequent price with timestamps;
- session-close and after-hours-close change where applicable;
- time to the next +2%, +5%, +10%, and configurable move;
- time to a configurable drawdown;
- time to HOD and distance from HOD at detection;
- highest later scanner rank and score;
- whether activity persisted for 1, 3, 5 and 15 minutes;
- data coverage and confidence for every outcome.

The system must also create a daily “missed activity” population. A stock can be
reviewed as a potential miss when its later movement, dollar volume and
liquidity satisfy an owner-configurable retrospective definition but it was not
shown early. The audit must report the failed gate rather than automatically
calling every later runner a scanner failure.

False-positive and false-negative labels remain configurable audit definitions.
They are never hard-coded as trading truth.

## Algorithm and settings versioning

Every production or experimental definition receives an immutable version with:

- version ID, label, creation time and source commit SHA;
- complete filter thresholds and session-specific overrides;
- metric formulas, window semantics and rounding policy;
- score components, weights and tie-break order;
- list length and ranking rules;
- required-data behavior;
- author/owner approval state and activation interval;
- canonical JSON plus SHA-256 digest.

Changing one threshold creates a new version. Historical records continue to
point to the version that actually made their decisions.

## Storage architecture

Use the Railway persistent volume and preserve the application's single-writer
boundary.

### SQLite control and summary data

Add versioned migrations for these logical records:

- `scanner_audit_trading_days`
- `scanner_audit_runtime_instances`
- `scanner_audit_algorithm_versions`
- `scanner_audit_settings_versions`
- `scanner_audit_cycles`
- `scanner_audit_batch_receipts`
- `scanner_audit_segments`
- `scanner_audit_candidate_events`
- `scanner_audit_detection_outcomes`
- `scanner_audit_daily_reports`
- `scanner_audit_replay_runs`
- `scanner_audit_replay_results`
- `scanner_audit_annotations`
- `scanner_audit_integrity_events`

SQLite stores indexes, summaries, compact lifecycle events and manifests. It
does not store every full-universe five-second row indefinitely.

### Immutable compressed evidence segments

Store high-volume observations in time-partitioned compressed segment files:

`/data/scanner-audit/YYYY-MM-DD/session/hour/segment-id.jsonl.gz`

Each segment contains a header followed by typed cycle, observation and decision
records. It records schema/algorithm/settings/universe identities, first/last
timestamps, record counts and a SHA-256 checksum. Write to a private temporary
file, flush and fsync, atomically rename, then commit its manifest. On startup,
recover or quarantine unfinished segments without treating them as complete.

The initial implementation should use Node's supported gzip tooling and a
streaming reader. A later format change requires a new schema version and a
verified reader for old files.

### Retention tiers

Start with these configurable defaults, subject to a real capacity benchmark:

- complete five-second full-universe evidence: 20 trading days;
- one-minute lossless-enough replay rollups: 180 calendar days;
- candidate events, decision traces and outcomes: 2 years;
- daily summaries, algorithm versions, integrity manifests and owner notes:
  retained indefinitely;
- sanitized anomaly payload samples: 30 days.

Before deleting an expired raw segment, verify its checksum, complete its
one-minute rollup, retain its manifest and daily report, and write a deletion
receipt. Retention must stop safely and alert on low disk space; it must never
silently remove the newest evidence to make room.

## Capacity and performance controls

At roughly 1,250 symbols and a five-second cadence across extended hours, the
system can observe about 14.4 million ticker snapshots per full trading day.
Implementation therefore requires a measured production-like benchmark before
activation.

Acceptance limits must cover:

- average and worst segment bytes per observation;
- projected 20-day and 180-day disk use;
- audit queue depth and dropped-record count;
- serialization CPU time and event-loop delay;
- SQLite write duration and WAL growth;
- replay throughput for one full session;
- free-space warning and critical thresholds.

The scanner publishes its live result before audit persistence. A bounded
in-process queue hands immutable records to one audit writer. If the queue fills,
the writer records an explicit coverage gap and health alert; it does not block
the next market-data pass or silently claim complete coverage.

## Admin audit experience

Add an owner-only **Scanner Audit** section within Screeners Admin.

### Audit health

Show today's scanner state, last completed cycle, cadence, provider coverage,
audit queue, segment writer, disk use, universe age, float coverage, algorithm
version and any gaps. Use clear states: Complete, Partial, Degraded and Missing.

### Daily review

Show by session:

- scan/cycle completion rate;
- universe and provider coverage;
- number qualifying and displayed by scanner;
- first-time candidates and re-entries;
- median lead time before later activity;
- outcome distributions at each horizon;
- strongest continuations, fastest fades and possible misses;
- reasons stocks most often failed;
- data-quality incidents separated from algorithm results.

### Ticker timeline

For one ticker, graph price, volume, rolling metrics, score and rank over time.
Overlay qualification/rejection transitions, news/SEC availability, session
highs and missing-data gaps. Selecting an event exposes the full decision trace
and the member-facing row that existed at that moment.

### Rejection explorer

Filter by session, price, market cap, float, later move and rejection reason.
This should answer questions such as “show stocks that moved 10% later but were
rejected because 5-minute price change had not reached 5%.”

### Ranking and outcome review

Compare displayed ranks with later outcomes without implying a profitable
trade. Allow Top Gainers and Momentum to be assessed separately because their
purposes and ranking rules differ.

### Notes and labels

Allow the owner to add immutable timestamped review notes and labels such as
useful detection, too late, illiquid print, missed runner, provider gap, or
needs investigation. Corrections append a new note; they do not overwrite the
original evidence.

## Replay and safe improvement workflow

1. Select one or more recorded trading sessions.
2. Choose the historical production algorithm as the control.
3. Create an immutable candidate version with changed thresholds, formulas or
   weights.
4. Replay both versions from identical normalized observations.
5. Produce a side-by-side report covering candidate count, first-detection time,
   list churn, later outcomes, missed activity, liquidity and data coverage.
6. Inspect named ticker timelines and rejection reasons.
7. Run the candidate in live **shadow mode**. It calculates and audits results
   but never changes the user list.
8. Require owner approval before activating the candidate as production.
9. Preserve the prior version and support a settings-only rollback.

The comparison report must flag formula changes that require facts absent from
old recordings; those sessions are ineligible rather than partially invented.

## Reports and alerts

- Generate a final report after after-hours outcome processing completes.
- Generate weekly aggregate comparisons only from sessions meeting a configured
  minimum coverage threshold.
- Send the existing private owner-review Discord channel an alert for audit
  writer failure, sustained queue overflow, corrupted segment, critical disk
  space, missing daily finalization, or recovery.
- Avoid routine Discord noise. Successful daily reports live in Screeners Admin
  unless the owner later enables a concise completion notice.
- Deduplicate alerts durably across process restarts.

## Integrity, security and recovery

- Owner/admin authorization is enforced server-side for every audit route.
- API responses are bounded and paginated; raw evidence files are never served
  directly by path.
- Validate symbols, dates, version IDs and requested time windows.
- Use checksums and manifests to detect truncation or mutation.
- Record clock skew, process restarts and incomplete finalization.
- Include audit data in the persistent-volume backup/restore procedure and test
  restoration into an isolated database and directory.
- Export a portable daily evidence manifest and summary without secrets.
- Never allow audit deletion from the ordinary UI. Retention and an explicit
  owner-controlled maintenance workflow own deletion.

## Implementation slices

### Slice 0 — Contracts and measured sizing

- Freeze observation, decision-reason, algorithm-version and outcome contracts.
- Capture a production-like sanitized session sample.
- Benchmark compression, queue behavior, disk projection and replay speed.
- Set disk warning/critical limits from measured evidence.

Acceptance: schemas are versioned, secrets are absent, projected retention fits
the volume, and audit work stays outside the five-second critical path.

### Slice 1 — Durable capture and health

- Add migrations, segment writer, manifests and restart recovery.
- Record sessions, cycles, batches, normalized observations and gaps.
- Add owner-only Audit Health UI and failure/recovery alerts.

Acceptance: a complete isolated session survives restart and checksum/recovery
verification; forced audit failure does not delay the live scanner.

### Slice 2 — Explainable decisions and timelines

- Record all gates, component scores, ranks and lifecycle events.
- Add daily review, ticker timeline and rejection explorer.
- Verify displayed historical rows reproduce the original live values.

Acceptance: selected decisions can be independently recalculated from stored
inputs and the referenced version.

### Slice 3 — Outcomes and missed-activity review

- Add horizon outcomes, excursions, persistence and coverage confidence.
- Add configurable retrospective definitions and daily finalization.
- Separate algorithm misses from data-quality gaps.

Acceptance: deterministic fixtures and recorded sessions independently reconcile
all reported outcomes.

### Slice 4 — Replay and comparison

- Build streaming replay from immutable segments.
- Add control/candidate comparison and downloadable internal report.
- Add strict fact-availability compatibility checks.

Acceptance: replaying the production version reproduces historical decisions
and ranks within the documented deterministic contract.

### Slice 5 — Shadow mode and calibration workflow

- Run approved experimental versions beside production with no member effect.
- Compare live shadow and production results.
- Add owner approval/activation/rollback records.

Acceptance: candidate activation cannot occur accidentally, the prior version
remains reproducible, and rollback changes no historical evidence.

### Slice 6 — Retention, backup and operational acceptance

- Add one-minute rollups, verified pruning receipts and capacity alerts.
- Complete isolated backup/restore rehearsal.
- Run several full live sessions before treating calibration reports as useful.

Acceptance: retention never removes unrolled or unverifiable evidence, restored
sessions replay identically, and owner review confirms the admin workflow.

## Verification plan

- Unit tests for every formula, gate, reason code, outcome horizon and version
  digest.
- Property tests for rolling windows, restarts, duplicate timestamps, missing
  intervals, counter resets and session boundaries.
- Integration tests for segment atomicity, corruption detection, recovery,
  retention and database/file reconciliation.
- Load test at more than the expected 1,250-symbol five-second volume.
- Replay determinism test across repeated runs and process restarts.
- Browser tests for owner authorization, mobile/desktop audit views, pagination
  and empty/partial states.
- Live acceptance across premarket, regular hours and after-hours with named
  samples from the actual screener.
- Help Center review before exposing any audit explanation outside owner admin.

## Recommended build order

Build Slices 0–2 before changing the early-Momentum algorithm. That preserves a
reliable baseline and shows exactly why the existing rules work or fail. Add
outcomes and replay next, then trial the researched momentum changes in shadow
mode. Production ranking changes should follow evidence and owner approval.
