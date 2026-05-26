import type { IntelligentAlert } from "./alert-types.js";
export declare function formatIntelligentAlert(alert: IntelligentAlert): {
    title: string;
    body: string;
    meta: {
        severity: string;
        confidence: string;
        score: number;
        tags: string[];
        context: string[];
    };
};
//# sourceMappingURL=alert-formatter.d.ts.map