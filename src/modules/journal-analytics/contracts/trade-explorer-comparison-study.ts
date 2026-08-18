export const TRADE_EXPLORER_COMPARISON_STUDY_VERSION =
  "trade_explorer_comparison_study_v1" as const;

export type TradeExplorerComparisonStudyLifecycleState = "active" | "retired";

export type TradeExplorerComparisonStudyPayload = Readonly<{
  studyVersion: typeof TRADE_EXPLORER_COMPARISON_STUDY_VERSION;
  normalizedStudyJson: string;
  studySha256: string;
}>;

export type TradeExplorerComparisonStudyRecord = Readonly<{
  studyId: string;
  name: string;
  revision: number;
  lifecycleState: TradeExplorerComparisonStudyLifecycleState;
  studyVersion: typeof TRADE_EXPLORER_COMPARISON_STUDY_VERSION;
  normalizedStudyJson: string;
  studySha256: string;
  createdAtUtc: string;
  updatedAtUtc: string;
}>;
