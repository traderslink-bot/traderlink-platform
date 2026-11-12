import { CHART_TIMEFRAMES, chartSymbol, type ChartTimeframe } from "./candles";

export type ChartPanel = Readonly<{ id: string; timeframe: ChartTimeframe }>;
export type ChartTickerGroup = Readonly<{ id: string; symbol: string; panels: readonly ChartPanel[] }>;
export type ChartMultiview = Readonly<{ version: 1; groups: readonly ChartTickerGroup[]; selectedPanel: string | null; mobileLayout?: "tabs" | "stack"; landscapeLayout?: "tabs" | "stack" | "grid"; comparisonPanels?: readonly string[] }>;
export const EMPTY_MULTIVIEW: ChartMultiview = { version: 1, groups: [], selectedPanel: null };
export const MAX_WORKSPACE_TICKERS = 10;
export const MAX_MULTIVIEW_BYTES = 8192;
const validId = (value: unknown): value is string => typeof value === "string" && /^[a-zA-Z0-9_-]{1,64}$/.test(value);
const exact = (row: Record<string, unknown>, keys: string[]) => Object.keys(row).every(key => keys.includes(key)) && keys.every(key => key in row);
export const chartCount = (layout: ChartMultiview) => layout.groups.reduce((sum, group) => sum + group.panels.length, 0);
export function parseChartMultiview(value: unknown, expanded = false): ChartMultiview {
  if (!value || typeof value !== "object") throw Error("invalid_layout");
  const layout = value as Record<string, unknown>;
  if (!exact(layout, ["version", "groups", "selectedPanel", ...(expanded && Object.hasOwn(layout, "comparisonPanels") ? ["comparisonPanels"] : []), ...(Object.hasOwn(layout, "mobileLayout") ? ["mobileLayout"] : []), ...(Object.hasOwn(layout, "landscapeLayout") ? ["landscapeLayout"] : [])]) || (Object.hasOwn(layout, "mobileLayout") && layout.mobileLayout !== "tabs" && layout.mobileLayout !== "stack") || (Object.hasOwn(layout, "landscapeLayout") && !["tabs", "stack", "grid"].includes(layout.landscapeLayout as string)) || layout.version !== 1 || !Array.isArray(layout.groups) || layout.groups.length > (expanded ? MAX_WORKSPACE_TICKERS : 4)) throw Error("invalid_layout");
  const ids = new Set<string>(), symbols = new Set<string>();
  const groups = layout.groups.map((raw: unknown): ChartTickerGroup => {
    if (!raw || typeof raw !== "object") throw Error("invalid_layout");
    const row = raw as Record<string, unknown>;
    if (!exact(row, ["id", "symbol", "panels"]) || !validId(row.id) || ids.has(row.id) || typeof row.symbol !== "string" || !Array.isArray(row.panels) || !row.panels.length || row.panels.length > 4) throw Error("invalid_layout");
    const symbol = chartSymbol(row.symbol); if (symbols.has(symbol)) throw Error("duplicate_ticker");
    ids.add(row.id); symbols.add(symbol); const frames = new Set<string>();
    const panels = row.panels.map((raw: unknown): ChartPanel => {
      if (!raw || typeof raw !== "object") throw Error("invalid_layout");
      const panel = raw as Record<string, unknown>;
      if (!exact(panel, ["id", "timeframe"]) || !validId(panel.id) || ids.has(panel.id) || !CHART_TIMEFRAMES.includes(panel.timeframe as ChartTimeframe) || frames.has(panel.timeframe as string)) throw Error("invalid_layout");
      ids.add(panel.id); frames.add(panel.timeframe as string);
      return { id: panel.id, timeframe: panel.timeframe as ChartTimeframe };
    });
    return { id: row.id, symbol, panels };
  });
  const comparison = layout.comparisonPanels;
  const panelIds = new Set(groups.flatMap(group => group.panels.map(panel => panel.id)));
  if (Object.hasOwn(layout, "comparisonPanels") && (!Array.isArray(comparison) || comparison.length > 4 || new Set(comparison).size !== comparison.length || comparison.some(id => !panelIds.has(id)))) throw Error("invalid_layout");
  const result: ChartMultiview = { version: 1, groups, selectedPanel: layout.selectedPanel as string | null, ...(Array.isArray(comparison) ? { comparisonPanels: comparison as string[] } : {}), ...(Object.hasOwn(layout, "mobileLayout") ? { mobileLayout: layout.mobileLayout as "tabs" | "stack" } : {}), ...(Object.hasOwn(layout, "landscapeLayout") ? { landscapeLayout: layout.landscapeLayout as "tabs" | "stack" | "grid" } : {}) };
  if ((!expanded && chartCount(result) > 4) || (groups.length ? !groups.some(group => group.panels.some(panel => panel.id === layout.selectedPanel)) : layout.selectedPanel !== null)) throw Error("invalid_layout");
  return result;
}
export function singleChart(symbol: string, timeframe: ChartTimeframe = "1m"): ChartMultiview {
  return { version: 1, groups: [{ id: "ticker-1", symbol: chartSymbol(symbol), panels: [{ id: "chart-1", timeframe }] }], selectedPanel: "chart-1" };
}
export function selectedChart(layout: ChartMultiview) {
  for (const group of layout.groups) { const panel = group.panels.find(panel => panel.id === layout.selectedPanel); if (panel) return { group, panel }; }
  return null;
}
export function reconcileChartTickers(layout: ChartMultiview, symbols: readonly string[], defaultTimeframe: ChartTimeframe = "1m"): ChartMultiview {
  const wanted = [...new Set(symbols.map(chartSymbol))].slice(0, 4);
  const groups = layout.groups.filter(group => wanted.includes(group.symbol));
  const missing = wanted.filter(symbol => !groups.some(group => group.symbol === symbol));
  // Adding a scanner ticker must never silently close a timeframe to make room.
  if (groups.reduce((sum, group) => sum + group.panels.length, 0) + missing.length > 4) return layout;
  const used = new Set(groups.flatMap(group => [group.id, ...group.panels.map(panel => panel.id)]));
  const id = (prefix: string) => { let i = 1; while (used.has(`${prefix}-${i}`)) i++; const result = `${prefix}-${i}`; used.add(result); return result; };
  for (const symbol of missing) groups.push({ id: id("ticker"), symbol, panels: [{ id: id("chart"), timeframe: defaultTimeframe }] });
  const ordered = wanted.map(symbol => groups.find(group => group.symbol === symbol)!);
  return { ...layout, version: 1, groups: ordered, selectedPanel: ordered.some(group => group.panels.some(panel => panel.id === layout.selectedPanel)) ? layout.selectedPanel : ordered[0]?.panels[0].id ?? null };
}
export function removeChartPanel(layout: ChartMultiview, id: string): ChartMultiview {
  const groups = layout.groups.map(group => ({ ...group, panels: group.panels.filter(panel => panel.id !== id) })).filter(group => group.panels.length);
  return { ...layout, version: 1, groups, selectedPanel: layout.selectedPanel === id ? groups[0]?.panels[0].id ?? null : layout.selectedPanel };
}
export function changeChartTimeframe(layout: ChartMultiview, id: string, timeframe: ChartTimeframe): ChartMultiview {
  return parseChartMultiview({ ...layout, groups: layout.groups.map(group => ({ ...group, panels: group.panels.map(panel => panel.id === id ? { ...panel, timeframe } : panel) })) });
}

export const phoneChartLayout = (layout: ChartMultiview, landscape: boolean) => landscape ? layout.landscapeLayout ?? layout.mobileLayout ?? "tabs" : layout.mobileLayout ?? "tabs";
