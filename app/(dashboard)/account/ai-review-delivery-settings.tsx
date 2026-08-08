"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Radio from "@mui/material/Radio";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState, useTransition } from "react";

import { saveAiReviewFrequency } from "./ai-review-delivery-actions";

type AiReviewFrequency = "weekly" | "two_week" | "monthly_only";

type AiReviewSettingsView = Readonly<{
  isEnabled: boolean;
  currentFrequency: AiReviewFrequency;
  pendingFrequency: AiReviewFrequency | null;
  pendingEffectiveMondayDate: string | null;
  revision: number;
}>;

const FREQUENCIES: readonly Readonly<{
  value: AiReviewFrequency;
  label: string;
  description: string;
}>[] = Object.freeze([
  Object.freeze({
    value: "weekly",
    label: "Every trading week",
    description: "Review each U.S. trading week, including holiday-shortened weeks.",
  }),
  Object.freeze({
    value: "two_week",
    label: "Every two trading weeks",
    description: "Combine exactly two consecutive trading weeks for more activity and reflection context.",
  }),
  Object.freeze({
    value: "monthly_only",
    label: "Monthly only",
    description: "Receive one calendar-month review without weekly or two-week AI reviews.",
  }),
]);

function frequencyLabel(value: AiReviewFrequency): string {
  return FREQUENCIES.find((frequency) => frequency.value === value)?.label ?? value;
}

function formatEffectiveDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00.000Z`));
}

export function AiReviewFrequencySettings({
  initialSettings,
}: {
  initialSettings: AiReviewSettingsView | null;
}) {
  const currentFrequency = initialSettings?.pendingFrequency ??
    initialSettings?.currentFrequency ?? "weekly";
  const [settings, setSettings] = useState(initialSettings);
  const [selectedFrequency, setSelectedFrequency] = useState<AiReviewFrequency>(
    currentFrequency,
  );
  const [notice, setNotice] = useState<Readonly<{
    severity: "success" | "error";
    message: string;
  }> | null>(null);
  const [working, startTransition] = useTransition();
  const savedFrequency = settings?.pendingFrequency ?? settings?.currentFrequency ?? "weekly";
  const savedSelection = settings?.isEnabled === true && selectedFrequency === savedFrequency;

  function save(): void {
    startTransition(async () => {
      setNotice(null);
      const result = await saveAiReviewFrequency({
        frequency: selectedFrequency,
        expectedRevision: settings?.revision ?? null,
      });
      if (!result.ok) {
        setNotice(Object.freeze({ severity: "error", message: result.message }));
        return;
      }
      setSettings(result.settings);
      setSelectedFrequency(result.settings.pendingFrequency ?? result.settings.currentFrequency);
      setNotice(Object.freeze({
        severity: "success",
        message: result.settings.pendingFrequency
          ? "Your frequency change is scheduled."
          : "AI Review frequency saved.",
      }));
    });
  }

  return (
    <Stack spacing={2}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        sx={{ alignItems: { sm: "center" }, justifyContent: "space-between" }}
      >
        <Typography color="text.secondary" sx={{ maxWidth: 760 }} variant="body2">
          Choose how often AI reviews your completed daily Trade Tracker reviews. Monthly reviews are included with every option.
        </Typography>
        <Chip
          color={settings?.isEnabled ? "success" : "default"}
          label={settings?.isEnabled ? "On" : "Off"}
          size="small"
        />
      </Stack>

      <Box
        role="radiogroup"
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        {FREQUENCIES.map((frequency) => {
          const selected = frequency.value === selectedFrequency;
          return (
            <Box
              component="label"
              key={frequency.value}
              sx={{
                border: 1,
                borderColor: selected ? "primary.main" : "divider",
                borderRadius: 2,
                cursor: "pointer",
                minHeight: 150,
                p: 2,
                transition: "border-color 120ms ease, background-color 120ms ease",
                bgcolor: selected ? "rgba(1, 30, 86, 0.035)" : "background.paper",
                "&:has(input:focus-visible)": {
                  outline: "3px solid",
                  outlineColor: "primary.light",
                  outlineOffset: 2,
                },
              }}
            >
              <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                <Radio
                  checked={selected}
                  color="primary"
                  name="ai-review-frequency"
                  onChange={() => setSelectedFrequency(frequency.value)}
                  value={frequency.value}
                />
                <Box sx={{ pt: 0.75 }}>
                  <Typography sx={{ fontWeight: 800 }}>{frequency.label}</Typography>
                  <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
                    {frequency.description}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          );
        })}
      </Box>

      {notice ? <Alert severity={notice.severity}>{notice.message}</Alert> : null}

      {settings?.pendingFrequency && settings.pendingEffectiveMondayDate ? (
        <Alert severity="info">
          {frequencyLabel(settings.pendingFrequency)} begins with the trading week of {formatEffectiveDate(settings.pendingEffectiveMondayDate)}. Your current review period will finish first.
        </Alert>
      ) : (
        <Alert severity="info">
          Frequency changes begin with the next available trading-week period. An open two-week review always finishes both trading weeks first.
        </Alert>
      )}

      <Typography color="text.secondary" variant="body2">
        Calendar-month reviews use exact month facts and arrive at 8:00 AM the day after month end.
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
        <Button disabled={working || savedSelection} onClick={save} variant="contained">
          {working
            ? "Saving..."
            : settings?.isEnabled
              ? savedSelection ? "Frequency saved" : "Save frequency"
              : "Enable AI Reviews"}
        </Button>
      </Stack>
    </Stack>
  );
}
