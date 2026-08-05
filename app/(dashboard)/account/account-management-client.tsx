"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { JOURNAL_MUTATION_REQUEST_HEADER } from "@/src/modules/platform/contracts/journal-request-security";

export function AccountManagementClient({
  activeAccountSelectionRef,
  defaultTradingTimezone,
}: {
  activeAccountSelectionRef: string;
  defaultTradingTimezone: string;
}) {
  const [displayName, setDisplayName] = useState("");
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [tradingTimezone, setTradingTimezone] = useState(defaultTradingTimezone);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function createAccount() {
    if (!displayName.trim() || working) return;
    setWorking(true);
    setError(null);
    try {
      const response = await fetch("/api/platform/journal/accounts", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          [JOURNAL_MUTATION_REQUEST_HEADER]: "1",
        },
        body: JSON.stringify({
          displayName: displayName.trim(),
          baseCurrency: baseCurrency.trim().toUpperCase(),
          tradingTimezone: tradingTimezone.trim(),
          expectedAccountSelectionRef: activeAccountSelectionRef,
        }),
      });
      const packet = await response.json() as { code?: string };
      if (!response.ok) {
        throw new Error(packet.code ?? "The trading account could not be created.");
      }
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error
        ? cause.message
        : "The trading account could not be created.");
      setWorking(false);
    }
  }

  return (
    <Stack spacing={2}>
      <Typography color="text.secondary" variant="body2">
        Create a Journal account for any grouping you choose, such as long-term holds, forex, or small-cap day trading. One Journal account may contain statements from multiple brokers or brokerage accounts. Its executions, decisions, notes, rules and analytics stay separate from your other Journal accounts. The new account becomes active after creation.
      </Typography>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "2fr 1fr 2fr auto" } }}>
        <TextField label="Journal account name" onChange={(event) => setDisplayName(event.target.value)} value={displayName} />
        <TextField label="Base currency" onChange={(event) => setBaseCurrency(event.target.value.toUpperCase())} slotProps={{ htmlInput: { maxLength: 3 } }} value={baseCurrency} />
        <TextField label="Trading timezone" onChange={(event) => setTradingTimezone(event.target.value)} value={tradingTimezone} />
        <Button disabled={!displayName.trim() || working} onClick={() => void createAccount()} variant="contained">
          {working ? "Creating..." : "Create Journal account"}
        </Button>
      </Box>
    </Stack>
  );
}
