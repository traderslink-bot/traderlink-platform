import { widgets } from "./scanner-desktop-layout";
import { defaultTile, GAP, geometry, presets, type Rect, type Tile } from "./scanner-split-layout";
import type { ScannerWorkspaceWidget as Widget } from "../scanner-workspace-layout";

export const layoutSize = 1000;
export type CardLayout = Partial<Record<Widget, Rect>>;
export const cardEntries = (layout: CardLayout) =>
  Object.entries(layout) as [Widget, Rect][];

export function tileToCards(tile: Tile, gap = 0): CardLayout {
  return geometry(tile, { x: 0, y: 0, w: layoutSize, h: layoutSize }, gap).panels;
}

export function validCardLayout(value: unknown): value is CardLayout {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const entries = cardEntries(value as CardLayout);
  return entries.length > 0 && entries.every(([widget, rect], index) =>
    widgets.includes(widget) && rect && [rect.x, rect.y, rect.w, rect.h].every(Number.isFinite) &&
    rect.x >= 0 && rect.y >= 0 && rect.w > 0 && rect.h > 0 &&
    rect.x + rect.w <= layoutSize && rect.y + rect.h <= layoutSize &&
    entries.slice(0, index).every(([, previous]) => !overlaps(rect, previous)));
}

function overlaps(a: Rect, b: Rect) {
  const tolerance = 1e-7;
  return a.x < b.x + b.w - tolerance && a.x + a.w > b.x + tolerance &&
    a.y < b.y + b.h - tolerance && a.y + a.h > b.y + tolerance;
}

export function cardFits(layout: CardLayout, widget: Widget, rect: Rect) {
  return rect.x >= 0 && rect.y >= 0 && rect.x + rect.w <= layoutSize &&
    rect.y + rect.h <= layoutSize && cardEntries(layout).every(([key, other]) =>
      key === widget || !overlaps(rect, other));
}

export function placeAddedCard(layout: CardLayout, widget: Widget, size: Pick<Rect, "w" | "h">) {
  const entries = cardEntries(layout);
  const xs = [0, ...entries.map(([, r]) => r.x + r.w + 8)].sort((a,b)=>a-b);
  const ys = [0, ...entries.map(([, r]) => r.y + r.h + 8)].sort((a,b)=>a-b);
  for (const y of ys) for (const x of xs) {
    const rect = { x, y, ...size };
    if (cardFits(layout, widget, rect)) return { ...layout, [widget]: rect };
  }
  return null;
}

// Older defaults and presets included gutters. Only migrate an exact match,
// so independently edited rectangles keep their original coordinates.
const previousPresets = [defaultTile, ...presets.map(preset => preset.tile)].map(tile => ({
  previous: tileToCards(tile, GAP),
  flush: tileToCards(tile),
}));

export function removePresetSpacing(layout: CardLayout): CardLayout {
  const entries = cardEntries(layout);
  const match = previousPresets.find(({ previous }) =>
    entries.length === cardEntries(previous).length && entries.every(([widget, rect]) => {
      const original = previous[widget];
      return original && rect.x === original.x && rect.y === original.y &&
        rect.w === original.w && rect.h === original.h;
    }));
  return match?.flush ?? layout;
}
