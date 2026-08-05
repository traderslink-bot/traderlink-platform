"use client";

import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import { Alert, Chip, Stack, TextField, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState } from "react";

import type { JournalSwingDailyNoteRecord } from "@/src/modules/journal/contracts/journal-swing-note-contracts";
import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";
import { DashboardPrimaryAction } from "../../../dashboard-template";

function failureMessage(code?: string): string {
  if (code === "TRADERLINK_SWING_NOTE_CONFLICT") {
    return "This note changed while you were editing it. Refresh the page before saving again.";
  }
  return "The note could not be saved. Your text is still here.";
}

function formatUpdatedAtUtc(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "N/A";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ] as const;
  const hour = date.getUTCHours();
  const displayHour = hour % 12 || 12;
  const minute = date.getUTCMinutes().toString().padStart(2, "0");
  return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}, ${displayHour}:${minute} ${hour >= 12 ? "PM" : "AM"} UTC`;
}

type SwingNoteEditorProps = Readonly<{
  expectedAccountSelectionRef: string;
  note: JournalSwingDailyNoteRecord | null;
  positionRef: string;
  reviewDate: string;
}>;

function SwingNoteEditorForm({
  expectedAccountSelectionRef,
  note,
  positionRef,
  reviewDate,
}: SwingNoteEditorProps) {
  const router = useRouter();
  const [noteText, setNoteText] = useState(note?.note ?? "");
  const [nextSessionPlan, setNextSessionPlan] = useState(note?.nextSessionPlan ?? "");
  const [state, setState] = useState<
    { kind: "idle" } | { kind: "saving" } | { kind: "saved" } |
    { kind: "error"; message: string }
  >({ kind: "idle" });

  async function save() {
    if (state.kind === "saving" || noteText.trim().length === 0) return;
    setState({ kind: "saving" });
    const response = await fetch(
      `/api/platform/journal/swings/${encodeURIComponent(positionRef)}/notes`,
      {
        body: JSON.stringify({
          expectedAccountSelectionRef,
          expectedRevision: note?.revision ?? null,
          idempotencyKey: crypto.randomUUID(),
          nextSessionPlan: nextSessionPlan.trim() || null,
          note: noteText,
          reviewDate,
        }),
        headers: {
          "content-type": "application/json",
          [JOURNAL_MUTATION_REQUEST_HEADER]: "1",
        },
        method: "POST",
      },
    );
    const body = await response.json() as { code?: string; status?: string };
    if (!response.ok || body.status !== "ready") {
      setState({ kind: "error", message: failureMessage(body.code) });
      return;
    }
    setState({ kind: "saved" });
    router.refresh();
  }

  return (
    <Stack spacing={1.25}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <Typography sx={{ fontWeight: 800 }} variant="body2">
          {reviewDate} review
        </Typography>
        {note?.addedRetrospectively ? (
          <Chip label="Added retrospectively" size="small" variant="outlined" />
        ) : null}
      </Stack>
      <TextField
        label="What changed, and what matters now?"
        minRows={3}
        multiline
        onChange={(event) => {
          setNoteText(event.target.value);
          setState({ kind: "idle" });
        }}
        value={noteText}
      />
      <TextField
        label="Plan for the next session (optional)"
        minRows={2}
        multiline
        onChange={(event) => {
          setNextSessionPlan(event.target.value);
          setState({ kind: "idle" });
        }}
        value={nextSessionPlan}
      />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
        <DashboardPrimaryAction
          disabled={state.kind === "saving" || noteText.trim().length === 0}
          onClick={() => void save()}
          startIcon={state.kind === "saved" ? <CheckCircleOutlineRoundedIcon /> : undefined}
        >
          {state.kind === "saving" ? "Saving..." : state.kind === "saved" ? "Note saved" : "Save swing note"}
        </DashboardPrimaryAction>
        {note ? (
          <Typography color="text.secondary" variant="caption">
            Last updated {formatUpdatedAtUtc(note.updatedAtUtc)}
          </Typography>
        ) : null}
      </Stack>
      {state.kind === "error" ? <Alert severity="error">{state.message}</Alert> : null}
    </Stack>
  );
}

export function SwingNoteEditor(props: SwingNoteEditorProps) {
  return (
    <SwingNoteEditorForm
      {...props}
      key={`${props.positionRef}:${props.reviewDate}:${props.note?.revision ?? "new"}`}
    />
  );
}
