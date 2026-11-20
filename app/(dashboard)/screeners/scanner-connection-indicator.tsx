"use client";

import SyncRounded from "@mui/icons-material/SyncRounded";
import { IconButton, Tooltip } from "@mui/material";

export function ScannerConnectionIndicator({ phase, onRetry }: { phase: "unavailable" | "reconnecting" | "refreshing" | null; onRetry: () => void }) {
  if (!phase) return null;
  const label = phase === "unavailable" ? "Scanner connection unavailable. Retry connection."
    : phase === "reconnecting" ? "Reconnecting to scanners. Retry connection."
    : "Updating scanner results. Showing last received results.";
  return <Tooltip title={label}>
    <IconButton aria-label={label} onClick={onRetry} size="small"
      sx={{ display: "inline-flex", alignItems: "center", p: 0.5, flexShrink: 0, color: phase === "unavailable" ? "error.main" : "warning.main" }}>
      <SyncRounded sx={{ fontSize: 18 }} />
    </IconButton>
  </Tooltip>;
}
