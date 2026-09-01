"use client";

import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import type { CoachAiReviewDeliveryChangeDraft } from "@/src/modules/coach/contracts/ai-review-delivery-change-contracts";

const DAYS = [["friday", "Friday"], ["saturday", "Saturday"], ["sunday", "Sunday"]] as const;
const TIMES = Array.from({ length: 16 }, (_, index) => {
  const minutes = 16 * 60 + index * 30;
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return Object.freeze({
    value: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    label: `${hour - 12}:${String(minute).padStart(2, "0")} PM Eastern`,
  });
});

type Response = Readonly<{ status: "ready"; draft: CoachAiReviewDeliveryChangeDraft }>;

async function responseJson(response: globalThis.Response): Promise<Response> {
  const value = await response.json() as Partial<Response>;
  if (!response.ok || value.status !== "ready" || !value.draft) throw new Error("request_failed");
  return value as Response;
}

function display(day: string, time: string): string {
  const dayLabel = DAYS.find(([value]) => value === day)?.[1] ?? day;
  const timeLabel = TIMES.find((item) => item.value === time)?.label ?? `${time} Eastern`;
  return `${dayLabel} at ${timeLabel}`;
}

export function AiChatReviewDeliveryChangeCard({
  conversationId,
  draft,
  onDraftChange,
}: Readonly<{
  conversationId: string;
  draft: CoachAiReviewDeliveryChangeDraft;
  onDraftChange: (draft: CoachAiReviewDeliveryChangeDraft) => void;
}>) {
  const [day, setDay] = useState(draft.proposed.weeklyDeliveryDay);
  const [time, setTime] = useState(draft.proposed.deliveryTimeEastern);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const committed = draft.settingsWriteState === "committed";
  const endpoint = `/api/coach/chat/conversations/${encodeURIComponent(conversationId)}` +
    `/review-delivery-change-drafts/${encodeURIComponent(draft.draftId)}`;

  async function act(action: "confirm" | "reject"): Promise<void> {
    if (busy || committed) return;
    setBusy(true);
    setError(null);
    try {
      const result = await responseJson(await fetch(`${endpoint}/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: action === "confirm"
          ? JSON.stringify({ editedProposal: { weeklyDeliveryDay: day, deliveryTimeEastern: time } })
          : "{}",
      }));
      onDraftChange(result.draft);
    } catch {
      setError(action === "confirm"
        ? "This change could not be saved. If your settings changed elsewhere, refresh and try again."
        : "This proposed change could not be dismissed right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Paper elevation={0} sx={{ alignSelf: "flex-start", bgcolor: (theme) => theme.palette.mode === "dark" ? theme.palette.action.selected : "#F4F8FF", border: 1, borderColor: (theme) => theme.palette.mode === "dark" ? theme.palette.divider : "#BFD2F2", borderRadius: 2, maxWidth: 680, p: { xs: 1.5, sm: 2 }, width: "100%" }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <AccessTimeRoundedIcon color="primary" />
          <Typography sx={{ fontWeight: 850 }} variant="h4">AI Review delivery</Typography>
        </Stack>
        <Typography color="text.secondary" variant="body2">
          Current: {display(draft.current.weeklyDeliveryDay, draft.current.deliveryTimeEastern)}
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
          <TextField disabled={busy || committed} fullWidth label="Weekly review day" onChange={(event) => setDay(event.target.value as typeof day)} select value={day}>
            {DAYS.map(([value, label]) => <MenuItem key={value} value={value}>{label}</MenuItem>)}
          </TextField>
          <TextField disabled={busy || committed} fullWidth label="Delivery time" onChange={(event) => setTime(event.target.value)} select value={time}>
            {TIMES.map((item) => <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>)}
          </TextField>
        </Stack>
        {error ? <Alert severity="error">{error}</Alert> : null}
        {committed ? <Alert severity="success">AI Review delivery updated.</Alert> : (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button disabled={busy} onClick={() => void act("confirm")} variant="contained">
              {busy ? "Saving..." : "Confirm delivery change"}
            </Button>
            <Button color="inherit" disabled={busy} onClick={() => void act("reject")} variant="text">
              Cancel change
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
