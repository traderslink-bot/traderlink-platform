"use client";

import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import type { CoachAiChatActionDraft } from
  "@/src/modules/coach/contracts/ai-chat-action-draft-contracts";
import { JOURNAL_MUTATION_REQUEST_HEADER } from
  "@/src/modules/platform/contracts/journal-request-security";

type ActionResponse = Readonly<{ status: "ready"; draft: CoachAiChatActionDraft }>;

async function responseJson(response: Response): Promise<ActionResponse> {
  const value = await response.json() as Partial<ActionResponse>;
  if (!response.ok || value.status !== "ready" || !value.draft) {
    throw new Error("request_failed");
  }
  return value as ActionResponse;
}

function Details({ draft }: Readonly<{ draft: CoachAiChatActionDraft }>) {
  const preview = draft.preview;
  if (preview.kind === "reporting_currency") {
    return <Typography variant="body2"><strong>{preview.currentReportingCurrency}</strong> → <strong>{preview.proposedReportingCurrency}</strong></Typography>;
  }
  if (preview.kind === "select_journal_account") {
    return <Typography variant="body2"><strong>{preview.currentAccountDisplayName}</strong> → <strong>{preview.proposedAccountDisplayName}</strong></Typography>;
  }
  if (preview.kind === "create_journal_account") {
    return (
      <Stack spacing={0.5}>
        <Typography sx={{ fontWeight: 750 }} variant="body2">{preview.displayName}</Typography>
        <Typography color="text.secondary" variant="body2">
          {preview.baseCurrency} · {preview.tradingTimezone}
        </Typography>
        <Typography variant="body2">This account will become active after creation.</Typography>
      </Stack>
    );
  }
  if (preview.kind === "swing_note") {
    return (
      <Stack spacing={1}>
        <Typography sx={{ fontWeight: 750 }} variant="body2">
          {preview.ticker} · {preview.reviewDate}
        </Typography>
        {preview.currentNote ? (
          <Stack spacing={0.25}>
            <Typography color="text.secondary" variant="caption">Current note</Typography>
            <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body2">{preview.currentNote}</Typography>
            {preview.currentNextSessionPlan ? (
              <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }} variant="body2">
                Next session: {preview.currentNextSessionPlan}
              </Typography>
            ) : null}
          </Stack>
        ) : null}
        <Stack spacing={0.25}>
          <Typography color="text.secondary" variant="caption">
            {preview.currentNote ? "Change to" : "New note"}
          </Typography>
          <Typography sx={{ whiteSpace: "pre-wrap" }} variant="body2">{preview.proposedNote}</Typography>
          {preview.proposedNextSessionPlan ? (
            <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }} variant="body2">
              Next session: {preview.proposedNextSessionPlan}
            </Typography>
          ) : null}
        </Stack>
      </Stack>
    );
  }
  if (preview.kind === "trade_style") {
    return (
      <Stack spacing={0.5}>
        <Typography sx={{ fontWeight: 750 }} variant="body2">{preview.ticker}</Typography>
        <Typography variant="body2">
          <strong>{preview.currentLabel}</strong> → <strong>{preview.proposedLabel}</strong>
        </Typography>
      </Stack>
    );
  }
  if (preview.kind === "notification_preferences") {
    const current = preview.currentCategoryLabels.length > 0
      ? preview.currentCategoryLabels.join(", ")
      : "None";
    const proposed = preview.proposedCategoryLabels.length > 0
      ? preview.proposedCategoryLabels.join(", ")
      : "None";
    return (
      <Stack spacing={0.5}>
        <Typography color="text.secondary" variant="body2">Currently: {current}</Typography>
        <Typography variant="body2"><strong>Change to: {proposed}</strong></Typography>
      </Stack>
    );
  }
  if (preview.kind === "ai_review_account_setting") {
    return <Typography variant="body2"><strong>{preview.currentEnabled ? "On" : "Off"}</strong> → <strong>{preview.proposedEnabled ? "On" : "Off"}</strong></Typography>;
  }
  if (preview.kind === "ai_review_request") {
    return (
      <Stack spacing={0.5}>
        <Typography sx={{ fontWeight: 750 }} variant="body2">{preview.reviewLabel}</Typography>
        <Typography color="text.secondary" variant="body2">
          {preview.periodStartDate} through {preview.periodEndDate}
        </Typography>
        <Typography variant="body2">
          Confirmation saves the request. The review will appear after it is generated.
        </Typography>
      </Stack>
    );
  }
  if (preview.kind === "trade_tags") {
    const current = preview.currentTagNames.length > 0
      ? preview.currentTagNames.join(", ")
      : "No tags";
    const proposed = preview.proposedTagNames.length > 0
      ? preview.proposedTagNames.join(", ")
      : "No tags";
    return (
      <Stack spacing={0.5}>
        <Typography sx={{ fontWeight: 750 }} variant="body2">{preview.ticker}</Typography>
        <Typography color="text.secondary" variant="body2">Currently: {current}</Typography>
        <Typography variant="body2"><strong>Change to: {proposed}</strong></Typography>
      </Stack>
    );
  }
  if (preview.kind === "rule_change") {
    return (
      <Stack spacing={1}>
        <Typography sx={{ fontWeight: 750 }} variant="body2">{preview.ruleTitle}</Typography>
        {preview.currentDetails.length > 0 ? (
          <Stack spacing={0.25}>
            <Typography color="text.secondary" variant="caption">Currently</Typography>
            {preview.currentDetails.map((detail) => (
              <Typography color="text.secondary" key={`current-${detail}`} variant="body2">
                {detail}
              </Typography>
            ))}
          </Stack>
        ) : null}
        <Stack spacing={0.25}>
          <Typography color="text.secondary" variant="caption">Change to</Typography>
          {preview.proposedDetails.map((detail) => (
            <Typography key={`proposed-${detail}`} variant="body2">{detail}</Typography>
          ))}
        </Stack>
      </Stack>
    );
  }
  if (preview.kind === "data_decision") {
    return (
      <Stack spacing={0.75}>
        {preview.ticker ? (
          <Typography sx={{ fontWeight: 750 }} variant="body2">{preview.ticker}</Typography>
        ) : null}
        <Typography color="text.secondary" variant="body2">{preview.question}</Typography>
        <Typography sx={{ fontWeight: 750 }} variant="body2">{preview.actionLabel}</Typography>
        {preview.details.map((detail) => (
          <Typography color="text.secondary" key={detail} variant="body2">{detail}</Typography>
        ))}
      </Stack>
    );
  }
  return (
    <Stack spacing={0.5}>
      <Typography sx={{ fontWeight: 750 }} variant="body2">{preview.notificationTitle}</Typography>
      <Typography color="text.secondary" variant="body2">{preview.notificationSummary}</Typography>
    </Stack>
  );
}

export function AiChatActionDraftCard({
  conversationId,
  draft,
  onDraftChange,
}: Readonly<{
  conversationId: string;
  draft: CoachAiChatActionDraft;
  onDraftChange: (draft: CoachAiChatActionDraft) => void;
}>) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const committed = draft.writeState === "committed";
  const endpoint = `/api/coach/chat/conversations/${encodeURIComponent(conversationId)}` +
    `/action-drafts/${encodeURIComponent(draft.draftId)}`;

  async function act(action: "confirm" | "reject"): Promise<void> {
    if (busy || committed) return;
    setBusy(true);
    setError(null);
    try {
      const result = await responseJson(await fetch(`${endpoint}/${action}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [JOURNAL_MUTATION_REQUEST_HEADER]: "1",
        },
        body: "{}",
      }));
      onDraftChange(result.draft);
      if (action === "confirm" &&
          (draft.preview.kind === "select_journal_account" ||
            draft.preview.kind === "create_journal_account") &&
          result.draft.writeState === "committed") {
        window.location.reload();
      }
    } catch {
      setError(action === "confirm"
        ? "This change could not be completed. The original setting is unchanged."
        : "This proposed change could not be dismissed right now.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Paper elevation={0} sx={{ alignSelf: "flex-start", bgcolor: (theme) => theme.palette.mode === "dark" ? theme.palette.action.selected : "#F4F8FF", border: 1, borderColor: (theme) => theme.palette.mode === "dark" ? theme.palette.divider : "#BFD2F2", borderRadius: 2, maxWidth: 680, p: { xs: 1.5, sm: 2 }, width: "100%" }}>
      <Stack spacing={1.5}>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <CheckCircleOutlineRoundedIcon color="primary" />
          <Typography sx={{ fontWeight: 850 }} variant="h4">{draft.preview.title}</Typography>
        </Stack>
        <Details draft={draft} />
        {error ? <Alert severity="error">{error}</Alert> : null}
        {committed ? <Alert severity="success">Change completed.</Alert> : (
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button disabled={busy} onClick={() => void act("confirm")} variant="contained">
              {busy ? "Saving..." : "Confirm change"}
            </Button>
            <Button color="inherit" disabled={busy} onClick={() => void act("reject")} variant="text">
              Cancel
            </Button>
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}
