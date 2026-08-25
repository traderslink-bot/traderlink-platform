"use client";

import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { useState } from "react";

const crispWebsiteId = "1cff0382-21dc-4fc2-992b-95b8899359c3";

let crispConfigured = false;

async function openCrispDashboardSupportChat(): Promise<void> {
  const { Crisp } = await import("crisp-sdk-web");
  if (!crispConfigured) {
    Crisp.configure(crispWebsiteId);
    crispConfigured = true;
  }
  Crisp.chat.open();
}

export function CrispDashboardSupportChat() {
  const [opening, setOpening] = useState(false);

  async function handleOpen() {
    if (opening) return;
    setOpening(true);
    try {
      await openCrispDashboardSupportChat();
    } finally {
      setOpening(false);
    }
  }

  return (
    <Button
      aria-label="Contact support"
      disabled={opening}
      onClick={handleOpen}
      startIcon={<SupportAgentRoundedIcon />}
      sx={{
        bgcolor: "primary.main",
        color: "primary.contrastText",
        flexShrink: 0,
        fontWeight: 800,
        minHeight: 40,
        minWidth: { xs: 44, sm: 144 },
        px: { xs: 0.75, sm: 1.5 },
        whiteSpace: "nowrap",
        "& .MuiButton-startIcon": {
          ml: 0,
          mr: { xs: 0, sm: 0.75 },
        },
        "&:hover": { bgcolor: "primary.dark" },
      }}
      variant="contained"
    >
      <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
        Contact support
      </Box>
    </Button>
  );
}
