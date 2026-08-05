"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import type { JournalAdminImportDetail, JournalAdminSensitiveAccessReason } from "@/src/modules/journal/contracts/journal-administration-contracts";
import {
  JOURNAL_ADMIN_IDEMPOTENCY_HEADER,
  JOURNAL_ADMIN_REQUEST_HEADER,
} from "@/src/modules/platform/contracts/journal-admin-request";
import { formatAdminInteger, formatAdminUtc, JournalAdminStatus } from "../journal-admin-ui";

export function ImportDetailButton({ importRef }: { importRef: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<JournalAdminSensitiveAccessReason>(
    "importer_diagnostics",
  );
  const [detail, setDetail] = useState<JournalAdminImportDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/journal/imports/${encodeURIComponent(importRef)}/detail-access`,
        {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
          headers: {
            "content-type": "application/json",
            [JOURNAL_ADMIN_REQUEST_HEADER]: "1",
          },
          body: JSON.stringify({ reasonCode: reason }),
        },
      );
      const body: unknown = await response.json();
      if (!response.ok || !body || typeof body !== "object" || !("import" in body)) {
        throw new Error("Import details could not be opened.");
      }
      setDetail((body as { import: JournalAdminImportDetail }).import);
    } catch {
      setError("Import details are unavailable right now. The access attempt was recorded.");
    } finally {
      setLoading(false);
    }
  };
  const downloadSource = async () => {
    setDownloading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/journal/imports/${encodeURIComponent(importRef)}/consented-source-download`,
        {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
          headers: {
            "content-type": "application/json",
            [JOURNAL_ADMIN_REQUEST_HEADER]: "1",
            [JOURNAL_ADMIN_IDEMPOTENCY_HEADER]: crypto.randomUUID(),
          },
          body: JSON.stringify({ reasonCode: reason }),
        },
      );
      if (!response.ok) throw new Error();
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = "journal-consented-statement.csv";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("The shared statement is unavailable. Consent may have expired or been withdrawn.");
    } finally {
      setDownloading(false);
    }
  };
  return (
    <>
      <Button onClick={() => setOpen(true)} size="small" variant="outlined">Review details</Button>
      <Dialog fullWidth maxWidth="md" onClose={() => setOpen(false)} open={open}>
        <DialogTitle>Import details</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
            This audited view uses safe structure and outcome evidence. It does not show statement cells, filenames, account identifiers, trades or financial values.
          </Typography>
          {detail ? (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}>
                <Box>
                  <Typography sx={{ fontWeight: 800 }}>{detail.summary.safeBrokerLabel ?? "Broker not supplied"}</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {detail.summary.userDisplayName} · {detail.summary.accountDisplayName}
                  </Typography>
                </Box>
                <JournalAdminStatus state={detail.summary.currentState} />
              </Stack>
              <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(4, minmax(0, 1fr))" } }}>
                <Box><Typography color="text.secondary" variant="caption">Preserved rows</Typography><Typography sx={{ fontWeight: 800 }}>{formatAdminInteger(detail.summary.preservedRowCount)}</Typography></Box>
                <Box><Typography color="text.secondary" variant="caption">Mapped executions</Typography><Typography sx={{ fontWeight: 800 }}>{formatAdminInteger(detail.summary.mappedExecutionCount)}</Typography></Box>
                <Box><Typography color="text.secondary" variant="caption">Unsupported rows</Typography><Typography sx={{ fontWeight: 800 }}>{formatAdminInteger(detail.summary.unsupportedRowCount)}</Typography></Box>
                <Box><Typography color="text.secondary" variant="caption">Data Decisions</Typography><Typography sx={{ fontWeight: 800 }}>{formatAdminInteger(detail.summary.pendingDecisionCount)}</Typography></Box>
              </Box>
              <Alert severity={detail.sanitizedStructure ? "success" : "info"}>
                {detail.sanitizedStructure
                  ? "A privacy-safe statement layout is available for importer work."
                  : "No privacy-safe statement layout is attached to this import."}
              </Alert>
              {detail.summary.consentedSourceAvailable ? (
                <Alert
                  action={(
                    <Button
                      color="inherit"
                      disabled={downloading}
                      onClick={downloadSource}
                      size="small"
                    >
                      {downloading ? "Preparing…" : "Download shared statement"}
                    </Button>
                  )}
                  severity="warning"
                >
                  The trader has temporarily shared this statement for importer development. The download is audited and must remain outside Git and shared folders.
                </Alert>
              ) : null}
              <Box>
                <Typography component="h3" sx={{ fontWeight: 800, mb: 1 }}>Outcome timeline</Typography>
                <Stack spacing={1}>
                  {detail.timeline.map((event) => (
                    <Stack direction="row" key={`${event.sequence}-${event.occurredAtUtc}`} spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, textTransform: "capitalize" }}>{event.reasonCode.replaceAll("_", " ")}</Typography>
                        <Typography color="text.secondary" variant="caption">{formatAdminUtc(event.occurredAtUtc)}</Typography>
                      </Box>
                      <JournalAdminStatus state={event.newState} />
                    </Stack>
                  ))}
                </Stack>
              </Box>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id={`import-detail-reason-${importRef}`}>Reason for access</InputLabel>
                <Select
                  label="Reason for access"
                  labelId={`import-detail-reason-${importRef}`}
                  onChange={(event) => setReason(event.target.value as JournalAdminSensitiveAccessReason)}
                  value={reason}
                >
                  <MenuItem value="importer_diagnostics">Importer diagnostics</MenuItem>
                  <MenuItem value="data_integrity_review">Data integrity review</MenuItem>
                  <MenuItem value="owner_support_review">Owner support review</MenuItem>
                  <MenuItem value="security_review">Security review</MenuItem>
                </Select>
              </FormControl>
              {error ? <Alert severity="error">{error}</Alert> : null}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
          {!detail ? (
            <Button disabled={loading} onClick={load} variant="contained">
              {loading ? "Opening…" : "Open audited details"}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </>
  );
}
