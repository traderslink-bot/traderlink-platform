"use client";

import CloudUploadRoundedIcon from "@mui/icons-material/CloudUploadRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
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
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { DashboardPanel } from "./dashboard-template";

const IMPORT_ENDPOINT = "/api/intelligence/broker-csv-import/v1";
const HISTORY_ENDPOINT = `${IMPORT_ENDPOINT}/history`;
const SAVED_MAPPING_KEY = "ti-v3-private-csv-mappings-v1";

const BROKER_OPTIONS = [
  ["auto", "Detect broker automatically"],
  ["ibkr_activity_statement", "Interactive Brokers"],
  ["das_trader_pro", "DAS Trader Pro"],
  ["sterling_trader_pro", "Sterling Trader Pro"],
  ["thinkorswim_trade_history", "thinkorswim"],
  ["questrade_iq_edge", "Questrade IQ Edge"],
  ["alpaca_trade_activities", "Alpaca"],
  ["tradezero_historical_fills", "TradeZero"],
  ["tradervue_generic_executions", "Tradervue"],
  ["moomoo_trade_history", "Moomoo"],
  ["webull_order_history", "Webull"],
  ["robinhood_transaction_history", "Robinhood"],
  ["schwab_transactions", "Charles Schwab"],
  ["fidelity_account_history", "Fidelity"],
  ["tastytrade_transaction_history", "tastytrade"],
  ["trading212_history", "Trading 212"],
  ["swissquote_transaction_history", "Swissquote"],
  ["custom", "Custom CSV mapping"],
] as const;

type CustomMapping = Readonly<{
  timestamp: string;
  date: string;
  time: string;
  symbol: string;
  side: string;
  quantity: string;
  price: string;
  currency: string;
  commission: string;
  fees: string;
  orderId: string;
  executionId: string;
}>;

type SavedMapping = Readonly<{
  name: string;
  timezone: string;
  mapping: CustomMapping;
}>;

type HistoryItem = Readonly<{
  persistenceDigest: string;
  importedAt: string;
  broker: string;
  acceptedRows: string;
  rowsNeedingAttention: string;
  firstExecutionAt: string | null;
  lastExecutionAt: string | null;
}>;

type ImportResponse = Readonly<{
  status?: string;
  duplicateIgnored?: boolean;
  brokerLabel?: string;
  acceptedExecutionCount?: string;
  rowsNeedingAttention?: string;
  analyticsReady?: boolean;
  imports?: readonly HistoryItem[];
  error?: Readonly<{ message?: string }>;
}>;

const EMPTY_MAPPING: CustomMapping = {
  timestamp: "",
  date: "",
  time: "",
  symbol: "",
  side: "",
  quantity: "",
  price: "",
  currency: "",
  commission: "",
  fees: "",
  orderId: "",
  executionId: "",
};

function readSavedMappings(): readonly SavedMapping[] {
  try {
    const parsed: unknown = JSON.parse(
      window.localStorage.getItem(SAVED_MAPPING_KEY) ?? "[]",
    );
    return Array.isArray(parsed) ? (parsed as readonly SavedMapping[]) : [];
  } catch {
    return [];
  }
}

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date)
    : value;
}

function brokerLabel(value: string): string {
  return (
    BROKER_OPTIONS.find(([key]) => key === value)?.[1] ??
    value.replace(/_/g, " ")
  );
}

export function BrokerCsvImportClient() {
  const router = useRouter();
  const [broker, setBroker] = useState("auto");
  const [file, setFile] = useState<File | null>(null);
  const [currency, setCurrency] = useState("USD");
  const [timezone, setTimezone] = useState("America/New_York");
  const [mapping, setMapping] = useState<CustomMapping>(EMPTY_MAPPING);
  const [mappingName, setMappingName] = useState("");
  const [savedMappings, setSavedMappings] = useState<readonly SavedMapping[]>([]);
  const [history, setHistory] = useState<readonly HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<Readonly<{
    severity: "success" | "warning" | "error";
    text: string;
  }> | null>(null);

  useEffect(() => {
    setSavedMappings(readSavedMappings());
    void fetch(HISTORY_ENDPOINT, { cache: "no-store" })
      .then(async (response) => {
        const body = (await response.json()) as {
          imports?: readonly HistoryItem[];
        };
        if (response.ok) setHistory(body.imports ?? []);
      })
      .finally(() => setLoadingHistory(false));
  }, []);

  const customPayload = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(mapping).filter(([, value]) => value.trim().length > 0),
      ),
    [mapping],
  );

  function updateMapping(field: keyof CustomMapping, value: string) {
    setMapping((current) => ({ ...current, [field]: value }));
  }

  function saveMapping() {
    const name = mappingName.trim();
    if (!name) {
      setMessage({
        severity: "error",
        text: "Give this private mapping a name before saving it.",
      });
      return;
    }
    const next = [
      ...savedMappings.filter((item) => item.name !== name),
      { name, timezone, mapping },
    ].sort((left, right) => left.name.localeCompare(right.name));
    window.localStorage.setItem(SAVED_MAPPING_KEY, JSON.stringify(next));
    setSavedMappings(next);
    setMessage({
      severity: "success",
      text: `Saved “${name}” privately on this computer.`,
    });
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setMessage({ severity: "error", text: "Choose a CSV file first." });
      return;
    }
    if (
      broker === "custom" &&
      (!mapping.symbol ||
        !mapping.side ||
        !mapping.quantity ||
        !mapping.price ||
        (!mapping.timestamp && !mapping.date))
    ) {
      setMessage({
        severity: "error",
        text: "Map timestamp or date, symbol, side, quantity, and price.",
      });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    try {
      const response = await fetch(IMPORT_ENDPOINT, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          csvText: await file.text(),
          broker,
          defaultCurrency: currency.trim().toUpperCase(),
          ...(broker === "custom"
            ? { timestampTimezone: timezone, customMapping: customPayload }
            : {}),
        }),
      });
      const body = (await response.json()) as ImportResponse;
      if (
        !response.ok ||
        (body.status !== "persisted" && body.status !== "duplicate_ignored")
      ) {
        throw new Error(body.error?.message ?? "The CSV could not be imported.");
      }
      setHistory(body.imports ?? []);
      setFile(null);
      if (body.status === "duplicate_ignored" || body.duplicateIgnored) {
        setMessage({
          severity: "warning",
          text: "This CSV was already imported. No executions were added.",
        });
        return;
      }
      const attention = Number(body.rowsNeedingAttention ?? "0");
      setMessage({
        severity: attention > 0 ? "warning" : "success",
        text:
          attention > 0
            ? `${body.acceptedExecutionCount} executions imported. ${attention} rows need a corrected CSV value.`
            : `${body.acceptedExecutionCount} executions imported from ${body.brokerLabel ?? "the CSV"}. Analytics are ready.`,
      });
      router.refresh();
    } catch (error) {
      setMessage({
        severity: "error",
        text:
          error instanceof Error
            ? error.message
            : "The CSV could not be imported.",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack spacing={2}>
      {message ? <Alert severity={message.severity}>{message.text}</Alert> : null}
      <DashboardPanel title="Import a broker statement">
        <Box
          component="form"
          onSubmit={(event) => void submit(event)}
          sx={{ display: "grid", gap: 2 }}
        >
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                md: "minmax(220px, 0.7fr) minmax(0, 1.3fr) 120px",
              },
            }}
          >
            <TextField
              label="Broker format"
              onChange={(event) => setBroker(event.target.value)}
              select
              value={broker}
            >
              {BROKER_OPTIONS.map(([value, label]) => (
                <MenuItem key={value} value={value}>
                  {label}
                </MenuItem>
              ))}
            </TextField>
            <Button
              component="label"
              startIcon={<CloudUploadRoundedIcon />}
              sx={{ justifyContent: "flex-start", minHeight: 56 }}
              variant="outlined"
            >
              {file?.name ?? "Choose CSV file"}
              <input
                accept=".csv,text/csv,text/plain"
                hidden
                onChange={(event) =>
                  setFile(event.target.files?.[0] ?? null)
                }
                type="file"
              />
            </Button>
            <TextField
              label="Currency"
              onChange={(event) => setCurrency(event.target.value.toUpperCase())}
              slotProps={{ htmlInput: { maxLength: 3 } }}
              value={currency}
            />
          </Box>

          {broker === "custom" ? (
            <Stack spacing={2}>
              <Alert severity="info">
                Custom mappings stay private on this computer and never become
                shared broker presets automatically.
              </Alert>
              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: {
                    xs: "minmax(0, 1fr)",
                    sm: "repeat(2, minmax(0, 1fr))",
                    lg: "repeat(4, minmax(0, 1fr))",
                  },
                }}
              >
                {(
                  [
                    ["timestamp", "Timestamp header"],
                    ["date", "Date header"],
                    ["time", "Time header"],
                    ["symbol", "Symbol header"],
                    ["side", "Side header"],
                    ["quantity", "Quantity header"],
                    ["price", "Price header"],
                    ["currency", "Currency header"],
                    ["commission", "Commission header"],
                    ["fees", "Fees header"],
                    ["orderId", "Order ID header"],
                    ["executionId", "Execution ID header"],
                  ] as const
                ).map(([field, label]) => (
                  <TextField
                    key={field}
                    label={label}
                    onChange={(event) =>
                      updateMapping(field, event.target.value)
                    }
                    value={mapping[field]}
                  />
                ))}
                <TextField
                  label="Timestamp timezone"
                  onChange={(event) => setTimezone(event.target.value)}
                  value={timezone}
                />
              </Box>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  fullWidth
                  label="Private mapping name"
                  onChange={(event) => setMappingName(event.target.value)}
                  value={mappingName}
                />
                <Button
                  onClick={saveMapping}
                  startIcon={<SaveRoundedIcon />}
                  variant="outlined"
                >
                  Save mapping
                </Button>
                {savedMappings.length > 0 ? (
                  <TextField
                    label="Load saved mapping"
                    onChange={(event) => {
                      const selected = savedMappings.find(
                        (item) => item.name === event.target.value,
                      );
                      if (selected) {
                        setMappingName(selected.name);
                        setMapping(selected.mapping);
                        setTimezone(selected.timezone);
                      }
                    }}
                    select
                    value=""
                    sx={{ minWidth: 220 }}
                  >
                    {savedMappings.map((item) => (
                      <MenuItem key={item.name} value={item.name}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </TextField>
                ) : null}
              </Stack>
            </Stack>
          ) : null}

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
          >
            <Typography color="text.secondary" variant="body2">
              Trades are stored only in the fixed local V3 execution source.
            </Typography>
            <Button
              disabled={submitting}
              startIcon={
                submitting ? (
                  <CircularProgress color="inherit" size={18} />
                ) : (
                  <CloudUploadRoundedIcon />
                )
              }
              type="submit"
              variant="contained"
            >
              {submitting ? "Importing…" : "Import CSV"}
            </Button>
          </Stack>
        </Box>
      </DashboardPanel>

      <DashboardPanel title="Import history">
        {loadingHistory ? (
          <Stack sx={{ alignItems: "center", py: 3 }}>
            <CircularProgress size={24} />
          </Stack>
        ) : history.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            No V3 execution imports are stored yet.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Imported</TableCell>
                  <TableCell>Broker</TableCell>
                  <TableCell align="right">Executions</TableCell>
                  <TableCell align="right">Needs attention</TableCell>
                  <TableCell>Execution period</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {history.map((item) => (
                  <TableRow key={item.persistenceDigest}>
                    <TableCell>{formatDateTime(item.importedAt)}</TableCell>
                    <TableCell>{brokerLabel(item.broker)}</TableCell>
                    <TableCell align="right">{item.acceptedRows}</TableCell>
                    <TableCell align="right">
                      {Number(item.rowsNeedingAttention) > 0 ? (
                        <Chip
                          color="warning"
                          label={item.rowsNeedingAttention}
                          size="small"
                        />
                      ) : (
                        "0"
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDateTime(item.firstExecutionAt)} –{" "}
                      {formatDateTime(item.lastExecutionAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </DashboardPanel>
    </Stack>
  );
}
