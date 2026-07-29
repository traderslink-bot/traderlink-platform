"use client";

import { useState } from "react";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  DashboardPage,
  DashboardPanel,
  DashboardUnavailableState,
} from "../../dashboard-template";

type RepairAction = "Save correction" | "Keep as imported" | "Exclude row";

type PreviewRow = {
  id: string;
  row: string;
  time: string;
  symbol: string;
  side: "Buy" | "Sell";
  quantity: string;
  price: string;
  fees: string;
  action: RepairAction;
  message: string;
};

const INITIAL_ROWS: readonly PreviewRow[] = [
  {
    id: "row-214",
    row: "214",
    time: "2026-04-16 10:31:02",
    symbol: "ABC",
    side: "Buy",
    quantity: "100",
    price: "12.40",
    fees: "",
    action: "Save correction",
    message: "The fee amount is missing. Add it if it appears on your statement.",
  },
  {
    id: "row-215",
    row: "215",
    time: "2026-04-16 10:31:02",
    symbol: "ABC",
    side: "Sell",
    quantity: "100",
    price: "12.52",
    fees: "0.35",
    action: "Keep as imported",
    message:
      "This trade shares a time with another trade. Check the order if your statement shows one.",
  },
];

const ACTIONS: readonly RepairAction[] = [
  "Save correction",
  "Keep as imported",
  "Exclude row",
];

function updateRowField<K extends keyof PreviewRow>(
  rows: readonly PreviewRow[],
  id: string,
  field: K,
  value: PreviewRow[K],
): readonly PreviewRow[] {
  return rows.map((row) =>
    row.id === id ? ({ ...row, [field]: value } as PreviewRow) : row,
  );
}

export function DataDecisionsRepairPreview() {
  const [rows, setRows] = useState<readonly PreviewRow[]>(INITIAL_ROWS);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  return (
    <DashboardPage>
      <Stack spacing={2.5}>
        <Stack spacing={0.75}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography component="h1" variant="h1">
              Data Decisions
            </Typography>
            <Chip label="Layout preview" size="small" variant="outlined" />
          </Stack>
          <Typography color="text.secondary" variant="body2">
            Fix import problems here before V3 uses the statement in your trade
            pages and analytics.
          </Typography>
        </Stack>

        <Alert severity="info">
          This is a design preview. The rows below show the repair layout only;
          saving and deleting do not change your statement yet.
        </Alert>
        {notice ? <Alert severity="success">{notice}</Alert> : null}

        <DashboardPanel
          action={
            <Button
              color="error"
              onClick={() => setDeleteOpen(true)}
              startIcon={<DeleteOutlineRoundedIcon />}
              variant="outlined"
            >
              Delete statement
            </Button>
          }
          title="April 2026 statement"
        >
          <Stack spacing={1.5}>
            <Typography color="text.secondary" variant="body2">
              574 imported executions. Import Repair will show the exact
              statement rows that need attention, without putting warnings on
              trade or analytics pages.
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Chip color="warning" label="2 rows to review" size="small" variant="outlined" />
              <Chip label="1 open position to continue" size="small" variant="outlined" />
              <Chip label="No changes saved" size="small" variant="outlined" />
            </Stack>
          </Stack>
        </DashboardPanel>

        <DashboardPanel
          action={
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                onClick={() => {
                  setRows(INITIAL_ROWS);
                  setNotice("Preview reset. No statement data was changed.");
                }}
                startIcon={<ReplayRoundedIcon />}
                variant="outlined"
              >
                Reset edits
              </Button>
              <Button
                onClick={() =>
                  setNotice(
                    "Preview only. Import changes will be connected after this table is approved.",
                  )
                }
                startIcon={<SaveRoundedIcon />}
                variant="contained"
              >
                Save and recheck import
              </Button>
            </Stack>
          }
          title="Import Repair"
        >
          <Stack spacing={2}>
            <Typography color="text.secondary" variant="body2">
              Each row explains what needs attention. Edit the values shown by
              your broker, choose how to handle the row, then save and recheck
              the statement.
            </Typography>
            <TableContainer sx={{ border: 1, borderColor: "divider", borderRadius: 1.5 }}>
              <Table size="small" sx={{ minWidth: 1120 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Statement row</TableCell>
                    <TableCell>What needs attention</TableCell>
                    <TableCell>Date and time</TableCell>
                    <TableCell>Symbol</TableCell>
                    <TableCell>Side</TableCell>
                    <TableCell align="right">Quantity</TableCell>
                    <TableCell align="right">Price</TableCell>
                    <TableCell align="right">Fees</TableCell>
                    <TableCell>Use this row</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell sx={{ fontWeight: 700 }}>{row.row}</TableCell>
                      <TableCell sx={{ minWidth: 260 }}>
                        <Typography variant="body2">{row.message}</Typography>
                      </TableCell>
                      <EditableCell label={`Date and time for statement row ${row.row}`} onChange={(value) => setRows((current) => updateRowField(current, row.id, "time", value))} value={row.time} width={185} />
                      <EditableCell label={`Symbol for statement row ${row.row}`} onChange={(value) => setRows((current) => updateRowField(current, row.id, "symbol", value.toUpperCase()))} value={row.symbol} width={100} />
                      <TableCell sx={{ minWidth: 110 }}>
                        <TextField aria-label={`Side for statement row ${row.row}`} fullWidth onChange={(event) => setRows((current) => updateRowField(current, row.id, "side", event.target.value as PreviewRow["side"]))} select size="small" value={row.side}>
                          <MenuItem value="Buy">Buy</MenuItem>
                          <MenuItem value="Sell">Sell</MenuItem>
                        </TextField>
                      </TableCell>
                      <EditableCell align="right" label={`Quantity for statement row ${row.row}`} onChange={(value) => setRows((current) => updateRowField(current, row.id, "quantity", value))} value={row.quantity} width={100} />
                      <EditableCell align="right" label={`Price for statement row ${row.row}`} onChange={(value) => setRows((current) => updateRowField(current, row.id, "price", value))} value={row.price} width={100} />
                      <EditableCell align="right" label={`Fees for statement row ${row.row}`} onChange={(value) => setRows((current) => updateRowField(current, row.id, "fees", value))} value={row.fees} width={100} />
                      <TableCell sx={{ minWidth: 180 }}>
                        <TextField aria-label={`Action for statement row ${row.row}`} fullWidth onChange={(event) => setRows((current) => updateRowField(current, row.id, "action", event.target.value as RepairAction))} select size="small" value={row.action}>
                          {ACTIONS.map((action) => <MenuItem key={action} value={action}>{action}</MenuItem>)}
                        </TextField>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Divider />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
              <Chip color="info" label="Open position" size="small" variant="outlined" />
              <Typography color="text.secondary" sx={{ flexGrow: 1 }} variant="body2">
                A position still open at the end of a statement is not an import error. Its completed-trade result appears after you import the statement containing its exit.
              </Typography>
            </Stack>
          </Stack>
        </DashboardPanel>

        <DashboardPanel title="Financial-data rules">
          <Stack spacing={1.25}>
            <Typography color="text.secondary" variant="body2">
              The current rule cards remain here. Import Repair adds the exact rows and editable values behind a rule; it does not replace your existing choices.
            </Typography>
            <DashboardUnavailableState compact description="New import rules will appear here. In the beta, their affected statement rows open in Import Repair." title="No rules waiting" />
          </Stack>
        </DashboardPanel>
      </Stack>

      <Dialog fullWidth maxWidth="xs" onClose={() => setDeleteOpen(false)} open={deleteOpen}>
        <DialogTitle>Delete April 2026 statement?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" variant="body2">
            In the completed feature, this removes this one statement and its executions from isolated V3 test data, then refreshes the rest of V3. Other statements stay in place.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" onClick={() => { setDeleteOpen(false); setNotice("Preview only. The April statement was not deleted."); }} variant="contained">
            Delete statement
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardPage>
  );
}

function EditableCell({ align, label, onChange, value, width }: { align?: "right"; label: string; onChange: (value: string) => void; value: string; width: number }) {
  return (
    <TableCell align={align} sx={{ minWidth: width }}>
      <TextField aria-label={label} fullWidth onChange={(event) => onChange(event.target.value)} size="small" value={value} />
    </TableCell>
  );
}
