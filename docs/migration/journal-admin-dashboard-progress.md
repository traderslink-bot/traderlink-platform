# Journal Administration Dashboard Progress

**Status:** Technical Admin 1-6 and live browser acceptance complete; owner review and production activation pending

**Started:** 2026-08-03

**Controlling plan:**
[TraderLink Journal Administration Dashboard Plan](journal-admin-dashboard-plan.md)

**Owner review boundary:** Complete the technical implementation and a useful
integrated light Material UI before requesting visual/product review. Small
backend and empty-shell checkpoints do not require intermediate owner review.

## Repository and runtime boundary

- Implementation: `C:\Users\jerac\Documents\TraderLink\traderlink-platform`
- Branch: `codex/traderlink-platform-replacement`
- Starting HEAD: `c0c998d8e456b9e70433e73123e8024b13ece203`
- All work remains unstaged unless the owner explicitly requests a Git commit.
- `.codex-node-userinfo-fallback.cjs` is a local resource workaround and must
  never be staged or committed.
- Port 3010 remains off until the integrated owner-review checkpoint.
- The separate Watchlist administration and its computer-run automation are
  outside this feature and remain untouched.
- The owner-reserved Playwright/Chrome Discord press-release app starts at
  03:55 local time and must never be stopped. If it prevents reliable work,
  pause only at a documented safe checkpoint.

## Admin 0: Accepted plan and inventory

**Status:** Complete

- [x] Owner accepted the route, role, privacy and product boundary.
- [x] `/admin/journal` and `/api/admin/journal/**` are reserved for this module.
- [x] Watchlist, V3 QA and Level Analysis administration are explicitly separate.
- [x] Existing migrations 0019/0020 and partial Platform repositories were
      re-audited before implementation resumed.
- [x] The current Next.js route-handler and authentication guidance was read
      before adding new application routes.

## Admin 1: Operator authority and audit foundation

**Status:** Complete (production grant intentionally deferred)

- [x] Migration 0019 is present and applied through the accepted migration chain.
- [x] Initial operator, audit and operational-event repositories are present.
- [x] Enforce the full local loopback and production Discord-owner boundaries.
- [x] Add bounded request security, same-origin/CSRF and rate limiting.
- [x] Implement the offline preview/execute grant, recover and revoke command.
- [x] Add focused authorization, immutability and operator-command tests.
- [x] Keep the real production grant absent until go-live preparation.

## Admin 2: Import attempts and statement-format evidence

**Status:** Runtime implementation and integrated compile/checkpoint complete

- [x] Migration 0020 is present and applied through the accepted migration chain.
- [x] Implement the hardened V2 browser mapping-support contract, privacy
      scanner and opaque preview confirmation boundary.
- [x] Implement attempt, candidate, observation and consent repositories.
- [x] Instrument every public statement upload path and stale-commit recovery.
- [x] Add the consented support-source vault and trader-triggered verified purge
      lifecycle. Automatic deletion of unreferenced orphan files remains
      report-only until its separate destructive-cleanup authorization.
- [x] Permit first instrumentation-epoch activation only through the now fully
      covered preview path. No historical attempt rows are fabricated.
- [x] 2026-08-05: Removed the regular-import source-sharing consent control and
      disabled that request path. Failed, structurally readable imports continue
      to create the existing Journal Administration format observation with only
      the broker label, sanitized headers/labels, outcome and time; no statement
      values are retained for importer development.

## Admin 3: Read models and APIs

**Status:** Complete at focused checkpoint

- [x] Implement opaque-ref, bounded Overview, Users, Imports, Formats,
      Data Decisions, System and Audit read models.
- [x] Independently reconcile all metric definitions.
- [x] Add private/no-store read APIs and audited detail-access APIs.

## Admin 4-6: Integrated UI

**Status:** Technical implementation and live browser acceptance complete; owner visual review pending

- [x] Build the private Journal Administration shell and Overview/Users pages.
- [x] Build Imports, Statement Formats and operational Data Decisions pages.
- [x] Build System and immutable Audit pages.
- [x] Keep all visible labels plain-language and all rates/durations at no more
      than two decimal places.

## Admin 7: Production activation

**Status:** Deferred to go-live

- [ ] Link the accepted production Discord identity.
- [ ] Create the singleton production grant through the offline command.
- [ ] Prove every non-owner and stale/revoked identity fails.

## Admin 8: Acceptance

**Status:** Technical and live browser checkpoints complete; owner review and production activation pending

- [x] Run focused one-worker checks during each slice.
- [x] Run whole-project TypeScript, full lint, production build, focused
      regression, privacy/static and migration-file gates.
- [x] Run the live browser route, console, rendered-content and navigation gate.
- [x] Add and pass the static Journal Admin inventory/privacy verifier.
- [x] Update the master replacement plan, migration register and project log.
- [ ] Start port 3010 only for the integrated owner review.

## 2026-08-03 Admin 3-6 technical checkpoint

The private `/admin/journal` light Material shell now contains Overview, Users,
Imports, Statement Formats, Data Decisions, System and Audit. All list/read
models are bounded, use encrypted operator/mode-bound references and return
privacy-safe counts, labels, states and operational evidence. Sensitive user
and import details are POST-only, reason-gated, rate-limited and audited before
their safe detail payload is returned. Ordinary page loads do not run SQLite
integrity checks or reveal database paths, source filenames, broker identities,
authentication subjects or internal IDs.

Statement-format controls now advance only through the accepted lifecycle with
exact expected revisions and durable idempotency. Candidate merge creates an
immutable alias without moving or deleting observations. `supported` fails
closed unless the deployed code registry exactly matches the statement layout,
constituent table signatures, adapter/version and fixture digest. The registry
is deliberately empty until a real reviewed importer implementation supplies
that evidence.

The default development download is a fixed five-entry ZIP containing only
hardened structure, mapping aggregates and synthetic placeholders. Package
generation rejects UUIDs, emails, paths, raw/source fields and oversized
content before an audited private attachment is returned. A raw statement is a
separate POST-only path: current purpose-bound consent, fresh owner authority,
server-side hash/size verification, a pre-disclosure audit and consent download
events are all required. It never returns a public URL. The real support-source
root remains unconfigured, so no real support object or source was downloaded.

The complete focused administration gate passes 15 files and 30 tests with one
Vitest worker. The subsequent request-idempotency addition passes together with
the format/download suite, bringing the current focused total to 31 tests.
Targeted ESLint and `git diff --check` pass. The static verifier passes 83
required files, 14 admin pages/components, 14 route handlers plus the shared
API response helper, 38 foundation files and 15 focused test files. Its first
launch hit the known Windows `uv_os_get_passwd` memory failure before project
code loaded; the validated process-local untracked fallback allowed the exact
same verifier to pass and remains excluded from Git.

The scoped Journal Admin TypeScript dependency graph passes with a bounded
1 GiB heap and the process-local fallback; its temporary config was removed.
The whole-project TypeScript and production build now pass; the live browser
gate remains deferred under current protected-process memory pressure. No real database, source,
support vault, operator grant, process, port, Git stage/commit/push, deployment
or external service changed. Port 3010 remains off and the owner's protected
Playwright/Chrome press-release application remains running.

## 2026-08-03 non-browser integrated acceptance checkpoint

Full whole-project TypeScript passed with a bounded 1.5 GiB heap and Windows
virtual memory. Full ESLint passed with zero errors and 18 unrelated
pre-existing warnings. The Next.js 16.2.6 production build passed Academy
validation, compilation, TypeScript and generation of all 126 routes/pages.
The Journal Admin static verifier still passes its 83-file inventory; all 21
immutable migration files and the expanded 156-file V3-free active replacement
boundary pass as well. Journal Admin's focused result remains 15 files and 31
tests with one worker.

The first build attempt could not open generated `.next/trace` through the
restricted workspace boundary; the identical direct-access build passed, so
this was a filesystem sandbox issue rather than a source failure. A temporary
port-3011 dev server was stopped when it reached about 2.3 GiB before browser
navigation. Only its exact verified process tree was terminated. The protected
press-release controller and current bot child remain alive, ports 3010/3011
are off, and live Admin browser/visual verification is the exact resume point
after that protected application closes.

## 2026-08-03 live browser acceptance checkpoint

The owner granted a one-time exception to pause the protected press-release
runtime for this bounded check. Both exact scheduled tasks were disabled, the
manual-stop marker was created and only the verified controller/runner tree was
stopped. No scheduled-task definition or source file was edited.

The replacement ran on temporary port 3011. A clean automated Chromium session
verified the Journal Administration Overview, Users, Imports, Statement
Formats, Data Decisions, System and Audit pages. Every page rendered meaningful
content with its expected title, no framework error overlay and no browser page
errors. The rendered Overview sidebar navigation to Statement Formats and back
to Overview was exercised successfully.

The first live pass found and corrected three real React/Next.js boundaries:

- MUI `component={Link}` functions were being passed from Server Components to
  Client Components; direct framework links now keep that function inside the
  supported component boundary;
- MUI `Divider` elements were being passed through the client `Stack.divider`
  prop; deterministic border styling now preserves the separation without an
  unserializable element prop; and
- locale-dependent `toLocaleString()` produced different Windows-server and
  Chromium text; the Admin header now uses one deterministic UTC formatter.

The related `TableContainer component={Paper}` boundary was also replaced with
normal composition so table routes remain safe when populated. Targeted ESLint
passes, `git diff --check` passes and the 83-file Admin inventory/privacy guard
again reports 14 Admin pages, 15 Admin APIs, 38 foundation files and 15 focused
test files.

The browser and exact port-3011 server tree were closed after the final clean
run; ports 3010 and 3011 are off. Both original scheduled tasks were re-enabled,
the stop marker was removed and the controller was restarted through the
existing daily task. The runner returned to `live` with Discord logged in and
all three watchers healthy. Owner visual/product review and the separately
controlled production grant/Discord activation remain open. No database,
private source, support vault, operator grant, Git stage/commit/push, deployment
or production state changed.

## 2026-08-03 starting audit

The accepted database already contains migrations 0019 and 0020. The active
unstaged source package contains the Journal admin scope contract and initial
Platform operator, authorization, audit and operational-event repositories.
No Journal administration services, read APIs, pages, operator command,
attempt instrumentation, V2 format evidence or focused admin tests exist yet.

The local identity resolver already derives development mode only from the
protected launcher assertion and a complete loopback network boundary. The
administration authorization layer now revalidates that boundary, requires the
fresh exact Discord-server-owner identity plus the singleton grant in
production, and applies privacy-safe bounded request controls. The offline
operator command supports exact preview/execute grant, recover and revoke
operations, rejects undocumented arguments, binds execution to fresh
backup/restore evidence and writes the grant change plus audit event in one
transaction. Three focused files and nine tests pass with one worker; targeted
ESLint, the full no-emit TypeScript check and `git diff --check` pass. The real
production grant remains absent, and no protected database, process, port,
identity or external service changed. Admin 2 is the active implementation
slice.

## 2026-08-03 Admin 2 browser privacy checkpoint

The public statement mapper now returns only
`journal_statement_mapping_support_v2`. Source hashes, byte sizes, total/data
row counts and per-column value counts remain server-only. The V2 package uses
sanitized labels, sorted unique field-count structure, source-order table
descriptors and a deterministic statement-layout signature that is unchanged
when a statement has different trade values or row counts. Private-looking or
low-confidence headings become neutral `Column N` labels; that state withholds
the global layout signature and shared candidate eligibility while preserving
the trader's account-scoped mapper path.

Import confirmation now uses a 15-minute signed opaque preview reference bound
to the exact user, workspace, selected account, source evidence, mapping,
parser and timezone. The browser no longer receives or resubmits the source
file hash, file size or the former source-derived account confirmation hash.
Two focused files and five tests pass with one worker; targeted ESLint and the
full no-emit TypeScript check pass. Durable attempt admission, first-commit
consumption/idempotent retry, candidate observations and consented-source
retention remain the active Admin 2 work.

The attempt repository now provides explicit instrumentation-epoch activation,
scope-bound idempotent admission, immutable received/transition events, legal
state transitions, expected-revision enforcement, seven-day resumable-state
requirements and terminal-state validation. It does not activate the real
instrumentation epoch by itself. Two focused lifecycle tests pass and prove
retry reuse, source-mismatch rejection, stale-revision rejection and immutable
event history. At that checkpoint runtime wiring remained deliberately
incomplete until preview, mapping, commit and recovery could share the same
attempt authority; the following checkpoint completes that wiring.

## 2026-08-03 Admin 2 runtime checkpoint

Every current Journal `POST` route now shares one strict ordinary-Journal
mutation boundary: explicit same-origin browser evidence, matching origin/host
and a custom request marker. The statement preview route performs size, type
and basic byte safety checks before durable admission; preview, manual mapping,
saved-template mapping and commit reuse one account-scoped browser idempotency
reference. The 15-minute opaque preview reference and the new encrypted opaque
import references contain no browser-readable Platform, Journal, source-hash or
file-size identity.

Preview now creates or resumes one attempt, records its immutable transitions
and a hardened V2 format observation, and leaves mapping/preview states
resumable for seven days. Generic and IBKR commit revalidate the exact source
and preview, then commit Journal facts plus the terminal attempt event in the
same immediate SQLite transaction. A disposable generic-statement proof found
and corrected a stale preview-count field that previously rolled back final
attempt bookkeeping after evidence promotion. The corrected proof commits one
attempt, one import, two executions and one round trip; an exact retry returns
the terminal result without duplication. Stale `committing` recovery closes an
attempt only from exact committed-batch evidence or records a system failure;
it never invents an import.

Optional importer-development consent remains off by default. The ordinary
Import UI can retain the exact source in a separate required private vault for
at most 90 days, uses an encrypted owner/account-bound reference, and lets the
trader revoke access. Support bytes are hash/size verified, privately flushed
and atomically promoted before metadata/consent becomes visible. A failed
metadata transaction removes its unreferenced file. Revocation or expiry first
ends access, then verifies deletion and records a lowercase SHA-256 purge
receipt; committed Journal evidence is never deleted by consent changes.
`TRADERLINK_PLATFORM_JOURNAL_SUPPORT_SOURCE_ROOT` is not yet configured in the
real local environment, so opting in reports sharing unavailable without
blocking statement mapping. Automated orphan-file deletion was not added: its
safety gate requires separate explicit destructive-cleanup authorization, so
the remaining design is report-only rather than silently deleting files.

The complete focused Admin 2 gate passes 13 files and 27 tests with one Vitest
worker and no file parallelism. Targeted ESLint and `git diff --check` pass.
The whole-project TypeScript check passed before the final Admin 2 batch; a
later bounded 1 GiB compile exhausted its JavaScript heap while the protected
03:55 Playwright/Chrome press-release application was running. The latest
Admin 2 files therefore still require the integrated full TypeScript checkpoint.
No real database, support vault, instrumentation epoch, process, port, Git
stage/commit/push or deployment changed. Port 3010 remains off and every
protected press-release process remains running.

## 2026-08-03 independent readiness QA

The owner requested a fresh QA pass before product review. A clean browser
session rechecked Overview, Users, Imports, Statement Formats, Data Decisions,
System and Audit. All seven routes rendered their expected private owner UI,
returned zero framework overlays and finished with an empty browser error list.
The final Overview screenshot also confirms the accepted light administration
shell and privacy-safe unavailable states.

The wider route sweep found an Account-page hydration mismatch outside the
Admin namespace. It came from a decorative icon supplied through a
server-rendered MUI Chip prop. Removing that prop fixed the mismatch, and a
fresh Account-to-Admin rerun remained error-free. Admin and Swing-note time
labels now use deterministic UTC formatting.

The 83-file Admin verifier, 156-file active replacement guard, all 21 migration
files, read-only real-database integrity verification, whole-project
TypeScript, full lint with zero errors and the 126-page production build pass.
The earlier 15-file/31-test focused Admin baseline remains accepted; a new
Vitest execution was policy-blocked during this QA and was not bypassed. No
support source, operator grant, Journal fact, production setting, Git stage,
commit, push or deployment changed.

Private Admin access is intentionally audited. This QA appended those expected
access records, moving `platform_admin_audit_events` from 86 to 153 across both QA passes; all
Journal domain counts remained unchanged and the post-browser database again
passed schema, foreign-key, quick and full integrity checks.

## 2026-08-03 second risk-focused browser QA

A second clean browser session rechecked Account plus 13 high-risk routes:
Day and Swing Trackers, Open Positions, Round Trips, Ticker, Calendar, Imports,
Data Decisions, Analytics Lab, Admin Overview, Admin Imports, Admin Data
Decisions and Admin Audit. Every page returned meaningful content, its expected
title, zero framework overlays and no browser page errors. A rendered-text scan
found no numeric value with more than two decimal places.

Non-destructive interaction checks proved the generic broker statement chooser,
broker name/timezone controls, Data Decision evidence and trader-controlled
actions, Admin `View imports` navigation and `Return to Journal`. No file was
uploaded and no save, decision, import, preview or commit action was triggered.
The final read-only database verifier again passed all 21 migrations, schema,
foreign keys, quick check and full integrity check with every Journal count
unchanged. Port 3010 remains active only for the owner's review.
