import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { CandleFetchService, StubHistoricalCandleProvider, } from "../market-data/candle-fetch-service.js";
const CACHE_SCHEMA_VERSION = 1;
function timeframeMs(timeframe) {
    if (timeframe === "daily") {
        return 24 * 60 * 60 * 1000;
    }
    if (timeframe === "4h") {
        return 4 * 60 * 60 * 1000;
    }
    return 5 * 60 * 1000;
}
function normalizeEndTimeMs(request) {
    const raw = request.endTimeMs ?? Date.now();
    const interval = timeframeMs(request.timeframe);
    return Math.floor(raw / interval) * interval;
}
function cachePathForRequest(cacheDirectoryPath, request, provider) {
    const symbol = request.symbol.trim().toUpperCase();
    const timeframe = request.timeframe;
    const lookbackBars = request.lookbackBars;
    const endTimeMs = normalizeEndTimeMs(request);
    return join(cacheDirectoryPath, provider, symbol, timeframe, `${lookbackBars}-${endTimeMs}.json`);
}
async function readCacheEntry(path) {
    try {
        const raw = await readFile(path, "utf8");
        const parsed = JSON.parse(raw);
        if (parsed.schemaVersion !== CACHE_SCHEMA_VERSION) {
            return null;
        }
        return parsed;
    }
    catch (error) {
        if (error.code === "ENOENT") {
            return null;
        }
        return null;
    }
}
async function findNearestReusableCachePath(cacheDirectoryPath, request, provider, mode) {
    const directoryPath = join(cacheDirectoryPath, provider, request.symbol.trim().toUpperCase(), request.timeframe);
    const requestedEndTimeMs = normalizeEndTimeMs(request);
    const maxFallbackGapMs = mode === "replay" ? Number.POSITIVE_INFINITY : timeframeMs(request.timeframe);
    try {
        const filenames = await readdir(directoryPath);
        let bestCandidate = null;
        for (const filename of filenames) {
            if (!filename.endsWith(".json")) {
                continue;
            }
            const separatorIndex = filename.indexOf("-");
            if (separatorIndex <= 0) {
                continue;
            }
            const lookbackRaw = filename.slice(0, separatorIndex);
            const endTimeRaw = filename.slice(separatorIndex + 1, -".json".length);
            const candidateLookbackBars = Number(lookbackRaw);
            const candidateEndTimeMs = Number(endTimeRaw);
            if (!Number.isFinite(candidateLookbackBars) || !Number.isFinite(candidateEndTimeMs)) {
                continue;
            }
            if (candidateLookbackBars < request.lookbackBars) {
                continue;
            }
            const gapMs = requestedEndTimeMs - candidateEndTimeMs;
            if (gapMs < 0 || gapMs > maxFallbackGapMs) {
                continue;
            }
            if (bestCandidate === null ||
                candidateEndTimeMs > bestCandidate.endTimeMs ||
                (candidateEndTimeMs === bestCandidate.endTimeMs &&
                    candidateLookbackBars < bestCandidate.lookbackBars)) {
                bestCandidate = {
                    endTimeMs: candidateEndTimeMs,
                    lookbackBars: candidateLookbackBars,
                };
            }
        }
        if (bestCandidate === null) {
            return null;
        }
        return join(directoryPath, `${bestCandidate.lookbackBars}-${bestCandidate.endTimeMs}.json`);
    }
    catch (error) {
        if (error.code === "ENOENT") {
            return null;
        }
        return null;
    }
}
function withRequestMetadata(response, request) {
    const requestedEndTimestamp = normalizeEndTimeMs(request);
    const requestedStartTimestamp = requestedEndTimestamp - request.lookbackBars * timeframeMs(request.timeframe);
    return {
        ...response,
        requestedLookbackBars: request.lookbackBars,
        requestedStartTimestamp,
        requestedEndTimestamp,
    };
}
async function writeCacheEntry(path, entry) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, `${JSON.stringify(entry, null, 2)}\n`, "utf8");
}
export function resolveValidationCandleCacheMode(rawValue) {
    const normalized = rawValue?.trim().toLowerCase();
    if (normalized === "off" ||
        normalized === "read_write" ||
        normalized === "refresh" ||
        normalized === "replay") {
        return normalized;
    }
    return "read_write";
}
export class ValidationCachedCandleFetchService extends CandleFetchService {
    delegate;
    mode;
    constructor(delegate, options) {
        super(new StubHistoricalCandleProvider());
        this.delegate = delegate;
        this.mode = options.mode ?? "read_write";
        this.cacheDirectoryPath = options.cacheDirectoryPath;
    }
    cacheDirectoryPath;
    getProviderName() {
        return this.delegate.getProviderName();
    }
    async fetchCandles(request) {
        if (this.mode === "off") {
            return this.delegate.fetchCandles(request);
        }
        const provider = request.preferredProvider ?? this.delegate.getProviderName();
        const cachePath = cachePathForRequest(this.cacheDirectoryPath, request, provider);
        if (this.mode !== "refresh") {
            const cached = await readCacheEntry(cachePath);
            if (cached) {
                return withRequestMetadata(cached.response, request);
            }
            const nearbyCachePath = await findNearestReusableCachePath(this.cacheDirectoryPath, request, provider, this.mode);
            if (nearbyCachePath) {
                const nearbyCached = await readCacheEntry(nearbyCachePath);
                if (nearbyCached) {
                    return withRequestMetadata(nearbyCached.response, request);
                }
            }
            if (this.mode === "replay") {
                throw new Error(`Validation candle cache miss for ${request.symbol.toUpperCase()} ${request.timeframe} (${request.lookbackBars}) at ${normalizeEndTimeMs(request)}.`);
            }
        }
        const response = withRequestMetadata(await this.delegate.fetchCandles(request), request);
        const cacheEntry = {
            schemaVersion: CACHE_SCHEMA_VERSION,
            cachedAt: Date.now(),
            request: {
                symbol: request.symbol.trim().toUpperCase(),
                timeframe: request.timeframe,
                lookbackBars: request.lookbackBars,
                endTimeMs: normalizeEndTimeMs(request),
                provider,
            },
            response,
        };
        await writeCacheEntry(cachePath, cacheEntry);
        return response;
    }
}
