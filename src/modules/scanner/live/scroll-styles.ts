import type { Theme } from "@mui/material/styles";

/** Local scanner scrollbars only; no global browser-scrollbar override. */
export function scannerScrollStyles(theme: Theme) {
  const dark = theme.palette.mode === "dark";
  const thumb = dark ? "rgba(178,192,218,0.42)" : "rgba(51,73,105,0.32)";
  return {
    overflowY: "auto" as const, overflowX: "auto" as const,
    scrollbarWidth: "thin" as const, scrollbarColor: `${thumb} transparent`,
    "&::-webkit-scrollbar": { width: 5, height: 5 },
    "&::-webkit-scrollbar-track": { backgroundColor: "transparent" },
    "&::-webkit-scrollbar-thumb": { backgroundColor: thumb, borderRadius: 8 },
    "&::-webkit-scrollbar-thumb:hover": { backgroundColor: dark ? "rgba(178,192,218,0.65)" : "rgba(51,73,105,0.55)" },
  };
}


// Mark only the ticker column and its flag cell. Controls stay in normal table flow.
export const scannerStickyTickerSx = {
  '& [data-scanner-sticky-ticker]': {
    position: "sticky",
    left: 0,
    zIndex: 2,
    bgcolor: "background.paper",
    borderRight: 1,
    borderRightColor: "divider",
  },
  '& thead [data-scanner-sticky-ticker]': { zIndex: 4 },
} as const;
