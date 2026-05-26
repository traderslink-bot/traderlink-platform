import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { writeWarehouseVolumeActivityReport } from "../lib/review/warehouse-volume-activity-report.js";
function argValue(flag) {
    const index = process.argv.indexOf(flag);
    return index >= 0 ? process.argv[index + 1] : undefined;
}
function positionalArgs() {
    const values = [];
    const flagsWithValues = new Set(["--out-dir", "--cache", "--warehouse", "--provider", "--max-drift-minutes"]);
    for (let index = 2; index < process.argv.length; index += 1) {
        const arg = process.argv[index];
        if (arg.startsWith("--")) {
            if (flagsWithValues.has(arg)) {
                index += 1;
            }
            continue;
        }
        values.push(arg);
    }
    return values;
}
function latestLongRunSession() {
    const root = "artifacts/long-run";
    if (!existsSync(root)) {
        return root;
    }
    const sessions = readdirSync(root, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => join(root, entry.name))
        .filter((path) => existsSync(join(path, "discord-delivery-audit.jsonl")))
        .sort();
    return sessions.at(-1) ?? root;
}
function numberArg(flag) {
    const raw = argValue(flag);
    const value = raw ? Number(raw) : undefined;
    return Number.isFinite(value) ? value : undefined;
}
const input = positionalArgs()[0] ?? latestLongRunSession();
const outDir = argValue("--out-dir") ?? (input.endsWith(".jsonl") ? "artifacts/warehouse-volume-activity" : input);
const report = writeWarehouseVolumeActivityReport({
    auditPath: process.argv.includes("--all-sessions") ? "artifacts/long-run" : input,
    cacheDirectoryPath: argValue("--warehouse") ?? argValue("--cache") ?? ".validation-cache/candles",
    provider: (argValue("--provider") ?? "ibkr"),
    maxTimestampDriftMinutes: numberArg("--max-drift-minutes"),
    jsonPath: join(outDir, "warehouse-volume-activity-report.json"),
    markdownPath: join(outDir, "warehouse-volume-activity-report.md"),
});
console.log(`Warehouse volume activity replay: alerts=${report.totals.alertRows}, matched=${report.totals.matchedRows}, may-help=${report.totals.wouldHelpCount}, hide=${report.totals.shouldStayHiddenCount}.`);
