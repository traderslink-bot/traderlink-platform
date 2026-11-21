"use client";

import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

/** Keep the tooltip and its ref-bearing trigger within the same client boundary. */
export function GainerDollarVolumeHeading() {
  return <Box component="span" sx={{ display: "inline-flex", alignItems: "center", whiteSpace: "nowrap" }}>
    $Vol
    <Tooltip describeChild title="Estimated dollars traded (share volume × volume-weighted average price). This total can include postmarket trades.">
      <IconButton size="small" aria-label="About dollar volume">
        <InfoOutlinedIcon sx={{ fontSize: 15 }} />
      </IconButton>
    </Tooltip>
  </Box>;
}
