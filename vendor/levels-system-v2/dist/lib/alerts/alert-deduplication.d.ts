import type { MonitoringEvent } from "../monitoring/monitoring-types.js";
import type { AlertPostingFamily, IntelligentAlert } from "./alert-types.js";
export declare function alertPostingFamilyForEvent(event: MonitoringEvent): AlertPostingFamily;
export declare function alertPostingFamilyPriority(family: AlertPostingFamily): number;
export declare function buildAlertScopeKey(alert: IntelligentAlert): string;
export declare function buildAlertStateKey(alert: IntelligentAlert, family: AlertPostingFamily): string;
export declare function isMateriallyNewAlertState(current: IntelligentAlert, previous: IntelligentAlert): boolean;
//# sourceMappingURL=alert-deduplication.d.ts.map