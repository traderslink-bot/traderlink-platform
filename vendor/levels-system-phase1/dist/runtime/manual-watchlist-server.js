import "dotenv/config";
import { createServer } from "node:http";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { CandleFetchService } from "../lib/market-data/candle-fetch-service.js";
import { ValidationCachedCandleFetchService, resolveValidationCandleCacheMode, } from "../lib/validation/validation-candle-cache.js";
import { createOpenAITraderCommentaryServiceFromEnv } from "../lib/ai/trader-commentary-service.js";
import { createFinnhubClientFromEnv } from "../lib/stock-context/finnhub-client.js";
import { createYahooClientFromEnv } from "../lib/stock-context/yahoo-client.js";
import { CombinedStockContextProvider } from "../lib/stock-context/stock-context-provider.js";
import { IbkrHistoricalCandleProvider } from "../lib/market-data/ibkr-historical-candle-provider.js";
import { IBKRLivePriceProvider } from "../lib/monitoring/ibkr-live-price-provider.js";
import { LevelStore } from "../lib/monitoring/level-store.js";
import { DEFAULT_MANUAL_WATCHLIST_HISTORICAL_LOOKBACKS, ManualWatchlistRuntimeManager, resolveMarketStructureStandalonePostMode, } from "../lib/monitoring/manual-watchlist-runtime-manager.js";
import { AdaptiveScoringEngine, DEFAULT_ADAPTIVE_SCORING_CONFIG, } from "../lib/monitoring/adaptive-scoring.js";
import { createCompositeManualWatchlistLifecycleListener, createConsoleManualWatchlistLifecycleListener, createManualWatchlistLifecycleFileListener, isMarketStructureLifecycleEvent, } from "../lib/monitoring/manual-watchlist-runtime-events.js";
import { AdaptiveStatePersistence } from "../lib/monitoring/adaptive-state-persistence.js";
import { OpportunityRuntimeController } from "../lib/monitoring/opportunity-runtime-controller.js";
import { createMonitoringEventDiagnosticListener } from "../lib/monitoring/monitoring-event-diagnostic-logger.js";
import { WatchlistMonitor } from "../lib/monitoring/watchlist-monitor.js";
import { WatchlistStatePersistence } from "../lib/monitoring/watchlist-state-persistence.js";
import { waitForIbkrConnection } from "../scripts/shared/ibkr-connection.js";
import { createIbkrClient, isIbkrConnected, isIbkrReconnecting, } from "../scripts/shared/ibkr-runtime.js";
import { createDiscordAlertRouter } from "./manual-watchlist-discord.js";
import { LOCAL_BIND_HOST, RequestBodyParseError, readJsonBody, sendJson, } from "./manual-watchlist-http.js";
import { MANUAL_WATCHLIST_PAGE } from "./manual-watchlist-page.js";
import { resolveLiveThreadPostingProfile } from "../lib/monitoring/live-thread-post-policy.js";
const PORT = Number(process.env.MANUAL_WATCHLIST_PORT ?? 3010);
const MONITORING_EVENT_DIAGNOSTICS_ENV = "LEVEL_MONITORING_EVENT_DIAGNOSTICS";
const SESSION_DIRECTORY_ENV = "LEVEL_MANUAL_SESSION_DIRECTORY";
const AI_COMMENTARY_ENV = "LEVEL_AI_COMMENTARY";
const AI_MODEL_ENV = "LEVEL_AI_MODEL";
const MANUAL_WATCHLIST_IBKR_TIMEOUT_ENV = "MANUAL_WATCHLIST_IBKR_TIMEOUT_MS";
const MANUAL_WATCHLIST_LEVEL_SEED_TIMEOUT_ENV = "MANUAL_WATCHLIST_LEVEL_SEED_TIMEOUT_MS";
const MANUAL_WATCHLIST_FAST_LEVEL_CLEAR_COALESCE_ENV = "MANUAL_WATCHLIST_FAST_LEVEL_CLEAR_COALESCE_MS";
const MANUAL_WATCHLIST_CANDLE_CACHE_MODE_ENV = "MANUAL_WATCHLIST_CANDLE_CACHE_MODE";
const MANUAL_WATCHLIST_CANDLE_CACHE_DIR_ENV = "MANUAL_WATCHLIST_CANDLE_CACHE_DIR";
const MANUAL_WATCHLIST_STARTUP_CANDLE_CACHE_ENV = "MANUAL_WATCHLIST_STARTUP_CANDLE_CACHE";
const MANUAL_WATCHLIST_LOOKBACK_DAILY_ENV = "LEVEL_MANUAL_LOOKBACK_DAILY";
const MANUAL_WATCHLIST_LOOKBACK_4H_ENV = "LEVEL_MANUAL_LOOKBACK_4H";
const MANUAL_WATCHLIST_LOOKBACK_5M_ENV = "LEVEL_MANUAL_LOOKBACK_5M";
const WATCHLIST_POSTING_PROFILE_ENV = "WATCHLIST_POSTING_PROFILE";
const MARKET_STRUCTURE_STANDALONE_POSTS_ENV = "MARKET_STRUCTURE_STANDALONE_POSTS";
const DEFAULT_MANUAL_WATCHLIST_IBKR_TIMEOUT_MS = 90_000;
const DEFAULT_MANUAL_WATCHLIST_LEVEL_SEED_TIMEOUT_MS = 90_000;
const DEFAULT_MANUAL_WATCHLIST_FAST_LEVEL_CLEAR_COALESCE_MS = 5000;
const REVIEW_ARTIFACT_FILES = [
    "session-review.md",
    "thread-post-policy-report.md",
    "long-run-tuning-suggestions.md",
    "live-post-replay-simulation.md",
    "live-post-profile-comparison.md",
    "runner-story-report.md",
    "trader-story-quality-review.md",
    "trader-story-quality-review.json",
    "trader-post-quality-report.md",
    "post-reason-audit.md",
    "known-bad-post-patterns.md",
    "all-symbol-stress-report.md",
    "trader-usefulness-replay-score.md",
    "trader-usefulness-replay-score.json",
    "daily-trader-review.md",
    "daily-trader-review.html",
    "daily-trader-review.json",
    "end-of-day-symbol-verdict.md",
    "end-of-day-symbol-verdict.json",
    "missed-meaningful-move-audit.md",
    "missed-meaningful-move-audit.json",
    "session-behavior-audit.md",
    "session-behavior-audit.json",
    "market-structure-delivery-audit.md",
    "market-structure-delivery-audit.json",
    "market-structure-calibration.md",
    "market-structure-calibration.json",
    "market-structure-outcome-calibration.md",
    "market-structure-outcome-calibration.json",
    "market-structure-lifecycle.jsonl",
    "market-structure-story-memory.json",
    "snapshot-audit-report.md",
    "live-post-replay-simulation.json",
    "live-post-profile-comparison.json",
    "runner-story-report.json",
    "thread-clutter-report.json",
    "thread-summaries.json",
    "discord-delivery-audit.jsonl",
];
const DISCORD_API_BASE_URL = "https://discord.com/api/v10";
const DISCORD_CLEANUP_PAGE_LIMIT = 100;
const DISCORD_CLEANUP_PARENT_MESSAGE_PAGE_LIMIT = 50;
const DISCORD_CLEANUP_RETRY_DELAY_MS = 1000;
function isTruthyEnv(value) {
    if (!value) {
        return false;
    }
    return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}
function resolvePositiveIntegerEnv(value, fallback) {
    const parsed = Number.parseInt(value ?? "", 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function resolveManualWatchlistHistoricalLookbacks() {
    return {
        daily: resolvePositiveIntegerEnv(process.env[MANUAL_WATCHLIST_LOOKBACK_DAILY_ENV], DEFAULT_MANUAL_WATCHLIST_HISTORICAL_LOOKBACKS.daily),
        "4h": resolvePositiveIntegerEnv(process.env[MANUAL_WATCHLIST_LOOKBACK_4H_ENV], DEFAULT_MANUAL_WATCHLIST_HISTORICAL_LOOKBACKS["4h"]),
        "5m": resolvePositiveIntegerEnv(process.env[MANUAL_WATCHLIST_LOOKBACK_5M_ENV], DEFAULT_MANUAL_WATCHLIST_HISTORICAL_LOOKBACKS["5m"]),
    };
}
function readReviewArtifacts(sessionDirectory) {
    if (!sessionDirectory) {
        return REVIEW_ARTIFACT_FILES.map((name) => ({
            name,
            exists: false,
            sizeBytes: null,
            updatedAt: null,
            preview: null,
            readError: null,
        }));
    }
    return REVIEW_ARTIFACT_FILES.map((name) => {
        const path = join(sessionDirectory, name);
        if (!existsSync(path)) {
            return {
                name,
                exists: false,
                sizeBytes: null,
                updatedAt: null,
                preview: null,
                readError: null,
            };
        }
        try {
            const stats = statSync(path);
            const isPreviewable = name.endsWith(".md") || name.endsWith(".json");
            const preview = isPreviewable
                ? readFileSync(path, "utf8").slice(0, 1800)
                : null;
            return {
                name,
                exists: true,
                sizeBytes: stats.size,
                updatedAt: stats.mtimeMs,
                preview,
                readError: null,
            };
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            console.warn(`[ManualWatchlistRuntime] Review artifact ${name} is temporarily unreadable: ${message}`);
            return {
                name,
                exists: true,
                sizeBytes: null,
                updatedAt: null,
                preview: null,
                readError: message,
            };
        }
    });
}
function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
async function discordCleanupRequest(path, botToken, init = {}) {
    for (let attempt = 0; attempt < 3; attempt += 1) {
        const response = await fetch(`${DISCORD_API_BASE_URL}${path}`, {
            ...init,
            headers: {
                Authorization: `Bot ${botToken}`,
                "Content-Type": "application/json",
                ...(init.headers ?? {}),
            },
        });
        if (response.ok) {
            const text = await response.text();
            return text.trim() ? JSON.parse(text) : null;
        }
        if (response.status === 404 && init.method === "DELETE") {
            return null;
        }
        if (response.status === 429 || response.status >= 500) {
            const retryAfterSeconds = Number(response.headers.get("retry-after") ?? "");
            await delay(Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0
                ? retryAfterSeconds * 1000
                : DISCORD_CLEANUP_RETRY_DELAY_MS);
            continue;
        }
        const body = await response.text();
        throw new Error(`Discord cleanup request failed (${response.status}) for ${path}: ${body || response.statusText}`);
    }
    throw new Error(`Discord cleanup request failed after retries for ${path}.`);
}
async function fetchWatchlistParentMessages(watchlistChannelId, botToken) {
    const messages = [];
    let before = null;
    for (let page = 0; page < DISCORD_CLEANUP_PARENT_MESSAGE_PAGE_LIMIT; page += 1) {
        const query = new URLSearchParams({ limit: String(DISCORD_CLEANUP_PAGE_LIMIT) });
        if (before) {
            query.set("before", before);
        }
        const batch = await discordCleanupRequest(`/channels/${watchlistChannelId}/messages?${query.toString()}`, botToken);
        if (!batch || batch.length === 0) {
            break;
        }
        messages.push(...batch);
        before = batch[batch.length - 1]?.id ?? null;
        if (batch.length < DISCORD_CLEANUP_PAGE_LIMIT || !before) {
            break;
        }
    }
    return messages;
}
async function fetchWatchlistThreads(watchlistChannelId, guildId, botToken) {
    const threads = [];
    if (guildId) {
        const active = await discordCleanupRequest(`/guilds/${guildId}/threads/active`, botToken);
        threads.push(...(active?.threads ?? []).filter((thread) => thread.parent_id === watchlistChannelId));
    }
    const archived = await discordCleanupRequest(`/channels/${watchlistChannelId}/threads/archived/public?limit=${DISCORD_CLEANUP_PAGE_LIMIT}`, botToken);
    threads.push(...(archived?.threads ?? []).filter((thread) => thread.parent_id === watchlistChannelId));
    const seen = new Set();
    return threads.filter((thread) => {
        if (seen.has(thread.id)) {
            return false;
        }
        seen.add(thread.id);
        return true;
    });
}
async function clearDiscordWatchlistChannel() {
    const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
    const watchlistChannelId = process.env.DISCORD_WATCHLIST_CHANNEL_ID?.trim();
    const guildId = process.env.DISCORD_GUILD_ID?.trim() || undefined;
    if (!botToken) {
        throw new Error("DISCORD_BOT_TOKEN is required to clear Discord posts.");
    }
    if (!watchlistChannelId) {
        throw new Error("DISCORD_WATCHLIST_CHANNEL_ID is required to clear Discord posts.");
    }
    const [threads, parentMessages] = await Promise.all([
        fetchWatchlistThreads(watchlistChannelId, guildId, botToken),
        fetchWatchlistParentMessages(watchlistChannelId, botToken),
    ]);
    const deletedThreads = [];
    for (const thread of threads) {
        await discordCleanupRequest(`/channels/${thread.id}`, botToken, { method: "DELETE" });
        deletedThreads.push({ id: thread.id, name: thread.name ?? thread.id });
    }
    const deletedParentMessages = [];
    let skippedParentMessageCount = 0;
    for (const message of parentMessages) {
        try {
            await discordCleanupRequest(`/channels/${watchlistChannelId}/messages/${message.id}`, botToken, { method: "DELETE" });
            deletedParentMessages.push({
                id: message.id,
                label: message.thread?.name ?? message.content?.slice(0, 30) ?? "message",
            });
        }
        catch (error) {
            const messageText = error instanceof Error ? error.message : String(error);
            if (messageText.includes("(403)") || messageText.includes("(404)")) {
                skippedParentMessageCount += 1;
                continue;
            }
            throw error;
        }
    }
    return {
        threadDeleteCount: deletedThreads.length,
        parentMessageDeleteCount: deletedParentMessages.length,
        skippedParentMessageCount,
        deletedThreads,
        deletedParentMessages,
    };
}
async function main() {
    const ib = createIbkrClient();
    const manualWatchlistIbkrTimeoutMs = Number(process.env[MANUAL_WATCHLIST_IBKR_TIMEOUT_ENV] ?? DEFAULT_MANUAL_WATCHLIST_IBKR_TIMEOUT_MS);
    const manualWatchlistLevelSeedTimeoutMs = resolvePositiveIntegerEnv(process.env[MANUAL_WATCHLIST_LEVEL_SEED_TIMEOUT_ENV], DEFAULT_MANUAL_WATCHLIST_LEVEL_SEED_TIMEOUT_MS);
    const manualWatchlistFastLevelClearCoalesceMs = resolvePositiveIntegerEnv(process.env[MANUAL_WATCHLIST_FAST_LEVEL_CLEAR_COALESCE_ENV], DEFAULT_MANUAL_WATCHLIST_FAST_LEVEL_CLEAR_COALESCE_MS);
    const historicalLookbackBars = resolveManualWatchlistHistoricalLookbacks();
    const historicalProvider = new IbkrHistoricalCandleProvider(ib, Number.isFinite(manualWatchlistIbkrTimeoutMs) && manualWatchlistIbkrTimeoutMs > 0
        ? manualWatchlistIbkrTimeoutMs
        : DEFAULT_MANUAL_WATCHLIST_IBKR_TIMEOUT_MS);
    const liveProvider = new IBKRLivePriceProvider(ib);
    const rawCandleService = new CandleFetchService(historicalProvider);
    const requestedCandleCacheMode = resolveValidationCandleCacheMode(process.env[MANUAL_WATCHLIST_CANDLE_CACHE_MODE_ENV]);
    const candleCacheDirectoryPath = process.env[MANUAL_WATCHLIST_CANDLE_CACHE_DIR_ENV]?.trim() ||
        join(process.cwd(), ".validation-cache", "candles");
    const startupCandleCacheEnabled = requestedCandleCacheMode !== "off" &&
        process.env[MANUAL_WATCHLIST_STARTUP_CANDLE_CACHE_ENV]?.trim() !== "0";
    const runtimeCandleCacheMode = startupCandleCacheEnabled && requestedCandleCacheMode === "read_write"
        ? "refresh"
        : requestedCandleCacheMode;
    const candleService = runtimeCandleCacheMode === "off"
        ? rawCandleService
        : new ValidationCachedCandleFetchService(rawCandleService, {
            cacheDirectoryPath: candleCacheDirectoryPath,
            mode: runtimeCandleCacheMode,
        });
    const startupCachedCandleFetchService = startupCandleCacheEnabled
        ? new ValidationCachedCandleFetchService(rawCandleService, {
            cacheDirectoryPath: candleCacheDirectoryPath,
            mode: "replay",
        })
        : null;
    const levelStore = new LevelStore();
    const monitoringEventDiagnosticsEnabled = isTruthyEnv(process.env[MONITORING_EVENT_DIAGNOSTICS_ENV]);
    const monitor = new WatchlistMonitor(levelStore, liveProvider, undefined, monitoringEventDiagnosticsEnabled
        ? {
            diagnosticListener: createMonitoringEventDiagnosticListener(),
        }
        : undefined);
    const adaptiveStatePersistence = new AdaptiveStatePersistence({
        minMultiplier: DEFAULT_ADAPTIVE_SCORING_CONFIG.minMultiplier,
        maxMultiplier: DEFAULT_ADAPTIVE_SCORING_CONFIG.maxMultiplier,
    });
    const initialAdaptiveState = adaptiveStatePersistence.load() ?? undefined;
    const adaptiveScoringEngine = new AdaptiveScoringEngine(DEFAULT_ADAPTIVE_SCORING_CONFIG, undefined, initialAdaptiveState);
    const opportunityRuntimeController = new OpportunityRuntimeController({
        adaptiveScoringEngine,
        adaptiveStatePersistence,
    });
    const aiCommentaryEnabled = isTruthyEnv(process.env[AI_COMMENTARY_ENV]);
    const aiCommentaryModel = process.env[AI_MODEL_ENV]?.trim() || "gpt-5-mini";
    const postingProfile = resolveLiveThreadPostingProfile(process.env[WATCHLIST_POSTING_PROFILE_ENV]);
    const marketStructureStandalonePostMode = resolveMarketStructureStandalonePostMode(process.env[MARKET_STRUCTURE_STANDALONE_POSTS_ENV]);
    const sessionDirectory = process.env[SESSION_DIRECTORY_ENV]?.trim() || null;
    const marketStructureLifecyclePath = sessionDirectory
        ? join(sessionDirectory, "market-structure-lifecycle.jsonl")
        : null;
    const marketStructureStoryMemoryPath = sessionDirectory
        ? join(sessionDirectory, "market-structure-story-memory.json")
        : null;
    const lifecycleListener = marketStructureLifecyclePath
        ? createCompositeManualWatchlistLifecycleListener([
            createConsoleManualWatchlistLifecycleListener(),
            createManualWatchlistLifecycleFileListener(marketStructureLifecyclePath, {
                include: isMarketStructureLifecycleEvent,
            }),
        ])
        : createConsoleManualWatchlistLifecycleListener();
    const openAiApiKeyPresent = Boolean(process.env.OPENAI_API_KEY?.trim());
    const aiCommentaryService = aiCommentaryEnabled
        ? createOpenAITraderCommentaryServiceFromEnv()
        : null;
    const finnhubClient = createFinnhubClientFromEnv();
    const yahooClient = createYahooClientFromEnv();
    const stockContextProvider = finnhubClient || yahooClient
        ? new CombinedStockContextProvider({
            finnhubClient,
            yahooClient,
        })
        : null;
    const manager = new ManualWatchlistRuntimeManager({
        candleFetchService: candleService,
        startupCachedCandleFetchService,
        levelStore,
        monitor,
        discordAlertRouter: createDiscordAlertRouter(),
        opportunityRuntimeController,
        historicalLookbackBars,
        aiCommentaryService,
        stockContextProvider,
        watchlistStatePersistence: new WatchlistStatePersistence(),
        lifecycleListener,
        optionalPostSettleDelayMs: 250,
        postingProfile,
        levelSeedTimeoutMs: manualWatchlistLevelSeedTimeoutMs,
        fastLevelClearCoalesceMs: manualWatchlistFastLevelClearCoalesceMs,
        marketStructureStoryMemoryPath,
        marketStructureStandalonePostMode,
    });
    let startupState = "booting";
    let startupError = null;
    const bootRuntime = async () => {
        try {
            await waitForIbkrConnection(ib);
            startupState = "ready";
            startupError = null;
            console.log(`[ManualWatchlistRuntime] Candle provider path: ${candleService.getProviderName()}`);
            if (requestedCandleCacheMode !== "off") {
                console.log(`[ManualWatchlistRuntime] Candle cache: requested=${requestedCandleCacheMode}, runtime=${runtimeCandleCacheMode}, startup=${startupCandleCacheEnabled ? "enabled" : "disabled"}, path=${candleCacheDirectoryPath}.`);
            }
            console.log(`[ManualWatchlistRuntime] IBKR historical timeout: ${Number.isFinite(manualWatchlistIbkrTimeoutMs) && manualWatchlistIbkrTimeoutMs > 0 ? manualWatchlistIbkrTimeoutMs : DEFAULT_MANUAL_WATCHLIST_IBKR_TIMEOUT_MS}ms.`);
            console.log(`[ManualWatchlistRuntime] Level seed timeout: ${manualWatchlistLevelSeedTimeoutMs}ms.`);
            console.log(`[ManualWatchlistRuntime] Fast level-clear coalesce window: ${manualWatchlistFastLevelClearCoalesceMs}ms.`);
            console.log(`[ManualWatchlistRuntime] Historical lookbacks: daily=${historicalLookbackBars.daily}, 4h=${historicalLookbackBars["4h"]}, 5m=${historicalLookbackBars["5m"]}.`);
            console.log(`[ManualWatchlistRuntime] Posting profile: ${postingProfile}.`);
            console.log(`[ManualWatchlistRuntime] Market structure standalone posts: ${marketStructureStandalonePostMode}.`);
            if (marketStructureLifecyclePath) {
                console.log(`[ManualWatchlistRuntime] Market structure lifecycle log: ${marketStructureLifecyclePath}.`);
            }
            if (monitoringEventDiagnosticsEnabled) {
                console.log(`[ManualWatchlistRuntime] Monitoring event diagnostics enabled via ${MONITORING_EVENT_DIAGNOSTICS_ENV}.`);
            }
            if (aiCommentaryEnabled) {
                console.log(`[ManualWatchlistRuntime] AI commentary ${aiCommentaryService ? "enabled" : "requested but OPENAI_API_KEY is missing"}.`);
            }
            console.log(`[ManualWatchlistRuntime] Finnhub stock context ${finnhubClient ? "enabled" : "disabled (FINNHUB_API_KEY missing)"}.`);
            console.log(`[ManualWatchlistRuntime] Yahoo stock context ${yahooClient ? "enabled" : "disabled (YAHOO_STOCK_CONTEXT_ENABLED=false)"}.`);
            await manager.start();
            console.log("[ManualWatchlistRuntime] Runtime startup complete.");
        }
        catch (error) {
            startupState = "error";
            startupError = error instanceof Error ? error.message : String(error);
            console.error(`[ManualWatchlistRuntime] Startup failed: ${startupError}`);
        }
    };
    const server = createServer(async (request, response) => {
        const url = new URL(request.url ?? "/", `http://${LOCAL_BIND_HOST}`);
        if (request.method === "GET" && url.pathname === "/") {
            response.statusCode = 200;
            response.setHeader("Content-Type", "text/html; charset=utf-8");
            response.end(MANUAL_WATCHLIST_PAGE);
            return;
        }
        if (request.method === "GET" && url.pathname === "/api/watchlist") {
            sendJson(response, 200, {
                activeEntries: manager.getActiveEntries(),
                startupState,
                startupError,
            });
            return;
        }
        if (request.method === "GET" && url.pathname === "/api/runtime/status") {
            const runtimeHealth = manager.getRuntimeHealth();
            sendJson(response, 200, {
                providerName: candleService.getProviderName(),
                diagnosticsEnabled: monitoringEventDiagnosticsEnabled,
                aiCommentaryEnabled: aiCommentaryService !== null,
                runtimeConfig: {
                    bindHost: LOCAL_BIND_HOST,
                    port: PORT,
                    historicalProvider: candleService.getProviderName(),
                    liveProvider: "ibkr",
                    ibkrHistoricalTimeoutMs: Number.isFinite(manualWatchlistIbkrTimeoutMs) && manualWatchlistIbkrTimeoutMs > 0
                        ? manualWatchlistIbkrTimeoutMs
                        : DEFAULT_MANUAL_WATCHLIST_IBKR_TIMEOUT_MS,
                    levelSeedTimeoutMs: manualWatchlistLevelSeedTimeoutMs,
                    fastLevelClearCoalesceMs: manualWatchlistFastLevelClearCoalesceMs,
                    candleCacheMode: requestedCandleCacheMode,
                    runtimeCandleCacheMode,
                    candleCacheDirectoryPath,
                    startupCandleCacheEnabled,
                    historicalLookbackBars: manager.getHistoricalLookbackBars(),
                    postingProfile,
                    marketStructureStandalonePostMode,
                    marketStructureLifecyclePath,
                    marketStructureStoryMemoryPath,
                    monitoringDiagnosticsRequested: monitoringEventDiagnosticsEnabled,
                    aiCommentaryRequested: aiCommentaryEnabled,
                    aiCommentaryServiceAvailable: aiCommentaryService !== null,
                    aiCommentaryModel,
                    openAiApiKeyPresent,
                    aiCommentaryRoute: "symbol recaps and live alert AI reads",
                },
                activeSymbolCount: manager.getActiveEntries().length,
                ibkrConnected: isIbkrConnected(ib),
                ibkrReconnecting: isIbkrReconnecting(ib),
                runtimeHealth,
                recentActivity: manager.getRecentActivity(),
                sessionDirectory,
                startupState,
                startupError,
            });
            return;
        }
        if (request.method === "GET" && url.pathname === "/api/runtime/review-artifacts") {
            sendJson(response, 200, {
                sessionDirectory,
                artifacts: readReviewArtifacts(sessionDirectory),
            });
            return;
        }
        if (request.method === "POST" && url.pathname === "/api/discord/clear-watchlist-channel") {
            try {
                const body = await readJsonBody(request);
                const confirmation = typeof body.confirmation === "string" ? body.confirmation : "";
                if (confirmation !== "DELETE_DISCORD_WATCHLIST") {
                    sendJson(response, 400, {
                        error: "Confirmation is required to clear Discord watchlist posts.",
                    });
                    return;
                }
                const localReset = await manager.resetDiscordThreadState();
                const discordCleanup = await clearDiscordWatchlistChannel();
                sendJson(response, 200, {
                    ok: true,
                    localReset,
                    discordCleanup,
                });
            }
            catch (error) {
                if (error instanceof RequestBodyParseError) {
                    sendJson(response, error.statusCode, { error: error.message });
                    return;
                }
                const message = error instanceof Error ? error.message : String(error);
                console.error(`[ManualWatchlistRuntime] Discord channel cleanup failed: ${message}`);
                sendJson(response, 500, { error: message });
            }
            return;
        }
        if (request.method === "POST" && url.pathname === "/api/watchlist/activate") {
            if (startupState !== "ready") {
                sendJson(response, 503, {
                    error: startupState === "error"
                        ? `Runtime startup failed: ${startupError ?? "unknown error"}`
                        : "Runtime is still starting. Try again when startup completes.",
                });
                return;
            }
            try {
                const body = await readJsonBody(request);
                const symbol = typeof body.symbol === "string" ? body.symbol : "";
                const note = typeof body.note === "string" ? body.note : undefined;
                if (symbol.trim().length === 0) {
                    sendJson(response, 400, { error: "Symbol is required." });
                    return;
                }
                const entry = await manager.queueActivation({ symbol, note });
                sendJson(response, 202, { entry, queued: true });
            }
            catch (error) {
                if (error instanceof RequestBodyParseError) {
                    sendJson(response, error.statusCode, { error: error.message });
                    return;
                }
                const message = error instanceof Error ? error.message : String(error);
                console.error(`[ManualWatchlistRuntime] Activation failed: ${message}`);
                sendJson(response, 500, { error: message });
            }
            return;
        }
        if (request.method === "POST" && url.pathname === "/api/watchlist/deactivate") {
            try {
                const body = await readJsonBody(request);
                const symbol = typeof body.symbol === "string" ? body.symbol : "";
                if (symbol.trim().length === 0) {
                    sendJson(response, 400, { error: "Symbol is required." });
                    return;
                }
                const entry = await manager.deactivateSymbol(symbol);
                if (!entry) {
                    sendJson(response, 404, { error: "Symbol was not found." });
                    return;
                }
                sendJson(response, 200, { entry });
            }
            catch (error) {
                if (error instanceof RequestBodyParseError) {
                    sendJson(response, error.statusCode, { error: error.message });
                    return;
                }
                const message = error instanceof Error ? error.message : String(error);
                sendJson(response, 500, { error: message });
            }
            return;
        }
        if (request.method === "POST" && url.pathname === "/api/watchlist/refresh-levels") {
            try {
                const body = await readJsonBody(request);
                const symbol = typeof body.symbol === "string" ? body.symbol : "";
                if (symbol.trim().length === 0) {
                    sendJson(response, 400, { error: "Symbol is required." });
                    return;
                }
                const entry = await manager.refreshSymbolLevels(symbol);
                sendJson(response, 200, { entry });
            }
            catch (error) {
                if (error instanceof RequestBodyParseError) {
                    sendJson(response, error.statusCode, { error: error.message });
                    return;
                }
                const message = error instanceof Error ? error.message : String(error);
                sendJson(response, 500, { error: message });
            }
            return;
        }
        if (request.method === "POST" && url.pathname === "/api/watchlist/repost-snapshot") {
            try {
                const body = await readJsonBody(request);
                const symbol = typeof body.symbol === "string" ? body.symbol : "";
                if (symbol.trim().length === 0) {
                    sendJson(response, 400, { error: "Symbol is required." });
                    return;
                }
                const entry = await manager.repostLevelSnapshot(symbol);
                sendJson(response, 200, { entry });
            }
            catch (error) {
                if (error instanceof RequestBodyParseError) {
                    sendJson(response, error.statusCode, { error: error.message });
                    return;
                }
                const message = error instanceof Error ? error.message : String(error);
                sendJson(response, 500, { error: message });
            }
            return;
        }
        sendJson(response, 404, { error: "Not found." });
    });
    let shuttingDown = false;
    const shutdown = async (signal) => {
        if (shuttingDown) {
            return;
        }
        shuttingDown = true;
        if (signal) {
            console.log(`Received ${signal}. Shutting down manual watchlist server...`);
        }
        server.close();
        await manager.stop();
        ib.disconnect();
    };
    process.once("SIGINT", () => {
        void shutdown("SIGINT").finally(() => process.exit(0));
    });
    process.once("SIGTERM", () => {
        void shutdown("SIGTERM").finally(() => process.exit(0));
    });
    server.listen(PORT, LOCAL_BIND_HOST, () => {
        console.log(`Manual watchlist server running at http://127.0.0.1:${PORT}`);
    });
    void bootRuntime();
}
main().catch((error) => {
    const message = error instanceof Error ? error.stack ?? error.message : String(error);
    console.error(message);
    process.exit(1);
});
