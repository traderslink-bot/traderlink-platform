"use client";

import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import type { ReactNode } from "react";

import type { PlatformAppearance } from "@/src/modules/platform/contracts/platform-appearance";
import { createTraderMaterialTheme, traderMaterialTheme } from "./mui-theme";

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
  return (
    <ThemeProvider theme={createTraderMaterialTheme(appearance)}>
      <CssBaseline enableColorScheme />
      {children}
    </ThemeProvider>
  );
}
