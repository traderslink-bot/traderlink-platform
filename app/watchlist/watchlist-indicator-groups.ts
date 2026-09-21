import type { indicatorDisplayRows } from "@/src/lib/live-watchlist/indicators/indicator-presentation";
import { watchlistIndicatorHelp } from "./watchlist-indicator-help";

type Reading = ReturnType<typeof indicatorDisplayRows>[number];
const GROUPS = [
  { label: "Trend & moving averages", members: ["Trend", "Moving averages"] },
  { label: "RSI & momentum", members: ["RSI", "Momentum"] },
  { label: "VWAP", members: ["VWAP"] },
  { label: "Volume", members: ["Volume"] },
  { label: "ATR", members: ["ATR"] },
] as const;

export function watchlistIndicatorGroups(readings: readonly Reading[]) {
  return GROUPS.map(group => {
    const parts = group.members.flatMap(label => readings.filter(reading => reading.label === label));
    return { label: group.label, parts,
      help: parts.map(part => watchlistIndicatorHelp(part.label, part.calculation)).join(" ") };
  });
}
