// 2026-04-16 02:03 PM America/Toronto
// Phase 3 alert intelligence engine that enriches, scores, filters, formats, and applies delivery policy.
import { DEFAULT_ALERT_INTELLIGENCE_CONFIG } from "./alert-config.js";
import { shouldSuppressAlert } from "./alert-filter.js";
import { formatIntelligentAlert } from "./alert-formatter.js";
import { appendPostedAlertHistory, evaluateAlertPostingPolicy, prunePostedAlertHistory, } from "./posting-policy.js";
import { scoreMonitoringEventToAlert } from "./alert-scorer.js";
function allZones(output) {
    return [
        ...output.majorSupport,
        ...output.majorResistance,
        ...output.intermediateSupport,
        ...output.intermediateResistance,
        ...output.intradaySupport,
        ...output.intradayResistance,
        ...output.extensionLevels.support,
        ...output.extensionLevels.resistance,
    ];
}
export class AlertIntelligenceEngine {
    config;
    postedAlertHistory = [];
    constructor(config = DEFAULT_ALERT_INTELLIGENCE_CONFIG) {
        this.config = config;
    }
    findZoneForEvent(event, levels) {
        if (!levels) {
            return undefined;
        }
        const canonicalZoneId = event.eventContext.canonicalZoneId;
        return allZones(levels).find((zone) => zone.id === canonicalZoneId || zone.id === event.zoneId);
    }
    processEvent(event, levels) {
        const zone = this.findZoneForEvent(event, levels);
        const rawAlert = scoreMonitoringEventToAlert({
            event,
            zone,
            config: this.config,
        });
        this.postedAlertHistory = prunePostedAlertHistory(this.postedAlertHistory, event.timestamp, this.config);
        if (shouldSuppressAlert(rawAlert)) {
            return {
                rawAlert,
                formatted: null,
                delivery: {
                    shouldPost: false,
                    reason: "filtered",
                },
            };
        }
        const delivery = evaluateAlertPostingPolicy({
            alert: rawAlert,
            history: this.postedAlertHistory,
            config: this.config,
        });
        if (!delivery.shouldPost) {
            return {
                rawAlert,
                formatted: null,
                delivery,
            };
        }
        this.postedAlertHistory = appendPostedAlertHistory({
            alert: rawAlert,
            history: this.postedAlertHistory,
            config: this.config,
        });
        return {
            rawAlert,
            formatted: formatIntelligentAlert(rawAlert),
            delivery,
        };
    }
}
