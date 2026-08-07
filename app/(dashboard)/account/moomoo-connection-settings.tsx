"use client";

import { useState, useTransition } from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
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
  const [confirmingDisconnect, setConfirmingDisconnect] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function disconnect(): void {
    startTransition(async () => {
      setMessage(null);
      try {
        const response = await fetch("/api/connections/moomoo", {
          method: "DELETE",
          credentials: "same-origin",
        });
        if (!response.ok) throw new Error("moomoo_disconnect_failed");
        setConfirmingDisconnect(false);
        router.refresh();
      } catch {
        setMessage("The Moomoo connection could not be disconnected. Try again.");
      }
    });
  }

  if (state === "active") {
    return (
      <>
        <Button
          color="error"
          disabled={pending}
          onClick={() => setConfirmingDisconnect(true)}
          size="small"
          variant="outlined"
        >
          {pending ? "Disconnecting" : "Disconnect"}
        </Button>
        {message ? <Typography color="error" variant="body2">{message}</Typography> : null}
        <Dialog
          aria-describedby="moomoo-disconnect-description"
          onClose={() => !pending && setConfirmingDisconnect(false)}
          open={confirmingDisconnect}
        >
          <DialogTitle>Disconnect Moomoo?</DialogTitle>
          <DialogContent>
            <DialogContentText id="moomoo-disconnect-description">
              This removes Moomoo access from TradersLink. You can connect Moomoo again later.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button disabled={pending} onClick={() => setConfirmingDisconnect(false)}>Cancel</Button>
            <Button color="error" disabled={pending} onClick={disconnect} variant="contained">
              {pending ? "Disconnecting" : "Disconnect"}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <DashboardPrimaryAction component="a" href="/api/connections/moomoo/start" size="small">
      {state === "reauthorization_required" ? "Reconnect Moomoo" : "Connect Moomoo"}
    </DashboardPrimaryAction>
  );
}
