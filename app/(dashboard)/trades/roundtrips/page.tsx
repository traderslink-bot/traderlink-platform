import type { Metadata } from "next";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
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
  DashboardUnavailableState,
} from "../../../dashboard-template";
import { requireTraderIntelligenceOwnerPageAccess } from "@/src/lib/trader-intelligence-v3/auth";
import { resolveConfiguredDashboardAnalytics } from "@/src/lib/trader-intelligence-v3/analytics/dashboard/configured-dashboard-analytics";
import { formatDashboardDecimal } from "@/src/lib/trader-intelligence-v3/analytics/dashboard/execution-analytics-dashboard-view-models";
import { validateTraderIntelligenceDeployment } from "@/src/lib/trader-intelligence-v3/deployment";

export const metadata: Metadata = {
  title: "Round Trips | Trader Intelligence",
};

const ACTIVITY_ROW_LIMIT = 100;

export default async function RoundTripsPage() {
  const owner = await requireTraderIntelligenceOwnerPageAccess();
  const deployment = validateTraderIntelligenceDeployment(process.env);
  const analytics = deployment.ok
    ? resolveConfiguredDashboardAnalytics({
        owner,
        config: deployment.config,
        environment: process.env,
      })
    : null;

  if (analytics === null || !analytics.ok) {
    return (
      <DashboardPage>
        <DashboardPanel title="Accepted executions">
          <DashboardUnavailableState
            actionHref="/imports"
            actionLabel="Import trades"
            description="Accepted broker executions will appear here once a verified V3 statement is attached. No legacy or synthetic rows are substituted."
          />
        </DashboardPanel>
      </DashboardPage>
    );
  }

  const rows = analytics.value.executionActivity.slice(0, ACTIVITY_ROW_LIMIT);
  return (
    <DashboardPage>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
          Trades
        </Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">
          Round Trips
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 860, mt: 1 }} variant="body2">
          Accepted broker execution activity is shown below. A completed round trip and its P/L appear in analytics only when its opening and closing evidence can be verified.
        </Typography>
      </Box>
      <DashboardDataScopeChip />
      <Alert severity="info">
        {analytics.value.executionActivity.length} accepted broker executions are available. Rows with incomplete opening-history evidence remain visible as activity and do not contribute an unverified P/L result.
      </Alert>
      <DashboardPanel
        action={<Chip label={`${rows.length} shown`} size="small" variant="outlined" />}
        title="Accepted executions"
      >
        {analytics.value.executionActivity.length > rows.length ? (
          <Typography color="text.secondary" sx={{ mb: 1.5 }} variant="body2">
            Showing the latest {rows.length} of {analytics.value.executionActivity.length} accepted executions to keep this local dashboard responsive. The complete statement remains available in Data Decisions.
          </Typography>
        ) : null}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Symbol</TableCell>
                <TableCell>Side</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell>Fees</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.executionDigest}>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.time}</TableCell>
                  <TableCell>{row.symbol}</TableCell>
                  <TableCell sx={{ textTransform: "capitalize" }}>{row.side}</TableCell>
                  <TableCell align="right">{formatDashboardDecimal(row.quantity)}</TableCell>
                  <TableCell align="right">{formatDashboardDecimal(row.price)} {row.currency}</TableCell>
                  <TableCell>{row.chargeCoverageState === "complete" ? "Verified" : "Needs review"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DashboardPanel>
    </DashboardPage>
  );
}
