import { assertLevelCandidateInventoryVisibilityFactsOnly, summarizeLevelCandidateInventoryGaps, validateLevelCandidateInventoryVisibility, } from "./level-candidate-inventory-visibility.js";
const REQUIRED_MISSING_LIMITATION = "raw_clustered_scored_inventory_not_available";
const REQUIRED_MISSING_DIAGNOSTIC = "candidate_inventory_visibility_not_available";
const FACTUAL_ONLY_BLOCKED_PATTERNS = [
    ["buy", /\bbuy\b/i],
    ["sell", /\bsell\b/i],
    ["hold", /\bhold\b/i],
    ["recommendation", /\brecommendation\b/i],
    ["trade advice", /\btrade\s+advice\b/i],
    ["grade", /\bgrade\b|\bgrading\b/i],
    ["coaching", /\bcoaching\b|\bcoach\b/i],
    ["p/l", /\bp\/l\b|\bpnl\b/i],
    ["giveback", /\bgiveback\b/i],
    ["behavior score", /\bbehavior score\b|\bbehavior scoring\b/i],
    ["good trade", /\bgood trade\b/i],
    ["bad trade", /\bbad trade\b/i],
    ["should have", /\bshould have\b/i],
    ["mistake", /\bmistake\b/i],
    ["discipline", /\bdiscipline\b/i],
];
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isStringArray(value) {
    return Array.isArray(value) && value.every((item) => typeof item === "string");
}
function sameJson(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}
function validatePresentWrapper(errors, value) {
    const visibilityValidation = validateLevelCandidateInventoryVisibility(value.visibility);
    if (!visibilityValidation.valid) {
        errors.push(`visibility is invalid: ${visibilityValidation.errors.join("; ")}`);
        return;
    }
    if (!isRecord(value.gapSummary)) {
        errors.push("gapSummary must be an object when present is true");
        return;
    }
    const expected = summarizeLevelCandidateInventoryGaps(value.visibility);
    if (!sameJson(value.gapSummary, expected)) {
        errors.push("gapSummary must match visibility gap classification");
    }
}
function validateMissingWrapper(errors, value) {
    if (!isStringArray(value.limitations)) {
        errors.push("limitations must be an array of strings when present is false");
    }
    else if (!value.limitations.includes(REQUIRED_MISSING_LIMITATION)) {
        errors.push(`limitations must include ${REQUIRED_MISSING_LIMITATION}`);
    }
    if (!isStringArray(value.diagnostics)) {
        errors.push("diagnostics must be an array of strings when present is false");
    }
    else if (!value.diagnostics.includes(REQUIRED_MISSING_DIAGNOSTIC)) {
        errors.push(`diagnostics must include ${REQUIRED_MISSING_DIAGNOSTIC}`);
    }
    if (value.visibility !== undefined) {
        errors.push("visibility must be omitted when present is false");
    }
    if (value.gapSummary !== undefined) {
        errors.push("gapSummary must be omitted when present is false");
    }
}
export function validateLevelCandidateInventoryReviewVisibilityWrapper(value) {
    const errors = [];
    if (!isRecord(value)) {
        return {
            valid: false,
            errors: ["wrapper must be an object"],
        };
    }
    if (value.present === true) {
        validatePresentWrapper(errors, value);
    }
    else if (value.present === false) {
        validateMissingWrapper(errors, value);
    }
    else {
        errors.push("present must be a boolean");
    }
    return {
        valid: errors.length === 0,
        errors,
    };
}
export function isLevelCandidateInventoryReviewVisibilityWrapper(value) {
    return validateLevelCandidateInventoryReviewVisibilityWrapper(value).valid;
}
export function assertLevelCandidateInventoryReviewVisibilityFactsOnly(value) {
    const validation = validateLevelCandidateInventoryReviewVisibilityWrapper(value);
    if (!validation.valid) {
        throw new Error(`Invalid candidate inventory review visibility wrapper: ${validation.errors.join("; ")}`);
    }
    if (isRecord(value) && value.present === true) {
        assertLevelCandidateInventoryVisibilityFactsOnly(value.visibility);
    }
    const text = JSON.stringify(value);
    const hits = FACTUAL_ONLY_BLOCKED_PATTERNS
        .filter(([, pattern]) => pattern.test(text))
        .map(([label]) => label);
    if (hits.length > 0) {
        throw new Error(`Candidate inventory review visibility wrapper contains non-factual wording: ${hits.join(", ")}`);
    }
}
