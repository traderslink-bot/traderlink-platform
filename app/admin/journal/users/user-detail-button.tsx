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
import { useState } from "react";

import type { JournalAdminSensitiveAccessReason, JournalAdminUserDetail } from "@/src/modules/journal/contracts/journal-administration-contracts";
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
      setError("User details are unavailable right now. The access attempt was recorded.");
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
      setControlMessage(controlAction === "sign_out_all" ? "All active dashboard sessions were signed out." : controlAction === "disable" ? "The account is disabled and active sessions were signed out." : "The account is enabled. The user will sign in with Discord again.");
      setControlAction(null);
      setControlConfirmation("");
      setDetail(null);
    } catch {
      setError("This account action could not be completed. No Journal data was changed.");
    } finally { setLoading(false); }
  };

  const confirmationText = controlAction === "disable" ? "DISABLE USER" : controlAction === "enable" ? "ENABLE USER" : "SIGN OUT ALL DEVICES";

  return (
    <>
      <Button onClick={() => setOpen(true)} size="small" variant="outlined">
        Review details
      </Button>
      <Dialog fullWidth maxWidth="md" onClose={() => setOpen(false)} open={open}>
        <DialogTitle>User details</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2 }} variant="body2">
            This private view is recorded in the audit history. It never shows login identifiers, broker account identifiers, trades or note text.
          </Typography>
          {detail ? (
            <Stack spacing={2}>
              <Box>
                <Typography component="h3" sx={{ fontWeight: 800 }}>{detail.user.displayName}</Typography>
                <Typography color="text.secondary" variant="body2">
                  {detail.user.status === "active" ? "Enabled" : "Disabled"} · {detail.user.onlineNow ? "Online now" : detail.user.lastSuccessfulAuthenticationAtUtc ? `Last sign-in ${formatAdminUtc(detail.user.lastSuccessfulAuthenticationAtUtc)}` : "Never signed in"} · {formatAdminInteger(detail.activeSessionCount)} active sessions
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {detail.user.journalStarted ? "Journal started" : "Journal not started"} · {detail.user.academyCompletionCount > 0 ? `${formatAdminInteger(detail.user.academyCompletionCount)} Academy lessons completed` : "Academy source not recorded"}
                </Typography>
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
                {controlMessage ? <Alert severity="success" sx={{ mt: 1.5 }}>{controlMessage}</Alert> : null}
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
              {error ? <Alert severity="error">{error}</Alert> : null}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Close</Button>
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
