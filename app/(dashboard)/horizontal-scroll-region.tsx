"use client";

import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SwipeRoundedIcon from "@mui/icons-material/SwipeRounded";
import Box from "@mui/material/Box";
import TableContainer from "@mui/material/TableContainer";
import Typography from "@mui/material/Typography";
import { type ReactNode, useEffect, useRef, useState } from "react";

export function HorizontalScrollHint({
  label,
  showOnDesktop = false,
}: {
  label: string;
  showOnDesktop?: boolean;
}) {
  return (
    <Box
      sx={{
        alignItems: "center",
        bgcolor: (theme) => theme.palette.mode === "dark" ? theme.palette.action.selected : "rgba(1, 30, 86, 0.055)",
        color: "primary.main",
        display: showOnDesktop ? "flex" : { xs: "flex", md: "none" },
        gap: 0.75,
        px: 1.5,
        py: 1,
      }}
    >
      <SwipeRoundedIcon aria-hidden fontSize="small" />
      <Typography sx={{ fontSize: 13.5, fontWeight: 750, lineHeight: 1.35 }}>
        {label}
      </Typography>
      <ArrowForwardRoundedIcon aria-hidden fontSize="small" sx={{ ml: "auto" }} />
    </Box>
  );
}

export function HorizontalScrollRegion({
  children,
  label,
  maxHeight,
  minTableWidth,
  stickyFirstColumn = false,
}: {
  children: ReactNode;
  label: string;
  maxHeight?: number;
  minTableWidth: number;
  stickyFirstColumn?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateOverflow = () => {
      setHasHorizontalOverflow(container.scrollWidth > container.clientWidth + 1);
    };

    updateOverflow();
    const resizeObserver = new ResizeObserver(updateOverflow);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [minTableWidth]);

  return (
    <Box>
      {hasHorizontalOverflow ? <HorizontalScrollHint label="Scroll sideways to see all columns" showOnDesktop /> : null}
      <TableContainer
        aria-label={`${label}, horizontally scrollable`}
        ref={containerRef}
        role="region"
        tabIndex={0}
        sx={{
          WebkitOverflowScrolling: "touch",
          maxHeight,
          overflowX: "auto",
          overscrollBehaviorX: "contain",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          "& .MuiTable-root": { minWidth: minTableWidth },
          "& .MuiTableSortLabel-root": {
            minHeight: { xs: 40, md: "auto" },
          },
          ...(stickyFirstColumn ? {
            "& .MuiTableHead-root .MuiTableCell-root:first-of-type": {
              bgcolor: (theme) => theme.palette.mode === "dark" ? theme.palette.background.paper : "#f7f9fc",
              boxShadow: { xs: "3px 0 8px rgba(1, 30, 86, 0.08)", md: "none" },
              left: 0,
              position: { xs: "sticky", md: "static" },
              zIndex: 3,
            },
            "& .MuiTableBody-root .MuiTableCell-root:first-of-type": {
              bgcolor: "background.paper",
              boxShadow: { xs: "3px 0 8px rgba(1, 30, 86, 0.08)", md: "none" },
              left: 0,
              position: { xs: "sticky", md: "static" },
              zIndex: 2,
            },
          } : {}),
        }}
      >
        {children}
      </TableContainer>
    </Box>
  );
}
