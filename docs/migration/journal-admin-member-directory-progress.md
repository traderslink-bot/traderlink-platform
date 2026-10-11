# Journal Administration member directory

**Date:** 2026-10-10

**Status:** Local implementation complete; focused lint and TypeScript pass. Owner visual acceptance and hosted reconciliation pending. No deployment authorized by this record.

**Owner release authorization:** After receiving the local completion report,
the owner instructed this chat to send the work to the Visible release
coordinator for production deployment. That direct instruction supersedes the
earlier pending deployment gate. The coordinator owns release sequencing,
allowlisted publication, Railway health and hosted reconciliation; deployment
has not been performed by this implementation chat.

## Approved target

The owner approved the member summary, searchable directory, pagination,
compact combined filters, and consistent desktop/mobile membership, sign-in,
Academy and Journal details. The owner requested accurate totals and access to
every member, and a completion report before deployment.

Controlling documents: [Administration plan](journal-admin-dashboard-plan.md)
and [User Health plan](journal-admin-user-health-plan.md).

## Population and counting contract

- Platform members: every row in `platform_users`, including enabled, disabled,
  development and transferred accounts. No provider, Journal activity or plan
  requirement limits the default directory.
- Enabled and disabled partition that total; enabled does not mean online.
- Discord-linked: distinct Platform users with at least one Discord identity.
- Matching members: exact count using the same name/status/activity/view
  predicates as the directory, before pagination. Global summary ignores filters.
- Current plan grants: active entitlements started by the snapshot time and
  ending after it or without an end. All additive grants remain visible.
  Missing membership tables mean unavailable evidence, not zero membership.
- Discord server members who never registered a Platform account are outside
  this population. This work neither syncs nor invents such accounts.
- Overview Journal activation retains its accepted-execution definition;
  recent session activity appears separately with its own population label.
- The directory reads counts and displayed rows in one read transaction.

## Progress

- [x] Identify the hard-coded first-50 limit and unused continuation.
- [x] Add stable ordering, Previous/Next, matching count/range and safe page clamping.
- [x] Preserve combined name/status/activity/view filters across pages; Apply
  returns to page one and Clear returns to all members.
- [x] Add global summary and align overview populations and navigation labels.
- [x] Show all current plan names, sources and end dates without raw identities,
  payment/broker identifiers, internal UUIDs or private entitlement reasons.
- [x] Use the same fact presentation for desktop and mobile.
- [x] Preserve the existing audited private-detail and account-control gates.
- [x] Align Needs attention and Statement source filters with their displayed
  statuses, including onboarding attention and current broker-state precedence.
- [x] Review Help applicability: no public account/recovery flow changes;
  the private owner directory does not require a public Help guide update.
- [x] Finish focused lint, TypeScript and diff review.
- [ ] Owner visual acceptance on an authenticated review instance.
- [ ] Reconcile hosted members after an approved release. No live member total
  is claimed from local source inspection.

## Allowlist and shared-checkout note

- `app/admin/journal/users/page.tsx`
- `app/admin/journal/page.tsx`
- `app/admin/journal/journal-admin-ui.tsx`
- `app/admin/journal/journal-admin-shell.tsx` (Members label only)
- `src/modules/journal/server/administration/journal-admin-user-service.ts`
- This record and links in Administration plan, User Health progress,
  migration register and migration progress.

The canonical checkout remains on its existing `main` branch. Other work is
already mixed in this tree, including the admin shell and migration records;
preserve those earlier edits. No branch, worktree, commit, push, migration,
database mutation, runtime restart, test suite or production build is part of
this slice. Checks stay narrow for the owner's resource/testing instructions.
Deployment remains a separate coordinated owner gate.

## Local verification

- ESLint passed for the five changed TS/TSX implementation files.
- A scoped TypeScript program rooted at those same files completed with zero
  diagnostics, including their imported dependencies (1536 MB Node heap cap).
- Scoped whitespace/diff checks passed; review confirms the default query has
  no Journal/provider/plan exclusion and matching counts precede pagination.
- Basic counts avoid computing Journal activity aggregates; rendering and
  membership enrichment stay bounded to 50 members per page.
- No test suite, production build, browser/E2E run or live database inspection
  was performed. No hosted member count or rendered acceptance is claimed.
