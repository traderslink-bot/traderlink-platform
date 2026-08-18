export const JOURNAL_RULE_IDEA_EVIDENCE_VERSION = "journal_rule_idea_evidence_v1" as const;

export type JournalRuleIdeaTemplateId =
  | "cooldown_after_loss"
  | "cooldown_before_same_ticker_reentry"
  | "maximum_attempts_per_ticker"
  | "maximum_trades_per_day"
  | "no_new_trades_after_time"
  | "stop_after_consecutive_losses"
  | "stop_after_total_daily_losses"
  | "stop_after_daily_realized_loss"
  | "stop_after_losing_ticker_attempts"
  | "stop_after_profit_giveback"
  | "stop_after_daily_realized_gain_limit";

export type JournalRuleIdeaEvidence = Readonly<{
  evidenceVersion: typeof JOURNAL_RULE_IDEA_EVIDENCE_VERSION;
  templateId: JournalRuleIdeaTemplateId;
  configuration: Readonly<Record<string, string>>;
  currency: string;
  periodStart: string;
  periodEnd: string;
  eligibleTradingDays: number;
  eligibleTrades: number;
  eligibleExecutions: number;
  triggerCount: number;
  triggerDays: number;
  affectedTradeCount: number;
  comparisonTradeCount: number;
  affectedPnlDecimal: string;
  comparisonPnlDecimal: string;
  affectedAveragePnlDecimal: string;
  comparisonAveragePnlDecimal: string;
  affectedPnlWithoutWorstTradeDecimal: string;
  dominantTicker: string | null;
  dominantTickerShareDecimal: string;
  recentAndEarlierConsistent: boolean;
  factSetRevisionSha256: string;
  affectedRoundTripIds: readonly string[];
  comparisonRoundTripIds: readonly string[];
  limitation: "Historical results do not prove what a rule would do in future trading.";
}>;

export type JournalRuleIdeaDisposition = "available" | "saved_for_later" | "not_for_me" | "added";

export type JournalRuleIdeaRecord = Readonly<{
  ideaId: string;
  evidence: JournalRuleIdeaEvidence;
  evidenceSha256: string;
  disposition: JournalRuleIdeaDisposition;
  revision: number;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;
