"use client";

import Box from "@mui/material/Box";
import type { ReactNode } from "react";

import type { ScannerNewsItem } from "@/src/modules/scanner/live/contracts";

import { ScannerRowNews } from "../scanner-news-drawer-context";
import { ScannerPageChartButton } from "./scanner-page-ticker";

const touchMedia = "@media (max-width:899.95px), (pointer:coarse)";

export function scannerToolColumnSx(allowAdd = false) {
  return {
    width: allowAdd ? 96 : 72,
    [touchMedia]: { width: allowAdd ? 112 : 84 },
  };
}

const rowToolsSx = {
  "--scanner-tool-size": "20px",
  "--scanner-tool-gap": "3.2px",
  [touchMedia]: {
    "--scanner-tool-size": "24px",
    "--scanner-tool-gap": "4px",
  },
  display: "inline-flex",
  alignItems: "center",
  gap: "var(--scanner-tool-gap)",
  flexShrink: 0,
  verticalAlign: "middle",
  "& [data-scanner-chart-launch-controls]": { gap: "var(--scanner-tool-gap)" },
  "& button, & [data-scanner-row-news]": {
    width: "var(--scanner-tool-size)",
    height: "var(--scanner-tool-size)",
    flexShrink: 0,
  },
};

export function ScannerRowTools({ symbol, news, chart, showPageChartOnMobile }: {
  symbol: string;
  news: readonly ScannerNewsItem[];
  chart: ReactNode;
  showPageChartOnMobile?: boolean;
}) {
  return <Box data-scanner-row-tools sx={rowToolsSx}>
    {chart}
    <ScannerPageChartButton symbol={symbol} showOnMobile={showPageChartOnMobile}/>
    <ScannerRowNews news={news}/>
  </Box>;
}
