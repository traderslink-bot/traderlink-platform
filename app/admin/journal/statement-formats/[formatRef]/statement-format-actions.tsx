"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  JOURNAL_ADMIN_IDEMPOTENCY_HEADER,
  JOURNAL_ADMIN_REQUEST_HEADER,
} from "@/src/modules/platform/contracts/journal-admin-request";

type FormatOption = Readonly<{
  formatRef: string;
  label: string;
  revision: number;
  state: string;
}>;

const NEXT_STATE: Readonly<Record<string, string>> = Object.freeze({
  observed: "mapping_available",
  mapping_available: "ready_for_development",
  ready_for_development: "in_development",
  in_development: "validating",
  validating: "supported",
});
const NEXT_LABEL: Readonly<Record<string, string>> = Object.freeze({
  mapping_available: "Confirm mapping evidence",
  ready_for_development: "Mark ready for development",
  in_development: "Begin importer development",
  validating: "Begin importer validation",
  supported: "Confirm deployed support",
});

function requestHeaders(): Record<string, string> {
  return {
    "content-type": "application/json",
    [JOURNAL_ADMIN_REQUEST_HEADER]: "1",
    [JOURNAL_ADMIN_IDEMPOTENCY_HEADER]: crypto.randomUUID(),
  };
}

function startDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function StatementFormatActions({
  formatRef,
  revision,
  lifecycleState,
  developerPackageAvailable,
  mergeOptions,
}: Readonly<{
  formatRef: string;
  revision: number;
  lifecycleState: string;
  developerPackageAvailable: boolean;
  mergeOptions: readonly FormatOption[];
}>) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retainedRef, setRetainedRef] = useState("");
  const nextState = NEXT_STATE[lifecycleState];

  const transition = async (newState: string, rejectionReasonCode?: string) => {
    setBusy("transition");
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/admin/journal/statement-formats/${encodeURIComponent(formatRef)}/transition`,
        {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
          headers: requestHeaders(),
          body: JSON.stringify({ expectedRevision: revision, newState, rejectionReasonCode }),
        },
      );
      if (!response.ok) throw new Error();
      setMessage(newState === "rejected"
        ? "The format was closed without changing any trader data."
        : "The format review stage was updated.");
      router.refresh();
    } catch {
      setError("The format could not be updated. Refresh the page and try again.");
    } finally {
      setBusy(null);
    }
  };

  const merge = async () => {
    const retained = mergeOptions.find((option) => option.formatRef === retainedRef);
    if (!retained) return;
    setBusy("merge");
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/admin/journal/statement-formats/${encodeURIComponent(formatRef)}/merge`,
        {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
          headers: requestHeaders(),
          body: JSON.stringify({
            retainedFormatRef: retained.formatRef,
            expectedDuplicateRevision: revision,
            expectedRetainedRevision: retained.revision,
          }),
        },
      );
      if (!response.ok) throw new Error();
      setMessage("This duplicate now points to the retained format. Its evidence was preserved.");
      router.refresh();
    } catch {
      setError("The formats could not be merged. Refresh the page and review their current stages.");
    } finally {
      setBusy(null);
    }
  };

  const downloadPackage = async () => {
    setBusy("package");
    setError(null);
    setMessage(null);
    try {
      const response = await fetch(
        `/api/admin/journal/statement-formats/${encodeURIComponent(formatRef)}/developer-package`,
        {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
          headers: requestHeaders(),
          body: JSON.stringify({ expectedRevision: revision }),
        },
      );
      if (!response.ok) throw new Error();
      startDownload(await response.blob(), "journal-importer-development.zip");
      setMessage("The privacy-safe importer package was downloaded.");
    } catch {
      setError("The development package is unavailable right now.");
    } finally {
      setBusy(null);
    }
  };

  const terminal = ["supported", "duplicate", "rejected"].includes(lifecycleState);
  return (
    <Stack spacing={2}>
      <Typography color="text.secondary" variant="body2">
        These controls manage importer support evidence only. They cannot edit statement rows, executions, trades or trader decisions.
      </Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
        {nextState ? (
          <Button
            disabled={busy !== null}
            onClick={() => transition(nextState)}
            variant="contained"
          >
            {NEXT_LABEL[nextState] ?? "Advance review"}
          </Button>
        ) : null}
        <Button
          disabled={busy !== null || !developerPackageAvailable}
          onClick={downloadPackage}
          variant="outlined"
        >
          Download safe development package
        </Button>
        {!terminal ? (
          <Button
            color="error"
            disabled={busy !== null}
            onClick={() => transition("rejected", "not_importable_format")}
            variant="text"
          >
            Close as not importable
          </Button>
        ) : null}
      </Stack>
      {!terminal && mergeOptions.length > 0 ? (
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.25}>
          <FormControl fullWidth size="small">
            <InputLabel id="retained-format-label">Retain this format</InputLabel>
            <Select
              label="Retain this format"
              labelId="retained-format-label"
              onChange={(event) => setRetainedRef(event.target.value)}
              value={retainedRef}
            >
              {mergeOptions.map((option) => (
                <MenuItem key={option.formatRef} value={option.formatRef}>
                  {option.label} · {option.state.replaceAll("_", " ")}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            disabled={busy !== null || retainedRef.length === 0}
            onClick={merge}
            variant="outlined"
          >
            Mark current format as duplicate
          </Button>
        </Stack>
      ) : null}
      {message ? <Alert severity="success">{message}</Alert> : null}
      {error ? <Alert severity="error">{error}</Alert> : null}
    </Stack>
  );
}
