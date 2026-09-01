"use client";

import { useEffect, useState, type ReactNode } from "react";

import { DashboardMuiProviders } from "../mui-provider";
import { isPlatformAppearance, type PlatformAppearance } from "@/src/modules/platform/contracts/platform-appearance";
import { readPlatformOfflineDeviceState } from "@/src/modules/platform/client/pwa/offline-projection-store";

export function OfflineAppearanceBoundary({ children }: { children: ReactNode }) {
  const [appearance, setAppearance] = useState<PlatformAppearance | null>(null);

  useEffect(() => {
    let mounted = true;
    void readPlatformOfflineDeviceState().then((state) => {
      if (mounted) setAppearance(isPlatformAppearance(state?.appearance) ? state.appearance : "light");
    }).catch(() => {
      if (mounted) setAppearance("light");
    });
    return () => {
      mounted = false;
    };
  }, []);

  if (appearance === null) return null;
  return <DashboardMuiProviders appearance={appearance}>{children}</DashboardMuiProviders>;
}
