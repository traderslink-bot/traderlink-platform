"use client";

import { useEffect, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Image from "next/image";
import { PotentialGainCard } from "@/app/watchlist/live-watchlist-client";
import type { LiveWatchlistSymbolState } from "@/src/lib/live-watchlist/live-watchlist-types";
import { capturePotentialGainCard } from "@/src/lib/live-watchlist/capture-potential-gain-card";

const endpoint = "/api/admin/watchlist/potential-gain-post";
export function WatchlistPotentialGainPost({ symbol, onClose }: { symbol: string; onClose: () => void }) {
  const [ticker, setTicker] = useState<LiveWatchlistSymbolState | null>(null);
  const [image, setImage] = useState<{ blob: Blob; url: string } | null>(null);
  const [message, setMessage] = useState(""); const [status, setStatus] = useState("Loading card…");
  const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false);
  const [uncertain, setUncertain] = useState(false);
  const card = useRef<HTMLDivElement>(null); const [requestId] = useState(() => crypto.randomUUID());
  const sending = useRef(false);
  const lockedMessage = useRef<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    void fetch(`${endpoint}?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store", signal: AbortSignal.any([controller.signal, AbortSignal.timeout(20000)]) })
      .then(async response => { const body = await response.json(); if (!response.ok) throw Error(body.error); if (!controller.signal.aborted) { setTicker(body.symbol); setStatus("Preparing image…"); } })
      .catch(error => { if (!controller.signal.aborted) setStatus(error instanceof Error ? error.message : "Card preview unavailable."); });
    return () => controller.abort();
  }, [symbol]);
  useEffect(() => {
    if (!ticker || !card.current) return;
    let active = true; let objectUrl: string | undefined;
    void capturePotentialGainCard(card.current).then(blob => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob); setImage({ blob, url: objectUrl }); setStatus("");
    }).catch(() => { if (active) setStatus("The card image could not be created. Close and reopen the preview."); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [ticker]);
  async function send() {
    if (!image || sending.current || sent || uncertain) return;
    sending.current = true;
    setBusy(true); setStatus("Sending to Discord…"); lockedMessage.current ??= message;
    try {
      const form = new FormData(); form.set("symbol", symbol); form.set("requestId", requestId);
      form.set("message", lockedMessage.current); form.set("image", image.blob, `${symbol}-potential-gain.png`);
      const response = await fetch(endpoint, { method: "POST", headers: { "x-traderlink-journal-admin-request": "1" }, body: form, signal: AbortSignal.timeout(45000) });
      const result = await response.json();
      setStatus((result.message || result.error || "Delivery status unavailable.") + (result.retryAt ? ` Retry after ${new Date(result.retryAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", second: "2-digit" })}.` : ""));
      setSent(result.state === "sent"); setUncertain(result.state === "uncertain" || result.state === "sending");
      if (result.state === "unconfigured" || result.state === "configuration") lockedMessage.current = null;
    } catch { setUncertain(true); setStatus("Delivery could not be confirmed. Check Discord before posting again."); }
    finally { sending.current = false; setBusy(false); }
  }
  return <Dialog open onClose={() => { if (!busy) onClose(); }} fullWidth maxWidth="sm" aria-labelledby="gain-post-title">
    <DialogTitle id="gain-post-title">{symbol} — Post potential gain</DialogTitle>
    <DialogContent>
      {status && <Alert severity={sent ? "success" : "info"} role="status" sx={{ mb: 2 }}>{status}</Alert>}
      {ticker && !image && <div ref={card} className="academy-shell" data-academy-theme="light" style={{ width: "100%", minHeight: 0, padding: 12, background: "var(--academy-bg)", color: "var(--academy-heading)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, marginBottom: 12 }}><span>{symbol}</span><span>traderslink.pro</span></div>
        <PotentialGainCard symbol={ticker} />
      </div>}
      {image && <Image unoptimized src={image.url} alt={`${symbol} potential gain card to post`} width={1100} height={1100} style={{ width: "100%", height: "auto" }} />}
      <TextField label="Message (optional)" helperText="This post will tag @everyone." value={message} onChange={event => setMessage(event.target.value)} multiline minRows={3} fullWidth
        disabled={busy || sent || lockedMessage.current !== null} slotProps={{ htmlInput: { maxLength: 1800 } }} sx={{ mt: 2 }} />
    </DialogContent>
    <DialogActions><Button onClick={onClose} disabled={busy}>Close</Button><Button variant="contained" onClick={() => void send()} disabled={!image || busy || sent || uncertain}>Send to Discord</Button></DialogActions>
  </Dialog>;
}
