import type { AlertIntelligenceConfig } from "./alert-config.js";
import { alertPostingFamilyForEvent } from "./alert-deduplication.js";
import type { AlertPostingDecision, IntelligentAlert } from "./alert-types.js";
type PostedAlertRecord = {
    alert: IntelligentAlert;
    family: ReturnType<typeof alertPostingFamilyForEvent>;
    scopeKey: string;
    stateKey: string;
    timestamp: number;
};
export declare function prunePostedAlertHistory(history: PostedAlertRecord[], referenceTimestamp: number, config: AlertIntelligenceConfig): PostedAlertRecord[];
export declare function evaluateAlertPostingPolicy(params: {
    alert: IntelligentAlert;
    history: PostedAlertRecord[];
    config: AlertIntelligenceConfig;
}): AlertPostingDecision;
export declare function appendPostedAlertHistory(params: {
    alert: IntelligentAlert;
    history: PostedAlertRecord[];
    config: AlertIntelligenceConfig;
}): PostedAlertRecord[];
export {};
//# sourceMappingURL=posting-policy.d.ts.map