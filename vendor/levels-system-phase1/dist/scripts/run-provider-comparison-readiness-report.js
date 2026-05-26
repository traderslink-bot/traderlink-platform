import { join } from "node:path";
import { writeProviderComparisonReadinessReport } from "../lib/review/provider-comparison-readiness-report.js";
function argValue(flag) {
    const index = process.argv.indexOf(flag);
    return index >= 0 ? process.argv[index + 1] : undefined;
}
function numberArg(flag) {
    const raw = argValue(flag);
    const value = raw ? Number(raw) : undefined;
    return Number.isFinite(value) ? value : undefined;
}
function listArg(flag) {
    const raw = argValue(flag);
    return raw?.split(",").map((value) => value.trim()).filter(Boolean);
}
const outDir = argValue("--out-dir") ?? "artifacts/provider-comparison-readiness";
const report = await writeProviderComparisonReadinessReport({
    cacheDirectoryPath: argValue("--cache") ?? ".validation-cache/candles",
    primaryProvider: (argValue("--primary") ?? "ibkr"),
    comparisonProvider: (argValue("--comparison") ?? "stub"),
    timeframes: listArg("--timeframes"),
    symbols: listArg("--symbols"),
    maxSymbols: numberArg("--max-symbols"),
    jsonPath: join(outDir, "provider-comparison-readiness.json"),
    markdownPath: join(outDir, "provider-comparison-readiness.md"),
});
console.log(`Provider comparison readiness: symbols=${report.totals.symbolsCompared}, bothAvailable=${report.totals.bothAvailable}, highCloseDrift=${report.totals.highCloseDriftCount}, highVolumeDrift=${report.totals.highVolumeDriftCount}, structureDrift=${report.totals.marketStructureDriftWatchCount}, missingBehavior=${report.totals.providerMissingBehaviorCount}, levelDriftWatch=${report.totals.levelDriftWatchCount}.`);
