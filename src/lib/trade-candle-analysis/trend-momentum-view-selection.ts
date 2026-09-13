import { INDICATOR_FILTER_OPTIONS } from "./trend-momentum-cohorts";

const options: Record<string, readonly string[]> = {
  indicator_interval: ["1m", "5m"], indicator_execution: ["initial_entry", "re_entry", "add", "partial_exit", "position_close", "final_exit"],
  indicator_reference: ["ema9", "ema20", "vwap"], indicator_event: ["loss", "reclaim"], indicator_coverage: ["complete", "incomplete"],
  indicator_group: ["matching", "nonmatching", "unknown"], indicator_during_group: ["matching", "nonmatching", "unknown"],
  indicator_ema20Side: ["any", "above", "below", "neutral"],
  indicator_emaComparison: ["alignment", "ema9Direction", "ema20Direction", "separation"], indicator_rsiComparison: ["rsiBand", "rsiDirection"],
  indicator_landmark_axis: ["alignment", "ema9Direction", "ema20Direction", "separation", "rsiBand", "rsiDirection", "vwapSide"],
  indicator_landmark_zone: ["20", "30", "40", "50", "60", "70", "80", "90", "100"],
  indicator_landmark_point: ["red", "twenty"],
  movement_interval: ["1m", "5m"], movement_alignment: INDICATOR_FILTER_OPTIONS.alignment, movement_rsi: INDICATOR_FILTER_OPTIONS.rsiBand,
};
for (const [key, values] of Object.entries(INDICATOR_FILTER_OPTIONS)) {
  options[`indicator_${key}`] = values;
  options[`indicator_during_${key}`] = values;
}

/** Only categorical view choices; never persist identifiers, cursors or arbitrary URL contents. */
export function analyzerViewSelection(query: Pick<URLSearchParams, "get">): string {
  const result = new URLSearchParams();
  for (const key of Object.keys(options).sort()) {
    const value = query.get(key);
    if (value && options[key].includes(value)) result.set(key, value);
  }
  result.sort();
  return result.toString();
}
