import type { IPaneApi, Time } from "lightweight-charts";

/** Follow the chart's pane geometry, including separators and the optional volume pane. */
export function observeIndicatorPaneLegends(
  host: HTMLElement,
  panes: readonly IPaneApi<Time>[],
  indicators: readonly { id: string; pane: number }[],
): () => void {
  const nodes = [...host.querySelectorAll<HTMLElement>("[data-chart-indicator-pane]")];
  const legends = indicators.flatMap(({ id, pane }) => {
    const node = nodes.find(legend => legend.dataset.chartIndicatorPane === id);
    return node && panes[pane] ? [{ node, pane: panes[pane] }] : [];
  });
  if (!legends.length) return () => {};

  const layout = () => {
    const top = host.getBoundingClientRect().top;
    for (const { node, pane } of legends) {
      const bounds = pane.getHTMLElement()?.getBoundingClientRect();
      if (!bounds?.height) {
        node.style.removeProperty("--chart-legend-pane-visibility");
        continue;
      }
      node.style.setProperty("--chart-legend-pane-top", `${bounds.top - top + 4}px`);
      node.style.setProperty("--chart-legend-pane-height", `${Math.max(0, bounds.height - 4)}px`);
      node.style.setProperty("--chart-legend-pane-visibility", "visible");
    }
  };
  const observer = new ResizeObserver(layout);
  observer.observe(host);
  for (const pane of panes) {
    const node = pane.getHTMLElement();
    if (node) observer.observe(node);
  }
  layout();
  return () => {
    observer.disconnect();
    for (const { node } of legends) {
      node.style.removeProperty("--chart-legend-pane-top");
      node.style.removeProperty("--chart-legend-pane-height");
      node.style.removeProperty("--chart-legend-pane-visibility");
    }
  };
}
