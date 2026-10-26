"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import type { JournalAdminErasureHistory, JournalAdminErasureHistoryItem, JournalAdminSensitiveAccessReason, JournalAdminUserDetail } from "@/src/modules/journal/contracts/journal-administration-contracts";
import { JOURNAL_ADMIN_IDEMPOTENCY_HEADER, JOURNAL_ADMIN_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-admin-request";
import { formatAdminInteger } from "../journal-admin-ui";
import { formatAdminUtc } from "../journal-admin-ui";

const reasons: readonly Readonly<{
  value: JournalAdminSensitiveAccessReason;
  label: string;
}>[] = [
  { value: "owner_support_review", label: "Owner support review" },
  { value: "data_integrity_review", label: "Data integrity review" },
  { value: "importer_diagnostics", label: "Importer diagnostics" },
  { value: "security_review", label: "Security review" },
];

export function UserDetailButton({ userRef }: { userRef: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<JournalAdminSensitiveAccessReason>(
    "owner_support_review",
  );
  const [detail, setDetail] = useState<JournalAdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [controlAction, setControlAction] = useState<"disable" | "enable" | "sign_out_all" | null>(null);
  const [controlConfirmation, setControlConfirmation] = useState("");
  const [controlMessage, setControlMessage] = useState<string | null>(null);
  const refreshAfterClose = useRef(false);

  function closeDetails() {
    if (loading) return;
    setOpen(false);
    setDetail(null);
    setControlAction(null);
    setControlConfirmation("");
    setControlMessage(null);
    setError(null);
    if (refreshAfterClose.current) {
      refreshAfterClose.current = false;
      router.refresh();
    }
  }

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/admin/journal/users/${encodeURIComponent(userRef)}/detail-access`,
        {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
          headers: {
            "content-type": "application/json",
            [JOURNAL_ADMIN_REQUEST_HEADER]: "1",
          },
          body: JSON.stringify({ reasonCode: reason }),
        },
      );
      const body: unknown = await response.json();
      if (!response.ok || !body || typeof body !== "object" ||
        !("user" in body)) {
        throw new Error("User details could not be opened.");
      }
      setDetail((body as { user: JournalAdminUserDetail }).user);
    } catch {
      setError("User details are unavailable right now. We could not confirm whether the access attempt was recorded.");
    } finally {
      setLoading(false);
    }
  };

  const runControl = async () => {
    if (!controlAction) return;
    setLoading(true);
    setError(null);
    setControlMessage(null);
    try {
      const response = await fetch(
        `/api/admin/journal/users/${encodeURIComponent(userRef)}/account-control`,
        {
          method: "POST", cache: "no-store", credentials: "same-origin",
          headers: {
            "content-type": "application/json",
            [JOURNAL_ADMIN_REQUEST_HEADER]: "1",
            [JOURNAL_ADMIN_IDEMPOTENCY_HEADER]: crypto.randomUUID(),
          },
          body: JSON.stringify({ action: controlAction, confirmation: controlConfirmation, reasonCode: reason }),
        },
      );
      if (!response.ok) throw new Error("Account control failed");
      setControlMessage(controlAction === "sign_out_all" ? "All active dashboard sessions were signed out." : controlAction === "disable" ? "The account is disabled and active sessions were signed out." : "The account is enabled. The member can sign in with a connected login method.");
      setControlAction(null);
      setControlConfirmation("");
      setDetail(null);
      // Opaque user refs change on a server refresh, remounting this dialog.
      // Keep the receipt visible; refresh the directory when the owner closes it.
      refreshAfterClose.current = true;
    } catch {
      setError("We could not confirm the account action's outcome. Reopen the details to check the current account state. These controls do not delete Journal data.");
    } finally { setLoading(false); }
  };

  const confirmationText = controlAction === "disable" ? "DISABLE USER" : controlAction === "enable" ? "ENABLE USER" : "SIGN OUT ALL DEVICES";

  return (
    <>
      <Button onClick={() => setOpen(true)} size="small" variant="outlined">
        Review details
      </Button>
      <Dialog fullWidth maxWidth="md" onClose={closeDetails} open={open}>
        <DialogTitle>User details</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
            This private view is recorded in the audit history. It never shows login identifiers, broker account identifiers, trades or note text.
          </Typography>
          {error ? <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert> : null}
          {controlMessage ? <Alert severity="success" sx={{ mb: 1.5 }}>{controlMessage}</Alert> : null}
          {detail ? (
            <Stack spacing={2}>
              <Box>
                <Typography component="h3" sx={{ fontWeight: 800 }}>{detail.user.displayName}</Typography>
                <Typography color="text.secondary" variant="body2">
                  {detail.user.status === "active" ? "Enabled" : "Disabled"} · {formatAdminInteger(detail.activeSessionCount)} active sessions
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {detail.user.journalStarted ? "Journal started" : "Journal not started"} · {formatAdminInteger(detail.user.academyCompletionCount)} Academy lessons completed
                </Typography>
              </Box>
              <Box>
                <Typography component="h3" sx={{ fontWeight: 800 }}>Recorded activity</Typography>
                <Box component="dl" sx={{ m: 0, "& dt": { fontWeight: 700, mt: 1 }, "& dd": { m: 0 } }}>
                  <dt>Last authentication</dt><dd>{detail.user.lastRecordedAuthenticationAtUtc ? formatAdminUtc(detail.user.lastRecordedAuthenticationAtUtc) : "No authentication recorded"}</dd>
                  <dt>Last session activity</dt><dd>{detail.user.lastSessionAtUtc ? formatAdminUtc(detail.user.lastSessionAtUtc) : "No session activity recorded"}</dd>
                  <dt>First recorded session</dt><dd>{detail.user.firstSuccessfulAuthenticationAtUtc ? formatAdminUtc(detail.user.firstSuccessfulAuthenticationAtUtc) : "No session recorded"}</dd>
                  <dt>Recorded sessions</dt><dd>{formatAdminInteger(detail.sessionCount)}</dd>
                  <dt>Last recorded Watchlist visit</dt><dd>{detail.user.lastRecordedWatchlistVisitAtUtc === undefined ? "Visit records unavailable" : detail.user.lastRecordedWatchlistVisitAtUtc === null ? "No visit recorded" : formatAdminUtc(detail.user.lastRecordedWatchlistVisitAtUtc)}</dd>
                  <dt>Latest Academy completion</dt><dd>{detail.user.latestAcademyCompletionAtUtc ? formatAdminUtc(detail.user.latestAcademyCompletionAtUtc) : "No completion recorded"}</dd>
                </Box>
                <Typography variant="caption" color="text.secondary">Dates are UTC. Authentication and session activity do not prove a Watchlist visit. Tracking can miss visits and excludes owner accounts.</Typography>
              </Box>
              <Box>
                <Typography component="h3" sx={{ fontWeight: 800 }}>Deletion outcomes</Typography>
                <Typography variant="body2" color="text.secondary">Use View 30-day deletion history on the Members page for recorded requests and outcomes, including deleted members. A timeout or a missing record does not confirm completion.</Typography>
              </Box>
              <Box>
                <Typography component="h3" sx={{ fontWeight: 800 }}>Account controls</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">These controls never edit Journal facts, Data Decisions, broker details or Academy progress.</Typography>
                {!controlAction ? (
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 1.5 }}>
                    {detail.user.status === "active" ? <Button color="error" onClick={() => setControlAction("disable")} variant="outlined">Disable user</Button> : <Button onClick={() => setControlAction("enable")} variant="outlined">Enable user</Button>}
                    <Button onClick={() => setControlAction("sign_out_all")} variant="outlined">Sign out all devices</Button>
                  </Stack>
                ) : (
                  <Stack spacing={1.25} sx={{ mt: 1.5 }}>
                    <Typography variant="body2">Type <strong>{confirmationText}</strong> to continue.</Typography>
                    <TextField label="Confirmation" onChange={(event) => setControlConfirmation(event.target.value)} size="small" value={controlConfirmation} />
                    <Stack direction="row" spacing={1}>
                      <Button onClick={() => { setControlAction(null); setControlConfirmation(""); }} variant="outlined">Cancel</Button>
                      <Button color={controlAction === "disable" ? "error" : "primary"} disabled={loading || controlConfirmation !== confirmationText} onClick={runControl} variant="contained">Confirm</Button>
                    </Stack>
                  </Stack>
                )}
              </Box>
              <Box>
                <Typography component="h3" sx={{ fontWeight: 800 }}>Recent imports</Typography>
                {detail.recentImportAttempts.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">No tracked import attempts yet.</Typography>
                ) : (
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {detail.recentImportAttempts.map((attempt) => (
                      <Box key={`${attempt.occurredAtUtc}-${attempt.outcome}`} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 1.5 }}>
                        <Typography sx={{ fontWeight: 700 }} variant="body2">{attempt.brokerLabel ?? "Broker statement"} · {attempt.outcome.replaceAll("_", " ")}</Typography>
                        <Typography color="text.secondary" variant="caption">{formatAdminUtc(attempt.occurredAtUtc)}</Typography>
                        <Typography sx={{ mt: 0.5 }} variant="body2">{attempt.reason}</Typography>
                        <Typography color="text.secondary" variant="body2">{attempt.nextStep}</Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
              <Box>
                <Typography component="h3" sx={{ fontWeight: 800 }}>Manual entry issues</Typography>
                {detail.recentManualEntryFailures.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">No recorded manual-entry save issues.</Typography>
                ) : (
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {detail.recentManualEntryFailures.map((failure) => (
                      <Box key={`${failure.occurredAtUtc}-${failure.reason}`} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 1.5 }}>
                        <Typography sx={{ fontWeight: 700 }} variant="body2">Manual entry needs attention</Typography>
                        <Typography color="text.secondary" variant="caption">{formatAdminUtc(failure.occurredAtUtc)}</Typography>
                        <Typography sx={{ mt: 0.5 }} variant="body2">{failure.reason}</Typography>
                        <Typography color="text.secondary" variant="body2">{failure.nextStep}</Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
              <Box>
                <Typography component="h3" sx={{ fontWeight: 800 }}>Broker connection</Typography>
                <Typography color="text.secondary" sx={{ mt: 0.5 }} variant="body2">
                  {detail.user.brokerStatus === "connected" ? "Connected" : detail.user.brokerStatus === "attention_required" ? "Connection needs attention" : detail.user.brokerStatus === "disconnected" ? "Disconnected" : detail.user.brokerStatus === "statement_source" ? "Statement source only" : "No broker evidence"}
                  {detail.user.latestBrokerConnectionAttemptAtUtc ? ` · last attempt ${formatAdminUtc(detail.user.latestBrokerConnectionAttemptAtUtc)}` : ""}
                </Typography>
                {detail.recentBrokerConnectionAttempts.length === 0 ? (
                  <Typography color="text.secondary" sx={{ mt: 1 }} variant="body2">No provider-backed connection attempts are recorded.</Typography>
                ) : (
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    {detail.recentBrokerConnectionAttempts.map((attempt) => (
                      <Box key={`${attempt.occurredAtUtc}-${attempt.outcome}`} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 1.5 }}>
                        <Typography sx={{ fontWeight: 700 }} variant="body2">{attempt.outcome === "connected" ? "Connected" : attempt.outcome === "failed" ? "Connection failed" : "Connection cancelled"}</Typography>
                        <Typography color="text.secondary" variant="caption">{formatAdminUtc(attempt.occurredAtUtc)}</Typography>
                        <Typography sx={{ mt: 0.5 }} variant="body2">{attempt.reason}</Typography>
                        {attempt.nextStep ? <Typography color="text.secondary" variant="body2">{attempt.nextStep}</Typography> : null}
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>
              <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" } }}>
                {detail.accounts.map((account) => (
                  <Box key={account.accountRef} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 2 }}>
                    <Typography sx={{ fontWeight: 800 }}>{account.displayName}</Typography>
                    <Typography color="text.secondary" variant="caption">
                      {account.baseCurrency} · {account.tradingTimezone} · {account.status}
                    </Typography>
                    <Typography sx={{ mt: 1 }} variant="body2">
                      {formatAdminInteger(account.committedImportCount)} imports · {formatAdminInteger(account.manualExecutionCount)} manual executions · {formatAdminInteger(account.unresolvedDecisionCount)} unresolved decisions
                    </Typography>
                    <Typography color="text.secondary" variant="body2">
                      {formatAdminInteger(account.analyticsReadyRoundTripCount)} analytics-ready trades · {formatAdminInteger(account.ruleCount)} rules · {formatAdminInteger(account.tagCount)} tags
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Stack>
          ) : (
            <Stack spacing={2}>
              <FormControl fullWidth size="small">
                <InputLabel id={`user-detail-reason-${userRef}`}>Reason for access</InputLabel>
                <Select
                  label="Reason for access"
                  labelId={`user-detail-reason-${userRef}`}
                  onChange={(event) => setReason(event.target.value as JournalAdminSensitiveAccessReason)}
                  value={reason}
                >
                  {reasons.map((item) => (
                    <MenuItem key={item.value} value={item.value}>{item.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDetails} disabled={loading}>Close</Button>
          {!detail ? (
            <Button disabled={loading} onClick={load} variant="contained">
              {loading ? "Opening…" : "Open audited details"}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </>
  );
}

const actions: Record<JournalAdminErasureHistoryItem["action"], string> = {
  traderlink_account: "TraderLink account",
  trade_tracker_account: "Regular Journal",
  demo_trade_tracker_account: "Demo Journal",
};
const outcomes: Record<JournalAdminErasureHistoryItem["outcome"], string> = {
  attempted: "Attempt recorded — outcome not yet confirmed",
  committed: "Deletion committed — private-file cleanup pending",
  completed: "Deletion and required cleanup completed",
  failed: "Deletion failed before commit",
  unknown: "Outcome unknown — review required",
};

export function DeletionHistoryButton() {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<JournalAdminSensitiveAccessReason>("owner_support_review");
  const [history, setHistory] = useState<JournalAdminErasureHistory | null>(null);
  const [cursors, setCursors] = useState<readonly (string | null)[]>([null]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);

  async function load(pages: readonly (string | null)[]) {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    setError(null);
    // Never leave an earlier page of private history visible after a failed refresh.
    setHistory(null);
    try {
      const response = await fetch("/api/admin/journal/users", {
        method: "POST",
        cache: "no-store",
        credentials: "same-origin",
        headers: { "content-type": "application/json", [JOURNAL_ADMIN_REQUEST_HEADER]: "1" },
        body: JSON.stringify({ action: "deletion_history", reasonCode: reason, cursor: pages.at(-1) ?? null }),
      });
      const body = await response.json() as { history?: JournalAdminErasureHistory };
      if (!response.ok || !body?.history || !Array.isArray(body.history.items) ||
        !["ready", "unavailable"].includes(body.history.status)) throw new Error("history_unavailable");
      setHistory(body.history);
      setCursors(pages);
    } catch {
      setError("Deletion history could not be opened. No deletion outcome can be inferred from this error.");
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }

  function close() {
    if (inFlight.current) return;
    setOpen(false);
    setHistory(null);
    setError(null);
    setCursors([null]);
  }

  return <>
    <Button variant="outlined" onClick={() => { setHistory(null); setError(null); setCursors([null]); setOpen(true); }}>View 30-day deletion history</Button>
    <Dialog open={open} onClose={close} fullWidth maxWidth="md">
      <DialogTitle>30-day deletion history</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>Member-linked records expire 30 days after the request was admitted. Opening each page is audited. Records cover authenticated, confirmed requests that passed scope checks, starting when tracking is enabled. Earlier incidents and requests rejected before admission are not reconstructed.</Typography>
        {!history ? <FormControl fullWidth size="small" sx={{ mb: 2 }} disabled={loading}>
          <InputLabel id="deletion-history-reason">Reason for access</InputLabel>
          <Select labelId="deletion-history-reason" label="Reason for access" value={reason} onChange={(event) => setReason(event.target.value as JournalAdminSensitiveAccessReason)}>
            <MenuItem value="owner_support_review">Owner support review</MenuItem>
            <MenuItem value="data_integrity_review">Data integrity review</MenuItem>
            <MenuItem value="importer_diagnostics">Importer diagnostics</MenuItem>
            <MenuItem value="security_review">Security review</MenuItem>
          </Select>
        </FormControl> : null}
        {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
        {loading ? <Typography role="status">Opening audited history…</Typography> : null}
        {history?.status === "unavailable" ? <Alert severity="info">Deletion history is not available in this environment. This does not mean there were no attempts or deletions.</Alert> : null}
        {history?.status === "ready" ? <>
          {history.items.length === 0 ? <Typography>No retained deletion records in this selection.</Typography> : <Stack spacing={1.5}>
            {history.items.map((item) => <Box key={item.receiptRef} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.5, overflowWrap: "anywhere" }}>
              <Typography sx={{ fontWeight: 700 }}>{item.memberDisplayName} · {actions[item.action]}</Typography>
              <Typography>{outcomes[item.outcome]}</Typography>
              <Box component="dl" sx={{ m: 0, "& dt": { fontWeight: 700, mt: 1 }, "& dd": { m: 0 } }}>
                <dt>Attempt recorded</dt><dd>{formatAdminUtc(item.attemptedAtUtc)}</dd>
                {item.committedAtUtc ? <><dt>Deletion committed</dt><dd>{formatAdminUtc(item.committedAtUtc)}</dd></> : null}
                {item.completedAtUtc ? <><dt>Cleanup completed</dt><dd>{formatAdminUtc(item.completedAtUtc)}</dd></> : null}
                <dt>Last recorded update</dt><dd>{formatAdminUtc(item.updatedAtUtc)}</dd>
                <dt>History expires</dt><dd>{formatAdminUtc(item.expiresAtUtc)}</dd>
              </Box>
            </Box>)}
          </Stack>}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>Read at {formatAdminUtc(history.dataAsOfUtc)} · Dates are UTC. Cleanup preserves files still referenced by surviving accounts. A timeout alone cannot establish an outcome.</Typography>
        </> : null}
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
        <Button onClick={close} disabled={loading}>Close</Button>
        {!history && !loading ? <Button variant="contained" onClick={() => { void load([null]); }}>Open audited history</Button> : null}
        {history?.status === "ready" ? <>
          <Button variant="outlined" disabled={loading || cursors.length <= 1} onClick={() => { void load(cursors.slice(0, -1)); }}>Previous</Button>
          <Button variant="outlined" disabled={loading || !history.nextCursor} onClick={() => { if (history.nextCursor) void load([...cursors, history.nextCursor]); }}>Next</Button>
        </> : null}
      </DialogActions>
    </Dialog>
  </>;
}
