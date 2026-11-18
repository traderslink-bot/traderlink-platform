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
