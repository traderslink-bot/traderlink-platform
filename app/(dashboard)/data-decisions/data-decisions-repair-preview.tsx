"use client";

import { useEffect, useMemo, useState } from "react";

import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";
import Checkbox from "@mui/material/Checkbox";
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
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import {
  DashboardPage,
  DashboardPanel,
  DashboardUnavailableState,
} from "../../dashboard-template";
import { HorizontalScrollRegion } from "../horizontal-scroll-region";

type RepairAction = "Save correction" | "Keep as imported" | "Exclude row" | "Reset to source";

type PreviewRow = {
  id: string;
  row: string;
  timestamp: string;
  date: string;
  time: string;
  symbol: string;
  side: "Buy" | "Sell";
  quantity: string;
  price: string;
  fees: string;
  currency: string;
  commission: string;
  orderId: string;
  executionId: string;
  action: RepairAction;
  message: string;
};

type RepairStatement = Readonly<{
  persistenceDigest: string;
  broker: string;
  rows: readonly Readonly<{
    sourceRowNumber: string;
    status: "accepted" | "rejected" | "skipped";
    decision: "needs_attention" | "corrected" | "kept_as_imported" | "excluded";
    symbol: string | null;
    timestamp: string | null;
    side: string | null;
    quantity: string | null;
    price: string | null;
    fees: string | null;
    currency: string | null;
    commission: string | null;
    orderId: string | null;
    executionId: string | null;
    issues: readonly Readonly<{ code: string; message: string }>[];
  }>[];
}>;

type SortOrder = "statement" | "symbol-asc" | "symbol-desc" | "time-asc" | "time-desc";

const AUTOMATICALLY_SET_ASIDE_CODES = new Set([
  "non_trade_row_skipped",
  "non_filled_order_skipped",
  "options_row_skipped",
  "prior_position_close_skipped",
  "sell_starting_trade_skipped",
]);

function automaticallySetAside(row: RepairStatement["rows"][number]): boolean {
  return row.status === "skipped" &&
    row.issues.length > 0 &&
    row.issues.every((issue) => AUTOMATICALLY_SET_ASIDE_CODES.has(issue.code));
}

function splitTimestamp(value: string): Readonly<{ date: string; time: string }> {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/.exec(value);
  return match ? { date: match[1], time: match[2] } : { date: value, time: "" };
}

function repairRows(statement: RepairStatement | null): readonly PreviewRow[] {
  if (statement === null) return [];
  return statement.rows
    .filter(
      (row) =>
        row.decision === "needs_attention" &&
        !automaticallySetAside(row) &&
        (row.status === "rejected" || row.issues.length > 0),
    )
    .map((row) => {
      const timestamp = row.timestamp ?? "";
      const parts = splitTimestamp(timestamp);
      return {
      id: `${statement.persistenceDigest}:${row.sourceRowNumber}`,
      row: row.sourceRowNumber,
      timestamp,
      date: parts.date,
      time: parts.time,
      symbol: row.symbol ?? "",
      side: row.side?.toLowerCase().includes("sell") ? "Sell" : "Buy",
      quantity: row.quantity ?? "",
      price: row.price ?? "",
      fees: row.fees ?? "",
      currency: row.currency ?? "USD",
      commission: row.commission ?? "",
      orderId: row.orderId ?? "",
      executionId: row.executionId ?? "",
      action: row.status === "rejected" ? "Exclude row" : "Save correction",
      message: row.issues.map((issue) => issue.message).join(" ") || "This statement row needs attention.",
      };
    });
}

function rowsToReview(statement: RepairStatement): number {
  return statement.rows.filter(
    (row) =>
      row.decision === "needs_attention" &&
        !automaticallySetAside(row) &&
      (row.status === "rejected" || row.issues.length > 0),
  ).length;
}

function automaticRows(statement: RepairStatement | null) {
  if (statement === null) return [];
  return statement.rows.filter(automaticallySetAside);
}

function sortedRows(rows: readonly PreviewRow[], order: SortOrder): readonly PreviewRow[] {
  return [...rows].sort((left, right) => {
    if (order === "symbol-asc") return left.symbol.localeCompare(right.symbol) || Number(left.row) - Number(right.row);
    if (order === "symbol-desc") return right.symbol.localeCompare(left.symbol) || Number(left.row) - Number(right.row);
    if (order === "time-asc") return left.timestamp.localeCompare(right.timestamp) || Number(left.row) - Number(right.row);
    if (order === "time-desc") return right.timestamp.localeCompare(left.timestamp) || Number(left.row) - Number(right.row);
    return Number(left.row) - Number(right.row);
  });
}

function statementDateRange(statement: RepairStatement): string {
  const timestamps = statement.rows
    .map((row) => row.timestamp)
    .filter((value): value is string => value !== null)
    .map((value) => new Date(value))
    .filter((value) => Number.isFinite(value.getTime()))
    .sort((left, right) => left.getTime() - right.getTime());
  if (timestamps.length === 0) return "Statement dates unavailable";
  const format = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const first = format.format(timestamps[0]);
  const last = format.format(timestamps[timestamps.length - 1]);
  return first === last ? first : `${first} – ${last}`;
}

function statementName(statement: RepairStatement): string {
  return statement.broker === "custom"
    ? "Imported statement"
    : `${statement.broker} statement`;
}

function orderedStatements(
  statements: readonly RepairStatement[],
): readonly RepairStatement[] {
  return [...statements].sort((left, right) => {
    const reviewDifference = rowsToReview(right) - rowsToReview(left);
    if (reviewDifference !== 0) return reviewDifference;
    return statementDateRange(right).localeCompare(statementDateRange(left));
  });
}

const ACTIONS: readonly RepairAction[] = [
  "Save correction",
  "Keep as imported",
  "Exclude row",
  "Reset to source",
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
  const [statements, setStatements] = useState<readonly RepairStatement[]>([]);
  const [statement, setStatement] = useState<RepairStatement | null>(null);
  const [rows, setRows] = useState<readonly PreviewRow[]>([]);
  const [sortOrder, setSortOrder] = useState<SortOrder>("statement");
  const [selectedRowIds, setSelectedRowIds] = useState<readonly string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const visibleRows = useMemo(() => sortedRows(rows, sortOrder), [rows, sortOrder]);
  const selectedRows = useMemo(
    () => new Set(selectedRowIds),
    [selectedRowIds],
  );
  const allVisibleSelected = visibleRows.length > 0 && visibleRows.every((row) => selectedRows.has(row.id));

  function setSelectedAction(action: Exclude<RepairAction, "Save correction">) {
    if (selectedRowIds.length === 0) return;
    setRows((current) => current.map((row) =>
      selectedRows.has(row.id) ? { ...row, action } : row,
    ));
    setNotice(`${selectedRowIds.length} selected rows are marked “${action}”. Save and recheck to apply those decisions.`);
  }

  useEffect(() => {
    let active = true;
    void fetch("/api/intelligence/import-repair/v1", { cache: "no-store" })
      .then(async (response) => response.ok ? response.json() : Promise.reject())
      .then((packet: { statements?: readonly RepairStatement[] }) => {
        if (!active) return;
        const available = orderedStatements(packet.statements ?? []);
        const selected = available[0] ?? null;
        setStatements(available);
        setStatement(selected);
        setRows(repairRows(selected));
        setSelectedRowIds([]);
      })
      .catch(() => active && setLoadError("Import Repair is unavailable right now."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  async function deleteStatement() {
    if (statement === null || deleting) return;
    setDeleting(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/intelligence/import-repair/v1", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ persistenceDigest: statement.persistenceDigest }),
      });
      if (!response.ok) throw new Error("delete failed");
      const refreshed = await fetch("/api/intelligence/import-repair/v1", {
        cache: "no-store",
      });
      const packet = refreshed.ok
        ? await refreshed.json() as { statements?: readonly RepairStatement[] }
        : {};
      const available = orderedStatements(packet.statements ?? []);
      const selected = available[0] ?? null;
      setStatements(available);
      setStatement(selected);
      setRows(repairRows(selected));
      setSelectedRowIds([]);
      setDeleteOpen(false);
      setNotice("Statement deleted. V3 was rebuilt from the statements that remain.");
    } catch {
      setLoadError("The statement could not be deleted. No confirmed change was applied.");
    } finally {
      setDeleting(false);
    }
  }

  async function saveAndRecheck() {
    if (statement === null || saving || deleting) return;
    setSaving(true);
    setLoadError(null);
    try {
      const response = await fetch("/api/intelligence/import-repair/v1", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contractVersion: "ti_v3_import_repair_mutation_v1",
          persistenceDigest: statement.persistenceDigest,
          rows: rows.map((row) => ({
            sourceRowNumber: row.row,
            action: row.action === "Save correction"
              ? "save_correction"
              : row.action === "Keep as imported"
                ? "keep_as_imported"
                : row.action === "Exclude row"
                  ? "exclude_row"
                  : "reset_to_source",
            values: row.action === "Save correction" ? {
              timestamp: row.date && row.time
                ? `${row.date}T${row.time}.000000000Z`
                : row.timestamp,
              symbol: row.symbol,
              side: row.side.toLowerCase(),
              quantity: row.quantity,
              price: row.price,
              currency: row.currency,
              commission: row.commission || null,
              fees: row.fees || null,
              orderId: row.orderId || null,
              executionId: row.executionId || null,
            } : null,
          })),
        }),
      });
      const packet = await response.json();
      if (!response.ok || !packet.statement) {
        throw new Error(packet.error?.message ?? "save failed");
      }
      const replacement = packet.statement as RepairStatement;
      const available = orderedStatements([
        ...statements.filter(
          (candidate) =>
            candidate.persistenceDigest !== statement.persistenceDigest,
        ),
        replacement,
      ]);
      setStatements(available);
      setStatement(replacement);
      setRows(repairRows(replacement));
      setSelectedRowIds([]);
      setNotice("Import Repair saved the decisions and rebuilt V3.");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Import Repair could not save the changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardPage>
      <Stack spacing={2.5}>
        <Stack spacing={0.75}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Typography component="h1" variant="h1">Data Decisions</Typography>
            <Chip label="Import Repair beta" size="small" variant="outlined" />
          </Stack>
          <Typography color="text.secondary" variant="body2">
            Fix import problems here before V3 uses the statement in your trade pages and analytics.
          </Typography>
        </Stack>

        <Alert severity="info">Import Repair changes only the selected isolated V3 statement. Saving or deleting rebuilds V3 from the verified statements that remain.</Alert>
        {loadError ? <Alert severity="warning">{loadError}</Alert> : null}
        {notice ? <Alert severity="success">{notice}</Alert> : null}

        <DashboardPanel title="Imported statements">
          <Stack spacing={1.5}>
            <Typography color="text.secondary" variant="body2">
              Every statement remains visible here. Choose one statement to
              review, repair, or delete.
            </Typography>
            {loading ? (
              <Typography color="text.secondary" variant="body2">
                Loading imported statements...
              </Typography>
            ) : statements.length === 0 ? (
              <DashboardUnavailableState
                compact
                description="Import a statement to see it here and review any rows that need attention."
                title="No imported statements"
              />
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: 1.25,
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                    xl: "repeat(3, minmax(0, 1fr))",
                  },
                }}
              >
                {statements.map((candidate) => {
                  const reviewCount = rowsToReview(candidate);
                  const selected =
                    candidate.persistenceDigest === statement?.persistenceDigest;
                  return (
                    <ButtonBase
                      aria-label={`Review ${statementName(candidate)}, ${reviewCount} rows need review`}
                      key={candidate.persistenceDigest}
                      onClick={() => {
                        setStatement(candidate);
                        setRows(repairRows(candidate));
                        setSelectedRowIds([]);
                        setLoadError(null);
                        setNotice(null);
                      }}
                      sx={{
                        alignItems: "stretch",
                        border: 1,
                        borderColor: selected ? "primary.main" : "divider",
                        borderRadius: 1.5,
                        justifyContent: "stretch",
                        overflow: "hidden",
                        textAlign: "left",
                      }}
                    >
                      <Stack
                        spacing={1}
                        sx={{
                          bgcolor: selected ? "action.selected" : "background.paper",
                          p: 1.75,
                          width: "100%",
                        }}
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
                        >
                          <Typography sx={{ fontWeight: 700 }} variant="subtitle2">
                            {statementName(candidate)}
                          </Typography>
                          {selected ? (
                            <Chip color="primary" label="Selected" size="small" />
                          ) : null}
                        </Stack>
                        <Typography color="text.secondary" variant="body2">
                          {statementDateRange(candidate)}
                        </Typography>
                        <Chip
                          color={reviewCount > 0 ? "warning" : "success"}
                          label={
                            reviewCount === 1
                              ? "1 row needs review"
                              : `${reviewCount} rows need review`
                          }
                          size="small"
                          sx={{ alignSelf: "flex-start" }}
                          variant="outlined"
                        />
                      </Stack>
                    </ButtonBase>
                  );
                })}
              </Box>
            )}
          </Stack>
        </DashboardPanel>

        <DashboardPanel
          action={<Button color="error" disabled={statement === null || deleting || saving} onClick={() => setDeleteOpen(true)} startIcon={<DeleteOutlineRoundedIcon />} variant="outlined">Delete statement</Button>}
          title={statement ? statementName(statement) : "Selected statement"}
        >
          <Stack spacing={1.5}>
            <Typography color="text.secondary" variant="body2">
              {loading ? "Loading statement rows..." : statement ? "Import Repair shows the exact broker statement rows that need attention." : "Import a new statement to see its exact broker rows here."}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Chip
                color={rows.length > 0 ? "warning" : "default"}
                label={
                  rows.length === 1
                    ? "1 row to review"
                    : `${rows.length} rows to review`
                }
                size="small"
                variant="outlined"
              />
              <Chip label={statement ? "Original broker rows saved" : "No repair record yet"} size="small" variant="outlined" />
              <Chip label="No changes saved" size="small" variant="outlined" />
            </Stack>
          </Stack>
        </DashboardPanel>

        <DashboardPanel
          action={<Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button onClick={() => { setRows(repairRows(statement)); setSelectedRowIds([]); setNotice("Edits reset. No statement data was changed."); }} startIcon={<ReplayRoundedIcon />} variant="outlined">Reset edits</Button>
            <Button disabled={saving || deleting || statement === null} onClick={() => void saveAndRecheck()} startIcon={<SaveRoundedIcon />} variant="contained">{saving ? "Saving..." : "Save and recheck import"}</Button>
          </Stack>}
          title="Import Repair"
        >
          <Stack spacing={2}>
            <Typography color="text.secondary" variant="body2">
              Each row explains what needs attention. Edit the values shown by your broker, choose how to handle the row, then save and recheck the statement.
            </Typography>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1} sx={{ alignItems: { md: "center" } }}>
              <TextField aria-label="Sort rows" label="Sort rows" onChange={(event) => setSortOrder(event.target.value as SortOrder)} select size="small" sx={{ minWidth: { xs: 0, md: 210 }, width: { xs: "100%", md: "auto" } }} value={sortOrder}>
                <MenuItem value="statement">Statement row</MenuItem>
                <MenuItem value="symbol-asc">Ticker A–Z</MenuItem>
                <MenuItem value="symbol-desc">Ticker Z–A</MenuItem>
                <MenuItem value="time-asc">Date and time: oldest first</MenuItem>
                <MenuItem value="time-desc">Date and time: newest first</MenuItem>
              </TextField>
              <Typography color="text.secondary" variant="body2" sx={{ flexGrow: 1 }}>
                Select rows to apply one verified decision at a time. Corrections remain individual so values are never guessed in bulk.
              </Typography>
              <Button disabled={selectedRowIds.length === 0} onClick={() => setSelectedAction("Keep as imported")} size="small" variant="outlined">Keep selected</Button>
              <Button disabled={selectedRowIds.length === 0} onClick={() => setSelectedAction("Exclude row")} size="small" variant="outlined">Exclude selected</Button>
              <Button disabled={selectedRowIds.length === 0} onClick={() => setSelectedAction("Reset to source")} size="small" variant="outlined">Reset selected</Button>
            </Stack>
            <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}>
            <HorizontalScrollRegion label="Import repair rows table" maxHeight={620} minTableWidth={1320}>
              <Table size="small" stickyHeader sx={{ minWidth: 1320 }}>
                <TableHead><TableRow>
                  <TableCell padding="checkbox"><Checkbox aria-label="Select all visible review rows" checked={allVisibleSelected} indeterminate={selectedRowIds.length > 0 && !allVisibleSelected} onChange={(event) => setSelectedRowIds(event.target.checked ? visibleRows.map((row) => row.id) : [])} /></TableCell>
                  <TableCell>Statement row</TableCell><TableCell>What needs attention</TableCell><TableCell>Date</TableCell><TableCell>Time</TableCell><TableCell>Ticker</TableCell><TableCell>Side</TableCell><TableCell align="right">Quantity</TableCell><TableCell align="right">Price</TableCell><TableCell align="right">Fees</TableCell><TableCell>Use this row</TableCell>
                </TableRow></TableHead>
                <TableBody>{visibleRows.map((row) => <TableRow key={row.id} selected={selectedRows.has(row.id)}>
                  <TableCell padding="checkbox"><Checkbox aria-label={`Select statement row ${row.row}`} checked={selectedRows.has(row.id)} onChange={(event) => setSelectedRowIds((current) => event.target.checked ? [...current, row.id] : current.filter((id) => id !== row.id))} /></TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{row.row}</TableCell>
                  <TableCell sx={{ minWidth: 260 }}><Typography variant="body2">{row.message}</Typography></TableCell>
                  <EditableCell label={`Date for statement row ${row.row}`} onChange={(value) => setRows((current) => updateRowField(current, row.id, "date", value))} value={row.date} width={130} />
                  <EditableCell label={`Time for statement row ${row.row}`} onChange={(value) => setRows((current) => updateRowField(current, row.id, "time", value))} value={row.time} width={110} />
                  <EditableCell label={`Ticker for statement row ${row.row}`} onChange={(value) => setRows((current) => updateRowField(current, row.id, "symbol", value.toUpperCase()))} value={row.symbol} width={100} />
                  <TableCell sx={{ minWidth: 110 }}><TextField aria-label={`Side for statement row ${row.row}`} fullWidth onChange={(event) => setRows((current) => updateRowField(current, row.id, "side", event.target.value as PreviewRow["side"]))} select size="small" value={row.side}><MenuItem value="Buy">Buy</MenuItem><MenuItem value="Sell">Sell</MenuItem></TextField></TableCell>
                  <EditableCell align="right" label={`Quantity for statement row ${row.row}`} onChange={(value) => setRows((current) => updateRowField(current, row.id, "quantity", value))} value={row.quantity} width={100} />
                  <EditableCell align="right" label={`Price for statement row ${row.row}`} onChange={(value) => setRows((current) => updateRowField(current, row.id, "price", value))} value={row.price} width={100} />
                  <EditableCell align="right" label={`Fees for statement row ${row.row}`} onChange={(value) => setRows((current) => updateRowField(current, row.id, "fees", value))} value={row.fees} width={100} />
                  <TableCell sx={{ minWidth: 180 }}><TextField aria-label={`Action for statement row ${row.row}`} fullWidth onChange={(event) => setRows((current) => updateRowField(current, row.id, "action", event.target.value as RepairAction))} select size="small" value={row.action}>{ACTIONS.map((action) => <MenuItem key={action} value={action}>{action}</MenuItem>)}</TextField></TableCell>
                </TableRow>)}{!loading && rows.length === 0 ? <TableRow><TableCell colSpan={11}><Typography color="text.secondary" variant="body2">{statement ? "No rows need review in this statement." : "No repair rows are available. Older imports need to be imported again once to retain their original broker-row details."}</Typography></TableCell></TableRow> : null}</TableBody>
              </Table>
            </HorizontalScrollRegion>
            </Box>
            {automaticRows(statement).length > 0 ? <DashboardPanel title="Automatically set aside">
              <Stack spacing={1}>
                <Typography color="text.secondary" variant="body2">{automaticRows(statement).length} statement rows were identified as headings, cash/FX, unfilled orders, or another non-stock record. They remain visible and do not need an exclusion decision.</Typography>
                <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, overflow: "hidden" }}><HorizontalScrollRegion label="Automatically set aside rows table" maxHeight={340} minTableWidth={680} stickyFirstColumn><Table size="small" stickyHeader><TableHead><TableRow><TableCell>Statement row</TableCell><TableCell>Why it was set aside</TableCell><TableCell>Date</TableCell><TableCell>Time</TableCell><TableCell>Ticker</TableCell></TableRow></TableHead><TableBody>{automaticRows(statement).map((row) => { const parts = splitTimestamp(row.timestamp ?? ""); return <TableRow key={row.sourceRowNumber}><TableCell sx={{ fontWeight: 700 }}>{row.sourceRowNumber}</TableCell><TableCell><Typography variant="body2">{row.issues.map((issue) => issue.message).join(" ")}</Typography></TableCell><TableCell>{parts.date || "—"}</TableCell><TableCell>{parts.time || "—"}</TableCell><TableCell>{row.symbol ?? "—"}</TableCell></TableRow>; })}</TableBody></Table></HorizontalScrollRegion></Box>
              </Stack>
            </DashboardPanel> : null}
            <Divider />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
              <Chip color="info" label="Open position" size="small" variant="outlined" />
              <Typography color="text.secondary" sx={{ flexGrow: 1 }} variant="body2">A position still open at the end of a statement is not an import error. Its completed-trade result appears after you import the statement containing its exit.</Typography>
            </Stack>
          </Stack>
        </DashboardPanel>

        <DashboardPanel title="Financial-data rules">
          <Stack spacing={1.25}>
            <Typography color="text.secondary" variant="body2">The current rule cards remain here. Import Repair adds the exact rows and editable values behind a rule; it does not replace your existing choices.</Typography>
            <DashboardUnavailableState compact description="New import rules will appear here. In the beta, their affected statement rows open in Import Repair." title="No rules waiting" />
          </Stack>
        </DashboardPanel>
      </Stack>

      <Dialog fullWidth maxWidth="xs" onClose={() => setDeleteOpen(false)} open={deleteOpen}>
        <DialogTitle>Delete this statement?</DialogTitle>
        <DialogContent><Typography color="text.secondary" variant="body2">This removes this one statement and its executions from isolated V3 test data, then rebuilds V3 from the statements that remain.</Typography></DialogContent>
        <DialogActions><Button disabled={deleting || saving} onClick={() => setDeleteOpen(false)}>Cancel</Button><Button color="error" disabled={deleting || saving || statement === null} onClick={() => void deleteStatement()} variant="contained">{deleting ? "Deleting..." : "Delete statement"}</Button></DialogActions>
      </Dialog>
    </DashboardPage>
  );
}

function EditableCell({ align, label, onChange, value, width }: { align?: "right"; label: string; onChange: (value: string) => void; value: string; width: number }) {
  return <TableCell align={align} sx={{ minWidth: width }}><TextField aria-label={label} fullWidth onChange={(event) => onChange(event.target.value)} size="small" value={value} /></TableCell>;
}
