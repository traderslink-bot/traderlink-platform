"use client";

import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useCallback, useEffect, useState } from "react";

import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";

type AuthorizedAccountOption = Readonly<{
  selectionRef: string;
  label: string;
  accountType: "cash" | "margin" | "unknown";
  authorizedMarketCount: number;
}>;

type SafeImportJob = Readonly<{
  state: "queued" | "running" | "waiting_retry" | "completed" | "failed" | "cancelled";
  requestedStartDate: string;
  cutoffAtUtc: string;
  completedWorkUnits: number;
  totalWorkUnits: number;
  receivedFillCount: number;
  acceptedExecutionCount: number;
  existingExecutionCount: number;
  decisionRequiredCount: number;
  nextAttemptAtUtc: string | null;
}>;

type SafeLinkedAccount = Readonly<{
  linkRef: string;
  label: string;
  accountType: "cash" | "margin" | "unknown";
  authorizedMarketCount: number;
  latestImport: SafeImportJob | null;
}>;

type SafeFailurePacket = Readonly<{
  message?: string;
  reportedToAdmin?: boolean;
}>;

function accountDescription(account: SafeLinkedAccount): string {
  const type = account.accountType === "unknown" ? "trading" : account.accountType;
  const markets = account.authorizedMarketCount === 1
    ? "1 authorized market"
    : `${account.authorizedMarketCount} authorized markets`;
  return `${type} account, ${markets}`;
}

function importActive(job: SafeImportJob | null): boolean {
  return Boolean(job && ["queued", "running", "waiting_retry"].includes(job.state));
}

function importTitle(job: SafeImportJob): string {
  if (job.state === "completed") return "Import complete";
  if (job.state === "failed") return "Import needs attention";
  if (job.state === "waiting_retry") return "Import will retry automatically";
  if (job.state === "cancelled") return "Import stopped";
  return "Import in progress";
}

export function MoomooExecutionImportSetup({
  activeAccountName,
  activeAccountSelectionRef,
  executionReadAuthorized,
  initialLinkedAccounts,
}: {
  activeAccountName: string;
  activeAccountSelectionRef: string;
  executionReadAuthorized: boolean;
  initialLinkedAccounts: readonly SafeLinkedAccount[];
}) {
  const [availableAccounts, setAvailableAccounts] = useState<readonly AuthorizedAccountOption[]>([]);
  const [linkedAccounts, setLinkedAccounts] = useState<readonly SafeLinkedAccount[]>(initialLinkedAccounts);
  const [selectedRef, setSelectedRef] = useState("");
  const [loading, setLoading] = useState(false);
  const [eligibilityChecked, setEligibilityChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [earliestDates, setEarliestDates] = useState<Readonly<Record<string, string>>>({});
  const anyImportActive = linkedAccounts.some((account) => importActive(account.latestImport));

  const showFailure = (packet: SafeFailurePacket, fallback: string) => {
    const message = packet.message || fallback;
    setError(packet.reportedToAdmin
      ? `${message} The details were automatically sent to TradersLink administration, and we are working on it.`
      : message);
  };

  const refreshImportStatus = useCallback(async (): Promise<void> => {
    try {
      const response = await fetch("/api/connections/moomoo/imports", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const packet = await response.json() as SafeFailurePacket & {
        accounts?: readonly SafeLinkedAccount[];
      };
      if (!response.ok || !packet.accounts) {
        showFailure(packet, "Import progress could not be loaded. Try again.");
        return;
      }
      setLinkedAccounts(packet.accounts);
    } catch {
      setError("Import progress could not be loaded. Try again.");
    }
  }, []);

  useEffect(() => {
    if (!anyImportActive) return;
    const timer = window.setInterval(() => void refreshImportStatus(), 5_000);
    return () => window.clearInterval(timer);
  }, [anyImportActive, refreshImportStatus]);

  async function loadAccounts(): Promise<void> {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/connections/moomoo/trading-accounts", {
        cache: "no-store",
        credentials: "same-origin",
      });
      const packet = await response.json() as SafeFailurePacket & {
        accounts?: readonly AuthorizedAccountOption[];
      };
      if (!response.ok || !packet.accounts) {
        showFailure(packet, "Moomoo trading accounts could not be loaded. Try again.");
        return;
      }
      setAvailableAccounts(packet.accounts);
      setEligibilityChecked(true);
      setSelectedRef(packet.accounts.length === 1 ? packet.accounts[0]?.selectionRef ?? "" : "");
    } catch {
      setError("Moomoo trading accounts could not be loaded. Try again.");
    } finally {
      setLoading(false);
    }
  }

  async function linkAccount(): Promise<void> {
    if (!selectedRef || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/connections/moomoo/trading-accounts", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          [JOURNAL_MUTATION_REQUEST_HEADER]: "1",
        },
        body: JSON.stringify({
          expectedAccountSelectionRef: activeAccountSelectionRef,
          selectionRef: selectedRef,
        }),
      });
      const packet = await response.json() as SafeFailurePacket & {
        account?: Omit<SafeLinkedAccount, "latestImport">;
      };
      if (!response.ok || !packet.account) {
        showFailure(packet, "The Moomoo account could not be linked. Confirm the account and try again.");
        return;
      }
      const linkedAccount: SafeLinkedAccount = Object.freeze({
        ...packet.account,
        latestImport: null,
      });
      setLinkedAccounts((current) => [
        ...current.filter((account) => account.linkRef !== linkedAccount.linkRef),
        linkedAccount,
      ]);
      setAvailableAccounts([]);
      setSelectedRef("");
    } catch {
      setError("The Moomoo account could not be linked. Confirm the account and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function startImport(account: SafeLinkedAccount): Promise<void> {
    const earliestExecutionDate = earliestDates[account.linkRef] ?? "";
    if (!earliestExecutionDate || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/connections/moomoo/imports", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "content-type": "application/json",
          [JOURNAL_MUTATION_REQUEST_HEADER]: "1",
        },
        body: JSON.stringify({
          expectedAccountSelectionRef: activeAccountSelectionRef,
          linkRef: account.linkRef,
          earliestExecutionDate,
        }),
      });
      const packet = await response.json() as SafeFailurePacket & { job?: SafeImportJob };
      if (!response.ok || !packet.job) {
        showFailure(packet, "The import could not be started. Try again.");
        return;
      }
      setLinkedAccounts((current) => current.map((candidate) =>
        candidate.linkRef === account.linkRef
          ? Object.freeze({ ...candidate, latestImport: packet.job as SafeImportJob })
          : candidate));
    } catch {
      setError("The import could not be started. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (!executionReadAuthorized) {
    return (
      <Stack spacing={1.5} sx={{ mt: 2 }}>
        <Alert severity="success">
          <Typography sx={{ fontWeight: 800 }} variant="body2">Chart features available</Typography>
          <Typography variant="body2">
            This free Moomoo connection provides the market data used for chart replay and trade analysis on eligible trading dates.
          </Typography>
        </Alert>
        <Alert severity="info">
          <Stack spacing={1.25}>
            <Typography sx={{ fontWeight: 800 }} variant="body2">Execution imports not enabled</Typography>
            <Typography variant="body2">
              Automatic imports require an eligible Moomoo trading account. Authorize read-only access and TradersLink will check your account for you. Do not grant permission to place or change orders.
            </Typography>
            <Button component="a" href="/api/connections/moomoo/start?purpose=execution-import" size="small" sx={{ alignSelf: "flex-start" }} variant="contained">
              Authorize trade imports
            </Button>
          </Stack>
        </Alert>
        <Typography color="text.secondary" variant="caption">
          If Moomoo cannot provide execution access for this account, you can still import trades using broker statements.
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ mt: 2 }}>
      <Alert severity="success">
        <Typography sx={{ fontWeight: 800 }} variant="body2">Chart features available</Typography>
        <Typography variant="body2">
          Moomoo provides the market data used for chart replay and trade analysis on eligible trading dates.
        </Typography>
      </Alert>

      {linkedAccounts.map((account) => (
        <Stack key={account.linkRef} spacing={1} sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, p: 1.5 }}>
          <Typography sx={{ fontWeight: 800 }} variant="body2">{account.label}</Typography>
          <Typography color="text.secondary" variant="caption">
            Linked to {activeAccountName} · {accountDescription(account)}
          </Typography>
          {account.latestImport ? (
            <Stack spacing={0.75}>
              <Typography sx={{ fontWeight: 750 }} variant="body2">{importTitle(account.latestImport)}</Typography>
              <LinearProgress
                value={account.latestImport.totalWorkUnits > 0
                  ? account.latestImport.completedWorkUnits / account.latestImport.totalWorkUnits * 100
                  : 0}
                variant="determinate"
              />
              <Typography color="text.secondary" variant="caption">
                {account.latestImport.completedWorkUnits} of {account.latestImport.totalWorkUnits} date ranges complete · {account.latestImport.acceptedExecutionCount} new executions · {account.latestImport.existingExecutionCount} already in your Journal
              </Typography>
              {account.latestImport.decisionRequiredCount > 0 ? (
                <Typography color="warning.main" variant="caption">
                  {account.latestImport.decisionRequiredCount} possible duplicate or conflicting execution{account.latestImport.decisionRequiredCount === 1 ? "" : "s"} will need a Data Decision.
                </Typography>
              ) : null}
              {account.latestImport.state === "failed" ? (
                <Typography color="error.main" variant="caption">
                  The import could not finish. The details were automatically sent to TradersLink administration, and we are working on it. You can leave this page and try again later.
                </Typography>
              ) : null}
            </Stack>
          ) : null}
          {!account.latestImport || ["completed", "failed", "cancelled"].includes(account.latestImport.state) ? (
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ alignItems: { sm: "center" } }}>
              <TextField
                label="Date of first execution"
                onChange={(event) => setEarliestDates((current) => ({
                  ...current,
                  [account.linkRef]: event.target.value,
                }))}
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                type="date"
                value={earliestDates[account.linkRef] ?? ""}
              />
              <Button disabled={loading || !(earliestDates[account.linkRef] ?? "")} onClick={() => void startImport(account)} size="small" variant="contained">
                {account.latestImport ? "Import more history" : "Start execution import"}
              </Button>
            </Stack>
          ) : null}
          <Typography color="text.secondary" variant="caption">
            Enter the date of the first execution in this trading account. Moomoo limits each history request to 90 days, so TradersLink works backward in saved date ranges and you can leave this page while it runs.
          </Typography>
        </Stack>
      ))}

      {eligibilityChecked && availableAccounts.length === 0 && linkedAccounts.length === 0 ? (
        <Alert severity="info">
          <Typography sx={{ fontWeight: 800 }} variant="body2">Execution imports unavailable</Typography>
          <Typography variant="body2">
            This Moomoo account is not currently eligible for automatic execution imports. Chart features remain available, and you can import executions using broker statements.
          </Typography>
        </Alert>
      ) : null}

      {availableAccounts.length > 0 ? (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} sx={{ alignItems: { sm: "center" } }}>
          <TextField label="Moomoo trading account" onChange={(event) => setSelectedRef(event.target.value)} select size="small" sx={{ minWidth: { sm: 280 } }} value={selectedRef}>
            {availableAccounts.map((account) => (
              <MenuItem key={account.selectionRef} value={account.selectionRef}>{account.label}</MenuItem>
            ))}
          </TextField>
          <Button disabled={!selectedRef || loading} onClick={() => void linkAccount()} variant="contained">
            {loading ? "Linking..." : `Link to ${activeAccountName}`}
          </Button>
        </Stack>
      ) : !eligibilityChecked || linkedAccounts.length > 0 ? (
        <Button disabled={loading} onClick={() => void loadAccounts()} size="small" sx={{ alignSelf: "flex-start" }} variant="outlined">
          {loading ? "Loading accounts..." : linkedAccounts.length > 0 ? "Link another Moomoo account" : "Choose Moomoo account"}
        </Button>
      ) : null}

      <Typography color="text.secondary" variant="caption">
        Historical executions can be added to your Journal without creating old Daily Trade Tracker review work. Trade analysis begins with trading dates covered by an active paid analyzer plan. Statement imports remain available whether or not Moomoo execution access is available.
      </Typography>
      {error ? (
        <Alert severity="error">
          {error}
        </Alert>
      ) : null}
    </Stack>
  );
}
