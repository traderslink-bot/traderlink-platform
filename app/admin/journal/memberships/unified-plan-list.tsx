"use client";

import { useRef, useState, useTransition } from "react";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { emptyMembershipPlan, type MembershipPlanListItem, type MembershipPlanOpenResult,
  type MembershipPlanFeatureChoice, type MembershipPlanProvider, type MembershipPlanSaveRequest,
  type MembershipPlanSaveResult, type MembershipPlanDiscardTarget } from "@/src/modules/platform/contracts/membership-plan-editor";
import { EditorSelect } from "./unified-plan-fields";
import { UnifiedPlanEditor } from "./unified-plan-editor";

type ActiveEditor = MembershipPlanOpenResult & { rowId: string | null; key: string };
type OpenResponse = { value: MembershipPlanOpenResult; error?: never } | { error: string; value?: never };

/** The list has no checkout side effects. Mutations are owner-authorized server callbacks. */
export function UnifiedPlanList({ items, features, providers, pages, open, discard, save, archive, remove, refreshBaseline, refresh, createNew = false }: {
  createNew?: boolean;
  items: readonly MembershipPlanListItem[];
  features: readonly MembershipPlanFeatureChoice[]; providers: readonly MembershipPlanProvider[];
  pages: readonly { id: string; name: string }[];
  open: (itemId: string, intent: "edit" | "duplicate", requestId: string) => Promise<OpenResponse>;
  discard: (target: MembershipPlanDiscardTarget) => Promise<{ error?: string }>;
  save: (request: MembershipPlanSaveRequest) => Promise<MembershipPlanSaveResult>;
  archive: (planId: string) => Promise<{ error?: string }>;
  remove?: (planId: string) => Promise<{ error?: string }>;
  refreshBaseline?: (draftId: string, revision: number, expectedBaseRevision: string) => Promise<{ error?: string }>;
  refresh: () => void;
}) {
  const [editor, setEditor] = useState<ActiveEditor | null>(() => createNew ? {
    document: emptyMembershipPlan(), draftId: null, revision: null, memberCount: 0, rowId: null, key: "new-plan",
  } : null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("current");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const operation = useRef(false);
  const openRetry = useRef<{ target: string; requestId: string } | null>(null);
  const locked = pending || editor !== null;
  const visible = items.filter(item => (filter === "all" || (filter === "current" ? item.status !== "archived" : filter === "draft" ? item.status === "draft" || item.hasDraft : item.status === filter))
    && `${item.name} ${item.draftName ?? ""}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));

  function newPlan(packageType: "plan" | "addon" = "plan") {
    if (operation.current || editor) return;
    setMessage(""); setError("");
    setEditor({ document: { ...emptyMembershipPlan(), packageType, ...(packageType === "addon" ? { features: [] } : {}) }, draftId: null, revision: null, memberCount: 0, rowId: null, key: crypto.randomUUID() });
  }
  function openPlan(item: MembershipPlanListItem, intent: "edit" | "duplicate") {
    if (operation.current || editor) return;
    const target = `${item.id}:${intent}`;
    if (openRetry.current?.target !== target) openRetry.current = { target, requestId: crypto.randomUUID() };
    const requestId = openRetry.current.requestId;
    operation.current = true; setError(""); setMessage("");
    startTransition(async () => {
      try {
        const result = await open(item.id, intent, requestId);
        if (result.error) { setError(result.error); return; }
        if (!result.value) { setError("The plan could not be opened. Try again."); return; }
        setEditor({ ...result.value, rowId: intent === "edit" ? item.id : null, key: requestId });
        openRetry.current = null;
      } catch { setError("The plan could not be opened. Try again; the same request will be retried safely."); }
      finally { operation.current = false; }
    });
  }
  function deleteDraft(item: MembershipPlanListItem) {
    if (operation.current || editor) return;
    const target: MembershipPlanDiscardTarget | null = item.draftId && item.draftRevision !== null ? { draftId: item.draftId, revision: item.draftRevision }
      : item.planId && item.legacyDraftRevision ? { planId: item.planId, baseRevision: item.legacyDraftRevision } : null;
    if (!target) return;
    const label = item.published ? "Delete the saved draft changes? The published plan and members stay unchanged."
      : `Delete the unpublished draft “${item.name || "Untitled plan"}”?`;
    if (!window.confirm(label)) return;
    operation.current = true; setError(""); setMessage("");
    startTransition(async () => {
      try {
        const result = await discard(target);
        if (result.error) setError(result.error);
        else { setMessage("Draft deleted."); refresh(); }
      } catch { setError("We couldn't confirm the deletion. Refresh the list before trying again."); }
      finally { operation.current = false; }
    });
  }
  function close(message?: string) {
    setEditor(null); setMessage(message ?? ""); setError("");
    if (message) { setSearch(""); setFilter("current"); }
    refresh();
  }
  function archivePlan(item: MembershipPlanListItem) {
    if (operation.current || editor || !item.planId) return;
    if (!window.confirm(`Archive “${item.name}” and stop new signups? Existing members keep their current access. You can edit and publish it again later.`)) return;
    const id = item.planId;
    operation.current = true; setError(""); setMessage("");
    startTransition(async () => {
      try {
        const result = await archive(id);
        if (result.error) setError(result.error);
        else { setMessage("Plan archived. New signups stopped; existing access is unchanged."); refresh(); }
      } catch { setError("We couldn't confirm the archive. Refresh before trying again."); }
      finally { operation.current = false; }
    });
  }
  function deletePlan(item: MembershipPlanListItem) {
    if (operation.current || editor || !item.planId || !remove) return;
    if (!window.confirm(`Delete “${item.name}” from your plan list and stop new signups? Saved draft changes will also be removed. Membership and billing history and existing access are preserved. This plan cannot be edited or republished afterward.`)) return;
    const id = item.planId;
    operation.current = true; setError(""); setMessage("");
    startTransition(async () => {
      try {
        const result = await remove(id);
        if (result.error) setError(result.error);
        else { setMessage("Plan deleted. Existing member access and billing history are preserved."); refresh(); }
      } catch { setError("We couldn't confirm the deletion. Refresh before trying again."); }
      finally { operation.current = false; }
    });
  }
  function refreshDraftBaseline(item: MembershipPlanListItem) {
    if (operation.current || editor || !refreshBaseline || !item.draftId || item.draftRevision === null || !item.currentBaseRevision) return;
    if (!window.confirm("Keep your saved draft changes and refresh their baseline to the current published plan? Review the draft before publishing: publication will replace the published configuration with your draft.")) return;
    const { draftId, draftRevision, currentBaseRevision } = item;
    operation.current = true; setError(""); setMessage("");
    startTransition(async () => {
      try {
        const result = await refreshBaseline(draftId, draftRevision, currentBaseRevision);
        if (result.error) setError(result.error);
        else { setMessage("Draft refreshed. Select Edit to review your changes, then Save and publish."); refresh(); }
      } catch { setError("We couldn't confirm the refresh. Reopen the list before trying again."); }
      finally { operation.current = false; }
    });
  }
  const form = editor ? <UnifiedPlanEditor key={editor.key} initial={editor.document} draftId={editor.draftId}
    revision={editor.revision} memberCount={editor.memberCount} features={features} providers={providers}
    pages={pages} save={save} close={close} /> : null;

  return <Stack spacing={1.5}>
    <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 1, alignItems: { sm: "center" } }}>
      <Typography component="h2" variant="h6" sx={{ flexGrow: 1 }}>Plans</Typography>
      <Button variant="contained" disabled={locked} onClick={() => newPlan()}>New plan</Button>
      <Button variant="outlined" disabled={locked} onClick={() => newPlan("addon")}>New add-on</Button>
    </Stack>
    {error ? <Alert severity="error" role="alert">{error}</Alert> : null}
    {message ? <Alert severity="success" role="status">{message}</Alert> : null}
    {pending ? <Alert severity="info" role="status">Updating the plan list…</Alert> : null}
    {editor?.rowId === null ? <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1, p: { xs: 1, sm: 2 } }}>
      <Typography component="h2" variant="h6" sx={{ mb: 2 }}>{editor.document.name ? "Duplicate package" : editor.document.packageType === "addon" ? "New add-on" : "New plan"}</Typography>
      {form}
    </Box> : null}
    {items.length ? <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: 1 }}>
      <TextField size="small" fullWidth label="Search plans" value={search} disabled={locked} onChange={event => setSearch(event.target.value)} />
      <Box component="fieldset" disabled={locked} sx={{ border: 0, m: 0, p: 0, minWidth: { sm: 180 } }}>
        <EditorSelect label="Show plans" value={filter} onChange={setFilter} options={[
          { value: "current", label: "Current plans" }, { value: "draft", label: "Drafts" },
          { value: "active", label: "Published plans" }, { value: "archived", label: "Archived plans" }, { value: "all", label: "All plans" }]} />
      </Box>
    </Stack> : !editor ? <Typography color="text.secondary">No plans yet. Select New plan to create your first plan.</Typography> : null}
    {visible.map(item => <Box key={item.id} sx={{ border: 1, borderColor: "divider", borderRadius: 1 }}>
      <Stack direction={{ xs: "column", sm: "row" }} sx={{ p: 1.25, gap: 1, alignItems: { sm: "center" } }}>
        <Typography sx={{ flexGrow: 1, fontWeight: 700, overflowWrap: "anywhere" }}>{item.name || "Untitled plan"}</Typography>
        <Stack direction="row" sx={{ gap: 0.5, flexWrap: "wrap", alignItems: "center" }}>
          <Chip size="small" label={item.status === "active" ? "Published" : item.status === "archived" ? "Archived" : "Draft"} />
          {item.published && item.hasDraft ? <Chip size="small" label="Draft changes" variant="outlined" /> : null}
          <Chip size="small" label={item.packageType === "addon" ? "Add-on" : "Plan"} variant="outlined" />
          <Chip size="small" label={item.visibility} variant="outlined" />
          <Button size="small" disabled={locked} aria-expanded={editor?.rowId === item.id} aria-controls={`plan-editor-${item.id}`} onClick={() => openPlan(item, "edit")}>Edit</Button>
          <Button size="small" disabled={locked} onClick={() => openPlan(item, "duplicate")}>Duplicate</Button>
          {item.published && item.status === "active" ? <Button size="small" disabled={locked} onClick={() => archivePlan(item)}>Archive</Button> : null}
          {item.currentBaseRevision && refreshBaseline ? <Button size="small" disabled={locked} onClick={() => refreshDraftBaseline(item)}>Refresh draft for publishing</Button> : null}
          {item.published && remove ? <Button size="small" color="error" disabled={locked} onClick={() => deletePlan(item)}>Delete plan</Button> : null}
          {item.draftId || item.legacyDraftRevision ? <Button size="small" color="error" disabled={locked} onClick={() => deleteDraft(item)}>{item.published ? "Discard draft changes" : "Delete draft"}</Button> : null}
        </Stack>
      </Stack>
      {item.published && item.hasDraft ? <Typography variant="body2" color="text.secondary" sx={{ px: 1.25, pb: 1.25 }}>Unpublished draft changes{item.draftName && item.draftName !== item.name ? `: ${item.draftName}` : ""}. Select Edit, then Save and publish to update the published plan.</Typography> : null}
      {editor?.rowId === item.id ? <Box id={`plan-editor-${item.id}`} sx={{ p: { xs: 1, sm: 2 }, borderTop: 1, borderColor: "divider" }}>{form}</Box> : null}
    </Box>)}
    {items.length && !visible.length ? <Typography color="text.secondary">No plans match this search.</Typography> : null}
  </Stack>;
}
