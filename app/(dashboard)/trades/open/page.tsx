import type { Metadata } from "next";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import {
  DashboardDataScopeChip,
  DashboardPage,
  DashboardPanel,
} from "../../../dashboard-template";
import { FeatureHelpLink } from "../../feature-help-link";
import { PositionStyleControl } from "../../trade-tracker/position-style-control";
import { positionStatusLabel } from "../../trade-tracker/position-style-labels";
import { getReplacementOpenPositionStyles } from "../../trade-tracker/trade-tracker-platform-data";
import {
  formatJournalAnalyticsDecimal,
  formatJournalAnalyticsMoney,
} from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { withJournalAnalyticsReportingDashboardRuntime } from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import {
  currentJournalAccountSelectionRef,
  requireTraderLinkPlatformPageScope,
} from "@/src/modules/platform/server/authentication/require-platform-request-scope";

export const metadata: Metadata = {
  title: "Open Positions | TraderLink Platform",
};

export const dynamic = "force-dynamic";

function timestamp(value: string, timezone: string): string {
  return new Date(value).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  });
}

function age(milliseconds: number): string {
  const days = Math.floor(milliseconds / 86_400_000);
  if (days > 0) return `${days} day${days === 1 ? "" : "s"}`;
  const hours = Math.floor(milliseconds / 3_600_000);
  if (hours > 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
  const minutes = Math.max(0, Math.floor(milliseconds / 60_000));
  return `${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export default async function OpenPositionsPage() {
  const scope = await requireTraderLinkPlatformPageScope();
  const result = await withJournalAnalyticsReportingDashboardRuntime(scope, ({ dashboard }) =>
    dashboard.getOpenPositions(scope));
  const positionStyles = getReplacementOpenPositionStyles(scope);
  const expectedAccountSelectionRef = currentJournalAccountSelectionRef(scope);

  return (
    <DashboardPage>
      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
            Trades
          </Typography>
          <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">
            Open Positions
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 860, mt: 1 }} variant="body2">
            Confirmed open positions stay visible whether they are active swing trades, long-term holds, unplanned holds (bag holds), or another trader-defined situation. Time held never decides that status automatically.
          </Typography>
        </Box>
        <FeatureHelpLink href="/help/open-positions" label="Open Positions" size="medium" />
      </Stack>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <DashboardDataScopeChip />
        <Chip label={`${result.positions.length} confirmed open`} size="small" variant="outlined" />
      </Stack>

      <DashboardPanel
        action={<Chip label={`${result.positions.length} open`} size="small" variant="outlined" />}
        title="Confirmed open positions"
      >
        {result.positions.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            There are no confirmed open positions. This does not include execution chains waiting for a Data Decision.
          </Typography>
        ) : (
          <>
          <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Opened</TableCell>
                  <TableCell>Ticker</TableCell>
                  <TableCell>Side</TableCell>
                  <TableCell align="right">Quantity</TableCell>
                  <TableCell align="right">Average entry</TableCell>
                  <TableCell align="right">Age</TableCell>
                  <TableCell>Trade status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.positions.map((position) => {
                  const tracking = positionStyles[position.roundTripId] ?? null;
                  return (
                  <TableRow key={position.roundTripId}>
                    <TableCell>{timestamp(position.openedAtUtc, position.timezone)}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{position.symbol}</TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>{position.direction}</TableCell>
                    <TableCell align="right">{formatJournalAnalyticsDecimal(position.remainingQuantityDecimal)}</TableCell>
                    <TableCell align="right">{position.averageEntryPriceDecimal === null ? "Unavailable" : formatJournalAnalyticsMoney(position.averageEntryPriceDecimal, position.currency)}</TableCell>
                    <TableCell align="right">{age(position.ageMilliseconds)}</TableCell>
                    <TableCell>
                      <Chip
                        color={tracking?.style?.openStatus === "swing" ? "primary" : "warning"}
                        label={positionStatusLabel(tracking?.style ?? null)}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <Stack spacing={1} sx={{ display: { xs: "flex", md: "none" } }}>
            {result.positions.map((position) => {
              const tracking = positionStyles[position.roundTripId] ?? null;
              return (
                <Card key={position.roundTripId} variant="outlined">
                  <CardContent>
                    <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                      <Box>
                        <Typography sx={{ fontWeight: 900 }} variant="h6">{position.symbol}</Typography>
                        <Typography color="text.secondary" sx={{ textTransform: "capitalize" }} variant="body2">
                          {position.direction} · {age(position.ageMilliseconds)}
                        </Typography>
                      </Box>
                      <Chip
                        color={tracking?.style?.openStatus === "swing" ? "primary" : "warning"}
                        label={positionStatusLabel(tracking?.style ?? null)}
                        size="small"
                      />
                    </Stack>
                    <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: "repeat(2, minmax(0, 1fr))", mt: 1.5 }}>
                      <Box sx={{ gridColumn: "1 / -1" }}><Typography color="text.secondary" variant="caption">Opened</Typography><Typography variant="body2">{timestamp(position.openedAtUtc, position.timezone)}</Typography></Box>
                      <Box><Typography color="text.secondary" variant="caption">Remaining quantity</Typography><Typography variant="body2">{formatJournalAnalyticsDecimal(position.remainingQuantityDecimal)}</Typography></Box>
                      <Box><Typography color="text.secondary" variant="caption">Average entry</Typography><Typography variant="body2">{position.averageEntryPriceDecimal === null ? "Unavailable" : formatJournalAnalyticsMoney(position.averageEntryPriceDecimal, position.currency)}</Typography></Box>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
          </>
        )}
      </DashboardPanel>

      {result.positions.length > 0 ? (
        <DashboardPanel action={<FeatureHelpLink href="/help/open-positions/choose-status" label="open position types" />} title="Manage open position types">
          <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
            Your choice is shared by Daily Trade Tracker, Swing Trade Tracker, and Open Positions. Time held never changes it automatically.
          </Typography>
          <Stack spacing={2}>
            {result.positions.map((position) => {
              const tracking = positionStyles[position.roundTripId] ?? null;
              if (!tracking) return null;
              return (
                <Box
                  key={position.roundTripId}
                  sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: 2 }}
                >
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1}
                    sx={{ alignItems: { sm: "center" }, justifyContent: "space-between", mb: 1.5 }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 900 }}>{position.symbol}</Typography>
                      <Typography color="text.secondary" variant="body2">
                        {position.direction === "long" ? "Long" : "Short"} · {formatJournalAnalyticsDecimal(position.remainingQuantityDecimal)} remaining
                      </Typography>
                    </Box>
                    <Chip label={positionStatusLabel(tracking.style)} size="small" variant="outlined" />
                  </Stack>
                  <PositionStyleControl
                    closed={false}
                    expectedAccountSelectionRef={expectedAccountSelectionRef}
                    positionRef={tracking.positionRef}
                    sourceUi="open_positions"
                    style={tracking.style}
                  />
                </Box>
              );
            })}
          </Stack>
        </DashboardPanel>
      ) : null}

    </DashboardPage>
  );
}
