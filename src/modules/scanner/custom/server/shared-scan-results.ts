import "server-only";

import { SCAN_METRICS, scanRules, type ScanDefinition, type ScanResult } from "../definition";

const familyNames = {
  Price: "price activity",
  Volume: "volume activity",
  "Session levels": "session price action",
  Company: "company criteria",
  Catalyst: "a market event",
  Indicators: "a technical signal",
  "Market context": "the broader market",
} as const;

export function sharedResultsWithoutFilters(result: ScanResult, definition: ScanDefinition): ScanResult {
  const rules = scanRules(definition);
  return {
    status: result.status,
    total: result.total,
    eligible: result.eligible,
    incomplete: result.incomplete,
    updatedAt: result.updatedAt,
    rows: result.rows.map(row => {
      const matchedFamilies = new Set((row.matchedRuleIndexes ?? []).flatMap(index => {
        const rule = rules[index];
        return rule ? [familyNames[SCAN_METRICS[rule.metric].category]] : [];
      }));
      const matchSummary = matchedFamilies.size ? "Matched on " + [...matchedFamilies].slice(0, 2).join(" and ")
        : "Qualified for this scan";
      return {
        symbol: row.symbol,
        exchange: row.exchange,
        price: row.price,
        volume: row.volume,
        dayVolume: row.dayVolume,
        premarketVolume: row.premarketVolume,
        regularVolume: row.regularVolume,
        postMarketVolume: row.postMarketVolume,
        dollarVolume: row.dollarVolume,
        marketCap: row.marketCap,
        float: row.float,
        dayChange: row.dayChange,
        belowHigh: row.belowHigh,
        country: row.country,
        halted: row.halted,
        priceObservedAt: row.priceObservedAt,
        sortValue: null,
        matches: [],
        matchSummary,
      };
    }),
  };
}
