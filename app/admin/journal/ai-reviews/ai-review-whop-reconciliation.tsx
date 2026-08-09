"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState, useTransition } from "react";

import { reconcileWhopAiReviewAccess } from
  "./ai-review-whop-reconciliation-actions";

export function AiReviewWhopReconciliation(input: Readonly<{
  enabled: boolean;
}>) {
  const [notice, setNotice] = useState<Readonly<{
    ok: boolean;
    message: string;
  }> | null>(null);
  const [working, startTransition] = useTransition();

  function reconcile(): void {
    startTransition(async () => setNotice(await reconcileWhopAiReviewAccess()));
  }

  return (
    <Stack spacing={1.25}>
      <Typography color="text.secondary" variant="body2">
        Compare stored AI Review access with current memberships returned by Whop. A missing membership never revokes access by itself; only returned membership records can update access.
      </Typography>
      {notice ? <Alert severity={notice.ok ? "success" : "warning"}>{notice.message}</Alert> : null}
      <Button disabled={!input.enabled || working} onClick={reconcile} variant="outlined">
        {working ? "Checking Whop..." : "Check Whop access now"}
      </Button>
      {!input.enabled ? (
        <Typography color="text.secondary" variant="caption">
          Add the Whop API key, accepted company and products, API version, and identity-protection key to enable this check.
        </Typography>
      ) : null}
    </Stack>
  );
}
