import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { writeWhyNoPostReplayProof } from "../lib/review/why-no-post-replay-proof.js";
function argValue(flag) {
    const index = process.argv.indexOf(flag);
    return index >= 0 ? process.argv[index + 1] : undefined;
}
function positionalArgs() {
    const values = [];
    const flagsWithValues = new Set(["--out-dir", "--cache", "--warehouse", "--provider", "--timeframe", "--input", "--replay-profile", "--max-sessions"]);
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
function hasFlag(flag) {
    return process.argv.includes(flag);
}
function numberArg(flag) {
    const raw = argValue(flag);
    const value = raw ? Number(raw) : undefined;
    return Number.isFinite(value) ? value : undefined;
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
const allSessions = hasFlag("--all-sessions");
const input = argValue("--input") ?? positionalArgs()[0] ?? (allSessions ? "artifacts/long-run" : latestLongRunSession());
const auditPath = allSessions ? input : (input.endsWith(".jsonl") ? input : join(input, "discord-delivery-audit.jsonl"));
const outDir = argValue("--out-dir") ?? (allSessions || input.endsWith(".jsonl") ? "artifacts/why-no-post-replay-proof" : input);
const report = writeWhyNoPostReplayProof({
    auditPath,
    cacheDirectoryPath: argValue("--cache") ?? ".validation-cache/candles",
    warehouseDirectoryPath: argValue("--warehouse"),
    provider: (argValue("--provider") ?? "ibkr"),
    timeframe: (argValue("--timeframe") ?? "5m"),
    includeReplayEvidence: !allSessions,
    replayProfile: (argValue("--replay-profile") ?? "balanced"),
    maxAuditFiles: numberArg("--max-sessions"),
    jsonPath: join(outDir, "why-no-post-replay-proof.json"),
    markdownPath: join(outDir, "why-no-post-replay-proof.md"),
});
console.log(`Why-no-post proof: symbols=${report.totals.symbols}, quietSupported=${report.totals.quietSupported}, mayHide=${report.totals.quietMayHideMove}, runtimeSilence=${report.totals.unprovenRuntimeSilence}, missingCandles=${report.totals.unprovenMissingCandles}.`);
