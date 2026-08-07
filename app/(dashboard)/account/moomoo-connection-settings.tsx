"use client";

import { useState, useTransition } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";

import { DashboardSecondaryAction } from "../../dashboard-template";

export function MoomooConnectionSettings({ connected }: { connected: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (!connected) return null;

  return (
    <Stack spacing={1} sx={{ alignItems: "flex-start", mt: 1.5 }}>
      <DashboardSecondaryAction
        disabled={pending}
        onClick={() => startTransition(async () => {
          setMessage(null);
          try {
            const response = await fetch("/api/connections/moomoo", {
              method: "DELETE",
              credentials: "same-origin",
            });
            if (!response.ok) throw new Error("disconnect_failed");
            router.refresh();
          } catch {
            setMessage("The Moomoo connection could not be disconnected. Try again.");
          }
        })}
      >
        {pending ? "Disconnecting connection" : "Disconnect connection"}
      </DashboardSecondaryAction>
      {message ? <Typography color="error" variant="body2">{message}</Typography> : null}
    </Stack>
  );
}
