import type { Metadata } from "next";
import { TradeAnalysisDebugClient } from "./trade-analysis-debug-client";

export const metadata: Metadata = {
  title: "Trade Analysis Debug | Trader Intelligence",
};

export default function TradeAnalysisDebugPage() {
  return <TradeAnalysisDebugClient />;
}
