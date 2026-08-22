"use client";

import AutorenewRoundedIcon from "@mui/icons-material/AutorenewRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";

import {
  DashboardPage,
  DashboardPanel,
  DashboardPrimaryAction,
  DashboardSecondaryAction,
} from "../../dashboard-template";

const resultColumns = Object.freeze([
  "Symbol",
  "Company",
  "Last",
  "Change",
  "Volume",
  "Market cap",
  "Updated",
]);

export function ScannerClient({ moomooConnected }: { moomooConnected: boolean }) {
  return (
    <DashboardPage>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1.5}
        sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}
      >
        <Box>
          <Typography component="h1" variant="h1">Scanner</Typography>
          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Start with a ready-to-use TradersLink stock screen.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <DashboardSecondaryAction disabled>
            My scanners
          </DashboardSecondaryAction>
          <DashboardPrimaryAction disabled startIcon={<AutorenewRoundedIcon />}>
            Refresh
          </DashboardPrimaryAction>
        </Stack>
      </Stack>

      <DashboardPanel title="TradersLink Scanner">
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" }, justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontWeight: 800 }}>Active U.S. stocks</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
              A simple starting screen for finding stocks with active trading.
            </Typography>
          </Box>
          <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
            <Chip label="United States" size="small" />
            <Chip label="Ready to use" size="small" variant="outlined" />
          </Stack>
        </Stack>
      </DashboardPanel>

      {!moomooConnected ? (
        <Alert
          action={(
            <Button component={Link} endIcon={<OpenInNewRoundedIcon />} href="/account/trading" size="small">
              Connect Moomoo
            </Button>
          )}
          severity="info"
        >
          Connect Moomoo to load current scanner results. TradersLink does not show made-up stock results while market data is unavailable.
        </Alert>
      ) : (
        <Alert severity="info">
          Your Moomoo connection is ready. Live scan results will appear here when the scanner refresh path is connected.
        </Alert>
      )}

      <DashboardPanel
        action={<Typography color="text.secondary" variant="body2">No scan has run yet</Typography>}
        title="Matches"
      >
        <Box sx={{ maxWidth: "100%", overflowX: "auto" }}>
          <Table aria-label="Scanner results" size="small" sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow>
                {resultColumns.map((column) => <TableCell key={column}>{column}</TableCell>)}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell colSpan={resultColumns.length} sx={{ py: 5, textAlign: "center" }}>
                  <Typography sx={{ fontWeight: 700 }}>Scanner results will appear here</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                    Results will show the strongest matches first, with the exact time they were last updated.
                  </Typography>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </DashboardPanel>
    </DashboardPage>
  );
}
