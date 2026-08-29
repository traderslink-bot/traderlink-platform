"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Image from "next/image";
import Link from "next/link";

const dashboardEntryHref = "https://app.traderslink.pro/dashboard-entry";

export function PublicSiteHeader() {
  return (
    <Box component="header" sx={{ backgroundColor: "common.white", borderBottom: 1, borderColor: "divider" }}>
      <Box sx={{ alignItems: "center", display: "flex", gap: { xs: 0.5, sm: 1.5 }, justifyContent: "space-between", margin: "0 auto", maxWidth: 1440, minHeight: 68, px: { xs: 1.25, sm: 2.5 } }}>
        <Stack direction="row" spacing={{ xs: 0.5, sm: 2 }} sx={{ alignItems: "center", minWidth: 0 }}>
          <Link aria-label="TradersLink home" href="https://traderslink.pro">
            <Image alt="TradersLink" height={30} priority src="/logo-horizontal-light.png" style={{ display: "block", height: "auto", width: "clamp(104px, 16vw, 152px)" }} width={152} />
          </Link>
          <Stack direction="row" spacing={0.25} sx={{ alignItems: "center", display: { xs: "none", sm: "flex" } }}>
            <Button component={Link} href="https://traderslink.pro/news" size="small" variant="text">Market News</Button>
            <Button component={Link} href="https://traderslink.pro/help" size="small" variant="text">Help Center</Button>
          </Stack>
        </Stack>
        <Button component={Link} href={dashboardEntryHref} size="small" sx={{ flexShrink: 0, px: { xs: 1.1, sm: 1.75 }, whiteSpace: "nowrap" }} variant="contained">
          Dashboard
        </Button>
      </Box>
    </Box>
  );
}
