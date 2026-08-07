"use client";

import { DashboardPrimaryAction } from "../../dashboard-template";

export function MoomooConnectionSettings({
  state,
}: {
  state: "active" | "reauthorization_required" | "revoked" | null;
}) {
  if (state === "active") return null;

  return (
    <DashboardPrimaryAction component="a" href="/api/connections/moomoo/start" sx={{ mt: 1.5 }}>
      {state === "reauthorization_required" ? "Reconnect Moomoo" : "Connect Moomoo"}
    </DashboardPrimaryAction>
  );
}
