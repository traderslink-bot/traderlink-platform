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
