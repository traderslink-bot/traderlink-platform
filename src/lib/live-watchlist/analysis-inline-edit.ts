/** Only owner-editable fields cross the save boundary. Source evidence stays server-owned. */
export const analysisEditSections = {
  currentRead: "Analysis", needsToHold: "Needs to hold", cautionBelow: "Caution below",
  momentumFailure: "Momentum failure", mustClear: "Must clear", breakoutContinuation: "Breakout continuation",
  targets: "Where the trade could go next", shallow: "Pullback", deep: "Deeper pullback",
  downsideCheckpoints: "Downside levels", failureRecovery: "Failure and recovery",
  catalystRealityCheck: "Catalyst / recent news", dilutionRisk: "Dilution risk",
  listingStatus: "Listing monitor", riskSummary: "Risk notes",
} as const;
export type AnalysisEditSection = keyof typeof analysisEditSections;
export type EditValue = string | number | boolean | null | EditValue[] | { [key: string]: EditValue };
export type EditRecord = { [key: string]: EditValue };
export const levelEditFields = ["label", "price", "rationale"];
export const pullbackEditFields = ["zoneLow", "zoneHigh", "confirmationPrice", "confirmation", "invalidationPrice", "firstObjectivePrice", "rationale"];
export const recoveryEditFields = ["recoveryZoneLow", "recoveryZoneHigh", "firstReclaimPrice", "setupRestorePrice", "firstObjectivePrice", "rationale"];
export const isPriceField = (key: string) => key === "price" || /Price$|Low$|High$/.test(key);
export function editRecord(value: unknown): EditRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as EditRecord : {};
}
function pick(value: unknown, fields: string[]): EditRecord {
  const source = editRecord(value);
  return Object.fromEntries(fields.map(key => [key, source[key] ?? (isPriceField(key) ? null : "")]));
}
export function makeAnalysisEdit(payload: Record<string, unknown>): EditRecord {
  const result: EditRecord = {};
  for (const key of ["currentRead", "bias", "confidence", "riskSummary", "ownerHiddenSections"]) {
    result[key] = structuredClone(payload[key] as EditValue ?? (key === "riskSummary" || key === "ownerHiddenSections" ? [] : ""));
  }
  for (const key of ["needsToHold", "cautionBelow", "momentumFailure", "mustClear", "breakoutContinuation"]) result[key] = pick(payload[key], levelEditFields);
  for (const key of ["targets", "downsideCheckpoints"]) result[key] = (Array.isArray(payload[key]) ? payload[key] : []).map(item => pick(item, ["label", "price", "condition"]));
  const plans = editRecord(payload.pullbackPlans);
  result.pullbackPlans = Object.fromEntries(["shallow", "deep"].map(key => [key, plans[key] ? pick(plans[key], pullbackEditFields) : null]));
  result.failureRecovery = payload.failureRecovery ? pick(payload.failureRecovery, recoveryEditFields) : null;
  for (const key of ["catalystRealityCheck", "dilutionRisk", "listingStatus"]) result[key] = pick(payload[key], ["summary", "dayTradeRelevance"]);
  return result;
}
export function mergeAnalysisEdit(original: Record<string, unknown>, patch: EditRecord): Record<string, unknown> {
  const result = structuredClone(original);
  for (const [key, value] of Object.entries(patch)) {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) result[key] = mergeAnalysisEdit(editRecord(original[key]), value);
    else result[key] = structuredClone(value);
    // Match the owner-save projection: edited scenarios are owner decisions,
    // not claims that the generated packet evidenced the owner's new prices.
    if (key === "pullbackPlans") for (const name of ["shallow", "deep"]) {
      const plans = editRecord(result[key]);
      if (plans[name]) plans[name] = { ...editRecord(plans[name]), evidenceIds: [] };
    }
    if (key === "failureRecovery" && result[key]) result[key] = { ...editRecord(result[key]), evidenceIds: [] };
  }
  return result;
}

export function readInlineAnalysisMessage(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const message = value as Record<string, unknown>;
  return message.source === "traderslink-watchlist-admin" && message.type === "edit-analysis" &&
    typeof message.symbol === "string" && /^[A-Z0-9][A-Z0-9.\-]{0,19}$/.test(message.symbol) ? message.symbol : null;
}
