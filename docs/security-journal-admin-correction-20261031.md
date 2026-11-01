# Journal Admin security correction — 2026-10-31

## Scope and authority

Owner approved preparing the correction through native input on 2026-10-31.
Coordinator assigned `/home/traderlink/projects/security-journal-admin`, branch
`codex/security-journal-admin-20261031`, base
`923b7ba1c13836aa6aab1b325b7061c409f611fe`. This is the fetched source-control
base, not evidence of the current Railway deployment. The running preview and
all other workspaces remain outside the writable scope. Coordinator retains
Git, preview and release authority.

Selected existing Cloud findings:

- `csf_06cb27cb36c204bf3a3c6b60`: revoked configured Discord identity accepted.
- `csf_c2af68837e3567b6599a8fb5`: stale or superseded ownership accepted.
- `csf_a48c00a35d5dba834fd4ef51`: alternative owner evidence accepted.

These overlapping reports are addressed at one central authorization gate.
No new scan was started and no Cloud finding was closed.

## Approved correction

Production Journal Administration requires all of the following for the same
Platform user: the active configured Discord identity, request and stored
ownership of the configured guild, membership verification no more than
300,000 milliseconds old and not in the future, no matching absence event at
or after verification, and the existing active singleton operator grant.
An equal-time absence wins until a strictly newer successful verification.

The identity table's unique active user/provider index and the existing
disconnect lifecycle bind the user/guild membership to the active Discord
identity. Disconnect clears stored ownership before revoking the identity.
The correction does not revoke grants or change identity lifecycle behavior.

The existing admin denial code and access-denial audit remain in use. The
existing locked-admin screen offers **Refresh owner access**, linking to the
Discord login flow, which refreshes membership evidence on callback. After
five minutes, admin authorization requires that refresh. Missing configured
owner identity also denies access even when guild-owner flags are true.
Guarded loopback development authorization retains its separate boundary.
Ordinary member authentication and commercial access are outside this slice.

## Files and compatibility review

Exclusive allowlist:

- `src/modules/platform/server/administration/platform-admin-authorization.ts`
- `src/modules/platform/server/administration/platform-admin-authorization.test.ts`
- `docs/security-journal-admin-correction-20261031.md`

The page wrapper and API admin runtime use the same central gate. No schema,
migration, configuration, UI, membership helper, or callback edit is included.
The controlling [Journal Admin plan](migration/journal-admin-dashboard-plan.md)
already specifies the freshness requirement and reauthentication flow. Help
Center references were reviewed; they do not promise different admin access
behavior and need no change for this server-side enforcement correction.

## Verification status

Outcome: **locally verified; focused tests, lint, full TypeScript and clean production build passed**. Owner subsequently authorized all patches followed by coordinated QA. See the [complete correction and QA record](security-all-findings-correction-20261031.md).

Source inspection establishes the original missing active-status predicate,
alternative evidence condition and absent freshness/absence checks. The
candidate replaces these at the shared boundary. Independent read-only
boundary investigation confirmed the patch scope and existing recovery path.
A separate fresh read-only candidate review reported no concrete bypass,
regression or defective test. This is static review, not execution evidence.

Regression cases are authored for valid fresh evidence including exactly five
minutes, missing grant, missing/wrong configured identity, revoked identity,
disconnect state with an alternate session, stale/future membership, missing
membership, mismatched ownership flags, newer/equal-time absence, unrelated
user/guild absence, successful verification after absence, and protected local
development. All 20 authorization cases passed across the original 18 passing cases and a targeted rerun of the two corrected fixture setups. The complete QA record preserves the initial failures and limitations.

Focused tests, changed-file lint, full repository TypeScript and a sandboxed clean production build now pass under Coordinator resource admission. All 20 authorization cases remain covered. See the complete QA record for the one later transfer-test typing correction, successful affected checks, full gate commands, source identities and log hashes. No production appserver, migration or hosted mutation was run by this worker. Coordinator retains Git and release authority; local verification does not establish deployment or owner visual acceptance.

## Source fingerprints

SHA-256 of base files supplied by the Coordinator:

- Authorization: `88b9418612cb2ed52adc81d9966f30b94a5d4729114b96d2ce7a75796a2aad37`
- Tests: `2f9a7b1dc6f508ccd096b8ed29f422c8d9cbcb0c230dd0c30f3f72d95280d081`

Initial preparation source SHA-256 (historical checkpoint; later test-fixture corrections are fingerprinted in the full file manifest):

- Authorization: `a34a74fa696bfd204595ffb8f25b098f080652cf1ea6d28f36aa5af06c76e70d`
- Tests: `6051c89693b103adf83d0c71343ea55e08847721b53cf67318227f1a8fecf356`

An immutable patch and the final document digest accompany the Coordinator
handoff. Any subsequent change requires regenerated fingerprints and patch.
