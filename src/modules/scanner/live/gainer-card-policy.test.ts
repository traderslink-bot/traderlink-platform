import { describe, expect, it } from "vitest";
import type { ScannerReadModel } from "./contracts";
import { GAINER_CARD_LABELS, gainerCardResults, gainerCardView, isGainerCard, readGainerSwitchPreferences } from "./gainer-card-policy";

describe("custom-layout gainer card policy", () => {
  it("keeps combined cards automatic by default and lets each card stay on the daily basis", () => {
    expect(gainerCardView("gainers", "premarket")).toBe("day");
    expect(gainerCardView("gainers", "regular")).toBe("day");
    expect(gainerCardView("gainers", "after_hours")).toBe("post_market");
    expect(gainerCardView("gainers", "after_hours", false)).toBe("day");
    expect(gainerCardView("gainers", undefined)).toBe("day");
  });
  it("keeps fixed choices independent of the combined card preference", () => {
    expect(gainerCardView("day-gainers", "after_hours", true)).toBe("day");
    expect(gainerCardView("post-market-gainers", "regular", false)).toBe("post_market");
    expect(gainerCardView("post-market-gainers", "after_hours", false)).toBe("post_market");
  });
  it("uses the existing independent result objects and never retags a post-market result as a day result", () => {
    const day = { rows: [], total: 12, focus: [] }, post = { rows: [], total: 4, focus: [] };
    const model = { session: "after_hours", dayGainers: day, gainers: post } as unknown as ScannerReadModel;
    expect(gainerCardResults(model, "day-gainers")).toBe(day);
    expect(gainerCardResults(model, "post-market-gainers")).toBe(post);
    expect(gainerCardResults(model, "gainers", false)).toBe(day);
    expect(gainerCardResults(model, "gainers", true)).toBe(post);
    expect(gainerCardResults({ ...model, dayGainers: undefined }, "day-gainers")).toBeUndefined();
    expect(gainerCardResults({ ...model, session: "regular" }, "post-market-gainers")).toBeUndefined();
    expect(gainerCardResults(null, "gainers")).toBeUndefined();
  });
  it("reads old layouts without changing defaults and isolates valid per-slot preferences", () => {
    const slots = ["gainers", "momentum"];
    expect(readGainerSwitchPreferences(undefined, slots)).toEqual({});
    expect(readGainerSwitchPreferences([], slots)).toEqual({});
    expect(readGainerSwitchPreferences({ gainers: false, momentum: true, unknown: false }, slots)).toEqual({ gainers: false, momentum: true });
    expect(readGainerSwitchPreferences({ gainers: "false", momentum: null }, slots)).toEqual({});
  });
  it("provides unambiguous dropdown names without creating another scanner engine kind", () => {
    expect(GAINER_CARD_LABELS.gainers).toBe("Top Gainers (Pre/Reg + Post)");
    expect(isGainerCard("day-gainers")).toBe(true);
    expect(isGainerCard("post-market-gainers")).toBe(true);
    expect(isGainerCard("momentum")).toBe(false);
  });
});
