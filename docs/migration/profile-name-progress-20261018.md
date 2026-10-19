# Unique editable profile names

Status: source implementation complete; deployment/browser acceptance held. No deployment, hosted
migration, runtime change, test suite or build authorized for this slice.

## Controlling owner-approved inventory

- Profile page: editable **Profile name** and **Save**, inline success/error.
- User-saved names take precedence permanently over Google/Discord evidence.
- Before a custom name is saved, prefer connected Discord, then Google, then
  the existing profile name. Provider account labels stay on Login methods.
- Names are unique ignoring capitalization and surrounding whitespace.
- Reject a claimed name with **That profile name is already taken.**
- Preserve all users, sessions, identities, connections, workspaces, Journal
  data, purchases, grants and access. Never use a display name as identity.
- Check existing duplicates read-only. Owner reports no duplicates among the
  accounts that use the app; do not rename accounts or turn setup into a block.
- Coordinate source ownership and additive migration identity with Coordinator.
- No deployment until the owner approves this complete slice.

## Implementation boundaries

Add custom-name ownership storage with a unique normalized key, preserving the
historical migration ledger. Perform name availability and update in one SQLite
write transaction. Compare legacy names too, so an unedited existing account's
name cannot be claimed by another account. Keep login successful on provider-name
collisions; existing accounts retain their names. New accounts can receive an
available default until the member saves their own name. Provider fallback must
not bypass custom-name protection. Keep name validation bounded and server-side.

Keep the provider's display name separately from its login username, bound to
the active provider subject. Legacy Discord membership labels are usable only
when their username matches that active identity's profile. This avoids showing
an old disconnected account's name. New names are NFKC-normalized with normalized
spacing and lowercase comparison; saved capitalization is retained.

Correct Profile's misleading authentication label to use the actual active
session provider, separately from the profile name. Existing account/settings
authorization remains unchanged. Save uses the signed-in user's server-derived
scope, never a user ID supplied by the browser.

## Progress

- [x] Owner approved UI and naming policy.
- [x] Read-only source trace: each provider sign-in currently overwrites the
  shared name; Profile labels the original provider rather than active session.
- [x] Source schema confirms display names currently have no uniqueness rule.
- [x] Coordinator reserved this source slice exclusively to Membership root.
- [x] Revised migration `0175_platform_profile_name` / order188, after
  Stats0174/order187 (Coordinator sequencing correction). Final lineage reconciliation remains required.
- [x] Read-only production duplicate audit: all95 accounts/active95/currently
  signed-in60 each have zero normalized duplicate groups. No names/IDs exported.
- [ ] Staging-only fixture duplicate counts, deferred while Stats owns QA.
- [x] Implement storage, unique save, provider precedence and approved UI.
- [x] Review exact changed source without tests/builds or a local server.
- [x] Report completed corrections and pending staging acceptance to owner.
- [ ] Owner-authorized staging deployment and browser acceptance (held).

## Source review evidence

Twelve source files parsed for syntax without executing application, test or
database code; zero parser diagnostics. Targeted diff whitespace review passed.
No Vitest, tests, full typecheck, build, server, migration or deployment run.
Migration has two statements: optional provider display-name column, plus empty
custom-name ownership table. Checksum
`c07994cd6a6402cf28c26aebd5088493a19c936dd85c39c3617567305ba24918`.
Generic account erasure already deletes user_id-owned rows, so the new ownership
row follows existing account erasure without a new retention exception.

## Existing-account audit

Coordinator ran the aggregate-only reader at `2026-10-19T00:39:19Z` (October18,
8:39pm Toronto). Production service deployment
`bbfe736b-2355-47ad-9da3-31ada6117d1a`, instance
`15fdc90e-d617-4bbf-94c8-d2498cc5d1ab`, schema140. BetterSQLite readonly/fileMustExist,
query_only=ON and helper guards passed. All stored accounts95, active accounts95,
accounts with current valid sign-ins60: every population has zero duplicate
groups and zero users in duplicate groups under the new name normalization.
No names, emails or IDs returned. Deployment/instance/public200ready/schema140
unchanged afterward. This confirms the owner's existing-account check; it is
production-only evidence, not a claim that staging fixtures were audited.

## Handoff and remaining acceptance

Small source-only patch and complete allowlist are in the assigned ignored QA
directory. Base accepted Membership sourcefdc183aa; merge only the three new
manifest registration lines and preserve Stats0174 and independently staged0173. No commit,
push, normal-index or branch change. Owner approval is required before deploying.
After approval, staging needs the actual Save success, duplicate/case/space
rejection, Google/Discord persistence, provider fallback, current-session label
and mobile/Light/Navy Dark checks. These have not been claimed as passes.
