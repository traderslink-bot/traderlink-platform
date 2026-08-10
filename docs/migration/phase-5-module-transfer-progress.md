# Phase 5 Module Transfer Progress

**Status:** Locally complete. Slices A-E, F1-F6 and multi-account integration passed the Phase 6 acceptance gate. Production transfer/deployment remain external, and port 3010 is stopped.
**Controlling plan:** [Phase 5 Module Transfer Plan](phase-5-module-transfer-plan.md)
**Active Slice E plan:** [Analytics Lab, Candle Review and Level Analysis](phase-5-slice-e-analytics-lab-candles-level-analysis-plan.md)
**Active Slice F plan:** [Remaining Modules](phase-5-slice-f-remaining-modules-plan.md)
**Prior handoff:** [Phase 4 Core Analytics Handoff](phase-4-core-analytics-handoff.md)
**Repository:** `C:\Users\jerac\Documents\TraderLink\traderlink-platform`
**Branch:** `codex/traderlink-platform-replacement`
**Entry HEAD:** `f8cfa6481682439f926777afface51f8ea87ed7f`

## Owner-authorized MFE & MAE Analyzer follow-on

The dedicated long-term [MFE & MAE Trade Analyzer Page](mfe-mae-trade-analyzer-page-progress.md)
is complete and owner visually approved on 2026-08-10. It uses the already
versioned, account-scoped Daily Trade Analyzer candle facts and adds no tracker
UI, provider request, Journal write or migration.

## Entry state

- Phase 4 implementation commit:
  `4575dafd0fb62804ac090c4a149152506d8db7b1`.
- Phase 4 closure commit:
  `f8cfa6481682439f926777afface51f8ea87ed7f`.
- Entry working tree: clean.
- Push/upstream/deployment: none created for the replacement branch.
- Port 3010: not listening; keep off until the next visual-review checkpoint.
- Active database:
  `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\development.sqlite`.
- Database main size: 10,522,624 bytes.
- Database main SHA-256:
  `31101395DAFB7BB14C2BF934E3288B40F63A5F8736A1DA03CF549C996463AF3B`.
- WAL/SHM: zero bytes / 32,768 bytes.
- Accepted facts: 331 ready closed, zero automatically legitimate open, two
  contained decisions and 331 fee-complete realized rows.

## Owner evidence

On 2026-08-02 the owner approved the dashboard design as exactly the wanted
design and reported:

- Calendar, Trade Tracker and Rules failed under replacement access;
- Trades by Ticker and Open Positions showed no replacement data;
- Data Decisions reported Import Repair unavailable;
- Manual Entry remained disabled; and
- Analytics Lab showed its intentional replacement-pending state.

The owner allowed the private statement for local testing and authorized
stopping local processes when needed. Port 3010 was stopped after review.

The owner further confirmed that one TraderLink login must support multiple
user-defined Journal accounts. These are not tied one-to-one to broker accounts:
the trader decides whether an account represents long-term holds, forex,
small-cap day trading or another grouping, and may import statements from
multiple brokers or brokerage accounts into it. The dashboard therefore needs
account creation, selection and switching. The current development seed's one
Journal account is test state only; imports, learned statement mappings,
executions, Data Decisions, annotations and analytics must remain scoped to the
selected account.

## Planning audit result

Source inspection confirmed:

- active Calendar still imports V3 auth/configured analytics/deployment;
- active Trade Tracker still imports V3 auth, Analytics Lab rows/exact helpers,
  legacy rules, tags and Day Session repositories;
- Rules still imports V3 auth/types and calls the legacy rules endpoint;
- Data Decisions still calls the V3 import-repair contract and uses mutable V3
  statement/delete language;
- `/imports` and its history/commit/decision handlers also still depend on V3
  or the legacy trader-analytics SQLite repository;
- Ticker/Open are presentation foundations without replacement read models;
- the accepted Journal backend already has canonical manual execution commit,
  full-account rebuild coordination and typed Data Decision resolution; and
- the six-migration Phase 5 entry schema did not contain rules, tags, notes or
  review tables beyond the `journal_trading_days` identity table; migration
  `0007_journal_annotations` now owns those records.

The legacy data inventory records test-only tag definitions, assignments and
old trade annotations. The owner confirmed on 2026-08-02 that none of those
records, nor any legacy rule records, need to be recovered. Their verified
backups remain preserved, but they are explicitly excluded from replacement
database migration.

## Accepted decisions

1. Imports move with Data Decisions; they are not deferred behind the visible
   route repairs.
2. The current Data Decisions UI is adapted to typed append-only Journal
   actions. It is not blindly repointed to the new database.
3. Physical statement deletion remains disabled until an append-only import
   withdrawal/supersession contract exists.
4. Trade Tracker is the canonical manual execution experience; `/manual-entry`
   will not create a competing store or form.
5. Multi-date manual batches are supported by backend facts and grouped by
   actual trading date, while the visible multi-day presentation remains a
   later owner-reviewed Trade Tracker decision.
6. Rules/tags/notes/reviews require a new module-owned migration and exact new
   persistence/isolation proof after the verified backup gate; legacy
   annotation test data is not copied.
7. Calendar/Trade Tracker financial calculations move to exact server services;
   existing browser `number` logic is not financial authority.
8. Named market sessions remain unavailable without instrument/exchange session
   facts.
9. Port 3010 stays off during implementation and focused tests.
10. Focused Vitest uses one worker; broad suites remain the Phase 6/final gate.
11. Trading-day grouping is a review presentation, not a trade boundary.
    Multi-day positions retain one canonical lifecycle and one set of
    executions; an optional future swing view will reuse those facts rather
    than creating a separate tracker or ledger.
12. Every displayed trading-data decimal uses at most two places. Editable
    source/manual values and canonical database facts remain lossless.
13. Trade Tracker is a current-day/current-week workflow. Older dated routes are
    factual read-only history and do not prompt retrospective subjective notes.
14. `/trades/open` remains Open Positions. Every factually confirmed open
    lifecycle appears there whether it is an intentional swing, an unplanned
    hold or not yet classified. Unresolved factual chains remain separate in
    Data Decisions, and only the trader assigns intent or status.
15. Imports are broker-neutral. IBKR is only the first verified adapter. The
    prior generic mapping UX is a design/reference source; its V3 writer and
    legacy persistence are rejected.
16. Unknown statement formats must be preservable with a trader-supplied broker
    name and downloadable privacy-safe structural profile while creating zero
    executions. The support package stays on the user's computer and excludes
    raw values/rows, filename and paths. Reusable mappings and later replay
    remain account-scoped Journal facts.
17. The replacement Account page and loopback-only local access are part of
    the current goal. Discord remains the first public login provider, but
    local review does not require a Discord login and email remains optional.

## Slice tracker

| Slice | Scope | State | Next gate |
| --- | --- | --- | --- |
| A | Calendar, Ticker, Open Positions and Trade Tracker read models | Technically complete; later broad visual review accepted by owner | Preserve replacement read boundary |
| B | Broker-neutral historical imports, mapping support and Data Decisions | Technically complete | Preserve exact import/decision and unsupported-format boundaries |
| C | Canonical Trade Tracker manual execution entry | Technically complete | Preserve idempotent account-scoped execution writes |
| C2 | Account page, loopback local access and future Discord boundary | Technically complete locally | Public Discord activation remains pre-go-live |
| D | Rules, tags, notes and reviews | Complete | Empty real initialization plus focused persistence, isolation and stable-round-trip rebuild proof passed |
| E | Analytics Lab, Candle Review and Level Analysis | Technically complete | Preserve accepted analytics, market-fact and Journal-link contracts |
| F | Remaining Platform/Academy/Watchlist/News/Coach/Account/site inventory | Locally accepted | F1-F6 technical implementation and Phase 6 local verification complete; production transfer/deployment remain external |

## Slice A implementation evidence

The first Phase 5 read-only route slice now:

- publishes exact server-owned Calendar, Ticker History, Open Positions and
  trading-day read models from the accepted Journal fact set;
- preserves currency partitions and exact decimal strings rather than making
  browser `number` calculations authoritative;
- keeps 331 valid closed trades visible while containing two unresolved chains;
- separates zero legitimate open positions from the two chains needing a
  trader decision;
- exposes unresolved execution activity on its affected trading date rather
  than allowing that activity to disappear;
- exposes each execution on its actual account trading date and factual
  carried-in/carried-out position snapshots for trades spanning dates;
- links Ticker History and day-specific ticker results through the same stable
  instrument-filtered Round Trips contract;
- moves the active Calendar and Trade Tracker pages from inherited V3 access to
  the development Platform scope and replacement Journal runtime;
- originally kept manual execution saving disabled until Slice C connected the
  canonical Journal command; and
- keeps tags, rules and notes visibly read-only until Slice D migrates their
  saved records and mutation contracts.

Technical verification passed:

- changed-file lint and `git diff --check`;
- dependency-scoped TypeScript for the replacement service and five active
  route entry points;
- one focused test file with five tests using one Vitest worker;
- the Phase 4 static verifier and the new Phase 5 active-read dependency
  verifier, proving eight active read files are V3-free; and
- the existing independent Journal analytics verifier plus a new privacy-safe
  replacement read-model verifier against the private database.

The real read-model verifier reconciled 331 ready closed rows, 112 ticker
groups, 18 calendar days, zero legitimate open positions, two decisions, 50
execution records, one unresolved activity item and one carried-position
snapshot on the latest affected date. It left the database
unchanged at 10,522,624 bytes and SHA-256
`31101395dafb7bb14c2bf934e3288b40f63a5f8736a1da03cf549c996463af3b`.
No non-empty WAL, database mutation, push or deployment occurred during the
technical gate.

Windows again returned `uv_os_get_passwd ... ENOMEM` before two `tsx` static
commands could load project code. A command-local user-info fallback was used
for those verifier processes. It did not change Windows settings or
application/database behavior.

The integrated browser checkpoint then started the replacement repository on
`127.0.0.1:3010` after deleting only the generated `.next` caches from the
replacement and legacy checkouts. That recovered about 67 GB of disk space; no
source, private data or dependency was deleted. Browser verification currently
proves:

- Calendar Month and Monday-Friday Week both return 200 with the 331 valid
  trades visible, two contained decision chains, no framework overlay and no
  console errors;
- Ticker History returns 112 groups and its stable-instrument link opens the
  correctly filtered Round Trips history;
- Open Positions distinguishes zero legitimate open positions from two chains
  needing a trader decision;
- Trade Tracker shows exact trading-day executions, one carried-position
  snapshot and unresolved execution activity on the affected date; and
- an initial MUI disabled-input hydration warning on Trade Tracker was removed
  by rendering unavailable rules, tags and notes as factual static read-only
  states. The repeated browser check is clean.

The owner then accepted the recovered routes and corrected the product intent:

- all displayed execution/trading decimals must use at most two places;
- the complete manual-entry form belongs at the top of Trade Tracker;
- Trade Tracker is for the current trading day/current week, when tags, rules,
  and notes can be recalled reliably, rather than prompting subjective notes on
  old trade history;
- manual entry must let the trader intentionally identify swing activity; and
- `/trades/open` remains the factual Open Positions surface, with later
  trader-authored classification for intentional swings, unplanned holds or
  other statuses.

The revision placed the complete existing execution form at the top as a
safe initial visual form with an explicit actual trading date
and `Not set`/`Day trade`/`Swing trade` selection. The undated Trade Tracker
requests the current account trading date instead of falling back to January's
latest test-data date. Open Positions keeps every confirmed open lifecycle
visible and separates it from factual chains needing Data Decisions; future
trader-authored metadata will distinguish swing intent, unplanned holds and
other statuses. Active trading-value formatters and preserved candle-review displays
are being limited to at most two decimal places without rounding editable or
stored facts.

The owner later waived a separate manual-form visual stop and asked that broad
visual review wait until the application is more technically complete. Port
3010 remains closed until that integrated review.
The exact replacement launcher process tree was stopped and loopback no longer
responds.

## Slice B/C/account technical checkpoint

- A fresh online pre-write backup and byte-identical restored verification were
  completed before this write slice. The source baseline remains 10,522,624
  bytes with entry SHA-256
  `31101395dafb7bb14c2bf934e3288b40f63a5f8736a1da03cf549c996463af3b`.
  The backup is
  `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\backups\phase-5-slice-b-20260802T064540Z\development-pre-slice-b.sqlite`
  and the restored verification target is
  `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\restore-verification\phase-5-slice-b-20260802T064540Z\development-restored.sqlite`.
  Their SHA-256 is
  `3d421872aeb5e531073011f00926de9dce4a5761c01b7a6c026ac8e9b524c17f`;
  registry, table counts, page geometry and recovery authority matched.
- `/imports` now has replacement Journal preview, explicit account confirmation,
  commit, history and section-aware IBKR mapping review source. It also has a
  broker-neutral manual column mapper for comma/semicolon/tab statements,
  exact decimal parsing, timezone/side/fee interpretation and contained row
  corrections. `/data-decisions` has a bounded replacement read model and
  typed resolution route.
- Successful trader-confirmed mappings are stored in accepted immutable import
  batches and become reusable only for the same workspace/account and exact
  ordered structural signature. A renamed/reordered/ambiguous structure
  returns to review. A mapping learned in a second Journal account is not
  visible. The active-account check also prevents a known IBKR statement from
  silently selecting another allowed account.
- A newly recognized IBKR source identity may be linked to the currently
  selected Journal account only through the import review checkbox that names
  that privacy-safe account. Preview is read-only; commit repeats the file,
  selected-account and confirmation checks and refuses a conflicting existing
  broker link.
  Multiple source identities may link to that same Journal account; the link
  does not define what the Journal account represents.
- Failed and successful format review both provide a downloadable
  broker-labeled mapping support package with section/header signatures,
  suggested fields and value-shape categories but no raw statement values,
  rows, filename or path. This lets the owner retain a local format artifact
  for later dedicated-adapter work without uploading the private statement.
- Trade Tracker now posts retry-safe, bounded manual batches to the canonical
  Journal command, preserves actual date/time, exact decimal inputs, fee facts
  and trader-authored `not_set`/`day_trade`/`swing` intent, and returns any
  resulting Data Decisions. `/manual-entry` redirects to Trade Tracker.
- Data Decisions maps every action offered by the Journal decision read model
  to one target-specific typed resolution: execution correction, same-time
  ordering, append-only exclusion/restoration, supported duplicate merge,
  keep-distinct, missing execution, opening inventory, supplied or corrected
  position facts, legitimate-open confirmation, coverage and source limitation.
  Execution and position targets are revalidated server-side with expected
  revisions/current versions. The correction UI shows current versus corrected
  facts and never exposes a generic mutation action.
- `/account` now uses the approved dashboard shell and reads privacy-safe
  Platform user/workspace/Journal-account facts. The replacement launcher has
  a loopback-only external local-configuration loader so local review does not
  require Discord and secrets are not copied into the repository.
- One Platform owner/workspace can now create up to 25 active Journal accounts
  and switch them from the shared dashboard header. Browser state contains only
  a deterministic opaque selection reference in a local-review HttpOnly,
  `SameSite=Strict` cookie. Every server request resolves that reference against
  the full server-derived active-account allowlist; it never grants access.
  Import commits, manual execution batches and Data Decision mutations carry
  the selection under which the trader reviewed them, so a stale tab returns a
  conflict instead of writing into the newly selected account. The original
  one-account preparation/import commands remain deliberately strict.
- A disposable proof copied the current database, performed the private exact
  statement reimport, committed exact-decimal manual swing executions,
  resolved partial manual-day coverage, committed a generic mapped statement,
  reused its exact template, proved IBKR and generic broker sources coexist in
  one user-defined Journal account, proved second-account isolation, rejected a stale
  account-A mutation and explicitly linked/committed a synthetic new broker
  identity into account B. `quick_check` passed, every temporary root was
  removed and the real database hash/size remained unchanged. The proof exposed
  and corrected a Windows-safe staging
  bug: the temporary upload must be closed before path-based read-back hashing.
- Targeted lint and dependency-scoped TypeScript pass. Four focused import
  files pass 34 tests with one worker, covering mapping support, generic
  parsing, import/service isolation and upload staging. Earlier focused Account,
  manual-entry and local-configuration checks remain accepted. Five focused
  account selection/scope/profile files pass 16 tests with one worker. The Data
  Decisions product adapter passes 2 focused mapping/target-rejection tests,
  and the underlying append-only command/decision engine passes all 30 focused
  action, conflict, rollback, containment and rebuild tests with one worker. The
  static Phase 5 verifier and the multi-account-aware real-database read-model
  verifier pass; the latter reconciled the current one active account without
  changing its 10,522,624-byte file or accepted SHA-256. Port 3010 remains off.
- The multi-account audit is resolved without a schema migration. Current
  read-model verification enumerates every active account, while historical
  accepted-IBKR verification deliberately locates the Journal account that owns
  that source identity instead of depending on account sort order.

## Slice D backup and design checkpoint

The exact [Journal Annotation Schema](phase-5-slice-d-annotation-schema.md) is
accepted. It keeps annotation ownership on the trader-selected Journal account;
broker and statement source identities remain provenance and never create or
choose an annotation account.

Before migration implementation, fresh SQLite online backups and independent
restore rehearsals completed at `2026-08-02T09:25:49.852Z`:

- Replacement database backup:
  `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\backups\phase-5-slice-d-20260802T092546Z\development-pre-slice-d.sqlite`.
- Replacement restored verification:
  `C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\restore-verification\phase-5-slice-d-20260802T092546Z\development-restored.sqlite`.
- The source remained 10,522,624 bytes with SHA-256
  `31101395dafb7bb14c2bf934e3288b40f63a5f8736a1da03cf549c996463af3b`.
  Backup and restored main files are byte-identical with SHA-256
  `3d421872aeb5e531073011f00926de9dce4a5761c01b7a6c026ac8e9b524c17f`.
  Six migration rows, 25 table counts, schema/page geometry, foreign keys,
  `quick_check` and recovery authority all passed.

Legacy online backups and restored copies are under
`C:\Users\jerac\Documents\TraderLink\private-data\legacy-app\backups\phase-5-slice-d-20260802T092546Z`
and
`C:\Users\jerac\Documents\TraderLink\private-data\legacy-app\restore-verification\phase-5-slice-d-20260802T092546Z`.
The repository-local source refreshed to exactly 21 test tag definitions, four
test assignments and one seed row. The legacy rules source refreshed to zero
saved template/custom rule records. The older LocalAppData tag copy has the
same 21 definitions but zero assignments. Every backup/restored pair is
byte-identical, every table count matches its source and every `quick_check` is
`ok`. The owner has now classified all of this annotation content as disposable
test data. It remains only in the preserved backups and will not enter the
replacement database.

## Immediate next action

Continue Slice F3 with the Watchlist storage, access, current/archive,
ingestion, stream, recap, symbol and reset boundaries. Preserve any production
records, remove Journal-named storage fallback, use Platform authentication
contracts without changing Premium policy, and keep port 3010 off until a
combined visual checkpoint.

The required pre-write backup and disposable migration proof are now complete.
The source database remained unchanged at 10,825,728 bytes and SHA-256
`856c5779e075eaaa9a8bafd2f3dab5e34126692e49f5cfb62d737d51a4b75b96`.
Migration 0008 has accepted checksum
`b152896c81ffc7e8702399ed91768cebf32bf705f7b66b3c6b7e520607694d46` and
post-schema digest
`040f2448fafb6d2d3122787b4b522f109bfa815cc79d7118741d4fc005b14a5c`.
The disposable eight-migration database, its backup and independent restore
all passed registry, count, schema, page-geometry, recovery-authority and
integrity verification. Migration 0008 was then applied alone to the real
replacement database and passed the same schema and integrity gates.

## Slice D implementation checkpoint

Migration `0007_journal_annotations` now creates 13 account-scoped tables for
immutable rule versions/lifecycle events/review versions, versioned tag
definitions/assignments, revisioned daily notes and revisioned round-trip
notes. Open-position/swing planning annotations remain deliberately deferred
instead of being attached to a closed-round-trip identity.

The implementation replaces the active Rules, trade-tag, daily-note,
round-trip-note and rule-review persistence paths with Journal services. Every
browser mutation includes the opaque expected Journal-account selection; the
server derives the user/workspace/account scope and rejects stale selection or
record revision. The current-day Trade Tracker is writable. Dated historical
days display saved annotations read-only so the trader is not encouraged to
invent old subjective notes.

The owner clarified that all legacy tags, assignments, rules and old annotated
trades were test data. No legacy annotation content was copied. A disposable
copy of the accepted pre-Slice-D backup applied only migration 0007, produced
seven migration rows and 13 empty annotation tables, and passed schema-digest,
foreign-key, `quick_check` and `integrity_check` verification. The same empty
migration then applied to the real replacement database. At the Slice D
checkpoint its main file was 10,825,728 bytes with SHA-256
`856c5779e075eaaa9a8bafd2f3dab5e34126692e49f5cfb62d737d51a4b75b96`,
zero-byte WAL and 32,768-byte SHM. The accepted pre-slice online backup remains
10,522,624 bytes with SHA-256
`3d421872aeb5e531073011f00926de9dce4a5761c01b7a6c026ac8e9b524c17f`.

Focused dependency-scoped TypeScript, targeted lint, the Phase 5 V3-free
dependency verifier, the static seven-migration verifier, and 26 one-worker
migration/annotation tests pass. The account
isolation proof includes two different broker source identities inside one
user-defined Journal account and proves those sources do not choose annotation
ownership. The focused rebuild proof updates a round trip to a second calculated
version and confirms its tag and both note fields remain attached only through
the unchanged stable round-trip identity. Read-only current-schema and Phase 5
read-model verification passed against the real database without changing its
size or SHA-256; all 13 annotation tables remain empty. No target dashboard
port, push, deployment or legacy database was changed.

## Slice E1 Analytics Lab query checkpoint

The active `/analytics/lab` page and server action now use only the accepted
Journal Analytics registry, query contract and server-derived selected Journal
account. All 210 registered capabilities remain discoverable: 181 currently
available or conditional capabilities execute from accepted Journal facts and
29 unavailable capabilities retain explicit missing-fact coverage rather than
returning zero or sample data. Only accepted groupings and filters are exposed,
exact values remain authoritative, visible trading numbers use at most two
decimal places and individual evidence is returned only for a single currency.

The privacy-safe real-database proof returned 331 ready-closed round trips, two
round trips needing a Data Decision, 24 evidence rows for the initial view and
an unchanged 10,825,728-byte database with SHA-256
`856c5779e075eaaa9a8bafd2f3dab5e34126692e49f5cfb62d737d51a4b75b96`.
The unavailable `unrealized_pnl` capability was explicitly proven to return
`null`, not zero. Dependency-scoped TypeScript, targeted lint, the active-file
V3/sample verifier and 22 focused one-worker tests pass. No saved-view write,
database migration, provider request, port, push or deployment occurred in E1.

## Slice E2 saved Analytics views checkpoint

Migration `0008_journal_analytics_saved_views` adds an account-scoped current
view table and immutable version table. The selected-account reference is
validated on every command but is not persisted. Stored query JSON contains
only the strict Analytics Lab allowlist, uses a fixed property order and has an
exact SHA-256. Create, update and retirement derive the user/workspace/account
and author on the server; update/retirement require an exact optimistic
revision. Retirement appends a final version and does not delete history.

The real database now contains eight migration rows with post-schema digest
`040f2448fafb6d2d3122787b4b522f109bfa815cc79d7118741d4fc005b14a5c`.
Its main file is 10,870,784 bytes with SHA-256
`d7e89da29034b25ee18b3bec277fc3a4f8bb3c42b89de84a179be74c9795a2ef`.
Both saved-view tables contain zero rows; no V3 JSON or legacy test view was
copied. All earlier domain counts remain unchanged. Foreign keys,
`quick_check`, `integrity_check`, the real Analytics Lab proof and the complete
Phase 5 read-model reconciliation pass without changing the post-migration
file. The current boundary remains 331 ready-closed round trips, zero
legitimate-open round trips and two contained Data Decisions.

Five focused migration/saved-view files pass 24 tests with one worker,
including two-account isolation, strict normalization/digest rejection, stale
revision rollback, immutable history, retirement, and both the service and
database 100-active-view limit. Dependency-scoped TypeScript, targeted lint,
the static eight-migration verifier and the active Phase 5 V3-free dependency
gate pass. Ports 3000, 3010 and 3011 remain off; no push or deployment occurred.

## Slice E3 Candle Review checkpoint

The active Candle Review page, client and API no longer import V3 analytics,
V3 authentication or the V3 JSON review store. A ready-closed target is derived
only from the server-resolved selected Journal account, stable round-trip ID,
exact current round-trip version and its execution allocations. The browser
can authorize a request only by sending that round-trip ID plus the opaque
expected account-selection reference; symbol, direction, times and weighted
prices are recomputed on the server. Page load never contacts a provider.

Migration `0009_level_analysis_candle_review` creates five empty account-scoped
tables for immutable completed provider attempts, normalized candle sets,
normalized exact candles, stable current review identities and immutable review
versions. It has checksum
`5e0fd37edd1b3310aa91fb2d5cae4c772675cc57481ff39c8a2d5cf3ecd77589`
and post-schema digest
`a1a9589a036194f1aa243198afe9577d7bf3447fae54a5a0b55417f2a07d6d10`.
Raw provider responses are never stored. The first provider adapter sends only
the derived symbol, interval and bounded UTC window, includes extended hours,
normalizes strict OHLCV facts and records honest coverage/invalid/unavailable
outcomes. Longer than seven-day one-minute windows and non-stock targets are
explicitly unsupported pending a reviewed interval contract.

The first disposable real-data proof exposed a repeating weighted-average
decimal that exceeded the Journal storage bound. It was stopped before any real
database change and is superseded. The corrected contract preserves every
source execution quantity/price losslessly while deriving review entry/exit
prices at four decimals, half-up, matching the accepted TraderLink price
read-model convention. A fresh disposable copy then proved exact equality of
all 39 pre-existing domain-table counts, 331 resolvable ready-closed stock
targets, five empty new tables, zero provider requests, schema/integrity checks
and exact post-migration backup/restore.

The fresh accepted pre-write backup is
`C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\backups\phase-5-slice-e3-20260802T120007Z\development-pre-candle-review.sqlite`;
its independent restore is beneath the matching
`restore-verification\phase-5-slice-e3-20260802T120007Z` directory. Backup and
restore are byte-identical at SHA-256
`f4c0324e1b182bc8518283a13ede1dc1eb4a0633fcb3b893b1e08c8f24595631`.
The corrected disposable verification directory is
`C:\Users\jerac\Documents\TraderLink\private-data\traderlink-platform\verification\phase-5-slice-e3-20260802T120500Z`;
its post-migration backup and restore are byte-identical at SHA-256
`35a93c40f28a727ab5605fd0e8fbe80dcf7d1ba97cd071edf46da0cd0ed2e3ef`.

Migration 0009 was then applied alone to the real database. It now has nine
migration rows, 44 domain tables, size 10,989,568 bytes and SHA-256
`6235ad2312cec303e1a49230f706b9ae1df5c8d1450dbcee6f512292af9ed76d`.
All five new tables remain empty and all pre-existing counts match the accepted
eight-migration restore. Foreign keys, `quick_check`, `integrity_check`, the
independent 331-row Journal Analytics reconciliation, complete Phase 5 read
models and the 210-capability Analytics Lab proof pass without changing the
post-migration file. No private-symbol provider request was made.

The production chart uses installed `lightweight-charts` 5.2.0 v5
`addSeries(CandlestickSeries, ...)` and `createSeriesMarkers` with React cleanup;
no public chart script is loaded. Visible trading numbers use at most two
decimals. Focused TypeScript, lint, the 62-file active V3-free guard and six
one-worker proof files/27 tests pass. Ports 3000, 3010 and 3011 remain off; no
commit, push, deployment or legacy-data mutation occurred.

## Slice E4 Level Analysis checkpoint

The active Level Analysis delivery, symbol-fact, trade-link and trade-detail
compatibility APIs now derive the local Platform scope and selected Journal
account. They no longer use V3 authentication, the legacy shared database,
browser-supplied owner/account facts or browser-selected provider allowlists.
Level Analysis owns immutable delivery evidence; Journal owns the stable
round-trip relationship and its immutable versions. Ordinary facts-only reads
never return the retained raw provider payload.

Migrations `0010_level_analysis_deliveries` and
`0011_journal_level_analysis_links` applied after online backup/restore and
disposable migration/restore proof. Their checksums are
`88e1f5cc1e180c1ed0774358d2efb4cf0e8565779cdd5c9790d9b6ef2cba6e52`
and
`b8cc72242ebd7544ec29ca11ca0946a5eb16e9301652f4cc0cdab174b54473af`;
the final schema digest is
`c359134536e2583277efdb13199587e8b65084d4f73ed74fdb1a4d97b97d8bd4`.
The real database now has 11 migrations, 48 domain tables, size 11,087,872
bytes and SHA-256
`7c81fabba5fa4eac106cd7c4238011ac49ea8170f197bb9ad5408ac9fbdb00d0`.
All four new E4 tables remain empty and all 44 earlier domain-table counts are
unchanged.

The accepted backup/restore pair is byte-identical with SHA-256
`659b152a57a54ba6eb3a882a348d04d450668a39591febe5ec4ab7fb419885b3`
under the `phase-5-slice-e4-20260802T125304Z` backup and restore-verification
directories. The disposable post-migration backup/restore pair is also
byte-identical with SHA-256
`af41e9cf9f5a86e0bce11df88ccc0ef646ec3bb02356edb87c7b3c25b35a55a1`.

Focused TypeScript/lint, the 78-file active V3-free gate, six focused files/30
one-worker tests, real Level Analysis reconciliation, complete Phase 5 read
models and the 210-capability Analytics Lab proof pass. The database stayed
unchanged during the read verifiers. No provider delivery or private symbol
request ran, no legacy delivery/link/annotation test data was copied, all
three target ports remain off, and no stage, commit, push or deployment
occurred.

## Slice F1 Reflection, Coach and Review checkpoint

The dashboard Reflection Loop and both latest Coach/Review compatibility APIs
now use one read-only replacement Coach service. It derives the local Platform
scope and selected Journal account, consumes published Journal Analytics, Data
Decisions and annotation services, and presents daily/weekly/monthly factual
review periods. Missing notes, tags or rule reviews remain incomplete
trader-authored reflection; they never become an automated behavior, strategy,
intent or mistake classification.

No database migration or write was needed. Dependency-scoped TypeScript,
targeted lint and the 85-file active V3/sample-free verifier pass. The real
read-only proof reconciles 18 trading days, 331 ready-closed trades, zero
legitimate-open positions and two Data Decisions while confirming all new
annotation counts remain zero. The database file stayed 11,087,872 bytes with
SHA-256
`7c81fabba5fa4eac106cd7c4238011ac49ea8170f197bb9ad5408ac9fbdb00d0`.

Two focused files/seven tests are written but not reported as passing: the
repository policy approval layer refused Vitest at this active-implementation
checkpoint. The refusal was respected and the test execution remains a Phase 6
acceptance item. Port 3010 remains off; no stage, commit, push or deployment
occurred.

## Slice F2 Academy identity and progress checkpoint

Migrations 0012-0013 establish Platform multi-provider identity/session facts
and Academy user-level progress plus immutable events. The development-local
identity was backfilled; no Discord identity, public session or Academy
completion/event was created. Academy local pages and completion mutations now
use the stable Platform user without requiring Discord, while production
hosted Discord progress remains an unchanged compatibility path until F6.

The real database has 13 migrations, 52 domain tables, schema digest
`050f62f2ec6d86419897dc2202df7b3ad6a5e0155c94994a8fb8da0577d389db`,
size 11,157,504 bytes and SHA-256
`858aec8c7ad77d86911889c5627934142c825809831c22ce4acc733b5d6ea913`.
Counts remain 1,072 executions, 333 round trips and two Data Decisions, with
one backfilled authentication identity and zero Academy progress rows.

Pre- and post-migration online backups and independent restores pass with
byte-identical pairs. The 107 protected progress slugs and zero aliases remain
unchanged. Focused TypeScript/lint, registry/static/disposable/real-database
verification and the 93-file active replacement gate pass. Two focused
files/five tests are written but policy-deferred to Phase 6. No production
Academy data, Discord login, port, Git stage/commit/push or deployment changed.

## Slice F3 Watchlist storage and access checkpoint

Migration 0014 adds Watchlist-owned current-symbol, global-health and immutable
archive tables to the replacement database with the same revision field used
by hosted concurrent publisher writes. Runtime Watchlist requests no longer
create or alter schemas and storage no longer falls back to Academy, generic,
V3, Journal-named or repository-local databases. Local storage uses the
protected Platform database; hosted storage requires the Watchlist-specific
URL.

All Watchlist pages and authenticated read/stream APIs now use a Watchlist
access service. Protected local review resolves the seeded Platform user
without Discord. Production preserves the existing Discord Premium decision
behind a named compatibility adapter until F6. Publisher ingest, recap and
archive-reset authority remains an independent bearer-token boundary and is
never granted by a user session. Watchlist data/access is global to the user,
not scoped to the selected Journal account.

The real database has 14 migrations, 55 domain tables, schema digest
`02c03c5e02ea31050b03f3c3662517da1813d240e004bff2658508acc67f6b25`,
size 11,190,272 bytes and SHA-256
`b0164b6f77ee91153b882a6a4a12caee210ce9423c949f3d971b15322b377afe`.
All three Watchlist tables are empty; Journal remains 1,072 executions, 333
round trips and two Data Decisions; Academy remains empty. Pre/post online
backup/restore, fresh 14-migration initialization, full integrity/schema
verification and a disposable current/health/archive/reset runtime proof pass.
The local legacy 32,768-byte Watchlist database remains untouched preservation
evidence and its zero rows were not copied.

Focused TypeScript/lint, static migration verification and the 107-file active
replacement gate pass. One new two-case access test plus the existing
Watchlist persistence/concurrency tests are retained for Phase 6 because the
active policy deferred Vitest execution. Ports remain off; no production data,
Git stage/commit/push or deployment changed.

## Slice F4 News content and Affiliate ownership checkpoint

Migrations 0015-0016 add News-owned current/version tables and Platform-user
Affiliate invite/attribution tables. News is public module content and
Affiliate is a Platform commerce/account relationship; neither is scoped to a
Journal account. The old mixed database's single News article was copied once
with one immutable version after privacy-safe field-digest reconciliation. Its
second import returned `already_present`. No local affiliate table or row
existed, so both Affiliate tables remain empty.

The legacy mixed source was backed up online and restored independently under
`phase-5-f4-news-20260802T150044Z`. Backup and restore are byte-identical at
SHA-256
`90772646d43f121778edae92b6cbbe82172e4947e09cbf63393757be8ae3f74b`;
source/backup/restore schema, counts, integrity and News-row digests match. The
source retained SHA-256
`ae976482866435799bf06a1dec8188d0e3b4f3fb8d7565b93cfafa523e1c4f37`.

Pre-F4 replacement backup/restore `phase-5-f4-20260802T150245Z` is
byte-identical at SHA-256
`58ee0ab12aea89181e8af594a33fcbda07ef954c9746745f1b684d4df0831790`.
Post-F4 replacement backup/restore `phase-5-f4-post-20260802T151122Z` is
byte-identical at SHA-256
`f321a25b3f44dbf3703a0b817b6632839d31339609461bce4babcb589954b9a6`.

The real database now has 16 migrations, 59 domain tables plus its registry,
schema digest
`0c70a9a63c5716034b2a68f80ba2965511c6fba5277680ef547febefccb20311`,
size 11,268,096 bytes and SHA-256
`9f14fade99348729336044c36f30edd4c9f0ad53a75dcb2de7b3eb5b9b9fae5d`.
Journal remains 1,072 executions, 333 round trips and two Data Decisions.
Academy and Watchlist remain empty. News has one current article/version and
Affiliate remains empty.

Runtime News/Affiliate storage no longer creates or alters schema and no longer
uses Academy, generic, V3/Journal-named or repository-local fallbacks. Local
uses the protected Platform database; hosted uses only the module-specific
URLs. The News publisher now requires its token in all environments. The News
article page uses the Platform-aware Academy boundary. Filtered-news checkout
uses stable Platform identity locally and a named legacy Discord read adapter
until F6.

Focused TypeScript/lint, static migration verification, full schema/integrity,
the 117-file active replacement guard, exact import/idempotency and fresh
disposable News-version/Affiliate-first-touch proofs pass. Focused Vitest is
written and policy-deferred. Ports remain off; production, Git staging/commit/
push and deployment were untouched.

## Slice F5 Platform peers and legacy-route disposition checkpoint

The exact [F5 route plan](phase-5-slice-f5-platform-peers-and-legacy-route-disposition-plan.md)
maps all 52 preserved `/intelligence` pages by unique capability. A typed
registry contains 44 canonical redirects, two compatibility redirects, five
operations-only dispositions and one owner-rejected mock/test surface. Static
routes are ordered ahead of dynamic matches and every redirect is temporary
until final acceptance. Existing top-level aliases now go directly to the
replacement pages instead of chaining through the V3 family.

`/workspace/readiness` is a replacement Platform Server Component inside the
approved light Material shell. It reads the verified replacement schema,
stable local ownership/account scope, applied module boundaries, route
disposition totals and explicit launch gates without DDL, writes, fixtures,
V3 imports or private identifiers. `/platform-readiness` redirects to it. The
old dark fixture/readiness source was replaced in place; all 52 legacy page
sources remain preserved and are intercepted before filesystem routing.

Focused TypeScript, targeted lint, `git diff --check` and the 122-file active
V3-free static gate pass. The privacy-safe real-database verifier confirms 16
migrations, 59 domain tables plus the registry, seven module storage
boundaries and stable owner/workspace/selected-account availability. The main
file remained 11,268,096 bytes with unchanged SHA-256
`9f14fade99348729336044c36f30edd4c9f0ad53a75dcb2de7b3eb5b9b9fae5d`.
One focused three-case route-registry test is written and policy-deferred to
Phase 6. No legacy file, database content, port, production setting, Git stage,
commit, push or deployment changed.

## Slice F6 public identity and hosted-transfer checkpoint

The exact [F6 plan](phase-5-slice-f6-public-identity-and-hosted-transfer-plan.md)
now has a unified request identity boundary: loopback development keeps its
guarded login-free owner, while public use requires a hashed revocable Platform
session linked to an exact Discord identity and current bounded Discord
membership. New public users are provisioned atomically with one workspace and
one default user-defined Journal account. The private seeded owner can be
linked only through the separate preview/execute command; no ordinary login
can claim it. No real owner link or public session has been created.

The application now has a single-node hosted package: standalone Next.js
output, a private-data-safe multi-stage Docker image, Railway configuration,
production startup verification, and a safe database-aware health endpoint.
The only accepted hosted database topology is one process and one persistent
`/data` volume. The exact operational procedure is in the
[Hosted Beta Runbook](traderlink-platform-hosted-beta-runbook.md).

Migration `0018_platform_hosted_transfer_events` adds one immutable,
append-only transfer ledger. The F6 transfer command can preview, explicitly
authorize, execute and reconcile accepted Academy progress, Watchlist content,
News content and Affiliate first-touch facts from their dedicated read-only
sources. It rejects conflicts and ambiguous identities and does not select or
copy legacy Journal executions, trades, tags, rules or notes. Those legacy
records were owner-rejected test data. New Journal annotations remain required
account-scoped product facts tied to stable trading-day and round-trip targets.

A fresh disposable proof initialized the complete schema, transferred and
reconciled all four modules across eight synthetic source rows, recorded eight
append-only transfer events, and proved an idempotent zero-write second
preview. Focused TypeScript, the 146-file active replacement guard, migration
verification, readiness and full read-only database verification pass. The
real database now has 18 migrations, 61 domain tables plus the registry,
post-schema digest
`7306385ce32329abe73a41fc3ec630c28dc4df7efaaad975b55f8f719dcdf4be`,
size 11,304,960 bytes and SHA-256
`bcbd40986840e1afb6cd169ea6a26f0ffbb8db9a8b367bc5acd971a7b4430664`.
The transfer-event, Discord-membership and public-session tables contain zero
rows; all accepted Journal/News counts are unchanged.

Verified pre-0018 and post-0018 online backup/independent-restore pairs are
preserved under `phase-5-f6-transfer-ledger-20260802T170341Z` and
`phase-5-f6-transfer-ledger-post-20260802T170505Z`. No hosted source credential,
production row, Railway resource, secret, process, Git stage/commit/push or
deployment changed. Production transfer, initial-owner Discord linking and the
Docker/build/browser rehearsal remain Phase 6/pre-launch gates.
