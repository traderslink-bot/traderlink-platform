# Discord New-User Login Recovery Progress

**Status:** Source and focused verification complete; production release pending.

## Approved correction

- Preserve the existing Discord OAuth client, callback, scopes, session creation and eligible-member Workspace destination.
- Stop OAuth cancellation and failure states from returning to a protected dashboard route that immediately starts OAuth again.
- Repair the `/access-required` server/client rendering boundary.
- Give authenticated users without dashboard access a clear path to join the free TradersLink Discord and retry authorization while the plan catalog is empty.

## Implementation

- OAuth failures now land on `/sign-in-help` with status-specific guidance, retry, Join Free Discord and beta-return actions.
- Explicit `prompt=consent` retries bypass the existing-session shortcut so Discord membership can actually refresh.
- Users who authenticate successfully but do not have dashboard access now land on `/access-required`, which renders with normal anchor-backed MUI actions and preserves the requested return route.
- The empty plan catalog now explains that plans are coming soon and offers Join Free Discord plus a real authorization retry.
- No OAuth identity, scope, callback, session, database, migration or hosted configuration changed.

## Verification boundary

- `git diff --check` passed.
- Focused TypeScript transpile/syntax checks passed for all seven changed TypeScript/TSX source files.
- The Help Center's existing membership guidance remains accurate; this temporary empty-catalog and sign-in recovery correction does not require a guide update.
- No Vitest, broad suite or local server was run.
- Hosted build, public route checks and authorized-account login remain release gates.
