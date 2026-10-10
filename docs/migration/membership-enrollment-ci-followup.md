# Member browser enrollment and CI follow-up

Status: in progress; not accepted.

Owner scope: complete ordinary-member browser enrollment QA and investigate/fix
CI findings together. Payment processor testing last. No real payments, paid AI
calls or notifications. No authentication bypass or real-customer access changes.

## Browser boundary

Production supports Discord authentication only. No independently authenticated
non-admin test session is currently verified. Requested owner-controlled ordinary
member Chrome login asynchronously; preserve owner session. Safe synthetic record
permission does not authorize fabricating a production identity/session.

Owner reported signed in as moonmafia. Browser inspection found separate Chrome
profile6 (extension43780261-5641-472c-862a-69513dfd9f8a) authenticated as display
name "This Guy". Direct owner-admin route returned "Journal Administration is
locked"; membership page showed no active plans and no Stripe subscription.
Asked owner to confirm moonmafia/This Guy mapping before enrollment mutation.
Owner Chrome3 remains separate; no sign-out, grant or enrollment performed.

### Correct member connection established

Supersedes the earlier identity blocker: Chrome profile7 now renders the profile
name moonmafia. Owner-admin URL correctly denies access; Plan & billing shows no
active membership plans and no Stripe subscription. No authentication bypass.
Owner-authorized private synthetic enrollment fixture created through admin UI:
qa-enrollment-only-20261010, published version1, all features disabled; synthetic
free-only provider qa-free-20261010; private one-day free offer; one-day zero-cost
trial, once per campaign, maximum one enrollment; expiring one-claim private link.
Existing qa-private-20261010 drafts are untouched. No public offer, provider network
integration, real payment, AI generation, notification, or global enforcement change.
Enrollment and cleanup passed on production through the real moonmafia browser:

- Start trial redirected to Plan & billing; one-day expiry displayed, no Stripe
  subscription. Owner Members view confirmed the same moonmafia grant.
- Consumed one-claim invitation returned404 on revisit. New private link to the
  same offer no longer displayed the capacity-exhausted trial.
- Ordinary Get access flow also succeeded and created an independent one-day
  grant. Revoking the trial left the ordinary grant visible and active.
- Revoking the remaining free grant restored No active membership plans.
- Offer and trial retired; both invitations revoked; synthetic free provider
  paused. Audit records retained; no permanent deletion. Public /plans still
  reports No plans are available. Owner overview active grants/offers/trials/
  usable private links all zero after cleanup.
- Browser capture: moonmafia-enrollment-cleanup.jpg in this task's visualization
  directory. Existing unread notification count remained one; no send actions.

Minor copy finding: one-day offer/trial renders1 days. Two-line singular/plural
patch prepared in membership-plan-duration-copy.patch, pending combined release.
No Help update needed for this copy-only correction. Authentication, payment,
pricing, duration calculation, and feature access behavior are unchanged.

## CI evidence

Run38069735914 failed in Run tests. Its12 check annotations independently read:
Academy context/roster mismatch, Discord auth redirects/timeouts, incomplete PWA
ServiceWorker mock and analytics fixture missing trades. Coordinator logs also
identify obsolete Help route source path, OAuth email-scope expectation, Watchlist
publication-time expectations and outdated pullback labels; broad DB suites show
timeouts/worker failures. Counts alone do not establish root cause.

## First correction checkpoint

- Academy test expectations updated to deployed five-course roster and canonical
  trading-plan context (registry and loader inspected).
- Prepared context patch for analytics fixture required trades/counts and PWA
  waiting-worker EventTarget methods/state. No production code changed.
- Requested isolated remote three-file test correction plus unchanged auth/OAuth
  focused reproduction; single worker, no parallel files,30s test limit. No full
  suite rerun or production publication requested. Results pending.

Remaining: examine focused output, investigate other deterministic CI clusters,
verify corrections remotely; run ordinary-member browser enrollment with a
verified test identity; retain payment/provider exclusion until last.

Second context patch `membership-ci-contract-corrections.patch` updates tests
against inspected deployed contracts: OAuth email scope, current pullback labels,
immutable first publication time for already-live ticker patches, current public
Help route/collection. Sent to coordinator for exact application and targeted
remote verification; no passing result yet. Broad suite not rerun. Coordinator
currently owns an unrelated Academy release; do not interfere with that lane.

### Focused remote result and second correction

Run38075850147 at2e747392 failed ten assertions across three files; other six
focused files passed. Inspected exact source before preparing
membership-ci-focused-followup.patch. It preserves access checks while correcting
the dashboard-authorized auth fixture, free Watchlist session reuse, extracted
Watchlist preview/frame/sanitizers, explicit Trade Explorer membership permission,
initial-view propagation, six refresh paths, and current fee labels. Internal
Journal identifiers are no longer mistaken for visible UI copy.
Coordinator composed test-only child18dc0450d124fb559c55508f84d37a12bd4e51ac;
rerun38076659717 in progress. No production code changes or deployment in this slice.

Run38076659717 finished with eight of nine focused files passing. Remaining four
failed assertion groups are the stale Trade Explorer contract, now inspected in
full across controls, table, fee descriptions and dedicated Explorer Help module.
membership-ci-explorer-followup.patch corrects all downstream stale assertions
together. Requested final focused rerun and remote classification of broad-suite
DB timeout/worker failures before claiming overall CI completion.

Focused checkpoint PASSED: run38077145696, exact verification SHA
78524c5b5f53c72a372857ae290a89b4d62b2adf. Independently read GitHub status and
workflow: all nine suites in one worker, no file parallelism, isolated network
namespace during execution, native SQLite. The last correction matches the
conditional Sort days/Rank by unavailable-result label. This is not yet a claim
that broad repository CI passes. Singular/plural display patch remains pending.

### Broad classification after desktop restart

Run 38077363957 at c813f492d8cf0b9bacf24bcc8a5a58b4da8da642 completed
with failure, not cancellation. Check 114287036510 exposes ten failed assertions
in five files. Coordinator recovered a 35m50s test step, below the timeout.
Artifact upload omitted include-hidden-files, so the hidden .ci-artifacts report
was not retained. Assertion annotations alone do not establish complete failure
counts: suite-level import/runtime errors are not emitted by that postprocessor.
No broad rerun or production deployment has been requested at this checkpoint.

Exact-candidate source classification and proposed batch:

- Real Coach contract mismatch: the Chat whitelist contains twelve Trade Explorer
  sorts while canonical page ordering contains eighteen. Maximum-position,
  execution-count and trading-cost ascending/descending sorts are missing.
  Preserve the parity check; propose adding the six choices and exercising all
  eighteen canonical ordering mappings with mocked analytics, no provider calls.
- Coach administration fixture assumes absent pricing. Migration 0069 now seeds
  complete default pricing. Explicitly clear all four price fields in the isolated
  test fixture before asserting enablement rejection; preserve cross-admin and
  invalid-reference checks. No production settings or migration changes.
- News fixture incorrectly treats Saturday 2026-09-05 as an eligible weekday.
  Use Friday 2026-09-04 for the eligible article, and add explicit weekend and
  inclusive-window boundary checks. Do not change the production selector.
- Seven route/template assertions reflect the prior architecture: shared frame
  delegation, moved navigation surfaces, and a comment-only DashboardShell match.
  The frozen 136-route containment matrix versus 291 discovered routes requires
  explicit replacement-boundary reconciliation, not broad exclusions or accepting
  any guard-name string. This part remains under investigation.
- Verification harness must retain hidden reports and include suite-level status,
  message and failed-suite counts, not only individual assertion failures.

Classification sent to the release coordinator. Runtime behavior changes remain
unapplied; no claim of overall CI acceptance. Browser enrollment acceptance and
synthetic-record cleanup remain passed. Payment-provider testing remains separate.

### Corrective commits and read-only route inventory

Owner explicitly approved the six Coach sort additions in this chat. Prepared
immutable local commits without moving a branch or touching the shared index:

- cf441bc43f15960ef9e7a420eb8917f9f4ee4370, parent c813f492: two test-fixture
  corrections and branch-only complete-report upload/diagnostic correction.
- 4c431e1ec701660f73f2133108e8d554111e1303, parent cf441bc4: six Coach sort
  enum additions plus all-eighteen canonical analytics call mapping cases.
  Precise source of mismatch is the OpenAI adapter Zod enum; the analytics service
  already derives the full canonical set. No provider call is needed to test it.

Both patch compositions pass git diff --check and TypeScript syntax transpilation.
The workflow's two JavaScript blocks parse. Remote targeted execution requested;
no local test suite/build/server or production deployment. AI Chat Help's existing
sort examples remain accurate and nonexhaustive; no guide change is required.

Read-only inventory can be reproduced with
`node scripts/inspect-membership-ci-route-boundaries.cjs c813f492d8cf0b9bacf24bcc8a5a58b4da8da642 --guards`.
It reads Git objects and executes only pure source-analysis helpers/configuration;
it does not import the application, run tests, open databases or make network calls.

- Exact inventory: 136 matrix entries, 291 discovered routes, 157 missing matrix
  entries (42 pages and 115 APIs), two matrix entries absent from discovery.
- All 115 scanner findings are unclassified APIs. No method/wrapper mismatch is
  reported among already-classified routes. This is NOT proof the 115 unclassified
  APIs are safe; the old checker never evaluates their boundaries after that result.
- Two unmatched old entries: analytics/performance page and Discord login API.
  The login route still exists but no longer satisfies the old discovery heuristic.
- Five navigation false mismatches resolve to the standalone Watchlist page and
  four explicit channels handled by press-releases/[[...channel]]/page.tsx.
  Watchlist delegates through WatchlistDashboardFrame into the shared frame;
  the four channel cases are explicit in resolveChannel and retain identity/news
  permission checks. No navigation or page movement is proposed.
- Shared dashboard layout delegates to dashboard-layout-frame, which performs
  ServerComponentPageIdentity or explicit Watchlist/billing identity checks and
  renders the canonical template. Tests must follow that delegation, not require
  authentication/template calls to remain textually in the old layout file.
- The sole duplicate-shell textual match is a comment in feature-help-link.tsx.
  A source/AST check should ignore comments, not whitelist that entire component.
- Sidebar navigation consumes DASHBOARD_SIDEBAR_NAVIGATION_SECTIONS from the
  canonical configuration. Obsolete title/group symbol assertions should track
  actual imported configuration while retaining the no-local-duplicate check.
- Source evidence across unclassified APIs includes platform request scopes,
  Journal admin wrappers, cron-secret gates, session-specific sign-out helpers,
  and development-only launcher bridges. These are distinct boundary contracts;
  a broad guard-name regex cannot serve as acceptance. The inventory's candidate
  calls are triage evidence only. Full method-level reconciliation is still open.

No route containment test, matrix, guard, shell or navigation source was changed.

The complete [read-only reconciliation proposal](membership-route-boundary-reconciliation.md)
links the explicit 291-route / 202-API-method evidence inventory, documents the
five navigation exceptions and shared-frame guard chain, and identifies every
remaining method-level review. It remains a proposal, not a passing replacement
matrix. Targeted remote run38084260708 at739ffccc0608e73acddda747ddf2f2c41c7f55fc
is verifying the independent fixture/sort batch; do not start another run.

Targeted run38084260708 completed SUCCESS, independently verified through GitHub
on 2026-10-10 (job114307323855). The three-file remote check passes for the owner-
approved sort parity/mappings and both fixture corrections. Route contract review
and broad acceptance remain open; no production release was performed here.
