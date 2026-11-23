"use client";

import { useEffect, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";
import type { SavedScan } from "@/src/modules/scanner/custom/definition";
import { SHARED_SCAN_PATH, sharedScanLink, type ScanShare, type ScanSharingMode } from "@/src/modules/scanner/custom/sharing";

export function ShareSavedScan({ scan, revision }: { scan: SavedScan; revision: number }) {
  const [open, setOpen] = useState(false);
  const [share, setShare] = useState<ScanShare | null>();
  const [mode, setMode] = useState<ScanSharingMode>("results");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const scanId = scan.id;

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    void fetch(SHARED_SCAN_PATH + "?scanId=" + encodeURIComponent(scanId), { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw Error();
        const { share } = await response.json() as { share: ScanShare | null };
        if (controller.signal.aborted) return;
        setShare(share);
        setMode(share?.mode ?? "results");
      }).catch(() => {
        if (!controller.signal.aborted) setError("Could not load sharing. Close this dialog and try again.");
      });
    return () => controller.abort();
  }, [open, reload, scanId]);

  async function change(operation: "publish" | "revoke") {
    if (pending || share === undefined) return;
    setPending(true);
    setNotice("");
    setError("");
    try {
      const response = await fetch(SHARED_SCAN_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" },
        body: JSON.stringify({ operation, scanId, expectedId: share?.id ?? null,
          ...(operation === "publish" ? { mode, revision } : {}) }),
      });
      if (response.status === 409) {
        setShare(undefined);
        setReload(value => value + 1);
        setError("The scan or link changed. Review the latest settings before trying again.");
        return;
      }
      if (response.status === 422) {
        setError("This scan uses your private levels. Save a copy with shareable filters to publish it.");
        return;
      }
      if (!response.ok) throw Error();
      const { share: updated } = await response.json() as { share: ScanShare | null };
      setShare(updated);
      if (!updated) setMode("results");
      setNotice(updated ? "Share link ready." : "Sharing stopped.");
    } catch {
      setError("Could not update sharing. Try again.");
    } finally {
      setPending(false);
    }
  }

  const start = () => {
    setShare(undefined);
    setNotice("");
    setError("");
    setOpen(true);
  };
  const link = share && open ? new URL(sharedScanLink(share.id), window.location.origin).toString() : "";
  return <>
    <Button variant="outlined" color="inherit" size="small" onClick={start}>Share scan</Button>
    <Dialog open={open} onClose={() => { if (!pending) setOpen(false); }} fullWidth maxWidth="xs">
      <DialogTitle>Share {scan.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          <TextField select label="People with the link can" size="small" value={mode}
            disabled={pending || share === undefined} onChange={event => setMode(event.target.value as ScanSharingMode)}>
            <MenuItem value="results">See results only</MenuItem>
            <MenuItem value="filters">Also see all filters and copy the scan</MenuItem>
          </TextField>
          <Typography variant="body2" color="text.secondary">
            The link requires a TraderLink account with Scanner access. Creating a new link retires the previous one.
          </Typography>
          {error ? <Alert severity="error">{error}</Alert> : null}
          {notice ? <Alert severity="success">{notice}</Alert> : null}
          {link ? <TextField label="Share link" size="small" value={link} slotProps={{ input: { readOnly: true } }} /> : null}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap" }}>
        {share ? <Button color="error" disabled={pending} onClick={() => void change("revoke")}>Stop sharing</Button> : null}
        {link ? <Button disabled={pending} onClick={async () => {
          try { await navigator.clipboard.writeText(link); setNotice("Link copied."); }
          catch { setError("Select the link to copy it manually."); }
        }}>Copy link</Button> : null}
        <Button disabled={pending} onClick={() => setOpen(false)}>Close</Button>
        <Button variant="contained" disabled={pending || share === undefined} onClick={() => void change("publish")}>
          {share ? "Create new link" : "Create link"}
        </Button>
      </DialogActions>
    </Dialog>
  </>;
}
