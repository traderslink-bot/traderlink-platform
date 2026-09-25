export type ReverseSplitFilter = "all" | "approved" | "announced" | "history";
export type ReverseSplitRow = Readonly<{
  id: string;
  ticker: string;
  company: string;
  status: "Approved" | "Announced" | "Postponed" | "Cancelled" | "Past announcement" | "Approval expired";
  watchlistLabel: "Reverse split approved" | "Reverse split announced" | null;
  approvedRatio: string | null;
  ratio: number | null;
  approvalDate: string | null;
  approvalExpiresDate: string | null;
  tradingDate: string | null;
  float: number | null;
  estimatedPostSplitFloat: number | null;
  floatRetrievedAt: string | null;
  close: number | null;
  closeDate: string | null;
  sourceUrl: string;
  sourceKind: "nasdaq" | "sec";
  sourcePublishedDate: string;
  checkedAt: string | null;
}>;

export type ReverseSplitCoverage = Readonly<{
  state: "ready" | "partial" | "unavailable" | "disabled";
  note: string | null;
  checkedAt: string | null;
}>;

export type ReverseSplitDashboard = Readonly<{
  items: readonly ReverseSplitRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  filter: ReverseSplitFilter;
  ticker: string;
  marketDate: string;
  coverage: ReverseSplitCoverage;
}>;

export type WatchlistReverseSplits = Readonly<{
  items: readonly ReverseSplitRow[];
  generatedAt: string;
}>;

export function reverseSplitQuantity(value: number | null): string {
  return value === null ? "—" : Math.floor(value).toLocaleString("en-US");
}

export function reverseSplitClose(value: number | null): string {
  if (value === null) return "—";
  return value < 0.01 ? "<$0.01" : value.toLocaleString("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function reverseSplitDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date) : "—";
}

export function reverseSplitCheckedAt(value: string | null): string {
  if (!value || !Number.isFinite(Date.parse(value))) return "—";
  return `${new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/New_York" }).format(new Date(value))} ET`;
}
