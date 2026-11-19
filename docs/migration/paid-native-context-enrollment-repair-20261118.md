# Native context enrollment repair

Source-only implementation in the Coordinator-assigned current a8db worktree. Staging remains frozen; Root owns Git and integration.

## Exact batch

- Change `src/modules/partner-alerts/server/partner-alert-request-writer.ts` only for the existing genuine operator `approvePartner` delegate. Its preimage SHA256 is `2d5144fc03135cfabeeaa345b7085e27476a6e7e3a42790e014e46f8b2eb8c60`.
- Add `src/modules/partner-alerts/server/partner-alert-context-onboarding.test.ts` for focused native Core/Auth/SQLite approval, rollback, replay and unsafe-history cases.
- Maintain this implementation record. No schema, admission contract, UI, new route/form/action, credentials, provider effect or worker startup change.

## Required behavior

Personal inspection, current approved channel/offer resources and existing native owner authorization run normally. Only first genuine partner approval may enroll an absent context, using existing `onboardCommunity` and server-owned configuration in the same Core/Auth transaction. Initial channel/offer reviews may already be approved; prior partner approval/activation and buyer/role/delivery history prohibit fresh enrollment. An existing matching context is preserved, a mismatched context holds, and a missing context on a previously approved partner stays held. Exact durable replay returns without re-enrollment. Failed approval or enrollment rolls back both partner approval and the new context; native Auth audit retains its normal semantics.

Tests will identify synthetic provider observations explicitly. Actual native Core/Auth/session/operator checks and registered SQLite execute; no test receipt is genuine staging, provider-payment or Discord proof. New tests use the assigned current source only, disposable data, zero network and explicit Node environment. Focused verification runs once at the coherent checkpoint under both shared resource guards.

Help Center audit: this internal enrollment fix preserves the existing application/review/approval workflow and introduces no user control or product policy, so it requires no guide copy change.

Implementation: the request writer delegates existing `approvePartner` through a private helper. It checks absent-context history without modifying it, executes the unchanged repository approval, then invokes the existing owner-only enrollment method. The enclosing request frame owns commit/rollback. No additional runtime files changed.

Verification history: the first test compilation exposed a duplicate fixture variable; the test exercise now has its own lexical block. The next run stopped during unrelated historical 204 qualifier-negative setup because its deliberately changed execution order collides with the current 205 ledger. The composed test now reuses only native initialization, omitting that historical negative block; current registered migrations and Core qualification still execute unchanged. Initial synthetic offer setup also attempted to add a benefit after approval; it now follows the real draft/benefit/approval order and preserves the trigger. These failed harness runs reached no approval and establish no positive approval passes. Guard-busy attempts did not run. A positive approval/replay smoke then passed. The next full run passed ten cases, with two harness corrections remaining: add the required normal owner mutation header, and expect the existing `invalid` outcome when the request authority expires. The runtime writer did not change during those harness corrections.

## Final local checkpoint

The final unchanged runtime writer passed the complete twelve-case suite on 2026-11-18 (Vitest start 20:27:25, duration 93.15 seconds). Cases cover first approval plus exact durable replay and changed-payload conflict; existing matching context with normal trigger generation increments; mismatched configuration; absent context after prior approval; activated mapping history; missing inspection; missing offer coverage; expired resource evidence; absent genuine operator grant; deliberate failure after the real enrollment insert; authorization expiry after that insert; and a normal community-owner draft save that cannot enroll context. Rollback cases verify the complete partner, inspection, context, command, partner audit and seller projections, while retaining normal native Auth audit semantics.

Targeted ESLint passed with no diagnostics. Strict TypeScript over the actual writer and test roots (1,100 source files in the transitive graph) passed with zero diagnostics. `git diff --check` passed. Checks ran sequentially under both shared resource guards, which were released at completion. No network request, hosted mutation, preview/build/install, schema edit, credential use or Git mutation occurred. All provider observations and initial review facts remain explicitly synthetic; these results are not staging, provider-payment, Discord or complete-feature acceptance.

Help Center source reviewed: `src/modules/help/paid-plan-guides.ts`. The existing application/approval controls and user policy are unchanged; no guide update is needed.

Ready for Coordinator source review and a narrow local commit of exactly this document, the request writer and the new context-onboarding test. Coordinator owns Git, integration and any separately authorized staging update. Current installed a8db remains unchanged, and no hosted draft command or operator-console enrollment was executed by this work.

## Subsequent bounded security-response repair

Root preserved the approval slice as local commit `464ce7154b63a2318387def04936290b3c24f535`. It remains unchanged. This subsequent slice is relative to that commit and changes only the HTTP adapter, its routing test, the explicitly approved runtime import/pre-refresh hunk, and this record. No Git action is authorized for this follow-up.

The actual a8 draft discovery run `14a1f059` returned 503 for a wrong origin and a missing mutation header. Before the HTTP adapter runs, the runtime calls `refreshPartnerAlertOwnerEvidence`. That helper calls the genuine `requirePlatformMutationRequest` for POST, then its blanket catch converts the recognized `TRADERLINK_WORKSPACE_ACCESS_DENIED` exception to `unavailable`. The runtime therefore returns 503 before the HTTP rejection mapping can run.

The new HTTP-owned helper calls that same security guard and maps only its recognized, actual platform access-denied exception to a private 403. It rethrows unknown exceptions. The existing runtime owner/configuration branch invokes it only for POST, immediately before refreshing owner evidence. Valid requests retain the same ownership refresh and all final Auth, admission and writer checks. The refresh helper, shared security guard and all other error mappings are unchanged. This helper supplies no identity or authorization capability.

Fifteen focused HTTP/guard tests pass (one file and worker, 10.70 seconds). Cases use the actual security guard and exception class: seven invalid-header cases, valid continuation, unknown/lookalike rethrow, preservation of another genuine platform error, forged-authority 403 before database/provider work, and the existing routing cases. Targeted ESLint over all three changed TypeScript files passes. The later explicit runtime hunk was source-approved by Root. Strict TypeScript over the actual runtime and routing-test roots (1,192 transitive source files) passes with zero diagnostics; its normal shared resource guards were released. No repeated approval suite or build is needed for this narrow slice.

The actual first draft command persisted its exact policy; the recovery path restored the original policy. Root independently reconciled two commands/two partner audits, revision 3 to 5, unchanged queues and protected projections, all seven POST attempts, and process/lease closure. The visible-only reload assertion was a harness data-readiness race, not evidence of lost database persistence. Forged-authority 403 is the intended existing contract. Replay, same-key conflict, stale revision and normal UI restoration were not reached and remain unrun.

The primary workspace has a new, unexecuted driver with explicit loaded-view, React hydration and exact-value waits plus the correct forged-authority expectation. Its old-a8 pins are historical preparation only. A changed application requires a new coherent qualified staging candidate and fresh exact runtime evidence; this source batch does not authorize an old-image retry. Old drivers, observations and private intents are preserved. No provider, role, approval, hosted configuration, production or new Auth action occurred during this repair.

Help Center audit: these changes restore correct security rejection and test readiness without changing the user workflow or controls. No guide copy change is required.


## Source extension: recognized stale draft revision

Root preserved the security-response slice as local `df081e0dc8c4c347b62427ef16c863ae4790cb6b`. The next delta is relative to that commit and retains the same four-file allowlist. Existing `98a80` independent acceptance covers the preceding slice, not this extension.

The full remaining-path source trace found a second status mapping defect before any new hosted run: `readVerifiedSource` compares the parsed expected revision with the genuinely preauthorized current partner revision, but raised a generic Error on mismatch. A new stale request key has no durable replay; the generic pre-provider error therefore became 503 before the repository's ordinary 409 path. This is a source finding, not an observed hosted stale-request result.

Only that exact mismatch now raises the existing nominal `PartnerAlertRepositoryError` with kind `conflict`. The HTTP mutation catch maps only a genuine instance with that kind to its existing private 409 response. Unknown errors, lookalikes and other repository errors keep their prior behavior. No ownership, preauthorization, revision comparison, source-name check, final writer or CSRF guard was removed or bypassed. No new request, provider I/O or schema was added.

Five new focused HTTP translation cases pass (8.69 seconds); the unchanged fifteen cases were skipped rather than rerun. The tests use the actual error class and genuine request parser/security checks, but explicitly stub the replay authorization port to isolate HTTP classification. They are unit evidence, not native owner/session/database acceptance. A recognized conflict returns 409 without reaching mutation or provider work; unknown, unavailable, other repository rejection and lookalike exceptions remain private 503. Targeted lint over the three changed TypeScript files passes. Strict TypeScript over runtime and routing-test roots (1,192 source files) passes with zero diagnostics. Shared normal guards closed after this single checkpoint. No build, new Auth, external network, hosted data, provider, role, Git or deployment action occurred.

The separately prepared finite32 driver keeps every named workflow case and the original 26/32 limits. Source accounting found the complete earlier driver required 33 requests once automatic UI reads finish. The new additive variant removes only the redundant immediate replay GET, retains exact replay-result equality and the later collective unchanged-revision read after replay/conflict/stale, and still requires Root's complete two-command/native-attempt proof. It also reads back the actual denied-consent expiry to cover the whole finite window, without injecting storage or suppressing requests. It remains unexecuted and bound to the historical image; current target selection and independent extension review remain Root-owned. No stale native or complete feature pass is claimed.
