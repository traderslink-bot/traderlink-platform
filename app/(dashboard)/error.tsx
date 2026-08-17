"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect } from "react";

import { DashboardPage } from "../dashboard-template";

export default function DashboardError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard page failed to load.", {
      digest: error.digest ?? null,
      name: error.name,
    });
  }, [error]);

  return (
    <DashboardPage>
      <Stack spacing={2} sx={{ maxWidth: 720 }}>
        <Typography component="h1" variant="h1">This page could not load</Typography>
        <Alert severity="warning">
          Your data was not changed. A reporting-currency rate or another required service may be temporarily unavailable.
        </Alert>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button onClick={() => unstable_retry()} variant="contained">Try again</Button>
          <Button href="/account" variant="outlined">Account settings</Button>
        </Stack>
      </Stack>
    </DashboardPage>
  );
}
