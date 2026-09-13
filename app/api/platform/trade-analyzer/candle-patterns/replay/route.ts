import { getReplacementDailyTradeAnalyzerReplay, scaleDaySessionTradeAnalyzer } from "@/app/(dashboard)/trade-tracker/trade-tracker-platform-data";
import { withSavedPatternRuntime } from "@/src/modules/level-analysis/server/trend-momentum-pattern-runtime";
import { patternEvidenceRow, resolveSavedPatternEvidence } from "@/src/modules/level-analysis/server/trend-momentum-pattern-evidence";
import { journalReportingCurrencyMultiplier } from "@/src/modules/journal-analytics/server/journal-reporting-currency-fact-set";
import { requireTraderLinkPlatformRequestScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";
import { isTraderLinkPlatformError } from "@/src/modules/platform/server/database/platform-migration-contract";
import { JournalLogicalTradeRepository } from "@/src/modules/journal/server/logical-trades/journal-logical-trade-repository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url), scope = requireTraderLinkPlatformRequestScope(request.headers);
    const result = await withSavedPatternRuntime(scope, { basis: url.searchParams.get("basis"), startDate: null, endDate: null }, ({ observations, runtime }) => {
      const source = resolveSavedPatternEvidence(observations, url.searchParams.get("ref") ?? "");
      const occurrence = patternEvidenceRow(source, runtime.reportingCurrency);
      const analysis = getReplacementDailyTradeAnalyzerReplay(scope, { direction: source.direction, roundTripId: source.representativeRoundTripId });
      // The replay reader may observe a newer revision than the population read.
      if (!analysis || analysis.status !== "ready" || analysis.analysisRevisionRef !== source.analysisVersionId) return { analysis: null, occurrence };
      const context = runtime.reportingContext;
      const trade = new JournalLogicalTradeRepository(runtime.verifiedReadonlyDatabase).list({ accountId: scope.activeAccountId!, userId: scope.userId,
        workspaceId: scope.workspaceId, workspaceRole: scope.workspaceRole }).find((candidate) => (candidate.logicalTradeId ?? candidate.members[0]?.roundTripId) === source.tradeId);
      if (!trade) return { analysis: null, occurrence };
      const rates = trade.members.map((member) => {
        const currency = context.sourceCurrencyByRoundTrip.get(member.roundTripId), date = context.sourceDateByRoundTrip.get(member.roundTripId);
        return currency && date ? journalReportingCurrencyMultiplier(currency, date, context) : null;
      });
      // One chart price scale cannot combine different member conversion rates.
      if (!rates.length || rates.some((rate) => rate === null) || new Set(rates).size !== 1) return { analysis: null, occurrence };
      return { analysis: scaleDaySessionTradeAnalyzer(analysis, rates[0]!), occurrence };
    });
    return Response.json({ status: result.analysis ? "ready" : "unavailable", ...result }, { status: result.analysis ? 200 : 404, headers: { "cache-control": "no-store" } });
  } catch (error) {
    const code = isTraderLinkPlatformError(error) ? error.code : "TRADERLINK_TRADE_ANALYZER_REPLAY_UNAVAILABLE";
    return Response.json({ status: "unavailable", code }, { status: code.includes("ACCESS_DENIED") ? 403 : code.includes("VALIDATION_FAILED") ? 400 : 503, headers: { "cache-control": "no-store" } });
  }
}
