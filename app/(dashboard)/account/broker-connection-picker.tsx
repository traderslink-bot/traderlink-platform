"use client";

import Box from "@mui/material/Box";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState } from "react";

import { DashboardPrimaryAction } from "../../dashboard-template";

type BrokerConnectionState = "active" | "reauthorization_required" | "revoked" | null;

const BROKERS = Object.freeze([
  Object.freeze({
    key: "moomoo",
    label: "Moomoo",
    method: "OAuth",
  }),
]);

export function BrokerConnectionPicker({
  moomooConnectionState,
}: {
  moomooConnectionState: BrokerConnectionState;
}) {
  const [selectedBroker, setSelectedBroker] = useState("");
  const broker = BROKERS.find((entry) => entry.key === selectedBroker) ?? null;
  const connected = moomooConnectionState === "active";

  return (
    <Stack spacing={1.5}>
      <Box>
        <TextField
          label="Select broker"
          onChange={(event) => setSelectedBroker(event.target.value)}
          select
          sx={{ minWidth: { sm: 260 } }}
          value={selectedBroker}
        >
          <MenuItem disabled sx={{ display: "none" }} value="" />
          {BROKERS.map((entry) => <MenuItem key={entry.key} value={entry.key}>{entry.label}</MenuItem>)}
        </TextField>
        <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
          More brokers coming soon.
        </Typography>
      </Box>

      {broker && !connected ? <Box sx={{ bgcolor: "rgba(1, 30, 86, 0.035)", border: 1, borderColor: "divider", borderRadius: 1.5, p: 2 }}>
        <Typography sx={{ fontWeight: 800 }} variant="body1">{broker.label}</Typography>
        <Stack spacing={0.75} sx={{ mt: 1 }}>
          <Typography color="text.secondary" variant="body2">
            Connection method: {broker.method}.
          </Typography>
          <Typography color="text.secondary" variant="body2">
            When you connect, you will sign in with Moomoo and authorize TradersLink. Moomoo then sends you back to this page.
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Moomoo can require a new authorization when its access ends. Select Moomoo and connect again if that happens.
          </Typography>
        </Stack>
        {!connected ? (
          <DashboardPrimaryAction component="a" href="/api/connections/moomoo/start" sx={{ mt: 1.5 }}>
            Connect Moomoo
          </DashboardPrimaryAction>
        ) : null}
      </Box> : null}
    </Stack>
  );
}
