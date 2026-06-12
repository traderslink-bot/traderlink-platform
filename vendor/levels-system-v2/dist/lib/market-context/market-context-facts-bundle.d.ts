import type { SessionMarketFactDiagnostic, SessionMarketFacts } from "../session/index.js";
import type { VolumeMarketFactDiagnostic, VolumeMarketFacts, VolumeShelf } from "../volume/index.js";
export type MarketContextFactsBundleNewsMetadata = {
    newsTimestamp?: number;
    pressReleaseTimestamp?: number;
    hasExplicitCatalyst: true;
};
export type MarketContextFactsBundleDiagnostics = {
    futureCandlesExcluded: number;
    partialCandlesExcluded: number;
    sessionDiagnostics: SessionMarketFactDiagnostic[];
    volumeDiagnostics: VolumeMarketFactDiagnostic[];
};
export type MarketContextFactsBundleSafetyFlags = {
    levelOutputUnchanged: true;
    shelvesAreFactsOnly: true;
    vwapFactsOnly: true;
};
export type MarketContextFactsBundle = {
    symbol: string;
    asOfTimestamp: number;
    referencePrice?: number;
    sessionFacts: SessionMarketFacts;
    volumeFacts: VolumeMarketFacts;
    volumeShelves: VolumeShelf[];
    news?: MarketContextFactsBundleNewsMetadata;
    diagnostics: MarketContextFactsBundleDiagnostics;
    levelOutputUnchanged: true;
    shelvesAreFactsOnly: true;
    vwapFactsOnly: true;
};
export type BuildMarketContextFactsBundleRequest = {
    sessionFacts: SessionMarketFacts;
    volumeFacts: VolumeMarketFacts;
    volumeShelves?: VolumeShelf[];
    symbol?: string;
    asOfTimestamp?: number;
    referencePrice?: number;
    newsTimestamp?: number;
    pressReleaseTimestamp?: number;
};
export declare function buildMarketContextFactsBundle(request: BuildMarketContextFactsBundleRequest): MarketContextFactsBundle;
//# sourceMappingURL=market-context-facts-bundle.d.ts.map