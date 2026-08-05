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
import Typography from "@mui/material/Typography";
import { useState } from "react";

import type { JournalAdminSensitiveAccessReason, JournalAdminUserDetail } from "@/src/modules/journal/contracts/journal-administration-contracts";
import { JOURNAL_ADMIN_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-admin-request";
import { formatAdminInteger } from "../journal-admin-ui";

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
                  {detail.user.authenticationProviders.join(", ") || "No authentication provider"} · {formatAdminInteger(detail.activeSessionCount)} active sessions
                </Typography>
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
