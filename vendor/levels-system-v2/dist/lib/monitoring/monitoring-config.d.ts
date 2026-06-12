export type MonitoringConfig = {
    nearZonePct: number;
    nearestZonesToEvaluate: number;
    breakoutConfirmPct: number;
    maxConfirmDistancePct: number;
    failureReturnPct: number;
    compressionMaxDistancePct: number;
    compressionMinUpdates: number;
    fakeoutWindowMs: number;
    eventCooldownMs: number;
    maxEventsPerSymbolPerUpdate: number;
};
export declare const DEFAULT_MONITORING_CONFIG: MonitoringConfig;
//# sourceMappingURL=monitoring-config.d.ts.map