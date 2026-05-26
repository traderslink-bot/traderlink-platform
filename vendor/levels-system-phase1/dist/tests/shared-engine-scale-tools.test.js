import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildExecutionLevelRelations, buildWarehouseBackedTradeAnalysisContext, DurableCandleWarehouse, getBulkTradeAnalysisPlan, getSharedEngineServiceInfo, getTradeAnalysisContext, planBulkCandleBackfill, SHARED_SUPPORT_RESISTANCE_ENGINE_API_VERSION, StubHistoricalCandleProvider, } from "../lib/support-resistance/index.js";
import { buildCandleWarehouseAuditReport, formatCandleWarehouseAuditMarkdown, } from "../lib/review/candle-warehouse-audit.js";
function candle(timestamp, close = 1) {
    return {
        timestamp,
        open: close,
        high: close + 0.05,
        low: close - 0.05,
        close,
        volume: 1000,
    };
}
function zone(params) {
    return {
        id: params.id,
        symbol: "TEST",
        kind: params.kind,
        timeframeBias: "daily",
        zoneLow: params.zoneLow ?? params.price,
        zoneHigh: params.zoneHigh ?? params.price,
        representativePrice: params.price,
        strengthScore: params.strengthScore ?? 10,
        strengthLabel: params.strengthLabel ?? "moderate",
        touchCount: params.touchCount ?? 2,
        confluenceCount: params.confluenceCount ?? 1,
        sourceTypes: params.sourceTypes ?? ["swing_high"],
        timeframeSources: params.timeframeSources ?? ["daily"],
        reactionQualityScore: params.reactionQualityScore ?? 1,
        rejectionScore: params.rejectionScore ?? 1,
        displacementScore: params.displacementScore ?? 1,
        sessionSignificanceScore: params.sessionSignificanceScore ?? 1,
        followThroughScore: params.followThroughScore ?? 1,
        sourceEvidenceCount: params.sourceEvidenceCount ?? 1,
        firstTimestamp: params.firstTimestamp ?? 1,
        lastTimestamp: params.lastTimestamp ?? 2,
        isExtension: params.isExtension ?? false,
        freshness: params.freshness ?? "fresh",
        notes: params.notes ?? [],
    };
}
function levelOutput() {
    return {
        symbol: "TEST",
        generatedAt: 1,
        metadata: {
            providerByTimeframe: {},
            dataQualityFlags: [],
            freshness: "fresh",
            referencePrice: 5.2,
        },
        majorSupport: [zone({ id: "S1", kind: "support", price: 5, strengthLabel: "major" })],
        intermediateSupport: [zone({ id: "S2", kind: "support", price: 4.6 })],
        intradaySupport: [],
        majorResistance: [zone({ id: "R1", kind: "resistance", price: 5.5, strengthLabel: "major" })],
        intermediateResistance: [zone({ id: "R2", kind: "resistance", price: 5.8 })],
        intradayResistance: [],
        extensionLevels: {
            support: [],
            resistance: [zone({ id: "XR1", kind: "resistance", price: 6.1, isExtension: true })],
        },
        specialLevels: {},
    };
}
test("execution level relations expose nearest support/resistance facts without advice", () => {
    const relations = buildExecutionLevelRelations(levelOutput(), 5.2, {
        stackedWindowPct: 20,
    });
    assert.equal(relations.nearestSupportBelow?.price, 5);
    assert.equal(relations.nearestResistanceAbove?.price, 5.5);
    assert.equal(relations.nearestResistanceBelow, null);
    assert.equal(relations.nearbyStructureOnBothSides, true);
    assert.equal(relations.relationLabel, "mid_range");
    assert.equal(relations.stackedResistanceAboveCount, 3);
    assert.equal(relations.hasStackedResistanceAbove, true);
    assert.match(relations.nearestReferenceLabel ?? "", /support|resistance/);
});
test("bulk candle backfill planner dedupes symbol windows and checks warehouse coverage", async () => {
    const warehouse = new DurableCandleWarehouse(mkdtempSync(join(tmpdir(), "bulk-plan-")));
    const tradeStart = Date.UTC(2026, 4, 1, 14, 30, 0);
    await warehouse.upsertCandles({
        provider: "stub",
        symbol: "PLAN",
        timeframe: "1m",
        candles: [candle(tradeStart - 60_000), candle(tradeStart)],
    });
    const plan = await planBulkCandleBackfill({
        provider: "stub",
        warehouse,
        trades: [
            { symbol: "plan", tradeStartTimestamp: tradeStart, tradeEndTimestamp: tradeStart + 60_000 },
            { symbol: "PLAN", tradeStartTimestamp: tradeStart + 120_000, tradeEndTimestamp: tradeStart + 180_000 },
        ],
        timeframes: [{ timeframe: "1m", preTradeMinutes: 1, postTradeMinutes: 1 }],
    });
    assert.equal(plan.tradeCount, 2);
    assert.deepEqual(plan.uniqueSymbols, ["PLAN"]);
    assert.equal(plan.items.length, 1);
    assert.equal(plan.items[0]?.tradeCount, 2);
    assert.equal(plan.items[0]?.existingCandles, 2);
    assert.ok(plan.estimatedFetchCount > 0);
});
test("warehouse backed trade analysis context writes through and service wrapper can reuse it", async () => {
    const warehouse = new DurableCandleWarehouse(mkdtempSync(join(tmpdir(), "trade-context-")));
    const tradeStart = Date.UTC(2026, 4, 1, 15, 30, 0);
    const context = await buildWarehouseBackedTradeAnalysisContext({
        symbol: "WHBK",
        asOfTimestamp: tradeStart + 20 * 60_000,
        tradeStartTimestamp: tradeStart,
        tradeEndTimestamp: tradeStart + 5 * 60_000,
        warehouse,
        providerName: "stub",
        delegateFetchServiceOptions: {
            provider: new StubHistoricalCandleProvider(),
        },
        supportResistance: {
            lookbackBars: {
                daily: 120,
                "4h": 80,
                "5m": 40,
            },
        },
        tradeWindow: {
            timeframe: "1m",
            preTradeMinutes: 5,
            postTradeMinutes: 5,
        },
    });
    assert.equal(context.symbol, "WHBK");
    assert.ok(context.tradeWindow.allCandles.length > 0);
    assert.ok((await warehouse.listSymbols("stub")).includes("WHBK"));
    const viaService = await getTradeAnalysisContext({
        symbol: "WHBK",
        asOfTimestamp: tradeStart + 20 * 60_000,
        tradeStartTimestamp: tradeStart,
        tradeEndTimestamp: tradeStart + 5 * 60_000,
        warehouse,
        providerName: "stub",
        delegateFetchServiceOptions: {
            provider: new StubHistoricalCandleProvider(),
        },
        supportResistance: {
            lookbackBars: {
                daily: 120,
                "4h": 80,
                "5m": 40,
            },
        },
    });
    assert.equal(viaService.candleFetchingOwnedBy, "levels-system");
});
test("website service metadata and bulk planner wrapper expose stable public contract", async () => {
    assert.match(SHARED_SUPPORT_RESISTANCE_ENGINE_API_VERSION, /^\d+\.\d+\.\d+$/);
    const info = getSharedEngineServiceInfo();
    assert.equal(info.ownsCandleFetching, true);
    assert.equal(info.ownsDurableWarehouse, true);
    const plan = await getBulkTradeAnalysisPlan({
        provider: "stub",
        trades: [{ symbol: "API", asOfTimestamp: Date.UTC(2026, 4, 1, 15, 0, 0) }],
        timeframes: [{ timeframe: "daily", lookbackBars: 3 }],
    });
    assert.equal(plan.estimatedFetchCount, 1);
});
test("candle warehouse audit reports row quality and markdown summary", () => {
    const root = mkdtempSync(join(tmpdir(), "warehouse-audit-"));
    const path = join(root, "stub", "BAD", "1m");
    // Tests can create fixture files directly; production writes should use the warehouse class.
    mkdirSync(path, { recursive: true });
    writeFileSync(join(path, "2026-05-01.jsonl"), [
        JSON.stringify({ timestamp: 1, open: 1, high: 1.1, low: 0.9, close: 1, volume: 100 }),
        JSON.stringify({ timestamp: 1, open: 1, high: 0.9, low: 1.2, close: 1, volume: 100 }),
    ].join("\n"));
    const report = buildCandleWarehouseAuditReport(root);
    assert.equal(report.totals.symbols, 1);
    assert.equal(report.totals.rows, 2);
    assert.equal(report.totals.duplicateTimestamps, 1);
    assert.equal(report.totals.invalidOhlcRows, 1);
    assert.match(formatCandleWarehouseAuditMarkdown(report), /BAD/);
});
