"use client";

import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

export function FeatureHelpLink({
  href,
  label,
  size = "small",
}: {
  href: string;
  label: string;
  size?: "small" | "medium";
}) {
  const accessibleLabel = `Help for ${label}`;
  return (
    <Tooltip title={accessibleLabel}>
      <IconButton aria-label={accessibleLabel} component="a" href={href} onClick={(event) => event.stopPropagation()} rel="noopener noreferrer" size={size} target="_blank">
        <HelpOutlineRoundedIcon fontSize={size} />
      </IconButton>
    </Tooltip>
  );
}
