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
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";

import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";
import {
  ERASURE_STATUS_PROTOCOL, erasureBodyHash, erasureLockName, erasureStorageKey, isErasureBody,
  isViewerRef, matchingErasureResolution, readErasureAttempt,
  type ErasureAttempt, type ErasureBody, type ErasureResolution, type ErasureStatus,
} from "@/src/modules/platform/contracts/account-erasure-status";

const ViewerContext = createContext<string | null>(null);
export function ErasureViewerProvider({ viewerRef, children }: { viewerRef: string; children?: ReactNode }) {
  return <ViewerContext.Provider value={viewerRef}>{children}</ViewerContext.Provider>;
}
export function useErasureViewer(): string | null { return useContext(ViewerContext); }

/** Every participating action uses one viewer lock, not an action/selection lock. */
export function useAccountErasureRequest(viewerRef: string | null) {
  const [ready, setReady] = useState(false), [workingViewer, setWorkingViewer] = useState<string | null>(null);
  const working = viewerRef !== null && workingViewer === viewerRef;
  const [attempt, setAttempt] = useState<ErasureAttempt | null>(null), [error, setError] = useState<string | null>(null);
  const context = useRef(viewerRef);
  const memory = useRef<{ viewer: string | null; last: ErasureAttempt | null; missingUnsafe: boolean }>({ viewer: viewerRef, last: null, missingUnsafe: false });
  useLayoutEffect(() => {
    context.current = viewerRef;
    if (memory.current.viewer !== viewerRef) memory.current = { viewer: viewerRef, last: null, missingUnsafe: false };
  }, [viewerRef]);
  const current = useCallback(() => context.current === viewerRef, [viewerRef]);
  const lock = useCallback(async <T,>(operation: () => Promise<T>): Promise<T> => {
    if (!isViewerRef(viewerRef) || !navigator.locks?.request) throw new Error("This browser cannot safely coordinate a deletion request. Use a supported browser and check any earlier request with support.");
    return navigator.locks.request(erasureLockName(viewerRef), { mode: "exclusive", ifAvailable: true }, async held => {
      if (!held) throw new Error("Another tab is checking or submitting a deletion request. Check its saved status before continuing.");
      if (!current()) throw new Error("Your signed-in account changed. Reopen Account settings.");
      return operation();
    });
  }, [viewerRef, current]);
  const read = useCallback(async (): Promise<ErasureAttempt | null> => {
    const owner = memory.current;
    try {
      const raw = localStorage.getItem(erasureStorageKey(viewerRef!));
      if (raw === null) {
        if (owner.last || owner.missingUnsafe) throw new Error("Saved request is missing");
        return null;
      }
      const saved = await readErasureAttempt(raw, viewerRef!);
      if (!current()) throw new Error("Account changed");
      if (owner.last && owner.last.phase !== "resolved" && (saved.attemptId !== owner.last.attemptId
        || saved.body !== owner.last.body || saved.bodySha256 !== owner.last.bodySha256)) throw new Error("Original request differs");
      owner.last = saved; owner.missingUnsafe = false; return saved;
    } catch {
      owner.missingUnsafe = true;
      throw new Error("The saved deletion request cannot be read or verified. New requests are paused. Keep the original browser data and contact support if it cannot be recovered.");
    }
  }, [viewerRef, current]);
  const check = useCallback(async () => {
    setReady(false);
    try {
      await lock(async () => { const saved = await read(); if (current()) { setAttempt(saved); setReady(!saved || saved.phase === "resolved"); setError(null); } });
    } catch (cause) { if (current()) setError(cause instanceof Error ? cause.message : "Saved request unavailable."); }
  }, [lock, read, current]);
  useEffect(() => {
    void check();
    const invalidate = (event: StorageEvent) => {
      if (event.key !== null && event.key !== erasureStorageKey(viewerRef!)) return;
      // Events invalidate; they are neither CAS nor permission to dispatch.
      memory.current.missingUnsafe = true; setReady(false);
      setError("Deletion request data changed in another tab. Check the saved request before continuing.");
    };
    window.addEventListener("storage", invalidate);
    return () => window.removeEventListener("storage", invalidate);
  }, [check, viewerRef]);
  const send = async (body: ErasureBody, stillCurrent: () => boolean = () => true): Promise<ErasureResolution | null> => {
    setWorkingViewer(viewerRef); setReady(false); setError(null);
    try {
      if (!isErasureBody(body) || body.expectedViewerRef !== viewerRef) throw new Error("Reopen Account settings before confirming.");
      const originalBody = JSON.stringify(body), hash = await erasureBodyHash(originalBody);
      return await lock(async () => {
        const previous = await read();
        if (previous && previous.phase !== "resolved") { setAttempt(previous); throw new Error("The original deletion outcome is still unconfirmed. No new request was sent."); }
        if (!current() || !stillCurrent()) throw new Error("The displayed account changed. Review it again.");
        const owner = memory.current;
        let original: ErasureAttempt = { protocol: ERASURE_STATUS_PROTOCOL, viewerRef: viewerRef!, attemptId: crypto.randomUUID(),
          body: originalBody, bodySha256: hash, phase: "prepared" };
        const retain = (next: ErasureAttempt) => {
          owner.last = next;
          const bytes = JSON.stringify(next); localStorage.setItem(erasureStorageKey(viewerRef!), bytes);
          if (localStorage.getItem(erasureStorageKey(viewerRef!)) !== bytes) throw new Error("Request recovery copy could not be verified");
          if (current()) setAttempt(next);
        };
        // Conservative possible-effect marker is durable BEFORE the first fetch.
        retain(original);
        original = { ...original, phase: "dispatching" }; retain(original);
        if (!current() || !stillCurrent()) throw new Error("The displayed account changed. The retained request needs checking.");
        try {
          const response = await fetch("/api/platform/account-erasure", { method: "POST", credentials: "same-origin",
            headers: { "content-type": "application/json", [JOURNAL_MUTATION_REQUEST_HEADER]: "1" }, body: originalBody });
          const result: unknown = await response.json();
          if (!matchingErasureResolution(result, original)
            || (result.status === "deleted" ? !response.ok : response.ok)) throw new Error("Unconfirmed response");
          original = { ...original, phase: "resolved", resolution: result }; retain(original);
          if (current()) { setReady(true); setError(result.status !== "known_not_submitted" ? null
            : result.reason === "viewer_changed" ? "Your signed-in account changed. Reopen Account settings and confirm again. This request was not submitted."
              : result.reason === "selection_changed" ? "The selected Trade Tracker account changed. Reopen Account settings to review it before confirming a deletion. This request was not submitted."
                : "This request was not submitted. Check the current account and any pending deletion before a fresh confirmation."); }
          return result;
        } catch {
          // If a final write fails, the earlier conservative marker still blocks.
          const unknown: ErasureAttempt = { ...original, phase: "outcome_unknown", resolution: undefined };
          try { retain(unknown); } catch { owner.missingUnsafe = true; }
          throw new Error("We could not confirm the deletion outcome. The original request is retained. Do not submit another deletion; check saved status or contact support.");
        }
      });
    } catch (cause) {
      if (current()) setError(cause instanceof Error ? cause.message : "Request could not be confirmed.");
      return null;
    } finally { if (current()) setWorkingViewer(null); }
  };
  return { ready, working, attempt: attempt?.viewerRef === viewerRef ? attempt : null, error, check, send };
}

type ErasureDialog = "trade_tracker_account" | "traderlink_account" | null;

const CONFIRMATION: Readonly<Record<Exclude<ErasureDialog, null>, string>> = Object.freeze({
  trade_tracker_account: "DELETE ACCOUNT",
  traderlink_account: "DELETE MY TRADERLINK ACCOUNT",
});

function normalizedConfirmation(value: string): string {
  return value.trim().replace(/\s+/gu, " ").toUpperCase();
}

export function AccountErasureControls({
  activeAccount, viewerRef, journalAccountCount,
}: {
  activeAccount: Readonly<{ displayName: string; selectionRef: string }> | null;
  viewerRef: string; journalAccountCount: number;
}) {
  const [dialog, setDialog] = useState<ErasureDialog>(null);
  const [confirmation, setConfirmation] = useState("");
  const request = useAccountErasureRequest(viewerRef);
  const { working } = request;
  const [readStatus, setReadStatus] = useState<ErasureStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [checkingFor, setCheckingFor] = useState<string | null>(null);
  const checking = checkingFor === viewerRef;
  const statusEpoch = useRef(0), statusViewer = useRef(viewerRef);
  useLayoutEffect(() => { statusViewer.current = viewerRef; statusEpoch.current++; }, [viewerRef]);
  const selection = useRef(activeAccount?.selectionRef);
  useLayoutEffect(() => { selection.current = activeAccount?.selectionRef; }, [activeAccount?.selectionRef]);
  const confirmationContext = useRef({ viewerRef, selectionRef: activeAccount?.selectionRef });
  const shownStatus = readStatus?.viewerRef === viewerRef ? readStatus : null;
  const error = request.error;
  const expectedConfirmation = dialog ? CONFIRMATION[dialog] : "";
  const confirmationMatches = normalizedConfirmation(confirmation) === expectedConfirmation;

  function closeDialog(): void {
    if (working) return;
    setDialog(null);
    setConfirmation("");
  }

  function openDialog(nextDialog: Exclude<ErasureDialog, null>): void {
    confirmationContext.current = { viewerRef, selectionRef: activeAccount?.selectionRef };
    setDialog(nextDialog);
    setConfirmation("");
  }

  async function erase(): Promise<void> {
    if (!dialog || !confirmationMatches || working || !request.ready || shownStatus?.currentPending) return;
    if (confirmationContext.current.viewerRef !== viewerRef || (dialog === "trade_tracker_account"
      && confirmationContext.current.selectionRef !== activeAccount?.selectionRef)) {
      setDialog(null); setConfirmation(""); return;
    }
    const action = dialog, selected = activeAccount?.selectionRef;
    const result = await request.send({ action, confirmation: expectedConfirmation, expectedViewerRef: viewerRef,
      expectedAccountSelectionRef: action === "trade_tracker_account" ? selected ?? null : null },
    () => action === "traderlink_account" || selection.current === selected);
    if (result?.status === "deleted") window.location.assign(action === "traderlink_account" ? "/" : "/account/trading");
    else if (result?.status === "known_not_submitted") { setDialog(null); setConfirmation(""); }
  }
  async function checkStatus(): Promise<void> {
    const version = ++statusEpoch.current;
    const current = () => version === statusEpoch.current && statusViewer.current === viewerRef;
    setCheckingFor(viewerRef); setStatusError(null);
    await request.check();
    try {
      const response = await fetch("/api/platform/account-erasure", { cache: "no-store", credentials: "same-origin" });
      const value = await response.json() as ErasureStatus;
      if (!response.ok || value.protocol !== ERASURE_STATUS_PROTOCOL || value.viewerRef !== viewerRef
        || !Array.isArray(value.recent) || value.recent.length > 10) throw new Error("Status unavailable");
      if (current()) setReadStatus(value);
    } catch { if (current()) setStatusError("Saved status could not be checked for this signed-in account. This does not confirm deletion. Keep the original request and contact support if needed."); }
    finally { if (current()) setCheckingFor(null); }
  }

  return (
    <Stack spacing={2}>
      {error ? <Alert severity="warning">{error}</Alert> : null}
      {request.attempt && request.attempt.phase !== "resolved" ? <Alert severity="warning">
        Your original deletion request still needs confirmation. New deletion requests are paused, including requests for a different Trade Tracker account.
      </Alert> : null}
      <Button disabled={checking || working} onClick={() => void checkStatus()} sx={{ alignSelf: "flex-start" }}>Check saved status</Button>
      {statusError ? <Alert severity="warning">{statusError}</Alert> : null}
      {shownStatus ? <Box aria-live="polite">
        <Typography variant="body2">Recent support records are informational. They cannot identify an unconfirmed request whose original receipt was not received.</Typography>
        {shownStatus.currentPending ? <Alert severity="warning">An account-deletion operation still needs reconciliation. Do not submit another deletion.</Alert> : null}
        {shownStatus.recent.map(row => <Typography key={row.receiptRef} variant="body2">
          {row.action === "traderlink_account" ? "TraderLink account" : "Trade Tracker account"} · {row.acceptedAtUtc} · {
            row.phase === "complete" ? "Complete" : row.phase === "committed_cleanup_pending" ? "Deleted; cleanup still pending"
              : row.phase === "not_deleted" ? "Transaction rolled back" : row.phase === "accepted" ? "Accepted; pending" : "Outcome unconfirmed"}
        </Typography>)}
      </Box> : null}
      <Alert severity="warning">
        Deletion is permanent in TraderLink&apos;s active system. It cannot be restored through TraderLink after confirmation.
      </Alert>

      {activeAccount ? (
        <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 2 }}>
          <Stack spacing={1.25}>
            <Box>
              <Typography sx={{ fontWeight: 800 }}>Delete this Trade Tracker account</Typography>
              <Typography color="text.secondary" variant="body2">
                Remove {activeAccount.displayName} and everything kept inside it, including imports, executions, notes, rules, reviews and analytics. Your other Trade Tracker accounts and Platform Partner data stay intact.
              </Typography>
            </Box>
            <Button color="error" disabled={!request.ready || working || Boolean(shownStatus?.currentPending)} onClick={() => openDialog("trade_tracker_account")} size="small" sx={{ alignSelf: "flex-start" }} variant="outlined">
              Delete Trade Tracker account
            </Button>
          </Stack>
        </Box>
      ) : (
        <Alert severity="info">
          You do not currently have a Trade Tracker account. You can create one again from General.
        </Alert>
      )}

      <Box sx={{ border: 1, borderColor: "error.light", borderRadius: 1.5, p: 2 }}>
        <Stack spacing={1.25}>
          <Box>
            <Typography sx={{ fontWeight: 800 }}>Delete TraderLink account</Typography>
            <Typography color="text.secondary" variant="body2">
              This removes your sign-in access, personal workspace and all {journalAccountCount} of your Trade Tracker accounts. Shared community records and other people’s work follow their own protections. Provider billing and financial obligations are separate; deletion does not cancel a subscription, refund a purchase or settle a payout.
            </Typography>
          </Box>
          <Button color="error" disabled={!request.ready || working || Boolean(shownStatus?.currentPending)} onClick={() => openDialog("traderlink_account")} size="small" sx={{ alignSelf: "flex-start" }} variant="outlined">
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
                ? "This is permanent. Your personal workspace and every Trade Tracker account will be deleted, and you will be signed out. Shared records and provider billing are handled separately."
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
            disabled={working || !confirmationMatches || !request.ready || Boolean(shownStatus?.currentPending)}
            onClick={() => void erase()}
            sx={{ width: { xs: "100%", sm: "auto" } }}
            variant="contained"
          >
            {working ? "Deleting..." : dialog === "traderlink_account" ? "Delete account" : "Delete Trade Tracker account"}
          </Button>
        </DialogActions>
      </Dialog>
      <Typography color="text.secondary" variant="caption">
        For 30 days after a deletion request is accepted, the owner can review restricted support history containing your display name, request type, times and outcome. It contains no trades or private files and cannot restore an account. Expired records are hidden and removed by automated retention cleanup.
      </Typography>
      <Typography color="text.secondary" variant="caption">
        Protected disaster-recovery copies follow TraderLink&apos;s retention procedure and are not available to restore a deleted account.
      </Typography>
    </Stack>
  );
}
