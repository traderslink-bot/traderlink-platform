import { isScannerCardSlot, type ScannerCardSlot } from "./workspace-scanner-title";

export const CARD_SECTION_LABELS = { stats: "Stats", indicators: "Indicators", catalyst: "Catalyst" } as const;
export type CardSection = keyof typeof CARD_SECTION_LABELS;
export const CARD_SECTIONS: readonly CardSection[] = ["stats", "indicators", "catalyst"];
export type CardSectionPreferences = Partial<Record<ScannerCardSlot, readonly CardSection[]>>;

export function readCardSections(value: readonly unknown[]): CardSection[] {
  return [...new Set(value.filter((section): section is CardSection =>
    typeof section === "string" && Object.hasOwn(CARD_SECTION_LABELS, section)))];
}

export function readCardSectionPreferences(value: unknown): CardSectionPreferences {
  if (!value || typeof value !== "object") return {};
  const result: CardSectionPreferences = {};
  for (const [slot, sections] of Object.entries(value)) {
    if (isScannerCardSlot(slot) && Array.isArray(sections)) result[slot] = readCardSections(sections);
  }
  return result;
}
