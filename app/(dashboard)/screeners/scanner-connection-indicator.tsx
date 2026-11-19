"use client";

import SyncRounded from "@mui/icons-material/SyncRounded";
import { Box, Tooltip } from "@mui/material";

export function ScannerConnectionIndicator({ phase }: { phase: "unavailable" | "reconnecting" | "refreshing" | null }) {
  if (!phase) return null;
  const label = phase === "unavailable" ? "Scanner connection unavailable."
    : phase === "reconnecting" ? "Reconnecting to scanners. Showing last received results."
    : "Updating scanner results. Showing last received results.";
  return <Tooltip title={label}>
    <Box role="status" aria-live="polite" aria-label={label} tabIndex={0}
      sx={{ display: "inline-flex", alignItems: "center", p: 0.5, flexShrink: 0, color: phase === "unavailable" ? "error.main" : "warning.main" }}>
      <SyncRounded sx={{ fontSize: 18 }} />
    </Box>
  </Tooltip>;
}
