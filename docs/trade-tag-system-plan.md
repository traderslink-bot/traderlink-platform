# Trade Tag System Plan

**Status:** Complete through usable Trade Tracker webpage
**Created:** 2026-07-30
**Parent feature:** [Day Session Page Plan](./day-session-page-plan.md)
**Progress:** [Trade Tag System Progress](./trade-tag-system-progress.md)

## Goal

Create the durable, owner-scoped tag system that Trade Tracker will use to
label individual governed completed trades. This checkpoint creates the tag
domain, storage, and private APIs. It does not add or change the Trade Tracker
UI.

## Controlling requirements

- Tags are created by the trader. They are never inferred from executions,
  prices, P/L, timestamps, or market context.
- Tags attach only to individual completed trades represented by governed
  `semanticRoundTripKey` values.
- Tags do not attach to tickers, entire trading days, executions, or open
  positions in this checkpoint.
- A trade may have multiple tags.
- A tag may be assigned to multiple trades.
- Renaming a tag changes its displayed name everywhere without rewriting every
  trade assignment.
- Traders can create, rename, assign, unassign, and delete tags.
- All reads and mutations are private and owner-scoped.
- Tags do not alter governed executions, reconstructed trades, P/L, analytics,
  or evidence.

## Complete checkpoint inventory

This checkpoint includes:

1. tag definition contract and validation;
2. trade-tag assignment contract and validation;
3. owner, workspace, and trading-account scope;
4. SQLite schema and repository interface;
5. configuration for the private V3 journal database;
6. create, list, rename, and delete tag operations;
7. assign, list-by-trade, replace-for-trade, and unassign operations;
8. governed trade existence and ownership checks before assignment;
9. optimistic revision checks for stale mutations;
10. duplicate-name and duplicate-assignment protection;
11. explicit deletion behavior for tags that are already assigned;
12. private non-cached Route Handlers;
13. route-containment classification;
14. stable response and error contracts;
15. a read service that can later join tags into Trade Tracker;
16. focused contract, repository, authorization, and service checks at the
    implementation checkpoint;
17. progress and parent-plan updates.

The following remain in the product inventory but are deferred:

- Trade Tracker tag chips, picker, and creation UI;
- tag-management UI;
- Trade Explorer tag filters;
- tag-based analytics and coaching;
- bulk assignment;
- automatic or AI-suggested tags;
- trade-identity reconciliation after an import correction changes a
  `semanticRoundTripKey`;
- PostgreSQL/hosted persistence adapter;
- production deployment.

## Domain contract

### Tag definition

```ts
type TradeTagDefinition = {
  contractVersion: "ti_v3_trade_tag_definition_v1";
  tagId: string;
  name: string;
  normalizedName: string;
  colorKey: string | null;
  createdAt: string;
  updatedAt: string;
  revision: string;
};
```

- `tagId` is an opaque generated identity and never changes.
- `name` is the trader-facing label after trimming and whitespace
  normalization.
- `normalizedName` is a case-folded uniqueness key. `Gap Up` and `gap up`
  cannot coexist for the same owner scope.
- Names must contain 1-40 visible characters.
- Control characters and leading/trailing whitespace are rejected.
- `colorKey` is nullable and limited to an approved token set. The initial API
  may leave it `null`; raw CSS values are not accepted.
- Timestamps use the V3 canonical UTC nanosecond string format.
- `revision` is an opaque optimistic-concurrency token.

Initial limits:

- maximum 200 tag definitions per owner scope;
- maximum 10 tags on one trade;
- maximum 40 visible characters in a tag name.

### Trade-tag assignment

```ts
type TradeTagAssignment = {
  contractVersion: "ti_v3_trade_tag_assignment_v1";
  tagId: string;
  semanticRoundTripKey: string;
  sessionDate: string;
  createdAt: string;
};
```

The persisted row also carries owner scope. An assignment is accepted only
when the current verified V3 dataset contains the supplied
`semanticRoundTripKey` within the same canonical owner, account, and
`sessionDate`. Client-supplied ticker, P/L, direction, or timestamps are never
stored as tag authority.

## Owner scope

Every definition and assignment is scoped by:

- `userId`;
- `workspaceId`;
- nullable `tradingAccountId`.

The initial private-owner application maps the authenticated V3 owner to the
primary workspace and currently governed account scope. Every repository query
includes the complete owner scope. Unknown and foreign IDs return the same
unavailable response so the API does not disclose their existence.

## Persistence design

The tag system uses a repository interface with a SQLite implementation for
the current local private-owner application. It stores journal-authored data in
a dedicated V3 journal database configured outside the repository. It does not
write tag data into imported execution storage, analytical snapshots, the
trading-rules database, legacy saved-trade tables, or preview fixtures.

Proposed tables:

```sql
CREATE TABLE ti_v3_trade_tags (
  tag_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  trading_account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  color_key TEXT,
  revision TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (user_id, workspace_id, trading_account_id, normalized_name)
);

CREATE TABLE ti_v3_trade_tag_assignments (
  tag_id TEXT NOT NULL REFERENCES ti_v3_trade_tags(tag_id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  trading_account_id TEXT NOT NULL,
  semantic_round_trip_key TEXT NOT NULL,
  session_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (
    user_id,
    workspace_id,
    trading_account_id,
    semantic_round_trip_key,
    tag_id
  )
);
```

Supporting indexes cover tag lists and all assignments for a trade. SQLite
foreign keys are enabled and mutations affecting definitions plus assignments
run transactionally.

The proposed configuration key is
`TRADER_INTELLIGENCE_JOURNAL_DB_PATH`. Real-owner mode fails closed when its
private path is missing or unsafe. Sample/design-preview mode never opens or
writes this database.

## Mutation behavior

### Create

- Normalize and validate the name.
- Reject a case-insensitive duplicate with `409`.
- Enforce the owner tag limit.
- Generate the opaque tag ID and revision on the server.
- Return the created definition.

### Rename

- Require `tagId`, the new name, and `expectedRevision`.
- Reject stale revisions with `409`.
- Reject a normalized-name collision with `409`.
- Preserve `tagId` and all existing assignments.
- Advance `updatedAt` and `revision`.

### Assign

- Require `tagId`, `semanticRoundTripKey`, and `sessionDate`.
- Confirm the tag belongs to the authenticated owner scope.
- Confirm the governed completed trade belongs to the same owner/account/day.
- Treat an already-existing identical assignment as an idempotent success.
- Reject the mutation when the trade already has 10 tags.

### Replace tags for one trade

- Require the complete desired `tagId` set for the trade.
- Validate every tag and the governed trade before writing anything.
- Add and remove assignments in one transaction.
- This is the preferred future picker-save operation because it cannot leave a
  half-updated selection.

### Unassign

- Remove only the requested owner-scoped trade/tag relationship.
- Treat an already-absent relationship as an idempotent success.
- Never delete the tag definition.

### Delete

- Require `tagId` and `expectedRevision`.
- If the tag has no assignments, permanently delete it.
- If the tag is assigned, return `409` with `assignmentCount` unless the
  request includes `confirmAssignedDeletion: true`.
- Confirmed deletion permanently removes the definition and all assignments in
  one transaction.
- Deletion never changes governed trade records.

## Private API contract

All routes use `withTraderIntelligenceOwnerRoute`, private no-store response
headers, origin validation for mutations, Node.js runtime, and route
containment.

Proposed endpoints:

- `GET /api/intelligence/trade-tags`
  - list tag definitions with assignment counts;
- `POST /api/intelligence/trade-tags`
  - create a definition;
- `PATCH /api/intelligence/trade-tags/[tagId]`
  - rename or later change an approved color token;
- `DELETE /api/intelligence/trade-tags/[tagId]`
  - delete with revision and assigned-tag confirmation behavior;
- `GET /api/intelligence/trades/[semanticRoundTripKey]/tags`
  - list tags on one governed trade;
- `PUT /api/intelligence/trades/[semanticRoundTripKey]/tags`
  - atomically replace that trade's complete tag set.

Dynamic route parameters are awaited according to the installed Next.js Route
Handler contract.

Every success response carries an explicit contract version. Errors use stable
codes and trader-safe messages. The initial error inventory includes:

- invalid JSON or request shape;
- invalid or duplicate tag name;
- tag limit reached;
- trade tag limit reached;
- tag unavailable;
- governed trade unavailable;
- session-date mismatch;
- stale revision;
- assigned-tag deletion confirmation required;
- journal persistence unavailable;
- mutation rejected.

## Trade Tracker integration boundary

This checkpoint exposes a server-side read service:

```ts
readTradeTagsByRoundTripKeys(owner, governedRows)
```

It accepts already-authorized governed rows and returns definitions grouped by
`semanticRoundTripKey`. It does not read or reconstruct trades itself.

The later UI checkpoint calls this service while building the Trade Tracker
day view and replaces the current placeholder `tags: []`. Preview fixtures
remain static and never touch persistence.

## Correction and orphan behavior

The initial authority is the current governed `semanticRoundTripKey`. If an
import correction later removes or changes that key:

- old assignments remain stored for audit and reconciliation;
- normal Trade Tracker reads do not attach them to a different trade;
- writes cannot target a missing governed key;
- no automatic fuzzy remapping occurs.

A later governed reconciliation checkpoint may remap journal writing using
source execution identities, but it must never guess silently.

## Implementation checkpoints

1. **Contract approval**
   - Review and perfect this complete plan.
   - Lock deletion semantics, limits, owner scope, and API shape.
2. **Domain and persistence**
   - Add contracts, validators, repository interface, SQLite schema, and
     configured private database resolution.
   - Add transactional create, rename, assignment, replacement, unassignment,
     and deletion behavior.
3. **Private service and routes**
   - Add owner-guarded services and Route Handlers.
   - Add governed round-trip validation and route containment.
   - Add the Trade Tracker join service without changing UI.
4. **Focused verification**
   - Run only tag contract, repository, service, and owner-boundary checks.
   - Do not run broad Vitest, browser, build, or CI suites at this checkpoint.
5. **UI design**
   - Design applying, creating, and managing tags on `/trade-tracker`.
   - Present the visual slice and stop for owner approval.
6. **UI connection and acceptance**
   - Connect the approved interface.
   - Run broader verification only at the explicit acceptance boundary.

## Completion

Completed on branch `codex/trade-tags`:

- durable owner-scoped tag definitions and trade assignments;
- one-time starter catalog of setup and execution tags that can be renamed or
  deleted like trader-created tags;
- create, list, rename, replace-assignment, unassign, and confirmed-delete
  behavior;
- private V3 tag APIs and route containment;
- governed round-trip validation before writes;
- direct tag reads in the Trade Tracker server projection;
- create/select/save controls on individual trades;
- global tag rename and deletion controls;
- focused ESLint and TypeScript verification;
- browser verification of create, assign, rename, and confirmed deletion
  against the protected local dashboard.

No Vitest, broad regression, build, CI, or production deployment was run.
