import type { ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";
import { removeChartPanel, selectedChart, singleChart, type ChartMultiview } from "@/src/modules/scanner/alpaca/chart-multiview";

export function workspaceChartPanels(layout: ChartMultiview) {
  const panels = layout.groups.flatMap(group => group.panels.map(panel => ({ group, panel })));
  if (!layout.panelOrder) return panels;
  const order = new Map(layout.panelOrder.map((id, index) => [id, index]));
  return panels.sort((a, b) => (order.get(a.panel.id) ?? 4) - (order.get(b.panel.id) ?? 4));
}

export function replaceWorkspaceChart(layout: ChartMultiview, panelId: string, symbol: string, timeframe?: ChartTimeframe) {
  const panels = workspaceChartPanels(layout);
  const target = panels.find(({ panel }) => panel.id === panelId);
  if (!target || target.group.symbol === symbol) return layout;
  const { group: source } = target;
  const panel = { ...target.panel, timeframe: timeframe ?? target.panel.timeframe };
  const destination = layout.groups.find(group => group.symbol === symbol);
  if (destination?.panels.some(item => item.timeframe === panel.timeframe)) return layout;
  const groups = layout.groups.flatMap(group => {
    if (group === destination) return [{ ...group, panels: [...group.panels, panel] }];
    if (group !== source) return [group];
    if (group.panels.length === 1) return destination ? [] : [{ ...group, symbol, panels: [panel] }];
    const remaining = { ...group, panels: group.panels.filter(item => item.id !== panelId) };
    return destination ? [remaining] : [remaining, { id: crypto.randomUUID(), symbol, panels: [panel] }];
  });
  return { ...layout, groups, selectedPanel: panelId, panelOrder: panels.map(({ panel }) => panel.id) };
}

export function singleWorkspaceChart(layout: ChartMultiview, symbol: string | null, timeframe: ChartTimeframe): ChartMultiview {
  return { ...singleChart(symbol ?? "SPY", timeframe), ...(layout.fullGridAction && { fullGridAction: layout.fullGridAction }) };
}

export function keepSelectedWorkspaceChart(layout: ChartMultiview): ChartMultiview {
  const keep = selectedChart(layout) ?? workspaceChartPanels(layout)[0];
  if (!keep) return layout;
  return { version: 1, groups: [{ ...keep.group, panels: [keep.panel] }], selectedPanel: keep.panel.id,
    ...(layout.fullGridAction && { fullGridAction: layout.fullGridAction }) };
}

export function closeWorkspaceChart(layout: ChartMultiview, id: string): ChartMultiview {
  const visible = workspaceChartPanels(layout);
  const index = visible.findIndex(({ panel }) => panel.id === id);
  if (visible.length < 2 || index < 0) return layout;
  const next = removeChartPanel(layout, id);
  // Keep the active panel if a different one closed. Otherwise show its nearest neighbor.
  return layout.selectedPanel === id
    ? { ...next, selectedPanel: (visible[index + 1] ?? visible[index - 1]).panel.id }
    : next;
}
