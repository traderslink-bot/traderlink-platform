"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState, useTransition } from "react";

import { verifyAiReviewCalendarNow } from "./ai-review-calendar-actions";

export function AiReviewCalendarControl() {
  const [notice, setNotice] = useState<Readonly<{
    ok: boolean;
    message: string;
  }> | null>(null);
  const [working, startTransition] = useTransition();

  function verify(): void {
    startTransition(async () => setNotice(await verifyAiReviewCalendarNow()));
  }

  return (
    <Stack spacing={1.25}>
      <Typography color="text.secondary" variant="body2">
        This owner-only check compares the next-year Nasdaq and NYSE calendars. A new immutable calendar is saved only when both sources agree. AI Review pages and generation always use stored calendars and never fetch exchange websites.
      </Typography>
      {notice ? <Alert severity={notice.ok ? "success" : "warning"}>{notice.message}</Alert> : null}
      <Button disabled={working} onClick={verify} variant="outlined">
        {working ? "Verifying..." : "Verify calendar now"}
      </Button>
    </Stack>
  );
}
