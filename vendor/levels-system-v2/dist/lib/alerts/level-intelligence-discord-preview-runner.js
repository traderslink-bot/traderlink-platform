import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { formatLevelIntelligenceDiscordPreview, } from "./level-intelligence-discord-preview.js";
import { buildLevelIntelligenceReviewResult, loadLevelEngineOutputJson, } from "../levels/level-intelligence-report-runner.js";
import { formatLevelIntelligenceReport } from "../levels/level-intelligence-report-formatter.js";
import { buildLevelIntelligenceReport } from "../levels/level-intelligence-report.js";
const defaultFileSystem = {
    readFileSync,
    writeFileSync,
    mkdirSync,
};
function requireValue(args, index, flag) {
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${flag}.`);
    }
    return value;
}
function parseFormat(value) {
    if (value === undefined) {
        return "text";
    }
    if (value === "text" || value === "json") {
        return value;
    }
    throw new Error(`Unsupported --format value "${value}". Expected text or json.`);
}
function parsePositiveInteger(value, flag) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0 || `${parsed}` !== value.trim()) {
        throw new Error(`Unsupported ${flag} value "${value}". Expected a positive integer.`);
    }
    return parsed;
}
export function parseLevelIntelligenceDiscordPreviewRunnerArgs(args, env = {}) {
    let levelOutputPath;
    let sessionFactsPath;
    let volumeFactsPath;
    let volumeShelvesPath;
    let marketContextPath;
    let factsBundlePath;
    let outPath;
    let format = "text";
    let sendTest = false;
    let dryRun = false;
    let testWebhookUrl;
    let maxMessageLength;
    for (let index = 0; index < args.length; index += 1) {
        const arg = args[index];
        if (arg === "--level-output") {
            levelOutputPath = requireValue(args, index, arg);
            index += 1;
            continue;
        }
        if (arg === "--session-facts") {
            sessionFactsPath = requireValue(args, index, arg);
            index += 1;
            continue;
        }
        if (arg === "--volume-facts") {
            volumeFactsPath = requireValue(args, index, arg);
            index += 1;
            continue;
        }
        if (arg === "--volume-shelves") {
            volumeShelvesPath = requireValue(args, index, arg);
            index += 1;
            continue;
        }
        if (arg === "--market-context") {
            marketContextPath = requireValue(args, index, arg);
            index += 1;
            continue;
        }
        if (arg === "--facts-bundle") {
            factsBundlePath = requireValue(args, index, arg);
            index += 1;
            continue;
        }
        if (arg === "--out") {
            outPath = requireValue(args, index, arg);
            index += 1;
            continue;
        }
        if (arg === "--format") {
            format = parseFormat(requireValue(args, index, arg));
            index += 1;
            continue;
        }
        if (arg === "--max-message-length") {
            maxMessageLength = parsePositiveInteger(requireValue(args, index, arg), arg);
            index += 1;
            continue;
        }
        if (arg === "--test-webhook-url") {
            testWebhookUrl = requireValue(args, index, arg);
            index += 1;
            continue;
        }
        if (arg === "--send-test") {
            sendTest = true;
            continue;
        }
        if (arg === "--dry-run") {
            dryRun = true;
            continue;
        }
        throw new Error(`Unknown argument "${arg}".`);
    }
    if (!levelOutputPath) {
        throw new Error("Missing required --level-output <path>.");
    }
    const mode = sendTest && !dryRun ? "send-test" : "dry-run";
    return {
        levelOutputPath,
        sessionFactsPath,
        volumeFactsPath,
        volumeShelvesPath,
        marketContextPath,
        factsBundlePath,
        outPath,
        format,
        mode,
        testWebhookUrl: testWebhookUrl ?? env.LEVEL_INTELLIGENCE_TEST_DISCORD_WEBHOOK_URL,
        maxMessageLength,
    };
}
function assertTestWebhookUrl(value) {
    if (!value) {
        throw new Error("Shadow Discord preview send-test requires --test-webhook-url or LEVEL_INTELLIGENCE_TEST_DISCORD_WEBHOOK_URL.");
    }
    if (!/^https?:\/\//i.test(value)) {
        throw new Error("Shadow Discord preview test webhook URL must start with http:// or https://.");
    }
}
function isRecord(value) {
    return typeof value === "object" && value !== null;
}
function loadJsonFile(filePath, label, fileSystem) {
    try {
        return JSON.parse(fileSystem.readFileSync(filePath, "utf8"));
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to read ${label} JSON from ${filePath}: ${message}`);
    }
}
function loadOptionalJsonFile(filePath, label, fileSystem) {
    return filePath === undefined ? undefined : loadJsonFile(filePath, label, fileSystem);
}
function normalizeVolumeShelvesJson(value) {
    if (Array.isArray(value)) {
        return value;
    }
    if (isRecord(value) && Array.isArray(value.shelves)) {
        return value.shelves;
    }
    throw new Error("Volume shelves JSON must contain a VolumeShelf array or an object with a shelves array.");
}
export function loadLevelIntelligenceDiscordPreviewFactsInput(options, fileSystem = defaultFileSystem) {
    const sessionFacts = loadOptionalJsonFile(options.sessionFactsPath, "session facts", fileSystem);
    const volumeFacts = loadOptionalJsonFile(options.volumeFactsPath, "volume facts", fileSystem);
    const marketContext = loadOptionalJsonFile(options.marketContextPath, "market context", fileSystem);
    const factsBundle = loadOptionalJsonFile(options.factsBundlePath, "facts bundle", fileSystem);
    const volumeShelvesJson = loadOptionalJsonFile(options.volumeShelvesPath, "volume shelves", fileSystem);
    return {
        sessionFacts,
        volumeFacts,
        volumeShelves: volumeShelvesJson === undefined ? undefined : normalizeVolumeShelvesJson(volumeShelvesJson),
        marketContext,
        factsBundle,
    };
}
function runnerContent(result) {
    if (result.format === "json") {
        return `${JSON.stringify(result, null, 2)}\n`;
    }
    const lines = [
        `${result.preview.symbol} level intelligence Discord preview (${result.mode})`,
        `Messages: ${result.preview.messages.length}`,
        `Truncated: ${result.preview.truncated ? "yes" : "no"}`,
        "",
    ];
    for (const message of result.preview.messages) {
        lines.push(`--- preview message ${message.index} ---`);
        lines.push(message.text);
        lines.push("");
    }
    lines.push("Safety");
    lines.push("- Preview/test path only.");
    lines.push("- Existing live alert routing was not invoked.");
    lines.push("- Existing monitoring path was not invoked.");
    lines.push("- Existing LevelEngine runtime path was not invoked.");
    lines.push("- VWAP remains facts-only.");
    lines.push("- Volume shelves remain facts-only.");
    if (result.sendResults.length === 0) {
        lines.push("- No test webhook deliveries.");
    }
    else {
        lines.push(`- Test webhook deliveries: ${result.sendResults.length}.`);
    }
    return `${lines.join("\n").trimEnd()}\n`;
}
export function buildLevelIntelligenceDiscordPreviewReviewResult(output, options) {
    const review = options.factsInput === undefined
        ? buildLevelIntelligenceReviewResult(output, "text")
        : {
            report: buildLevelIntelligenceReport({
                output,
                sessionFacts: options.factsInput.sessionFacts,
                volumeFacts: options.factsInput.volumeFacts,
                volumeShelves: options.factsInput.volumeShelves,
                marketContext: options.factsInput.marketContext,
                factsBundle: options.factsInput.factsBundle,
            }),
        };
    const formatted = "formatted" in review ? review.formatted : formatLevelIntelligenceReport(review.report);
    const previewOptions = {};
    if (options.maxMessageLength !== undefined) {
        previewOptions.maxMessageLength = options.maxMessageLength;
    }
    const preview = formatLevelIntelligenceDiscordPreview(formatted, previewOptions);
    return {
        levelOutputPath: options.levelOutputPath,
        outPath: options.outPath,
        format: options.format,
        mode: options.mode,
        reportSymbol: review.report.symbol,
        preview,
    };
}
export async function sendLevelIntelligenceDiscordPreviewWebhookMessage(request) {
    const response = await fetch(request.webhookUrl, {
        method: "POST",
        headers: {
            "content-type": "application/json",
        },
        body: JSON.stringify(request.payload),
    });
    if (!response.ok) {
        throw new Error(`Shadow Discord preview test webhook returned HTTP ${response.status}.`);
    }
    return {
        ok: true,
        status: response.status,
    };
}
export async function runLevelIntelligenceDiscordPreviewRunner(options, fileSystem = defaultFileSystem, sender = sendLevelIntelligenceDiscordPreviewWebhookMessage) {
    const output = loadLevelEngineOutputJson(options.levelOutputPath, fileSystem);
    const factsInput = loadLevelIntelligenceDiscordPreviewFactsInput(options, fileSystem);
    const baseResult = buildLevelIntelligenceDiscordPreviewReviewResult(output, {
        ...options,
        factsInput,
    });
    const sendResults = [];
    if (options.mode === "send-test") {
        assertTestWebhookUrl(options.testWebhookUrl);
        for (const message of baseResult.preview.messages) {
            const sendResult = await sender({
                webhookUrl: options.testWebhookUrl,
                message,
                payload: {
                    content: message.text,
                },
            });
            sendResults.push({
                ...sendResult,
                messageIndex: message.index,
                dryRun: false,
            });
        }
    }
    const resultWithoutContent = {
        ...baseResult,
        sendResults,
    };
    const content = runnerContent(resultWithoutContent);
    const result = {
        ...resultWithoutContent,
        content,
    };
    if (options.outPath) {
        fileSystem.mkdirSync(dirname(options.outPath), { recursive: true });
        fileSystem.writeFileSync(options.outPath, result.content, "utf8");
    }
    return result;
}
