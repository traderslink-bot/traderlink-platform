import type { Metadata } from "next";

import Alert from "@mui/material/Alert";
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

import {
  DashboardDataScopeChip,
  DashboardPage,
  DashboardPanel,
} from "../../../dashboard-template";
import { formatJournalAnalyticsDecimal } from "@/src/modules/journal-analytics/presentation/journal-analytics-formatters";
import { withJournalAnalyticsDashboardRuntime } from "@/src/modules/journal-analytics/server/journal-analytics-dashboard-runtime";
import { requireTraderLinkPlatformPageScope } from "@/src/modules/platform/server/authentication/require-platform-request-scope";

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
  const result = withJournalAnalyticsDashboardRuntime(scope, ({ dashboard }) =>
    dashboard.getOpenPositions(scope));

  return (
    <DashboardPage>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
          Trades
        </Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">
          Open Positions
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 860, mt: 1 }} variant="body2">
          Confirmed open positions stay visible whether they are intentional swing trades, unplanned holds, or another trader-defined situation. Time held never decides that status automatically.
        </Typography>
      </Box>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <DashboardDataScopeChip />
        <Chip label={`${result.positions.length} confirmed open`} size="small" variant="outlined" />
        <Chip label={`${result.decisions.length} need a decision`} size="small" variant="outlined" />
      </Stack>

      {result.decisions.length > 0 ? (
        <Alert action={<Button color="inherit" href="/data-decisions" size="small">Review Data Decisions</Button>} severity="warning">
          {result.decisions.length} incomplete trade chain{result.decisions.length === 1 ? " is" : "s are"} excluded from open-position facts until you decide what the statement evidence means.
        </Alert>
      ) : null}

      <DashboardPanel
        action={<Chip label={`${result.positions.length} open`} size="small" variant="outlined" />}
        title="Confirmed open positions"
      >
        {result.positions.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            There are no confirmed open positions. This does not include execution chains waiting for a Data Decision.
          </Typography>
        ) : (
          <TableContainer>
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
                {result.positions.map((position) => (
                  <TableRow key={position.roundTripId}>
                    <TableCell>{timestamp(position.openedAtUtc, position.timezone)}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{position.symbol}</TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>{position.direction}</TableCell>
                    <TableCell align="right">{formatJournalAnalyticsDecimal(position.remainingQuantityDecimal)}</TableCell>
                    <TableCell align="right">{position.averageEntryPriceDecimal === null ? "Unavailable" : `${position.currency} ${formatJournalAnalyticsDecimal(position.averageEntryPriceDecimal)}`}</TableCell>
                    <TableCell align="right">{age(position.ageMilliseconds)}</TableCell>
                    <TableCell><Chip color="warning" label="Not classified" size="small" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DashboardPanel>

      {result.decisions.length > 0 ? (
        <DashboardPanel title="Needs a trader decision">
          <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
            These chains are not confirmed open positions. Review the execution evidence in Data Decisions before they can affect open-position facts.
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Opened</TableCell>
                  <TableCell>Ticker</TableCell>
                  <TableCell>Side</TableCell>
                  <TableCell>Reason</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {result.decisions.map((decision) => (
                  <TableRow key={decision.roundTripId}>
                    <TableCell>{decision.openedAtUtc.replace("T", " ").replace(".000Z", " UTC")}</TableCell>
                    <TableCell sx={{ fontWeight: 800 }}>{decision.symbol}</TableCell>
                    <TableCell sx={{ textTransform: "capitalize" }}>{decision.direction}</TableCell>
                    <TableCell>{decision.reasonCodes.join(", ").replaceAll("_", " ")}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DashboardPanel>
      ) : null}
    </DashboardPage>
  );
}
