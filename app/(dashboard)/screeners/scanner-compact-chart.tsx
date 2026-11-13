"use client";

import Box from "@mui/material/Box";
import Skeleton from "@mui/material/Skeleton";
import { createContext, lazy, Suspense, useContext, useEffect, useRef, useState } from "react";
import type { ChartTimeframe } from "@/src/modules/scanner/alpaca/candles";
import { DashboardPanel } from "@/app/dashboard-template";
import type { ScannerWorkspaceSlotId } from "./scanner-workspace-layout";
import { ScannerWorkspaceCard } from "./scanner-workspace-card";

const Chart = lazy(() => import("../charts/alpaca-lightweight-chart").then(module => ({default:module.AlpacaLightweightChart})));

const Covered = createContext(false);
export const ScannerCompactChartCovered = Covered.Provider;

export function ScannerCompactChart({ symbol, slot }: { symbol: string | null; slot: ScannerWorkspaceSlotId }) {
  const covered = useContext(Covered);
  const viewport = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [ticker, setTicker] = useState<string>();
  const [timeframe, setTimeframe] = useState<ChartTimeframe>();

  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!symbol || covered || !visible || ticker) return;
    // Allow the committed scanner rows to paint before mounting the chart.
    let next = 0;
    const frame = requestAnimationFrame(() => {
      next = requestAnimationFrame(() => {
        setTicker(symbol);
      });
    });
    return () => {
      cancelAnimationFrame(frame);
      cancelAnimationFrame(next);
    };
  }, [symbol, covered, visible, ticker]);

  const fallback = <Skeleton animation={false} variant="rectangular" sx={{height:"100%"}}/>;
  return <ScannerWorkspaceCard slot={slot} widget="ticker-workspace">
    <DashboardPanel hideHeader>
      <Box ref={viewport} aria-label="Scanner chart" sx={{height:{xs:320,md:"auto"},flex:1,minHeight:0}}>
        {ticker && visible && !covered ? <Suspense fallback={fallback}>
          <Chart symbol={ticker} timeframe={timeframe} onTimeframeChange={setTimeframe}
            viewId="scanner-page-chart" viewWorkspace="scanner" compactMobile compactToolbar/>
        </Suspense> : fallback}
      </Box>
    </DashboardPanel>
  </ScannerWorkspaceCard>;
}
