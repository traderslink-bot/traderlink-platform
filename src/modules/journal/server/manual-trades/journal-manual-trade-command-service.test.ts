import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
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
import { JournalAccountRepository } from "../accounts/journal-account-repository";
import { JournalAccountService } from "../accounts/journal-account-service";
import { JournalAnnotationRepository } from "../annotations/journal-annotation-repository";
import { JournalAnnotationService } from "../annotations/journal-annotation-service";
import { JournalRuleRepository } from "../annotations/journal-rule-repository";
import { JournalDataDecisionRepository } from "../decisions/journal-data-decision-repository";
import { JournalDataDecisionService } from "../decisions/journal-data-decision-service";
import { JournalExecutionRepository } from "../executions/journal-execution-repository";
import { JournalExecutionService } from "../executions/journal-execution-service";
import { JournalImportRepository } from "../imports/journal-import-repository";
import {
  createJournalPrivacyDigester,
  JournalImportService,
} from "../imports/journal-import-service";
import { JournalRoundTripRepository } from "../round-trips/journal-round-trip-repository";
import { JournalRoundTripService } from "../round-trips/journal-round-trip-service";
import { JournalTradeTrackerReadService } from "../product/journal-trade-tracker-read-service";
import { JournalExecutionReconciliationRepository } from "../reconciliation/journal-execution-reconciliation-repository";
import { JournalSwingNoteRepository } from "../swing-notes/journal-swing-note-repository";
import { JournalSwingNoteService } from "../swing-notes/journal-swing-note-service";
import { JournalTradeStyleRepository } from "../trade-style/journal-trade-style-repository";
import { JournalTradeStyleService } from "../trade-style/journal-trade-style-service";
import { createJournalManualTradePreviewAuthority } from "./journal-manual-trade-preview-authority";
import { JournalManualTradeCommandRepository } from "./journal-manual-trade-command-repository";
import { JournalManualTradeCommandService } from "./journal-manual-trade-command-service";
import { JournalManualExecutionEditService } from "./journal-manual-execution-edit-service";
import { JournalManualTradePreviewRepository } from "./journal-manual-trade-preview-repository";
import { JournalManualTradePreviewService } from "./journal-manual-trade-preview-service";

const roots: string[] = [];
afterEach(() => {
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

function setup() {
  const root = mkdtempSync(join(tmpdir(), "traderlink-manual-trade-"));
  roots.push(root);
  const database = openPlatformDatabase({
    mode: "initializer",
    databasePath: join(root, "journal.sqlite"),
    forbiddenRepositoryRoots: [],
  });
  runPlatformMigrations(database);
  const userId = createCanonicalUuidV4();
  const workspaceId = createCanonicalUuidV4();
  const timestamp = "2026-08-02T23:00:00.000Z";
  new PlatformUserRepository(database, { allowedAuthProviders: ["test"] }).createUser({
    userId,
    authProvider: "test",
    authSubject: "owner",
    displayName: "Owner",
    createdAtUtc: timestamp,
    updatedAtUtc: timestamp,
  });
  new PlatformWorkspaceRepository(database).createWorkspaceWithOwner({
    workspaceId,
    ownerUserId: userId,
    displayName: "Workspace",
    defaultTradingTimezone: "America/New_York",
    createdAtUtc: timestamp,
  });
  const initialScope: WorkspaceAccessScope = {
    userId,
    workspaceId,
    workspaceRole: "owner",
    allowedAccountIds: [],
    activeAccountId: null,
  };
  const key = randomBytes(32);
  const privacy = Object.freeze({
    activeKeyVersion: "testkey",
    keysBase64: { testkey: key.toString("base64") },
  });
  const accounts = new JournalAccountService(new JournalAccountRepository(database), {
    ...privacy,
    activeCanonicalizationVersion: "test_v1",
    canonicalizers: { test_v1: (value) => value.trim() },
  });
  const account = accounts.createAccount(initialScope, {
    workspaceId,
    displayName: "Journal",
    baseCurrency: "USD",
    tradingTimezone: "America/New_York",
    now: new Date(timestamp),
  });
  const otherAccount = accounts.createAccount(initialScope, {
    workspaceId,
    displayName: "Other Journal",
    baseCurrency: "USD",
    tradingTimezone: "America/New_York",
    now: new Date(timestamp),
  });
  const scope: WorkspaceAccessScope = {
    ...initialScope,
    allowedAccountIds: [account.accountId, otherAccount.accountId],
    activeAccountId: account.accountId,
  };
  const importRepository = new JournalImportRepository(database);
  const executionRepository = new JournalExecutionRepository(database);
  const imports = new JournalImportService(
    importRepository,
    executionRepository,
    accounts,
    createJournalPrivacyDigester(privacy),
    new JournalExecutionReconciliationRepository(database),
  );
  const roundTrips = new JournalRoundTripService(new JournalRoundTripRepository(database));
  const decisions = new JournalDataDecisionService(
    new JournalDataDecisionRepository(database),
    importRepository,
    imports,
    executionRepository,
    new JournalExecutionService(executionRepository),
    roundTrips,
    new JournalExecutionReconciliationRepository(database),
  );
  const now = () => new Date(timestamp);
  const authority = createJournalManualTradePreviewAuthority(privacy, {
    now,
    nonce: () => Buffer.alloc(24, 7),
  });
  const previews = new JournalManualTradePreviewService(
    new JournalManualTradePreviewRepository(database),
    accounts,
    authority,
    now,
  );
  const styles = new JournalTradeStyleService(
    new JournalTradeStyleRepository(database),
    authority,
  );
  const swingNotes = new JournalSwingNoteService(
    new JournalSwingNoteRepository(database),
    styles,
  );
  const queuedAnalysisRoundTripIds: Array<readonly string[]> = [];
  const manualExecutionEdits = new JournalManualExecutionEditService(
    new JournalExecutionReconciliationRepository(database),
    importRepository,
    decisions,
    authority,
    {
      queueAfterJournalRebuild: (_scope, roundTripIds) => {
        const queued = Object.freeze([...roundTripIds]);
        queuedAnalysisRoundTripIds.push(queued);
        return queued;
      },
    },
  );
  const annotations = new JournalAnnotationService(
    new JournalAnnotationRepository(database),
    new JournalRuleRepository(database),
  );
  return Object.freeze({
    annotations,
    database,
    scope,
    accountScope: narrowWorkspaceAccessToAccount(scope, account.accountId),
    otherAccountScope: narrowWorkspaceAccessToAccount(scope, otherAccount.accountId),
    previews,
    command: new JournalManualTradeCommandService(
      new JournalManualTradeCommandRepository(database),
      imports,
      decisions,
      roundTrips,
      previews,
    ),
    manualExecutionEdits,
    queuedAnalysisRoundTripIds,
    styles,
    swingNotes,
    trackerReads: new JournalTradeTrackerReadService(database, styles, swingNotes),
    now: new Date(timestamp),
  });
}

describe("Journal manual trade confirmation", () => {
  it("records a confirmed day trade without import-only coverage decisions", () => {
    const context = setup();
    try {
      const entries = Object.freeze([
        Object.freeze({
          clientRowRef: "row-1",
          localDate: "2026-08-02",
          localTime: "09:30:00",
          sourceTimezone: "America/New_York",
          normalizedSymbol: "DAY",
          tradeCurrency: "USD",
          side: "buy" as const,
          quantityDecimal: "10",
          priceDecimal: "5.25",
          feesDecimal: null,
        }),
        Object.freeze({
          clientRowRef: "row-2",
          localDate: "2026-08-02",
          localTime: "10:15:00",
          sourceTimezone: "America/New_York",
          normalizedSymbol: "DAY",
          tradeCurrency: "USD",
          side: "sell" as const,
          quantityDecimal: "10",
          priceDecimal: "5.5",
          feesDecimal: null,
        }),
      ]);
      const selectionRef = "a".repeat(64);
      const preview = context.previews.preview(context.scope, {
        accountSelectionRef: selectionRef,
        tracker: "day",
        entries,
      });
      const result = context.command.commit(context.scope, selectionRef, {
        tracker: "day",
        entries,
        previewRef: preview.previewRef,
        expectedAccountSelectionRef: selectionRef,
        idempotencyKey: "manual-day-trade-confirmation-001",
        preparedBy: "ai_chat",
        confirmations: preview.groups.map((group) => Object.freeze({
          groupRef: group.groupRef,
          relationship: "start_new_trade" as const,
          style: "day_trade" as const,
          existingPositionRef: null,
          completeExecutionSetConfirmed: true,
        })),
      }, context.now);
      expect(result).toMatchObject({
        createdExecutionCount: 2,
        pendingSourceDecisionCount: 0,
        styledTradeCount: 1,
      });
      expect(context.database.prepare(`SELECT projection_state FROM journal_round_trip_versions
WHERE round_trip_version_id IN (SELECT current_version_id FROM journal_round_trips)`).get())
        .toEqual({ projection_state: "ready_closed" });
      expect(context.database.prepare(`SELECT trade_style, lifecycle_state
FROM journal_trade_style_plans`).get()).toEqual({
        trade_style: "day_trade",
        lifecycle_state: "closed",
      });
      expect(context.database.prepare(`SELECT count(*) AS count
FROM journal_data_decisions WHERE state = 'pending'`).get()).toEqual({ count: 0 });
      expect(context.database.prepare(`SELECT source_display_label
FROM journal_import_batches WHERE import_batch_id = ?`).get(result.importBatchId)).toEqual({
        source_display_label: "AI Chat manual executions",
      });
    } finally {
      context.database.close();
    }
  });

  it("edits a saved manual execution by appending evidence and rebuilding the trade", () => {
    const context = setup();
    try {
      const entries = Object.freeze([
        Object.freeze({
          clientRowRef: "edit-1",
          localDate: "2026-08-02",
          localTime: "09:30:00",
          sourceTimezone: "America/New_York",
          normalizedSymbol: "EDIT",
          tradeCurrency: "USD",
          side: "buy" as const,
          quantityDecimal: "10",
          priceDecimal: "5.25",
          feesDecimal: null,
        }),
        Object.freeze({
          clientRowRef: "edit-2",
          localDate: "2026-08-02",
          localTime: "10:15:00",
          sourceTimezone: "America/New_York",
          normalizedSymbol: "EDIT",
          tradeCurrency: "USD",
          side: "sell" as const,
          quantityDecimal: "10",
          priceDecimal: "5.5",
          feesDecimal: null,
        }),
      ]);
      const selectionRef = "e".repeat(64);
      const preview = context.previews.preview(context.scope, {
        accountSelectionRef: selectionRef,
        tracker: "day",
        entries,
      });
      context.command.commit(context.scope, selectionRef, {
        tracker: "day",
        entries,
        previewRef: preview.previewRef,
        expectedAccountSelectionRef: selectionRef,
        idempotencyKey: "manual-edit-trade-confirmation-001",
        confirmations: preview.groups.map((group) => Object.freeze({
          groupRef: group.groupRef,
          relationship: "start_new_trade" as const,
          style: "day_trade" as const,
          existingPositionRef: null,
          completeExecutionSetConfirmed: true,
        })),
      }, context.now);
      const roundTrip = context.database.prepare(`SELECT round_trip_id
FROM journal_round_trips WHERE lifecycle_state = 'active'`).get() as {
        round_trip_id: string;
      };
      const tag = context.annotations.createTag(context.accountScope, {
        name: "Breakout",
        now: context.now,
      });
      context.annotations.replaceRoundTripTags(context.accountScope, {
        roundTripId: roundTrip.round_trip_id,
        tagIds: [tag.tagId],
        now: context.now,
      });
      const editable = context.manualExecutionEdits
        .listEditable(context.accountScope)
        .find((execution) => execution.localTime === "09:30:00")!;
      expect(context.manualExecutionEdits.listEditable(
        context.accountScope,
        [editable.executionId],
      ).map((execution) => execution.executionId)).toEqual([editable.executionId]);
      expect(context.manualExecutionEdits.listEditable(context.accountScope, []))
        .toEqual([]);
      const result = context.manualExecutionEdits.correct(
        context.accountScope,
        editable.editRef,
        {
          idempotencyKey: "manual-execution-correction-001",
          localDate: editable.localDate,
          localTime: editable.localTime,
          sourceTimezone: editable.sourceTimezone,
          normalizedSymbol: editable.normalizedSymbol,
          tradeCurrency: editable.tradeCurrency,
          side: editable.side,
          quantityDecimal: editable.quantityDecimal,
          priceDecimal: "5.3",
          feesDecimal: null,
          now: new Date("2026-08-02T23:05:00.000Z"),
        },
      );
      expect(result).toMatchObject({
        analysisRefresh: { affectedTradeCount: 1, queuedTradeCount: 1 },
        rebuildCount: 1,
      });
      expect(context.queuedAnalysisRoundTripIds).toEqual([[roundTrip.round_trip_id]]);
      expect(context.database.prepare(`SELECT COUNT(*) AS count
FROM journal_execution_versions`).get()).toEqual({ count: 3 });
      expect(context.database.prepare(`SELECT version.price_decimal, version.version_number
FROM journal_executions execution
JOIN journal_execution_versions version
  ON version.execution_version_id = execution.current_version_id
WHERE execution.execution_id = ?`).get(editable.executionId)).toEqual({
        price_decimal: "5.3",
        version_number: 2,
      });
      expect(context.database.prepare(`SELECT projection_state
FROM journal_round_trip_versions
WHERE round_trip_version_id IN (
  SELECT current_version_id FROM journal_round_trips WHERE lifecycle_state = 'active'
)`).get()).toEqual({ projection_state: "ready_closed" });
      expect(context.database.prepare(`SELECT round_trip_id
FROM journal_round_trips WHERE lifecycle_state = 'active'`).get()).toEqual({
        round_trip_id: roundTrip.round_trip_id,
      });
      expect(context.annotations.listTagsForRoundTrips(
        context.accountScope,
        [roundTrip.round_trip_id],
      )[roundTrip.round_trip_id]?.map((savedTag) => savedTag.name)).toEqual([
        "Breakout",
      ]);
      expect(context.manualExecutionEdits.listEditable(context.accountScope))
        .toHaveLength(2);
      expect(context.manualExecutionEdits.listEditable(context.accountScope)
        .some((execution) => execution.editRef === editable.editRef)).toBe(false);
      expect(context.manualExecutionEdits.listEditable(context.otherAccountScope))
        .toHaveLength(0);
      expect(() => context.manualExecutionEdits.correct(
        context.otherAccountScope,
        editable.editRef,
        {
          idempotencyKey: "manual-execution-other-account-001",
          localDate: editable.localDate,
          localTime: editable.localTime,
          sourceTimezone: editable.sourceTimezone,
          normalizedSymbol: editable.normalizedSymbol,
          tradeCurrency: editable.tradeCurrency,
          side: editable.side,
          quantityDecimal: editable.quantityDecimal,
          priceDecimal: "5.4",
          feesDecimal: null,
        },
      )).toThrow();
      expect(() => context.manualExecutionEdits.correct(
        context.accountScope,
        editable.editRef,
        {
          idempotencyKey: "manual-execution-stale-reference-01",
          localDate: editable.localDate,
          localTime: editable.localTime,
          sourceTimezone: editable.sourceTimezone,
          normalizedSymbol: editable.normalizedSymbol,
          tradeCurrency: editable.tradeCurrency,
          side: editable.side,
          quantityDecimal: editable.quantityDecimal,
          priceDecimal: "5.4",
          feesDecimal: null,
        },
      )).toThrow();
      expect(context.database.prepare(`SELECT COUNT(*) AS count
FROM journal_execution_versions`).get()).toEqual({ count: 3 });
    } finally {
      context.database.close();
    }
  });

  it("keeps a trader-confirmed swing open and classified", () => {
    const context = setup();
    try {
      const entries = Object.freeze([Object.freeze({
        clientRowRef: "swing-1",
        localDate: "2026-08-02",
        localTime: "15:30:00",
        sourceTimezone: "America/New_York",
        normalizedSymbol: "SWING",
        tradeCurrency: "USD",
        side: "buy" as const,
        quantityDecimal: "25",
        priceDecimal: "8.125",
        feesDecimal: null,
      })]);
      const selectionRef = "b".repeat(64);
      const preview = context.previews.preview(context.scope, {
        accountSelectionRef: selectionRef,
        tracker: "swing",
        entries,
      });
      const group = preview.groups[0]!;
      context.command.commit(context.scope, selectionRef, {
        tracker: "swing",
        entries,
        previewRef: preview.previewRef,
        expectedAccountSelectionRef: selectionRef,
        idempotencyKey: "manual-swing-trade-confirmation-01",
        confirmations: [Object.freeze({
          groupRef: group.groupRef,
          relationship: "start_new_trade",
          style: "swing",
          existingPositionRef: null,
          completeExecutionSetConfirmed: true,
        })],
      }, context.now);
      expect(context.database.prepare(`SELECT projection_state, final_position_decimal
FROM journal_round_trip_versions
WHERE round_trip_version_id IN (SELECT current_version_id FROM journal_round_trips)`).get())
        .toEqual({ projection_state: "legitimate_open", final_position_decimal: "25" });
      expect(context.database.prepare(`SELECT trade_style, open_status, lifecycle_state
FROM journal_trade_style_plans`).get()).toEqual({
        trade_style: "swing",
        open_status: "swing",
        lifecycle_state: "active",
      });
      const swings = context.trackerReads.listSwings(
        context.accountScope,
        "2026-08-02",
      );
      expect(swings.active).toHaveLength(1);
      expect(swings.active[0]).toMatchObject({
        averageEntryPriceDecimal: "8.125",
        remainingQuantityDecimal: "25",
        symbol: "SWING",
      });
      const positionRef = swings.active[0]!.positionRef;
      const savedNote = context.swingNotes.save(context.accountScope, {
        positionRef,
        reviewDate: "2026-08-02",
        note: "Held the planned position through the close.",
        nextSessionPlan: "Review the opening range before adding.",
        expectedRevision: null,
        idempotencyKey: "manual-swing-note-confirmation-01",
      }, context.now);
      expect(savedNote).toMatchObject({
        addedRetrospectively: false,
        reviewDate: "2026-08-02",
        revision: 1,
      });
      expect(context.trackerReads.listSwings(
        context.accountScope,
        "2026-08-02",
      ).active[0]?.reviewDateSwingNote).toMatchObject({
        note: "Held the planned position through the close.",
        revision: 1,
      });
      const changedStyle = context.styles.change(context.accountScope, {
        positionRef,
        expectedRevision: 1,
        tradeStyle: "swing",
        openStatus: "swing",
        plannedFromEntry: false,
        claimedEffectiveAtUtc: "2026-08-03T14:00:00.000Z",
        reason: "reclassified",
        sourceUi: "swing_trade_tracker",
        idempotencyKey: "manual-swing-style-revision-001",
      }, new Date("2026-08-03T14:00:00.000Z"));
      expect(changedStyle).toMatchObject({
        declaredAtUtc: "2026-08-03T14:00:00.000Z",
        plannedFromEntry: false,
        revision: 2,
      });
    } finally {
      context.database.close();
    }
  });
});
