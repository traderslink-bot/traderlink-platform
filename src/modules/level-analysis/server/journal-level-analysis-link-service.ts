import {
  createDefaultJournalLevelAnalysisTradeLinkMatchPolicy,
  createJournalLevelAnalysisTradeLinkRecord,
  JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_API_CONTRACT_VERSION,
  JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_RESOLUTION_API_CONTRACT_VERSION,
  JOURNAL_TRADE_LEVEL_ANALYSIS_API_CONTRACT_VERSION,
  type JournalLevelAnalysisTradeLinkApiResponse,
  type JournalLevelAnalysisTradeLinkMatchPolicy,
  type JournalLevelAnalysisTradeLinkResolution,
  type JournalTradeLevelAnalysisApiResponse,
} from "@/src/lib/level-analysis/level-analysis-journal-delivery-trade-link-contract";
import {
  buildTradeDetailLevelFactsReadModel,
  type TradeDetailLevelFactsReadModel,
} from "@/src/lib/level-analysis/level-analysis-trade-detail-level-facts-contract";
import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUuidV4,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";

import { LevelAnalysisDeliveryRepository } from "./level-analysis-delivery-repository";
import {
  JournalLevelAnalysisLinkRepository,
  type LevelAnalysisRoundTripTarget,
} from "./journal-level-analysis-link-repository";

export type JournalLevelAnalysisLinkRequest = Readonly<{
  roundTripId: string;
  provider: string;
  deliveryId?: string;
  linkSource?: "manual_review" | "resolver" | "import_batch_hint";
}>;

function policy(deliveryId?: string): JournalLevelAnalysisTradeLinkMatchPolicy {
  return createDefaultJournalLevelAnalysisTradeLinkMatchPolicy({
    asOfPolicy: deliveryId
      ? "manual_delivery_selection"
      : "latest_before_or_equal_trade_end",
    allowSameDayAfterTradeEnd: false,
    allowFutureAsOfForHistoricalTrade: false,
    requireAcceptedDelivery: true,
    requireContextOnly15m: true,
  });
}

function blocked(
  request: JournalLevelAnalysisLinkRequest,
  matchPolicy: JournalLevelAnalysisTradeLinkMatchPolicy,
  checkedAt: string,
  status: "blocked" | "not_found",
  reason: "no_accepted_symbol_summary" | "as_of_after_allowed_boundary" |
    "provider_not_allowed" | "delivery_quarantined" |
    "fifteen_minute_not_context_only",
  candidate?: Readonly<{ deliveryId: string; asOfTimestamp: number }>,
): JournalLevelAnalysisTradeLinkResolution {
  return Object.freeze({
    contractVersion: JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_RESOLUTION_API_CONTRACT_VERSION,
    status,
    savedTradeId: request.roundTripId,
    symbol: "",
    provider: request.provider,
    matchPolicy,
    matchResult: Object.freeze({
      status,
      reason,
      candidateDeliveryId: candidate?.deliveryId,
      candidateSummaryAsOfTimestamp: candidate?.asOfTimestamp,
      checkedAt,
    }),
    limitations: [],
  });
}

export class JournalLevelAnalysisLinkService {
  constructor(
    private readonly deliveries: LevelAnalysisDeliveryRepository,
    private readonly links: JournalLevelAnalysisLinkRepository,
    private readonly allowedProviders: readonly string[],
    private readonly now: () => Date = () => new Date(),
  ) {}

  resolve(
    scope: AccountScope,
    request: JournalLevelAnalysisLinkRequest,
  ): JournalLevelAnalysisTradeLinkResolution & Readonly<{ roundTripVersionId?: string }> {
    const checkedAt = this.now().toISOString();
    const matchPolicy = policy(request.deliveryId);
    if (!this.allowedProviders.includes(request.provider)) {
      return blocked(request, matchPolicy, checkedAt, "blocked", "provider_not_allowed");
    }
    const target = this.requireTarget(scope, request.roundTripId);
    const boundary = Date.parse(target.closedAtUtc as string);
    const summary = request.deliveryId
      ? this.deliveries.symbolForDelivery(request.deliveryId, target.symbol)
      : this.deliveries.latestAcceptedSymbol(target.symbol, request.provider, boundary);
    if (!summary) {
      const latest = this.deliveries.latestAcceptedSymbol(target.symbol, request.provider);
      if (latest && latest.asOfTimestamp > boundary) {
        const response = blocked(request, matchPolicy, checkedAt, "blocked",
          "as_of_after_allowed_boundary", {
            deliveryId: latest.deliveryId,
            asOfTimestamp: latest.asOfTimestamp,
          });
        return Object.freeze({ ...response, symbol: target.symbol,
          roundTripVersionId: target.roundTripVersionId });
      }
      const response = blocked(request, matchPolicy, checkedAt, "not_found",
        "no_accepted_symbol_summary");
      return Object.freeze({ ...response, symbol: target.symbol,
        roundTripVersionId: target.roundTripVersionId });
    }
    const delivery = this.deliveries.get(summary.deliveryId);
    if (!delivery || delivery.validationStatus !== "accepted") {
      const response = blocked(request, matchPolicy, checkedAt, "blocked",
        "delivery_quarantined", { deliveryId: summary.deliveryId,
          asOfTimestamp: summary.asOfTimestamp });
      return Object.freeze({ ...response, symbol: target.symbol,
        roundTripVersionId: target.roundTripVersionId });
    }
    if (summary.provider !== request.provider || summary.asOfTimestamp > boundary) {
      const response = blocked(request, matchPolicy, checkedAt, "blocked",
        summary.asOfTimestamp > boundary
          ? "as_of_after_allowed_boundary"
          : "provider_not_allowed",
        { deliveryId: summary.deliveryId, asOfTimestamp: summary.asOfTimestamp });
      return Object.freeze({ ...response, symbol: target.symbol,
        roundTripVersionId: target.roundTripVersionId });
    }
    if (
      delivery.sourceKind === "packaged_review_delivery" &&
      summary.fifteenMinuteContextOnlyStatus !== "context_only"
    ) {
      const response = blocked(request, matchPolicy, checkedAt, "blocked",
        "fifteen_minute_not_context_only", {
          deliveryId: summary.deliveryId,
          asOfTimestamp: summary.asOfTimestamp,
        });
      return Object.freeze({ ...response, symbol: target.symbol,
        roundTripVersionId: target.roundTripVersionId });
    }
    return Object.freeze({
      contractVersion: JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_RESOLUTION_API_CONTRACT_VERSION,
      status: "matched" as const,
      savedTradeId: target.roundTripId,
      symbol: target.symbol,
      provider: request.provider,
      matchPolicy,
      matchResult: Object.freeze({
        status: "matched" as const,
        reason: "symbol_provider_asof_match" as const,
        candidateDeliveryId: delivery.id,
        candidateSummaryAsOfTimestamp: summary.asOfTimestamp,
        checkedAt,
      }),
      candidate: Object.freeze({
        deliveryId: delivery.id,
        rawPayloadHash: delivery.rawPayloadHash,
        sourceKind: delivery.sourceKind,
        asOfTimestamp: summary.asOfTimestamp,
        asOfIso: summary.asOfIso,
        fifteenMinuteContextOnlyStatus: summary.fifteenMinuteContextOnlyStatus,
      }),
      limitations: summary.limitations,
      roundTripVersionId: target.roundTripVersionId,
    });
  }

  link(
    scope: AccountScope,
    request: JournalLevelAnalysisLinkRequest,
  ): JournalLevelAnalysisTradeLinkApiResponse & Readonly<{ duplicate?: boolean }> {
    const target = this.requireTarget(scope, request.roundTripId);
    const resolution = this.resolve(scope, request);
    if (resolution.status !== "matched" || !resolution.candidate) {
      return Object.freeze({
        contractVersion: JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_API_CONTRACT_VERSION,
        status: "blocked" as const,
        savedTradeId: target.roundTripId,
        symbol: target.symbol,
        provider: request.provider,
        matchResult: resolution.matchResult,
      });
    }
    const delivery = this.deliveries.get(resolution.candidate.deliveryId);
    const summary = delivery && delivery.validationStatus === "accepted"
      ? this.deliveries.symbolForDelivery(delivery.id, target.symbol)
      : null;
    if (!delivery || delivery.validationStatus !== "accepted" || !summary) {
      platformFailure("TRADERLINK_LEVEL_ANALYSIS_LINK_CONFLICT");
    }
    const createdAt = this.now().toISOString();
    const current = this.links.current(scope, target.roundTripId);
    const record = createJournalLevelAnalysisTradeLinkRecord({
      id: current?.linkId ?? createCanonicalUuidV4(),
      createdAt,
      updatedAt: createdAt,
      workspaceId: scope.workspaceId,
      accountId: scope.accountId,
      userId: scope.userId,
      savedTradeId: target.roundTripId,
      linkSource: request.linkSource ?? "resolver",
      deliveryRecord: delivery,
      symbolSummary: summary,
      matchPolicy: resolution.matchPolicy,
      matchResult: {
        status: "matched",
        reason: "symbol_provider_asof_match",
        candidateDeliveryId: delivery.id,
        candidateSummaryAsOfTimestamp: summary.asOfTimestamp,
        checkedAt: resolution.matchResult.checkedAt,
      },
    });
    const saved = this.links.save(scope, target, record);
    return Object.freeze({
      contractVersion: JOURNAL_LEVEL_ANALYSIS_TRADE_LINK_API_CONTRACT_VERSION,
      status: "linked" as const,
      linkId: saved.link.linkId,
      savedTradeId: target.roundTripId,
      deliveryId: saved.link.record.deliveryId,
      symbol: saved.link.record.symbol,
      provider: saved.link.record.provider,
      matchResult: saved.link.record.matchResult,
      duplicate: saved.status === "duplicate",
    });
  }

  forTrade(scope: AccountScope, roundTripId: string): JournalTradeLevelAnalysisApiResponse {
    this.requireTarget(scope, roundTripId);
    const link = this.links.current(scope, roundTripId)?.record ?? null;
    return link ? Object.freeze({
      contractVersion: JOURNAL_TRADE_LEVEL_ANALYSIS_API_CONTRACT_VERSION,
      status: "found" as const,
      savedTradeId: roundTripId,
      link,
    }) : Object.freeze({
      contractVersion: JOURNAL_TRADE_LEVEL_ANALYSIS_API_CONTRACT_VERSION,
      status: "not_found" as const,
      savedTradeId: roundTripId,
    });
  }

  facts(scope: AccountScope, roundTripId: string): TradeDetailLevelFactsReadModel {
    this.requireTarget(scope, roundTripId);
    return buildTradeDetailLevelFactsReadModel({
      savedTradeId: roundTripId,
      featureEnabled: true,
      link: this.links.current(scope, roundTripId)?.record ?? null,
    });
  }

  private requireTarget(scope: AccountScope, roundTripId: string): LevelAnalysisRoundTripTarget {
    const target = this.links.target(scope, roundTripId);
    if (
      !target || target.projectionState !== "ready_closed" || !target.closedAtUtc ||
      target.assetClass !== "stock" || !/^[A-Z][A-Z0-9.-]{0,63}$/u.test(target.symbol)
    ) platformFailure("TRADERLINK_LEVEL_ANALYSIS_LINK_INVALID");
    return target;
  }
}
