"use client";

import {
  Alert,
  Box,
  Button,
  Drawer,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";

import { createTradeExplorerTag } from "./trade-review-actions";
import type { TradeExplorerReviewTag } from "./trade-review-model";

export function TradeTagCreationDrawer({
  expectedAccountSelectionRef,
  onClose,
  onCreated,
  open,
}: Readonly<{
  expectedAccountSelectionRef: string;
  onClose: () => void;
  onCreated?: (tag: TradeExplorerReviewTag) => void;
  open: boolean;
}>) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(): Promise<void> {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    try {
      const result = await createTradeExplorerTag({
        expectedAccountSelectionRef,
        name,
      });
      if (!result.ok) {
        if (result.refreshRequired) {
          window.location.reload();
          return;
        }
        setError(result.message);
        return;
      }
      setName("");
      onCreated?.(result.data);
      onClose();
    } catch {
      setError("That tag could not be created. Check the name and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Drawer
      anchor="right"
      onClose={() => { if (!busy) onClose(); }}
      open={open}
      slotProps={{ paper: { sx: { width: { xs: "100vw", sm: 420 } } } }}
    >
      <Stack spacing={2} sx={{ p: 2.5 }}>
        <Box>
          <Typography component="h2" sx={{ fontWeight: 850 }} variant="h6">
            Create a reusable tag
          </Typography>
        </Box>
        <TextField
          autoFocus
          label="Tag"
          onChange={(event) => setName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void create();
            }
          }}
          slotProps={{ htmlInput: { maxLength: 40 } }}
          value={name}
        />
        {error ? <Alert severity="error">{error}</Alert> : null}
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Button disabled={busy} onClick={onClose}>Cancel</Button>
          <Button disabled={busy || !name.trim()} onClick={() => void create()} variant="contained">
            {busy ? "Creating…" : "Create tag"}
          </Button>
        </Stack>
      </Stack>
    </Drawer>
  );
}
