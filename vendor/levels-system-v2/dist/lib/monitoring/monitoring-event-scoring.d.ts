import type { FinalLevelZone } from "../levels/level-types.js";
import type { MonitoringConfig } from "./monitoring-config.js";
import type { LivePriceUpdate, MonitoringAlertType, MonitoringEventType, SymbolMonitoringState, ZoneInteractionState } from "./monitoring-types.js";
export declare function buildInteractionEpisodeId(symbol: string, zone: FinalLevelZone, currentState: ZoneInteractionState, update: LivePriceUpdate): string;
export declare function shouldFilterMonitoringEvent(params: {
    eventType: MonitoringEventType;
    currentState: ZoneInteractionState;
    update: LivePriceUpdate;
    previousPrice?: number;
    config: MonitoringConfig;
    zone: FinalLevelZone;
    symbolState: SymbolMonitoringState;
}): boolean;
export declare function scoreMonitoringEvent(params: {
    eventType: MonitoringEventType;
    zone: FinalLevelZone;
    update: LivePriceUpdate;
    previousPrice?: number;
    currentState: ZoneInteractionState;
    symbolState: SymbolMonitoringState;
    config: MonitoringConfig;
}): {
    type: MonitoringAlertType;
    level: number;
    strength: number;
    confidence: number;
    priority: number;
    bias: SymbolMonitoringState["bias"];
    pressureScore: number;
};
//# sourceMappingURL=monitoring-event-scoring.d.ts.map