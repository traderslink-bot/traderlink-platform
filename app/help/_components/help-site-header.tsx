"use client";

import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import KeyboardArrowDownRoundedIcon from "@mui/icons-material/KeyboardArrowDownRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

const platformOrigin = "https://app.traderslink.pro";

export function HelpSiteHeader() {
  const [accountAnchor, setAccountAnchor] = useState<HTMLElement | null>(null);

  return (
    <Box component="header" sx={{ backgroundColor: "common.white", borderBottom: 1, borderColor: "divider" }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: { xs: 0.5, sm: 1.5 }, justifyContent: "space-between", margin: "0 auto", maxWidth: 1440, minHeight: 68, px: { xs: 1.25, sm: 2.5 } }}>
        <Stack direction="row" spacing={{ xs: 0.5, sm: 2 }} sx={{ alignItems: "center", minWidth: 0 }}>
          <Link aria-label="TradersLink home" href="https://traderslink.pro">
            <Image alt="TradersLink" height={30} priority src="/logo-horizontal-main.png" style={{ display: "block", height: "auto", width: "clamp(104px, 16vw, 152px)" }} width={152} />
          </Link>
          <Stack direction="row" spacing={0.25} sx={{ alignItems: "center", display: { xs: "none", sm: "flex" } }}>
            <Button component={Link} href="https://traderslink.pro/academy" size="small" variant="text">Academy</Button>
            <Button component={Link} href="/help" size="small" variant="text">Help Center</Button>
          </Stack>
        </Stack>
        <Stack direction="row" spacing={{ xs: 0.25, sm: 0.75 }} sx={{ alignItems: "center", flexShrink: 0 }}>
          <Button component={Link} href={`${platformOrigin}/workspace`} size="small" variant="contained" sx={{ px: { xs: 1.1, sm: 1.75 }, whiteSpace: "nowrap" }}>
            <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>Trade Tracker</Box>
            <Box component="span" sx={{ display: { sm: "none" } }}>Tracker</Box>
          </Button>
          <Tooltip title="Account">
            <IconButton aria-controls={accountAnchor ? "help-account-menu" : undefined} aria-expanded={Boolean(accountAnchor)} aria-haspopup="menu" aria-label="Account" color="primary" onClick={(event) => setAccountAnchor(event.currentTarget)}>
              <AccountCircleOutlinedIcon />
            </IconButton>
          </Tooltip>
          <IconButton aria-label="Open account menu" color="primary" onClick={(event) => setAccountAnchor(event.currentTarget)} size="small" sx={{ display: { xs: "none", sm: "inline-flex" } }}>
            <KeyboardArrowDownRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Box>
      <Menu anchorEl={accountAnchor} id="help-account-menu" onClose={() => setAccountAnchor(null)} open={Boolean(accountAnchor)}>
        <MenuItem component={Link} href={`${platformOrigin}/workspace`} onClick={() => setAccountAnchor(null)}>Trade Tracker</MenuItem>
        <MenuItem component={Link} href={`${platformOrigin}/account`} onClick={() => setAccountAnchor(null)}>Account</MenuItem>
        <MenuItem component={Link} href={`${platformOrigin}/api/auth/discord/login?returnTo=%2Fworkspace`} onClick={() => setAccountAnchor(null)}>Log in with Discord</MenuItem>
      </Menu>
    </Box>
  );
}
