"use client";

import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState, type FormEvent } from "react";

import type { JournalImportHistoryItem } from "@/src/modules/journal/contracts/journal-product-read-models";
import type {
  JournalGenericMappingField,
  JournalGenericStatementMappingContract,
} from "@/src/modules/journal/server/imports/journal-generic-mapped-statement-adapter";
import type { JournalImportMappingPreview } from "@/src/modules/journal/server/product/journal-import-product-service";
import type { JournalMappingSupportPackage } from "@/src/modules/journal/server/product/journal-mapping-support-package";
import { DashboardPanel } from "../../dashboard-template";

const PREVIEW_ENDPOINT = "/api/platform/journal/imports/preview";
const COMMIT_ENDPOINT = "/api/platform/journal/imports/commit";
const HISTORY_ENDPOINT = "/api/platform/journal/imports/history";

const MAPPING_FIELDS = Object.freeze([
  ["symbol", "Symbol", true],
  ["side", "Buy or sell", true],
  ["quantity", "Quantity", true],
  ["price", "Execution price", true],
  ["timestamp", "Execution date and time", false],
  ["date", "Execution date", false],
  ["time", "Execution time", false],
  ["currency", "Currency", false],
  ["fees", "Fees or commission", false],
  ["executionId", "Broker execution ID", false],
] as const satisfies readonly (readonly [JournalGenericMappingField, string, boolean])[]);

function tokenList(value: string): readonly string[] {
  return Object.freeze(value.split(",").map((token) => token.trim()).filter(Boolean));
}

function humanize(value: string): string {
  return value.replaceAll("_", " ").replace(/^./u, (letter) => letter.toUpperCase());
}

function period(item: Pick<JournalImportHistoryItem, "statementPeriodStartDate" | "statementPeriodEndDate">): string {
  if (!item.statementPeriodStartDate || !item.statementPeriodEndDate) {
    return "Statement period needs review";
  }
  return item.statementPeriodStartDate === item.statementPeriodEndDate
    ? item.statementPeriodStartDate
    : `${item.statementPeriodStartDate} to ${item.statementPeriodEndDate}`;
}

export function JournalImportClient() {
  const [file, setFile] = useState<File | null>(null);
  const [brokerName, setBrokerName] = useState("");
  const [sourceTimezone, setSourceTimezone] = useState("America/New_York");
  const [preview, setPreview] = useState<JournalImportMappingPreview | null>(null);
  const [mappingSupport, setMappingSupport] = useState<JournalMappingSupportPackage | null>(null);
  const [selectedTableSignature, setSelectedTableSignature] = useState("");
  const [manualColumns, setManualColumns] = useState<Partial<Record<JournalGenericMappingField, string>>>({});
  const [buyValues, setBuyValues] = useState("BUY,B,BOUGHT");
  const [sellValues, setSellValues] = useState("SELL,S,SOLD");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [feeSignConvention, setFeeSignConvention] = useState<"cost_positive" | "cash_effect">("cost_positive");
  const [confirmedAccount, setConfirmedAccount] = useState(false);
  const [history, setHistory] = useState<readonly JournalImportHistoryItem[]>([]);
  const [working, setWorking] = useState<"preview" | "commit" | null>(null);
  const [notice, setNotice] = useState<Readonly<{
    severity: "success" | "warning" | "error";
    text: string;
  }> | null>(null);

  async function refreshHistory() {
    const response = await fetch(HISTORY_ENDPOINT, { cache: "no-store" });
    if (!response.ok) return;
    const packet = await response.json() as {
      imports?: readonly JournalImportHistoryItem[];
    };
    setHistory(packet.imports ?? []);
  }

  useEffect(() => {
    void refreshHistory();
  }, []);

  function acceptMappingSupport(support: JournalMappingSupportPackage | null) {
    setMappingSupport(support);
    const firstTable = support?.tables[0];
    setSelectedTableSignature(firstTable?.structuralSignatureSha256 ?? "");
    setManualColumns(firstTable ? { ...firstTable.suggestedMapping } : {});
  }

  async function previewStatement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || working) return;
    setWorking("preview");
    setNotice(null);
    setPreview(null);
    acceptMappingSupport(null);
    setConfirmedAccount(false);
    try {
      const data = new FormData();
      data.set("statement", file);
      data.set("sourceTimezone", sourceTimezone);
      data.set("brokerName", brokerName);
      const response = await fetch(PREVIEW_ENDPOINT, { method: "POST", body: data });
      const packet = await response.json() as {
        preview?: JournalImportMappingPreview;
        mappingSupport?: JournalMappingSupportPackage;
        status?: string;
        code?: string;
      };
      if (packet.status === "mapping_required" && packet.mappingSupport) {
        acceptMappingSupport(packet.mappingSupport);
        setNotice({
          severity: "warning",
          text: "TraderLink could not map this statement safely. Download the privacy-safe mapping support package so this broker format can be added without exposing statement values.",
        });
        return;
      }
      if (!response.ok || !packet.preview) {
        throw new Error(packet.code ?? "The statement could not be mapped.");
      }
      setPreview(packet.preview);
      acceptMappingSupport(packet.mappingSupport ?? null);
      setNotice({
        severity: packet.preview.canCommit ? "success" : "warning",
        text: packet.preview.canCommit
          ? packet.preview.mappingOrigin === "saved_exact_template"
            ? "This account's saved statement template matched exactly. Review it before saving; nothing has been saved yet."
            : "The statement mapping is ready for your review. Nothing has been saved yet."
          : "The mapping found blocking issues. Review the summary before trying another file.",
      });
    } catch (error) {
      setNotice({
        severity: "error",
        text: error instanceof Error ? error.message : "The statement could not be mapped.",
      });
    } finally {
      setWorking(null);
    }
  }

  function downloadMappingSupport() {
    if (!mappingSupport) return;
    const slug = mappingSupport.brokerName.toLowerCase()
      .replace(/[^a-z0-9]+/gu, "-")
      .replace(/^-|-$/gu, "") || "broker";
    const url = URL.createObjectURL(new Blob(
      [`${JSON.stringify(mappingSupport, null, 2)}\n`],
      { type: "application/json" },
    ));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `traderlink-${slug}-mapping-support.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function previewManualMapping() {
    const selectedTable = mappingSupport?.tables.find(
      (table) => table.structuralSignatureSha256 === selectedTableSignature,
    );
    if (!file || !mappingSupport || !selectedTable || working || !brokerName.trim()) return;
    if (mappingSupport.detectedDelimiter === "unknown") return;
    const mapping: JournalGenericStatementMappingContract = {
      contractVersion: "user_confirmed_statement_mapping_v1",
      brokerName: brokerName.trim(),
      structuralSignatureSha256: selectedTable.structuralSignatureSha256,
      delimiter: mappingSupport.detectedDelimiter,
      tableKind: selectedTable.tableKind,
      tableLabel: selectedTable.tableLabel,
      headerRowIndex: selectedTable.headerRowIndex,
      orderedHeaders: selectedTable.headerLabels,
      columns: manualColumns,
      sideValues: { buy: tokenList(buyValues), sell: tokenList(sellValues) },
      defaultCurrency: defaultCurrency.trim().toUpperCase(),
      feeSignConvention,
      sourceTimezone,
    };
    setWorking("preview");
    setNotice(null);
    setPreview(null);
    setConfirmedAccount(false);
    try {
      const data = new FormData();
      data.set("statement", file);
      data.set("sourceTimezone", sourceTimezone);
      data.set("brokerName", brokerName.trim());
      data.set("mappingContract", JSON.stringify(mapping));
      const response = await fetch(PREVIEW_ENDPOINT, { method: "POST", body: data });
      const packet = await response.json() as {
        preview?: JournalImportMappingPreview;
        mappingSupport?: JournalMappingSupportPackage;
        code?: string;
      };
      if (!response.ok || !packet.preview) {
        throw new Error(packet.code ?? "The selected columns could not be mapped.");
      }
      setPreview(packet.preview);
      acceptMappingSupport(packet.mappingSupport ?? mappingSupport);
      setNotice({
        severity: packet.preview.canCommit ? "success" : "warning",
        text: packet.preview.canCommit
          ? "Your mapping is ready. Saving the statement will also save this exact format as a reusable template for this trading account."
          : "The selected mapping has blocking issues. Review the fields and try again.",
      });
    } catch (error) {
      setNotice({
        severity: "error",
        text: error instanceof Error ? error.message : "The selected columns could not be mapped.",
      });
    } finally {
      setWorking(null);
    }
  }

  async function commitStatement() {
    if (!file || !preview || !confirmedAccount || !preview.canCommit || working) return;
    setWorking("commit");
    setNotice(null);
    try {
      const data = new FormData();
      data.set("statement", file);
      data.set("sourceTimezone", sourceTimezone);
      data.set("confirmedSourceFileSha256", preview.sourceFileSha256);
      data.set("confirmedAccountRef", preview.accountRef);
      data.set("expectedAccountSelectionRef", preview.accountSelectionRef);
      data.set(
        "confirmSourceIdentityLink",
        preview.sourceIdentityConfirmationRequired ? "yes" : "no",
      );
      data.set("confirmationAction", "commit_statement");
      data.set("commitKind", preview.commitKind);
      if (preview.mappingContract) {
        data.set("mappingContract", JSON.stringify(preview.mappingContract));
      }
      const response = await fetch(COMMIT_ENDPOINT, { method: "POST", body: data });
      const packet = await response.json() as {
        result?: Readonly<{
          status: "committed" | "already_imported";
          createdExecutionCount: number;
          matchedExecutionCount: number;
          pendingDecisionCount: number;
        }>;
        code?: string;
      };
      if (!response.ok || !packet.result) {
        throw new Error(packet.code ?? "The statement could not be saved.");
      }
      await refreshHistory();
      setNotice({
        severity: packet.result.pendingDecisionCount > 0 ? "warning" : "success",
        text: packet.result.status === "already_imported"
          ? "This exact statement was already saved. No executions were duplicated."
          : `${packet.result.createdExecutionCount} new executions saved and ${packet.result.matchedExecutionCount} existing executions matched. ${packet.result.pendingDecisionCount} decisions need review.`,
      });
    } catch (error) {
      setNotice({
        severity: "error",
        text: error instanceof Error ? error.message : "The statement could not be saved.",
      });
    } finally {
      setWorking(null);
    }
  }

  const selectedTable = mappingSupport?.tables.find(
    (table) => table.structuralSignatureSha256 === selectedTableSignature,
  ) ?? null;
  const manualMappingReady = Boolean(
    selectedTable &&
    mappingSupport?.detectedDelimiter !== "unknown" &&
    brokerName.trim() &&
    /^[A-Za-z]{3}$/u.test(defaultCurrency.trim()) &&
    tokenList(buyValues).length > 0 &&
    tokenList(sellValues).length > 0 &&
    manualColumns.symbol &&
    manualColumns.side &&
    manualColumns.quantity &&
    manualColumns.price &&
    (manualColumns.timestamp || (manualColumns.date && manualColumns.time)),
  );

  return (
    <Stack spacing={2.5}>
      <Box>
        <Typography color="primary.main" sx={{ fontWeight: 800 }} variant="caption">
          Journal
        </Typography>
        <Typography component="h1" sx={{ mt: 0.5 }} variant="h1">
          Import Trades
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 820, mt: 1 }} variant="body2">
          Import historical broker statements in any order. TraderLink detects verified formats, previews the mapping before saving executions, preserves accepted source evidence, and sends uncertain facts to Data Decisions without hiding valid trades.
        </Typography>
      </Box>

      {notice ? <Alert severity={notice.severity}>{notice.text}</Alert> : null}

      <DashboardPanel title="Choose a statement">
        <Box component="form" onSubmit={(event) => void previewStatement(event)}>
          <Stack spacing={2}>
            <Alert severity="info">
              TraderLink recognizes verified statement formats automatically. If a broker format is new, you can map its columns here. A successful mapping becomes an exact reusable template for this trading account; changed layouts return for review instead of being guessed.
            </Alert>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <Button
                component="label"
                startIcon={<CloudUploadRoundedIcon />}
                sx={{ justifyContent: "flex-start", minHeight: 56, flex: 1 }}
                variant="outlined"
              >
                {file?.name ?? "Choose CSV statement"}
                <input
                  accept=".csv,text/csv,text/plain"
                  hidden
                  onChange={(event) => {
                    setFile(event.target.files?.[0] ?? null);
                    setPreview(null);
                    acceptMappingSupport(null);
                    setConfirmedAccount(false);
                  }}
                  type="file"
                />
              </Button>
              <TextField
                label="Broker name"
                onChange={(event) => {
                  setBrokerName(event.target.value);
                  setPreview(null);
                }}
                placeholder="Auto detect or enter broker"
                sx={{ minWidth: 220 }}
                value={brokerName}
              />
              <TextField
                label="Statement timezone"
                onChange={(event) => {
                  setSourceTimezone(event.target.value);
                  setPreview(null);
                }}
                sx={{ minWidth: 240 }}
                value={sourceTimezone}
              />
              <Button disabled={!file || working !== null} type="submit" variant="contained">
                {working === "preview" ? "Mapping..." : "Review mapping"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </DashboardPanel>

      {mappingSupport ? (
        <DashboardPanel title={preview ? "Statement format" : "Map statement columns"}>
          <Stack spacing={2}>
            <Typography color="text.secondary" variant="body2">
              This package contains {mappingSupport.tables.length} detected table or section signature{mappingSupport.tables.length === 1 ? "" : "s"} and {mappingSupport.recordCount} row shapes. It excludes raw rows, statement values, the original filename and every local path.
            </Typography>
            {!preview && mappingSupport.tables.length > 0 ? (
              <Stack spacing={2}>
                <FormControl fullWidth>
                  <InputLabel id="statement-table-label">Statement table or section</InputLabel>
                  <Select
                    label="Statement table or section"
                    labelId="statement-table-label"
                    onChange={(event) => {
                      const signature = event.target.value;
                      const table = mappingSupport.tables.find(
                        (candidate) => candidate.structuralSignatureSha256 === signature,
                      );
                      setSelectedTableSignature(signature);
                      setManualColumns(table ? { ...table.suggestedMapping } : {});
                    }}
                    value={selectedTableSignature}
                  >
                    {mappingSupport.tables.map((table) => (
                      <MenuItem key={table.structuralSignatureSha256} value={table.structuralSignatureSha256}>
                        {table.tableLabel} ({table.dataRowCount} rows)
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedTable ? (
                  <>
                    <Typography color="text.secondary" variant="caption">
                      Detected columns: {selectedTable.headerLabels.join(" · ")}
                    </Typography>
                    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
                      {MAPPING_FIELDS.map(([field, label, required]) => (
                        <FormControl key={field} fullWidth required={required}>
                          <InputLabel id={`mapping-${field}-label`}>{label}</InputLabel>
                          <Select
                            label={label}
                            labelId={`mapping-${field}-label`}
                            onChange={(event) => setManualColumns((current) => {
                              const next = { ...current };
                              if (event.target.value) next[field] = event.target.value;
                              else delete next[field];
                              return next;
                            })}
                            value={manualColumns[field] ?? ""}
                          >
                            <MenuItem value=""><em>Not mapped</em></MenuItem>
                            {selectedTable.headerLabels.map((header) => (
                              <MenuItem key={`${field}-${header}`} value={header}>{header}</MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ))}
                    </Box>
                    <Alert severity="info">
                      Map either one combined date-and-time column, or both separate date and time columns. Symbol, buy or sell, quantity, and price are always required.
                    </Alert>
                    <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" } }}>
                      <TextField label="Buy values, separated by commas" onChange={(event) => setBuyValues(event.target.value)} value={buyValues} />
                      <TextField label="Sell values, separated by commas" onChange={(event) => setSellValues(event.target.value)} value={sellValues} />
                      <TextField label="Default currency" onChange={(event) => setDefaultCurrency(event.target.value.toUpperCase())} slotProps={{ htmlInput: { maxLength: 3 } }} value={defaultCurrency} />
                      <FormControl fullWidth>
                        <InputLabel id="fee-sign-label">Fee format</InputLabel>
                        <Select
                          label="Fee format"
                          labelId="fee-sign-label"
                          onChange={(event) => setFeeSignConvention(event.target.value as "cost_positive" | "cash_effect")}
                          value={feeSignConvention}
                        >
                          <MenuItem value="cost_positive">Positive number means a cost</MenuItem>
                          <MenuItem value="cash_effect">Negative number means a cost</MenuItem>
                        </Select>
                      </FormControl>
                    </Box>
                    <Button
                      disabled={!manualMappingReady || working !== null}
                      onClick={() => void previewManualMapping()}
                      variant="contained"
                    >
                      {working === "preview" ? "Checking mapping..." : "Review my mapping"}
                    </Button>
                    <Typography color="text.secondary" variant="caption">
                      TraderLink learns only after you review and save. The template is limited to this trading account and this exact statement structure.
                    </Typography>
                  </>
                ) : null}
              </Stack>
            ) : null}
            {!preview && mappingSupport.tables.length === 0 ? (
              <Alert severity="warning">
                No safe table structure could be detected. Download the format package so this broker statement can be added as a tested adapter.
              </Alert>
            ) : null}
            <Button onClick={downloadMappingSupport} startIcon={<DownloadRoundedIcon />} variant={preview ? "outlined" : "contained"}>
              Download mapping support package
            </Button>
          </Stack>
        </DashboardPanel>
      ) : null}

      {preview ? (
        <DashboardPanel title="Mapping review">
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ flexWrap: "wrap" }}>
              <Chip label={preview.adapter} size="small" />
              <Chip label={period(preview)} size="small" variant="outlined" />
              <Chip label={`${preview.mappedExecutionCount} executions recognized`} size="small" variant="outlined" />
              <Chip label={`${preview.mappedPositionFactCount} position facts recognized`} size="small" variant="outlined" />
              <Chip label={`${preview.expectedPendingDecisionCount} expected decisions`} size="small" variant="outlined" />
            </Stack>

            <Alert severity="info">
              {preview.mappingOrigin === "verified_adapter"
                ? "This verified broker adapter mapped the statement automatically. Confirm the recognized fields and trading account before saving."
                : preview.mappingOrigin === "saved_exact_template"
                  ? "This account's previously accepted template matched the statement structure exactly. Confirm the fields and trading account before saving."
                  : "You selected these columns. Confirm the fields and trading account before saving; the accepted mapping will become this account's reusable exact template."}
            </Alert>

            <TableContainer>
              <Table size="small">
                <TableHead><TableRow><TableCell>Statement field</TableCell><TableCell>Saved as</TableCell></TableRow></TableHead>
                <TableBody>{preview.mappedFields.map((field) => (
                  <TableRow key={`${field.source}-${field.destination}`}>
                    <TableCell>{field.source}</TableCell>
                    <TableCell>{field.destination}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" } }}>
              <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 1.5 }}><Typography color="text.secondary" variant="caption">New executions</Typography><Typography sx={{ fontWeight: 800 }} variant="h3">{preview.plannedNewExecutionCount}</Typography></Box>
              <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 1.5 }}><Typography color="text.secondary" variant="caption">Matched executions</Typography><Typography sx={{ fontWeight: 800 }} variant="h3">{preview.plannedMatchedExecutionCount}</Typography></Box>
              <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 1.5 }}><Typography color="text.secondary" variant="caption">Ambiguous matches</Typography><Typography sx={{ fontWeight: 800 }} variant="h3">{preview.plannedAmbiguousExecutionCount}</Typography></Box>
            </Box>

            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" } }}>
              {Object.entries(preview.rowsByClassification).map(([classification, count]) => (
                <Box key={classification} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 1.5 }}>
                  <Typography color="text.secondary" variant="caption">{humanize(classification)}</Typography>
                  <Typography sx={{ fontWeight: 800 }} variant="h3">{count}</Typography>
                </Box>
              ))}
            </Box>

            {preview.issues.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow><TableCell>Mapping issue</TableCell><TableCell>Severity</TableCell><TableCell align="right">Rows</TableCell><TableCell>Blocks save</TableCell></TableRow></TableHead>
                  <TableBody>{preview.issues.map((issue) => (
                    <TableRow key={`${issue.issueCode}-${issue.severity}`}>
                      <TableCell>{humanize(issue.issueCode)}</TableCell>
                      <TableCell>{humanize(issue.severity)}</TableCell>
                      <TableCell align="right">{issue.count}</TableCell>
                      <TableCell>{issue.isBlocking ? "Yes" : "No - Data Decisions"}</TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table>
              </TableContainer>
            ) : <Alert severity="success">No mapping issues were found.</Alert>}

            <FormControlLabel
              control={<Checkbox checked={confirmedAccount} onChange={(event) => setConfirmedAccount(event.target.checked)} />}
              label={preview.sourceIdentityConfirmationRequired
                ? `Link this newly recognized broker account to ${preview.accountLabel} and save the statement`
                : `This statement belongs to ${preview.accountLabel}`}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
              <Button
                disabled={!confirmedAccount || !preview.canCommit || working !== null}
                onClick={() => void commitStatement()}
                variant="contained"
              >
                {working === "commit" ? "Saving..." : preview.exactReimport ? "Confirm existing statement" : "Save statement"}
              </Button>
              <Button href="/data-decisions" variant="outlined">Open Data Decisions</Button>
              <Typography color="text.secondary" variant="caption">
                Exact reuploads are idempotent. Earlier and later statements rebuild the same account-wide execution lifecycles.
              </Typography>
            </Stack>
          </Stack>
        </DashboardPanel>
      ) : null}

      <DashboardPanel title="Import history">
        {history.length === 0 ? (
          <Typography color="text.secondary" variant="body2">No replacement Journal imports are recorded yet.</Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead><TableRow><TableCell>Source</TableCell><TableCell>Period</TableCell><TableCell>Status</TableCell><TableCell align="right">Executions</TableCell><TableCell align="right">Decisions</TableCell></TableRow></TableHead>
              <TableBody>{history.map((item) => (
                <TableRow key={item.importBatchId}>
                  <TableCell>{item.sourceDisplayLabel}</TableCell>
                  <TableCell>{item.sourceKind === "broker_statement" ? period(item) : "Manual execution batch"}</TableCell>
                  <TableCell><Chip color={item.pendingDecisionCount > 0 ? "warning" : "success"} label={humanize(item.currentState)} size="small" /></TableCell>
                  <TableCell align="right">{item.mappedExecutionCount}</TableCell>
                  <TableCell align="right">
                    {item.pendingDecisionCount > 0 ? (
                      <Button href={`/data-decisions?importBatchId=${encodeURIComponent(item.importBatchId)}`} size="small">
                        {item.pendingDecisionCount}
                      </Button>
                    ) : 0}
                  </TableCell>
                </TableRow>
              ))}</TableBody>
            </Table>
          </TableContainer>
        )}
      </DashboardPanel>
    </Stack>
  );
}
