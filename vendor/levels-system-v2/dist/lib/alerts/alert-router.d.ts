import type { MonitoringEvent } from "../monitoring/monitoring-types.js";
import type { AlertPayload, DiscordThread, LevelExtensionPayload, LevelSnapshotPayload, DiscordThreadRoutingResult, IntelligentAlert } from "./alert-types.js";
export declare function formatMonitoringEventAsAlert(event: MonitoringEvent): AlertPayload;
export declare function formatIntelligentAlertAsPayload(alert: IntelligentAlert): AlertPayload;
export interface DiscordThreadGateway {
    getThreadById(threadId: string): Promise<DiscordThread | null>;
    findThreadByName(name: string): Promise<DiscordThread | null>;
    createThread(name: string): Promise<DiscordThread>;
    sendMessage(threadId: string, payload: AlertPayload): Promise<void>;
    sendLevelSnapshot(threadId: string, payload: LevelSnapshotPayload): Promise<void>;
    sendLevelExtension(threadId: string, payload: LevelExtensionPayload): Promise<void>;
}
export declare function formatLevelSnapshotMessage(payload: LevelSnapshotPayload): string;
export declare function formatLevelExtensionMessage(payload: LevelExtensionPayload): string;
export declare class DiscordAlertRouter {
    private readonly gateway;
    constructor(gateway: DiscordThreadGateway);
    ensureThread(symbol: string, storedThreadId?: string | null): Promise<DiscordThreadRoutingResult>;
    routeAlert(threadId: string, payload: AlertPayload): Promise<void>;
    routeLevelSnapshot(threadId: string, payload: LevelSnapshotPayload): Promise<void>;
    routeLevelExtension(threadId: string, payload: LevelExtensionPayload): Promise<void>;
}
//# sourceMappingURL=alert-router.d.ts.map