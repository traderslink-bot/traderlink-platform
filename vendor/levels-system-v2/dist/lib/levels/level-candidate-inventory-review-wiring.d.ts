import { type LevelCandidateInventoryGapSummary, type LevelCandidateInventoryVisibility } from "./level-candidate-inventory-visibility.js";
export type LevelCandidateInventoryReviewGapSummary = LevelCandidateInventoryGapSummary;
export type LevelCandidateInventoryReviewPresentWrapper = {
    present: true;
    visibility: LevelCandidateInventoryVisibility;
    gapSummary: LevelCandidateInventoryReviewGapSummary;
};
export type LevelCandidateInventoryReviewMissingWrapper = {
    present: false;
    limitations: string[];
    diagnostics: string[];
};
export type LevelCandidateInventoryReviewVisibilityWrapper = LevelCandidateInventoryReviewPresentWrapper | LevelCandidateInventoryReviewMissingWrapper;
export type LevelCandidateInventoryReviewVisibilityWrapperValidationResult = {
    valid: boolean;
    errors: string[];
};
export declare function validateLevelCandidateInventoryReviewVisibilityWrapper(value: unknown): LevelCandidateInventoryReviewVisibilityWrapperValidationResult;
export declare function isLevelCandidateInventoryReviewVisibilityWrapper(value: unknown): value is LevelCandidateInventoryReviewVisibilityWrapper;
export declare function assertLevelCandidateInventoryReviewVisibilityFactsOnly(value: unknown): asserts value is LevelCandidateInventoryReviewVisibilityWrapper;
//# sourceMappingURL=level-candidate-inventory-review-wiring.d.ts.map