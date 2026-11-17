import { describe, expect, it } from "vitest";
import { cardAtPoint, moveCard, tileToCards, validCardLayout } from "@/app/(dashboard)/screeners/workspace/scanner-free-layout";
import { defaultTile } from "@/app/(dashboard)/screeners/workspace/scanner-split-layout";

const bounds = { w: 1040, h: 650 };

describe("Trading Workspace card placement", () => {
  it("swaps two cards in the fully occupied default grid", () => {
    const layout = tileToCards(defaultTile);
    const slot = layout.momentum!;
    const target = cardAtPoint(layout, slot.x + slot.w / 2, slot.y + slot.h / 2);
    const next = moveCard(layout, "gainers", slot.x, slot.y, bounds, target)!;
    expect(next.gainers).toEqual(layout.momentum);
    expect(next.momentum).toEqual(layout.gainers);
    expect(next["ticker-workspace"]).toEqual(layout["ticker-workspace"]);
    expect(validCardLayout(next)).toBe(true);
  });

  it("moves into open space without resizing and rejects a chart swap into a slot that is too narrow", () => {
    const layout = tileToCards(defaultTile);
    const chart = layout["ticker-workspace"]!;
    expect(moveCard(layout, "ticker-workspace", 0, 0, bounds, "gainers")).toBeNull();
    const sparse = { "ticker-workspace": chart };
    expect(moveCard(sparse, "ticker-workspace", 20, 30, bounds)).toEqual({
      "ticker-workspace": { ...chart, x: 20, y: 30 },
    });
    expect(moveCard(sparse, "ticker-workspace", chart.x, chart.y, bounds)).toBe(sparse);
  });
});
