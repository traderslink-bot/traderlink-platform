export type SharedAnalyzerAvailability = Readonly<{
  enabled: boolean;
  daysUntilReset: number;
  membership?: Readonly<{ included?: boolean; remaining: number | null; resetsAtUtc: string | null; resetDays: number | null }>;
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

const analyzerMarketDate = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
});

export function isSameAnalyzerMarketDay(openedAtUtc: string, closedAtUtc: string): boolean {
  return analyzerMarketDate.format(new Date(openedAtUtc)) === analyzerMarketDate.format(new Date(closedAtUtc));
}
