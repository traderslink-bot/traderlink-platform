import type { ScannerReadModel } from "./contracts";
import { gainerViewResults, type GainerView } from "./gainer-view";

export const GAINER_CARD_LABELS = {
  gainers: "Top Gainers (Pre/Reg + Post)",
  "day-gainers": "Day Gainers",
  "post-market-gainers": "Post-market Gainers",
} as const;
export type GainerCardKind = keyof typeof GAINER_CARD_LABELS;
export type GainerSwitchPreferences = Partial<Record<string, boolean>>;

export function isGainerCard(value: string): value is GainerCardKind {
  return Object.hasOwn(GAINER_CARD_LABELS, value);
}

/** Session comes from the shared scanner model, never a browser clock or a new poll. */
export function gainerCardView(
  kind: GainerCardKind,
  session: ScannerReadModel["session"] | undefined,
  automaticSwitch = true,
): GainerView {
  if (kind === "post-market-gainers") return "post_market";
  return kind === "gainers" && automaticSwitch && session === "after_hours" ? "post_market" : "day";
}

export function gainerCardResults(model: ScannerReadModel | null, kind: GainerCardKind, automaticSwitch = true) {
  return gainerViewResults(model, gainerCardView(kind, model?.session, automaticSwitch));
}

/** Optional layout data: absent or malformed entries retain the existing automatic behavior. */
export function readGainerSwitchPreferences(value: unknown, slots: readonly string[]): GainerSwitchPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key, enabled]) => slots.includes(key) && typeof enabled === "boolean"));
}
