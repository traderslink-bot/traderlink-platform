import type { TradersLinkAiReadPayload } from "./live-watchlist-types";
import { analysisPullbacks } from "./owner-analysis-pullbacks";
import { sortPullbacksByPrice } from "./pullback-price-order";

/** Public preview contains display prose only, never the original analysis payload. */
export type PremiumAnalysisPreview = {
  simpleRead?: PremiumSimpleRead;
  sections: Array<{ title: string; lines: string[]; priceHidden: boolean }>;
};

export type PremiumSimpleRead = Pick<TradersLinkAiReadPayload, "symbol" | "generatedAt" | "dataAsOf" | "currentPrice" | "simpleAnalysis" | "ownerHiddenSections" | "catalystRealityCheck" | "riskSummary" | "sources">;

export const HIDDEN_ANALYSIS_PRICE = "[price hidden]";

const PRICE_AMOUNT = "(?:[$€£]\\s*)?\\d+(?:,\\d{3})*(?:\\.\\d+)?";
const PRICE_AREA = `${PRICE_AMOUNT}(?:\\s*(?:–|—|-|to|and|then)\\s*${PRICE_AMOUNT})*`;
const LABELED_PRICE = new RegExp(
  `(\\b(?:support|resistance|target|pullback|breakout|entry|reclaim|retest|stop(?:\\s+loss)?|buy\\s+zone|sell\\s+zone)s?` +
  `(?:\\s+\\d+\\s*(?:is|at|:|=))?(?:\\s+(?:price|level|area|zone))?` +
  `\\s*(?:(?:is|at|near|around)\\s+)?[:=]?\\s*)(${PRICE_AREA})(?![\\d\\w])`, "giu",
);
const CONTEXT_PRICE = new RegExp(`(\\b(?:above|below|at|near|toward|towards|through|reclaim|over|under)\\s+)(${PRICE_AREA})(?![\\d\\w])`, "giu");
const maskPriceArea = (_match: string, prefix: string, area: string) =>
  prefix + area.replace(new RegExp(PRICE_AMOUNT, "gu"), HIDDEN_ANALYSIS_PRICE);

/** Dates, times, percentages and candle lengths are context, not prices. */
export function concealAnalysisNumbers(text: string): string {
  const protectedParts: string[] = [];
  const protect = (value:string) => `\uE000${String.fromCharCode(0xE100 + protectedParts.push(value)-1)}\uE001`;
  return text.replace(/https?:\/\/\S+/giu, "")
    .replace(/\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2}(?:,?\s+\d{4})?|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}[/:]\d{1,2}(?:[/:]\d{2,4})?(?:\s*[ap]\.?m\.?)?|[-+]?\d+(?:\.\d+)?\s*%|\b\d+\s*(?:min(?:ute)?s?|hours?|days?|weeks?|months?|years?|[mh])\b/giu, protect)
    .replace(LABELED_PRICE, maskPriceArea)
    .replace(CONTEXT_PRICE, maskPriceArea)
    .replace(/[$€£]\s*\d[\d,.]*|\b\d+\.\d+\b|\b\d+(?:,\d{3})*(?:\s*(?:dollars?|cents?))\b/giu, HIDDEN_ANALYSIS_PRICE)
    .replace(/\uE000([\uE100-\uF8FF])\uE001/g, (_, key:string) => protectedParts[key.charCodeAt(0)-0xE100]);
}

export function buildPremiumSimpleRead(read: TradersLinkAiReadPayload): PremiumSimpleRead | undefined {
  if (read.analysisFormat !== "simple" || !read.simpleAnalysis) return undefined;
  const simple = read.simpleAnalysis;
  return {
    symbol: read.symbol, generatedAt: read.generatedAt, dataAsOf: read.dataAsOf, currentPrice: 0,
    ownerHiddenSections: read.ownerHiddenSections,
    simpleAnalysis: { setup: concealAnalysisNumbers(simple.setup),
      pullbacks: sortPullbacksByPrice(simple.pullbacks.map((zone,index)=>({...zone,hidden:zone.hidden ?? (read.ownerHiddenSections ?? []).includes(index===0?"shallow":index===1?"deep":"")}))).map(zone=>({low:0,high:0,hidden:zone.hidden,explanation:concealAnalysisNumbers(zone.explanation),confirmation:concealAnalysisNumbers(zone.confirmation),invalidation:null})),
      upside: simple.upside.map(level=>({low:0,high:0,explanation:concealAnalysisNumbers(level.explanation)})),
      breakout: simple.breakout ? {price:0,explanation:concealAnalysisNumbers(simple.breakout.explanation),confirmation:concealAnalysisNumbers(simple.breakout.confirmation)} : undefined,
      invalidation:null },
    catalystRealityCheck: {status:read.catalystRealityCheck.status,summary:read.catalystRealityCheck.summary,sourceUrls:read.catalystRealityCheck.sourceUrls,dayTradeRelevance:""},
    riskSummary: [...read.riskSummary],
    sources: read.sources.filter(source=>source.evidence?.excerptKind === "article_title").map(source=>({ ...source })),
  };
}

export function buildPremiumAnalysisPreview(read: TradersLinkAiReadPayload): PremiumAnalysisPreview {
  const sections: PremiumAnalysisPreview["sections"] = [];
  const hidden = new Set(read.ownerHiddenSections ?? []);
  const add = (key: string, title: string, lines: (string | undefined)[], priceHidden = false) => {
    if (hidden.has(key)) return;
    const safe = lines.filter((line): line is string => typeof line === "string" && Boolean(line.trim()))
      .map(line => key === "catalystRealityCheck" || key === "riskSummary" ? line : concealAnalysisNumbers(line));
    if (safe.length || priceHidden) sections.push({ title, lines: safe, priceHidden });
  };
  if (read.analysisFormat === "simple" && read.simpleAnalysis) {
    const simple = read.simpleAnalysis;
    add("currentRead", "", [simple.setup]);
    if (simple.breakout) add("breakoutContinuation", "Breakout", [simple.breakout.explanation, simple.breakout.confirmation], true);
    if (read.catalystRealityCheck.sourceUrls.length) add("catalystRealityCheck", "Catalyst / recent news", [read.catalystRealityCheck.summary]);
    add("riskSummary", "Risk notes", read.riskSummary);
    sortPullbacksByPrice(simple.pullbacks.map((zone,index)=>({...zone,hidden:zone.hidden ?? hidden.has(index===0?"shallow":index===1?"deep":"")}))).forEach((zone, index) => {
      if(zone.hidden) return;
      add(`pullback-${index+1}`, `Pullback ${index+1}`, [zone.explanation, zone.confirmation], true);
    });
    add("targets", "Potential Targets (Volume Dependent)", simple.upside.map(level=>HIDDEN_ANALYSIS_PRICE + " " + level.explanation));
  } else {
    add("currentRead", "", [read.currentRead]);
    for (const [key, title] of [["needsToHold", "Structure Weakens"], ["cautionBelow", "Caution below"],
      ["momentumFailure", "Momentum failure"], ["mustClear", "Must clear"],
      ["breakoutContinuation", "Breakout continuation"]] as const) {
      const level = read[key];
      add(key, title, [level.rationale], level.price !== null);
    }
    add("targets", "Potential Targets (Volume Dependent)", read.targets.map(level => HIDDEN_ANALYSIS_PRICE + " " + level.condition));
    // Copy only descriptive strings from known display sections. Evidence IDs and
    // numeric fields never cross this boundary, including future unknown fields.
    if (read.version !== 2) {
      for (const [index,zone] of analysisPullbacks(read).entries()) {
        if (!zone.hidden) add(`pullback-${index+1}`, `Pullback ${index+1}`, [zone.rationale,
          "Required confirmation: " + HIDDEN_ANALYSIS_PRICE + " " + zone.confirmation], true);
      }
      if (read.failureRecovery) add("failureRecovery", "Recovery", [read.failureRecovery.rationale,
        "First reclaim: " + HIDDEN_ANALYSIS_PRICE, "Setup restored: " + HIDDEN_ANALYSIS_PRICE], true);
    }
    read.downsideCheckpoints?.forEach(level => add("downsideCheckpoints", "Downside levels", [level.condition], level.price !== null));
    add("catalystRealityCheck", "Catalyst / recent news", [read.catalystRealityCheck.summary]);
    add("riskSummary", "Risk", read.riskSummary);
  }
  return { sections, simpleRead: buildPremiumSimpleRead(read) };
}
