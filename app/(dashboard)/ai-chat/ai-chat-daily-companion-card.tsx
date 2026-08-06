"use client";

import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import type {
  CoachAiDailyCompanionDraft,
  CoachAiDailyCompanionDraftProposal,
  CoachAiDailyNoteDraftField,
} from "@/src/modules/coach/contracts/ai-daily-companion-contracts";

const FIELD_LABELS: Readonly<Record<CoachAiDailyNoteDraftField, string>> = Object.freeze({
  whatWorked: "What worked",
  whatNeedsWork: "What needs work",
  technicalRecap: "Technical recap",
  anythingElse: "Anything else",
});

type DraftResponse = Readonly<{
  status: "ready";
  draft: CoachAiDailyCompanionDraft;
}>;

async function responseJson(response: Response): Promise<DraftResponse> {
  const value = await response.json() as Partial<DraftResponse>;
  if (!response.ok || value.status !== "ready" || !value.draft) throw new Error("request_failed");
  return value as DraftResponse;
}

function title(proposal: CoachAiDailyCompanionDraftProposal): string {
  if (proposal.kind === "trade_note_draft") return "Trade note draft";
  if (proposal.kind === "current_focus_draft") return "Current Focus draft";
  return "Daily note draft";
}

function saveLabel(proposal: CoachAiDailyCompanionDraftProposal): string {
  if (proposal.kind === "trade_note_draft") return "Save trade note";
  if (proposal.kind === "current_focus_draft") return "Save Current Focus";
  return "Save daily note";
}

export function AiChatDailyCompanionCard({
  conversationId,
  draft,
  onDraftChange,
}: Readonly<{
  conversationId: string;
  draft: CoachAiDailyCompanionDraft;
  onDraftChange: (draft: CoachAiDailyCompanionDraft) => void;
}>) {
  const [editedProposal, setEditedProposal] = useState(draft.proposal);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const committed = draft.journalWriteState === "committed";
  const endpoint = `/api/coach/chat/conversations/${encodeURIComponent(conversationId)}` +
    `/daily-companion-drafts/${encodeURIComponent(draft.interactionId)}`;

  async function save(): Promise<void> {
    if (busy || committed) return;
    setBusy(true);
    setError(null);
    try {
      const result = await responseJson(await fetch(`${endpoint}/confirm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ editedProposal }),
      }));
      onDraftChange(result.draft);
    } catch {
      setError("This note could not be saved. If it changed elsewhere, refresh and ask for a new draft.");
    } finally {
      setBusy(false);
    }
  }

  async function discard(): Promise<void> {
    if (busy || committed) return;
    setBusy(true);
    setError(null);
    try {
      const result = await responseJson(await fetch(`${endpoint}/reject`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }));
      onDraftChange(result.draft);
    } catch {
      setError("The draft could not be discarded right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Paper
      elevation={0}
      sx={{
        alignSelf: "flex-start",
        bgcolor: "#F4F8FF",
        border: 1,
        borderColor: "#BFD2F2",
        borderRadius: 2,
        maxWidth: { xs: "100%", md: 680 },
        p: { xs: 1.5, sm: 2 },
        width: "100%",
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
          <EditNoteRoundedIcon color="primary" />
          <Typography sx={{ fontWeight: 850 }} variant="h4">{title(editedProposal)}</Typography>
          <Chip label={draft.tradingDate} size="small" variant="outlined" />
          {editedProposal.kind === "trade_note_draft" ? (
            <Chip
              label={`${editedProposal.ticker} · Trade ${editedProposal.tradeNumber}`}
              size="small"
              variant="outlined"
            />
          ) : null}
        </Stack>
        <Typography color="text.secondary" variant="body2">
          Review and edit this draft. Nothing changes in your Daily Trade Tracker until you save it.
        </Typography>

        {editedProposal.kind === "daily_note_draft" ? editedProposal.updates.map((update) => (
          <TextField
            disabled={busy || committed}
            fullWidth
            key={update.field}
            label={FIELD_LABELS[update.field]}
            minRows={3}
            multiline
            onChange={(event) => setEditedProposal((current) => {
              if (current.kind !== "daily_note_draft") return current;
              return Object.freeze({
                ...current,
                updates: Object.freeze(current.updates.map((item) =>
                  item.field === update.field
                    ? Object.freeze({ ...item, content: event.target.value })
                    : item)),
              });
            })}
            value={update.content}
          />
        )) : null}

        {editedProposal.kind === "trade_note_draft" ? (
          <TextField
            disabled={busy || committed}
            fullWidth
            label="Trade note"
            minRows={4}
            multiline
            onChange={(event) => setEditedProposal(Object.freeze({
              ...editedProposal,
              content: event.target.value,
            }))}
            value={editedProposal.content}
          />
        ) : null}

        {editedProposal.kind === "current_focus_draft" ? (
          <TextField
            disabled={busy || committed}
            fullWidth
            label="Current Focus"
            minRows={4}
            multiline
            onChange={(event) => setEditedProposal(Object.freeze({
              ...editedProposal,
              currentFocuses: event.target.value,
            }))}
            value={editedProposal.currentFocuses}
          />
        ) : null}

        {error ? <Alert severity="error">{error}</Alert> : null}
        {committed ? (
          <Alert icon={<CheckCircleRoundedIcon fontSize="inherit" />} severity="success">
            Saved to the Daily Trade Tracker.
          </Alert>
        ) : (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button disabled={busy} onClick={() => void save()} variant="contained">
              {busy ? "Saving..." : saveLabel(editedProposal)}
            </Button>
            <Button
              color="inherit"
              disabled={busy}
              onClick={() => void discard()}
              startIcon={<DeleteOutlineRoundedIcon />}
              variant="text"
            >
              Discard draft
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
