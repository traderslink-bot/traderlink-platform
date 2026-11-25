import type { ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";
import type { ChartMultiview } from "@/src/modules/scanner/alpaca/chart-multiview";

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
