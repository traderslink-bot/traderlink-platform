import { describe, expect, it } from "vitest";
import sampleExecutionOnlyTrades from "../../../../docs/market-structure-calibration/sample-execution-only-trades.json";
import { sampleCreateRawTradeTimelineInput } from "../../../raw-trade-timeline/__fixtures__/sample-create-raw-trade-timeline-input";
import { parseMarketStructureAuditTradeDocument } from "../parse-market-structure-audit-trades";

describe("parseMarketStructureAuditTradeDocument", () => {
  it("parses the execution-only saved-trade template for levels-system candle fetching", () => {
    const parsed = parseMarketStructureAuditTradeDocument(
      sampleExecutionOnlyTrades,
    );

    expect(parsed.mode).toBe("levels_system_trade_window");
    expect(parsed.trades).toHaveLength(1);
    expect(parsed.trades[0]).toMatchObject({
      symbol: "ABCD",
      tradeDirection: "long",
      sessionContext: {
        sessionDate: "2026-05-01",
        sessionBucket: "market_open",
      },
      tradeWindow: {
        timeframe: "1m",
        preTradeMinutes: 60,
        postTradeMinutes: 60,
      },
    });
  });

  it("parses full candle-supplied trades without changing them to execution-only mode", () => {
    const parsed = parseMarketStructureAuditTradeDocument({
      trades: [sampleCreateRawTradeTimelineInput],
    });

    expect(parsed.mode).toBe("provided_trade_candles");
    expect(parsed.trades).toHaveLength(1);
    expect(parsed.trades[0]).toMatchObject({
      symbol: sampleCreateRawTradeTimelineInput.symbol,
      timeframe: sampleCreateRawTradeTimelineInput.timeframe,
    });
  });

  it("rejects empty saved-trade batches", () => {
    expect(() =>
      parseMarketStructureAuditTradeDocument({ trades: [] }),
    ).toThrowError(/at least one trade/i);
  });

  it("rejects mixed candle-supplied and execution-only trades", () => {
    const executionOnlyTrade = sampleExecutionOnlyTrades.trades[0];

    expect(() =>
      parseMarketStructureAuditTradeDocument({
        trades: [sampleCreateRawTradeTimelineInput, executionOnlyTrade],
      }),
    ).toThrowError(/mixes candle-supplied and execution-only/i);
  });

  it("rejects malformed execution-only trades before provider calls", () => {
    expect(() =>
      parseMarketStructureAuditTradeDocument({
        trades: [
          {
            symbol: "ABCD",
            tradeDirection: "long",
            sessionContext: {
              sessionDate: "2026-05-01",
              sessionBucket: "market_open",
            },
            executions: [
              {
                symbol: "ABCD",
                side: "buy",
                shares: 100,
                price: 1.23,
              },
            ],
          },
        ],
      }),
    ).toThrowError(/not a supported market-structure audit trade/i);
  });
});
