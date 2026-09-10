"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import type { DailyRecapBodyItem, DailyRecapOwnerCandidate, DailyRecapStorageSummary, DailyRecapPostHistory } from "@/src/modules/watchlist/server/daily-recaps/daily-recap-owner-service";
import { PLATFORM_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/platform-request-security";
import { acceptsRecapDateResponse, clearSavedRecapEdit } from "@/src/modules/watchlist/server/daily-recaps/daily-recap-client-state";

export function WatchlistDailyRecapsAdminPanel({ initialFinalItems, initialFinalDraft, initialDate, initialCandidates, initialStorage, initialPosts }: { initialFinalItems: DailyRecapBodyItem[]; initialFinalDraft: string | null; initialDate: string; initialCandidates: readonly DailyRecapOwnerCandidate[]; initialStorage: DailyRecapStorageSummary | null; initialPosts: DailyRecapPostHistory[] }) {
  const [date, setDate] = useState(initialDate);
  const [candidates, setCandidates] = useState([...initialCandidates]);
  const [storage, setStorage] = useState<DailyRecapStorageSummary | null>(initialStorage);
  const [posts, setPosts] = useState(initialPosts);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const mutationLock = useRef(false);
  const activeDate = useRef(initialDate);
  const loadSequence = useRef(0);
  const [loading, setLoading] = useState(false);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [postOverrides, setPostOverrides] = useState<Record<string, string>>({});
  const [savedBodies, setSavedBodies] = useState<Record<string, string | null>>({ [initialDate]: initialFinalDraft });
  const [savedItems, setSavedItems] = useState<Record<string, DailyRecapBodyItem[]>>({ [initialDate]: initialFinalItems });
  const [itemOverrides, setItemOverrides] = useState<Record<string, DailyRecapBodyItem[]>>({});
  const refresh = useCallback(async (nextDate = date) => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/watchlist/daily-recaps?date=${encodeURIComponent(nextDate)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Unable to load Daily Recaps.");
      const payload = (await response.json()) as { finalItems: DailyRecapBodyItem[]; finalDraft: string | null; candidates: DailyRecapOwnerCandidate[]; storage: DailyRecapStorageSummary; posts: DailyRecapPostHistory[] };
      if (acceptsRecapDateResponse(sequence, loadSequence.current, nextDate, activeDate.current)) {
        setCandidates(payload.candidates);
        setStorage(payload.storage);
        setPosts(payload.posts);
        setSavedBodies((current) => ({ ...current, [nextDate]: payload.finalDraft }));
        setSavedItems((current) => ({ ...current, [nextDate]: payload.finalItems }));
      }
    } finally { if (sequence === loadSequence.current) setLoading(false); }
  }, [date]);
  const mutate = useCallback(async (body: Record<string, unknown>) => {
    if (mutationLock.current || activeDate.current !== date) return false;
    mutationLock.current = true;
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/admin/watchlist/daily-recaps", { method: "POST", headers: { "content-type": "application/json", [PLATFORM_MUTATION_REQUEST_HEADER]: "1" }, body: JSON.stringify(body) });
      await refresh();
      if (!response.ok) throw new Error(body.action === "post" || body.action === "retry_post" ? "Posting was not confirmed. Check Post history to retry or confirm delivery." : "The recap change could not be saved.");
      return true;
    } catch (caught) { setError(caught instanceof Error ? caught.message : "The recap change could not be saved."); return false; }
    finally { mutationLock.current = false; setBusy(false); }
  }, [refresh, date]);
  const selected = useMemo(() => candidates.filter((candidate) => candidate.reviewState === "add_to_recap" && candidate.recapText), [candidates]);
  const generatedBody = useMemo(() => selected.map((candidate) => candidate.recapText).join("\n\n"), [selected]);
  const postBody = postOverrides[date] ?? savedBodies[date] ?? generatedBody;
  const selectedItems = selected.flatMap((candidate) => candidate.draftRevisionId ? [{ candidateId: candidate.candidateId, draftRevisionId: candidate.draftRevisionId }] : []);
  const postItems = itemOverrides[date] ?? (savedBodies[date] != null ? savedItems[date] ?? [] : selectedItems);
  const setPostBody = (value: string, items = postItems) => {
    setPostOverrides((current) => ({ ...current, [date]: value }));
    setItemOverrides((current) => ({ ...current, [date]: items }));
  };
  return <Box id="watchlist-daily-recaps" tabIndex={-1}>
    <Stack spacing={2}>
      <Typography component="h1" variant="h4">Daily Recaps</Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
        <TextField disabled={busy} label="New York date" type="date" value={date} onChange={async (event) => { const next = event.target.value; activeDate.current = next; setDate(next); setCandidates([]); setPosts([]); try { await refresh(next); } catch { if (activeDate.current === next) setError("Unable to load Daily Recaps."); } }} slotProps={{ inputLabel: { shrink: true } }} />
        <Button disabled={busy || candidates.length === 0} onClick={async () => { for (const candidate of candidates) await mutate({ action: "generate", candidateId: candidate.candidateId }); }} variant="contained">Generate all recaps</Button>
      </Stack>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {loading ? <Typography>Loading recaps…</Typography> : null}
      {candidates.length === 0 ? <Alert severity="info">No Watchlist posts are stored for this date.</Alert> : candidates.map((candidate) => <Card key={candidate.candidateId} variant="outlined"><CardContent><Stack spacing={1.5}>
        <Typography component="h2" variant="h6">{candidate.symbol}</Typography>
        <Typography variant="body2">Posted {new Date(candidate.postedAtMs).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" })} ET at ${candidate.postedPrice}</Typography>
        {candidate.recapText ? <><TextField fullWidth label="Recap" multiline minRows={3} value={edits[candidate.candidateId] ?? candidate.recapText} onChange={(event) => setEdits((current) => ({ ...current, [candidate.candidateId]: event.target.value }))} /><Button disabled={busy || edits[candidate.candidateId] === undefined || edits[candidate.candidateId] === candidate.recapText} onClick={async () => { const submitted = edits[candidate.candidateId]; if (await mutate({ action: "edit", candidateId: candidate.candidateId, recapText: submitted })) setEdits((current) => clearSavedRecapEdit(current, candidate.candidateId, submitted)); }}>Save recap</Button></> : <Typography>No draft generated.</Typography>}
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button disabled={busy} onClick={() => void mutate({ action: "generate", candidateId: candidate.candidateId })} variant="outlined">{candidate.recapText ? "Regenerate recap" : "Generate recap"}</Button>
          <Button disabled={busy || !candidate.recapText} onClick={() => void mutate({ action: "select", candidateId: candidate.candidateId, selected: true })} variant={candidate.reviewState === "add_to_recap" ? "contained" : "outlined"}>Add to recap</Button>
          <Button disabled={busy} onClick={() => void mutate({ action: "select", candidateId: candidate.candidateId, selected: false })} variant="outlined">Don&apos;t use</Button>
          {candidate.auditFlagNote ? <Button disabled={busy} onClick={() => void mutate({ action: "resolve_correction", candidateId: candidate.candidateId })} variant="outlined">Resolve audit flag</Button> : <Button disabled={busy || !candidate.recapText} onClick={() => { const note = window.prompt("What should a future feature audit investigate?"); if (note?.trim()) void mutate({ action: "needs_correction", candidateId: candidate.candidateId, note }); }} variant="outlined">Flag for audit</Button>}
        </Stack>
        {candidate.auditFlagNote ? <Alert severity="warning">Audit flag: {candidate.auditFlagNote}</Alert> : null}
      </Stack></CardContent></Card>)}
      <Card variant="outlined"><CardContent><Stack spacing={1.5}><Typography component="h2" variant="h6">Discord post</Typography><TextField fullWidth label="Final post" multiline minRows={6} value={postBody} onChange={(event) => setPostBody(event.target.value)} />
        <Typography variant="body2">{postBody === savedBodies[date] && JSON.stringify(postItems) === JSON.stringify(savedItems[date]) ? "Final post saved" : "Final post has unsaved changes"}</Typography>
        <Button disabled={busy || loading || !postBody.trim() || (postBody === savedBodies[date] && JSON.stringify(postItems) === JSON.stringify(savedItems[date]))} onClick={() => void mutate({ action: "save_final", items: postItems, bodyText: postBody, newYorkDate: date })} variant="outlined">Save final post</Button>
        <Button disabled={busy || loading || selected.length === 0} onClick={() => { if (window.confirm("Replace the final body with the currently selected ticker recaps?")) setPostBody(generatedBody, selectedItems); }} variant="outlined">Use selected recaps</Button>
        <Button disabled={busy || loading || postItems.length === 0 || !postBody.trim()} onClick={async () => { if (!window.confirm("Post this reviewed recap now?")) return; await mutate({ action: "post", items: postItems, bodyText: postBody, newYorkDate: date }); }} variant="contained">Post to Discord</Button></Stack></CardContent></Card>
      {storage ? <Card variant="outlined"><CardContent><Stack spacing={1.5}><Typography component="h2" variant="h6">Stored recap data</Typography><Typography>{storage.draftCount} drafts · {storage.postedCount} posted · {storage.correctionCount} audit flags · {(storage.storedBytes / 1024).toFixed(1)} KB</Typography><Typography variant="body2">Oldest date: {storage.oldestDate ?? "None"}</Typography>{storage.cleanupRecommended ? <Alert severity="info">Cleanup recommended</Alert> : null}<Button disabled={busy || !storage.cleanupRecommended} onClick={() => { if (window.confirm("Remove eligible stored price evidence older than 30 days? Posted recap text, receipts, and audit flags will be kept.")) void mutate({ action: "cleanup" }); }} variant="outlined">Clean up stored evidence</Button></Stack></CardContent></Card> : null}
      {posts.length ? <Card variant="outlined"><CardContent><Stack spacing={2}><Typography component="h2" variant="h6">Post history</Typography>{posts.map((post) => <Stack key={post.compositionId} spacing={1}><Typography>{post.state === "posted" ? "Posted" : "Posting not confirmed"}</Typography><Typography sx={{ whiteSpace: "pre-wrap" }}>{post.bodyText}</Typography>{post.state !== "posted" ? <Stack direction={{ xs: "column", sm: "row" }} spacing={1}><Button disabled={busy} onClick={() => void mutate({ action: "retry_post", compositionId: post.compositionId })}>Retry post</Button><Button disabled={busy} onClick={() => { if (window.confirm("Check Discord first. Confirm that the unconfirmed message did not appear, then retry remaining messages?")) void mutate({ action: "retry_post", compositionId: post.compositionId, confirmedNotPosted: true }); }}>Confirm not posted and retry</Button><Button disabled={busy} onClick={() => { const discordMessageUrl = window.prompt("Paste the Discord link for the message whose delivery was not confirmed. Any remaining messages will then be sent."); if (discordMessageUrl) void mutate({ action: "retry_post", compositionId: post.compositionId, discordMessageUrl }); }}>Confirm posted message</Button></Stack> : null}</Stack>)}</Stack></CardContent></Card> : null}
    </Stack>
  </Box>;
}
