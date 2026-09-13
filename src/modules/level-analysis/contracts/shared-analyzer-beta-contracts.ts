export type SharedAnalyzerAvailability = Readonly<{
  enabled: boolean;
  daysUntilReset: number;
} & ({
  unlimited: true;
  dailyAvailable: null;
  periodAvailable: null;
  selectableAvailable: null;
} | {
  unlimited?: false;
  dailyAvailable: number;
  periodAvailable: number;
  selectableAvailable: number;
})>;

export function hasSharedAnalyzerAllowance(value: SharedAnalyzerAvailability): boolean {
  return value.enabled && (value.unlimited === true || value.selectableAvailable > 0);
}

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
  | "retry_limit_reached"
  | "disabled"
  | "demo_unavailable";
