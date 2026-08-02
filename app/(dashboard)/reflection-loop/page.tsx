import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import type { Metadata } from "next";

import {
  DashboardDataScopeChip,
  DashboardMetricCard,
  DashboardPage,
  DashboardPanel,
  DashboardUnavailableState,
} from "../../dashboard-template";
import { formatJournalAnalyticsDecimal } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import type { CoachReflectionPeriod } from "@/src/modules/coach/contracts/reflection-loop-contracts";
import { parseCoachReflectionRequest } from "@/src/modules/coach/server/coach-reflection-request";
import { readCoachReflection } from "@/src/modules/coach/server/coach-reflection-runtime";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

export const metadata: Metadata = {
  title: "Reflection Loop | TraderLink Platform",
  description: "Review factual Journal results and your own saved notes, tags and trading-rule reviews.",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

function periodHref(
  period: CoachReflectionPeriod,
  date: string,
  currency: string | null,
): string {
  const parameters = new URLSearchParams({ period, date });
  if (currency) parameters.set("currency", currency);
  return `/reflection-loop?${parameters.toString()}`;
}

function money(value: string | null, currency: string | null): string {
  return value === null || currency === null
    ? "Unavailable"
    : `${currency} ${value.startsWith("-") ? "" : "+"}${formatJournalAnalyticsDecimal(value)}`;
}

function reviews(value: Readonly<{
  followed: number;
  broken: number;
  notReviewed: number;
}>): string {
  return `${value.followed} followed · ${value.broken} broken · ${value.notReviewed} not reviewed`;
}

export default async function ReflectionLoopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const request = parseCoachReflectionRequest(await searchParams);
  const scope = await requireTraderLinkPlatformPageScope();
  const model = readCoachReflection(scope, request);

  return (
    <DashboardPage>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}
      >
        <Box>
          <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
            Review workflow
          </Typography>
          <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">
            Reflection Loop
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 820, mt: 1 }} variant="body2">
            Review verified trading facts beside the notes, tags and rule reviews you authored. TraderLink does not turn missing notes into an automated behavior judgment.
          </Typography>
        </Box>
        <Stack spacing={1} sx={{ alignItems: { md: "flex-end" } }}>
          <DashboardDataScopeChip />
          <Stack aria-label="Reflection period" direction="row" spacing={0.75}>
            {(["daily", "weekly", "monthly"] as const).map((period) => (
              <Button
                href={periodHref(period, model.anchorDate, model.currency)}
                key={period}
                variant={model.period === period ? "contained" : "outlined"}
              >
                {period[0].toUpperCase() + period.slice(1)}
              </Button>
            ))}
          </Stack>
        </Stack>
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ flexWrap: "wrap" }}>
        <Chip label={`${model.startDate} to ${model.endDate}`} variant="outlined" />
        <Chip label={model.currency ?? "No currency partition"} variant="outlined" />
        <Chip label={model.timezone ?? "Timezone unavailable"} variant="outlined" />
      </Stack>

      <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(5, minmax(0, 1fr))" } }}>
        <DashboardMetricCard caption="Ready-closed facts only" label="Net result" value={money(model.summary.netPnlDecimal, model.currency)} />
        <DashboardMetricCard caption={`${model.summary.tradingDayCount} trading days`} label="Completed trades" value={String(model.summary.readyClosedTradeCount)} />
        <DashboardMetricCard caption="Ready trades with known outcomes" label="Win rate" value={model.summary.winRatePercentDecimal === null ? "Unavailable" : `${formatJournalAnalyticsDecimal(model.summary.winRatePercentDecimal)}%`} />
        <DashboardMetricCard caption="Trader-authored day reflections" label="Day notes" value={`${model.summary.dailyNotesSavedCount}/${model.summary.tradingDayCount}`} />
        <DashboardMetricCard caption="Kept outside unsupported calculations" label="Data Decisions" value={String(model.summary.accountPendingDataDecisionCount)} />
      </Box>

      <DashboardPanel title="Next review actions">
        {model.prompts.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No incomplete reflection items were found for this period.
          </Typography>
        ) : (
          <Stack
            spacing={1.5}
            sx={{ "& > :not(:first-of-type)": { borderColor: "divider", borderTop: 1, pt: 1.5 } }}
          >
            {model.prompts.map((prompt) => (
              <Stack
                direction={{ xs: "column", sm: "row" }}
                key={prompt.code}
                spacing={1.5}
                sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
              >
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>{prompt.title}</Typography>
                  <Typography color="text.secondary" variant="body2">{prompt.description}</Typography>
                </Box>
                <Button href={prompt.href} variant="outlined">
                  {prompt.count > 0 ? `Review ${prompt.count}` : "Open"}
                </Button>
              </Stack>
            ))}
          </Stack>
        )}
      </DashboardPanel>

      <DashboardPanel title="Focus rules">
        {model.focusRules.length === 0 ? (
          <DashboardUnavailableState
            actionHref="/rules"
            actionLabel="Choose a focus rule"
            compact
            description="No active focus rule is selected. This is a trader-controlled choice, not an engine decision."
            title="No focus rule selected"
          />
        ) : (
          <Stack
            spacing={1.5}
            sx={{ "& > :not(:first-of-type)": { borderColor: "divider", borderTop: 1, pt: 1.5 } }}
          >
            {model.focusRules.map((rule) => (
              <Box key={rule.ruleId}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                  <Typography sx={{ fontWeight: 800 }}>{rule.title}</Typography>
                  <Chip label={rule.reviewScope} size="small" variant="outlined" />
                </Stack>
                <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                  {rule.statement}
                </Typography>
              </Box>
            ))}
          </Stack>
        )}
      </DashboardPanel>

      <DashboardPanel title="Trading-day review">
        {model.days.length === 0 ? (
          <DashboardUnavailableState
            actionHref="/trade-tracker"
            actionLabel="Open Trade Tracker"
            description="No analytics-ready closed trades are available in this period. Open positions remain in Open Positions, and unresolved chains remain in Data Decisions."
            title="No completed trades in this period"
          />
        ) : (
          <Stack
            spacing={2}
            sx={{ "& > :not(:first-of-type)": { borderColor: "divider", borderTop: 1, pt: 2 } }}
          >
            {model.days.map((day) => (
              <Box key={day.date}>
                <Stack
                  direction={{ xs: "column", md: "row" }}
                  spacing={1}
                  sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}
                >
                  <Box>
                    <Typography sx={{ fontWeight: 850 }}>{day.date}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {day.tradeCount} trades · {money(day.netPnlDecimal, day.currency)} · {day.dailyNoteSaved ? "day note saved" : "day note not saved"}
                    </Typography>
                  </Box>
                  <Button href={`/trade-tracker/${encodeURIComponent(day.date)}`} variant="outlined">
                    Review day
                  </Button>
                </Stack>
                <Typography color="text.secondary" sx={{ mt: 1 }} variant="caption">
                  Day rule reviews: {reviews(day.ruleReviews)}
                </Typography>
                <TableContainer sx={{ mt: 1.5 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Trade</TableCell>
                        <TableCell>Direction</TableCell>
                        <TableCell align="right">Net P/L</TableCell>
                        <TableCell>Trade note</TableCell>
                        <TableCell>Tags</TableCell>
                        <TableCell>Rule reviews</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {day.trades.map((trade) => (
                        <TableRow key={trade.roundTripId}>
                          <TableCell sx={{ fontWeight: 750 }}>{trade.symbol}</TableCell>
                          <TableCell sx={{ textTransform: "capitalize" }}>{trade.direction}</TableCell>
                          <TableCell align="right">{money(trade.netPnlDecimal, day.currency)}</TableCell>
                          <TableCell>{trade.noteSaved ? "Saved" : "Not saved"}</TableCell>
                          <TableCell>{trade.tagNames.length > 0 ? trade.tagNames.join(", ") : "None"}</TableCell>
                          <TableCell>{reviews(trade.ruleReviews)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}
          </Stack>
        )}
      </DashboardPanel>

      <DashboardPanel title="Coverage">
        <Typography color="text.secondary" variant="body2">
          {model.coverage.readyClosedCount} ready closed · {model.coverage.legitimateOpenCount} confirmed open · {model.coverage.needsDecisionCount} need a trader decision. Missing facts restrict only the calculations that depend on them.
        </Typography>
      </DashboardPanel>
    </DashboardPage>
  );
}
