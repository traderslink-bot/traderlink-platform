import type { ScannerReadModel } from "./contracts";
import { gainerViewResults, type GainerView } from "./gainer-view";

export const GAINER_CARD_LABELS = {
  gainers: "Top Gainers (pre/reg + post)",
  "day-gainers": "Top Gainers (pre/reg)",
  "post-market-gainers": "Top Gainers (post only)",
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

/** The card shows its current ranking; the scanner picker keeps the full combined name. */
export function gainerCardTitle(
  kind: GainerCardKind,
  session: ScannerReadModel["session"] | undefined,
  automaticSwitch = true,
): string {
  if (kind !== "gainers") return GAINER_CARD_LABELS[kind];
  return gainerCardView(kind, session, automaticSwitch) === "post_market"
    ? "Top Gainers (post)" : "Top Gainers (pre/reg)";
}

export function gainerCardResults(model: ScannerReadModel | null, kind: GainerCardKind, automaticSwitch = true) {
  return gainerViewResults(model, gainerCardView(kind, model?.session, automaticSwitch));
}

/** Optional layout data: absent or malformed entries retain the existing automatic behavior. */
export function readGainerSwitchPreferences(value: unknown, slots: readonly string[]): GainerSwitchPreferences {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key, enabled]) => slots.includes(key) && typeof enabled === "boolean"));
}
