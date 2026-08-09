"use client";

import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useState, useTransition } from "react";

import { saveAiReviewSettings } from "./ai-review-delivery-actions";

type AiReviewFrequency = "weekly" | "two_week" | "monthly_only";
type AiReviewTimingMode = "automatic_after_12_hours" | "wait_for_tracker_input";

type AiReviewSettingsView = Readonly<{
  isEnabled: boolean;
  currentFrequency: AiReviewFrequency;
  timingMode: AiReviewTimingMode;
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
    description: "Review each U.S. trading week, including holiday-shortened weeks. A context-free week with only one trade may combine once with the following trading week so the feedback is useful.",
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

const TIMING_MODES: readonly Readonly<{
  value: AiReviewTimingMode;
  label: string;
  description: string;
}>[] = Object.freeze([
  Object.freeze({
    value: "automatic_after_12_hours",
    label: "Automatic after 12 hours",
    description: "Automatically generate 12 hours after post-market ends on the final trading day of the trading week. No daily reviews are required. Verified execution data and everything saved in Trade Tracker by generation time will still be included.",
  }),
  Object.freeze({
    value: "wait_for_tracker_input",
    label: "Give me extra time for Trade Tracker reviews",
    description: "Generate sooner when you have marked your reviews as complete or select Generate now. Otherwise, automatically generate at the end of the following trading week using everything saved by that time.",
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
  const [selectedEnabled, setSelectedEnabled] = useState(initialSettings?.isEnabled ?? false);
  const [selectedFrequency, setSelectedFrequency] = useState<AiReviewFrequency>(
    currentFrequency,
  );
  const [selectedTimingMode, setSelectedTimingMode] = useState<AiReviewTimingMode>(
    initialSettings?.timingMode ?? "automatic_after_12_hours",
  );
  const [notice, setNotice] = useState<Readonly<{
    severity: "success" | "error";
    message: string;
  }> | null>(null);
  const [working, startTransition] = useTransition();
  const savedFrequency = settings?.pendingFrequency ?? settings?.currentFrequency ?? "weekly";
  const savedSelection = selectedEnabled === (settings?.isEnabled ?? false) &&
    (!selectedEnabled || (
      selectedFrequency === savedFrequency &&
      selectedTimingMode === settings?.timingMode
    ));

  function save(): void {
    startTransition(async () => {
      setNotice(null);
      const result = await saveAiReviewSettings({
        isEnabled: selectedEnabled,
        frequency: selectedFrequency,
        timingMode: selectedTimingMode,
        expectedRevision: settings?.revision ?? null,
      });
      if (!result.ok) {
        setNotice(Object.freeze({ severity: "error", message: result.message }));
        return;
      }
      setSettings(result.settings);
      setSelectedEnabled(result.settings.isEnabled);
      setSelectedFrequency(result.settings.pendingFrequency ?? result.settings.currentFrequency);
      setSelectedTimingMode(result.settings.timingMode);
      setNotice(Object.freeze({
        severity: "success",
        message: result.settings.pendingFrequency
          ? "Your frequency change is scheduled."
          : "AI Review settings saved.",
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
          Choose how often AI reviews your verified Trade Tracker results and whether weekly reviews should wait for your input. Monthly reviews are included with every frequency option.
        </Typography>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
          <Chip
            color={selectedEnabled ? "success" : "default"}
            label={selectedEnabled ? "On" : "Off"}
            size="small"
          />
          <FormControlLabel
            control={<Switch checked={selectedEnabled} onChange={(event) => setSelectedEnabled(event.target.checked)} />}
            label={selectedEnabled ? "AI Reviews on" : "AI Reviews off"}
          />
        </Stack>
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
                cursor: selectedEnabled ? "pointer" : "default",
                opacity: selectedEnabled ? 1 : 0.65,
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
                  disabled={!selectedEnabled}
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

      {selectedFrequency !== "monthly_only" ? (
        <Stack spacing={1.25}>
          <Typography sx={{ fontWeight: 800 }} variant="subtitle1">
            Weekly review timing
          </Typography>
          <Box
            role="radiogroup"
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            }}
          >
            {TIMING_MODES.map((mode) => {
              const selected = mode.value === selectedTimingMode;
              return (
                <Box
                  component="label"
                  key={mode.value}
                  sx={{
                    bgcolor: selected ? "rgba(1, 30, 86, 0.035)" : "background.paper",
                    border: 1,
                    borderColor: selected ? "primary.main" : "divider",
                    borderRadius: 2,
                    cursor: selectedEnabled ? "pointer" : "default",
                    opacity: selectedEnabled ? 1 : 0.65,
                    minHeight: 170,
                    p: 2,
                    transition: "border-color 120ms ease, background-color 120ms ease",
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
                      disabled={!selectedEnabled}
                      name="ai-review-timing"
                      onChange={() => setSelectedTimingMode(mode.value)}
                      value={mode.value}
                    />
                    <Box sx={{ pt: 0.75 }}>
                      <Typography sx={{ fontWeight: 800 }}>{mode.label}</Typography>
                      <Typography color="text.secondary" sx={{ mt: 0.75 }} variant="body2">
                        {mode.description}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              );
            })}
          </Box>
        </Stack>
      ) : null}

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
        Calendar-month reviews use exact month facts and arrive at 8:00 AM the day after month end. Saved tags and followed or broken rule results are included when available; missing tracking is reported as not recorded.
      </Typography>

      <Typography color="text.secondary" variant="body2">
        All non-empty notes, saved tags and recorded rule results available when generation begins can be used whether or not a daily review is marked complete. Marking reviews complete affects early timing only when you choose the extra-time option.
      </Typography>

      <Typography color="text.secondary" variant="body2">
        Turning AI Reviews off stops new reviews for this Trade Tracker account. It does not remove Trade Tracker data or reviews already issued. Timing changes apply immediately to any open period that has not yet been requested.
      </Typography>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
        <Button disabled={working || savedSelection} onClick={save} variant="contained">
          {working
            ? "Saving..."
            : savedSelection
              ? selectedEnabled ? "Settings saved" : "AI Reviews are off"
              : selectedEnabled ? "Save and turn on" : "Save and turn off"}
        </Button>
      </Stack>
    </Stack>
  );
}
