"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import { useActionState } from "react";

import type { CoachAiReviewKindV2 } from
  "@/src/modules/coach/server/coach-ai-review-repository";
import {
  requestAiReview,
  type RequestAiReviewActionState,
} from "./ai-review-request-actions";

const INITIAL_STATE: RequestAiReviewActionState = Object.freeze({
  ok: false,
  message: null,
});

export function AiReviewRequestButton({
  label,
  periodEndDate,
  periodStartDate,
  reviewKind,
}: {
  label: string;
  periodEndDate: string;
  periodStartDate: string;
  reviewKind: CoachAiReviewKindV2;
}) {
  const [state, formAction, pending] = useActionState(requestAiReview, INITIAL_STATE);
  return (
    <Stack component="form" action={formAction} spacing={1} sx={{ alignItems: "flex-start" }}>
      <input name="reviewKind" type="hidden" value={reviewKind} />
      <input name="periodStartDate" type="hidden" value={periodStartDate} />
      <input name="periodEndDate" type="hidden" value={periodEndDate} />
      <Button disabled={pending} type="submit" variant="contained">
        {pending ? "Saving request..." : label}
      </Button>
      {state.message ? <Alert severity="error">{state.message}</Alert> : null}
    </Stack>
  );
}
