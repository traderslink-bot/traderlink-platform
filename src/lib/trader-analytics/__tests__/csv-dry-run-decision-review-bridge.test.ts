import { describe, expect, it } from "vitest";
import {
  CandleFetchService,
  type HistoricalCandleProvider,
  type HistoricalFetchRequest,
} from "levels-system-phase1/support-resistance-engine";
import {
  SampleTradeAlignedHistoricalCandleProvider,
  buildSampleLevelsSystemSupportResistanceOptions,
} from "../../support-resistance/__fixtures__/sample-levels-system-fetch-service";
import { decisionReviewCsvScenarios } from "../__fixtures__/decision-review-csv-scenarios";
import { buildCsvDryRunDecisionReviewBridge } from "../server/build-csv-dry-run-decision-review-bridge";

const SAMPLE_EXECUTION_CSV = [
  "Date,Time,Symbol,Side,Quantity,Price",
  "2024-04-12,09:33:30,ABCD,Buy,100,1.185",
  "2024-04-12,09:36:15,ABCD,Buy,50,1.255",
  "2024-04-12,09:39:10,ABCD,Sell,150,1.295",
].join("\n");

class AliasMetadataHistoricalCandleProvider implements HistoricalCandleProvider {
  readonly providerName = "ibkr" as const;
  private readonly delegate = new SampleTradeAlignedHistoricalCandleProvider();

  async fetchCandles(
    request: HistoricalFetchRequest,
    plan: Parameters<HistoricalCandleProvider["fetchCandles"]>[1],
  ) {
    const response = await this.delegate.fetchCandles(request, plan);

    return {
      ...response,
      provider: "ibkr" as const,
      providerMetadata: {
        ...response.providerMetadata,
        ibkrRequestedSymbol: "MAXN",
        ibkrResolvedSymbol: "MAXNQ",
        ibkrResolvedConId: 733975592,
        ibkrResolvedPrimaryExchange: "PINK",
        ibkrContractAliasUsed: true,
        ibkrHistoricalAliasReason:
          "post-delisting MAXN resolved by IBKR as MAXNQ on PINK",
      },
    };
  }
}

class MissingHigherTimeframeHistoricalCandleProvider extends SampleTradeAlignedHistoricalCandleProvider {
  override async fetchCandles(
    request: HistoricalFetchRequest,
    plan: Parameters<HistoricalCandleProvider["fetchCandles"]>[1],
  ) {
    if (request.timeframe === "daily" || request.timeframe === "4h") {
      throw new Error(
        `Durable candle warehouse miss for ${request.symbol} ${request.timeframe}; found 1/${request.lookbackBars} candles.`,
      );
    }

    return super.fetchCandles(request, plan);
  }
}

describe("buildCsvDryRunDecisionReviewBridge", () => {
  it("builds client-safe decision-review snapshots for completed dry-run trades", async () => {
    const result = await buildCsvDryRunDecisionReviewBridge({
      csvText: SAMPLE_EXECUTION_CSV,
      broker: "generic_execution_csv",
      levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
      generatedAt: "2026-05-05T12:00:00.000Z",
    });

    expect(result).toMatchObject({
      contractVersion: "csv_dry_run_decision_review_bridge_v1",
      source: "server_dry_run_decision_review",
      importStatus: "ready",
      requestedTradeCount: 1,
      analyzableTradeCount: 1,
      completedReviewCount: 1,
    });
    expect(result.decisionReviews[0]).toMatchObject({
      tradeId: "dry-run-trade-1-abcd",
      marketContextSource: "levels_system_daily_4h",
      tradeWindowEvidenceSource: "levels_system_trade_window",
      candleQualityNotes: expect.any(Array),
      replayCandleWindow: {
        source: "levels_system_trade_window",
        timeframe: expect.any(String),
        candles: expect.any(Array),
      },
    });
    expect(result.decisionReviews[0]?.coachingHeadline).toBeTruthy();
    expect(result.decisionReviews[0]?.insights.length).toBeGreaterThan(0);
    expect(
      result.decisionReviews[0]?.replayCandleWindow?.candles.length,
    ).toBeGreaterThan(0);
    expect(result.decisionReviews[0]?.candleQualityNotes?.join("\n")).toContain(
      "Trade-window candle basis status: basis_aligned",
    );
    expect(JSON.stringify(result.decisionReviews[0])).not.toContain(
      "allCandles",
    );
  }, 15_000);

  it("does not run analysis when the import is blocked", async () => {
    const result = await buildCsvDryRunDecisionReviewBridge({
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price",
        "2024-04-12,09:33:30,,Buy,100,1.185",
        "2024-04-12,09:39:10,ABCD,Sell,100,1.295",
      ].join("\n"),
      broker: "generic_execution_csv",
      levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
    });

    expect(result.importStatus).toBe("blocked");
    expect(result.analyzableTradeCount).toBe(0);
    expect(result.completedReviewCount).toBe(0);
    expect(result.decisionReviews).toEqual([]);
    expect(result.diagnostics.map((diagnostic) => diagnostic.code)).toContain(
      "import_blocked",
    );
  });

  it("skips open-position trades with diagnostics", async () => {
    const result = await buildCsvDryRunDecisionReviewBridge({
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price",
        "2024-04-12,09:33:30,ABCD,Buy,100,1.185",
        "2024-04-12,09:39:10,ABCD,Sell,25,1.295",
      ].join("\n"),
      broker: "generic_execution_csv",
      levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
    });

    expect(result.importStatus).toBe("needs_review");
    expect(result.analyzableTradeCount).toBe(0);
    expect(result.completedReviewCount).toBe(0);
    expect(result.decisionReviews).toEqual([]);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          requestIndex: 0,
          symbol: "ABCD",
          code: "trade_open",
        }),
      ]),
    );
  });

  it("keeps detailed levels-system price-disconnect diagnostics in review snapshots", async () => {
    const result = await buildCsvDryRunDecisionReviewBridge({
      csvText: [
        "Date,Time,Symbol,Side,Quantity,Price",
        "2024-04-12,09:33:30,ABCD,Buy,100,0.4",
        "2024-04-12,09:39:10,ABCD,Sell,100,0.42",
      ].join("\n"),
      broker: "generic_execution_csv",
      levelsSystem: buildSampleLevelsSystemSupportResistanceOptions(),
      generatedAt: "2026-05-05T12:00:00.000Z",
    });

    const notes = result.decisionReviews[0]?.candleQualityNotes ?? [];

    expect(notes.join("\n")).toContain("possible split/adjustment");
    expect(notes.join("\n")).toContain("largest execution/candle distance");
    expect(notes.join("\n")).toContain("adjustment multiple");
    expect(notes.join("\n")).toContain(
      "Trade-window candle basis status: basis_adjustment_multiple_likely",
    );
    expect(notes.join("\n")).toContain("basis is proven aligned");
  }, 15_000);

  it("keeps validated IBKR alias and PINK diagnostics in review snapshots", async () => {
    const result = await buildCsvDryRunDecisionReviewBridge({
      csvText: SAMPLE_EXECUTION_CSV.replaceAll("ABCD", "MAXN"),
      broker: "generic_execution_csv",
      levelsSystem: {
        ...buildSampleLevelsSystemSupportResistanceOptions(),
        fetchService: new CandleFetchService(
          new AliasMetadataHistoricalCandleProvider(),
        ),
      },
      generatedAt: "2026-05-05T12:00:00.000Z",
    });

    const notes = result.decisionReviews[0]?.candleQualityNotes ?? [];
    const noteText = notes.join("\n");

    expect(noteText).toContain("validated IBKR alias MAXNQ");
    expect(noteText).toContain("resolved through MAXNQ on PINK");
    expect(noteText).toContain("OTC/PINK data path");
  }, 15_000);

  it("classifies insufficient daily/4h provider history as market context unavailable", async () => {
    const result = await buildCsvDryRunDecisionReviewBridge({
      csvText: SAMPLE_EXECUTION_CSV.replaceAll("ABCD", "AVEX"),
      broker: "generic_execution_csv",
      levelsSystem: {
        ...buildSampleLevelsSystemSupportResistanceOptions(),
        fetchService: new CandleFetchService(
          new MissingHigherTimeframeHistoricalCandleProvider(),
        ),
      },
      generatedAt: "2026-05-05T12:00:00.000Z",
    });

    expect(result.completedReviewCount).toBe(0);
    expect(result.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          symbol: "AVEX",
          code: "market_context_unavailable",
          message: expect.stringContaining("daily and 4h candles are required"),
        }),
      ]),
    );
  }, 15_000);

  it.each(decisionReviewCsvScenarios)(
    "runs deterministic decision-review scenario: $label",
    async (scenario) => {
      const result = await buildCsvDryRunDecisionReviewBridge({
        csvText: scenario.csvText,
        broker: scenario.broker,
        levelsSystem: scenario.levelsSystem,
        generatedAt: "2026-05-05T12:00:00.000Z",
      });
      const review = result.decisionReviews[0];
      const expectedCompletedReviewCount =
        scenario.expectedCompletedReviewCount ?? 1;

      expect(result.completedReviewCount).toBe(expectedCompletedReviewCount);

      if (scenario.expectedImportStatus) {
        expect(result.importStatus).toBe(scenario.expectedImportStatus);
      }

      if (expectedCompletedReviewCount === 0) {
        expect(result.decisionReviews).toEqual([]);

        for (const expectedCode of scenario.expectedDiagnosticCodes ?? []) {
          expect(
            result.diagnostics.map((diagnostic) => diagnostic.code),
          ).toContain(expectedCode);
        }

        return;
      }

      expect(review?.marketContextSource).toBe(
        scenario.expectedMarketContextSource,
      );
      expect(review?.insights.map((insight) => insight.id)).toEqual(
        expect.arrayContaining(scenario.expectedInsightIds),
      );
      if (scenario.requiredTitleFragments) {
        const titleText =
          review?.insights.map((insight) => insight.title).join("\n") ?? "";

        for (const fragment of scenario.requiredTitleFragments) {
          expect(titleText).toContain(fragment);
        }
      }
      if (scenario.requiredHeadlineFragments) {
        const headlineText = review?.coachingHeadline ?? "";

        for (const fragment of scenario.requiredHeadlineFragments) {
          expect(headlineText).toContain(fragment);
        }
      }
      if (scenario.requiredEvidenceFragments) {
        const evidenceText =
          review?.insights
            .flatMap((insight) => insight.evidence ?? [])
            .join("\n") ?? "";

        for (const fragment of scenario.requiredEvidenceFragments) {
          expect(evidenceText).toContain(fragment);
        }
      }
      if (scenario.forbiddenTextFragments) {
        const reviewText = [
          review?.coachingHeadline,
          review?.fixFirstBehaviorId,
          ...(review?.insights.flatMap((insight) => [
            insight.id,
            insight.title,
            insight.summary,
            ...(insight.evidence ?? []),
          ]) ?? []),
        ]
          .filter((value): value is string => typeof value === "string")
          .join("\n")
          .toLowerCase();

        for (const fragment of scenario.forbiddenTextFragments) {
          expect(reviewText).not.toContain(fragment.toLowerCase());
        }
      }
    },
    30_000,
  );
});
