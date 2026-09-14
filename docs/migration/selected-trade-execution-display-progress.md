# Selected-trade execution display repair

## Controlling owner instruction

The owner narrowed the earlier [identity audit](trade-identity-audit-progress.md):
when a trade is selected, its execution list and detail cards must show that
user-defined trade, not only one underlying round trip or a different trade.
No new coverage notices, PDF notices, broad analytics calculation changes,
membership editing/deletion changes, or summary/filter changes are included.
The owner authorized focused testing and coordinator production handoff while asleep.

## Confirmed defects and corrections

- Explorer inline execution expansion, Calendar side card, Analytics trade-detail
  drawer and ticker drawer supporting detail requests used a representative member
  ID against a per-member endpoint. They now explicitly request `selection=trade`.
- The server resolves either the selected member or a logical ID under the
  authenticated active account. Current declared membership, active membership,
  member versions and execution reads share one read transaction. The response
  retains the requested selection ID. Missing members never become a successful
  first-member-only list. Existing error treatment is unchanged.
- Every allocation row is preserved, including separate equal-looking fills and
  different allocations of the same execution. Ordering is chronological, then
  member order, then the existing SQL allocation order. No quantities are summed,
  deduplicated or changed. Reporting-currency handling is preserved per member.
- Without `selection=trade`, the endpoint retains its existing per-member contract.
  Existing notes, tags and review behavior are unchanged in this repair.
- Calendar validates response identities and does not replace an existing complete
  row with a shorter lazy list. Aborted old requests cannot write new selection state.
- The shared Trade Details drawer already reads every member through
  `readJournalTradeStory`. Its completion callback nevertheless wrote state after
  abort: executing the actual callback with an aborted signal reproduced an OLD
  trade state write. The only shared-drawer change guards success/error callbacks.
- The shared drawer is used by Workspace, Explorer, Green-to-Red and Profit Zones.
  No new layout, styling, controls or visible copy is introduced.

## Verification

- Local implementation checkpoint complete: two focused files, 23 tests pass
  with one worker and a 512 MB Node ceiling. Hosted acceptance is still pending.
- Focused membership tests use isolated in-memory SQLite with the real helper SQL.
  They cover grouped/singleton, logical/first/later-member IDs, account/workspace
  separation, missing/stale/conflicting membership, intentional revised membership,
  and allocation-preserving ordering.
- Route tests use a mocked authenticated reporting/database boundary with real
  response construction. They cover default compatibility, whole-trade responses,
  requested identity echo, split allocations and incomplete response failure.
- Client tests execute actual extracted Calendar/shared-drawer completion bodies
  for rapid selection and smaller/mismatched responses. Source contracts inventory
  all four endpoint consumers and the existing shared whole-trade story reader.
- The race test failed before its two-line guard and passed afterward.
- Targeted ESLint: no errors; existing Calendar `weekStart` unused warning remains
  unchanged from production. Helper/tests strict TypeScript passed; all eight
  TypeScript/TSX files pass syntax transpilation. Full application typecheck/build
  and hosted acceptance belong to the coordinator release checkpoint.
- Help reviewed: existing guidance already promises the selected trade's executions.
  This restores that behavior without changing a user workflow or requiring new Help copy.

## Release boundary

Release parent: `aea5bb2b24c3b27f9a221419e67b5ee8ad042c39`.
Exactly nine files: the endpoint; selected-trade-execution-members helper/test;
Explorer client; Calendar client; Analytics trade-detail drawer; shared Trade
Details drawer abort guard; selected-trade-execution-contract test; this record.
All existing changed files match the production parent before this patch. The
standalone release tree must contain only these files and exclude held commits
`a97c682a`, `9ddff253`, `977d9454`, `9943dc5d`, and `28aed908`.
No schema changes, migrations, provider requests, live-data edits or worker deploy.

Coordinator hosted acceptance: select a known multi-round-trip trade in Explorer,
Calendar and Analytics drawers; compare every execution/time/side/quantity/price
against its Workspace Details; repeat for a singleton and another trade in the
same ticker; switch selections rapidly and close/reopen. Confirm the same trade
remains selected, no missing/duplicate allocations, existing appearances/layouts
unchanged, and health remains ready. This is not app-wide audit completion.
