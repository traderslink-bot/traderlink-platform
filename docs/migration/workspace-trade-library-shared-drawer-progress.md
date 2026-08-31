# Workspace Trade Library Shared Drawer Correction Progress

**Status:** In implementation

## Owner-approved behavior

The authenticated left-navigation `Add/Edit Trade` action and Workspace `+ Trade`
action use the same Workspace drawer shell. The shell always shows Trade,
Journal, and Analyzer. A new trade opens Trade; Journal and Analyzer are visible
but disabled until a successful server save supplies one current saved-trade
target. No pre-save Journal draft, draft storage, draft button, or placeholder
copy is added.

After save, the drawer stays open only when the server confirms exactly one
current affected trade. In that case Trade, Journal, and Analyzer are all
enabled for that returned target. Zero or multiple affected targets refresh the
server-authoritative list and close the drawer; the browser never picks a newest
or otherwise guessed trade.

## Source reconciliation and allowlist

`app/dashboard-shell.tsx` already opens the shared `WorkspaceTradeDrawer` from
the left navigation with its authenticated entry context. Workspace `+ Trade`
already dispatches that same global event. The only visual gap was that new-entry
mode did not use the saved-trade tab shell.

The existing command service calculates opaque, account-scoped affected position
references but the Workspace commit response did not expose them or a bounded
server-rendered saved target. The correction returns those existing opaque refs
and, when exactly one target is affected, one current Workspace row resolved
inside the authenticated server path. Raw target identifiers never leave the
commit contract as a selection mechanism.

Allowlist:

- `app/(dashboard)/workspace/workspace-trade-library-client.tsx`
- `app/(dashboard)/workspace/workspace-dashboard.tsx`
- `app/(dashboard)/workspace/workspace-trade-library.ts`
- `app/api/platform/journal/workspace-trades/commit/route.ts`
- `src/modules/platform/client/pwa/manual-trade-outbox.ts`
- `src/modules/journal/server/manual-trades/journal-manual-trade-command-service.ts`
- `docs/migration/workspace-trade-library-plan.md`
- `docs/migration/workspace-trade-library-progress.md`
- this progress record

No standalone manual-entry component, generic manual-trade route, database
schema, migration, configuration, data, staging, deployment, or release file is
included.

## Safety invariants

- The existing mutation request, request-scope, selected-account, signed
  preview/commit recomputation, and reconciliation paths remain unchanged.
- Affected-trade refs are existing opaque HMAC references bound to the account
  and current version; the response contains at most one rendered target row.
- The target row is resolved only after the commit, using the same selected
  account and exact current round-trip/version pair. A changed, absent, or
  multiple target never selects a row in the browser.
- Existing decision and Analyzer outcomes are retained. Demo/account isolation
  and mobile full-width drawer behavior remain unchanged.
- A multiple-target save closes the drawer, refreshes Workspace, and shows only
  the owner-approved message plus its `Open Day Trade Tracker` link. It is not
  shown for a single target or a zero-target outcome.

## Verification

- Pending focused source and Git diff checks only. No server, test, install,
  build, migration, data action, staging, deployment, push, or release action
  is authorized.
