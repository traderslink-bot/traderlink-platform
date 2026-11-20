# Community destination allowance implementation progress — 2026-11-20

## Scope

This workspace implements the approved platform-operator control for configuring a connected, admitted Community's publishing-destination allowance. It does not grant an allowance automatically, change Community admission policy, provision hosted data, send provider messages, or publish a release.

The implementation distinguishes an unconfigured allowance from an explicitly configured limit of zero. Community owners cannot create or restore a non-archived destination until an active platform operator has configured capacity.

## Implemented behavior

- Journal Admin admission entries show connection, admission, operator-authority, allowance, and usage state.
- An active platform operator can set an explicit limit from 0 through 1,000 with a private audit reason.
- Private audit reasons preserve the admission command contract: line feed, carriage return, and tab are accepted for multiline reasons, while other control characters and values over 2,000 characters are rejected.
- The command derives the Community from the invited Discord guild and requires connected state plus an approved admission decision.
- The write uses an immediate transaction, compare-and-swap mutation token, monotonic committed timestamp, private audit record, and idempotency receipt.
- Authorization is checked before an idempotent receipt can be replayed.
- Exact replay returns the original receipt without a second write; a new request using a stale token fails with conflict and performs no write.
- The owner-facing destination manager distinguishes unconfigured, configured zero, available, and full allowance states.
- Capacity is enforced when any archived destination is restored to either draft or active. Draft-to-active and active-to-draft transitions do not consume additional capacity.

## Verification

- Focused Vitest: `src/modules/communities/server/community-destination-allowance-admin.test.ts` — 11 tests passed after the multiline-reason correction.
- Changed-file ESLint — passed.
- Full TypeScript (`tsc --noEmit --pretty false`, 4 GB heap) — passed.
- Journal Admin static verifier — passed: 83 required files, 14 admin pages, 15 admin APIs, 38 foundation files, and 15 focused tests recognized.
- Academy registry validation — passed.
- Next.js 16.2.6 production build with webpack and a 4 GB Node heap — passed, including TypeScript and 307 generated static pages.
- `git diff --check` — passed.

After independent source review found that the repository's generic single-line cleaner contradicted the multiline reason schema and form, the allowance path received a dedicated equivalent reason validator. The exact correction passed the 11 focused tests, ESLint for the two changed files, and `git diff --check`. Per the coordinator's no-more-heavy-operation boundary, the earlier full TypeScript and production-build receipts were not rerun after this narrow correction; they apply to the preceding patch and are retained as historical validation rather than claimed as exact-postimage build proof.

The first package build attempt reached Next.js compilation but exhausted Node's default approximately 2 GB heap. The unchanged source then passed the build with an explicit 4 GB heap. This was a runner resource ceiling, not a source failure.

The build retry did not hold the canonical shared VPS heavy-operation lock. A coordinator resource audit found that omission after the build completed; all owned build processes were then confirmed exited, host memory recovered, and the canonical lock was confirmed free. No additional heavy operation is permitted in this task. Any future heavy run must hold the canonical lock file descriptor for the complete controller and child-process lifetime, verify its inode and lease before launch, and treat the observed build high-water memory as the planning bound.

## Review notes

- React review found no new effect, derived-state, component-definition, accessibility, or client-boundary issue. The form uses the repository's existing MUI and server-refresh patterns.
- Help Center review: this is a private platform-operator control plus truthful owner capacity status. No member-facing workflow changed, so no Help Center guide update is required for this slice.
- The separately investigated enrollment requests route had one settled owner check pass and the earlier early-render 404 was not reproduced. This implementation does not modify that route or enrollment behavior.
- Shared-alert publisher assignment/navigation findings belong to the separate Shared feature workstream and are not included here.

## Release boundary

No local commit, push, merge, deployment, migration, production data change, account action, Discord/provider send, or live allowance provisioning was performed. The source remains an uncommitted, reviewable patch in the assigned workspace pending Coordinator integration and release authority.

## Clarified destination-filter contract checkpoint

The manager-accepted follow-on contract is now implemented as one reviewable batch over the assigned five runtime paths and two focused test paths:

- General, publisher, topic, and publisher-plus-topic destinations now enforce their exact publisher/topic/second-URL field matrix at the repository trust boundary.
- Publisher filters accept only the active Community owner or an active Community member whose Platform user is active. Topic filters accept only an active topic owned by the same Community.
- The create action parses the exact feed-kind enum instead of trusting a TypeScript cast, and rejected writes leave no page, settings, alias, or audit residue.
- Updates derive immutable feed kind and publisher identity from the stored Community-authorized row. Unchanged legacy tuples remain editable; changing a filter field requires the complete resulting tuple to be valid. Existing revision CAS and old-URL alias behavior remain intact.
- The owner form shows only the fields required by the selected filter and explains that URL segments are owner-chosen addresses, not forced copies of publisher or topic names.
- Journal Admin now exposes a derived queue for connected, admitted communities whose destination allowance remains unconfigured. Configured zero is not in that queue, and mutation remains disabled without the existing active operator grant.
- The owner destination page now distinguishes unconfigured allowance from configured zero with explicit status guidance.

Exact-postimage verification passed: 37 focused tests across the allowance and destination contract files, exact-path ESLint, `git diff --check`, and full TypeScript with a bounded 4 GB Node heap. The first unchanged TypeScript attempt exhausted Node's default 2 GB heap; the bounded retry passed. The React review found no added effect, unstable component definition, or derived-state synchronization issue. The maintained Help Center currently has no server-owner destination-authoring guide to correct; this batch changes the management contract and inline guidance without changing a documented member workflow, so no Help Center source was added outside the accepted path allowance.

### Independent review corrections

Shared's independent immutable source review returned `REVISE` with three P2 findings. The follow-on correction keeps the same runtime/test allowlist and makes no schema, route, provider, Stats writer or allowance-grant change:

- Create-time publisher, topic and Discord destination eligibility now execute inside the same immediate write transaction as capacity evaluation and insertion. The validation helpers enforce that write-boundary invariant at runtime.
- A legacy publisher-and-topic destination that lacks a second URL segment or topic can still submit unrelated edits without browser-required-field blocking. Existing valid destinations retain required controls, and deliberate tuple changes still require a valid complete tuple at the repository boundary.
- Journal Admin allowance-queue filters are disabled while any admission form is dirty, while a request is busy, or before hydration, matching the existing refresh and pagination preservation guard.

The correction adds focused transaction-boundary, rendered legacy-form and mounted dirty-form regression coverage. Verification is recorded only after obtaining the shared resource guards; the earlier packet's disclosed unguarded verification remains historical evidence and is not relabelled.
