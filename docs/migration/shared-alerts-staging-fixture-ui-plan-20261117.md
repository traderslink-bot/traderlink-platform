# Shared Alerts fixture browser adapter proposal — 2026-11-17

Status: Coordinator approved the bounded architecture and exact allowlist; local implementation and verification are complete. Installed staging/browser acceptance remains pending. [Phase-A protocol](shared-alerts-staging-fixture-protocol-20261117.md) remains the controlling test-authority contract. Phase A alone does not make the owner's two-account browser walkthrough available.

## Intended behavior

Use the existing Shared Alerts client controls with injected private test actions, read markers and navigation. Normal production defaults stay in place and normal pages/actions accept no fixture arguments. A clearly labeled private fixture community landing provides the synthetic publisher/composer and Back to Shared alerts link; Shared Alerts links back to that landing. It never grants the second user native owner access to the real Tests Community's manage pages.

The two logical community keys are Harbor and Northstar, bound to exactly two genuine authenticated native sessions and their approved subjects. Use the existing private coach/student browser states for automated QA. A future owner's browser session must be explicitly included in a freshly pinned manifest for its actual native session ID; do not copy tokens or claim that a different browser session already has this authority.

The existing client and read marker receive optional server-action/read/navigation bindings, with their exact normal defaults unchanged. Test actions resolve the genuine server-side run context and authenticate the actual caller before calling the separate synthetic model. The snapshot adapter maps only the two manifested logical keys to test UUIDs/labels and contract-shaped snapshots. Unknown native/community/request IDs fail closed. Unsupported fixture operations must be explicit; they cannot be silently treated as successful native operations. This is synthetic cross-community UI testing plus actual Tests transport, never real authorization over two foreign servers.

## Genuine in-process start and lifetime

An external Node controller cannot serialize or transfer the opaque parent/child into the Next.js process. Proposed private Core start POST: `/__private/community-staging-qa/[nonce]`, fixture purpose only, fixed Coordinator-managed private manifest paths/hashes, genuine existing Core session/audit frame, exact stage/source/image/schema/native ledger and request origin. Production/missing/wrong-mode targets return denial before opening fixture storage or provider work.

The start response holds a finite stream so the issuer's real Request signal remains live while the two pages are tested. Closing that controller or reaching 120 seconds cancels the parent and child. A module-private bounded registry keeps a single genuine opaque run, never globalThis or serialized authority. All entries are removed on cancellation/expiry. In-flight terminal provider receipts may settle their existing ticket; no subsequent operation can renew itself or continue after expiry. Actual browser behavior of the held issuer request must be verified; a startup response alone is not acceptance.

Private page: `/__private/shared-alerts-fixture/[runId]/[key]`. Normal authenticated request/session rules still apply to each GET and action, with exact origin and manifest binding. The page shows a test label and ActualDiscordIO destination. Any cached channel names must come from verified actual Tests inventory in that same finite run; every message send still freshly verifies the actual channel and both actual Tests memberships. Provider budgets cannot be expanded by a page refresh.

## Proposed file scope and preimages

Existing UI files:

- `app/(dashboard)/communities/shared-alerts/shared-alerts-client.tsx`: SHA-256 `335bd7ba562c49c1f37ab03c6cc354919c553b5c3f538899a5c8800907ad1f8f`.
- `app/(dashboard)/communities/shared-alerts/shared-alerts-read-marker.tsx`: SHA-256 `7fdefa2a4b7dbcd915331bcafbb297679404db96b70379a2670928dc681bc6f6`.
- `src/modules/communities/server/shared-alerts-staging-fixture-model.ts`: exact preimage at `3c1990f7f` (only fixture model extensions needed for the approved UI command inventory).

New paths (all absent):

- `src/modules/communities/server/shared-alerts-staging-fixture-controller.ts` and `shared-alerts-staging-fixture-snapshot.ts`.
- `app/(dashboard)/communities/shared-alerts/shared-alerts-bindings.tsx`, `shared-alerts-staging-fixture-community.tsx`, `shared-alerts-staging-fixture-actions.ts`.
- `app/%5F%5Fprivate/community-staging-qa/[nonce]/route.ts`.
- `app/(dashboard)/%5F%5Fprivate/shared-alerts-fixture/[runId]/[key]/page.tsx`.
- Focused controller/snapshot/action/browser drivers and a separate exact pre/postimage vector in `docs/migration/`.

No normal Community owner grant, authentication provider, canonical schema, production hook, source publishing permission, existing queue, global worker flag or generic cron path changes are proposed. A Coordinator-reviewed source/image integration and exact finite run manifest remain required.

## Required acceptance

Read the installed Next.js server-function/route guidance before implementing the new boundaries; apply the repository React checklist after editing the client components. Verify unchanged normal client defaults with appropriate source/component checks. Test wrong source/image/schema/ledger/native database/run/nonce/subject/session/account/key/channel, revoked parent/actor/session/publisher, canceled issuer stream, expired run and unrelated queued native work. Test private route denial on production and normal server actions ignoring/rejecting fixture parameters.

Use two actual native browser sessions to create/accept a request with an offered publisher, select an actual Tests channel, publish/review a test alert, verify visible provider receipts, pause/resume/revoke and check stale approvals. Exercise both Back to community and Back to Shared alerts links. Open a real hidden browser tab and verify read markers do not advance until the thread is visible; changing query props cannot reuse a previous acknowledgement. Preserve the exact source/image/run evidence for each case. End the finite run and prove no continuation/cleanup provider effect occurs. Synthetic fixture passes and actual native production-domain passes must be reported separately.

## Implemented controller protocol

The escaped physical `%5F%5Fprivate` directories route to URL `/__private` per the installed Next.js guidance. `startSharedFixture` accepts only the genuine nonce POST on that path. It resolves the public origin with the existing `resolvePlatformPublicOrigin`; internal Railway request URLs are canonicalized using the actual shared headers and abort signal, never arbitrary forwarded-host trust.

Root manages only these fixed server files beneath `/data/community-combined-review-20261117/shared-fixture-qa/`: `binding.json`, `run.json`, `fixture.json`, `principals.json`, optionally `lineage.json`. Binding contains `runManifestSha256`, `fixtureManifestSha256`, `principalManifestSha256` and optional `schemaLineageSha256`. All files are UID 1001/single-link/0600 with realpath/ancestor and FD consistency guards. Run and fixture hashes must match; clients cannot submit paths, pins, database names, principals or scopes. The unchanged original principal bytes may be copied to the fixed private path. Root seals source/image/schema/native-ledger and the actual browser session IDs before starting.

A single module-private entry owns the normal runtime database handle, genuine parent/child, verified actual Tests channel names and at most six initiating publication requests. Root must keep the authenticated start response stream open. The stream first returns only run links and source/build/schema/artifact hashes, then five-second keepalives. Abort, stream cancel or exact child deadline removes the registry, cancels authority and closes its owned handle. Restart or a different Next.js module instance fails closed. **Actual installed start/page/server-action registry identity is still mandatory acceptance; local module tests do not establish it.** No globalThis authority fallback is allowed.

Each public model operation authenticates the actual native actor and performs a fresh genuine Core/native-ledger/session check immediately before state work. The private state getter is not exported and follows that synchronous validation with no async gap. Redundant nested charges were removed after the real Core 120/minute limiter correctly blocked a discovery flow; its policy/limits were not changed or cached. Before and after asynchronous provider work, checks still run again.

Receiver approval uses the source's previously authenticated, server-private initiating request and revalidates that same actual source session. It does not impersonate the source with receiver credentials. Completed provider receipts survive issuer cancellation/expiry: the actual server-action result and test form show an explicit Delivered / Do not resend notice and actual Tests Discord link, without starting another operation. Failed/uncertain work is never automatically replayed.

Pending fixture forms disable their controls to avoid duplicate submissions. Normal pages/actions have no fixture imports or accepted fixture parameters. Main client/read-marker bindings default to their existing normal server actions. A private page injects only bound test actions/navigation. The real Tests Community's native ownership, roles, grants, memberships, native queues and canonical schema are unchanged. Synthetic fixture coverage is intentionally limited to two logical owners, one offered publisher per community, outbound offers and bounded single-post alerts; it does not replace native domain/multipart/foreign-server authorization acceptance.

## Verified local checkpoint

All eight affected drivers pass: 170 cases (19 composition, 21 common delivery, 15 Stats, 36 fixture, 40 capability, 20 operator, four current-source finite controller and 15 UI/controller adapter). Strict TypeScript passes for all eleven explicit runtime/UI inputs and their real transitive dependencies; temporary environment references use the installed Next/image SDK types, with no diagnostic waiver. All eleven inputs pass focused lint. The React checklist was applied: hooks stay unconditional, normal form action/default links remain intact, the optional snapshot identity is memoized, theme tokens inherit existing Light/Navy appearances, actual server actions reauthenticate, and no opaque/native object is serialized.

The actual headed Chromium prerequisite now passes: an authenticated user-local Xvfb display, native tabs in the same browser window, background `hidden`, activated `visible`, previous tab `hidden`. Playwright 1.59 enables artificial focus on its original CDP session (`crPage.js`); the driver disables that automation override on the original installed SDK session, then checks actual native tab activation. It does not redefine document visibility, freeze a page or synthesize a visibility event. The driver fails closed if that pinned SDK capability is unavailable. This about:blank prerequisite is **not** a completed Shared Alerts hidden-thread test.

[Exact phase-B pre/postimages](shared-alerts-staging-fixture-ui-vector-20261117.json). No staged build, installed registry qualification, actual two-account fixture walkthrough or actual fixture provider effect is claimed by this local checkpoint. Existing public Help Center guides need no product-flow change; the private pages themselves carry explicit synthetic/actual-Tests labels.

## Browser runner and remaining gates

Use `traderlink-browser-env node scripts/qa/shared-alerts-staging-fixture-browser.cjs --visibility-only` to qualify its authenticated display. Dependencies are user-local at `/home/traderlink/.local/opt/traderlink-shared-qa-xvfb`; no system package/service/root or public display port is used. Only its own authenticated X server is stopped on cleanup. A pinned private descriptor enables the actual stage run: exact staging origin, nonce, mode (`navigation-unread` or `delivery`) and expected source/build/schema/artifact hashes. The runner uses the existing private coach/student states, keeps the genuine issuer stream open and compares its actual installed pins. Run navigation/unread with zero permitted provider writes; run delivery with Root's exact separate finite write scope. Each new run needs a new manifest/nonce, not renewed authority.

Coordinator must integrate/review the immutable source, build/qualify the actual combined image, seal real private manifests and verify route/page/action registry identity. Then execute both actual modes, both back-navigation paths, actual hidden-thread unread behavior and actual Tests receipt/late-revocation cases. Independently run normal canonical Community Alerts/Watchlists owner/member/denied browser QA and rerun affected cases after the final combined image. Production and unrelated processes remain unchanged.

Metadata intake correction: Git ls-tree at base cc81185257d43e52ea97921f3a2051214a6fc713 proves both escaped new route/page paths ABSENT. Their beforeSha256 fields are null (not the empty-file digest). All eleven runtime postimages remain unchanged. The pre/postimage record digest changes from ffaf9657cc018950822a02000a08281e673094dfa6dd883df867b9ae4bc04ed6 to 5949603d24fbe551f9f379e0a505e0779cbd086d198cc30c3fa12bc23814d715; this is a documentation-only correction and does not reset runtime verification.


## Current functional acceptance continuation

The Coordinator-assigned0111 lane continues the complete Shared feature inventory and native/controller work in [Shared functional acceptance](shared-functional-acceptance-20261119.md). Historical fixture/browser evidence in this plan is preserved and does not establish acceptance of a newer image.
