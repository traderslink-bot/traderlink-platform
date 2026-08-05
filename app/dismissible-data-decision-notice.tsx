"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

const STORAGE_VERSION = "v3";

export function DismissibleDataDecisionNotice({
  accountSelectionRef,
  children,
}: {
  accountSelectionRef: string;
  children: ReactNode;
  evidenceRef: string;
  surface?: string;
}) {

  const storageKey = useMemo(
    () => ["traderlink", "data-decision-notice", STORAGE_VERSION, accountSelectionRef].join(":"),
    [accountSelectionRef],
  );
  const legacyStoragePrefix = useMemo(
    () => ["traderlink", "data-decision-notice", "v2", accountSelectionRef, ""].join(":"),
    [accountSelectionRef],
  );
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(storageKey) === "dismissed" ||
        Object.keys(window.localStorage).some((key) =>
          key.startsWith(legacyStoragePrefix) && window.localStorage.getItem(key) === "dismissed",
        );
      if (dismissed) window.localStorage.setItem(storageKey, "dismissed");
      setVisible(!dismissed);
    } catch {
      setVisible(true);
    }
  }, [legacyStoragePrefix, storageKey]);

  if (!visible) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(storageKey, "dismissed");
    } finally {
      setVisible(false);
    }
  };

  return (
    <Alert
      action={(
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <Button color="inherit" href="/data-decisions" size="small">
            Review Data Decisions
          </Button>
          <IconButton
            aria-label="Dismiss notice"
            color="inherit"
            onClick={dismiss}
            size="small"
          >
            <CloseRoundedIcon fontSize="small" />
          </IconButton>
        </Stack>
      )}
      severity="warning"
    >
      {children}
    </Alert>
  );
}
