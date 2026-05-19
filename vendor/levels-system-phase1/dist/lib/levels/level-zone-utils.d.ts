import type { SourceTimeframe } from "./level-types.js";
export declare function clamp(value: number, min: number, max: number): number;
export declare function safeDivide(numerator: number, denominator: number, fallback?: number): number;
export declare function getZoneWidthPct(price: number): number;
export declare function buildZoneBounds(price: number): {
    zoneLow: number;
    zoneHigh: number;
};
export declare function priceDistancePct(a: number, b: number): number;
export declare function isPriceInsideZone(price: number, zoneLow: number, zoneHigh: number): boolean;
export declare function zoneMid(zoneLow: number, zoneHigh: number): number;
export declare function zoneWidthPct(zoneLow: number, zoneHigh: number): number;
export declare function zonesOverlap(zoneA: {
    zoneLow: number;
    zoneHigh: number;
}, zoneB: {
    zoneLow: number;
    zoneHigh: number;
}): boolean;
export declare function overlapRatio(zoneA: {
    zoneLow: number;
    zoneHigh: number;
}, zoneB: {
    zoneLow: number;
    zoneHigh: number;
}): number;
export declare function standardDeviation(values: number[]): number;
export declare function normalizeTimeframeRank(timeframes: SourceTimeframe | SourceTimeframe[]): number;
//# sourceMappingURL=level-zone-utils.d.ts.map