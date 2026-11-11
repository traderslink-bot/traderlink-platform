import type { ChartMultiview } from "@/src/modules/scanner/alpaca/chart-multiview";
import { CHART_TIMEFRAMES, type ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";

import type { IndicatorType } from "@/src/modules/scanner/alpaca/chart-preferences";

export type ChartIndicatorDisplay = {
  hidden: ReadonlySet<IndicatorType>;
  enabled: Readonly<Partial<Record<IndicatorType, boolean>>>;
};
export const defaultIndicatorDisplay: ChartIndicatorDisplay = { hidden: new Set(), enabled: {} };

type Range = { from: number; to: number };
export type ChartViewSnapshot = {
  symbol: string; timeframe: ChartTimeframe; sessions: string; basisDate: string;
  range: Range; logicalRange: Range; axis: { first: number; last: number; count: number; sessions: string };
  anchor: { time: number; offset: number }; priceRange: Range | null;
  autoScale: boolean; preferenceAutoScale: boolean; logarithmic: boolean;
};
type Storage = Pick<globalThis.Storage, "getItem" | "setItem" | "removeItem">;
type State = { panels: Record<string, string>; views: Record<string, ChartViewSnapshot> };
const prefix = "traderlink.chart-views.v1:";
const finite = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
const range = (value: unknown): value is Range => !!value && typeof value === "object" && finite((value as Range).from) && finite((value as Range).to) && (value as Range).to > (value as Range).from;
function valid(value: unknown): value is ChartViewSnapshot {
  if (!value || typeof value !== "object") return false;
  const s = value as ChartViewSnapshot;
  return typeof s.symbol === "string" && /^[A-Z][A-Z0-9.-]{0,14}$/.test(s.symbol) && CHART_TIMEFRAMES.includes(s.timeframe)
    && typeof s.sessions === "string" && s.sessions.length <= 100 && /^\d{4}-\d{2}-\d{2}$/.test(s.basisDate)
    && !!s.range && finite(s.range.from) && finite(s.range.to) && s.range.to >= s.range.from && s.range.from > 0 && range(s.logicalRange) && s.logicalRange.to - s.logicalRange.from <= 1e7
    && !!s.axis && finite(s.axis.first) && finite(s.axis.last) && s.axis.last >= s.axis.first && Number.isSafeInteger(s.axis.count) && s.axis.count > 0 && s.axis.sessions === s.sessions
    && !!s.anchor && finite(s.anchor.time) && finite(s.anchor.offset) && (s.priceRange === null || range(s.priceRange))
    && typeof s.autoScale === "boolean" && typeof s.preferenceAutoScale === "boolean" && typeof s.logarithmic === "boolean";
}
const key = (panel: string, symbol: string, timeframe: ChartTimeframe, sessions: string) => JSON.stringify([panel, symbol, timeframe, sessions]);
/** Only small view coordinates are retained. No candles, charts, streams or timers. */
export class ChartViewMemory {
  private indicatorDisplays = new Map<string, Map<string, { symbol: string; display: ChartIndicatorDisplay }>>();
  private states = new Map<string, State>();
  constructor(private storage: () => Storage | undefined) {}
  private scope(owner: string, workspace: string) { return `${owner}:${workspace}`; }
  private state(scope: string): State {
    const existing = this.states.get(scope); if (existing) return existing;
    let state: State = { panels: {}, views: {} };
    try {
      const raw = this.storage()?.getItem(prefix + scope);
      if (raw && raw.length <= 524288) {
        const parsed = JSON.parse(raw) as State;
        if (parsed && parsed.panels && parsed.views && typeof parsed.panels === "object" && typeof parsed.views === "object" && Object.keys(parsed.panels).length <= 320 && Object.keys(parsed.views).length <= 192) {
          const panels = Object.entries(parsed.panels).filter(([id, symbol]) => /^[a-zA-Z0-9_-]{1,128}$/.test(id) && typeof symbol === "string");
          state = { panels: Object.fromEntries(panels), views: Object.fromEntries(Object.entries(parsed.views).filter(([k, v]) => k.length <= 400 && valid(v))) };
        }
      }
    } catch { /* Storage may be unavailable; navigation within this document still works. */ }
    this.states.set(scope, state); return state;
  }
  private persist(scope: string, state: State) { try { this.storage()?.setItem(prefix + scope, JSON.stringify(state)); } catch { /* Preserve the in-memory view when storage is full or blocked. */ } }
  retain(owner: string, workspace: string, layout: ChartMultiview) {
    const scope = this.scope(owner, workspace), state = this.state(scope);
    state.panels = Object.fromEntries(layout.groups.flatMap(g => g.panels.map(p => [p.id, g.symbol])));
    for (const k of Object.keys(state.views)) { try { const [panel, symbol] = JSON.parse(k); if (state.panels[panel] !== symbol) delete state.views[k]; } catch { delete state.views[k]; } }
    const displays = this.indicatorDisplays.get(scope);
    if (displays) for (const [panel, entry] of displays) {
      if (state.panels[panel] !== entry.symbol) displays.delete(panel);
    }
    this.persist(scope, state);
  }
  readIndicatorDisplay(owner: string, workspace: string, panel: string, symbol: string) {
    const entry = this.indicatorDisplays.get(this.scope(owner, workspace))?.get(panel);
    return entry?.symbol === symbol ? entry.display : defaultIndicatorDisplay;
  }
  writeIndicatorDisplay(owner: string, workspace: string, panel: string, symbol: string, display: ChartIndicatorDisplay) {
    const scope = this.scope(owner, workspace);
    if (this.state(scope).panels[panel] !== symbol) return;
    const displays = this.indicatorDisplays.get(scope) ?? new Map();
    displays.set(panel, { symbol, display });
    this.indicatorDisplays.set(scope, displays);
  }
  read(owner: string, workspace: string, panel: string, symbol: string, timeframe: ChartTimeframe, sessions: string) {
    const state = this.state(this.scope(owner, workspace));
    if (state.panels[panel] !== symbol) return null;
    return state.views[key(panel, symbol, timeframe, sessions)] ?? null;
  }
  write(owner: string, workspace: string, panel: string, snapshot: ChartViewSnapshot) {
    if (!valid(snapshot)) return;
    const scope = this.scope(owner, workspace), state = this.state(scope);
    // A close prunes before React unmounts; the old chart cleanup cannot re-create it.
    if (state.panels[panel] !== snapshot.symbol) return;
    const k = key(panel, snapshot.symbol, snapshot.timeframe, snapshot.sessions);
    delete state.views[k]; state.views[k] = snapshot;
    while (Object.keys(state.views).length > 192) delete state.views[Object.keys(state.views)[0]];
    this.persist(scope, state);
  }
  clear(owner: string, workspace: string) {
    const scope = this.scope(owner, workspace); this.indicatorDisplays.delete(scope); this.states.set(scope, { panels: {}, views: {} });
    try { this.storage()?.removeItem(prefix + scope); } catch { /* No storage access. */ }
  }
}
export function restoreChartRange(view: ChartViewSnapshot, times: readonly number[]): Range | null {
  if (!times.length) return null;
  if (view.axis.first === times[0] && view.axis.last === times.at(-1) && view.axis.count === times.length) return view.logicalRange;
  const span = view.logicalRange.to - view.logicalRange.from;
  if (view.logicalRange.to >= view.axis.count - 1) {
    const to = times.length - 1 + view.logicalRange.to - (view.axis.count - 1); return { from: to - span, to };
  }
  const index = times.indexOf(view.anchor.time);
  return index < 0 ? null : { from: index + view.anchor.offset, to: index + view.anchor.offset + span };
}
export const chartViews = new ChartViewMemory(() => typeof window === "undefined" ? undefined : window.localStorage);

export function canRestoreChartPrice(view: ChartViewSnapshot | null, preferences: { autoScale: boolean; logarithmic: boolean }, basisDate: string) {
  return !!view && view.basisDate === basisDate && view.preferenceAutoScale === preferences.autoScale && view.logarithmic === preferences.logarithmic && (!preferences.logarithmic || view.priceRange === null || view.priceRange.from > 0);
}
