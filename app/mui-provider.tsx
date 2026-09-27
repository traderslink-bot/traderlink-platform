"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { PlatformAppearance } from "@/src/modules/platform/contracts/platform-appearance";
import { createTraderMaterialTheme, traderMaterialTheme } from "./mui-theme";

type DashboardAppearanceContextValue = Readonly<{
  appearance: PlatformAppearance;
  setAppearance: (appearance: PlatformAppearance) => void;
}>;

const DashboardAppearanceContext = createContext<DashboardAppearanceContextValue | null>(null);

export function MuiProviders({ children }: { children: ReactNode }) {
  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <ThemeProvider theme={traderMaterialTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}

export function DashboardMuiProviders({
  appearance,
  children,
}: {
  appearance: PlatformAppearance;
  children: ReactNode;
}) {
  const [activeAppearance, setActiveAppearance] = useState(appearance);
  useEffect(() => setActiveAppearance(appearance), [appearance]);
  const setAppearance = useCallback((nextAppearance: PlatformAppearance) => {
    setActiveAppearance(nextAppearance);
  }, []);
  const contextValue = useMemo(() => Object.freeze({
    appearance: activeAppearance,
    setAppearance,
  }), [activeAppearance, setAppearance]);
  const theme = useMemo(
    () => createTraderMaterialTheme(activeAppearance),
    [activeAppearance],
  );
  return (
    <DashboardAppearanceContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline enableColorScheme />
        {children}
      </ThemeProvider>
    </DashboardAppearanceContext.Provider>
  );
}

export function useDashboardAppearance(): DashboardAppearanceContextValue {
  const value = useContext(DashboardAppearanceContext);
  if (!value) throw new Error("Dashboard appearance is unavailable outside its provider.");
  return value;
}

export function useDashboardAppearanceValue(
  fallback: PlatformAppearance,
): PlatformAppearance {
  return useContext(DashboardAppearanceContext)?.appearance ?? fallback;
}
