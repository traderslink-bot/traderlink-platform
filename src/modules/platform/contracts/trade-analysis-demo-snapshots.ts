import manifest from "@/public/demo-previews/trade-analyzer-analysis/manifest.json";

export const TRADE_ANALYSIS_DEMO_VIEWS = ["day", "trades", "trend-momentum", "entry-exit", "mfe-mae", "green-to-red", "scaling-out", "candle-patterns"] as const;
export type TradeAnalysisDemoView = typeof TRADE_ANALYSIS_DEMO_VIEWS[number];
export type DemoSnapshotSection = Readonly<{ src: string; top: number; width: number; height: number }>;
export type DemoSnapshot = Readonly<{ width: number; height: number; sections: readonly DemoSnapshotSection[] }>;
export type DemoSnapshotPair = Readonly<{ desktop: DemoSnapshot; mobile: DemoSnapshot }>;
export type DemoSnapshotManifest = Readonly<{ version: number; pages: Partial<Record<TradeAnalysisDemoView, Partial<Record<"light" | "dark", DemoSnapshotPair>>>> }>;
export const tradeAnalysisDemoSnapshots: DemoSnapshotManifest = manifest;
