import type { MonitoringEvent } from "./monitoring-types.js";
export type OpportunityClassification = "high_conviction" | "medium" | "low";
export type RankedOpportunity = {
    symbol: string;
    type: string;
    eventType?: string;
    level: number;
    strength: number;
    confidence: number;
    priority: number;
    bias: string;
    pressureScore: number;
    structureType: string | null;
    structureStrength: number;
    timestamp: number;
    score: number;
    normalizedScore: number;
    classification: OpportunityClassification;
};
export declare class OpportunityEngine {
    private readonly debug;
    constructor(debug?: boolean);
    rank(events: MonitoringEvent[]): RankedOpportunity[];
    selectTop<T extends RankedOpportunity>(opportunities: T[], limit: number): T[];
}
//# sourceMappingURL=opportunity-engine.d.ts.map