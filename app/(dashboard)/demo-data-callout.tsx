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
import { useTheme } from "@mui/material/styles";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";
import { isTradeAnalyzerNavigationPath, isTradeJournalNavigationPath } from "../dashboard-navigation";

const CLEAR_CONFIRMATION = "DELETE ACCOUNT";

function normalizedConfirmation(value: string): string {
  return value.trim().replace(/\s+/gu, " ").toUpperCase();
}

export function ClearDemoDataAction({
  expectedAccountSelectionRef,
}: {
  expectedAccountSelectionRef: string;
}) {
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const confirmationMatches = normalizedConfirmation(confirmation) === CLEAR_CONFIRMATION;

  function close(): void {
    if (working) return;
    setConfirmation("");
    setError(null);
    setOpen(false);
  }

  async function clearDemoData(): Promise<void> {
    if (!confirmationMatches || working) return;
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
          action: "demo_trade_tracker_account",
          confirmation: CLEAR_CONFIRMATION,
          expectedAccountSelectionRef,
        }),
      });
      if (!response.ok) {
        setError(response.status === 409
          ? "Your selected Trade Tracker account changed. Refresh this page and try again."
          : "TradersLink could not clear demo data. Nothing was deleted. Try again.");
        return;
      }
      window.location.replace("/workspace");
    } catch {
      setError("TradersLink could not clear demo data. Nothing was deleted. Try again.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <>
      <Button color="error" onClick={() => setOpen(true)} size="small" variant="outlined">
        Clear demo data and start fresh →
      </Button>
      <Dialog fullWidth maxWidth="sm" onClose={close} open={open}>
        <DialogTitle>Clear demo data and start fresh?</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="error">
              This permanently deletes the Demo Trade Tracker and everything in it. You will return to Workspace onboarding to start tracking your own trades.
            </Alert>
            <Typography color="text.secondary" variant="body2">
              Type <strong>{CLEAR_CONFIRMATION}</strong> to confirm.
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
          <Button disabled={working} onClick={close} sx={{ width: { xs: "100%", sm: "auto" } }}>
            Cancel
          </Button>
          <Button
            color="error"
            disabled={working || !confirmationMatches}
            onClick={() => void clearDemoData()}
            sx={{ width: { xs: "100%", sm: "auto" } }}
            variant="contained"
          >
            {working ? "Clearing..." : "Clear demo data"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function DemoDataCallout({
  expectedAccountSelectionRef,
  variant,
}: {
  expectedAccountSelectionRef: string;
  variant: "compact" | "workspace";
}) {
  const theme = useTheme();
  const demoBodyColor = theme.palette.text.primary;
  const demoHeadingColor = theme.palette.mode === "dark"
    ? theme.palette.text.primary
    : theme.palette.error.main;

  if (variant === "compact") {
    return (
      <Stack spacing={0.75} sx={{ alignItems: "flex-start" }}>
        <Typography sx={{ color: demoHeadingColor, fontWeight: 800 }} variant="body2">
          Viewing demo data
        </Typography>
        <ClearDemoDataAction expectedAccountSelectionRef={expectedAccountSelectionRef} />
      </Stack>
    );
  }

  return (
    <Box
      sx={{
        border: 2,
        borderColor: "error.main",
        borderRadius: 1.5,
        maxWidth: 980,
        p: { xs: 2, sm: 2.5 },
      }}
    >
      <Stack spacing={1.25} sx={{ alignItems: "flex-start" }}>
        <Typography component="h2" sx={{ color: demoHeadingColor, fontWeight: 850 }} variant="h5">
          Viewing Demo Data
        </Typography>
        <Typography sx={{ color: demoBodyColor }} variant="body2">
          Your Trade Journal account is preloaded with sample trades from August. Explore the sample trade history, notes, and performance summaries to see how the Journal works. Session Tracker opens to August 27 by default, and you can switch to any available trading day in August.
        </Typography>
        <Typography sx={{ color: demoBodyColor }} variant="body2">
          When you’re ready to track your own trades, clear the demo data and start fresh.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button href="/trade-tracker" variant="contained">
            Open Session Tracker
          </Button>
          <ClearDemoDataAction expectedAccountSelectionRef={expectedAccountSelectionRef} />
        </Stack>
      </Stack>
    </Box>
  );
}

export function DemoDataAccountIndicator({
  expectedAccountSelectionRef,
}: {
  expectedAccountSelectionRef: string | null;
}) {
  const pathname = usePathname();
  if (!expectedAccountSelectionRef || pathname === "/workspace" || pathname === "/trade-analyzer") return null;
  if (!isTradeJournalNavigationPath(pathname) && !isTradeAnalyzerNavigationPath(pathname)) return null;
  return (
    <Box sx={{ mb: 1.5, maxWidth: 980 }}>
      <DemoDataCallout
        expectedAccountSelectionRef={expectedAccountSelectionRef}
        variant="compact"
      />
    </Box>
  );
}
