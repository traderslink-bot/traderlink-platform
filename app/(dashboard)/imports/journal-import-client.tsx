"use client";

import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
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
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";
import type {
  JournalGenericMappingField,
  JournalGenericStatementMappingContract,
} from "@/src/modules/journal/server/imports/journal-generic-mapped-statement-adapter";
import type { JournalImportMappingPreview } from "@/src/modules/journal/server/product/journal-import-product-service";
import type { JournalMappingSupportPackageV2 } from "@/src/modules/journal/server/product/journal-mapping-support-package";
import { DashboardPanel } from "../../dashboard-template";
import { FeatureHelpLink } from "../feature-help-link";

const PREVIEW_ENDPOINT = "/api/platform/journal/imports/preview";
const COMMIT_ENDPOINT = "/api/platform/journal/imports/commit";
const HISTORY_ENDPOINT = "/api/platform/journal/imports/history";
const AI_REPAIR_ENDPOINT = "/api/platform/journal/imports/ai-repair";

const MAPPING_FIELDS = Object.freeze([
  ["symbol", "Ticker", true],
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

type CompletedImport = Readonly<{
  status: "committed" | "already_imported";
  executionCount: number;
  pendingDecisionCount: number;
}>;

function blockingImportMessage(preview: JournalImportMappingPreview): string {
  if (preview.issues.some((issue) => issue.isBlocking)) {
    return "TraderLink needs a few trading details corrected before this statement can be saved.";
  }
  return "TraderLink could not save this statement yet. Check your mapping and try again.";
}

function importSaveErrorMessage(code: string | undefined): string {
  if (code === "TRADERLINK_JOURNAL_IMPORT_CONFLICT") {
    return "This statement is already saved in a different Trade Tracker.";
  }
  return code ?? "The statement could not be saved.";
}

export function JournalImportClient({
  expectedAccountSelectionRef,
}: {
  expectedAccountSelectionRef: string;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [filePickerKey, setFilePickerKey] = useState(0);
  const [attemptIdempotencyRef, setAttemptIdempotencyRef] = useState("");
  const [brokerName, setBrokerName] = useState("");
  const [sourceTimezone, setSourceTimezone] = useState("America/New_York");
  const [preview, setPreview] = useState<JournalImportMappingPreview | null>(null);
  const [importRef, setImportRef] = useState<string | null>(null);
  const [aiRepairOpen, setAiRepairOpen] = useState(false);
  const [discordCompletionRequested, setDiscordCompletionRequested] = useState(false);
  const [mappingSupport, setMappingSupport] = useState<JournalMappingSupportPackageV2 | null>(null);
  const [selectedTableSignature, setSelectedTableSignature] = useState("");
  const [manualColumns, setManualColumns] = useState<Partial<Record<JournalGenericMappingField, string>>>({});
  const [buyValues, setBuyValues] = useState("BUY,B,BOUGHT");
  const [sellValues, setSellValues] = useState("SELL,S,SOLD");
  const [defaultCurrency, setDefaultCurrency] = useState("USD");
  const [feeSignConvention, setFeeSignConvention] = useState<"cost_positive" | "cash_effect">("cost_positive");
  const [completed, setCompleted] = useState<CompletedImport | null>(null);
  const [history, setHistory] = useState<readonly JournalImportHistoryItem[]>([]);
  const [working, setWorking] = useState<"preview" | "commit" | "ai_repair" | null>(null);
  const [notice, setNotice] = useState<Readonly<{
    severity: "success" | "warning" | "error";
    text: string;
  }> | null>(null);

  async function refreshHistory(): Promise<readonly JournalImportHistoryItem[]> {
    const response = await fetch(HISTORY_ENDPOINT, { cache: "no-store" });
    if (!response.ok) return [];
    const packet = await response.json() as {
      imports?: readonly JournalImportHistoryItem[];
    };
    const imports = (packet.imports ?? []).filter((item) =>
      item.sourceKind === "broker_statement");
    setHistory(imports);
    return imports;
  }

  useEffect(() => {
    void refreshHistory();
  }, []);

  function acceptMappingSupport(support: JournalMappingSupportPackageV2 | null) {
    setMappingSupport(support);
    const firstTable = support?.tables[0];
    setSelectedTableSignature(firstTable?.structuralSignatureSha256 ?? "");
    setManualColumns(firstTable ? { ...firstTable.suggestedMapping } : {});
  }

  function clearUploadState() {
    setFile(null);
    setFilePickerKey((current) => current + 1);
    setAttemptIdempotencyRef("");
    setBrokerName("");
    setPreview(null);
    setImportRef(null);
    acceptMappingSupport(null);
  }

  async function previewStatement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file || !attemptIdempotencyRef || working) return;
    setWorking("preview");
    setNotice(null);
    setCompleted(null);
    setPreview(null);
    setImportRef(null);
    acceptMappingSupport(null);
    try {
      const data = new FormData();
      data.set("statement", file);
      data.set("sourceTimezone", sourceTimezone);
      data.set("brokerName", brokerName);
      data.set("attemptIdempotencyRef", attemptIdempotencyRef);
      const response = await fetch(PREVIEW_ENDPOINT, {
        method: "POST",
        headers: { [JOURNAL_MUTATION_REQUEST_HEADER]: "1" },
        body: data,
      });
      const packet = await response.json() as {
        preview?: JournalImportMappingPreview;
        result?: Readonly<{
          status: "committed" | "already_imported";
          createdExecutionCount: number;
          matchedExecutionCount: number;
          pendingDecisionCount: number;
        }>;
        mappingSupport?: JournalMappingSupportPackageV2;
        importRef?: string;
        status?: string;
        code?: string;
      };
      if (packet.status === "mapping_required" && packet.mappingSupport) {
        acceptMappingSupport(packet.mappingSupport);
        setImportRef(packet.importRef ?? null);
        setNotice({
          severity: "warning",
          text: "TraderLink could not map this statement safely. You can map it yourself, or allow AI to review this statement privately and configure it for import.",
        });
        return;
      }
      if (!response.ok || !packet.preview) {
        throw new Error(packet.code ?? "The statement could not be mapped.");
      }
      if (packet.result) {
        await refreshHistory();
        setCompleted({
          status: packet.result.status,
          executionCount: packet.result.status === "already_imported"
            ? packet.result.matchedExecutionCount
            : packet.result.createdExecutionCount,
          pendingDecisionCount: packet.result.pendingDecisionCount,
        });
        clearUploadState();
        return;
      }
      if (
        packet.preview.canCommit &&
        packet.preview.mappingOrigin !== "manual_mapping"
      ) {
        await commitStatement(packet.preview, true);
        return;
      }
      setPreview(packet.preview);
      setImportRef(packet.importRef ?? null);
      acceptMappingSupport(packet.mappingSupport ?? null);
      setNotice(packet.preview.canCommit
        ? null
        : { severity: "warning", text: blockingImportMessage(packet.preview) });
    } catch (error) {
      setNotice({
        severity: "error",
        text: error instanceof Error ? error.message : "The statement could not be mapped.",
      });
    } finally {
      setWorking(null);
    }
  }

  async function startAiRepair(): Promise<void> {
    if (!file || !importRef || working) return;
    setWorking("ai_repair");
    try {
      const data = new FormData();
      data.set("statement", file);
      data.set("importRef", importRef);
      data.set("discordCompletionRequested", discordCompletionRequested ? "yes" : "no");
      const response = await fetch(AI_REPAIR_ENDPOINT, {
        method: "POST", headers: { [JOURNAL_MUTATION_REQUEST_HEADER]: "1" }, body: data,
      });
      if (!response.ok) throw new Error("AI review could not be started. Please try again.");
      setAiRepairOpen(false);
      setNotice({ severity: "success", text: "Your private review request was saved. TraderLink will let you know when this import is ready." });
    } catch (error) {
      setNotice({ severity: "error", text: error instanceof Error ? error.message : "AI review could not be started." });
    } finally { setWorking(null); }
  }

  async function previewManualMapping() {
    const selectedTable = mappingSupport?.tables.find(
      (table) => table.structuralSignatureSha256 === selectedTableSignature,
    );
    if (!file || !attemptIdempotencyRef || !mappingSupport || !selectedTable || working || !brokerName.trim()) return;
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
    try {
      const data = new FormData();
      data.set("statement", file);
      data.set("sourceTimezone", sourceTimezone);
      data.set("brokerName", brokerName.trim());
      data.set("attemptIdempotencyRef", attemptIdempotencyRef);
      data.set("mappingContract", JSON.stringify(mapping));
      const response = await fetch(PREVIEW_ENDPOINT, {
        method: "POST",
        headers: { [JOURNAL_MUTATION_REQUEST_HEADER]: "1" },
        body: data,
      });
      const packet = await response.json() as {
        preview?: JournalImportMappingPreview;
        mappingSupport?: JournalMappingSupportPackageV2;
        code?: string;
      };
      if (!response.ok || !packet.preview) {
        throw new Error(packet.code ?? "The selected columns could not be mapped.");
      }
      setPreview(packet.preview);
      acceptMappingSupport(packet.mappingSupport ?? mappingSupport);
      setNotice(packet.preview.canCommit
        ? null
        : { severity: "warning", text: blockingImportMessage(packet.preview) });
    } catch (error) {
      setNotice({
        severity: "error",
        text: error instanceof Error ? error.message : "The selected columns could not be mapped.",
      });
    } finally {
      setWorking(null);
    }
  }

  async function commitStatement(
    candidate: JournalImportMappingPreview = preview!,
    confirmSourceIdentityLink = false,
  ) {
    if (
      !file ||
      !attemptIdempotencyRef ||
      !candidate ||
      !candidate.canCommit ||
      (candidate.sourceIdentityConfirmationRequired && !confirmSourceIdentityLink)
    ) return;
    setWorking("commit");
    setNotice(null);
    setPreview(null);
    try {
      const data = new FormData();
      data.set("statement", file);
      data.set("sourceTimezone", sourceTimezone);
      data.set("attemptIdempotencyRef", attemptIdempotencyRef);
      data.set("previewRef", candidate.previewRef);
      data.set("expectedAccountSelectionRef", candidate.accountSelectionRef || expectedAccountSelectionRef);
      data.set(
        "confirmSourceIdentityLink",
        candidate.sourceIdentityConfirmationRequired && confirmSourceIdentityLink
          ? "yes"
          : "no",
      );
      data.set("confirmationAction", "commit_statement");
      data.set("commitKind", candidate.commitKind);
      if (candidate.mappingContract) {
        data.set("mappingContract", JSON.stringify(candidate.mappingContract));
      }
      const response = await fetch(COMMIT_ENDPOINT, {
        method: "POST",
        headers: { [JOURNAL_MUTATION_REQUEST_HEADER]: "1" },
        body: data,
      });
      const responseText = await response.text();
      let packet: {
        result?: Readonly<{
          status: "committed" | "already_imported";
          createdExecutionCount: number;
          matchedExecutionCount: number;
          pendingDecisionCount: number;
        }>;
        code?: string;
      } = {};
      try {
        packet = JSON.parse(responseText) as typeof packet;
      } catch {
        throw new Error("The statement could not be saved. Please try Upload again.");
      }
      if (!response.ok || !packet.result) {
        throw new Error(importSaveErrorMessage(packet.code));
      }
      await refreshHistory();
      setCompleted({
        status: packet.result.status,
        executionCount: packet.result.status === "already_imported"
          ? packet.result.matchedExecutionCount
          : packet.result.createdExecutionCount,
        pendingDecisionCount: packet.result.pendingDecisionCount,
      });
      clearUploadState();
    } catch (error) {
      setPreview(candidate);
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
      <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box>
          <Typography component="h1" variant="h1">
            Import Trades
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">
            To import your trades you need to upload your broker statements
          </Typography>
          <Box component="ol" sx={{ color: "text.secondary", mb: 0, mt: 1, pl: 2.5 }}>
            <li><Typography color="text.secondary" variant="body2">Import your broker statements in CSV format.</Typography></li>
            <li><Typography color="text.secondary" variant="body2">Your statement will be auto saved if the system detects it.</Typography></li>
            <li><Typography color="text.secondary" variant="body2">If detection fails you can try to map your statement CSV headings with the app&apos;s import headings.</Typography></li>
            <li><Typography color="text.secondary" variant="body2">If mapping fails you can select to send your statement to AI for processing.</Typography></li>
          </Box>
        </Box>
        <FeatureHelpLink href="/help/notifications-and-imports" label="Import Trades" size="medium" />
      </Stack>

      {notice ? <Alert severity={notice.severity}>{notice.text}</Alert> : null}
      {working === "commit" ? (
        <DashboardPanel title="Importing statement">
          <Stack spacing={1.5}>
            <Typography color="text.secondary" variant="body2">
              Importing your statement into this Trade Tracker. Please keep this page open.
            </Typography>
            <LinearProgress />
          </Stack>
        </DashboardPanel>
      ) : null}

      {completed ? (
        <DashboardPanel title={completed.status === "already_imported" ? "Statement already saved" : "Statement saved"}>
          <Stack spacing={1.5}>
            <Typography variant="body2">
              {completed.status === "already_imported"
                ? "This statement is already in your Trade Tracker. Nothing was added twice."
                : `${completed.executionCount} execution${completed.executionCount === 1 ? "" : "s"} added to your Trade Tracker.`}
            </Typography>
            {completed.pendingDecisionCount > 0 ? (
              <Alert severity="warning">
                {completed.pendingDecisionCount} item{completed.pendingDecisionCount === 1 ? " needs" : "s need"} your review before every affected trade result can be complete.
              </Alert>
            ) : null}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button onClick={() => setCompleted(null)} variant="contained">Upload another statement</Button>
              <Button href={completed.pendingDecisionCount > 0 ? "/data-decisions" : "/workspace"} variant="outlined">
                {completed.pendingDecisionCount > 0 ? "Review items" : "View trades"}
              </Button>
            </Stack>
          </Stack>
        </DashboardPanel>
      ) : null}

      {!completed && working !== "commit" ? <DashboardPanel hideHeader>
        <Box component="form" onSubmit={(event) => void previewStatement(event)}>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
              <Typography component="h2" sx={{ fontWeight: 750 }} variant="subtitle1">Select Statement from your device</Typography>
              <FeatureHelpLink href="/help/notifications-and-imports/import-a-statement#choose-a-statement" label="choose a statement" />
            </Stack>
            <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
              <Button
                component="label"
                startIcon={<CloudUploadRoundedIcon />}
                sx={{
                  flex: { md: "0 1 25%" },
                  justifyContent: "flex-start",
                  maxWidth: { md: 360 },
                  minHeight: 56,
                  minWidth: { md: 260 },
                  overflow: "hidden",
                  width: { xs: "100%", md: "25%" },
                  "& .MuiButton-startIcon": { flexShrink: 0 },
                }}
                variant="outlined"
              >
                <Box component="span" sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {file ? file.name : "Choose CSV statement"}
                </Box>
                <input
                  accept=".csv,text/csv,text/plain"
                  hidden
                  key={filePickerKey}
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0] ?? null;
                    setFile(nextFile);
                    setAttemptIdempotencyRef(
                      nextFile ? globalThis.crypto.randomUUID() : "",
                    );
                    setPreview(null);
                    acceptMappingSupport(null);
                    setCompleted(null);
                  }}
                  type="file"
                />
              </Button>
              <Button disabled={!file || working !== null} type="submit" variant="contained">
                {working === "preview" ? "Uploading..." : "Upload"}
              </Button>
            </Stack>
          </Stack>
        </Box>
      </DashboardPanel> : null}

      {mappingSupport && !preview && working !== "commit" ? (
        <DashboardPanel title="Map your statement">
          <Stack spacing={2}>
            <Typography color="text.secondary" variant="body2">
              TraderLink could not read this statement automatically. Choose where it can find each trading detail below, then save your mapping.
            </Typography>
            {importRef ? (
              <Button onClick={() => setAiRepairOpen(true)} variant="outlined">
                Ask AI to map this statement
              </Button>
            ) : null}
            {!preview && mappingSupport.tables.length > 0 ? (
              <Stack spacing={2}>
                <Stack direction={{ xs: "column", md: "row" }} spacing={1.5}>
                  <TextField
                    fullWidth
                    label="Broker name"
                    onChange={(event) => setBrokerName(event.target.value)}
                    placeholder="For example, Robinhood"
                    value={brokerName}
                  />
                  <TextField
                    fullWidth
                    label="Statement timezone"
                    onChange={(event) => setSourceTimezone(event.target.value)}
                    value={sourceTimezone}
                  />
                </Stack>
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
                        {table.tableLabel} ({table.fieldCount} columns)
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
                      Map either one combined date-and-time column, or both separate date and time columns. Ticker, buy or sell, quantity, and price are always required.
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
                      {working === "preview" ? "Checking mapping..." : "Save mapping"}
                    </Button>
                  </>
                ) : null}
              </Stack>
            ) : null}
            {!preview && mappingSupport.tables.length === 0 ? (
              <Alert severity="warning">
                TraderLink could not identify a table to map. You can ask AI to review this statement instead.
              </Alert>
            ) : null}
          </Stack>
        </DashboardPanel>
      ) : null}

      <Dialog fullWidth maxWidth="sm" onClose={() => !working && setAiRepairOpen(false)} open={aiRepairOpen}>
        <DialogTitle>Allow AI to review your statement</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Typography>Your statement is not yet supported, so the import failed.</Typography>
            <Typography>Allow TraderLink to send this statement to OpenAI so it can suggest a mapping. OpenAI is used only for this import and is asked not to store the request. TraderLink checks the suggested mapping before it imports anything.</Typography>
            <FormControlLabel control={<Checkbox checked={discordCompletionRequested} onChange={(event) => setDiscordCompletionRequested(event.target.checked)} />} label="Send me a Discord DM when this import is complete" />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button disabled={working !== null} onClick={() => setAiRepairOpen(false)}>Not now</Button>
          <Button disabled={working !== null} onClick={() => void startAiRepair()} variant="contained">{working === "ai_repair" ? "Starting..." : "Allow AI review"}</Button>
        </DialogActions>
      </Dialog>


      {preview ? (
        <DashboardPanel title="Save your statement">
          <Stack spacing={2}>
            <Typography color="text.secondary" variant="body2">
              Your mapping is ready. Save this statement to add the trades to your Trade Tracker.
            </Typography>
            {!preview.canCommit ? <Alert severity="warning">{blockingImportMessage(preview)}</Alert> : null}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
              <Button
                disabled={!preview.canCommit || working !== null}
                onClick={() => void commitStatement(preview, true)}
                variant="contained"
              >
                {working === "commit" ? "Saving..." : "Save statement"}
              </Button>
            </Stack>
          </Stack>
        </DashboardPanel>
      ) : null}

      <DashboardPanel action={<FeatureHelpLink href="/help/notifications-and-imports/import-history-and-follow-up#import-history" label="Import history" />} title="Import history">
        {history.length === 0 ? (
          <Typography color="text.secondary" variant="body2">No broker statements are recorded yet.</Typography>
        ) : (
          <>
            <TableContainer sx={{ display: { xs: "none", md: "block" } }}>
              <Table size="small">
                <TableHead><TableRow><TableCell>Statement</TableCell><TableCell>Period</TableCell><TableCell>Status</TableCell><TableCell>Follow-up</TableCell></TableRow></TableHead>
                <TableBody>{history.map((item) => (
                  <TableRow key={item.importBatchId}>
                    <TableCell>{item.sourceDisplayLabel}</TableCell>
                    <TableCell>{period(item)}</TableCell>
                    <TableCell><Chip color={item.pendingDecisionCount > 0 ? "warning" : "success"} label={humanize(item.currentState)} size="small" /></TableCell>
                    <TableCell>
                      {item.pendingDecisionCount > 0 ? (
                        <Button href={`/data-decisions?importBatchId=${encodeURIComponent(item.importBatchId)}`} size="small" variant="outlined">
                          Review {item.pendingDecisionCount} item{item.pendingDecisionCount === 1 ? "" : "s"}
                        </Button>
                      ) : "Nothing to review"}
                    </TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </TableContainer>
            <Stack spacing={1} sx={{ display: { xs: "flex", md: "none" } }}>
              {history.map((item) => (
                <Box key={item.importBatchId} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 1.25 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
                    <Box>
                      <Typography sx={{ fontWeight: 850 }} variant="body2">{item.sourceDisplayLabel}</Typography>
                      <Typography color="text.secondary" variant="caption">{period(item)}</Typography>
                    </Box>
                    <Chip color={item.pendingDecisionCount > 0 ? "warning" : "success"} label={humanize(item.currentState)} size="small" />
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between", mt: 1 }}>
                    {item.pendingDecisionCount > 0 ? <Button href={`/data-decisions?importBatchId=${encodeURIComponent(item.importBatchId)}`} size="small" variant="outlined">Review {item.pendingDecisionCount} item{item.pendingDecisionCount === 1 ? "" : "s"}</Button> : <Typography color="text.secondary" variant="body2">Nothing to review</Typography>}
                  </Stack>
                </Box>
              ))}
            </Stack>
          </>
        )}
      </DashboardPanel>
    </Stack>
  );
}
