import "server-only";

import { createHash } from "node:crypto";

import type Database from "better-sqlite3";

import type { JournalDataDecisionItem } from
  "@/src/modules/journal/contracts/journal-product-read-models";
import { MoomooExecutionImportCommandService } from
  "@/src/modules/journal/server/broker-imports/moomoo-execution-import-command-service";
import { JournalProductReadService } from
  "@/src/modules/journal/server/product/journal-product-read-service";
import {
  narrowWorkspaceAccessToAccount,
  type AccountScope,
  type WorkspaceAccessScope,
} from "@/src/modules/platform/contracts/workspace-access-scope";
import { MoomooConnectionRepository } from
  "@/src/modules/platform/server/broker-connections/moomoo-connection-repository";
import {
  isWhopAiReviewEntitlementSchemaAvailable,
  WhopAiReviewEntitlementRepository,
} from "@/src/modules/platform/server/billing/whop-ai-review-entitlement-repository";
import { PlatformAccountProfileReadService } from
  "@/src/modules/platform/server/identity/platform-account-profile-read-service";
import { PlatformNotificationRepository } from
  "@/src/modules/platform/server/notifications/platform-notification-repository";

import {
  COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  CoachAiChatFactualToolError,
  type CoachAiChatAccountContextRequest,
  type CoachAiChatDataDecisionDetailRequest,
  type CoachAiChatDataDecisionListRequest,
  type CoachAiChatImportListRequest,
  type CoachAiChatNotificationListRequest,
  type CoachAiChatProductContextResponse,
} from "../contracts/coach-ai-chat-factual-tool-contracts";
import { CoachReviewDeliveryScheduleRepository } from
  "./coach-weekly-review-schedule-repository";

const TICKER_PATTERN = /^[A-Za-z0-9._-]{1,32}$/u;
const OPAQUE_REF_PATTERN = /^[0-9a-f]{64}$/u;
const MAX_LIST_ITEMS = 50;
const SAFE_DESTINATION_PREFIXES = Object.freeze([
  "/account",
  "/ai-reviews",
  "/calendar",
  "/data-decisions",
  "/imports",
  "/notifications",
  "/trade-tracker",
] as const);

function invalid(): never {
  throw new CoachAiChatFactualToolError("invalid_request");
}

function accountScope(
  scope: WorkspaceAccessScope,
  selectedAccountId: string,
): AccountScope {
  return narrowWorkspaceAccessToAccount(scope, selectedAccountId);
}

function boundedLimit(value: number): number {
  if (!Number.isSafeInteger(value) || value < 1 || value > MAX_LIST_ITEMS) invalid();
  return value;
}

function opaqueRef(kind: string, scope: AccountScope, privateId: string): string {
  return createHash("sha256").update([
    `coach-${kind}-ref-v1`,
    scope.workspaceId,
    scope.accountId,
    privateId,
  ].join("\u001f"), "utf8").digest("hex");
}

function safeDestinationPath(value: string | null): string | null {
  if (value === null) return null;
  return SAFE_DESTINATION_PREFIXES.some((prefix) =>
    value === prefix || value.startsWith(`${prefix}/`) || value.startsWith(`${prefix}?`))
    ? value
    : null;
}

function decisionSummary(
  scope: AccountScope,
  decision: JournalDataDecisionItem,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    decisionRef: opaqueRef("data-decision", scope, decision.decisionId),
    state: decision.state,
    issueCode: decision.issueCode,
    effectCode: decision.effectCode,
    question: decision.question,
    impactSummary: decision.impactSummary,
    targetKind: decision.targetKind,
    ticker: decision.symbol,
    currency: decision.currency,
    statementRowNumber: decision.sourceRowNumber,
    statementSection: decision.sourceSection,
    effectiveAtUtc: decision.effectiveAtUtc,
    updatedAtUtc: decision.updatedAtUtc,
    allowedActions: decision.allowedActions,
    resolution: decision.resolution,
    executionCount: decision.executions.length,
    positionFactCount: decision.positionFacts.length,
  });
}

function decisionDetail(
  scope: AccountScope,
  decision: JournalDataDecisionItem,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    ...decisionSummary(scope, decision),
    executions: Object.freeze(decision.executions.map((execution) => Object.freeze({
      executionRef: opaqueRef("data-decision-execution", scope, execution.executionId),
      executedAtUtc: execution.executedAtUtc,
      sourceTimezone: execution.sourceTimezone,
      ticker: execution.symbol,
      currency: execution.currency,
      side: execution.side,
      quantityDecimal: execution.quantityDecimal,
      priceDecimal: execution.priceDecimal,
      feesDecimal: execution.feesDecimal,
      feeCurrency: execution.feeCurrency,
      feeSignConvention: execution.feeSignConvention,
      currentState: execution.currentState,
      sourceLabel: execution.sourceLabel,
    }))),
    positionFacts: Object.freeze(decision.positionFacts.map((fact) => Object.freeze({
      positionFactRef: opaqueRef("data-decision-position-fact", scope, fact.positionFactId),
      ticker: fact.symbol,
      currency: fact.currency,
      factKind: fact.factKind,
      effectiveLocalDate: fact.effectiveLocalDate,
      sourceTimezone: fact.sourceTimezone,
      quantityDecimal: fact.quantityDecimal,
      source: fact.source,
    }))),
    openPositionConfirmation: decision.openPositionConfirmation
      ? Object.freeze({
          supportedQuantityDecimal:
            decision.openPositionConfirmation.supportedQuantityDecimal,
        })
      : null,
    suggestedCoverage: decision.suggestedCoverage,
    rawStatementRowsAvailableInChat: false,
    link: "/data-decisions",
  });
}

export class CoachAiChatProductContextService {
  private readonly journal: Pick<JournalProductReadService, "listImports" | "listDataDecisions">;
  private readonly notifications: Pick<PlatformNotificationRepository, "list" | "readPreferences">;
  private readonly profile: Pick<PlatformAccountProfileReadService, "get">;
  private readonly schedules: Pick<CoachReviewDeliveryScheduleRepository, "read" | "readV2">;
  private readonly connection: Pick<MoomooConnectionRepository, "find">;
  private readonly moomooImports: Pick<MoomooExecutionImportCommandService, "list">;
  private readonly entitlementSchemaAvailable: () => boolean;
  private readonly entitlementAccess: (userId: string) => ReturnType<WhopAiReviewEntitlementRepository["readAccess"]>;

  constructor(
    database: Database.Database,
    dependencies: Readonly<{
      journal?: Pick<JournalProductReadService, "listImports" | "listDataDecisions">;
      notifications?: Pick<PlatformNotificationRepository, "list" | "readPreferences">;
      profile?: Pick<PlatformAccountProfileReadService, "get">;
      schedules?: Pick<CoachReviewDeliveryScheduleRepository, "read" | "readV2">;
      connection?: Pick<MoomooConnectionRepository, "find">;
      moomooImports?: Pick<MoomooExecutionImportCommandService, "list">;
      entitlementSchemaAvailable?: () => boolean;
      entitlementAccess?: (userId: string) => ReturnType<WhopAiReviewEntitlementRepository["readAccess"]>;
    }> = Object.freeze({}),
  ) {
    this.journal = dependencies.journal ?? new JournalProductReadService(database);
    this.notifications = dependencies.notifications ?? new PlatformNotificationRepository(database);
    this.profile = dependencies.profile ?? new PlatformAccountProfileReadService(database);
    this.schedules = dependencies.schedules ?? new CoachReviewDeliveryScheduleRepository(database);
    this.connection = dependencies.connection ?? new MoomooConnectionRepository(database);
    this.moomooImports = dependencies.moomooImports ?? new MoomooExecutionImportCommandService(database);
    this.entitlementSchemaAvailable = dependencies.entitlementSchemaAvailable ??
      (() => isWhopAiReviewEntitlementSchemaAvailable(database));
    this.entitlementAccess = dependencies.entitlementAccess ??
      ((userId) => new WhopAiReviewEntitlementRepository(database).readAccess(userId));
  }

  listImports(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatImportListRequest,
  ): CoachAiChatProductContextResponse {
    const selected = accountScope(scope, selectedAccountId);
    const limit = boundedLimit(request.limit);
    const imports = this.journal.listImports(selected)
      .filter((item) => request.sourceKind === "all" ||
        request.sourceKind === "broker_statements" && item.sourceKind === "broker_statement" ||
        request.sourceKind === "manual_entries" && item.sourceKind === "manual_batch")
      .slice(0, limit)
      .map((item) => Object.freeze({
        importRef: opaqueRef("import", selected, item.importBatchId),
        sourceKind: item.sourceKind,
        sourceSystem: item.sourceSystem,
        sourceDisplayLabel: item.sourceDisplayLabel,
        currentState: item.currentState,
        statementPeriodStartDate: item.statementPeriodStartDate,
        statementPeriodEndDate: item.statementPeriodEndDate,
        preservedRowCount: item.preservedRowCount,
        mappedExecutionCount: item.mappedExecutionCount,
        unsupportedRowCount: item.unsupportedRowCount,
        issueCount: item.issueCount,
        pendingDecisionCount: item.pendingDecisionCount,
        acceptedAtUtc: item.acceptedAtUtc,
      }));
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: Object.freeze({
        imports: Object.freeze(imports),
        returnedCount: imports.length,
        rawStatementContentIncluded: false,
        link: "/imports",
      }),
    });
  }

  listDataDecisions(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatDataDecisionListRequest,
  ): CoachAiChatProductContextResponse {
    const selected = accountScope(scope, selectedAccountId);
    const limit = boundedLimit(request.limit);
    if (request.ticker !== undefined && !TICKER_PATTERN.test(request.ticker)) invalid();
    const model = this.journal.listDataDecisions(selected);
    const selectedItems = model[request.state]
      .filter((item) => !request.ticker || item.symbol === request.ticker.toUpperCase());
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: Object.freeze({
        state: request.state,
        totalCount: selectedItems.length,
        decisions: Object.freeze(selectedItems.slice(0, limit)
          .map((item) => decisionSummary(selected, item))),
        rawStatementContentIncluded: false,
        link: "/data-decisions",
      }),
    });
  }

  dataDecisionDetail(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatDataDecisionDetailRequest,
  ): CoachAiChatProductContextResponse {
    const selected = accountScope(scope, selectedAccountId);
    if (!OPAQUE_REF_PATTERN.test(request.decisionRef)) invalid();
    const model = this.journal.listDataDecisions(selected);
    const item = [...model.pending, ...model.resolved].find((candidate) =>
      opaqueRef("data-decision", selected, candidate.decisionId) === request.decisionRef);
    if (!item) throw new CoachAiChatFactualToolError("not_found");
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: decisionDetail(selected, item),
    });
  }

  listNotifications(
    scope: WorkspaceAccessScope,
    request: CoachAiChatNotificationListRequest,
  ): CoachAiChatProductContextResponse {
    const limit = boundedLimit(request.limit);
    const notifications = this.notifications.list(scope, limit).map((item) => Object.freeze({
      notificationRef: createHash("sha256").update([
        "coach-notification-ref-v1",
        scope.workspaceId,
        scope.userId,
        item.notificationRef,
      ].join("\u001f"), "utf8").digest("hex"),
      category: item.category,
      kind: item.kind,
      title: item.title,
      summary: item.summary,
      occurredAtUtc: item.occurredAtUtc,
      read: item.readAtUtc !== null,
      destinationPath: safeDestinationPath(item.destinationPath),
    }));
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: Object.freeze({ notifications: Object.freeze(notifications), link: "/notifications" }),
    });
  }

  accountContext(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatAccountContextRequest,
  ): CoachAiChatProductContextResponse {
    accountScope(scope, selectedAccountId);
    const profile = this.profile.get(scope);
    if (request.toolName === "get_account_profile") {
      return Object.freeze({
        contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
        toolName: request.toolName,
        result: Object.freeze({
          displayName: profile.displayName,
          accessMode: profile.accessMode,
          authenticationLabel: profile.authenticationLabel,
          workspace: profile.workspace,
          link: "/account/profile",
        }),
      });
    }
    if (request.toolName === "get_account_preferences") {
      return Object.freeze({
        contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
        toolName: request.toolName,
        result: Object.freeze({
          reportingCurrency: profile.reportingCurrency,
          notifications: this.notifications.readPreferences(scope),
          link: "/account/preferences",
        }),
      });
    }
    if (request.toolName === "get_account_ai_plan") {
      const entitlement = this.entitlementSchemaAvailable()
        ? this.entitlementAccess(scope.userId)
        : null;
      return Object.freeze({
        contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
        toolName: request.toolName,
        result: Object.freeze({
          reviewSettings: this.schedules.readV2(scope),
          reviewDelivery: this.schedules.read(scope),
          entitlement,
          link: "/account/ai",
        }),
      });
    }
    const connection = this.connection.find(scope);
    const linkedAccounts = connection?.state === "active"
      ? this.moomooImports.list(scope, selectedAccountId)
      : [];
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: request.toolName,
      result: Object.freeze({
        journalAccounts: Object.freeze(profile.journalAccounts.map((account) => Object.freeze({
          displayName: account.displayName,
          baseCurrency: account.baseCurrency,
          tradingTimezone: account.tradingTimezone,
          active: account.active,
        }))),
        moomoo: Object.freeze({
          connection: connection ? Object.freeze({
            state: connection.state,
            executionReadAuthorized: connection.authorizedScopes.includes("trade:read"),
            connectedAtUtc: connection.connectedAtUtc,
            updatedAtUtc: connection.updatedAtUtc,
          }) : null,
          automaticImportConfigured: linkedAccounts.length > 0,
          linkedAccounts: Object.freeze(linkedAccounts.map((linked) => Object.freeze({
            label: linked.label,
            accountType: linked.accountType,
            authorizedMarketCount: linked.authorizedMarketCount,
            latestImport: linked.latestImport,
          }))),
        }),
        link: "/account/trading",
      }),
    });
  }
}
