import type { Candle } from "../market-data/candle-types.js";
export type VolumeShelfRole = "unknown" | "support" | "resistance" | "chop_zone" | "magnet";
export type VolumeShelf = {
    id: string;
    zoneLow: number;
    zoneHigh: number;
    representativePrice: number;
    totalVolume: number;
    dollarVolume: number;
    percentOfWindowVolume: number;
    touchCount: number;
    firstTimestamp: number;
    lastTimestamp: number;
    shelfRole: VolumeShelfRole;
    confidence: number;
    reason: string;
};
export type VolumeShelfDetectorDiagnosticCode = "future_candles_filtered" | "partial_candles_filtered" | "no_closed_candles" | "zero_window_volume";
export type VolumeShelfDetectorDiagnostic = {
    code: VolumeShelfDetectorDiagnosticCode;
    severity: "info" | "warning";
    message: string;
    excludedCount?: number;
};
export type DetectVolumeShelvesRequest = {
    symbol: string;
    asOfTimestamp: number;
    candles5m: Candle[];
    currentPrice?: number;
    bucketWidthPercent?: number;
    minimumBucketWidth?: number;
    minShelfPercentOfWindowVolume?: number;
    maxShelves?: number;
};
export type DetectVolumeShelvesResult = {
    symbol: string;
    asOfTimestamp: number;
    shelves: VolumeShelf[];
    diagnostics: VolumeShelfDetectorDiagnostic[];
    filteredCandleCount: number;
    totalWindowVolume: number;
};
export declare function detectVolumeShelves(request: DetectVolumeShelvesRequest): DetectVolumeShelvesResult;
//# sourceMappingURL=volume-shelf-detector.d.ts.map