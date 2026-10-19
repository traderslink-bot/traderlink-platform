"use client";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import Image from "next/image";
import { DashboardPage, DashboardPanel, DashboardPrimaryAction } from "@/app/dashboard-template";
import { tradeAnalysisDemoSnapshots, type TradeAnalysisDemoView } from "@/src/modules/platform/contracts/trade-analysis-demo-snapshots";

/** Static captures of the actual Demo account. No data readers or live controls. */
export function TradeAnalysisLockedPreview({ title, view }: { title: string; view: TradeAnalysisDemoView }) {
  const appearance = useTheme().palette.mode === "dark" ? "dark" : "light";
  const snapshots = tradeAnalysisDemoSnapshots.pages[view]?.[appearance];
  return <DashboardPage>
    <Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
      <Typography component="h1" variant="h1">{title}</Typography>
      <Chip label="Demo preview" size="small" variant="outlined" />
    </Stack>
    <Box sx={{ maxWidth: 700 }}>
      <DashboardPanel title="Unlock Trade Analyzer Analysis">
        <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
          <Alert icon={<LockOutlinedIcon />} severity="info">
            Your plan does not include Trade Analyzer Analysis. This preview shows the Demo account. The controls shown in the image are not interactive.
          </Alert>
          <DashboardPrimaryAction href="/plans">View plans and add-ons</DashboardPrimaryAction>
        </Stack>
      </DashboardPanel>
    </Box>
    {snapshots ? <Box sx={{ overflow: "hidden", border: 1, borderColor: "divider", borderRadius: 2, pointerEvents: "none", userSelect: "none" }}>
      {snapshots.desktop.sections.map((desktop, index) => <picture key={desktop.src} style={{ display: "block" }}>
        <source media="(max-width: 899px)" srcSet={snapshots.mobile.sections[index].src} width={snapshots.mobile.sections[index].width} height={snapshots.mobile.sections[index].height} />
        <Image unoptimized src={desktop.src} width={desktop.width} height={desktop.height}
          alt={index === 0 ? `Demo account preview of ${title}. Image controls are not interactive.` : ""} loading="lazy" decoding="async" draggable={false}
          style={{ display: "block", width: "100%", height: "auto" }} />
      </picture>)}
    </Box> : <Alert severity="info">The Demo screenshot for this page is being prepared.</Alert>}
  </DashboardPage>;
}
