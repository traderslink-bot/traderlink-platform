"use client";

import { useState, useTransition } from "react";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";

import { DashboardPrimaryAction, DashboardSecondaryAction } from "../../dashboard-template";

export function MoomooConnectionSettings({
  state,
}: {
  state: "active" | "reauthorization_required" | "revoked" | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  if (state === "active") {
    return (
      <>
        <DashboardSecondaryAction
          disabled={pending}
          onClick={() => startTransition(async () => {
            setMessage(null);
            try {
              const response = await fetch("/api/connections/moomoo", {
                method: "DELETE",
                credentials: "same-origin",
              });
              if (!response.ok) throw new Error("moomoo_disconnect_failed");
              router.refresh();
            } catch {
              setMessage("The Moomoo connection could not be disconnected. Try again.");
            }
          })}
          size="small"
        >
          {pending ? "Disconnecting" : "Disconnect"}
        </DashboardSecondaryAction>
        {message ? <Typography color="error" variant="body2">{message}</Typography> : null}
      </>
    );
  }

  return (
    <DashboardPrimaryAction component="a" href="/api/connections/moomoo/start" size="small">
      {state === "reauthorization_required" ? "Reconnect Moomoo" : "Connect Moomoo"}
    </DashboardPrimaryAction>
  );
}
