import type { ChartMultiview } from "@/src/modules/scanner/alpaca/chart-multiview";

export type WorkspaceChartArrangement = {
  order: readonly string[];
  columnSizes?: readonly number[];
  rowSizes?: readonly number[];
};

export type WorkspaceChartLayout = ChartMultiview & { arrangement?: WorkspaceChartArrangement };

function readSizes(value: unknown, minimum: number, maximum: number) {
  if (!Array.isArray(value) || value.length < minimum || value.length > maximum ||
      value.some(size => typeof size !== "number" || !Number.isFinite(size) || size <= 0 || size > 1)) return;
  const total = value.reduce((sum, size) => sum + size, 0);
  if (Math.abs(total - 1) <= 0.001) return value as number[];
}

export function workspaceChartArrangement(layout: ChartMultiview, value?: unknown): WorkspaceChartArrangement {
  const ids = layout.groups.flatMap(group => group.panels.map(panel => panel.id));
  const saved = value && typeof value === "object" ? value as Partial<WorkspaceChartArrangement> : undefined;
  const order = Array.isArray(saved?.order) ? [...new Set(saved.order.filter(id => ids.includes(id)))] : [];
  const columnSizes = readSizes(saved?.columnSizes, 2, 2);
  const rowSizes = readSizes(saved?.rowSizes, 2, 4);
  return {
    order: [...order, ...ids.filter(id => !order.includes(id))],
    ...(columnSizes && { columnSizes }),
    ...(rowSizes && { rowSizes }),
  };
}

export function swapWorkspaceCharts(order: readonly string[], source: string, target: string) {
  if (source === target || !order.includes(source) || !order.includes(target)) return order;
  return order.map(id => id === source ? target : id === target ? source : id);
}

export function workspaceChartTrackSizes(count: number, saved?: readonly number[], minimum = 0) {
  const equal = Array.from({ length: count }, () => 1 / count);
  if (!saved || saved.length !== count || minimum * count >= 1) return equal;
  const excess = saved.map(size => Math.max(0, size - minimum));
  const total = excess.reduce((sum, size) => sum + size, 0);
  return total > 0 ? excess.map(size => minimum + size / total * (1 - count * minimum)) : equal;
}

export function resizeWorkspaceChartTracks(sizes: readonly number[], boundary: number, delta: number, minimum: number) {
  const before = sizes[boundary], after = sizes[boundary + 1];
  const shift = Math.min(after - minimum, Math.max(minimum - before, delta));
  return sizes.map((size, index) => index === boundary ? size + shift : index === boundary + 1 ? size - shift : size);
}
