import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import HelpOutlineRoundedIcon from "@mui/icons-material/HelpOutlineRounded";
import NotificationsNoneRoundedIcon from "@mui/icons-material/NotificationsNoneRounded";
import SmartToyOutlinedIcon from "@mui/icons-material/SmartToyOutlined";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";
import ShowChartRoundedIcon from "@mui/icons-material/ShowChartRounded";
import RuleRoundedIcon from "@mui/icons-material/RuleRounded";
import WorkspacePremiumOutlinedIcon from "@mui/icons-material/WorkspacePremiumOutlined";
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
  description: "Search TraderLink help for Trading Rules, Trade Tracker, Trade Analyzer, AI Reviews, notifications, imports and paid access.",
  title: "Help Center | TraderLink Platform",
};

const HELP_COLLECTIONS = Object.freeze([
  Object.freeze({
    description: "Replay trades and understand entry, exit, Green-to-red, candle-pattern and long-term Analyzer results.",
    href: "/help/trade-analyzer",
    Icon: ShowChartRoundedIcon,
    title: "Trade Analyzer",
  }),
  Object.freeze({
    description: "Learn how executions become trades, review charts and analysis, use rules and notes, and finish your trading day.",
    href: "/help/daily-trade-tracker",
    Icon: TodayRoundedIcon,
    title: "Daily Trade Tracker",
  }),
  Object.freeze({
    description: "Choose preset or custom rules, review automatic evidence, and compare factual results over time.",
    href: "/help/trading-rules",
    Icon: RuleRoundedIcon,
    title: "Trading Rules",
  }),
  Object.freeze({
    description: "Choose a review schedule, understand what AI can use, and turn saved weekly and monthly feedback into a practical next focus.",
    href: "/help/ai-reviews",
    Icon: SmartToyOutlinedIcon,
    title: "AI Reviews",
  }),
  Object.freeze({
    description: "Learn how the wider TraderLink paid plan works, connect Whop, manage billing and fix access problems.",
    href: "/help/paid-plan",
    Icon: WorkspacePremiumOutlinedIcon,
    title: "Paid plan and billing",
  }),
  Object.freeze({
    description: "Find updates, choose Discord messages and finish a statement that needs help.",
    href: "/help/notifications-and-imports",
    Icon: NotificationsNoneRoundedIcon,
    title: "Notifications and imports",
  }),
]);

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
        <Stack spacing={1.5}>
          {HELP_COLLECTIONS.map((collection) => {
            const Icon = collection.Icon;
            return (
              <Card key={collection.href} variant="outlined">
                <Link href={collection.href} style={{ color: "inherit", textDecoration: "none" }}>
                  <CardActionArea component="div" sx={{ height: "100%" }}>
                    <CardContent sx={{ p: { xs: 2.25, sm: 2.75 }, "&:last-child": { pb: { xs: 2.25, sm: 2.75 } } }}>
                      <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                        <Box sx={{ alignItems: "center", bgcolor: "rgba(1, 30, 86, 0.08)", borderRadius: 1.5, color: "primary.main", display: "flex", flexShrink: 0, height: 44, justifyContent: "center", width: 44 }}>
                          <Icon />
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
                            Available guide
                          </Typography>
                          <Typography component="h2" sx={{ mt: 0.35 }} variant="h2">
                            {collection.title}
                          </Typography>
                          <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
                            {collection.description}
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
            );
          })}
        </Stack>

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
