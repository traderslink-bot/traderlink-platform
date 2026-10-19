# Discord disconnect releases the login — owner-approved scope

Status: source implementation drafted and statically reviewed; not deployable
until Coordinator reserves/registers its additive migration and reviews exact
current lineage. Source/staging handoff requests repeatedly returned empty final
responses. No hosted mutation, migration, tests, build or production change.

Owner approved: disconnecting Discord frees it to connect to another account;
preserve data/access, coordinate staging QA, production requires later approval.
This supersedes the abandoned test-account consolidation proposal. No accounts
are merged and Google/email ownership rules are not broadened.

## Required implementation

- Retain last-usable-method checks, protected owner safeguards and fresh OAuth
  plus authenticated destination-session link intent.
- Atomically clear old Discord role snapshots, revoke old Discord sessions,
  revoke the method and record a release with historical owner evidence.
- Permit only a released, revoked Discord method to be claimed by the freshly
  authenticated destination. An active method remains non-transferable.
- Preserve old account/workspace IDs, Journal data, purchases, trials and manual
  grants. Recompute only Discord-dependent access. Do not copy provider email
  claims or passwords, workspace memberships or sessions to the destination.
- Resolve the legacy platform_users original-provider reservation as historical
  only after a verified release. Runtime identity ownership remains authoritative.
- Preserve foreign keys, session history and audit history. Do not delete or
  recreate user accounts, rewrite prior migrations or disable database guards.
- Give a disconnected direct Discord login an actionable recovery message;
  never silently reactivate it on its former account or merge by matching email.
- Extend erasure handling if new history references both former/destination
  accounts. Existing profile-name protection must survive all transitions.
- Register one additive migration only after Coordinator reserves exact lineage.

## Complete staging acceptance inventory

- Disconnect with a usable alternative succeeds; last method is refused.
- Old Discord sessions stop working; alternative login and all old account data
  and independent access remain unchanged.
- Released Discord connects to a different authenticated account after fresh
  provider proof. Both providers show correct account details.
- Fresh Discord sign-in opens the destination, never the previous account.
- Previous account has no Discord method or Discord-dependent privileges.
- Active/unreleased subject cannot be claimed by another account.
- Stale/reused/wrong-session link intents fail with no partial ownership change.
- Same-account reconnect works; disconnect/release/claim can repeat safely.
- Concurrent claims cannot yield two owners; failed claim rolls back audit and
  identity changes together. Verify transaction/unique guards by source review
  and bounded staging fixture checks; no Vitest/local suite.
- Already-revoked staging Bullrun is handled without merging Jeremy Morrison.
- Profile custom names persist; release history and old revoked sessions remain
  attributed to their original account; protected owner cannot be reassigned.
- Mobile confirmation/recovery notice readable in Light/Navy Dark.
- Final fixture cleanup, exact staging SHA/deployment/schema/health/rollback
  evidence; production unchanged throughout.

## Diagnosis evidence

Readonly live staging lookup: Bullrun Discord identity revoked at
2026-10-19T05:38:01.450Z; verified email/password remains active. Production
identity active and direct Discord login browser-pass. Both environments use
the same Discord OAuth application with distinct correct callback origins.
Two separate TradersLink accounts are legitimate; this is release/relink
semantics, not a request to consolidate accounts.

## Source checkpoint

- Added release ledger and persistent original-provider release marker. Prior
  identities/sessions keep historical attribution; claims use the existing
  provider/subject key without deleting users or their data.
- Guarded database identity-owner changes require a recorded, consumed release,
  revoked Discord identity and no unrevoked sessions. Runtime requires fresh
  provider proof, destination link intent and old account's verified alternative.
- Active/nonreleased identities and protected initial-owner identities remain
  non-transferable. Same-account reconnect consumes its release too.
- Shared user lookup follows the active login owner rather than original signup
  metadata. Provider-name defaults and historical audit evidence are retained.
- Added explicit disconnected-login recovery text and disconnect confirmation
  explaining release/data retention. Account erasure handles release references.
- Eight exact TS/TSX files parsed without executing application/test/database
  code; zero syntax diagnostics. Allowlisted diff whitespace check passed.
- Not yet run: migration rehearsal, live disconnect/relink or acceptance matrix
  above. No readiness claim until migration integration and staging proof.

## Coordinator review correction / v2

Coordinator resumed normal replies and owns staging integration. Confirmed that
the existing permanent-erasure transaction suspends every BEFORE DELETE guard,
defers FKs, performs erasure, restores guards and checks integrity atomically;
the no-delete audit guards alone are not an erasure blocker. Made cleanup
explicit at the start of that transaction for release rows owned OR claimed by
the erased user. Generic user_id erasure removes only that user's original
release marker, keeping another surviving original owner's marker intact.

Runtime legacy-primary lookup audit: requireWorkspaceAccessScope and both Moomoo
Watchlist bridge lookups call PlatformUserRepository, now active-identity based.
Session resolution already joins active identity AND matching session user_id.
Reverse-split permissions and notification candidates already join active
identities. Admin owner uses platform_auth_identities, and the protected initial
owner subject cannot be moved. The remaining primary-user auth lookup in login
linking is deliberately historical and guarded by the released-origin marker.
Profile read's original provider is presentation fallback only (actual session
provider supplied). journal-development-owner-scope uses the fixed local
development seed provider/subject, not arbitrary Discord subjects, and stays
unchanged. Bootstrap/recovery scripts and historical migrations are not runtime
relink paths. No additional legacy-primary runtime authorization path found by
the bounded source searches. This is static review, not staging acceptance.

## Registered source / v3

Coordinator reserved 0176_platform_discord_identity_release / order189 after
actual staging predecessor0175/order188. Source registration adds only its
import, file entry and two managed tables; keep all newer staging manifest rows.
No migration applied. Coordinator separately identified a release policy
requiring staging to begin at current production source; existing staging and
production have diverged across469 paths. Source correction does not authorize
bulk reconciliation or overriding that policy. Exact deployment baseline needs
Coordinator/owner resolution before hosted action.
