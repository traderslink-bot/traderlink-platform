"use client";

import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Image from "next/image";
import { capturePotentialGainCard } from "@/src/lib/live-watchlist/capture-potential-gain-card";
import { calculateManualLoss, LOSS_NOTES_LIMIT, type ManualLossCard } from "@/src/lib/live-watchlist/manual-loss-card";
import { WatchlistManualLossCard } from "./watchlist-manual-loss-card";

type Snapshot = { loss: ManualLossCard; requestId: string };
type Preview = Snapshot & { blob: Blob; url: string };

export function WatchlistManualLossPost({ symbol, onClose }: { symbol: string; onClose: () => void }) {
  const [buyPrice, setBuyPrice] = useState("");
  const [sellPrice, setSellPrice] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const card = useRef<HTMLDivElement>(null);
  const sending = useRef(false);
  const lockedMessage = useRef<string | null>(null);
  let loss: ManualLossCard | null = null;
  let validation = "";
  try { loss = calculateManualLoss({ buyPrice, sellPrice, notes }); }
  catch (error) { validation = error instanceof Error ? error.message : "Check the entered prices."; }

  useEffect(() => {
    if (!snapshot || !card.current) return;
    let active = true;
    let url: string | undefined;
    void capturePotentialGainCard(card.current).then(blob => {
      if (!active) return;
      url = URL.createObjectURL(blob);
      setPreview({ ...snapshot, blob, url });
      setStatus("");
    }).catch(() => {
      if (active) setStatus("The image could not be created. Back to edit lets you try again or shorten the notes.");
    });
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [snapshot]);

  function prepare() {
    if (!loss) { setStatus(validation); return; }
    setStatus("Preparing image…");
    setSnapshot({ loss, requestId: crypto.randomUUID() });
  }
  async function send() {
    if (!preview || sending.current || sent || uncertain) return;
    sending.current = true; setBusy(true); setAttempted(true);
    lockedMessage.current ??= message;
    setStatus("Sending to Discord…");
    try {
      const form = new FormData();
      form.set("symbol", symbol); form.set("requestId", preview.requestId);
      form.set("buyPrice", preview.loss.buyPrice); form.set("sellPrice", preview.loss.sellPrice);
      form.set("notes", preview.loss.notes); form.set("message", lockedMessage.current);
      form.set("image", preview.blob, `${symbol}-trade-loss.png`);
      const response = await fetch("/api/admin/watchlist/manual-loss-post", {
        method: "POST", headers: { "x-traderlink-journal-admin-request": "1" }, body: form, signal: AbortSignal.timeout(45000),
      });
      const result = await response.json();
      setStatus((result.message || result.error || "Delivery status unavailable.") + (result.retryAt ? ` Retry after ${new Date(result.retryAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.` : ""));
      setSent(result.state === "sent");
      setUncertain(!result.state || result.state === "uncertain" || result.state === "sending");
      if (result.state === "unconfigured" || result.state === "configuration") { lockedMessage.current = null; setAttempted(false); }
    } catch { setUncertain(true); setStatus("Delivery could not be confirmed. Check Discord before posting again."); }
    finally { sending.current = false; setBusy(false); }
  }
  function edit() {
    if (busy || attempted) return;
    setPreview(null); setSnapshot(null); setStatus("");
  }
  return <Dialog open onClose={() => { if (!busy) onClose(); }} fullWidth maxWidth="sm" aria-labelledby="loss-post-title">
    <DialogTitle id="loss-post-title">{symbol} — Post Loss</DialogTitle>
    <DialogContent>
      <Stack spacing={2} sx={{ pt: 1 }}>
        {status ? <Alert severity={sent ? "success" : "info"} role="status">{status}</Alert> : null}
        {!snapshot ? <>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <TextField label="Entry price ($)" value={buyPrice} onChange={e => setBuyPrice(e.target.value)} slotProps={{ htmlInput: { inputMode: "decimal", maxLength: 64 } }} />
            <TextField label="Exit price ($)" value={sellPrice} onChange={e => setSellPrice(e.target.value)} slotProps={{ htmlInput: { inputMode: "decimal", maxLength: 64 } }} />
          </Box>
          <TextField label="Notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} multiline minRows={3} slotProps={{ htmlInput: { maxLength: LOSS_NOTES_LIMIT } }} helperText={`${notes.length} / ${LOSS_NOTES_LIMIT} · Included in the image.`} />
          {loss ? <Box role="status" sx={{ color: "error.main", fontWeight: 800 }}>Loss: {loss.lossLabel}</Box> : buyPrice && sellPrice ? <Alert severity="error">{validation}</Alert> : null}
        </> : null}
        {snapshot && !preview ? <div ref={card}><WatchlistManualLossCard symbol={symbol} loss={snapshot.loss} /></div> : null}
        {preview ? <Image unoptimized src={preview.url} alt={`${symbol} trade loss image to post`} width={1100} height={1100} style={{ width: "100%", height: "auto" }} /> : null}
        <TextField label="Message (optional)" value={message} onChange={e => setMessage(e.target.value)} multiline minRows={2} disabled={busy || attempted} slotProps={{ htmlInput: { maxLength: 1800 } }} helperText="This post will tag @everyone in the same channel as Post Gain." />
      </Stack>
    </DialogContent>
    <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
      <Button onClick={onClose} disabled={busy}>Close</Button>
      {snapshot ? <Button onClick={edit} disabled={busy || attempted}>Back to edit</Button> : <Button variant="contained" onClick={prepare} disabled={!loss}>Preview image</Button>}
      {preview ? <Button variant="contained" onClick={() => void send()} disabled={busy || sent || uncertain}>Send to Discord</Button> : null}
    </DialogActions>
  </Dialog>;
}
