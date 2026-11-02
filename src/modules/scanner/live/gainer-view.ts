import type { LiveScreenResults, ScannerReadModel } from "./contracts";

export type GainerView = "day" | "post_market";
export type GainerViewChoice = Readonly<{ tradingDate: string; view: GainerView }>;

/** Session comes from the verified exchange calendar, not the browser's timezone. */
export function selectedGainerView(model: ScannerReadModel | null, choice: GainerViewChoice | null): GainerView {
  if (model && choice?.tradingDate === model.tradingDate) return choice.view;
  return model?.session === "after_hours" ? "post_market" : "day";
}

export function gainerViewResults(model: ScannerReadModel | null, view: GainerView): LiveScreenResults | undefined {
  if (!model) return undefined;
  if (view === "day") return model.dayGainers ?? (model.session !== "after_hours" ? model.gainers : undefined);
  return model.session === "after_hours" ? model.gainers : undefined;
}
