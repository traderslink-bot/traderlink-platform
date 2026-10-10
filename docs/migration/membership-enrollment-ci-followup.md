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
