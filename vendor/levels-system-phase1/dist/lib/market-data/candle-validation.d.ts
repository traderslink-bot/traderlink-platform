import type { BaseCandleProviderResponse, CandleFetchCompletenessStatus, CandleValidationIssue } from "./candle-types.js";
export declare function validateCandleResponse(response: BaseCandleProviderResponse): {
    validationIssues: CandleValidationIssue[];
    completenessStatus: CandleFetchCompletenessStatus;
    stale: boolean;
};
//# sourceMappingURL=candle-validation.d.ts.map