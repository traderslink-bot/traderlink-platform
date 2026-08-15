import type {
  JournalAnalyticsFactSet,
} from "@/src/modules/journal/contracts/journal-analytics-fact-set";
import type { JournalRoundTripNoteRecord, JournalTagRecord } from "@/src/modules/journal/contracts/journal-annotation-contracts";
import type { JournalAnalyticsFactSetService } from "@/src/modules/journal/server/analytics/journal-analytics-fact-set-service";
import type { AccountScope, WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import { narrowWorkspaceAccessToAccount } from "@/src/modules/platform/contracts/workspace-access-scope";

import {
  type CoachAiChatAnalysisScope,
} from "../contracts/ai-chat-contracts";
import {
  COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
  CoachAiChatFactualToolError,
  type CoachAiChatClosedTradeDetail,
  type CoachAiChatClosedTradeDetailResponse,
  type CoachAiChatClosedTradeDetailRequest,
} from "../contracts/coach-ai-chat-factual-tool-contracts";

type CoachAiChatTradeDetailAnnotations = Readonly<{
  readRoundTripNotes(
    scope: AccountScope,
    roundTripIds: readonly string[],
  ): Readonly<Record<string, JournalRoundTripNoteRecord>>;
  listTagsForRoundTrips(
    scope: AccountScope,
    roundTripIds: readonly string[],
  ): Readonly<Record<string, readonly JournalTagRecord[]>>;
}>;

export type { CoachAiChatClosedTradeDetail, CoachAiChatClosedTradeDetailResponse };

function notFound(): never {
  throw new CoachAiChatFactualToolError("not_found");
}

export class CoachAiChatTradeDetailService {
  constructor(
    private readonly facts: Pick<JournalAnalyticsFactSetService, "getJournalAnalyticsFactSet">,
    private readonly annotations: CoachAiChatTradeDetailAnnotations,
  ) {}

  getClosedTradeDetails(
    scope: WorkspaceAccessScope,
    selectedAccountId: string,
    request: CoachAiChatClosedTradeDetailRequest,
    analysisScope: CoachAiChatAnalysisScope = Object.freeze({ kind: "recent" }),
  ): CoachAiChatClosedTradeDetailResponse {
    if (request.contractVersion !== COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION ||
        request.toolName !== "get_closed_trade_details" ||
        Object.keys(request).some((key) => !["contractVersion", "toolName", "roundTripId"].includes(key))) notFound();
    const accountScope = narrowWorkspaceAccessToAccount(scope, selectedAccountId);
    let factSet: JournalAnalyticsFactSet;
    const closingDateRange = analysisScope.kind === "day"
      ? Object.freeze({ kind: "inclusive_closing_date" as const, startDate: analysisScope.date, endDate: analysisScope.date })
      : analysisScope.kind === "custom"
        ? Object.freeze({ kind: "inclusive_closing_date" as const, startDate: analysisScope.startDate, endDate: analysisScope.endDate })
        : analysisScope.kind === "month"
          ? Object.freeze({
              kind: "inclusive_closing_date" as const,
              startDate: `${analysisScope.month}-01`,
              endDate: new Date(Date.UTC(
                Number(analysisScope.month.slice(0, 4)),
                Number(analysisScope.month.slice(5, 7)),
                0,
              )).toISOString().slice(0, 10),
            })
          : analysisScope.kind === "week"
            ? (() => {
                const anchor = new Date(`${analysisScope.anchorDate}T12:00:00.000Z`);
                const start = new Date(anchor);
                start.setUTCDate(anchor.getUTCDate() - ((anchor.getUTCDay() + 6) % 7));
                const end = new Date(start);
                end.setUTCDate(start.getUTCDate() + 6);
                return Object.freeze({
                  kind: "inclusive_closing_date" as const,
                  startDate: start.toISOString().slice(0, 10),
                  endDate: end.toISOString().slice(0, 10),
                });
              })()
            : Object.freeze({ kind: "all_available" as const });
    try {
      factSet = this.facts.getJournalAnalyticsFactSet(scope, {
        accountIds: Object.freeze([selectedAccountId]),
        closingDateRange,
        currencySelection: Object.freeze({ kind: "all_partitions" }),
      });
    } catch {
      return notFound();
    }
    const trade = factSet.roundTrips.find((roundTrip) =>
      roundTrip.accountId === selectedAccountId &&
      roundTrip.roundTripId === request.roundTripId &&
      (analysisScope.kind !== "ticker" ||
        roundTrip.displayedSymbol.toUpperCase() === analysisScope.ticker) &&
      roundTrip.projectionState === "ready_closed" && roundTrip.closedAtUtc !== null);
    if (!trade || trade.closedAtUtc === null) notFound();
    let note: JournalRoundTripNoteRecord | null;
    let tags: readonly JournalTagRecord[];
    try {
      note = this.annotations.readRoundTripNotes(accountScope, [trade.roundTripId])[trade.roundTripId] ?? null;
      tags = this.annotations.listTagsForRoundTrips(accountScope, [trade.roundTripId])[trade.roundTripId] ?? [];
    } catch {
      return notFound();
    }
    return Object.freeze({
      contractVersion: COACH_AI_CHAT_FACTUAL_TOOL_CONTRACT_VERSION,
      toolName: "get_closed_trade_details",
      result: Object.freeze({
        roundTripId: trade.roundTripId,
        symbol: trade.displayedSymbol,
        assetClass: trade.assetClass,
        currency: trade.tradeCurrency,
        direction: trade.direction,
        openedAtUtc: trade.openedAtUtc,
        closedAtUtc: trade.closedAtUtc,
        finalPositionDecimal: trade.finalPositionDecimal,
        projectionState: "ready_closed",
        coverageReasonCode: trade.coverageReasonCode,
        factSetRevisionSha256: factSet.sourceRevisionSha256,
        executions: Object.freeze([...trade.allocations]
          .sort((left, right) => left.allocationSequence - right.allocationSequence)
          .map((allocation) => Object.freeze({
            allocationSequence: allocation.allocationSequence,
            allocationRole: allocation.allocationRole,
            executedAtUtc: allocation.executedAtUtc,
            side: allocation.side,
            quantityDecimal: allocation.allocatedQuantityDecimal,
            priceDecimal: allocation.priceDecimal,
            feesDecimal: allocation.feesDecimal,
            feeCurrency: allocation.feeCurrency,
            factCompleteness: allocation.factCompleteness,
          }))),
        note: note === null ? null : Object.freeze({
          tradeNote: note.tradeNote,
          updatedAtUtc: note.updatedAtUtc,
        }),
        tags: Object.freeze(tags.map((tag) => tag.name).sort((left, right) =>
          left.localeCompare(right))),
      }),
    });
  }
}
