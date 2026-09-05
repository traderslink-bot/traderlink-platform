# TraderLink Communities 1 Identity And Permissions Progress

**Status:** Foundation implementation assembled; owner review and later proof
gate remain

**Controlling plan:** [TraderLink Communities Partner Platform Plan](traderlink-communities-partner-platform-plan.md)

## Approved boundary

- Build community identity, verified membership, custom staff roles, exact
  capabilities, Discord-role mappings and authorization audit history.
- Every active member of the connected Discord server remains eligible for
  TraderLink; owners do not choose Platform-admission roles.
- The server owner chooses which Discord roles can open the server's private
  content. TraderLink only reads current verified roles and applies that map.
- Coaching payments, refunds and server-level revenue arrangements remain
  outside TraderLink.
- Do not implement customer-facing Communities pages in this slice.

## Implementation checklist

- [x] Add the additive Communities foundation migration and register its owned
  tables without disturbing concurrent migration work.
- [x] Add immutable capability keys and community-scoped contracts.
- [x] Add verified community-owner creation and active-member synchronization.
- [x] Add owner-controlled custom roles, capability grants, Discord-role
  mappings and member assignments.
- [x] Add effective-permission resolution with same-user multi-community
  isolation.
- [x] Add immutable authorization audit events.
- [x] Complete focused static verification without running Vitest or broad test
  suites during the active UI-first development cadence.

## Implemented files

- `src/modules/communities/contracts/traderlink-community-contracts.ts`
- `src/modules/communities/server/database/migrations/0121_traderlink_communities_identity_permissions.ts`
- `src/modules/communities/server/traderlink-community-repository.ts`
- Narrow registration additions in
  `src/modules/platform/server/database/platform-migration-manifest.ts`

## Current verification

- Focused ESLint passes for all three new Communities TypeScript files and the
  migration manifest.
- No Vitest, broad suite, build, database initialization, protected-database
  migration or live Discord operation was run.
- The later proof gate still needs disposable-database coverage for verified
  owner creation, role-derived access, role removal and same-user
  cross-community isolation before Communities 1 is marked complete.

## Current repository boundary

- Canonical repository: `C:\Users\jerac\Documents\TraderLink\traderlink-platform`
- Branch observed before implementation: `main`
- HEAD observed before implementation:
  `5018066fbeca3c88500bec4bcdac762b4936c875`
- The working tree already contains extensive unrelated staged, unstaged,
  deleted and untracked work. Only explicit Communities files and narrow
  migration-manifest additions belong to this slice.
- No push, deployment, production database operation or live Discord change is
  authorized.
