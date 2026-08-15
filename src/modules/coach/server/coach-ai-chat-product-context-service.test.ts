import { describe, expect, it, vi } from "vitest";

import type { WorkspaceAccessScope } from
  "@/src/modules/platform/contracts/workspace-access-scope";

import { COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION } from
  "../contracts/coach-ai-chat-factual-tool-contracts";
import { CoachAiChatProductContextService } from
  "./coach-ai-chat-product-context-service";

const accountId = "90000000-0000-4000-8000-000000000003";
const scope: WorkspaceAccessScope = Object.freeze({
  userId: "90000000-0000-4000-8000-000000000001",
  workspaceId: "90000000-0000-4000-8000-000000000002",
  workspaceRole: "owner",
  allowedAccountIds: Object.freeze([accountId]),
  activeAccountId: accountId,
});
const importBatchId = "90000000-0000-4000-8000-000000000004";
const decisionId = "90000000-0000-4000-8000-000000000005";

function fixture() {
  const decision = Object.freeze({
    decisionId,
    importBatchIds: Object.freeze([importBatchId]),
    revision: 1,
    state: "pending" as const,
    issueCode: "execution_price_missing",
    effectCode: "price_metrics_unavailable",
    question: "What execution price does your broker statement show?",
    impactSummary: "Price-based results stay unavailable until you decide.",
    targetKind: "execution" as const,
    instrumentRef: "private-instrument-id",
    symbol: "TEST",
    currency: "USD",
    sourceRowNumber: 7,
    sourceSection: "Trades",
    effectiveAtUtc: "2026-08-05T13:30:00.000Z",
    updatedAtUtc: "2026-08-05T14:00:00.000Z",
    resolution: null,
    allowedActions: Object.freeze(["correct_execution_fact", "exclude_execution"] as const),
    executions: Object.freeze([Object.freeze({
      executionId: "private-execution-id",
      currentVersionId: "private-version-id",
      sourceTimestampText: "private source timestamp text",
      executedAtUtc: "2026-08-05T13:30:00.000Z",
      sourceTimezone: "America/New_York",
      symbol: "TEST",
      currency: "USD",
      side: "buy" as const,
      quantityDecimal: "100",
      priceDecimal: null,
      feesDecimal: null,
      feeCurrency: null,
      feeSignConvention: "not_reported" as const,
      currentState: "needs_decision" as const,
      sourceLabel: "Broker statement" as const,
    })]),
    flaggedStatementRow: Object.freeze({
      recordOrdinal: 7,
      sectionName: "Trades",
      fields: Object.freeze(["private-raw-field-a", "private-raw-field-b"]),
    }),
    positionFacts: Object.freeze([]),
    openPositionConfirmation: null,
    suggestedCoverage: null,
  });
  const dependencies = {
    journal: {
      listImports: vi.fn(() => Object.freeze([
        Object.freeze({
          importBatchId,
          sourceKind: "broker_statement" as const,
          sourceSystem: "generic_csv",
          sourceDisplayLabel: "Moomoo statement August 2026",
          currentState: "accepted_with_decisions" as const,
          statementPeriodStartDate: "2026-08-01",
          statementPeriodEndDate: "2026-08-31",
          preservedRowCount: 20,
          mappedExecutionCount: 8,
          unsupportedRowCount: 1,
          issueCount: 1,
          pendingDecisionCount: 1,
          acceptedAtUtc: "2026-09-01T12:00:00.000Z",
        }),
      ])),
      listDataDecisions: vi.fn(() => Object.freeze({
        pending: Object.freeze([decision]),
        resolved: Object.freeze([]),
      })),
    },
    notifications: {
      list: vi.fn(() => Object.freeze([Object.freeze({
        category: "broker_import" as const,
        kind: "broker_import_completed" as const,
        notificationRef: "private-notification-id",
        occurredAtUtc: "2026-08-05T15:00:00.000Z",
        readAtUtc: null,
        title: "Import complete",
        summary: "Your trades are ready.",
        destinationPath: "/imports?privateId=hidden",
      })])),
      readPreferences: vi.fn(() => Object.freeze({ discordDmCategories: Object.freeze([]) })),
    },
    profile: {
      get: vi.fn(() => Object.freeze({
        displayName: "Trader",
        reportingCurrency: "USD" as const,
        accessMode: "authenticated" as const,
        authenticationLabel: "Discord",
        workspace: Object.freeze({
          displayName: "Trader workspace",
          role: "owner" as const,
          defaultTradingTimezone: "America/New_York",
        }),
        journalAccounts: Object.freeze([Object.freeze({
          selectionRef: "private-account-selection-ref",
          displayName: "Day trading",
          baseCurrency: "USD",
          tradingTimezone: "America/New_York",
          active: true,
        })]),
      })),
    },
    schedules: { read: vi.fn(() => null), readV2: vi.fn(() => null) },
    connection: {
      find: vi.fn(() => Object.freeze({
        connectionId: "private-connection-id",
        state: "active" as const,
        encrypted: Object.freeze({
          keyVersion: "private-key-version",
          initializationVector: "private-iv",
          ciphertext: "private-ciphertext",
          authenticationTag: "private-tag",
        }),
        accessTokenExpiresAtUtc: "2026-08-16T00:00:00.000Z",
        authorizedScopes: Object.freeze(["trade:read"]),
        connectedAtUtc: "2026-08-01T12:00:00.000Z",
        updatedAtUtc: "2026-08-05T12:00:00.000Z",
      })),
    },
    moomooImports: {
      list: vi.fn(() => Object.freeze([Object.freeze({
        linkRef: "private-encrypted-link-ref",
        label: "Moomoo margin account 1",
        accountType: "margin" as const,
        authorizedMarketCount: 1,
        latestImport: Object.freeze({
          state: "completed" as const,
          requestedStartDate: "2026-08-01",
          cutoffAtUtc: "2026-08-05T12:00:00.000Z",
          completedWorkUnits: 1,
          totalWorkUnits: 1,
          receivedFillCount: 8,
          acceptedExecutionCount: 8,
          existingExecutionCount: 0,
          decisionRequiredCount: 0,
          nextAttemptAtUtc: null,
          reportedToAdmin: false,
        }),
      })])),
    },
    entitlementSchemaAvailable: vi.fn(() => false),
    entitlementAccess: vi.fn(),
  };
  return {
    dependencies,
    service: new CoachAiChatProductContextService({} as never, dependencies),
  };
}

describe("CoachAiChatProductContextService", () => {
  it("lists privacy-safe import history without exposing the import batch identifier", () => {
    const { service } = fixture();
    const response = service.listImports(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "list_imports",
      sourceKind: "broker_statements",
      limit: 10,
    });
    expect(response.result).toMatchObject({
      returnedCount: 1,
      rawStatementContentIncluded: false,
      imports: [{ sourceDisplayLabel: "Moomoo statement August 2026" }],
    });
    expect(JSON.stringify(response)).not.toContain(importBatchId);
  });

  it("uses opaque decision references and strips raw statement and record identifiers", () => {
    const { service } = fixture();
    const listed = service.listDataDecisions(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "list_data_decisions",
      state: "pending",
      limit: 10,
    });
    const decisionRef = (listed.result as { decisions: { decisionRef: string }[] })
      .decisions[0]!.decisionRef;
    const detailed = service.dataDecisionDetail(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "get_data_decision_details",
      decisionRef,
    });
    expect(detailed.result).toMatchObject({
      decisionRef,
      ticker: "TEST",
      executions: [{ ticker: "TEST", quantityDecimal: "100" }],
      rawStatementRowsAvailableInChat: false,
    });
    const serialized = JSON.stringify(detailed);
    for (const privateValue of [decisionId, importBatchId, "private-execution-id",
      "private-version-id", "private source timestamp text", "private-instrument-id",
      "private-raw-field-a", "private-raw-field-b"]) {
      expect(serialized).not.toContain(privateValue);
    }
  });

  it("returns Moomoo connection and automatic-import status without credentials or link references", () => {
    const { service } = fixture();
    const response = service.accountContext(scope, accountId, {
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "get_account_trading",
    });
    expect(response.result).toMatchObject({
      moomoo: {
        connection: { state: "active", executionReadAuthorized: true },
        automaticImportConfigured: true,
        linkedAccounts: [{
          label: "Moomoo margin account 1",
          latestImport: { state: "completed", acceptedExecutionCount: 8 },
        }],
      },
    });
    const serialized = JSON.stringify(response);
    for (const privateValue of ["private-connection-id", "private-ciphertext",
      "private-encrypted-link-ref", "private-account-selection-ref"]) {
      expect(serialized).not.toContain(privateValue);
    }
  });

  it("rejects a different account before reading private product state", () => {
    const { dependencies, service } = fixture();
    expect(() => service.listImports(scope,
      "90000000-0000-4000-8000-000000000099", {
        contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
        toolName: "list_imports",
        sourceKind: "all",
        limit: 10,
      })).toThrow();
    expect(dependencies.journal.listImports).not.toHaveBeenCalled();
  });
});
