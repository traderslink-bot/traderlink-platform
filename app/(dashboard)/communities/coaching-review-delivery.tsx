"use client";

import {useState, useTransition} from "react";
import {useRouter} from "next/navigation";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import {deliverCommunityReviewAction} from "./community-actions";

export function CoachingReviewDelivery({communitySlug, relationshipId, reviewId, studentName, disabled}: {
  communitySlug: string; relationshipId: string; reviewId: string; studentName: string; disabled: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  return <Stack spacing={1} component="form" action={form => {
    startTransition(async () => {
      setFailed(false);
      try {
        await deliverCommunityReviewAction(form);
      } catch {
        // Do not expose serialized server errors or discard the saved review.
        setFailed(true);
      } finally {
        router.refresh();
      }
    });
  }}>
    <input name="communitySlug" type="hidden" value={communitySlug}/>
    <input name="relationshipId" type="hidden" value={relationshipId}/>
    <input name="reviewId" type="hidden" value={reviewId}/>
    {failed ? <Alert severity="error">The review could not be sent. Your saved feedback is retained. Check the current review requirements and required Journal sharing before trying again.</Alert> : null}
    <Button disabled={disabled || pending} type="submit" variant="contained">{pending ? "Sending review…" : `Send review to ${studentName}`}</Button>
  </Stack>;
}
