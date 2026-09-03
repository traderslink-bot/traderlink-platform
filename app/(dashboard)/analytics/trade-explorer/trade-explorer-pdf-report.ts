import { readFile } from "node:fs/promises";
import path from "node:path";
import { deflateSync, inflateSync } from "node:zlib";

import type { WorkspaceAccessScope } from "@/src/modules/platform/contracts/workspace-access-scope";
import type {
  JournalAnalyticsGroupResult,
  JournalAnalyticsMetricResult,
  JournalAnalyticsRoundTripTableRow,
} from "@/src/modules/journal-analytics/contracts/analytics-result";
import {
  formatJournalAnalyticsDecimal,
  formatJournalAnalyticsDuration,
  formatJournalAnalyticsMetric,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import {
  compareTradeExplorerMetricValues,
  TRADE_EXPLORER_TRADE_SORT_OPTIONS,
  tradeExplorerMetricForMoneyBasis,
  tradeExplorerMetricForOutcome,
  tradeExplorerTradeSortForOutcome,
  type TradeExplorerTradeSort,
} from "@/src/modules/journal-analytics/presentation/trade-explorer-ordering";

import { normalizeAnalyticsLabPlatformQuery } from "../lab/analytics-lab-platform-query";
import type {
  AnalyticsLabPlatformPreview,
  AnalyticsLabPlatformQuery,
} from "../lab/analytics-lab-platform-types";

export type TradeExplorerPdfResultView =
  | "trades"
  | "days"
  | "tickers"
  | "entry_times"
  | "holding_time"
  | "position_size"
  | "periods";

type SortDirection = "ascending" | "descending";
type ReportColumn = Readonly<{
  label: string;
  metricId?: string;
  kind?: "day_path";
  weight?: number;
}>;
type ReportView = Readonly<{
  label: string;
  firstColumnLabel: string;
  columns: readonly ReportColumn[];
}>;
type ReportFeeNotice = Readonly<{
  excludedTradeCount: number;
}>;
type ReportTable = Readonly<{
  title: string;
  dateRange: string;
  generatedAt: string;
  feeNotice: ReportFeeNotice | null;
  filters: readonly string[];
  columns: readonly string[];
  columnWeights: readonly number[];
  rows: readonly (readonly string[])[];
}>;

const NO_FEE_TRADES_URL = "https://app.traderslink.pro/workspace?filter=fees_not_entered";

const REPORT_VIEWS: Readonly<Record<Exclude<TradeExplorerPdfResultView, "trades">, ReportView>> = Object.freeze({
  days: Object.freeze({
    label: "Trading Days",
    firstColumnLabel: "Date",
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Wins", metricId: "win_count" },
      { label: "Losses", metricId: "loss_count" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Day movement", kind: "day_path" as const, weight: 1.35 },
    ]),
  }),
  tickers: Object.freeze({
    label: "Tickers",
    firstColumnLabel: "Ticker",
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Wins", metricId: "win_count" },
      { label: "Losses", metricId: "loss_count" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Avg P/L", metricId: "average_pnl" },
      { label: "Avg hold", metricId: "average_holding_time" },
      { label: "Avg shares", metricId: "average_share_quantity" },
      { label: "Avg entry value", metricId: "average_entry_notional", weight: 1.2 },
    ]),
  }),
  entry_times: Object.freeze({
    label: "Entry Times",
    firstColumnLabel: "Entry time",
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Avg P/L", metricId: "average_pnl" },
      { label: "Avg hold", metricId: "average_holding_time" },
      { label: "Avg shares", metricId: "average_share_quantity" },
    ]),
  }),
  holding_time: Object.freeze({
    label: "Holding Time",
    firstColumnLabel: "Holding range",
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Avg P/L", metricId: "average_pnl" },
      { label: "Avg hold", metricId: "average_holding_time" },
      { label: "Avg shares", metricId: "average_share_quantity" },
    ]),
  }),
  position_size: Object.freeze({
    label: "Position Size",
    firstColumnLabel: "Maximum shares",
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Avg P/L", metricId: "average_pnl" },
      { label: "Avg shares", metricId: "average_share_quantity" },
      { label: "Avg entry value", metricId: "average_entry_notional", weight: 1.2 },
      { label: "Avg hold", metricId: "average_holding_time" },
    ]),
  }),
  periods: Object.freeze({
    label: "Periods",
    firstColumnLabel: "Period",
    columns: Object.freeze([
      { label: "Trades", metricId: "total_trades" },
      { label: "Wins", metricId: "win_count" },
      { label: "Losses", metricId: "loss_count" },
      { label: "Win rate", metricId: "win_rate" },
      { label: "Net P/L", metricId: "net_pnl" },
      { label: "Avg P/L", metricId: "average_pnl" },
      { label: "Best trade", metricId: "best_trade" },
      { label: "Worst trade", metricId: "worst_trade" },
    ]),
  }),
});

function inputRecord(input: unknown): Readonly<Record<string, unknown>> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("Invalid Trade Explorer PDF report request.");
  }
  return input as Readonly<Record<string, unknown>>;
}

function normalizeResultView(input: unknown): TradeExplorerPdfResultView {
  if (![
    "trades", "days", "tickers", "entry_times", "holding_time",
    "position_size", "periods",
  ].includes(String(input))) {
    throw new TypeError("Invalid Trade Explorer PDF result view.");
  }
  return input as TradeExplorerPdfResultView;
}

function normalizeSortDirection(input: unknown): SortDirection {
  if (input !== "ascending" && input !== "descending") {
    throw new TypeError("Invalid Trade Explorer PDF sort direction.");
  }
  return input;
}

function normalizeTradeSort(input: unknown): TradeExplorerTradeSort {
  const option = TRADE_EXPLORER_TRADE_SORT_OPTIONS.find((candidate) =>
    candidate.value === input);
  if (!option) throw new TypeError("Invalid Trade Explorer PDF trade sort.");
  return option.value;
}

function requireViewGrouping(
  resultView: TradeExplorerPdfResultView,
  grouping: AnalyticsLabPlatformQuery["grouping"],
): void {
  const matches = resultView === "trades"
    ? true
    : resultView === "days"
      ? grouping === "closing_day"
      : resultView === "tickers"
        ? grouping === "instrument"
        : resultView === "entry_times"
          ? grouping === "entry_time_bucket"
          : resultView === "holding_time"
            ? grouping === "holding_duration_bucket"
            : resultView === "position_size"
              ? grouping === "maximum_position_bucket"
              : ["closing_day", "closing_iso_week", "closing_month", "closing_year"]
                  .includes(grouping);
  if (!matches) throw new TypeError("Trade Explorer PDF view and grouping do not match.");
}

function metric(
  group: Pick<JournalAnalyticsGroupResult, "metrics">,
  metricId: string,
): JournalAnalyticsMetricResult | null {
  return group.metrics.find((candidate) => candidate.metricId === metricId) ?? null;
}

function reportMoney(valueDecimal: string | null, currency: string | null): string {
  if (valueDecimal === null) return "N/A";
  const value = formatJournalAnalyticsDecimal(valueDecimal, 2, true);
  const negative = value.startsWith("-");
  const unsigned = negative ? value.slice(1) : value;
  const prefix = ["AUD", "CAD", "HKD", "MXN", "NZD", "SGD", "TWD", "USD"]
    .includes(currency ?? "") ? "$" : currency ? `${currency} ` : "";
  return `${negative ? "-" : ""}${prefix}${unsigned}`;
}

function reportMetric(result: JournalAnalyticsMetricResult | null): string {
  if (result === null || result.value === null) return "N/A";
  if (result.valueKind === "money") {
    const value = result.value.kind === "decimal"
      ? result.value.valueDecimal
      : result.value.kind === "rational"
        ? result.value.roundedDecimal
        : null;
    return value === null ? formatJournalAnalyticsMetric(result) : reportMoney(value, result.currency);
  }
  return formatJournalAnalyticsMetric(result);
}

function dayMovement(group: JournalAnalyticsGroupResult): string {
  const redToGreen = reportMetric(metric(group, "red_to_green_day_count"));
  const greenToRed = reportMetric(metric(group, "green_to_red_day_count"));
  if (redToGreen === "N/A" || greenToRed === "N/A") return "N/A";
  if (redToGreen === "1" && greenToRed === "1") return "Red to green and green to red";
  if (redToGreen === "1") return "Red to green";
  if (greenToRed === "1") return "Green to red";
  return "Neither";
}

function titleForMetric(result: JournalAnalyticsMetricResult | null): string {
  if (result === null) return "Selected result";
  if (result.metricId === "net_pnl") return "Net P/L";
  if (result.metricId === "gross_pnl") return "Gross P/L";
  return result.title
    .replaceAll("Entry Notional", "Entry Value")
    .replaceAll("entry notional", "entry value");
}

function groupColumns(
  view: ReportView,
  query: AnalyticsLabPlatformQuery,
  selectedMetric: JournalAnalyticsMetricResult | null,
): readonly ReportColumn[] {
  const columns = view.columns
    .filter((column) => query.outcome === null || (
      !["win_count", "loss_count", "win_rate"].includes(column.metricId ?? "") &&
      column.kind !== "day_path"
    ))
    .map((column) => column.metricId === "net_pnl"
      ? Object.freeze({
          ...column,
          label: query.moneyBasis === "gross" ? "Gross P/L" : "Net P/L",
          metricId: tradeExplorerMetricForMoneyBasis("net_pnl", query.moneyBasis),
        })
      : column);
  if (columns.some((column) => column.metricId === query.metricId)) {
    return Object.freeze(columns);
  }
  return Object.freeze([...columns, Object.freeze({
    label: titleForMetric(selectedMetric),
    metricId: query.metricId,
  })]);
}

function formatTradeCloseTime(value: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    timeZone,
    timeZoneName: "short",
  }).format(new Date(value));
}

function tradeRows(
  preview: AnalyticsLabPlatformPreview,
): readonly (readonly string[])[] {
  if (preview.evidence === null) return Object.freeze([]);
  const evidence = preview.evidence;
  return Object.freeze(evidence.rows.map((trade: JournalAnalyticsRoundTripTableRow) =>
    Object.freeze([
      trade.displayedSymbol,
      `${trade.closeLocalDate} ${formatTradeCloseTime(trade.closedAtUtc, evidence.timezone)}`,
      trade.direction === "long" ? "Long" : "Short",
      formatJournalAnalyticsDecimal(trade.enteredQuantityDecimal),
      reportMoney(trade.averageEntryPriceDecimal ?? null, evidence.currency),
      reportMoney(trade.averageExitPriceDecimal ?? null, evidence.currency),
      reportMoney(trade.entryNotionalDecimal, evidence.currency),
      reportMoney(trade.selectedPnlDecimal, evidence.currency),
      trade.returnPercentDecimal === null || trade.returnPercentDecimal === undefined
        ? "N/A"
        : `${formatJournalAnalyticsDecimal(trade.returnPercentDecimal)}%`,
      formatJournalAnalyticsDuration(trade.holdingDurationMilliseconds),
      String(trade.uniqueExecutionCount),
    ])));
}

function groupRows(
  preview: AnalyticsLabPlatformPreview,
  columns: readonly ReportColumn[],
  sortMetricId: string,
  sortDirection: SortDirection,
): readonly (readonly string[])[] {
  const showPartition = preview.response.partitions.length > 1;
  const showTimezone = new Set(preview.response.partitions.map((partition) =>
    partition.timezone)).size > 1;
  const groups = preview.response.partitions.flatMap((partition) => {
    const partitionKey = `${partition.currency ?? "none"}:${partition.timezone ?? "none"}`;
    const partitionLabel = showTimezone
      ? `${partition.currency ?? "No currency"} / ${partition.timezone ?? "No timezone"}`
      : partition.currency ?? "No currency";
    return partition.groups.map((group) => ({ group, partitionKey, partitionLabel }));
  });
  groups.sort((left, right) => {
    if (showPartition) {
      const partitionComparison = left.partitionKey.localeCompare(right.partitionKey);
      if (partitionComparison !== 0) return partitionComparison;
    }
    const leftValue = metric(left.group, sortMetricId)?.value ?? null;
    const rightValue = metric(right.group, sortMetricId)?.value ?? null;
    if (leftValue === null && rightValue === null) {
      return left.group.label.localeCompare(right.group.label);
    }
    if (leftValue === null) return 1;
    if (rightValue === null) return -1;
    const comparison = compareTradeExplorerMetricValues(leftValue, rightValue);
    if (comparison === null) return left.group.label.localeCompare(right.group.label);
    return sortDirection === "ascending" ? comparison : -comparison;
  });
  return Object.freeze(groups.map((item) => Object.freeze([
    item.group.label,
    ...(showPartition ? [item.partitionLabel] : []),
    ...columns.map((column) => column.kind === "day_path"
      ? dayMovement(item.group)
      : reportMetric(metric(item.group, column.metricId ?? ""))),
  ])));
}

function filterSummary(
  query: AnalyticsLabPlatformQuery,
  resultView: TradeExplorerPdfResultView,
  preview: AnalyticsLabPlatformPreview,
  tradeSort: TradeExplorerTradeSort,
  sortDirection: SortDirection,
): readonly string[] {
  const viewLabel = resultView === "trades" ? "Trades" : REPORT_VIEWS[resultView].label;
  const tradeSortLabel = TRADE_EXPLORER_TRADE_SORT_OPTIONS.find((option) =>
    option.value === tradeSort)?.label ?? "Newest first";
  const selectedTitle = titleForMetric(preview.selectedMetric);
  const filters = [
    `View: ${viewLabel}`,
    `Result basis: ${query.moneyBasis === "gross" ? "Gross P/L" : "Net P/L"}`,
    `Currency: ${query.currency ?? "All currencies"}`,
    `Ticker: ${query.symbol ?? "All tickers"}`,
    `Direction: ${query.direction === null ? "All directions" : query.direction === "long" ? "Long" : "Short"}`,
    `Result: ${query.outcome === null ? "All results" : query.outcome === "win" ? "Wins" : query.outcome === "loss" ? "Losses" : "Flat"}`,
    resultView === "trades"
      ? `Sort trades: ${tradeSortLabel}`
      : `Rank by: ${selectedTitle} - ${sortDirection === "descending" ? "Highest first" : "Lowest first"}`,
  ];
  if (query.entryWeekday !== null) filters.push(`Entry weekday: ${query.entryWeekday}`);
  if (query.entryTimeBucket !== null) filters.push(`Entry time: ${query.entryTimeBucket}`);
  if (query.tradeClassification !== null) {
    filters.push(`Trade type: ${query.tradeClassification === "day_trade" ? "Day trade" : "Multi-day trade"}`);
  }
  const ranges = [
    ["Holding seconds", query.minimumHoldingSeconds, query.maximumHoldingSeconds],
    ["Entered quantity", query.minimumEnteredQuantity, query.maximumEnteredQuantity],
    ["Maximum position", query.minimumPositionQuantity, query.maximumPositionQuantity],
    ["Entry value", query.minimumEntryNotional, query.maximumEntryNotional],
  ] as const;
  for (const [label, minimum, maximum] of ranges) {
    if (minimum !== null || maximum !== null) {
      filters.push(`${label}: ${minimum ?? "No minimum"} to ${maximum ?? "No maximum"}`);
    }
  }
  const timezones = [...new Set(preview.response.partitions.map((partition) =>
    partition.timezone).filter((value): value is string => value !== null))];
  filters.push(`Trading timezone: ${timezones.length === 0 ? "Not recorded" : timezones.join(", ")}`);
  return Object.freeze(filters);
}

function reportTable(
  query: AnalyticsLabPlatformQuery,
  resultView: TradeExplorerPdfResultView,
  preview: AnalyticsLabPlatformPreview,
  tradeSort: TradeExplorerTradeSort,
  sortDirection: SortDirection,
  generatedAtUtc: string,
): ReportTable {
  const viewLabel = resultView === "trades" ? "Trades" : REPORT_VIEWS[resultView].label;
  const feeNotice = query.moneyBasis === "net"
    ? Object.freeze({
        excludedTradeCount: preview.response.crossPartitionCounts.feeIncompleteCount,
      })
    : null;
  if (resultView === "trades") {
    return Object.freeze({
      title: `Trade Explorer - ${viewLabel}`,
      dateRange: `${query.startDate} to ${query.endDate}`,
      generatedAt: generatedAtUtc,
      feeNotice,
      filters: filterSummary(query, resultView, preview, tradeSort, sortDirection),
      columns: Object.freeze([
        "Ticker", "Closed", "Direction", "Shares", "Avg entry", "Avg exit",
        "Entry value", query.moneyBasis === "gross" ? "Gross P/L" : "Net P/L",
        "Return", "Hold", "Executions",
      ]),
      columnWeights: Object.freeze([0.75, 1.45, 0.72, 0.72, 0.82, 0.82, 0.95, 0.88, 0.72, 0.72, 0.72]),
      rows: tradeRows(preview),
    });
  }

  const view = REPORT_VIEWS[resultView];
  const columns = groupColumns(view, query, preview.selectedMetric);
  const showPartition = preview.response.partitions.length > 1;
  return Object.freeze({
    title: `Trade Explorer - ${view.label}`,
    dateRange: `${query.startDate} to ${query.endDate}`,
    generatedAt: generatedAtUtc,
    feeNotice,
    filters: filterSummary(query, resultView, preview, tradeSort, sortDirection),
    columns: Object.freeze([
      view.firstColumnLabel,
      ...(showPartition ? ["Currency / timezone"] : []),
      ...columns.map((column) => column.label),
    ]),
    columnWeights: Object.freeze([
      1.25,
      ...(showPartition ? [1.45] : []),
      ...columns.map((column) => column.weight ?? 1),
    ]),
    rows: groupRows(preview, columns, query.metricId, sortDirection),
  });
}

function asciiText(value: string): string {
  return value
    .replaceAll("→", " to ")
    .replaceAll("—", "-")
    .replaceAll("–", "-")
    .replaceAll("’", "'")
    .replaceAll("“", '"')
    .replaceAll("”", '"')
    .replaceAll("€", "EUR ")
    .replaceAll("£", "GBP ")
    .replaceAll("¥", "JPY ")
    .replaceAll("₹", "INR ")
    .replaceAll("₩", "KRW ")
    .replaceAll("฿", "THB ")
    .replaceAll("₺", "TRY ")
    .replaceAll("ł", "l")
    .normalize("NFKD")
    .replace(/[^\x20-\x7e]/gu, "?");
}

function pdfString(value: string): string {
  return asciiText(value).replace(/([\\()])/gu, "\\$1");
}

function textWidth(value: string, fontSize: number): number {
  return asciiText(value).length * fontSize * 0.51;
}

function truncateText(value: string, width: number, fontSize: number): string {
  const normalized = asciiText(value);
  if (textWidth(normalized, fontSize) <= width) return normalized;
  const maximumCharacters = Math.max(1, Math.floor(width / (fontSize * 0.51)) - 3);
  return `${normalized.slice(0, maximumCharacters)}...`;
}

function textCommand(
  value: string,
  x: number,
  y: number,
  size: number,
  font: "F1" | "F2" = "F1",
): string {
  return `BT /${font} ${size.toFixed(2)} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td (${pdfString(value)}) Tj ET\n`;
}

function rightTextCommand(
  value: string,
  right: number,
  y: number,
  size: number,
  font: "F1" | "F2" = "F1",
): string {
  return textCommand(value, right - textWidth(value, size), y, size, font);
}

function wrapItems(items: readonly string[], maximumCharacters = 135): readonly string[] {
  const lines: string[] = [];
  let current = "";
  for (const item of items) {
    const next = current.length === 0 ? item : `${current} | ${item}`;
    if (next.length <= maximumCharacters) {
      current = next;
    } else {
      if (current.length > 0) lines.push(current);
      current = item;
    }
  }
  if (current.length > 0) lines.push(current);
  return Object.freeze(lines);
}

function paeth(left: number, above: number, upperLeft: number): number {
  const prediction = left + above - upperLeft;
  const leftDistance = Math.abs(prediction - left);
  const aboveDistance = Math.abs(prediction - above);
  const upperLeftDistance = Math.abs(prediction - upperLeft);
  return leftDistance <= aboveDistance && leftDistance <= upperLeftDistance
    ? left
    : aboveDistance <= upperLeftDistance
      ? above
      : upperLeft;
}

function pngRgbData(png: Buffer): Readonly<{ width: number; height: number; data: Buffer }> {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (!png.subarray(0, 8).equals(signature)) throw new TypeError("Invalid TradersLink logo PNG.");
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  let interlace = 0;
  const compressed: Buffer[] = [];
  for (let offset = 8; offset + 12 <= png.length;) {
    const length = png.readUInt32BE(offset);
    const type = png.toString("ascii", offset + 4, offset + 8);
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd + 4 > png.length) throw new TypeError("Invalid TradersLink logo PNG chunk.");
    if (type === "IHDR") {
      width = png.readUInt32BE(dataStart);
      height = png.readUInt32BE(dataStart + 4);
      bitDepth = png[dataStart + 8];
      colorType = png[dataStart + 9];
      interlace = png[dataStart + 12];
    } else if (type === "IDAT") {
      compressed.push(png.subarray(dataStart, dataEnd));
    }
    offset = dataEnd + 4;
    if (type === "IEND") break;
  }
  if (width < 1 || height < 1 || bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new TypeError("Unsupported TradersLink logo PNG format.");
  }
  const bytesPerPixel = 4;
  const rowLength = width * bytesPerPixel;
  const inflated = inflateSync(Buffer.concat(compressed));
  if (inflated.length !== (rowLength + 1) * height) {
    throw new TypeError("Invalid TradersLink logo PNG data length.");
  }
  const raw = Buffer.alloc(rowLength * height);
  for (let row = 0; row < height; row += 1) {
    const inputOffset = row * (rowLength + 1);
    const outputOffset = row * rowLength;
    const filter = inflated[inputOffset];
    for (let column = 0; column < rowLength; column += 1) {
      const source = inflated[inputOffset + 1 + column];
      const left = column >= bytesPerPixel ? raw[outputOffset + column - bytesPerPixel] : 0;
      const above = row > 0 ? raw[outputOffset - rowLength + column] : 0;
      const upperLeft = row > 0 && column >= bytesPerPixel
        ? raw[outputOffset - rowLength + column - bytesPerPixel]
        : 0;
      const value = filter === 0
        ? source
        : filter === 1
          ? source + left
          : filter === 2
            ? source + above
            : filter === 3
              ? source + Math.floor((left + above) / 2)
              : filter === 4
                ? source + paeth(left, above, upperLeft)
                : Number.NaN;
      if (!Number.isFinite(value)) throw new TypeError("Unsupported TradersLink logo PNG filter.");
      raw[outputOffset + column] = value & 0xff;
    }
  }
  const rgb = Buffer.alloc(width * height * 3);
  for (let pixel = 0; pixel < width * height; pixel += 1) {
    const source = pixel * 4;
    const target = pixel * 3;
    const alpha = raw[source + 3];
    rgb[target] = Math.round((raw[source] * alpha + 255 * (255 - alpha)) / 255);
    rgb[target + 1] = Math.round((raw[source + 1] * alpha + 255 * (255 - alpha)) / 255);
    rgb[target + 2] = Math.round((raw[source + 2] * alpha + 255 * (255 - alpha)) / 255);
  }
  return Object.freeze({ width, height, data: deflateSync(rgb, { level: 9 }) });
}

function streamObject(dictionary: string, stream: Buffer): Buffer {
  return Buffer.concat([
    Buffer.from(`<< ${dictionary} /Length ${stream.length} >>\nstream\n`, "ascii"),
    stream,
    Buffer.from("\nendstream", "ascii"),
  ]);
}

function buildPdf(objects: ReadonlyMap<number, Buffer>, rootId: number): Buffer {
  const maximumId = Math.max(...objects.keys());
  const chunks: Buffer[] = [Buffer.from("%PDF-1.4\n%PDFDATA\n", "ascii")];
  const offsets = new Array<number>(maximumId + 1).fill(0);
  let offset = chunks[0].length;
  for (let id = 1; id <= maximumId; id += 1) {
    const body = objects.get(id);
    if (!body) throw new TypeError(`Missing PDF object ${id}.`);
    const prefix = Buffer.from(`${id} 0 obj\n`, "ascii");
    const suffix = Buffer.from("\nendobj\n", "ascii");
    offsets[id] = offset;
    chunks.push(prefix, body, suffix);
    offset += prefix.length + body.length + suffix.length;
  }
  const xrefOffset = offset;
  const xref = [
    `xref\n0 ${maximumId + 1}\n`,
    "0000000000 65535 f \n",
    ...offsets.slice(1).map((value) => `${String(value).padStart(10, "0")} 00000 n \n`),
    `trailer\n<< /Size ${maximumId + 1} /Root ${rootId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`,
  ].join("");
  chunks.push(Buffer.from(xref, "ascii"));
  return Buffer.concat(chunks);
}

export async function renderTradeExplorerPdfDocument(table: ReportTable): Promise<Buffer> {
  const pageWidth = 841.89;
  const pageHeight = 595.28;
  const margin = 32;
  const tableWidth = pageWidth - margin * 2;
  const rowHeight = 18;
  const filterLines = wrapItems(table.filters, 125);
  const filterHeight = 14 + filterLines.length * 10;
  const filterBottom = 482 - filterHeight;
  const feeNoticeHeight = table.feeNotice === null
    ? 0
    : table.feeNotice.excludedTradeCount > 0 ? 42 : 32;
  const feeNoticeTop = filterBottom - 8;
  const feeNoticeBottom = feeNoticeTop - feeNoticeHeight;
  const firstPageTableTop = (table.feeNotice === null ? filterBottom : feeNoticeBottom) - 12;
  const laterPageTableTop = 475;
  const tableBottom = 48;
  const firstCapacity = Math.max(1, Math.floor((firstPageTableTop - tableBottom - 20) / rowHeight));
  const laterCapacity = Math.max(1, Math.floor((laterPageTableTop - tableBottom - 20) / rowHeight));
  const pages: (readonly (readonly string[])[])[] = [];
  let rowIndex = 0;
  pages.push(table.rows.slice(0, firstCapacity));
  rowIndex += firstCapacity;
  while (rowIndex < table.rows.length) {
    pages.push(table.rows.slice(rowIndex, rowIndex + laterCapacity));
    rowIndex += laterCapacity;
  }
  if (pages.length === 0) pages.push(Object.freeze([]));

  const logo = pngRgbData(await readFile(path.join(process.cwd(), "public", "logo-horizontal-main.png")));
  const objects = new Map<number, Buffer>();
  const pageIds = pages.map((_page, index) => 7 + index * 2);
  const linkAnnotationId = table.feeNotice === null ? null : 6 + pages.length * 2;
  objects.set(1, Buffer.from("<< /Type /Catalog /Pages 2 0 R >>", "ascii"));
  objects.set(2, Buffer.from(
    `<< /Type /Pages /Count ${pageIds.length} /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] >>`,
    "ascii",
  ));
  objects.set(3, Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>", "ascii"));
  objects.set(4, Buffer.from("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>", "ascii"));
  objects.set(5, streamObject(
    `/Type /XObject /Subtype /Image /Width ${logo.width} /Height ${logo.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode`,
    logo.data,
  ));
  if (linkAnnotationId !== null) {
    const noticeFontSize = 7.2;
    const noticeX = margin + 8;
    const noticeFirstLineY = feeNoticeTop - 12;
    const noticePrefix = "Manually entered trades with no fee entered are included in Net P/L. ";
    const linkX = noticeX + textWidth(noticePrefix, noticeFontSize);
    const linkWidth = textWidth("View no-fee trades", noticeFontSize);
    objects.set(linkAnnotationId, Buffer.from(
      `<< /Type /Annot /Subtype /Link /Rect [${linkX.toFixed(2)} ${(noticeFirstLineY - 2).toFixed(2)} ${(linkX + linkWidth).toFixed(2)} ${(noticeFirstLineY + 8).toFixed(2)}] /Border [0 0 0] /A << /S /URI /URI (${pdfString(NO_FEE_TRADES_URL)}) >> >>`,
      "ascii",
    ));
  }

  const totalWeight = table.columnWeights.reduce((sum, weight) => sum + weight, 0);
  const columnWidths = table.columnWeights.map((weight) => tableWidth * weight / totalWeight);
  pages.forEach((rows, pageIndex) => {
    const commands: string[] = [];
    commands.push("0.0353 0.0784 0.1490 rg\n");
    commands.push("q 150 0 0 30.77 32 538 cm /Im1 Do Q\n");
    commands.push(textCommand("traderslink.pro", 194, 548, 9, "F2"));
    commands.push(rightTextCommand(table.title, pageWidth - margin, 548, 10, "F2"));
    commands.push("0.0039 0.1176 0.3373 RG 1.4 w 32 530 m 809.89 530 l S\n");
    commands.push(textCommand(table.title, margin, 506, 14, "F2"));
    commands.push(textCommand(table.dateRange, margin, 490, 9, "F1"));
    if (pageIndex === 0) {
      commands.push(`0.9569 0.9647 0.9765 rg 32 ${filterBottom} 777.89 ${filterHeight} re f\n`);
      commands.push("0.0353 0.0784 0.1490 rg\n");
      filterLines.forEach((line, index) => {
        commands.push(textCommand(line, 40, 468 - index * 10, 7.2, index === 0 ? "F2" : "F1"));
      });
      if (table.feeNotice !== null) {
        const noticeFontSize = 7.2;
        const noticeX = margin + 8;
        const noticeFirstLineY = feeNoticeTop - 12;
        const noticePrefix = "Manually entered trades with no fee entered are included in Net P/L. ";
        const noticeLink = "View no-fee trades";
        const linkX = noticeX + textWidth(noticePrefix, noticeFontSize);
        commands.push(`0.9569 0.9647 0.9765 rg ${margin} ${feeNoticeBottom} ${tableWidth} ${feeNoticeHeight} re f\n`);
        commands.push("0.0353 0.0784 0.1490 rg\n");
        commands.push(textCommand(noticePrefix, noticeX, noticeFirstLineY, noticeFontSize, "F1"));
        commands.push("0.0039 0.1176 0.3373 rg\n");
        commands.push(textCommand(noticeLink, linkX, noticeFirstLineY, noticeFontSize, "F2"));
        commands.push(`0.0039 0.1176 0.3373 RG 0.5 w ${linkX.toFixed(2)} ${(noticeFirstLineY - 1).toFixed(2)} m ${(linkX + textWidth(noticeLink, noticeFontSize)).toFixed(2)} ${(noticeFirstLineY - 1).toFixed(2)} l S\n`);
        commands.push("0.0353 0.0784 0.1490 rg\n");
        commands.push(textCommand(
          "When broker fee details are missing from imported trades, they are excluded from Net P/L.",
          noticeX,
          noticeFirstLineY - 10,
          noticeFontSize,
          "F1",
        ));
        if (table.feeNotice.excludedTradeCount > 0) {
          const count = table.feeNotice.excludedTradeCount;
          const countPrefix = "This report excludes ";
          const countText = String(count);
          const countX = noticeX + textWidth(countPrefix, noticeFontSize);
          const countSuffix = ` ${count === 1 ? "trade" : "trades"} with missing fee details.`;
          commands.push(textCommand(countPrefix, noticeX, noticeFirstLineY - 20, noticeFontSize, "F1"));
          commands.push(textCommand(countText, countX, noticeFirstLineY - 20, noticeFontSize, "F2"));
          commands.push(textCommand(
            countSuffix,
            countX + textWidth(countText, noticeFontSize),
            noticeFirstLineY - 20,
            noticeFontSize,
            "F1",
          ));
        }
      }
    }
    const tableTop = pageIndex === 0 ? firstPageTableTop : laterPageTableTop;
    const headerBottom = tableTop - 20;
    commands.push(`0.0039 0.1176 0.3373 rg ${margin} ${headerBottom} ${tableWidth} 20 re f\n`);
    commands.push("1 1 1 rg\n");
    let x = margin;
    table.columns.forEach((column, columnIndex) => {
      const width = columnWidths[columnIndex];
      const label = truncateText(column, width - 8, 9);
      commands.push(textCommand(label, x + 4, headerBottom + 7, 9, "F2"));
      x += width;
    });
    let rowTop = headerBottom;
    commands.push("0.0353 0.0784 0.1490 rg\n");
    if (rows.length === 0) {
      commands.push(textCommand("No matching results.", margin + 4, rowTop - 13, 8, "F1"));
    }
    rows.forEach((row, rowNumber) => {
      const rowBottom = rowTop - rowHeight;
      if (rowNumber % 2 === 1) {
        commands.push(`0.9765 0.9804 0.9882 rg ${margin} ${rowBottom} ${tableWidth} ${rowHeight} re f\n`);
      }
      commands.push(`0.8784 0.8980 0.9255 RG 0.4 w ${margin} ${rowBottom} m ${margin + tableWidth} ${rowBottom} l S\n`);
      commands.push("0.0353 0.0784 0.1490 rg\n");
      let cellX = margin;
      row.forEach((cell, columnIndex) => {
        const width = columnWidths[columnIndex];
        commands.push(textCommand(
          truncateText(cell, width - 8, 9),
          cellX + 4,
          rowBottom + 6,
          9,
          columnIndex === 0 ? "F2" : "F1",
        ));
        cellX += width;
      });
      rowTop = rowBottom;
    });
    commands.push("0.8784 0.8980 0.9255 RG 0.6 w 32 38 m 809.89 38 l S\n");
    commands.push("0.2863 0.3373 0.4196 rg\n");
    const generated = new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      month: "short",
      timeZone: "UTC",
      timeZoneName: "short",
      year: "numeric",
    }).format(new Date(table.generatedAt));
    commands.push(textCommand(`Generated ${generated}`, margin, 23, 7, "F1"));
    commands.push(rightTextCommand(`Page ${pageIndex + 1} of ${pages.length}`, pageWidth - margin, 23, 7, "F1"));

    const contentId = 6 + pageIndex * 2;
    const pageId = 7 + pageIndex * 2;
    const content = Buffer.from(commands.join(""), "ascii");
    objects.set(contentId, streamObject("", content));
    objects.set(pageId, Buffer.from(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> /XObject << /Im1 5 0 R >> >> /Contents ${contentId} 0 R${pageIndex === 0 && linkAnnotationId !== null ? ` /Annots [${linkAnnotationId} 0 R]` : ""} >>`,
      "ascii",
    ));
  });
  return buildPdf(objects, 1);
}

export async function createTradeExplorerPdfReport(
  scope: WorkspaceAccessScope,
  input: unknown,
): Promise<Readonly<{ bytes: Buffer; filename: string }>> {
  const value = inputRecord(input);
  if (JSON.stringify(Object.keys(value).sort()) !== JSON.stringify([
    "query", "resultView", "sortDirection", "tradeSort",
  ].sort())) {
    throw new TypeError("Invalid Trade Explorer PDF report fields.");
  }
  const normalizedQuery = normalizeAnalyticsLabPlatformQuery(value.query);
  const resultView = normalizeResultView(value.resultView);
  requireViewGrouping(resultView, normalizedQuery.grouping);
  const requestedTradeSort = normalizeTradeSort(value.tradeSort);
  const sortDirection = normalizeSortDirection(value.sortDirection);
  const query = Object.freeze({
    ...normalizedQuery,
    metricId: tradeExplorerMetricForOutcome(
      tradeExplorerMetricForMoneyBasis(
        normalizedQuery.metricId,
        normalizedQuery.moneyBasis,
      ),
      normalizedQuery.outcome,
    ),
  });
  const tradeSort = tradeExplorerTradeSortForOutcome(
    requestedTradeSort,
    query.outcome,
  );
  const {
    runCompleteTradeExplorerTableQuery,
    runTradeExplorerQuery,
  } = await import("./trade-explorer-service");
  const preview = resultView === "trades"
    ? await runCompleteTradeExplorerTableQuery(scope, query, tradeSort)
    : await runTradeExplorerQuery(scope, query, null, tradeSort);
  if (resultView === "trades" && preview.evidence === null &&
      preview.response.crossPartitionCounts.includedCount > 0) {
    throw new TypeError("Choose one currency before downloading a Trades report.");
  }
  const generatedAtUtc = new Date().toISOString();
  const bytes = await renderTradeExplorerPdfDocument(reportTable(
    query,
    resultView,
    preview,
    tradeSort,
    sortDirection,
    generatedAtUtc,
  ));
  return Object.freeze({
    bytes,
    filename: `traderslink-trade-explorer-${resultView}-${query.startDate}-to-${query.endDate}.pdf`,
  });
}
