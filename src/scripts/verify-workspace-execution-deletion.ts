import { strict as assert } from "node:assert";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  narrowWorkspaceAccessToAccount,
  type WorkspaceAccessScope,
} from "@/src/modules/platform/contracts/workspace-access-scope";
import { openPlatformDatabase } from "@/src/modules/platform/server/database/open-platform-database";
import { createCanonicalUuidV4 } from "@/src/modules/platform/server/database/platform-migration-contract";
import { runPlatformMigrations } from "@/src/modules/platform/server/database/run-platform-migrations";
import { PlatformUserRepository } from "@/src/modules/platform/server/identity/platform-user-repository";
import { PlatformWorkspaceRepository } from "@/src/modules/platform/server/identity/platform-workspace-repository";
import { JournalAccountRepository } from "@/src/modules/journal/server/accounts/journal-account-repository";
import { JournalAccountService } from "@/src/modules/journal/server/accounts/journal-account-service";
import { JournalDataDecisionRepository } from "@/src/modules/journal/server/decisions/journal-data-decision-repository";
import { JournalDataDecisionService } from "@/src/modules/journal/server/decisions/journal-data-decision-service";
import { JournalExecutionRepository } from "@/src/modules/journal/server/executions/journal-execution-repository";
import { JournalExecutionService } from "@/src/modules/journal/server/executions/journal-execution-service";
import {
  createJournalPrivacyDigester,
  JournalImportService,
} from "@/src/modules/journal/server/imports/journal-import-service";
import { JournalImportRepository } from "@/src/modules/journal/server/imports/journal-import-repository";
import { createJournalManualTradePreviewAuthority } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-preview-authority";
import { JournalManualTradeCommandRepository } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-command-repository";
import { JournalManualTradeCommandService } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-command-service";
import { JournalManualExecutionEditService } from "@/src/modules/journal/server/manual-trades/journal-manual-execution-edit-service";
import { JournalManualTradePreviewRepository } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-preview-repository";
import { JournalManualTradePreviewService } from "@/src/modules/journal/server/manual-trades/journal-manual-trade-preview-service";
import { JournalExecutionReconciliationRepository } from "@/src/modules/journal/server/reconciliation/journal-execution-reconciliation-repository";
import { JournalRoundTripRepository } from "@/src/modules/journal/server/round-trips/journal-round-trip-repository";
import { JournalRoundTripService } from "@/src/modules/journal/server/round-trips/journal-round-trip-service";

const TIMESTAMP = "2026-08-31T16:00:00.000Z";

type Entry = Readonly<{
  localTime: string;
  side: "buy" | "sell";
}>;

function createContext() {
  const root = mkdtempSync(join(tmpdir(), "traderlink-workspace-delete-"));
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "journal.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database);
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  new PlatformUserRepository(database, { allowedAuthProviders: ["test"] }).createUser({
    userId,
    authProvider: "test",
    authSubject: "workspace-delete-verifier",
    displayName: "Verifier",
    createdAtUtc: TIMESTAMP,
    updatedAtUtc: TIMESTAMP,
  });
  new PlatformWorkspaceRepository(database).createWorkspaceWithOwner({
    workspaceId,
    ownerUserId: userId,
    displayName: "Verifier workspace",
    defaultTradingTimezone: "America/New_York",
    createdAtUtc: TIMESTAMP,
  });
  const initialScope: WorkspaceAccessScope = {
    userId,
    workspaceId,
    workspaceRole: "owner",
    allowedAccountIds: [],
    activeAccountId: null,
  };
  const privacy = Object.freeze({
    activeKeyVersion: "testkey",
    keysBase64: { testkey: randomBytes(32).toString("base64") },
  });
  const accounts = new JournalAccountService(new JournalAccountRepository(database), {
    ...privacy,
    activeCanonicalizationVersion: "test_v1",
    canonicalizers: { test_v1: (value: string) => value.trim() },
  });
  const account = accounts.createAccount(initialScope, {
    workspaceId,
    displayName: "Manual account",
    baseCurrency: "USD",
    tradingTimezone: "America/New_York",
    now: new Date(TIMESTAMP),
  });
  const otherAccount = accounts.createAccount(initialScope, {
    workspaceId,
    displayName: "Other account",
    baseCurrency: "USD",
    tradingTimezone: "America/New_York",
    now: new Date(TIMESTAMP),
  });
  const scope: WorkspaceAccessScope = {
    ...initialScope,
    allowedAccountIds: [account.accountId, otherAccount.accountId],
    activeAccountId: account.accountId,
  };
  const importsRepository = new JournalImportRepository(database);
  const executionRepository = new JournalExecutionRepository(database);
  const reconciliations = new JournalExecutionReconciliationRepository(database);
  const imports = new JournalImportService(
    importsRepository,
    executionRepository,
    accounts,
    createJournalPrivacyDigester(privacy),
    reconciliations,
  );
  const roundTrips = new JournalRoundTripService(new JournalRoundTripRepository(database));
  const decisions = new JournalDataDecisionService(
    new JournalDataDecisionRepository(database),
    importsRepository,
    imports,
    executionRepository,
    new JournalExecutionService(executionRepository),
    roundTrips,
    reconciliations,
  );
  const authority = createJournalManualTradePreviewAuthority(privacy, {
    now: () => new Date(TIMESTAMP),
    nonce: () => Buffer.alloc(24, 9),
  });
  const previews = new JournalManualTradePreviewService(
    new JournalManualTradePreviewRepository(database),
    accounts,
    authority,
    () => new Date(TIMESTAMP),
  );
  const manualExecutionEdits = new JournalManualExecutionEditService(
    reconciliations,
    importsRepository,
    decisions,
    authority,
  );
  return Object.freeze({
    accountScope: narrowWorkspaceAccessToAccount(scope, account.accountId),
    command: new JournalManualTradeCommandService(
      new JournalManualTradeCommandRepository(database),
      imports,
      decisions,
      roundTrips,
      previews,
    ),
    database,
    manualExecutionEdits,
    otherAccountScope: narrowWorkspaceAccessToAccount(scope, otherAccount.accountId),
    previews,
    reconciliations,
    roundTrips,
    root,
    scope,
  });
}

function entries(symbol: string, values: readonly Entry[]) {
  return Object.freeze(values.map((value, index) => Object.freeze({
    clientRowRef: `${symbol}-${index + 1}`,
    feesDecimal: null,
    localDate: "2026-08-31",
    localTime: value.localTime,
    normalizedSymbol: symbol,
    priceDecimal: value.side === "buy" ? "10" : "11",
    quantityDecimal: "10",
    side: value.side,
    sourceTimezone: "America/New_York",
    tradeCurrency: "USD",
  })));
}

function commit(context: ReturnType<typeof createContext>, symbol: string, values: readonly Entry[]) {
  const prepared = entries(symbol, values);
  const selectionRef = "d".repeat(64);
  const preview = context.previews.preview(context.scope, {
    accountSelectionRef: selectionRef,
    entries: prepared,
    tracker: "day",
  });
  context.command.commit(context.scope, selectionRef, {
    confirmations: preview.groups.map((group) => Object.freeze({
      completeExecutionSetConfirmed: true,
      existingPositionRef: null,
      groupRef: group.groupRef,
      relationship: "start_new_trade" as const,
      style: "day_trade" as const,
    })),
    entries: prepared,
    expectedAccountSelectionRef: selectionRef,
    idempotencyKey: `workspace-delete-fixture-${symbol}-001`,
    preparedBy: "ai_chat",
    previewRef: preview.previewRef,
    tracker: "day",
  }, new Date(TIMESTAMP));
}

function removalError(operation: () => unknown): string {
  try {
    operation();
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
      return error.code;
    }
  }
  throw new Error("Expected protected deletion to fail.");
}

function run(): void {
  const context = createContext();
  try {
    commit(context, "OPEN", [
      { localTime: "09:30:00", side: "buy" },
      { localTime: "10:00:00", side: "sell" },
    ]);
    const closing = context.manualExecutionEdits.listEditable(context.accountScope)
      .find((execution) => execution.side === "sell");
    assert(closing?.deleteRef, "A current eligible manual execution must receive an opaque delete ref.");
    assert.equal(closing.deleteRef, closing.editRef);
    context.manualExecutionEdits.remove(context.accountScope, closing.deleteRef, {
      idempotencyKey: "workspace-delete-position-changing-001",
      now: new Date("2026-08-31T16:01:00.000Z"),
    });
    const excludedExecution = context.database.prepare(`SELECT current_state FROM journal_executions
WHERE execution_id = ?`).get(closing.executionId) as Readonly<{ current_state: string }> | undefined;
    assert.equal(excludedExecution?.current_state, "excluded_by_trader");
    const activeRoundTrip = context.database.prepare(`SELECT projection_state FROM journal_round_trip_versions
WHERE round_trip_version_id IN (SELECT current_version_id FROM journal_round_trips
WHERE lifecycle_state = 'active')`).get() as Readonly<{ projection_state: string }> | undefined;
    assert.equal(activeRoundTrip?.projection_state, "legitimate_open");
    assert.equal(removalError(() => context.manualExecutionEdits.remove(
      context.accountScope,
      closing.deleteRef!,
      { idempotencyKey: "workspace-delete-stale-ref-000001" },
    )), "TRADERLINK_MANUAL_EXECUTION_EDIT_REQUIRES_DECISION");

    commit(context, "DEMO", [{ localTime: "10:30:00", side: "buy" }]);

    commit(context, "LAST", [{ localTime: "11:00:00", side: "buy" }]);
    const last = context.manualExecutionEdits.listEditable(context.accountScope)
      .find((execution) => execution.normalizedSymbol === "LAST");
    assert(last?.deleteRef, "The final eligible manual execution must still receive a delete ref.");
    context.manualExecutionEdits.remove(context.accountScope, last.deleteRef, {
      idempotencyKey: "workspace-delete-last-execution-001",
      now: new Date("2026-08-31T16:02:00.000Z"),
    });
    const remainingLastRoundTrips = context.database.prepare(`SELECT count(*) AS count FROM journal_round_trips
WHERE lifecycle_state = 'active' AND current_version_id IN (
  SELECT round_trip_version_id FROM journal_round_trip_versions version
  JOIN journal_instruments instrument ON instrument.workspace_id = version.workspace_id
    AND instrument.instrument_id = version.instrument_id
  WHERE instrument.normalized_symbol = 'LAST'
)`).get() as Readonly<{ count: number }>;
    assert.equal(remainingLastRoundTrips.count, 0);

    const protectedExecution = context.manualExecutionEdits.listEditable(context.accountScope)
      .find((execution) => execution.normalizedSymbol === "OPEN");
    assert(protectedExecution, "The remaining OPEN execution should stay editable.");
    context.database.prepare(`INSERT INTO journal_execution_identity_aliases (
execution_alias_id, workspace_id, account_id, execution_id, alias_type,
alias_scheme_version, alias_sha256, occurrence_ordinal, status,
superseded_by_alias_id, first_seen_at_utc, last_seen_at_utc
) VALUES (?, ?, ?, ?, 'broker_fill', 'fixture_v1', ?, NULL, 'active', NULL, ?, ?)`)
      .run(createCanonicalUuidV4(), context.scope.workspaceId, context.accountScope.accountId,
        protectedExecution.executionId, "a".repeat(64), TIMESTAMP, TIMESTAMP);
    assert.equal(context.reconciliations.isSafelyDeletableManualExecution(
      context.scope.workspaceId,
      context.accountScope.accountId,
      protectedExecution.executionId,
      protectedExecution.currentVersionId,
    ), false);
    assert.equal(removalError(() => context.manualExecutionEdits.remove(
      context.accountScope,
      protectedExecution.editRef,
      { idempotencyKey: "workspace-delete-provider-refusal-001" },
    )), "TRADERLINK_MANUAL_EXECUTION_EDIT_REQUIRES_DECISION");
    assert.equal(removalError(() => context.manualExecutionEdits.remove(
      context.otherAccountScope,
      protectedExecution.editRef,
      { idempotencyKey: "workspace-delete-cross-account-001" },
    )), "TRADERLINK_MANUAL_EXECUTION_EDIT_REQUIRES_DECISION");

    const demoExecution = context.manualExecutionEdits.listEditable(context.accountScope)
      .find((execution) => execution.normalizedSymbol === "DEMO");
    assert(demoExecution?.deleteRef, "The manual execution must be eligible before the fixture marks its account as demo-only.");
    const demoPackVersionId = createCanonicalUuidV4();
    context.database.prepare(`INSERT INTO journal_demo_pack_versions (
demo_pack_version_id, pack_key, pack_version, manifest_sha256,
market_data_manifest_sha256, materializer_version, created_at_utc
) VALUES (?, 'fixture', 1, ?, ?, 'fixture_v1', ?)`)
      .run(demoPackVersionId, "b".repeat(64), "c".repeat(64), TIMESTAMP);
    context.database.prepare(`INSERT INTO journal_demo_accounts (
workspace_id, account_id, demo_pack_version_id, created_for_user_id, created_at_utc
) VALUES (?, ?, ?, ?, ?)`)
      .run(context.scope.workspaceId, context.accountScope.accountId, demoPackVersionId,
        context.scope.userId, TIMESTAMP);
    assert.equal(context.manualExecutionEdits.listEditable(context.accountScope)
      .find((execution) => execution.executionId === demoExecution.executionId)?.deleteRef, null);
    assert.equal(removalError(() => context.manualExecutionEdits.remove(
      context.accountScope,
      demoExecution.editRef,
      { idempotencyKey: "workspace-delete-demo-refusal-0001" },
    )), "TRADERLINK_MANUAL_EXECUTION_EDIT_REQUIRES_DECISION");

    const workspaceClient = readWorkspaceClient();
    assert.match(workspaceClient, /onDeleted\(\);\s*router\.refresh\(\);/u);
    assert.match(workspaceClient, /onDeleted=\{onClose\}/u);

    console.log("Workspace execution deletion verification passed: eligible rebuild, final execution, stale ref, provider-protected, demo, and cross-account refusal.");
  } finally {
    context.database.close();
    rmSync(context.root, { recursive: true, force: true });
  }
}

function readWorkspaceClient(): string {
  return readFileSync(
    join(process.cwd(), "app/(dashboard)/workspace/workspace-trade-library-client.tsx"),
    "utf8",
  ) as string;
}

run();
