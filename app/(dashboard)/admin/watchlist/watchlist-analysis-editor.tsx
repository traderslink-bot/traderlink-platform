"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import { analysisEditSections, editRecord, isPriceField, levelEditFields, makeAnalysisEdit, mergeAnalysisEdit, pullbackEditFields, recoveryEditFields, type AnalysisEditSection, type EditRecord, type EditValue } from "@/src/lib/live-watchlist/analysis-inline-edit";
import type { LiveWatchlistCardContent } from "@/src/lib/live-watchlist/live-watchlist-types";
import { parseTradersLinkAiRead } from "@/src/lib/live-watchlist/traderslink-ai-read";

const AnalysisCard = dynamic(() => import("@/app/watchlist/live-watchlist-client").then(module => module.TradersLinkAiReadCard));
type Review = { symbol: string; cycleId: string; head: number; draft: { revision: number; body: { payload: Record<string, unknown> } } | null };
type Preview = { cycleId: string; draftRevision: number; publication: { website: { cards: { tradersLinkAiRead: LiveWatchlistCardContent }; tradersLinkAiReadDipBuyPlanVisible?: boolean } } };
async function request<T>(symbol: string, path = "", body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch("/api/admin/watchlist/runtime/watchlist/analysis-review" + path + (body ? "" : "?symbol=" + encodeURIComponent(symbol)), {
    method: body ? "POST" : "GET", cache: "no-store", signal: signal ?? AbortSignal.timeout(30000),
    headers: body ? { "Content-Type": "application/json", "x-traderlink-journal-admin-request": "1" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Review is unavailable. Check your owner session.");
  return result as T;
}
const labels: Record<string, string> = {
  label: "Label", price: "Price", rationale: "Explanation", condition: "Condition", zoneLow: "Area low", zoneHigh: "Area high",
  confirmationPrice: "Confirmation price", confirmation: "Confirmation", invalidationPrice: "Invalidation price", firstObjectivePrice: "Next level",
  recoveryZoneLow: "Recovery area low", recoveryZoneHigh: "Recovery area high", firstReclaimPrice: "First reclaim", setupRestorePrice: "Recovery setup established above",
  summary: "Summary", dayTradeRelevance: "Day-trade impact",
};

export function WatchlistAnalysisEditor({ symbol, onClose, onSaved }: { symbol: string; onClose: () => void; onSaved: () => void }) {
  const [review, setReview] = useState<Review | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [patch, setPatch] = useState<EditRecord | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const saving = useRef(false);
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => { setError("Loading timed out. Close and reopen the card."); setBusy(false); controller.abort(); }, 30000);
    void Promise.all([request<{ review: Review }>(symbol, "", undefined, controller.signal), request<Preview>(symbol, "/preview", undefined, controller.signal)])
      .then(([result, next]) => {
        if (controller.signal.aborted) return;
        if (!result.review?.draft || result.review.cycleId !== next.cycleId || result.review.draft.revision !== next.draftRevision) throw new Error("The draft changed while opening. Close and reopen the card.");
        if (result.review.draft.body.payload.version !== 3) throw new Error("Use AI Controls for this analysis version.");
        setReview(result.review); setPreview(next); setPatch(makeAnalysisEdit(result.review.draft.body.payload));
      }).catch(reason => { if (!controller.signal.aborted) setError(String(reason.message || reason)); })
      .finally(() => { clearTimeout(timeout); if (!controller.signal.aborted) setBusy(false); });
    return () => { clearTimeout(timeout); controller.abort(); };
  }, [symbol]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty || saving.current) { event.preventDefault(); event.returnValue = ""; } };
    window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const close = () => { if (!saving.current && (!dirty || window.confirm("Discard unsaved analysis edits?"))) onClose(); };
  function change(path: (string | number)[], value: EditValue) {
    setPatch(previous => {
      if (!previous) return previous;
      const next = structuredClone(previous);
      let target: EditRecord | EditValue[] = next;
      for (const key of path.slice(0, -1)) target = (target as EditRecord)[key] as EditRecord;
      (target as EditRecord)[path.at(-1)!] = value;
      return next;
    });
    setDirty(true);
  }
  function fields(object: EditRecord, names: string[], path: (string | number)[]) {
    return names.map(key => <TextField key={key} label={labels[key] || key} value={object[key] ?? ""} fullWidth size="small" margin="dense"
      type={isPriceField(key) ? "number" : "text"} multiline={!isPriceField(key)} disabled={busy}
      slotProps={{ htmlInput: isPriceField(key) ? { step: "any", min: 0 } : { maxLength: 8000 } }}
      onChange={event => change([...path, key], isPriceField(key) ? event.target.value === "" ? null : Number(event.target.value) : event.target.value)} />);
  }
  function sectionEditor(keys: readonly string[]) {
    if (!patch) return null;
    return keys.map(raw => {
      if (raw === "bias") return <details key="bias"><summary>Edit bias and confidence</summary>{["bias", "confidence"].map(key => <label key={key}>{key === "bias" ? "Bias" : "Confidence"}<select value={String(patch[key])} disabled={busy} onChange={event => change([key], event.target.value)}>{(key === "bias" ? ["bullish", "neutral", "bearish", "mixed"] : ["low", "medium", "high"]).map(value => <option key={value}>{value}</option>)}</select></label>)}</details>;
      const key = raw as AnalysisEditSection, hidden = (patch.ownerHiddenSections as string[]).includes(key);
      const path = key === "shallow" || key === "deep" ? ["pullbackPlans", key] : [key];
      const value = path.length === 2 ? editRecord(patch.pullbackPlans)[key] : patch[key];
      const optional = ["shallow", "deep", "failureRecovery"].includes(key);
      const names = key === "failureRecovery" ? recoveryEditFields : optional ? pullbackEditFields : ["summary", "dayTradeRelevance"];
      return <details key={key} style={{ margin: "8px 0" }}><summary>Edit {analysisEditSections[key]}{hidden ? " (hidden)" : ""}</summary>
        <label><input type="checkbox" checked={!hidden} disabled={busy} onChange={event => change(["ownerHiddenSections"], event.target.checked ? (patch.ownerHiddenSections as string[]).filter(item => item !== key) : [...patch.ownerHiddenSections as string[], key])} /> Show this section</label>
        {optional && <label><input type="checkbox" checked={Boolean(value)} disabled={busy} onChange={event => change(path, event.target.checked ? Object.fromEntries(names.map(name => [name, isPriceField(name) ? null : ""])) : null)} /> Include this setup</label>}
        {key === "currentRead" ? <TextField label="Analysis" value={value ?? ""} multiline fullWidth disabled={busy} slotProps={{ htmlInput: { maxLength: 8000 } }} onChange={event => change(path, event.target.value)} />
          : Array.isArray(value) ? <>{value.map((item, index) => <fieldset key={index}><legend>{index + 1}</legend>{key === "riskSummary" ? <TextField label="Risk note" value={item} fullWidth multiline disabled={busy} onChange={event => change([key, index], event.target.value)} /> : fields(editRecord(item), ["label", "price", "condition"], [key, index])}<Button disabled={busy} onClick={() => change(path, value.filter((_, i) => i !== index))}>Remove</Button></fieldset>)}<Button disabled={busy || value.length >= 20} onClick={() => change(path, [...value, key === "riskSummary" ? "" : { label: "", price: null, condition: "" }])}>Add</Button></>
          : value && typeof value === "object" ? fields(value, Object.hasOwn(value, "price") ? levelEditFields : names, path) : null}
      </details>;
    });
  }
  async function save() {
    if (!review || !patch || saving.current) return;
    saving.current = true; setBusy(true); setError("");
    try {
      await request(symbol, "/save", { symbol, cycleId: review.cycleId, expectedHead: review.head, patch });
      setDirty(false); onSaved(); onClose();
    } catch (reason) { setError((reason instanceof Error ? reason.message : String(reason)) + " Your edits remain here. If acknowledgement was lost, check the saved version before retrying."); }
    finally { saving.current = false; setBusy(false); }
  }
  const card = preview?.publication.website.cards.tradersLinkAiRead;
  const editedCard = card && review?.draft && patch ? { ...card, body: JSON.stringify(mergeAnalysisEdit(review.draft.body.payload, patch)) } : null;
  const previewValid = editedCard ? Boolean(parseTradersLinkAiRead(editedCard.body)) : false;
  return <Dialog open onClose={close} fullWidth maxWidth="lg" aria-labelledby="inline-analysis-title">
    <DialogTitle id="inline-analysis-title">{symbol} — View / edit analysis</DialogTitle>
    <DialogContent>{error && <Alert severity="error">{error}</Alert>}{busy && <p role="status">{saving.current ? "Saving analysis…" : "Loading saved analysis…"}</p>}
      {editedCard && !previewValid && <Alert severity="info">Finish the incomplete fields to update the preview. Your editing fields remain available below.</Alert>}
      {editedCard && card && <AnalysisCard card={previewValid ? editedCard : card} symbol={{}} livePrice={null} dipBuyPlanVisible={preview?.publication.website.tradersLinkAiReadDipBuyPlanVisible !== false} renderSectionEditor={sectionEditor} />}
    </DialogContent>
    <DialogActions><Button disabled={saving.current} onClick={close}>Close</Button><Button variant="contained" disabled={busy || !patch || !dirty} onClick={() => void save()}>Save and close</Button></DialogActions>
  </Dialog>;
}
