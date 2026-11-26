"use client";

import { createContext, useState, type ReactNode } from "react";
import { createChartCrosshairLink } from "@/src/modules/scanner/alpaca/chart-linked-crosshair";

export const ChartCrosshairContext = createContext<ReturnType<typeof createChartCrosshairLink> | null>(null);

export function ChartCrosshairGroup({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [link] = useState(createChartCrosshairLink);
  return <ChartCrosshairContext.Provider value={enabled ? link : null}>{children}</ChartCrosshairContext.Provider>;
}
