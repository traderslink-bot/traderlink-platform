import { layoutWidgets } from "./scanner-desktop-layout";
import { defaultTile, GAP, geometry, minimum, presets, type Rect, type Tile } from "./scanner-split-layout";
import type { WorkspaceCardWidget as Widget } from "../scanner-workspace-layout";

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
    layoutWidgets.includes(widget) && rect && [rect.x, rect.y, rect.w, rect.h].every(Number.isFinite) &&
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

export function cardAtPoint(layout: CardLayout, x: number, y: number) {
  return cardEntries(layout).find(([, rect]) =>
    x >= rect.x && x < rect.x + rect.w && y >= rect.y && y < rect.y + rect.h)?.[0];
}

export function moveCard(layout: CardLayout, widget: Widget, x: number, y: number,
  bounds: Pick<Rect, "w" | "h">, target?: Widget): CardLayout | null {
  const current = layout[widget];
  if (!current) return null;
  if (target && target !== widget) {
    const slot = layout[target];
    if (!slot || bounds.w <= 0 || bounds.h <= 0) return null;
    const fitsSlot = (card: Widget, previous: Rect, next: Rect) => {
      const size = minimum(card);
      return next.w >= Math.min(previous.w, size.w / bounds.w * layoutSize)
        && next.h >= Math.min(previous.h, size.h / bounds.h * layoutSize);
    };
    return fitsSlot(widget, current, slot) && fitsSlot(target, slot, current)
      ? { ...layout, [widget]: slot, [target]: current } : null;
  }
  const rect = { ...current, x: Math.max(0, Math.min(layoutSize - current.w, x)),
    y: Math.max(0, Math.min(layoutSize - current.h, y)) };
  if (rect.x === current.x && rect.y === current.y) return layout;
  return cardFits(layout, widget, rect) ? { ...layout, [widget]: rect } : null;
}

export function dropCard(layout:CardLayout,widget:Widget,position:Pick<Rect,"x"|"y">,
  point:Pick<Rect,"x"|"y">,bounds:Pick<Rect,"w"|"h">):CardLayout|null {
  const target=cardAtPoint(layout,point.x,point.y);
  const direct=moveCard(layout,widget,position.x,position.y,bounds,target);
  const current=layout[widget];
  if(direct||target||!current||bounds.w<=0||bounds.h<=0||
    point.x<0||point.y<0||point.x>=layoutSize||point.y>=layoutSize)return direct;

  const obstacles=cardEntries(layout).map(([,rect])=>rect);
  const leftEdges=new Set([0,...obstacles.map(rect=>rect.x+rect.w).filter(x=>x<=point.x)]);
  const rightEdges=new Set([layoutSize,...obstacles.map(rect=>rect.x).filter(x=>x>point.x)]);
  const size=minimum(widget);
  const minW=Math.min(current.w,size.w/bounds.w*layoutSize);
  const minH=Math.min(current.h,size.h/bounds.h*layoutSize);
  let best:{rect:Rect;area:number;distance:number}|undefined;
  // For each horizontal span through the drop point, find the unobstructed vertical span.
  for(const left of leftEdges)for(const right of rightEdges){
    const w=Math.min(current.w,right-left);
    if(w<minW)continue;
    let top=0,bottom=layoutSize;
    for(const other of obstacles){
      if(other.x>=right||other.x+other.w<=left)continue;
      if(other.y+other.h<=point.y)top=Math.max(top,other.y+other.h);
      else if(other.y>point.y)bottom=Math.min(bottom,other.y);
      else {bottom=top;break;}
    }
    const h=Math.min(current.h,bottom-top);
    if(h<minH)continue;
    const rect={
      x:Math.min(right-w,point.x,Math.max(left,point.x-w,position.x)),
      y:Math.min(bottom-h,point.y,Math.max(top,point.y-h,position.y)),
      w,h,
    };
    if(!cardFits(layout,widget,rect))continue;
    const area=w*h;
    const distance=(rect.x-position.x)**2+(rect.y-position.y)**2;
    if(!best||area>best.area||area===best.area&&distance<best.distance)best={rect,area,distance};
  }
  return best?{...layout,[widget]:best.rect}:null;
}

export function placeAddedCard(layout: CardLayout, widget: Widget, size: Pick<Rect, "w" | "h">) {
  const entries = cardEntries(layout);
  const xs = [...new Set([0, ...entries.map(([, r]) => r.x + r.w)])].sort((a,b)=>a-b);
  const ys = [...new Set([0, ...entries.map(([, r]) => r.y + r.h)])].sort((a,b)=>a-b);
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
