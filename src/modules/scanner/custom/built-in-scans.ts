import { parseScanDefinition } from "./definition";

// Public examples have their own defaults. The live presets run in the Scanner engine.
const starterTemplates = {
  gainers: {
    label: "Top Gainers",
    definition: { rules: [{ metric: "dayChange", minimum: 5, maximum: null }], sort: { metric: "dayChange", direction: "desc" } },
  },
  momentum: {
    label: "Momentum",
    definition: { rules: [
      { metric: "rollingMove", minimum: 2, maximum: null, minutes: 10, direction: "up" },
      { metric: "volumePace", minimum: 1.5, maximum: null, minutes: 10 },
    ], sort: { metric: "rollingMove", direction: "desc", minutes: 10 } },
  },
  losers: {
    label: "Top Losers",
    definition: { rules: [{ metric: "dayChange", minimum: null, maximum: -5 }], sort: { metric: "dayChange", direction: "asc" } },
  },
  "hod-drops": {
    label: "HOD Drops",
    definition: { rules: [{ metric: "fromPremarketHigh", minimum: null, maximum: -12 }], sort: { metric: "fromPremarketHigh", direction: "asc" } },
  },
  breakouts: {
    label: "Breakouts",
    definition: { rules: [{ metric: "fromPremarketHigh", minimum: 0.5, maximum: null }], sort: { metric: "fromPremarketHigh", direction: "desc" } },
  },
  "market-events": {
    label: "Market Events",
    definition: { match: "any", rules: [
      { metric: "pressRelease", minimum: null, maximum: 24 },
      { metric: "activeHalt", minimum: 1, maximum: null },
      { metric: "tradeResumed", minimum: null, maximum: 30 },
    ], sort: { metric: "dayChange", direction: "desc" } },
  },
};

export type BuiltInScanId = keyof typeof starterTemplates;
export const builtInScanChoices = Object.entries(starterTemplates).map(([id, { label }]) => ({
  value: "built-in:" + id, label,
}));

const liveWidgets = {
  gainers: "gainers",
  momentum: "momentum",
  losers: "top-losers",
  "hod-drops": "high-drops",
  breakouts: "breakouts",
  "market-events": "market-events",
} as const satisfies Record<BuiltInScanId, string>;

export const livePresetChoices = (Object.keys(liveWidgets) as BuiltInScanId[]).map(key => ({
  id: `live:${key}` as const,
  label: starterTemplates[key].label,
  widget: liveWidgets[key],
}));

export function originalBuiltInScan(choice: string) {
  if (!choice.startsWith("live:")) return;
  const id = choice.slice("live:".length);
  if (!Object.hasOwn(liveWidgets, id)) return;
  const key = id as BuiltInScanId;
  return { widget: liveWidgets[key], label: starterTemplates[key].label, templateChoice: "built-in:" + key };
}

export function builtInScanForChoice(choice: string) {
  if (!choice.startsWith("built-in:")) return;
  const id = choice.slice("built-in:".length);
  if (!Object.hasOwn(starterTemplates, id)) return;
  const { label, definition } = starterTemplates[id as BuiltInScanId];
  return { label, definition: parseScanDefinition(definition) };
}
