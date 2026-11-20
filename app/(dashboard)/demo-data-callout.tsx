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
import { useLayoutEffect, useRef, useState } from "react";

import { useAccountErasureRequest, useErasureViewer } from "./account/account-erasure-controls";
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
  const viewerRef = useErasureViewer();
  const request = useAccountErasureRequest(viewerRef);
  const { error, working } = request;
  const selection = useRef(expectedAccountSelectionRef);
  useLayoutEffect(() => { selection.current = expectedAccountSelectionRef; }, [expectedAccountSelectionRef]);
  const confirmationContext = useRef({ viewerRef, selectionRef: expectedAccountSelectionRef });
  const [open, setOpen] = useState(false);
  const confirmationMatches = normalizedConfirmation(confirmation) === CLEAR_CONFIRMATION;

  function close(): void {
    if (working) return;
    setConfirmation("");
    setOpen(false);
  }

  async function clearDemoData(): Promise<void> {
    if (!confirmationMatches || working || !request.ready || !viewerRef) return;
    if (confirmationContext.current.viewerRef !== viewerRef || confirmationContext.current.selectionRef !== expectedAccountSelectionRef) {
      close(); return;
    }
    const selected = expectedAccountSelectionRef;
    const result = await request.send({ action: "demo_trade_tracker_account", confirmation: CLEAR_CONFIRMATION,
      expectedAccountSelectionRef: selected, expectedViewerRef: viewerRef }, () => selection.current === selected);
    if (result?.status === "deleted") window.location.replace("/workspace");
    else if (result?.status === "known_not_submitted") { setOpen(false); setConfirmation(""); }
  }

  return (
    <>
      {error ? <Alert severity="warning">{error} <Button onClick={() => void request.check()}>Check saved request</Button><Button href="/account/privacy">View deletion status</Button></Alert> : null}
      <Button disabled={!request.ready || working} color="error" onClick={() => { confirmationContext.current = { viewerRef, selectionRef: expectedAccountSelectionRef }; setOpen(true); }} size="small" variant="outlined">
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
            disabled={working || !confirmationMatches || !request.ready}
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
