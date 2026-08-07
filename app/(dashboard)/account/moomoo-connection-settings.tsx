"use client";

import { useState, useTransition } from "react";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";

import { DashboardPrimaryAction } from "../../dashboard-template";

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
        <Button
          color="error"
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
          variant="outlined"
        >
          {pending ? "Disconnecting" : "Disconnect"}
        </Button>
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
