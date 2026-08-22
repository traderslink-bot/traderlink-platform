"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";

type ErasureDialog = "trade_tracker_account" | "traderlink_account" | null;

const CONFIRMATION: Readonly<Record<Exclude<ErasureDialog, null>, string>> = Object.freeze({
  trade_tracker_account: "DELETE ACCOUNT",
  traderlink_account: "DELETE MY TRADERLINK ACCOUNT",
});

function normalizedConfirmation(value: string): string {
  return value.trim().replace(/\s+/gu, " ").toUpperCase();
}

export function AccountErasureControls({
  activeAccount,
}: {
  activeAccount: Readonly<{ displayName: string; selectionRef: string }> | null;
}) {
  const [dialog, setDialog] = useState<ErasureDialog>(null);
  const [confirmation, setConfirmation] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const expectedConfirmation = dialog ? CONFIRMATION[dialog] : "";
  const confirmationMatches = normalizedConfirmation(confirmation) === expectedConfirmation;

  function closeDialog(): void {
    if (working) return;
    setDialog(null);
    setConfirmation("");
    setError(null);
  }

  function openDialog(nextDialog: Exclude<ErasureDialog, null>): void {
    setDialog(nextDialog);
    setConfirmation("");
    setError(null);
  }

  async function erase(): Promise<void> {
    if (!dialog || !confirmationMatches || working) return;
    setWorking(true);
    setError(null);
    try {
      const response = await fetch("/api/platform/account-erasure", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          [JOURNAL_MUTATION_REQUEST_HEADER]: "1",
        },
        body: JSON.stringify({
          action: dialog,
          confirmation: expectedConfirmation,
          expectedAccountSelectionRef: dialog === "trade_tracker_account"
            ? activeAccount?.selectionRef ?? null
            : null,
        }),
      });
      if (!response.ok) {
        setError(response.status === 409
          ? "Your selected Trade Tracker account changed. Refresh this page and try again."
          : "TraderLink could not complete the deletion. Nothing was deleted. Try again.");
        return;
      }
      window.location.assign(dialog === "traderlink_account" ? "/" : "/account/trading");
    } catch {
      setError("TraderLink could not complete the deletion. Nothing was deleted. Try again.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Alert severity="warning">
        Deletion is permanent in TraderLink&apos;s active system. It cannot be restored through TraderLink after confirmation.
      </Alert>

      {activeAccount ? (
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 2 }}>
          <Stack spacing={1.25}>
            <Box>
              <Typography sx={{ fontWeight: 800 }}>Delete this Trade Tracker account</Typography>
              <Typography color="text.secondary" variant="body2">
                Remove {activeAccount.displayName} and everything kept inside it, including imports, executions, notes, rules, reviews and analytics. Your other Trade Tracker accounts stay intact.
              </Typography>
            </Box>
            <Button color="error" onClick={() => openDialog("trade_tracker_account")} size="small" sx={{ alignSelf: "flex-start" }} variant="outlined">
              Delete Trade Tracker account
            </Button>
          </Stack>
        </Box>
      ) : (
        <Alert severity="info">
          You do not currently have a Trade Tracker account. You can create one again from Trading.
        </Alert>
      )}

      <Box sx={{ border: 1, borderColor: "error.light", borderRadius: 1.5, p: 2 }}>
        <Stack spacing={1.25}>
          <Box>
            <Typography sx={{ fontWeight: 800 }}>Delete TraderLink account</Typography>
            <Typography color="text.secondary" variant="body2">
              This removes your entire TraderLink account, sign-in access, workspace, all Trade Tracker accounts and all associated data. This cannot be undone.
            </Typography>
          </Box>
          <Button color="error" onClick={() => openDialog("traderlink_account")} size="small" sx={{ alignSelf: "flex-start" }} variant="outlined">
            Delete TraderLink account
          </Button>
        </Stack>
      </Box>

      <Dialog fullWidth maxWidth="sm" onClose={closeDialog} open={dialog !== null}>
        <DialogTitle>{dialog === "traderlink_account" ? "Delete your TraderLink account?" : "Delete this Trade Tracker account?"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="error">
              {dialog === "traderlink_account"
                ? "This is permanent. Your workspace, every Trade Tracker account and all associated live data will be deleted. You will be signed out."
                : "This is permanent. This Trade Tracker account and everything inside it will be deleted. Your other Trade Tracker accounts will not be changed."}
            </Alert>
            <Typography color="text.secondary" variant="body2">
              Type <strong>{expectedConfirmation}</strong> to confirm.
            </Typography>
            <TextField
              autoFocus
              disabled={working}
              label="Confirmation"
              onChange={(event) => setConfirmation(event.target.value)}
              value={confirmation}
            />
            {error ? <Alert severity="error">{error}</Alert> : null}
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            alignItems: { xs: "stretch", sm: "center" },
            flexDirection: { xs: "column", sm: "row" },
            gap: { xs: 1, sm: 0 },
            "& > :not(style) ~ :not(style)": { ml: { xs: 0, sm: 1 } },
          }}
        >
          <Button disabled={working} onClick={closeDialog} sx={{ width: { xs: "100%", sm: "auto" } }}>Cancel</Button>
          <Button
            color="error"
            disabled={working || !confirmationMatches}
            onClick={() => void erase()}
            sx={{ width: { xs: "100%", sm: "auto" } }}
            variant="contained"
          >
            {working ? "Deleting..." : dialog === "traderlink_account" ? "Delete account" : "Delete Trade Tracker account"}
          </Button>
        </DialogActions>
      </Dialog>
      <Typography color="text.secondary" variant="caption">
        Protected disaster-recovery copies follow TraderLink&apos;s retention procedure and are not available to restore a deleted account.
      </Typography>
    </Stack>
  );
}
