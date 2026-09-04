import type { AccountScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import {
  createCanonicalUtcTimestamp,
  platformFailure,
} from "@/src/modules/platform/server/database/platform-migration-contract";
import type {
  JournalLogicalTrade,
  JournalLogicalTradeMergeCommand,
  JournalLogicalTradeMergePreview,
  JournalLogicalTradeMergeSelection,
  JournalLogicalTradeMergeView,
} from "../../contracts/journal-logical-trade-contracts";
import type { JournalManualTradePreviewAuthority } from "../manual-trades/journal-manual-trade-preview-authority";
import { JournalLogicalTradeRepository } from "./journal-logical-trade-repository";

function marketDate(timestamp: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const value = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

function compatible(left: JournalLogicalTrade, right: JournalLogicalTrade): boolean {
  return left.instrumentId === right.instrumentId &&
    left.currency === right.currency && left.direction === right.direction &&
    left.lifecycleState === "active" && right.lifecycleState === "active";
}

export class JournalLogicalTradeService {
  constructor(
    private readonly repository: JournalLogicalTradeRepository,
    private readonly authority: JournalManualTradePreviewAuthority,
  ) {}

  private candidateRef(scope: AccountScope, trade: JournalLogicalTrade): string {
    const identity = trade.logicalTradeId ?? `round-trip:${trade.members[0]!.roundTripId}`;
    return this.authority.opaqueRef("logical_trade_merge_candidate", [
      scope.userId,
      scope.workspaceId,
      scope.accountId,
      identity,
      String(trade.revision),
    ].join("\u001f"));
  }

  private view(scope: AccountScope, trade: JournalLogicalTrade) {
    return Object.freeze({
      candidateRef: this.candidateRef(scope, trade),
      symbol: trade.symbol,
      tradeStyle: trade.tradeStyle,
      openedAtUtc: trade.openedAtUtc,
      closedAtUtc: trade.closedAtUtc,
      memberCount: trade.members.length,
    });
  }

  list(scope: AccountScope): readonly JournalLogicalTrade[] {
    return this.repository.list(scope);
  }

  refreshAfterJournalRebuild(
    scope: AccountScope,
    affectedRoundTripIds: readonly string[],
    now: Date = new Date(),
  ): Readonly<{ refreshed: readonly JournalLogicalTrade[]; reviewRequiredCount: number }> {
    return this.repository.immediate(() => {
      const groups = new Map<string, JournalLogicalTrade>();
      for (const roundTripId of new Set(affectedRoundTripIds)) {
        const trade = this.repository.findByRoundTripId(scope, roundTripId);
        if (trade?.logicalTradeId) groups.set(trade.logicalTradeId, trade);
      }
      const refreshed: JournalLogicalTrade[] = [];
      let reviewRequiredCount = 0;
      const timestamp = createCanonicalUtcTimestamp(now);
      for (const trade of groups.values()) {
        const remainsCompatible = this.repository.membersRemainCompatible(
          scope,
          trade.members.map((member) => member.roundTripId),
        );
        this.repository.removeActiveMemberships(scope, [trade.logicalTradeId!]);
        this.repository.createVersion({
          scope,
          logicalTradeId: trade.logicalTradeId!,
          priorRevision: trade.revision,
          members: trade.members,
          tradeStyle: trade.tradeStyle,
          changeKind: remainsCompatible ? "member_refreshed" : "review_required",
          lifecycleState: remainsCompatible ? "active" : "review_required",
          reasonCode: remainsCompatible ? "member_facts_changed" : "member_no_longer_compatible",
          timestamp,
        });
        this.repository.markLogicalAnalysisStale(scope, trade.logicalTradeId!, timestamp);
        if (remainsCompatible) {
          const current = this.repository.findByLogicalTradeId(scope, trade.logicalTradeId!);
          if (current) refreshed.push(current);
        } else {
          reviewRequiredCount += 1;
        }
      }
      return Object.freeze({ refreshed: Object.freeze(refreshed), reviewRequiredCount });
    });
  }

  ensureMaterialized(
    scope: AccountScope,
    roundTripId: string,
    now: Date = new Date(),
  ): JournalLogicalTrade {
    return this.repository.immediate(() => {
      const current = this.repository.findByRoundTripId(scope, roundTripId);
      if (!current) platformFailure("TRADERLINK_LOGICAL_TRADE_INVALID", { reason: "trade_not_found" });
      if (current.logicalTradeId) return current;
      const id = this.repository.createVersion({
        scope,
        members: current.members,
        tradeStyle: current.tradeStyle,
        changeKind: "created",
        timestamp: createCanonicalUtcTimestamp(now),
      });
      const materialized = this.repository.findByLogicalTradeId(scope, id);
      if (!materialized) platformFailure("TRADERLINK_LOGICAL_TRADE_CONFLICT");
      return materialized;
    });
  }

  mergePreview(scope: AccountScope, roundTripId: string): JournalLogicalTradeMergePreview {
    const current = this.repository.findByRoundTripId(scope, roundTripId);
    if (!current) platformFailure("TRADERLINK_LOGICAL_TRADE_INVALID", { reason: "trade_not_found" });
    const currentDate = marketDate(current.closedAtUtc);
    const currentMemberIds = new Set(current.members.map((member) => member.roundTripId));
    const candidates = this.repository.list(scope)
      .filter((candidate) =>
        !candidate.members.some((member) => currentMemberIds.has(member.roundTripId)) &&
        compatible(current, candidate))
      .map((candidate) => Object.freeze({
        ...candidate,
        sameMarketDate: marketDate(candidate.closedAtUtc) === currentDate,
      }));
    return Object.freeze({
      current,
      sameDay: Object.freeze(candidates.filter((candidate) => candidate.sameMarketDate)),
      otherDates: Object.freeze(candidates.filter((candidate) => !candidate.sameMarketDate)),
    });
  }

  mergeView(scope: AccountScope, roundTripId: string): JournalLogicalTradeMergeView {
    const preview = this.mergePreview(scope, roundTripId);
    return Object.freeze({
      revision: preview.current.revision,
      isMerged: preview.current.logicalTradeId !== null && preview.current.members.length > 1,
      current: this.view(scope, preview.current),
      sameDay: Object.freeze(preview.sameDay.map((trade) => this.view(scope, trade))),
      otherDates: Object.freeze(preview.otherDates.map((trade) => this.view(scope, trade))),
    });
  }

  mergeSelection(
    scope: AccountScope,
    roundTripId: string,
    selection: JournalLogicalTradeMergeSelection,
    now: Date = new Date(),
  ): JournalLogicalTradeMergeView {
    const preview = this.mergePreview(scope, roundTripId);
    const byRef = new Map([...preview.sameDay, ...preview.otherDates]
      .map((trade) => [this.candidateRef(scope, trade), trade] as const));
    const selected = selection.candidateRefs.map((ref) => byRef.get(ref));
    if (selected.length === 0 || selected.some((trade) => trade === undefined) ||
      new Set(selection.candidateRefs).size !== selection.candidateRefs.length) {
      platformFailure("TRADERLINK_LOGICAL_TRADE_CONFLICT", { reason: "candidate_changed" });
    }
    const trades = selected as readonly JournalLogicalTrade[];
    this.merge(scope, roundTripId, Object.freeze({
      expectedCurrentRevision: selection.expectedCurrentRevision,
      logicalTradeIds: Object.freeze(trades.flatMap((trade) =>
        trade.logicalTradeId ? [trade.logicalTradeId] : [])),
      fallbackRoundTripIds: Object.freeze(trades.flatMap((trade) =>
        trade.logicalTradeId === null ? [trade.members[0]!.roundTripId] : [])),
      tradeStyle: selection.tradeStyle,
    }), now);
    return this.mergeView(scope, roundTripId);
  }

  unmergeSelection(
    scope: AccountScope,
    roundTripId: string,
    expectedRevision: number,
    now: Date = new Date(),
  ): JournalLogicalTradeMergeView {
    const current = this.repository.findByRoundTripId(scope, roundTripId);
    if (!current?.logicalTradeId) {
      platformFailure("TRADERLINK_LOGICAL_TRADE_INVALID", { reason: "merged_trade_required" });
    }
    this.unmerge(scope, current.logicalTradeId, expectedRevision, now);
    return this.mergeView(scope, roundTripId);
  }

  merge(
    scope: AccountScope,
    initiatingRoundTripId: string,
    command: JournalLogicalTradeMergeCommand,
    now: Date = new Date(),
  ): JournalLogicalTrade {
    return this.repository.immediate(() => {
      const all = this.repository.list(scope);
      const current = all.find((trade) =>
        trade.members.some((member) => member.roundTripId === initiatingRoundTripId));
      if (!current || current.revision !== command.expectedCurrentRevision) {
        platformFailure("TRADERLINK_LOGICAL_TRADE_CONFLICT", { reason: "trade_changed" });
      }
      const selectedLogical = new Set(command.logicalTradeIds);
      const selectedFallback = new Set(command.fallbackRoundTripIds);
      const selected = all.filter((trade) => trade === current ||
        (trade.logicalTradeId !== null && selectedLogical.has(trade.logicalTradeId)) ||
        (trade.logicalTradeId === null && trade.members.some((member) =>
          selectedFallback.has(member.roundTripId))));
      const recognizedLogical = new Set(selected.flatMap((trade) =>
        trade.logicalTradeId ? [trade.logicalTradeId] : []));
      const recognizedFallback = new Set(selected.flatMap((trade) =>
        trade.logicalTradeId === null ? trade.members.map((member) => member.roundTripId) : []));
      if (selected.length < 2 || selected.some((trade) => !compatible(current, trade))) {
        platformFailure("TRADERLINK_LOGICAL_TRADE_INVALID", { reason: "incompatible_selection" });
      }
      if (
        [...selectedLogical].some((id) => !recognizedLogical.has(id)) ||
        [...selectedFallback].some((id) => !recognizedFallback.has(id))
      ) {
        platformFailure("TRADERLINK_LOGICAL_TRADE_CONFLICT", { reason: "candidate_changed" });
      }
      const compatibleChain = all.filter((trade) => compatible(current, trade));
      const indices = selected.map((trade) => compatibleChain.indexOf(trade)).sort((a, b) => a - b);
      if (indices.some((value) => value < 0) || indices.at(-1)! - indices[0]! + 1 !== indices.length) {
        platformFailure("TRADERLINK_LOGICAL_TRADE_INVALID", { reason: "trades_must_be_consecutive" });
      }
      const dates = new Set(selected.map((trade) => marketDate(trade.closedAtUtc)));
      if (dates.size > 1 && command.tradeStyle !== "swing") {
        platformFailure("TRADERLINK_LOGICAL_TRADE_INVALID", { reason: "cross_date_requires_swing" });
      }
      const selectedStyles = new Set(selected.map((trade) => trade.tradeStyle));
      if (dates.size === 1 && selectedStyles.size === 1 &&
        command.tradeStyle !== selected[0]!.tradeStyle) {
        platformFailure("TRADERLINK_LOGICAL_TRADE_INVALID", { reason: "matching_style_must_be_preserved" });
      }
      const timestamp = createCanonicalUtcTimestamp(now);
      const retiredIds = selected.flatMap((trade) => trade.logicalTradeId ? [trade.logicalTradeId] : []);
      this.repository.removeActiveMemberships(scope, retiredIds);
      for (const trade of selected) {
        if (trade.logicalTradeId) {
          this.repository.createVersion({
            scope,
            logicalTradeId: trade.logicalTradeId,
            priorRevision: trade.revision,
            members: trade.members,
            tradeStyle: trade.tradeStyle,
            changeKind: "merged",
            lifecycleState: "retired",
            reasonCode: "merged_into_trade",
            timestamp,
          });
        }
      }
      const members = selected.flatMap((trade) => trade.members)
        .sort((left, right) => left.openedAtUtc.localeCompare(right.openedAtUtc) ||
          left.roundTripId.localeCompare(right.roundTripId));
      const priorExactTrade = this.repository.findRetiredExactTrade(scope, members, command.tradeStyle);
      const logicalTradeId = this.repository.createVersion({
        scope,
        logicalTradeId: priorExactTrade?.logicalTradeId,
        priorRevision: priorExactTrade?.revision,
        members,
        tradeStyle: command.tradeStyle,
        changeKind: "merged",
        timestamp,
      });
      const merged = this.repository.findByLogicalTradeId(scope, logicalTradeId);
      if (!merged) platformFailure("TRADERLINK_LOGICAL_TRADE_CONFLICT");
      return merged;
    });
  }

  unmerge(
    scope: AccountScope,
    logicalTradeId: string,
    expectedRevision: number,
    now: Date = new Date(),
  ): readonly JournalLogicalTrade[] {
    return this.repository.immediate(() => {
      const current = this.repository.findByLogicalTradeId(scope, logicalTradeId);
      if (!current || current.revision !== expectedRevision || current.members.length < 2) {
        platformFailure("TRADERLINK_LOGICAL_TRADE_CONFLICT", { reason: "trade_changed" });
      }
      const timestamp = createCanonicalUtcTimestamp(now);
      this.repository.removeActiveMemberships(scope, [logicalTradeId]);
      this.repository.createVersion({
        scope,
        logicalTradeId,
        priorRevision: current.revision,
        members: current.members,
        tradeStyle: current.tradeStyle,
        changeKind: "unmerged",
        lifecycleState: "retired",
        timestamp,
      });
      const fallbackTrades = this.repository.list(scope);
      const ids = current.members.map((member) => {
        const fallback = fallbackTrades.find((trade) => trade.logicalTradeId === null &&
          trade.members[0]?.roundTripId === member.roundTripId);
        if (!fallback) platformFailure("TRADERLINK_LOGICAL_TRADE_CONFLICT");
        return this.repository.createVersion({
          scope,
          members: [member],
          tradeStyle: fallback.tradeStyle,
          changeKind: "unmerged",
          timestamp,
        });
      });
      return Object.freeze(ids.map((id) => {
        const trade = this.repository.findByLogicalTradeId(scope, id);
        if (!trade) platformFailure("TRADERLINK_LOGICAL_TRADE_CONFLICT");
        return trade;
      }));
    });
  }
}
