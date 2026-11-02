# Watchlist two-owner controls restoration

Status: source correction and focused synthetic verification complete; Coordinator integration/build/hosted acceptance pending.

## Cause and scope

The existing Watchlist page allows the two configured active Discord identities.
Several Watchlist controls instead used Journal Administration authorization,
which depends on a different single-account operator grant. The security change
also imposed five-minute saved-membership freshness. Coordinator separately
rolled back that global change at `c5d8c0f10891a02a76eaeddff9fc829b9478bd7f`.
That rollback alone does not make the two different authority contracts agree.

This slice changes Watchlist authority only. Nine existing files now call
`withWatchlistAdminDatabase`, using the existing authenticated Platform identity
resolver and active Watchlist Discord allowlist. No new account, grant, cookie,
membership configuration, global authorization or database schema is introduced.
The existing validated local-development resolver remains unchanged.

Existing review actor `platform-owner:${scope.userId}`, Runtime signing/client
transport, route/method allowlists, mutation CSRF checks, access rate limit and
audit persistence remain. Audit records identify Watchlist administration with
`authenticated_user`, not a Journal administrator role. Member Premium/plan and
private-ticker checks are retained. No UI confirmation change is included.

## Source qualification

Assigned workspace: `/home/traderlink/projects/admin-watchlist-current`.
Baseline branch `codex/watchlist-owner-level-rows-20261020`, HEAD
`6629700b98b3b35dd10f39d5f71dbc9690dfc40a`; this is not the hosted baseline.
Coordinator ported three clean/absent route files from current `8ac0de9f` before
this correction. All nine existing implementation files were then verified
byte-for-byte against exact `8ac0de9f` with only the authorization import and
function-name substitutions. Their preimages are unchanged in hosted `c5d8c0f1`.
Unrelated dirty source and previous sandbox-hotfix preservation remain untouched.

Existing implementation allowlist:

- `app/api/admin/watchlist/analysis-visibility/route.ts`
- `app/api/admin/watchlist/gain-starting-point/route.ts`
- `app/api/admin/watchlist/manual-loss-post/route.ts`
- `app/api/admin/watchlist/potential-gain-post/route.ts`
- `app/api/admin/watchlist/runtime/[...path]/route.ts`
- `app/api/admin/watchlist/setups/results/route.ts`
- `app/api/admin/watchlist/setups/route.ts`
- `src/modules/watchlist/server/access/watchlist-analysis-visibility.ts`
- `src/modules/watchlist/server/access/watchlist-levels-visibility.ts`

New implementation/test:

- `src/modules/watchlist/server/access/watchlist-admin-authorization.ts`
- `src/modules/watchlist/server/access/watchlist-admin-authorization.test.ts`

## Verification

Focused Vitest: **21/21 passed**, 2026-11-02 02:25 UTC. Both allowlisted owners
remain authorized beyond five minutes without a Journal grant. Unlisted,
revoked, wrong-provider and missing/invalid authenticated identities are denied.
Client actor headers cannot substitute another user. Rate limiting and actual
same-origin/CSRF checks remain. Free members cannot access restricted tickers,
prices or levels; Premium members retain their access but not private tickers.
All seven route files use the Watchlist gate; the review actor expression remains.

Only session and database adapters are mocked, plus independent membership-plan
decisions in member-projection tests. Active-identity SQL, authorization helper,
rate limiter, audit repository and visibility functions run against an isolated
in-memory SQLite database. This is not owner-browser or real-session acceptance.

Test command: installed Vitest `startVitest("test", [
"src/modules/watchlist/server/access/watchlist-admin-authorization.test.ts"
], { root: assignedWorkspace, config: false, watch: false, environment: "node",
fileParallelism: false, maxWorkers: 1, server: { deps: { inline:
[/admin-watchlist-current/] } } }, { resolve: { alias: { "@": assignedWorkspace,
"server-only": assignedWorkspace + "/src/test/server-only.ts" } } })`, then
await context closure. Ran in bounded `watchlist-owner-auth-qa-20261102b.service`:
896 MiB memory, no swap, one CPU, Node heap 256 MiB, 180-second maximum.
Before imports verified the service's actual cgroup limits. Common exclusive
QA lock released after inactive unit/empty process closure. No listeners,
providers, hosted data or delivery effects. One earlier runner attempt failed
before tests because Vite aliases were in the wrong API argument; corrected
runner uses fourth-argument Vite overrides. Another duplicate service-name
attempt did not start. Neither is reported as an application failure or pass.

`git diff --check` passed. Exact nine-file preimage/substitution check passed.
Full current-source compilation and hosted owner acceptance belong to the
Coordinator integration lane, not this older preservation checkout.

Help review: existing Watchlist guides describe owner controls and member
restrictions; this restores that contract, without a new workflow or guide copy.
No Help edit is needed. Prior unfinished Help edits are preserved.

## Remaining release boundary

Coordinator owns commit, current-source integration, build and release. No
worker commit, push, deployment, settings/data edit, provider call, generation,
approval, publication or notification was performed. Hosted verification must
confirm both configured owners can access review/edit controls, not merely the
page. Member restrictions and `/api/platform/health` must remain intact. Do not
interpret this Watchlist-only fix as proof about browser cookie expiration.
