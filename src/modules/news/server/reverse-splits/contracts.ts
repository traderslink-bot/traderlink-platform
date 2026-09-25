export type SplitStatus = "confirmed" | "announced" | "approved" | "postponed" | "cancelled";
export type SplitSource = Readonly<{
  url: string; kind: "nasdaq" | "sec"; title: string; publishedDate: string;
  ticker: string | null; company: string | null;
}>;
export type ReverseSplitEvent = Readonly<{
  ticker: string; company: string; status: SplitStatus; ratio: number | null;
  authorizedRatio: string | null; effectiveDate: string | null; approvalDate: string | null;
  approvalExpiresDate?: string | null;
  source: SplitSource; evidence: string;
}>;
export type SplitMarketData = Readonly<{
  float: number | null; floatRetrievedAt: string; close: number | null;
  closeDate: string | null; expectedCloseDate: string; eligibleSecurity: boolean;
  issues: readonly string[];
}>;
export type ParseResult = Readonly<{
  event: ReverseSplitEvent | null; outcome: "parsed" | "ignored" | "deferred"; reason: string;
}>;
export function isoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/u.test(value) && Number.isFinite(Date.parse(`${value}T12:00:00Z`)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value;
}
export function shiftDate(value: string, days: number): string {
  if (!isoDate(value)) throw new Error("reverse_split_invalid_date");
  return new Date(Date.parse(`${value}T12:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
}
export function validTicker(value: string): boolean { return /^[A-Z][A-Z0-9.\-]{0,3}$/u.test(value); }
export function positiveNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}
export function record(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
