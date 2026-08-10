import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActionArea from "@mui/material/CardActionArea";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";
import Link from "next/link";

import { DashboardPage, DashboardPanel } from "../../../dashboard-template";
import { DAILY_TRADE_TRACKER_HELP_GUIDES } from "@/src/modules/help/daily-trade-tracker-guides";

export const metadata: Metadata = {
  description: "Learn the Daily Trade Tracker workflow from executions through day review.",
  title: "Daily Trade Tracker Help | TraderLink Platform",
};

const workflowSteps = Object.freeze([
  Object.freeze({
    description: "Enter the exact fills shown by your broker for one Eastern Time trading date.",
    id: "add-trades",
    title: "Add trades",
  }),
  Object.freeze({
    description: "Open each ticker, select the trade you want and review every buy or sell execution.",
    id: "review-trades",
    title: "Review trades",
  }),
  Object.freeze({
    description: "Study execution markers, candles, volume, indicators, patterns and written analysis.",
    id: "charts-analysis",
    title: "Use charts and analysis",
  }),
  Object.freeze({
    description: "Review trade and daily rules, add tags, and write trade and Daily Notes.",
    id: "rules-notes",
    title: "Record what happened",
  }),
  Object.freeze({
    description: "Classify open positions and mark the day reviewed when your journaling is complete.",
    id: "finish-day",
    title: "Finish the day",
  }),
]);

const pageAreas = Object.freeze([
  Object.freeze({ title: "Week and trading day", description: "Move between traded dates and see day and week results." }),
  Object.freeze({ title: "Ticker cards", description: "All completed trades for the same symbol stay together." }),
  Object.freeze({ title: "Selected trade", description: "Trade 1, Trade 2 or another selection controls the chart and expanded details for that ticker." }),
  Object.freeze({ title: "Executions", description: "Every accepted broker fill remains visible, including adds and partial exits." }),
  Object.freeze({ title: "Day review", description: "Daily rules, notes and open-position choices complete the journaling workflow." }),
]);

const analysisAreas = Object.freeze([
  Object.freeze({ title: "Entries and exits", description: "Open View analysis beside any execution or use the Combined overview for the complete trade." }),
  Object.freeze({ title: "Charts", description: "Switch between 1-minute, 5-minute, 15-minute and 1-hour candles without changing saved executions." }),
  Object.freeze({ title: "Market context", description: "Review volume, turnover, Session VWAP, EMA 9 and supported candle patterns." }),
  Object.freeze({ title: "Trade path", description: "See favorable and adverse movement, holding time, Green-to-red behavior and profit opportunities." }),
  Object.freeze({ title: "Data updates", description: "Same-day analysis uses available candles and may receive one final update after the session." }),
]);

function HelpFeatureList({ items }: { items: readonly Readonly<{ description: string; title: string }>[] }) {
  return (
    <Stack spacing={1.4}>
      {items.map((item) => (
        <Stack direction="row" key={item.title} spacing={1} sx={{ alignItems: "flex-start" }}>
          <CheckCircleOutlineRoundedIcon color="primary" fontSize="small" sx={{ mt: 0.2 }} />
          <Box>
            <Typography sx={{ fontWeight: 800 }} variant="body2">{item.title}</Typography>
            <Typography color="text.secondary" variant="body2">{item.description}</Typography>
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}

export default function DailyTradeTrackerHelpPage() {
  return (
    <DashboardPage>
      <Box>
        <Breadcrumbs aria-label="Help breadcrumb" sx={{ mb: 1.25 }}>
          <Link href="/help">Help Center</Link>
          <Typography color="text.primary">Daily Trade Tracker</Typography>
        </Breadcrumbs>
        <Typography component="h1" variant="h1">Daily Trade Tracker</Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 780, mt: 1 }} variant="body2">
          Use one page to record a trading day, review every trade and execution, study the chart, and save what you want to improve.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ mt: 2 }}>
          <Link href="/trade-tracker" style={{ textDecoration: "none" }}>
            <Button component="span" endIcon={<ArrowForwardRoundedIcon />} fullWidth variant="contained">
              Open Daily Trade Tracker
            </Button>
          </Link>
          <Link href="/rules" style={{ textDecoration: "none" }}>
            <Button component="span" fullWidth variant="outlined">
              Open Trading Rules
            </Button>
          </Link>
          <Link href="/help/trade-analyzer" style={{ textDecoration: "none" }}>
            <Button component="span" fullWidth variant="outlined">
              Open Trade Analyzer help
            </Button>
          </Link>
        </Stack>
      </Box>

      <DashboardPanel title="The daily workflow">
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", lg: "repeat(5, minmax(0, 1fr))" } }}>
          {workflowSteps.map((step, index) => (
            <Card id={step.id} key={step.id} sx={{ scrollMarginTop: 92 }} variant="outlined">
              <CardContent sx={{ p: 1.75, "&:last-child": { pb: 1.75 } }}>
                <Box sx={{ alignItems: "center", bgcolor: "primary.main", borderRadius: "50%", color: "common.white", display: "flex", fontSize: 13, fontWeight: 900, height: 28, justifyContent: "center", width: 28 }}>
                  {index + 1}
                </Box>
                <Typography sx={{ fontWeight: 850, mt: 1.25 }} variant="body1">{step.title}</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.6 }} variant="body2">{step.description}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </DashboardPanel>

      <DashboardPanel title="Daily Trade Tracker guides">
        <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}>
          {DAILY_TRADE_TRACKER_HELP_GUIDES.map((guide, index) => (
            <Link href={`/help/daily-trade-tracker/${guide.slug}`} key={guide.slug} style={{ color: "inherit", textDecoration: "none" }}>
              <Card sx={{ height: "100%" }} variant="outlined">
                <CardActionArea component="div" sx={{ height: "100%" }}>
                  <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start" }}>
                      <Box sx={{ alignItems: "center", bgcolor: "rgba(1, 30, 86, 0.08)", borderRadius: "50%", color: "primary.main", display: "flex", flexShrink: 0, fontSize: 13, fontWeight: 900, height: 30, justifyContent: "center", width: 30 }}>
                        {index + 1}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 850 }} variant="body1">{guide.title}</Typography>
                        <Typography color="text.secondary" sx={{ mt: 0.45 }} variant="body2">{guide.description}</Typography>
                        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "primary.main", mt: 1.1 }}>
                          <Typography sx={{ fontWeight: 800 }} variant="caption">Read guide</Typography>
                          <ArrowForwardRoundedIcon fontSize="small" />
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Link>
          ))}
        </Box>
      </DashboardPanel>

      <Box sx={{ display: "grid", gap: 2.5, gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" } }}>
        <DashboardPanel title="How the page is organized">
          <HelpFeatureList items={pageAreas} />
        </DashboardPanel>
        <DashboardPanel title="What the analysis covers">
          <HelpFeatureList items={analysisAreas} />
          <Typography color="text.secondary" sx={{ mt: 1.5 }} variant="body2">
            Chart replay and written analysis are the embedded Trade Analyzer. Use the Trade Analyzer Help collection for complete metric, pattern and long-term result definitions.
          </Typography>
        </DashboardPanel>
      </Box>

      <Card id="data-updates" sx={{ bgcolor: "rgba(1, 30, 86, 0.045)", scrollMarginTop: 92 }} variant="outlined">
        <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } } }}>
          <Typography component="h2" variant="h2">Good to know</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
            Same-day analysis uses the candles available at the time. Moomoo may finalize those candles after the session, so TradersLink performs one final update to the chart and analysis.
          </Typography>
        </CardContent>
      </Card>
    </DashboardPage>
  );
}
