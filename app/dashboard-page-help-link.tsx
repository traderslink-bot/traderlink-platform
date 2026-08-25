"use client";

import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { dashboardHelpTarget } from "./dashboard-navigation";

const publicHelpOrigin = "https://traderslink.pro";

export function DashboardPageHelpLink() {
  const target = dashboardHelpTarget(usePathname());
  if (!target) {
    return null;
  }

  const label = `Help for ${target.label}`;

  return (
    <Box sx={{ position: "absolute", right: 0, top: 0 }}>
      <Tooltip title={label}>
        <IconButton
          aria-label={label}
          component={Link}
          href={`${publicHelpOrigin}${target.href}`}
          sx={{
            color: "primary.main",
            minHeight: 44,
            minWidth: 44,
            "&:hover": { bgcolor: "rgba(1, 30, 86, 0.04)" },
          }}
        >
          <HelpOutlineRoundedIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
}
