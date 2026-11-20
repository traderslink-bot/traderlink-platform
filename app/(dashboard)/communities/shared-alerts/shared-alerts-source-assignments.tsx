"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { SharedSourceAssignmentDestination, SharedSourceAssignmentPublisher, SharedSourceAssignmentState } from "@/src/modules/communities/contracts/shared-alerts-contracts";
import type { SharedSourceActionResult } from "./shared-alerts-source-actions";

type Props = Readonly<{
  communitySlug: string; destinations: readonly SharedSourceAssignmentDestination[]; publishers: readonly SharedSourceAssignmentPublisher[];
  submit: (form: FormData) => Promise<SharedSourceActionResult>;
  reload: () => Promise<Readonly<{ destinations: readonly SharedSourceAssignmentDestination[]; publishers: readonly SharedSourceAssignmentPublisher[] }>>;
}>;
const sameIds = (left: readonly string[], right: readonly string[]) => left.length === right.length && left.every(id => right.includes(id));

/** One selected assignment editor. This surface cannot create channels or publish content. */
export function SharedAlertsSourceAssignments(props: Props) {
  const router = useRouter();
  const [destinations, setDestinations] = useState(props.destinations), [publishers, setPublishers] = useState(props.publishers);
  const [selectedId, setSelectedId] = useState<string | null>(null), [ids, setIds] = useState<readonly string[]>([]);
  const [pendingId, setPendingId] = useState<string | null | undefined>(), [busy, setBusy] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const [feedback, setFeedback] = useState(""), [failed, setFailed] = useState(false), [uncertain, setUncertain] = useState(false);
  const lock = useRef(false), buttons = useRef(new Map<string, HTMLButtonElement>());
  const heading = useRef<HTMLHeadingElement>(null), feedbackElement = useRef<HTMLDivElement>(null);
  const selected = destinations.find(row => row.id === selectedId);
  const dirty = Boolean(selected && !sameIds(ids, selected.publisherIds));
  const unavailable = ids.some(id => !publishers.some(person => person.id === id && person.available));
  useEffect(() => { if (selectedId) heading.current?.focus({ preventScroll: true }); }, [selectedId]);
  useEffect(() => { if (feedback) feedbackElement.current?.focus({ preventScroll: true }); }, [feedback]);
  useEffect(() => {
    if (!dirty && !uncertain) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    const navigate = (event: MouseEvent) => {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement) || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin || (url.pathname === window.location.pathname && url.search === window.location.search)) return;
      event.preventDefault(); event.stopPropagation(); setPendingHref(`${url.pathname}${url.search}${url.hash}`);
    };
    window.addEventListener("beforeunload", warn); document.addEventListener("click", navigate, true);
    return () => { window.removeEventListener("beforeunload", warn); document.removeEventListener("click", navigate, true); };
  }, [dirty, uncertain]);
  function select(id: string | null) {
    if (lock.current || uncertain) return;
    if (dirty) { setPendingId(id); return; }
    open(id);
  }
  function open(id: string | null) {
    const prior = selectedId;
    setSelectedId(id); setIds(destinations.find(row => row.id === id)?.publisherIds ?? []);
    setPendingId(undefined); setFeedback(""); setFailed(false);
    if (id === null && prior) buttons.current.get(prior)?.focus();
  }
  async function save() {
    if (!selected || lock.current || unavailable || uncertain) return;
    lock.current = true; setBusy(true); setFeedback("");
    const form = new FormData(); form.set("communitySlug", props.communitySlug); form.set("command", "assign_publishers");
    form.set("destinationId", selected.id); form.set("expectedAssignmentState", selected.assignmentStateToken);
    for (const id of ids) form.append("publisherId", id);
    try {
      const result = await props.submit(form);
      if (result.status !== "success") { setUncertain(true); setFailed(true); setFeedback(`${result.message} Reload current assignments before another change.`); return; }
      const state = result.assignment;
      if (!state || state.destinationId !== selected.id || !sameIds(state.publisherIds, ids)) throw new Error("Assignment result could not be confirmed.");
      setDestinations(current => current.map(row => row.id === selected.id ? { ...row, ...state } : row));
      setFailed(false); setFeedback(result.message);
    } catch {
      setUncertain(true); setFailed(true); setFeedback("The save result could not be confirmed. Reload current assignments before making another change.");
    } finally { lock.current = false; setBusy(false); }
  }
  async function reload() {
    if (!selected || lock.current) return;
    lock.current = true; setBusy(true);
    try {
      const current = await props.reload(), row = current.destinations.find(item => item.id === selected.id);
      if (!row) throw new Error("This configured channel is no longer available.");
      setDestinations(current.destinations);
      setPublishers([...current.publishers, ...ids.filter(id => !current.publishers.some(person => person.id === id)).map((id, index) => ({ id, name: publishers.find(person => person.id === id)?.name ?? `Unavailable selection ${index + 1}`, available: false }))]);
      // Retain unsaved choices for deliberate comparison, including an unknown save result.
      setUncertain(false); setFailed(false); setFeedback("Current assignments loaded. Review your selections before saving.");
    } catch { setFailed(true); setFeedback("Current assignments could not be loaded. Your selections are still here."); }
    finally { lock.current = false; setBusy(false); }
  }
  return <Stack spacing={2}>
    {!destinations.length ? <Stack spacing={1}><Typography>No source alert channels are configured.</Typography><Box><Button component={Link} href={`/communities/${props.communitySlug}/manage/channels`} variant="outlined">Discord publishing</Button></Box></Stack> : destinations.map(row => <Box key={row.id} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 2 }}>
      <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 1, justifyContent: "space-between", alignItems: { sm: "center" } }}>
        <Stack spacing={0.5} sx={{ minWidth: 0 }}><Typography component="h2" variant="h3" ref={selectedId === row.id ? heading : undefined} tabIndex={selectedId === row.id ? -1 : undefined} sx={{ overflowWrap: "anywhere" }}>{row.name}</Typography><Typography color="text.secondary" variant="body2">{row.publisherIds.length} individual publishers · Configured Discord channel {row.channelId}</Typography><Chip size="small" label={row.active ? "Active" : "Inactive"} sx={{ alignSelf: "flex-start" }} /></Stack>
        <Button ref={node => { if (node) buttons.current.set(row.id, node); else buttons.current.delete(row.id); }} variant="outlined" disabled={busy || uncertain || selectedId === row.id} onClick={() => select(row.id)}>Manage publishers</Button>
      </Stack>
      {selectedId === row.id ? <Stack spacing={1.5} sx={{ mt: 2 }} aria-busy={busy}>
        <Typography>Choose individuals who may send alerts to this source channel. Their Publish alerts permission is managed in Shared alerts settings.</Typography>
        {!row.active ? <Alert severity="info">This channel is inactive. Saving assignments does not activate it.</Alert> : null}
        {row.hasLegacyAssignments ? <Alert severity="info">Existing role assignments are retained. This editor changes individual assignments only.</Alert> : null}
        {publishers.filter(person => person.available || ids.includes(person.id) || row.publisherIds.includes(person.id)).map(person => <FormControlLabel key={person.id} label={`${person.name}${person.available ? "" : " — unavailable; remove to save"}`} control={<Checkbox checked={ids.includes(person.id)} disabled={busy || uncertain || (!person.available && !ids.includes(person.id))} onChange={event => { const checked = event.target.checked; setIds(current => checked ? [...new Set([...current, person.id])] : current.filter(id => id !== person.id)); }} />} />)}
        {!publishers.length ? <Typography color="text.secondary">No individual publishers are available. Manage Publish alerts permissions in Shared alerts settings.</Typography> : null}
        {feedback ? <Alert ref={feedbackElement} tabIndex={-1} role="status" severity={failed ? "warning" : "success"}>{feedback}</Alert> : null}
        <Stack direction="row" sx={{ gap: 1, flexWrap: "wrap" }}><Button variant="contained" disabled={busy || uncertain || unavailable || !dirty} onClick={() => void save()}>Save assignments</Button><Button variant="outlined" disabled={busy || uncertain} onClick={() => select(null)}>Cancel</Button><Button variant="outlined" disabled={busy} onClick={() => void reload()}>Reload current assignments</Button></Stack>
      </Stack> : null}
    </Box>)}
    <Dialog open={pendingId !== undefined || pendingHref !== null} onClose={() => { setPendingId(undefined); setPendingHref(null); }} aria-labelledby="source-assignment-unsaved-title">
      <DialogTitle id="source-assignment-unsaved-title">Keep your selections?</DialogTitle>
      <DialogContent><Typography>{uncertain ? "The last save result is unconfirmed. Leaving does not retry it. Reload current assignments when you return." : "Discard your unsaved selections before changing channels or leaving this page."}</Typography></DialogContent>
      <DialogActions><Button variant="outlined" onClick={() => { setPendingId(undefined); setPendingHref(null); }}>Keep editing</Button><Button variant="outlined" color="error" disabled={busy} onClick={() => {
        if (pendingHref) { const href = pendingHref; setPendingHref(null); setIds(selected?.publisherIds ?? []); setUncertain(false); router.push(href); }
        else if (pendingId !== undefined) open(pendingId);
      }}>{uncertain ? "Leave without retrying" : "Discard changes"}</Button></DialogActions>
    </Dialog>
  </Stack>;
}

export function isSharedSourceAssignmentState(value: unknown): value is SharedSourceAssignmentState {
  if (!value || typeof value !== "object") return false;
  const row = value as Partial<SharedSourceAssignmentState>;
  const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/u;
  return typeof row.destinationId === "string" && uuid.test(row.destinationId) && typeof row.assignmentStateToken === "string"
    && /^[a-f0-9]{64}$/u.test(row.assignmentStateToken) && typeof row.hasLegacyAssignments === "boolean" && Array.isArray(row.publisherIds)
    && row.publisherIds.length <= 200 && row.publisherIds.every(id => typeof id === "string" && uuid.test(id)) && new Set(row.publisherIds).size === row.publisherIds.length;
}
