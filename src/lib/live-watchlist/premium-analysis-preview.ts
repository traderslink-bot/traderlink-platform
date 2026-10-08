import type { TradersLinkAiReadPayload } from "./live-watchlist-types";

/** Public preview contains display prose only, never the original analysis payload. */
export type PremiumAnalysisPreview = {
  sections: Array<{ title: string; lines: string[]; priceHidden: boolean }>;
};

export const HIDDEN_ANALYSIS_PRICE = "[price hidden]";

/** Conceal numeric prose as well as structured prices; percentages can reveal levels. */
export function concealAnalysisNumbers(text: string): string {
  return text
    .replace(/https?:\/\/\S+/giu, "")
    .replace(/(?:[$€£]\s*)?[-+]?\d[\d,.]*(?:\s*%|\s*(?:dollars?|cents?))?/giu, HIDDEN_ANALYSIS_PRICE);
}

export function buildPremiumAnalysisPreview(read: TradersLinkAiReadPayload): PremiumAnalysisPreview {
  const sections: PremiumAnalysisPreview["sections"] = [];
  const hidden = new Set(read.ownerHiddenSections ?? []);
  const add = (key: string, title: string, lines: (string | undefined)[], priceHidden = false) => {
    if (hidden.has(key)) return;
    const safe = lines.filter((line): line is string => typeof line === "string" && Boolean(line.trim()))
      .map(concealAnalysisNumbers);
    if (safe.length || priceHidden) sections.push({ title, lines: safe, priceHidden });
  };
  if (read.analysisFormat === "simple" && read.simpleAnalysis) {
    const simple = read.simpleAnalysis;
    add("currentRead", "", [simple.setup]);
    simple.pullbacks.forEach((zone, index) => add(index ? "deep" : "shallow", index ? "Deeper pullback" : "Pullback",
      [zone.explanation, zone.confirmation], true));
    simple.upside.forEach(level => add("targets", "Where it could go next", [level.explanation], true));
  } else {
    add("currentRead", "", [read.currentRead]);
    for (const [key, title] of [["needsToHold", "Structure Weakens"], ["cautionBelow", "Caution below"],
      ["momentumFailure", "Momentum failure"], ["mustClear", "Must clear"],
      ["breakoutContinuation", "Breakout continuation"]] as const) {
      const level = read[key];
      add(key, title, [level.rationale], level.price !== null);
    }
    read.targets.forEach(level => add("targets", "Where it could go next", [level.condition], level.price !== null));
    // Copy only descriptive strings from known display sections. Evidence IDs and
    // numeric fields never cross this boundary, including future unknown fields.
    if (read.version !== 2) {
      for (const key of ["shallow", "deep"] as const) {
        const zone = read.pullbackPlans[key];
        if (zone) add(key, key === "deep" ? "Deeper pullback" : "Pullback", [zone.rationale,
          "Required confirmation: " + HIDDEN_ANALYSIS_PRICE + " " + zone.confirmation], true);
      }
      if (read.failureRecovery) add("failureRecovery", "Recovery", [read.failureRecovery.rationale,
        "First reclaim: " + HIDDEN_ANALYSIS_PRICE, "Setup restored: " + HIDDEN_ANALYSIS_PRICE], true);
    }
    read.downsideCheckpoints?.forEach(level => add("downsideCheckpoints", "Downside levels", [level.condition], level.price !== null));
    add("catalystRealityCheck", "Catalyst / recent news", [read.catalystRealityCheck.summary, read.catalystRealityCheck.dayTradeRelevance]);
    add("riskSummary", "Risk", read.riskSummary);
  }
  return { sections };
}
