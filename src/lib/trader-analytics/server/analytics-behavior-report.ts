import type {
  SavedTradeThread,
  SavedTradeThreadEvidenceTone,
  SavedTradeThreadMarketContextFinding,
  SavedTradeThreadReadModel,
  SavedTradeThreadRoundTrip,
} from "./saved-trade-threads";
import { userFacingTradeSymbol } from "../product/trade-display-copy";
import type { UserFacingBehaviorOpportunityType } from "../../user-facing-behavior";

export type AnalyticsBehaviorReportGroupId =
  | "entry-resistance"
  | "entry-support"
  | "entry-extension"
  | "dip-buy-adds"
  | "full-trade-management"
  | "profit-protection"
  | "profit-taking-exits"
  | "volume-reentry";

export type AnalyticsBehaviorReportTone =
  | "danger"
  | "info"
  | "success"
  | "warning";

export interface AnalyticsBehaviorReportEvidenceItem {
  detail: string;
  findingLabel: string;
  href: string;
  opportunityType: UserFacingBehaviorOpportunityType;
  pnl: number | null;
  reviewAction: string;
  symbol: string;
  tone: SavedTradeThreadEvidenceTone;
  tradeId: string;
}

export interface AnalyticsBehaviorReportGroup {
  actionLabel: string;
  count: number;
  description: string;
  emptyState: string;
  evidence: AnalyticsBehaviorReportEvidenceItem[];
  id: AnalyticsBehaviorReportGroupId;
  question: string;
  reviewPromptCount: number;
  riskCount: number;
  strengthCount: number;
  title: string;
  tone: AnalyticsBehaviorReportTone;
}

export interface AnalyticsBehaviorReport {
  contractVersion: "analytics_behavior_report_v1";
  groups: AnalyticsBehaviorReportGroup[];
  reviewPromptCount: number;
  riskCount: number;
  strengthCount: number;
  totalFindingCount: number;
}

interface BehaviorReportGroupDefinition {
  actionLabel: string;
  description: string;
  emptyState: string;
  ids: readonly string[];
  id: AnalyticsBehaviorReportGroupId;
  question: string;
  title: string;
}

const BEHAVIOR_REPORT_GROUPS: readonly BehaviorReportGroupDefinition[] = [
  {
    actionLabel: "Open entry-location trades",
    description:
      "Entry started just below overhead resistance and the trade finished red. Review whether there was enough room before that level.",
    emptyState:
      "No chart-confirmed resistance-entry example yet. The app needs historical support/resistance context from the trade date before it can make this call.",
    id: "entry-resistance",
    ids: [
      "entry_near_daily_4h_resistance",
      "entry_limited_clean_room_to_resistance",
      "stacked_daily_4h_resistance_above_entry",
    ],
    question: "Did entries start too close below overhead resistance?",
    title: "Entries Under Resistance",
  },
  {
    actionLabel: "Open support-entry trades",
    description:
      "Entry started near support below and the trade later worked. Review whether support actually held and what made the entry repeatable.",
    emptyState:
      "No chart-confirmed support-entry strength yet. A profitable trade still needs historical support evidence before the app praises the location.",
    id: "entry-support",
    ids: [
      "entry_near_daily_4h_support",
      "entry_far_from_daily_4h_support",
      "breakout_had_room_above",
      "entry_had_constructive_location",
    ],
    question: "Which entries had useful support, and which lacked it?",
    title: "Support-Based Entries",
  },
  {
    actionLabel: "Open chase and extension reviews",
    description:
      "This group looks for entries that came after a move was already extended, or breakout entries where follow-through did not hold.",
    emptyState:
      "No chart-confirmed chase or extension example yet. The app needs pre-entry candle context before it can call an entry extended.",
    id: "entry-extension",
    ids: ["entry_chase_or_late_extension", "entry_breakout_failed"],
    question: "Did the entry happen after the cleaner part of the move?",
    title: "Chase And Extension Review",
  },
  {
    actionLabel: "Open add and dip reviews",
    description:
      "Dip buys and adds are only scored when chart evidence shows whether support held, price repaired, or the add increased risk into weakness.",
    emptyState:
      "No chart-confirmed dip-buy or add-quality example yet. Execution-replay adverse adds stay as review prompts until chart evidence shows support, repair, or weakness.",
    id: "dip-buy-adds",
    ids: [
      "adds_increased_risk_into_weakness",
      "adds_aligned_with_strength",
      "adds_after_trade_already_used_range",
      "adds_near_daily_4h_resistance",
      "adds_above_resistance_with_room",
      "winner_stayed_undersized",
    ],
    question: "Were adds planned dip buys, constructive adds, or added risk?",
    title: "Dip-Buy And Add Review",
  },
  {
    actionLabel: "Open profit-protection trades",
    description:
      "This group looks for open profit that was protected, or open profit that was available but not protected before the trade faded.",
    emptyState:
      "No chart-confirmed profit-protection example yet. The app needs open-profit path, realized capture, and exit context before judging giveback.",
    id: "profit-protection",
    ids: [
      "profit_protection_failed",
      "protected_profit_before_fade",
      "exit_captured_trade_well",
      "exit_avoided_adverse_followthrough",
      "exit_left_continuation",
      "exit_large_post_exit_move_needs_review",
      "exit_needs_post_exit_context",
    ],
    question: "Was open profit protected or given back?",
    title: "Profit Protection",
  },
  {
    actionLabel: "Open full-trade management reviews",
    description:
      "This group looks for trades where active management, controlled giveback, final exit, and after-exit evidence line up as one constructive management story.",
    emptyState:
      "No chart-confirmed full-trade management strength yet. The app needs active-management evidence, controlled giveback, a flat exit, and after-exit candles before praising the whole trade.",
    id: "full-trade-management",
    ids: [
      "balanced_management_with_constructive_exit",
      "add_into_strength_with_constructive_final_exit",
    ],
    question:
      "Which trades showed constructive management into the final exit?",
    title: "Full-Trade Management",
  },
  {
    actionLabel: "Open exit-location trades",
    description:
      "This group checks whether reductions and exits happened near meaningful support or resistance, then separates strong exits from review prompts.",
    emptyState:
      "No chart-confirmed support/resistance exit example yet. The app needs final-exit or reduction location plus historical levels from that session.",
    id: "profit-taking-exits",
    ids: [
      "reductions_near_resistance",
      "exit_into_resistance_with_reversal_after_exit",
      "exit_into_resistance_before_breakout",
      "exit_into_support_before_breakdown",
      "exit_into_support_with_relief_after_exit",
    ],
    question: "Did reductions or exits use support and resistance well?",
    title: "Profit Taking Near Levels",
  },
  {
    actionLabel: "Open volume re-entry stories",
    description:
      "This group compares later same-symbol attempts against the first push so the user can review whether participation faded or stayed strong.",
    emptyState:
      "No comparable re-entry volume evidence yet. The app needs saved chart-volume context for both the first push and later attempt.",
    id: "volume-reentry",
    ids: ["reentry_volume_faded", "reentry_volume_confirmed"],
    question: "Did later re-entries still have participation?",
    title: "Volume And Re-Entries",
  },
];

function findingPriority(
  finding: SavedTradeThreadMarketContextFinding,
): number {
  if (
    finding.canDrivePrimaryConclusion &&
    finding.opportunityType === "risk_to_reduce"
  ) {
    return 0;
  }

  if (
    finding.canDrivePrimaryConclusion &&
    finding.opportunityType === "strength_to_repeat"
  ) {
    return 1;
  }

  if (finding.opportunityType === "review_prompt") {
    return 2;
  }

  return 3;
}

function groupTone(args: {
  count: number;
  reviewPromptCount: number;
  riskCount: number;
  strengthCount: number;
}): AnalyticsBehaviorReportTone {
  if (args.riskCount > 0) {
    return "danger";
  }

  if (args.strengthCount > 0) {
    return "success";
  }

  if (args.reviewPromptCount > 0) {
    return "warning";
  }

  return args.count > 0 ? "info" : "info";
}

function countByOpportunity(
  findings: SavedTradeThreadMarketContextFinding[],
  opportunityType: UserFacingBehaviorOpportunityType,
): number {
  return findings.filter((finding) => {
    if (finding.opportunityType !== opportunityType) {
      return false;
    }

    return (
      opportunityType === "review_prompt" || finding.canDrivePrimaryConclusion
    );
  }).length;
}

function hrefForRoundTrip(
  roundTrip: SavedTradeThreadRoundTrip | undefined,
): string {
  if (!roundTrip) {
    return "/intelligence/trades/ticker-stories#ticker-stories";
  }

  return roundTrip.href.includes("#")
    ? roundTrip.href
    : `${roundTrip.href}#execution`;
}

function evidenceDetail(args: {
  definition: BehaviorReportGroupDefinition;
  finding: SavedTradeThreadMarketContextFinding;
  roundTrip: SavedTradeThreadRoundTrip | undefined;
}): string {
  const pnl = args.roundTrip?.grossRealizedPnl ?? null;

  if (args.definition.id === "entry-resistance" && typeof pnl === "number") {
    if (pnl < 0) {
      return "Entry started just below overhead resistance and the trade finished red. Review whether there was enough room before that level.";
    }

    return "Entry started just below overhead resistance. Review whether the trade had enough room and what confirmed the entry despite overhead structure.";
  }

  if (args.definition.id === "entry-support" && typeof pnl === "number") {
    if (args.finding.sourceInsightId === "entry_far_from_daily_4h_support") {
      return pnl < 0
        ? "Entry was not close to clear support and the trade finished red. Review whether risk was defined well enough before entry."
        : "Entry was not close to clear support, but the trade finished green. Review what other evidence made the entry work.";
    }

    if (pnl > 0) {
      return "Entry started near support below and the trade later worked. Review whether support held and what made the entry repeatable.";
    }

    return "Entry had support context, but the trade did not finish green. Review whether support actually held after entry.";
  }

  if (args.definition.id === "dip-buy-adds") {
    if (args.finding.opportunityType === "risk_to_reduce") {
      return "Add evidence points to more risk after adverse movement. Review whether this was a planned dip buy or size added before repair.";
    }

    if (args.finding.opportunityType === "strength_to_repeat") {
      return "Add evidence was constructive. Review what confirmation was present before size increased so it can become a repeatable rule.";
    }

    return "This add needs context. Review whether support held, price reclaimed, or the add only increased exposure.";
  }

  if (args.definition.id === "profit-protection") {
    if (args.finding.opportunityType === "strength_to_repeat") {
      return "Profit protection evidence was positive. Review the exit cue that helped keep the trade from giving back more.";
    }

    if (args.finding.opportunityType === "risk_to_reduce") {
      return "Open profit was available but not fully protected. Review where a trim, stop move, or runner rule should have been defined.";
    }
  }

  if (args.definition.id === "full-trade-management") {
    if (args.finding.opportunityType === "strength_to_repeat") {
      return "The active-management, final-exit, and after-exit evidence lined up. Review the cues that made the whole management path repeatable.";
    }

    return "Review whether the active-management, final-exit, and after-exit evidence support a repeatable management rule.";
  }

  if (args.definition.id === "profit-taking-exits") {
    if (args.finding.opportunityType === "strength_to_repeat") {
      return "Exit or reduction evidence lined up with a level. Review the cue so it can become a repeatable profit-taking rule.";
    }

    if (args.finding.opportunityType === "risk_to_reduce") {
      return "Exit or reduction evidence needs review near a level. Check whether the plan needed a runner, partial, or clearer exit rule.";
    }
  }

  if (args.definition.id === "volume-reentry") {
    if (args.finding.opportunityType === "strength_to_repeat") {
      return "Later re-entry volume stayed constructive. Review what confirmed renewed participation before re-entering.";
    }

    if (args.finding.opportunityType === "risk_to_reduce") {
      return "Later re-entry volume was lower. Review whether the second attempt had enough participation to justify another trade.";
    }
  }

  return args.finding.detail;
}

export function buildAnalyticsBehaviorReport(
  model: SavedTradeThreadReadModel,
  options: { includeChartContext?: boolean } = {},
): AnalyticsBehaviorReport {
  if (options.includeChartContext === false) {
    return {
      contractVersion: "analytics_behavior_report_v1",
      groups: [],
      reviewPromptCount: 0,
      riskCount: 0,
      strengthCount: 0,
      totalFindingCount: 0,
    };
  }

  const roundTripsByTradeId = new Map<
    string,
    { roundTrip: SavedTradeThreadRoundTrip; thread: SavedTradeThread }
  >();

  model.threads.forEach((thread) => {
    thread.roundTrips.forEach((roundTrip) => {
      roundTripsByTradeId.set(roundTrip.tradeId, { roundTrip, thread });
    });
  });

  const groups = BEHAVIOR_REPORT_GROUPS.map((definition) => {
    const acceptedIds = new Set(definition.ids);
    const findings = model.threads
      .flatMap((thread) => thread.marketContextFindings)
      .filter((finding) => acceptedIds.has(finding.sourceInsightId));
    const riskCount = countByOpportunity(findings, "risk_to_reduce");
    const strengthCount = countByOpportunity(findings, "strength_to_repeat");
    const reviewPromptCount = countByOpportunity(findings, "review_prompt");
    const evidence = findings
      .map((finding) => {
        const context = roundTripsByTradeId.get(finding.tradeId);
        const roundTrip = context?.roundTrip;
        const thread = context?.thread;

        return {
          evidence: {
            detail: evidenceDetail({ definition, finding, roundTrip }),
            findingLabel: finding.label,
            href: hrefForRoundTrip(roundTrip),
            opportunityType: finding.opportunityType,
            pnl: roundTrip?.grossRealizedPnl ?? null,
            reviewAction: finding.reviewAction,
            symbol: userFacingTradeSymbol(
              thread?.symbol ?? roundTrip?.symbol ?? null,
              "Priority trade",
            ),
            tone: finding.tone,
            tradeId: finding.tradeId,
          } satisfies AnalyticsBehaviorReportEvidenceItem,
          priority: findingPriority(finding),
        };
      })
      .sort((left, right) => {
        const priorityDelta = left.priority - right.priority;
        if (priorityDelta !== 0) {
          return priorityDelta;
        }

        return (
          Math.abs(right.evidence.pnl ?? 0) - Math.abs(left.evidence.pnl ?? 0)
        );
      })
      .slice(0, 3)
      .map((item) => item.evidence);

    return {
      actionLabel: definition.actionLabel,
      count: findings.length,
      description: definition.description,
      emptyState: definition.emptyState,
      evidence,
      id: definition.id,
      question: definition.question,
      reviewPromptCount,
      riskCount,
      strengthCount,
      title: definition.title,
      tone: groupTone({
        count: findings.length,
        reviewPromptCount,
        riskCount,
        strengthCount,
      }),
    } satisfies AnalyticsBehaviorReportGroup;
  });

  return {
    contractVersion: "analytics_behavior_report_v1",
    groups,
    reviewPromptCount: groups.reduce(
      (total, group) => total + group.reviewPromptCount,
      0,
    ),
    riskCount: groups.reduce((total, group) => total + group.riskCount, 0),
    strengthCount: groups.reduce(
      (total, group) => total + group.strengthCount,
      0,
    ),
    totalFindingCount: groups.reduce((total, group) => total + group.count, 0),
  };
}
