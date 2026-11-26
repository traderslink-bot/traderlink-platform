import { describe, expect, it } from "vitest";
import { cardAtPoint, dropCard, moveCard, placeAddedCard, tileToCards, validCardLayout } from "@/app/(dashboard)/screeners/workspace/scanner-free-layout";
import { cards, defaultTile, presets } from "@/app/(dashboard)/screeners/workspace/scanner-split-layout";

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

  it("snaps to the gap left by hidden Breakouts when released away from its corner", () => {
    const layout = tileToCards(defaultTile);
    const slot = layout.breakouts!;
    delete layout.breakouts;
    const position = { x:slot.x+45, y:slot.y+65 };
    const point = { x:position.x+10, y:position.y+10 };
    expect(moveCard(layout,"momentum",position.x,position.y,bounds)).toBeNull();
    const next = dropCard(layout,"momentum",position,point,bounds);
    expect(next).toEqual({...layout,momentum:slot});
    expect(validCardLayout(next)).toBe(true);
    const oldMomentum=layout.momentum!;
    const chartPosition={x:oldMomentum.x+45,y:oldMomentum.y+65};
    const chartPoint={x:chartPosition.x+10,y:chartPosition.y+10};
    expect(dropCard(next!,"ticker-workspace",chartPosition,chartPoint,bounds)).toBeNull();
  });

  it("fits a wider scanner in an open gap without moving its neighbors", () => {
    const gainers = {x:0,y:0,w:400,h:400};
    const momentum = {x:0,y:400,w:400,h:600};
    const breakouts = {x:650,y:0,w:350,h:1000};
    const layout = {gainers,momentum,breakouts};
    const next=dropCard(layout,"gainers",{x:500,y:50},{x:510,y:60},bounds);
    expect(next).toEqual({gainers:{x:400,y:50,w:250,h:400},momentum,breakouts});
    expect(validCardLayout(next)).toBe(true);
  });
});


it("fills available space with two additional cards without moving existing cards", () => {
  const layout = tileToCards(defaultTile);
  expect(placeAddedCard(layout, "scanner-8", { w: 180, h: 124 })).toBeNull();
  const resized = { ...layout, gainers: { ...layout.gainers!, h: 250 }, momentum: { ...layout.momentum!, h: 250 } };
  const eight = placeAddedCard(resized, "scanner-8", { w: 180, h: 124 })!;
  const nine = placeAddedCard(eight, "scanner-9", { w: 180, h: 124 })!;
  expect(validCardLayout(nine)).toBe(true);
  expect(Object.keys(nine)).toHaveLength(9);
  for (const [card, rectangle] of Object.entries(resized)) expect(nine[card as keyof typeof nine]).toBe(rectangle);
  const preset = presets.find(preset => preset.name === "Chart + 8 cards")!;
  expect(validCardLayout(tileToCards(preset.tile))).toBe(true);
  expect(cards(preset.tile)).toHaveLength(9);
  expect(cards(preset.tile).filter(card => card === "ticker-workspace")).toHaveLength(1);
});
