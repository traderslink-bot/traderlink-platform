// 2026-04-14 09:28 PM America/Toronto
// Alert formatting plus deterministic Discord thread routing.
export function formatMonitoringEventAsAlert(event) {
    return {
        title: `${event.symbol} ${event.eventType.replaceAll("_", " ")}`,
        body: `${event.zoneKind} zone ${event.eventContext.canonicalZoneId} at ${event.triggerPrice}`,
        event,
    };
}
export function formatIntelligentAlertAsPayload(alert) {
    return {
        title: alert.title,
        body: alert.body,
        event: alert.event,
    };
}
function normalizeSymbol(symbol) {
    return symbol.trim().toUpperCase();
}
function formatLevel(level) {
    return level >= 1 ? level.toFixed(2) : level.toFixed(4);
}
function formatSnapshotDisplayZone(zone) {
    return formatLevel(zone.representativePrice);
}
export function formatLevelSnapshotMessage(payload) {
    const supportLine = payload.supportZones.length > 0
        ? payload.supportZones.map((zone) => formatSnapshotDisplayZone(zone)).join(", ")
        : "none";
    const resistanceLine = payload.resistanceZones.length > 0
        ? payload.resistanceZones.map((zone) => formatSnapshotDisplayZone(zone)).join(", ")
        : "none";
    return [
        `LEVEL SNAPSHOT: ${payload.symbol}`,
        `PRICE: ${formatLevel(payload.currentPrice)}`,
        `SUPPORT: ${supportLine}`,
        `RESISTANCE: ${resistanceLine}`,
    ].join("\n");
}
export function formatLevelExtensionMessage(payload) {
    const levelsLine = payload.levels.length > 0
        ? payload.levels.map((level) => formatLevel(level)).join(", ")
        : "none";
    return [
        `NEXT LEVELS: ${payload.symbol}`,
        `SIDE: ${payload.side.toUpperCase()}`,
        `LEVELS: ${levelsLine}`,
    ].join("\n");
}
export class DiscordAlertRouter {
    gateway;
    constructor(gateway) {
        this.gateway = gateway;
    }
    async ensureThread(symbol, storedThreadId) {
        const normalizedSymbol = normalizeSymbol(symbol);
        if (storedThreadId) {
            const existingThread = await this.gateway.getThreadById(storedThreadId);
            if (existingThread && existingThread.name === normalizedSymbol) {
                return {
                    threadId: existingThread.id,
                    reused: true,
                    recovered: false,
                    created: false,
                };
            }
            const recoveredThread = await this.gateway.findThreadByName(normalizedSymbol);
            if (recoveredThread) {
                return {
                    threadId: recoveredThread.id,
                    reused: false,
                    recovered: true,
                    created: false,
                };
            }
        }
        const createdThread = await this.gateway.createThread(normalizedSymbol);
        return {
            threadId: createdThread.id,
            reused: false,
            recovered: false,
            created: true,
        };
    }
    async routeAlert(threadId, payload) {
        await this.gateway.sendMessage(threadId, payload);
    }
    async routeLevelSnapshot(threadId, payload) {
        await this.gateway.sendLevelSnapshot(threadId, payload);
    }
    async routeLevelExtension(threadId, payload) {
        await this.gateway.sendLevelExtension(threadId, payload);
    }
}
