import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

function source(path: string): string {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const client = source("app/(dashboard)/analytics/trade-explorer/trade-explorer-client.tsx");
const action = source("app/(dashboard)/analytics/trade-explorer/actions.ts");
const page = source("app/(dashboard)/analytics/trade-explorer/page.tsx");
const service = source("app/(dashboard)/analytics/trade-explorer/trade-explorer-service.ts");
const table = source("src/modules/journal-analytics/server/analytics-table.ts");
const population = source("src/modules/journal-analytics/server/analytics-population.ts");
const helpOverview = source("src/modules/help/public-help-content.ts");
const helpRoute = source("app/help/[collection]/page.tsx");
const helpGuides = source("src/modules/help/trade-explorer-guides.ts");

describe("Trade Explorer visible contract", () => {
  it("keeps the Next.js and account-scope boundary explicit", () => {
    expect(client.startsWith('"use client";')).toBe(true);
    expect(action.startsWith('"use server";')).toBe(true);
    expect(service).toMatch(/^import "server-only";$/mu);
    expect(client).not.toContain("export default async function TradeExplorerClient");
    expect(action).toMatch(/requireTraderLinkPlatformPageScope\(\{\s*membershipFeatures: \["analytics\.trade_explorer"\]/u);
    expect(page).toContain('requireMembershipPreviewPageScope("analytics.trade_explorer")');
    expect(service).toContain(
      "requireExpectedJournalAccountSelection(scope, input.expectedAccountSelectionRef)",
    );
    expect(action).toContain("Your access or selected trading account changed.");
    expect(action).toContain("refreshRequired: accessChanged");
    for (const code of [
      "TRADERLINK_AUTH_SESSION_INVALID",
      "TRADERLINK_WORKSPACE_ACCESS_DENIED",
      "TRADERLINK_ACCOUNT_ACCESS_DENIED",
      "TRADERLINK_ACCOUNT_SELECTION_CONFLICT",
    ]) expect(action).toContain(code);
    expect(action).toContain('error.safeContext.field === "groupRowLimit"');
    expect(action).toContain("There are too many groups to display at once.");
    expect(action).toContain('error.safeContext.field === "table.afterCursor"');
    expect(action).toContain("These results changed while you were paging.");
    expect(action).not.toContain("selected Trade Tracker account");
    expect(page).toContain("Explore your confirmed Trade Tracker results.");
    expect(page).toContain('title: "Trade Explorer | TraderLink Platform"');
  });

  it("shows every approved control and truthful default", () => {
    expect(service).toContain("direction: null");
    expect(client).toContain('initialResultView = "trades"');
    expect(client).toContain('useState<ExplorerResultView>(initialResultView)');
    expect(page).toContain('initialResultView={tickerView ? "tickers" : "trades"}');
    expect(client).toContain('useState<TradeExplorerTradeSort>("closed_desc")');
    for (const label of [
      "Closed from",
      "Closed to",
      "Ticker",
      "Direction",
      "Result basis",
      "Result",
      "View",
      "Sort trades",
      "Results per page",
      "Entry weekday",
      "Time bucket detail",
      "Entry time (HH:MM)",
    ]) expect(client).toContain(`label="${label}"`);
    expect(client).toContain('label={resultView === "days" ? "Sort days" : "Rank by"}');
    expect(helpGuides).toContain("Trade Explorer does not provide a separate currency override.");
    for (const label of [
      "Minimum hold (seconds)",
      "Maximum hold (seconds)",
      "Minimum total entry shares",
      "Maximum total entry shares",
      "Minimum peak shares",
      "Maximum peak shares",
      "Minimum total entry value",
      "Maximum total entry value",
    ]) expect(client).toContain(`exactField("${label}"`);
    expect(client).toContain("selectedMinute % entryTimeBucketMinutes === 0");
    for (const view of [
      "trades",
      "days",
      "tickers",
      "entry_times",
      "holding_time",
      "position_size",
      "periods",
    ]) expect(client).toContain(`value="${view}"`);
    expect(client).not.toContain('label="Statistic"');
    expect(client).not.toContain('label="Sort by"');
  });

  it("keeps rows, summaries and pagination on one applied snapshot", () => {
    expect(client).toContain("setAppliedQuery(canonicalQuery)");
    expect(client).toContain("canonicalizeExactQueryFields(query)");
    expect(client).toContain("canonicalizeExactQueryFields(current)");
    expect(client).toContain("Some controls have changed. Choose Update results");
    expect(client).toContain("canonicalizeExactQueryFields(nextQuery)");
    expect(client).toContain("canonicalTradeExplorerTimeInput(input.entryTimeBucket)");
    expect(client).toContain("setAppliedResultView(nextResultView)");
    expect(client).toContain("setAppliedTradeSort(canonicalTradeSort)");
    expect(client).toContain("tradeExplorerTradeSortForOutcome(option.value, query.outcome)");
    expect(client).toContain("sortDirectionRevisionRef.current === sortDirectionRevision");
    expect(client).toContain("sortDirectionRevisionRef.current += 1");
    expect(client).toContain(
      "runTradeExplorer(appliedQuery, cursor, appliedTradeSort)",
    );
    expect(client.match(/previewRequestRef\.current !== requestNumber/gu))
      .toHaveLength(4);
    expect(client).toContain("previewRequestRef.current += 1");
    expect(client.match(/window\.location\.reload\(\)/gu)).toHaveLength(6);
    expect(client.match(/setError\(RESULTS_UPDATE_FAILURE\)/gu)).toHaveLength(2);
    expect(service).toContain(
      "evidence.factSetRevisionSha256 !== response.factSetRevisionSha256",
    );
    expect(service).toContain("calendar.availableCurrencies.map");
    expect(service).toContain("currencyCalendars.flatMap");
    expect(service).toContain("EXPLORER_SELECTOR_METRIC_IDS.has(definition.metricId)");
    expect(service).toContain("EXPLORER_SELECTOR_METRIC_IDS.has(normalized.metricId)");
    expect(service).toContain("const basisMetricId = tradeExplorerMetricForMoneyBasis(");
    expect(service).toContain("metricId: tradeExplorerMetricForOutcome(basisMetricId, normalized.outcome)");
    expect(service).toContain("tradeExplorerTradeSortForOutcome(");
    expect(service).not.toContain('  "average_position_size",');
    expect(table).toContain(
      "(decoded as TableCursor).factSetRevisionSha256 !== population.factSetRevisionSha256",
    );
    expect(table).toContain(
      "(decoded as TableCursor).queryDigestSha256 !== population.queryDigestSha256",
    );
    expect(population).toContain("tradeClassifications: query.tradeClassifications");
  });

  it("keeps Gross, Net, fee coverage and currencies explicit", () => {
    expect(client).toContain("tradeExplorerMetricForMoneyBasis");
    expect(client).toContain("tradeExplorerMetricMatchesMoneyBasis(metricId, query.moneyBasis)");
    expect(client).toContain("tradeExplorerMetricMatchesOutcome(metricId, query.outcome)");
    expect(client).toContain("tradeExplorerMetricForOutcome(current.metricId, outcome)");
    expect(client).toContain('? "Gross P/L" : "Net P/L"');
    expect(client).toMatch(/\? "Fee-covered trades"\s*: "Completed trades"/u);
    expect(client).toContain(
      "preview.response.crossPartitionCounts.includedCount",
    );
    expect(client).toContain("No fee-covered trades match these filters.");
    expect(client).toContain("preview.evidenceUnavailableReason");
    expect(client).toContain(
      "Manually entered trades with no fee entered are included in Net P/L.",
    );
    expect(client).toContain(
      "When broker fee details are missing from imported trades, they are excluded from Net P/L.",
    );
    expect(client).toContain(
      "Results are ranked separately within each currency and trading timezone.",
    );
    expect(client).toContain(
      "compareTradeExplorerMetricValues(leftValue, rightValue)",
    );
    expect(client).toContain(
      "left.partitionKey.localeCompare(right.partitionKey)",
    );
    expect(client).toContain(
      "{showPartitionColumn ? <TableCell>{item.partitionLabel}</TableCell> : null}",
    );
    expect(client).not.toMatch(
      /fee_coverage_partial|complete_fee_coverage_required|TRADERLINK_/u,
    );
  });

  it("keeps the compact table and execution disclosure complete", () => {
    for (const label of [
      "Closed",
      "Ticker",
      "Direction",
      "Total entry shares",
      "Peak shares held",
      "Position size",
      "Avg entry",
      "Avg exit",
      "Total entry value",
      "Return on entry value",
      "Hold",
      "Trading costs",
      "Execution structure",
    ]) expect(client).toContain(`<TableCell>${label}</TableCell>`);
    expect(client).toContain('<TableCell>{appliedQuery.moneyBasis === "gross" ? "Gross P/L" : "Net P/L"}</TableCell>');
    expect(client).toContain("clearExpandedTrade()");
    expect(client).toContain("executionRequestRef.current += 1");
    expect(client).toContain('preview.evidence?.timezone ?? "UTC"');
    expect(client).toContain("tradeCloseTime(trade.closedAtUtc");
    expect(client).toContain("formatJournalAnalyticsDuration(trade.holdingDurationMilliseconds)");
    expect(client).not.toContain("Executed (Eastern Time)");
    expect(client).toContain('event.key !== "Enter" && event.key !== " "');
    expect(client).toContain("tabIndex={0}");
    expect(client).toContain("financialOutcomeColor(trade.selectedPnlDecimal)");
    expect(client).toContain("financialOutcomeColor(trade.returnPercentDecimal)");
    expect(client).toContain("financialOutcomeMetricColor(column.metricId");
    expect(client).not.toContain("Currency: {tradeSummaryPartition.currency");
    expect(client).not.toContain('`${result.currency} ${formatted.replace("$", "")}`');
    expect(client).not.toContain('`${currency} ${formatted}`');
    expect(client).not.toContain('Chip label={query.currency ?? "All currencies"}');
    expect(client).toContain("formatJournalAnalyticsMoney(valueDecimal, currency)");
    expect(client).toContain('width: "max-content"');
    expect(client).toContain('This {appliedResultView === "days" ? "Sort days" : "Rank by"} result cannot be calculated');
    expect(client).toContain("groupColumnDisplaysMetric(column, appliedQuery.metricId)");
    expect(client).not.toContain("dayStatisticIsSubset");
    expect(client).toContain("N/A means the matching trades do not have the facts");
    expect(client).toContain("Profit factor needs at least one winning trade and one losing trade");
    expect(client).toContain("N/A means this trade does not have the confirmed details");
    expect(client).toContain('execution.price_decimal === null ? "Not recorded"');
  });

  it("keeps the linked Help guide accurate for imported and manual trades", () => {
    expect(helpOverview).toContain('collection("trade-explorer", "Trade Explorer"');
    expect(helpOverview).toContain("TRADE_EXPLORER_HELP_GUIDES");
    expect(helpRoute).toContain("publicHelpCollectionById");
    expect(helpGuides).toContain("Manually entered trades with no fee entered are included in Net P/L.");
    expect(helpGuides).toContain('guide("use-trade-explorer"');
    expect(helpGuides).toContain("Sort trades orders individual rows by facts each trade has");
    expect(helpGuides).toContain("Money is displayed in the reporting currency selected in Account settings.");
    expect(helpGuides).toContain("P/L that matches the selected Result basis");
    expect(helpGuides).toContain("hides calculations that cannot produce a meaningful order");
    expect(helpGuides).toContain("When broker fee details are missing from imported trades, they are excluded from Net P/L.");
  });
});
