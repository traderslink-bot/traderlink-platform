"use client";

import Typography from "@mui/material/Typography";

export function TradeTrackerEmptyNotice() {
  return <Typography sx={{
    color: (theme) => theme.palette.mode === "dark" ? theme.palette.common.white : theme.palette.error.main,
    fontWeight: 700,
    maxWidth: 900,
  }} variant="body2">
    Notes, rules, tags and trade information will appear below after you submit your executions.
  </Typography>;
}
