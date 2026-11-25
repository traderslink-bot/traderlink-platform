"use client";

import { createContext, useContext, type ReactNode } from "react";

const BrokerChartContext = createContext(false);

export function WorkspaceBrokerChartProvider({ children }: { children: ReactNode }) {
  return <BrokerChartContext.Provider value={true}>{children}</BrokerChartContext.Provider>;
}

export function useWorkspaceBrokerChart() {
  return useContext(BrokerChartContext);
}
