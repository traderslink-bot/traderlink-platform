"use client";

import FormControl from "@mui/material/FormControl";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Tooltip from "@mui/material/Tooltip";
import { useState } from "react";

export type DashboardJournalAccountOption = Readonly<{
  selectionRef: string;
  displayName: string;
  baseCurrency: string;
  tradingTimezone: string;
  active: boolean;
}>;

export function DashboardAccountSwitcher({
  accounts,
}: {
  accounts: readonly DashboardJournalAccountOption[];
}) {
  const active = accounts.find((account) => account.active) ?? null;
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!active) return null;
  const activeSelectionRef = active.selectionRef;

  async function select(accountSelectionRef: string) {
    if (working || accountSelectionRef === activeSelectionRef) return;
    setWorking(true);
    setError(null);
    try {
      const response = await fetch("/api/platform/account-selection", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          accountSelectionRef,
          expectedAccountSelectionRef: activeSelectionRef,
        }),
      });
      const packet = await response.json() as { code?: string };
      if (!response.ok) {
        throw new Error(packet.code ?? "The trading account could not be selected.");
      }
      window.location.reload();
    } catch {
      setError("The account changed in another tab. Refresh and choose it again.");
      setWorking(false);
    }
  }

  return (
    <Tooltip arrow title={error ?? "Choose the trading account shown across this dashboard"}>
      <FormControl error={Boolean(error)} size="small" sx={{ minWidth: { xs: 130, md: 190 } }}>
        <Select
          aria-label="Active Journal account"
          disabled={working}
          onChange={(event) => void select(event.target.value)}
          value={activeSelectionRef}
        >
          {accounts.map((account) => (
            <MenuItem key={account.selectionRef} value={account.selectionRef}>
              {account.displayName}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Tooltip>
  );
}
