import type { CalendarData, CalendarFilterInput, CalendarView, CalendarWeekOption } from "@/app/(dashboard)/calendar/calendar-types";
import type { TradeExplorerComparisonStudy } from "@/app/(dashboard)/analytics/trade-explorer/trade-explorer-comparison-model";
import type { TradeExplorerPageModel } from "@/app/(dashboard)/analytics/trade-explorer/trade-explorer-service";
import type { RuleResultsView } from "@/app/(dashboard)/rules/results/rule-results-data";
import type { JournalRuleIdeaRecord } from "./journal-rule-idea-contracts";
import type { CandleReviewRecord, CandleReviewTarget } from "@/src/modules/level-analysis/contracts/candle-review-contracts";
import type { TradingRulesDashboardView } from "@/src/modules/journal/server/annotations/journal-trading-rules-dashboard";
import type { PlatformOfflineCoverageFact } from "@/src/modules/platform/contracts/platform-offline-saved-view-contracts";

export type JournalOfflineRouteKind =
  | "calendar"
  | "trade-explorer"
  | "compare-trades"
  | "trading-rules"
  | "rule-results"
  | "candle-review";

export const JOURNAL_OFFLINE_ROUTE_VIEW_VERSION = "journal-route-view-v1" as const;

export const JOURNAL_OFFLINE_ROUTE_VIEW_KEYS: Readonly<Record<JournalOfflineRouteKind, string>> = Object.freeze({
  "calendar": "journal:calendar:current",
  "candle-review": "journal:candle-review:current",
  "compare-trades": "journal:compare-trades:current",
  "rule-results": "journal:rule-results:current",
  "trade-explorer": "journal:trade-explorer:current",
  "trading-rules": "journal:trading-rules:current",
});

export type JournalCalendarOfflineViewModel = Readonly<{
  availableMonths: readonly string[];
  availableWeekOptions: readonly CalendarWeekOption[];
  availableWeeks: readonly string[];
  initialData: CalendarData;
  initialFilters: CalendarFilterInput;
  initialView: CalendarView;
  kind: "calendar";
  selectedMonth: string;
  selectedWeek: string;
  version: 1;
}>;

export type JournalTradeExplorerOfflineViewModel = Readonly<{
  kind: "trade-explorer";
  model: TradeExplorerPageModel;
  version: 1;
}>;

export type JournalCompareTradesOfflineViewModel = Readonly<{
  kind: "compare-trades";
  model: TradeExplorerPageModel;
  studies: readonly TradeExplorerComparisonStudy[];
  version: 1;
}>;

export type JournalTradingRulesOfflineViewModel = Readonly<{
  initialRuleIdeas: readonly JournalRuleIdeaRecord[];
  initialView: Omit<TradingRulesDashboardView, "expectedAccountSelectionRef">;
  kind: "trading-rules";
  monetaryMultiplier: string;
  reportingCurrency: string;
  sourceCurrency: string;
  version: 1;
}>;

export type JournalRuleResultsOfflineViewModel = Readonly<{
  initialView: RuleResultsView;
  kind: "rule-results";
  version: 1;
}>;

export type JournalCandleReviewOfflineViewModel = Readonly<{
  currency: string;
  initialReview: CandleReviewRecord | null;
  kind: "candle-review";
  trade: CandleReviewTarget;
  version: 1;
}>;

export type JournalOfflineRouteViewModel =
  | JournalCalendarOfflineViewModel
  | JournalTradeExplorerOfflineViewModel
  | JournalCompareTradesOfflineViewModel
  | JournalTradingRulesOfflineViewModel
  | JournalRuleResultsOfflineViewModel
  | JournalCandleReviewOfflineViewModel;

export function journalOfflineRouteCoverage(
  kind: JournalOfflineRouteKind,
): readonly PlatformOfflineCoverageFact[] {
  return Object.freeze([Object.freeze({
    key: kind,
    label: kind === "calendar" ? "Trading Calendar"
      : kind === "trade-explorer" ? "Trade Explorer"
        : kind === "compare-trades" ? "Compare trades"
          : kind === "trading-rules" ? "Trading Rules"
            : kind === "rule-results" ? "Rule Results"
              : "Candle Review",
    reason: null,
    status: "available",
  }), Object.freeze({
    key: `${kind}_changes`,
    label: "Changes and live refresh",
    reason: "Reconnect to change saved information or request updated results.",
    status: "unavailable",
  })]);
}

export function createJournalTradeExplorerOfflineViewModel(
  model: TradeExplorerPageModel,
): JournalTradeExplorerOfflineViewModel {
  return Object.freeze({
    kind: "trade-explorer",
    model: Object.freeze({ ...model, expectedAccountSelectionRef: "" }),
    version: 1,
  });
}

export function createJournalCompareTradesOfflineViewModel(
  model: TradeExplorerPageModel,
  studies: readonly TradeExplorerComparisonStudy[],
): JournalCompareTradesOfflineViewModel {
  return Object.freeze({
    kind: "compare-trades",
    model: Object.freeze({ ...model, expectedAccountSelectionRef: "" }),
    studies: Object.freeze(studies.map((study) => Object.freeze({
      ...study,
      groups: Object.freeze(study.groups.map((group) => Object.freeze({
        ...group,
        query: Object.freeze({ ...group.query, expectedAccountSelectionRef: "" }),
      }))),
    }))),
    version: 1,
  });
}

export function createJournalTradingRulesOfflineViewModel(input: Omit<JournalTradingRulesOfflineViewModel, "kind" | "version">): JournalTradingRulesOfflineViewModel {
  const { expectedAccountSelectionRef: _selectionRef, ...initialView } = input.initialView as TradingRulesDashboardView;
  void _selectionRef;
  return Object.freeze({
    ...input,
    initialView: Object.freeze(initialView),
    kind: "trading-rules",
    version: 1,
  });
}

export function createJournalCandleReviewOfflineViewModel(input: Omit<JournalCandleReviewOfflineViewModel, "kind" | "version">): JournalCandleReviewOfflineViewModel {
  const trade = Object.freeze({ ...input.trade, roundTripId: "offline-trade", roundTripVersionId: "offline-trade-version" });
  const initialReview = input.initialReview ? Object.freeze({
    ...input.initialReview,
    candleReviewId: "offline-candle-review",
    target: trade,
  }) : null;
  return Object.freeze({ ...input, initialReview, kind: "candle-review", trade, version: 1 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isJournalOfflineRouteViewModel(
  value: unknown,
  expectedKind: JournalOfflineRouteKind,
): value is JournalOfflineRouteViewModel {
  if (!isRecord(value) || value.version !== 1 || value.kind !== expectedKind) return false;
  if (expectedKind === "calendar") {
    return isRecord(value.initialData) && Array.isArray(value.availableMonths) &&
      Array.isArray(value.availableWeeks) && Array.isArray(value.availableWeekOptions);
  }
  if (expectedKind === "trade-explorer") return isRecord(value.model);
  if (expectedKind === "compare-trades") return isRecord(value.model) && Array.isArray(value.studies);
  if (expectedKind === "trading-rules") return isRecord(value.initialView) && Array.isArray(value.initialRuleIdeas);
  if (expectedKind === "rule-results") return isRecord(value.initialView);
  return typeof value.currency === "string" && isRecord(value.trade) &&
    (value.initialReview === null || isRecord(value.initialReview));
}
