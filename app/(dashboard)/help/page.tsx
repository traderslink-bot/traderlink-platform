import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import Link from "next/link";

import { DashboardPage, DashboardPanel } from "../../dashboard-template";
import {
  HELP_SEARCH_RECORDS,
  helpPopularRecords,
} from "@/src/modules/help/help-content-registry";
import { HelpSearch } from "./help-search";

export const metadata: Metadata = {
  description: "Search TraderLink help and learn how to use the Daily Trade Tracker.",
  title: "Help Center | TraderLink Platform",
};

export default function HelpCenterPage() {
  const popularRecords = helpPopularRecords();

  return (
    <DashboardPage>
      <Box
        sx={{
          background: "linear-gradient(135deg, rgba(1, 30, 86, 0.08), rgba(25, 118, 210, 0.035))",
          border: 1,
          borderColor: "divider",
          borderRadius: 2,
          p: { xs: 2.25, sm: 3 },
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
          <Box sx={{ alignItems: "center", bgcolor: "primary.main", borderRadius: 1.5, color: "common.white", display: "flex", height: 42, justifyContent: "center", width: 42 }}>
            <HelpOutlineRoundedIcon />
          </Box>
          <Box>
            <Typography component="h1" variant="h1">Help Center</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.4 }} variant="body2">
              Find clear answers and learn how TraderLink features work.
            </Typography>
          </Box>
        </Stack>
        <Box sx={{ maxWidth: 820, mt: 2.5 }}>
          <HelpSearch records={HELP_SEARCH_RECORDS} />
        </Box>
      </Box>

      <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1.15fr) minmax(320px, 0.85fr)" } }}>
        <Card variant="outlined">
          <Link href="/help/daily-trade-tracker" style={{ color: "inherit", textDecoration: "none" }}>
            <CardActionArea component="div" sx={{ height: "100%" }}>
              <CardContent sx={{ p: { xs: 2.25, sm: 2.75 }, "&:last-child": { pb: { xs: 2.25, sm: 2.75 } } }}>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                  <Box sx={{ alignItems: "center", bgcolor: "rgba(1, 30, 86, 0.08)", borderRadius: 1.5, color: "primary.main", display: "flex", flexShrink: 0, height: 44, justifyContent: "center", width: 44 }}>
                    <TodayRoundedIcon />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
                      Available guide
                    </Typography>
                    <Typography component="h2" sx={{ mt: 0.35 }} variant="h2">
                      Daily Trade Tracker
                    </Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                      Learn how executions become trades, review charts and analysis, use rules and notes, and finish your trading day.
                    </Typography>
                    <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", color: "primary.main", mt: 2 }}>
                      <Typography sx={{ fontWeight: 800 }} variant="body2">Open guide</Typography>
                      <ArrowForwardRoundedIcon fontSize="small" />
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </CardActionArea>
          </Link>
        </Card>

        <DashboardPanel title="Popular help">
          <Stack divider={<Divider flexItem />}>
            {popularRecords.map((record) => (
              <Link href={record.href} key={record.id} style={{ textDecoration: "none" }}>
                <Button
                  component="span"
                  endIcon={<ArrowForwardRoundedIcon />}
                  fullWidth
                  sx={{ justifyContent: "space-between", px: 0.5, py: 1.15, textAlign: "left" }}
                  variant="text"
                >
                  {record.title}
                </Button>
              </Link>
            ))}
          </Stack>
        </DashboardPanel>
      </Box>
    </DashboardPage>
  );
}
