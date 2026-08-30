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
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";

const CLEAR_CONFIRMATION = "DELETE ACCOUNT";

function normalizedConfirmation(value: string): string {
  return value.trim().replace(/\s+/gu, " ").toUpperCase();
}

function ClearDemoDataAction({
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

function OpenDemoTradeTrackerAction() {
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);

  const openDemoTradeTracker = useCallback(async (): Promise<void> => {
    if (working) return;
    setWorking(true);
    setError(null);
    try {
      const response = await fetch("/api/platform/journal/demo/activate", {
        method: "POST",
        credentials: "same-origin",
        headers: { [JOURNAL_MUTATION_REQUEST_HEADER]: "1" },
      });
      if (!response.ok) {
        setError("The Demo Trade Tracker is not available right now. Your real trades were not changed.");
        return;
      }
      window.location.assign("/workspace");
    } catch {
      setError("The Demo Trade Tracker is not available right now. Your real trades were not changed.");
    } finally {
      setWorking(false);
    }
  }, [working]);

  return (
    <Stack spacing={1} sx={{ alignItems: "flex-start" }}>
      <Button disabled={working} onClick={() => void openDemoTradeTracker()} variant="contained">
        {working ? "Opening demo..." : "Open Demo Trade Tracker"}
      </Button>
      {error ? <Alert severity="error">{error}</Alert> : null}
    </Stack>
  );
}

export function DemoTradeTrackerInvitation({
  hasRealAcceptedExecution,
}: {
  hasRealAcceptedExecution: boolean;
}) {
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(true);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/platform/journal/demo/activate", {
          method: "POST",
          credentials: "same-origin",
          headers: { [JOURNAL_MUTATION_REQUEST_HEADER]: "1" },
        });
        if (!response.ok) {
          if (active) {
            setError("The Demo Trade Tracker is not available right now. Your real trades were not changed.");
            setWorking(false);
          }
          return;
        }
        window.location.assign("/workspace");
      } catch {
        if (active) {
          setError("The Demo Trade Tracker is not available right now. Your real trades were not changed.");
          setWorking(false);
        }
      }
    })();
    return () => { active = false; };
  }, []);

  if (working) return null;

  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 1.5,
        maxWidth: 980,
        p: { xs: 2, sm: 2.5 },
      }}
    >
      <Stack spacing={1.25} sx={{ alignItems: "flex-start" }}>
        <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">
          Explore the Demo Trade Tracker
        </Typography>
        <Typography color="text.primary" variant="body2">
          {hasRealAcceptedExecution
            ? "Your real trades stay exactly where they are. Open a separate Demo Trade Tracker to explore populated trades, notes, rules, analytics, and the Trade Analyzer."
            : "Open a separate Demo Trade Tracker to explore populated trades, notes, rules, analytics, and the Trade Analyzer before adding your own trades."}
        </Typography>
        <OpenDemoTradeTrackerAction />
        {error ? <Alert severity="error">{error}</Alert> : null}
      </Stack>
    </Box>
  );
}

export function DemoDataCallout({
  expectedAccountSelectionRef,
  variant,
}: {
  expectedAccountSelectionRef: string;
  variant: "compact" | "workspace";
}) {
  if (variant === "compact") {
    return (
      <Stack spacing={0.75} sx={{ alignItems: "flex-start" }}>
        <Typography color="error.main" sx={{ fontWeight: 800 }} variant="body2">
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
        <Typography color="error.main" component="h2" sx={{ fontWeight: 850 }} variant="h5">
          Viewing Demo Data
        </Typography>
        <Typography color="text.primary" variant="body2">
          Your account has been preloaded with demo data so you can explore the dashboard and see how everything looks with real trading activity.
        </Typography>
        <Typography color="text.primary" variant="body2">
          Take a tour, explore the features, and get familiar with the platform. When you&apos;re ready, you can start adding your own trades.
        </Typography>
        <Typography color="text.primary" variant="body2">
          Ready to start tracking your own journey? Use the Daily Trade Tracker to record trades, review your performance, and learn from every decision.
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
          <Button href="/trade-tracker" variant="contained">
            Open Daily Trade Tracker
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
  if (!expectedAccountSelectionRef || pathname === "/workspace") return null;
  return (
    <Box sx={{ mb: 1.5, maxWidth: 980 }}>
      <DemoDataCallout
        expectedAccountSelectionRef={expectedAccountSelectionRef}
        variant="compact"
      />
    </Box>
  );
}
