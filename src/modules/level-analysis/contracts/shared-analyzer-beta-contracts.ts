export type SharedAnalyzerAvailability = Readonly<{
  enabled: boolean;
  dailyAvailable: number;
  periodAvailable: number;
  selectableAvailable: number;
  daysUntilReset: number;
}>;

export type SharedAnalyzerSettings = Readonly<{
  enabled: boolean;
  dailyLimit: number;
  periodLimit: number;
  globalRolling24HourLimit: number;
  requestSpacingSeconds: number;
  revision: number;
  designatedConnectionConfigured: boolean;
}>;

export type SharedAnalyzerSelectionOutcome =
  | "queued"
  | "already_requested"
  | "not_eligible"
  | "usage_exhausted"
  | "disabled"
  | "demo_unavailable";
