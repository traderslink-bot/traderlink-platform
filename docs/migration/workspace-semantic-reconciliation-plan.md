# Workspace semantic reconciliation plan

**Status:** Owner-approved Workspace bundle in guarded production integration; the Release Coordinator owns the single production lane.

**Progress record:** [Workspace Semantic Reconciliation Progress](workspace-semantic-reconciliation-progress.md)

## Objective

Rebuild /workspace from the verified production parent beb6aa0a6ceff4f444e483f65be7ee7ff192f327 as the selected account's bounded trade library. Preserve one server-authoritative period and selected Gross/Net basis population across the five cards and the initial library read. Add the owner-approved atomic edit of an eligible existing trade in its single shared drawer.

## Source reconciliation

The historical chain `1329fc0b` through `a9bd633f` is reference-only. It is not a merge or cherry-pick source. Selectively recreate only these approved contracts:

- period selector -> period URL -> server date range -> the same range for P/L, Win rate, Best trade, Worst trade, Trades, and the first library page;
- server-resolved selected account, reporting basis, opaque account/current-version/member references, and cursor-bound continuation;
- compact desktop library, purpose-built mobile summary, shared Trade/Journal/Analyzer drawer, and lazy saved-trade context;
- established restrictions for imported, provider, demo, reconciled, protected, unresolved, stale, or cross-account facts;
- factual Gross Gain/Loss values in the table, with positive and negative values shown green and red;
- the existing Analyzer outcome and offline period/basis identity.

Do not copy the historical deletion ancestry, hosted configuration, data, account authority, or unrelated dark-appearance work. The derived projection source is manually reconciled as its exact 0100–0102 bundle and the current production implementation's Dark behavior is retained.

Production already applied the unrelated `0103` and `0104` migrations before
this Workspace bundle. To retain the verified prefix contract, the identical
Workspace migration statements retain their IDs but are carried as the guarded
production tail with execution orders 105 (`0100`), 106 (`0101`), 107 (`0102`),
and 108 (`0108`). This is a release-order compatibility record only; it does
not alter Journal facts or migration SQL.

## Atomic existing-trade edit contract

One saved-trade drawer session supports eligible symbol and trade-type changes, edits to existing executions, eligible removals, and appended executions. The browser sends one complete draft only after a current server-issued snapshot. The server returns one authoritative preview, binds confirmation to it, and applies the confirmed draft in one transaction or applies nothing.

The post-rebuild result may stay closed, reopen, split, merge, or alter nearby boundaries. The drawer shows only these approved sentences beside **Save changes** after the authoritative preview:

- `This update keeps the trade closed.`
- `This update leaves the trade open.`
- `This update creates multiple trades because the position reaches zero and then opens again.`
- `This update merges trades.`
- `This update changes nearby trade boundaries.`

On desktop, Ticker and Trade type are content-sized. Each execution keeps Date,
Time, Buy/Sell, Shares, Price, and Fee on one compact line; mobile reflows the
same fields without reducing their usable input size.

## Initial implementation allowlist

- `app/(dashboard)/workspace/page.tsx`
- `app/(dashboard)/workspace/workspace-dashboard.tsx`
- replacement Workspace library/client/drawer files required by the selected implementation
- scoped Workspace read/action/route files required for period paging and atomic preview/confirm/save
- scoped Journal manual-trade services/repositories required for the all-or-nothing edit
- this plan, its progress record, and its migration-progress link

The exact source allowlist will be narrowed before a local checkpoint. No migration, data, configuration, staging, push, deployment, restart, or local server is in scope.

## Bounded-library reconciliation allowlist (read-only audit)

This is an integration checklist. It authorizes the local source reconciliation
only; it does not authorize applying any migration or taking a hosted action.
The Release Coordinator must preserve the production-base
manifest entry for `0103_platform_appearance_preferences`; the historical
reference predates it and therefore removes it incidentally.

1. Schema bundle, always together:
   - preserved `0100_journal_workspace_trade_library_projection.ts`
   - preserved `0101_workspace_trade_library_sort_facts.ts`
   - preserved `0102_workspace_trade_library_hold_duration.ts`
   - their historical imports, entries, and managed-table registration in
     `platform-migration-manifest.ts`, followed by 0103.
2. Derived-runtime bundle, always after the complete schema bundle:
   - `workspace-trade-library-projection.ts`
   - the minimal projection refresh hook in
     `journal-round-trip-repository.ts` and
     `journal-round-trip-service.ts`.
3. Bounded host bundle:
   - `workspace-trade-library.ts`, its actions, client, filter drawer, drawer
     event, and the minimal `page.tsx`/`workspace-dashboard.tsx` mount changes;
   - this atomic drawer component and its three snapshot/preview/commit routes.

The focused proof fixtures must cover migration manifest/table registration,
complete-schema materialization, account-isolated refresh, opaque revision and
query-bound cursor rejection, no eager fallback when a projection revision is
missing, draft replay/staleness rejection, rollback on any retained/new/removed
row failure, and the five factual preview classifications. Browser review comes
only after the bounded host is mounted on staging.

## Review gates

1. Record source reconciliation and progress without modifying the two historical reference records.
2. Obtain owner review of the directly inspectable shared-drawer composition.
3. Implement in meaningful batches, retaining strict account/version/authority checks.
4. Run only targeted static and diff checks; no Vitest, broad test, build, install, or local server.
5. Create a narrow local checkpoint only after the owner-reviewed slice is complete; the release coordinator owns any later release action.
