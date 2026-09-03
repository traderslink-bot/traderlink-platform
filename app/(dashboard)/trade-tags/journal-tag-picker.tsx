"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  JOURNAL_TAG_PRESET_CATEGORY_LABELS,
  type JournalTagPresetCategory,
} from "@/src/modules/journal/contracts/journal-tag-preset-catalog";

export type JournalTagPickerChoice = Readonly<{
  category: JournalTagPresetCategory | "custom";
  name: string;
  selectionId: string;
}>;

type PickerColor = "default" | "primary" | "secondary" | "info" | "success" | "warning" | "error";

const CATEGORY_ORDER: readonly JournalTagPickerChoice["category"][] = Object.freeze([
  "setup",
  "entry_execution",
  "exit",
  "mistake",
  "emotion",
  "market_context",
  "risk_process",
  "custom",
]);

const CATEGORY_COLORS: Readonly<Record<JournalTagPickerChoice["category"], PickerColor>> = Object.freeze({
  setup: "secondary",
  entry_execution: "info",
  exit: "success",
  mistake: "error",
  emotion: "warning",
  market_context: "primary",
  risk_process: "secondary",
  custom: "default",
});

export function JournalTagPicker({ choices, disabled = false, maxSelected = 10, onSelectedIdsChange, selectedIds }: Readonly<{
  choices: readonly JournalTagPickerChoice[];
  disabled?: boolean;
  maxSelected?: number;
  onSelectedIdsChange: (selectedIds: readonly string[]) => void;
  selectedIds: readonly string[];
}>) {
  const selected = new Set(selectedIds);
  const groups = CATEGORY_ORDER.map((category) => ({
    category,
    choices: choices.filter((choice) => choice.category === category),
  })).filter((group) => group.choices.length > 0);

  return <Box sx={{ border: 1, borderColor: "divider", borderRadius: 1.5, maxHeight: 198, overflowY: "auto", p: 1 }}>
    <Stack spacing={1.1}>
      {groups.map((group) => {
        const color = CATEGORY_COLORS[group.category];
        return <Box key={group.category}>
          <Typography color={color === "default" ? "text.secondary" : `${color}.main`} sx={{ fontSize: "0.7rem", fontWeight: 900, letterSpacing: "0.055em", mb: 0.55, textTransform: "uppercase" }} variant="caption">
            {JOURNAL_TAG_PRESET_CATEGORY_LABELS[group.category]}
          </Typography>
          <Stack direction="row" spacing={0.55} sx={{ flexWrap: "wrap" }} useFlexGap>
            {group.choices.map((choice) => {
              const active = selected.has(choice.selectionId);
              return <Chip
                color={color}
                disabled={disabled}
                icon={active ? <CheckRoundedIcon /> : undefined}
                key={choice.selectionId}
                label={choice.name}
                onClick={() => {
                  if (disabled) return;
                  if (active) {
                    onSelectedIdsChange(selectedIds.filter((id) => id !== choice.selectionId));
                  } else if (selectedIds.length < maxSelected) {
                    onSelectedIdsChange([...selectedIds, choice.selectionId]);
                  }
                }}
                size="small"
                sx={(theme) => ({
                  borderRadius: 1,
                  fontSize: "0.76rem",
                  fontWeight: active ? 850 : 700,
                  height: 26,
                  ...(active || color === "default" ? {} : {
                    bgcolor: alpha(theme.palette[color as Exclude<PickerColor, "default">].main, 0.06),
                    borderColor: alpha(theme.palette[color as Exclude<PickerColor, "default">].main, 0.55),
                  }),
                })}
                variant={active ? "filled" : "outlined"}
              />;
            })}
          </Stack>
        </Box>;
      })}
    </Stack>
  </Box>;
}
