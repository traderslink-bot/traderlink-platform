"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, Stack, Switch } from "@mui/material";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";

type AuditState = { enabled: boolean; deleting: boolean };
const endpoint = "/api/admin/screeners/audit/control";

export function ScannerAuditControls() {
  const [state, setState] = useState<AuditState>();
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean }>();

  useEffect(() => {
    const abort = new AbortController();
    void fetch(endpoint, { cache: "no-store", signal: abort.signal }).then(async response => {
      if (!response.ok) throw Error();
      setState(await response.json());
    }).catch(() => {
      if (!abort.signal.aborted) setNotice({ text: "Audit settings could not load. Reload to try again.", error: true });
    });
    return () => abort.abort();
  }, []);

  const mutate = async (method: "POST" | "DELETE", enabled?: boolean) => {
    setBusy(true);
    setNotice(undefined);
    try {
      const response = await fetch(endpoint, {
        method,
        headers: { [PLATFORM_MUTATION_REQUEST_HEADER]: "1", "Content-Type": "application/json" },
        ...(method === "POST" ? { body: JSON.stringify({ enabled }) } : {}),
      });
      if (!response.ok) throw Error();
      setState(await response.json());
      if (method === "DELETE") {
        setConfirm(false);
        setNotice({ text: "Saved audit history deleted.", error: false });
      }
    } catch {
      setConfirm(false);
      setNotice({ text: method === "DELETE" ? "Audit history could not be deleted. Try again." : "Audit recording could not be changed. Try again.", error: true });
    } finally {
      setBusy(false);
    }
  };

  return <Stack spacing={1}>
    <Stack direction="row" sx={{ flexWrap: "wrap", alignItems: "center", gap: 1 }}>
      <FormControlLabel label="Record scanner audits" control={
        <Switch checked={state?.enabled ?? false} disabled={!state || busy || state.deleting}
          onChange={(_, enabled) => void mutate("POST", enabled)} />
      } />
      <Button color="error" disabled={!state || busy || state.deleting} onClick={() => setConfirm(true)}>
        Delete audit history
      </Button>
    </Stack>
    {notice && <Alert severity={notice.error ? "error" : "success"}>{notice.text}</Alert>}
    <Dialog open={confirm} onClose={busy ? undefined : () => setConfirm(false)} aria-labelledby="delete-scanner-audit-title">
      <DialogTitle id="delete-scanner-audit-title">Delete saved scanner audits?</DialogTitle>
      <DialogContent>
        <DialogContentText>This permanently removes all saved scanner audit history.</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button autoFocus disabled={busy} onClick={() => setConfirm(false)}>Cancel</Button>
        <Button color="error" disabled={busy} onClick={() => void mutate("DELETE")}>{busy ? "Deleting…" : "Delete history"}</Button>
      </DialogActions>
    </Dialog>
  </Stack>;
}
