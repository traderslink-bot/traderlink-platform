import type { Metadata } from "next";

import { TradeCandleAnalysisPreview } from "./trade-candle-analysis-preview";

export const metadata: Metadata = {
  title: "Trade Candle Analysis | Trader Intelligence",
  description:
    "Experimental candle-path review for profit giveback, exit timing, and entry timing.",
};

export default function TradeCandleAnalysisPage() {
  return <TradeCandleAnalysisPreview />;
}
