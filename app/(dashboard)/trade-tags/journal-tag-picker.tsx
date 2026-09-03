"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Box, Chip, Stack, Typography } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";
import type { SxProps } from "@mui/system";

import {
  JOURNAL_TAG_PRESET_CATEGORY_LABELS,
  journalTagPresetForName,
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
  exit: "primary",
  mistake: "error",
  emotion: "warning",
  market_context: "warning",
  risk_process: "success",
  custom: "default",
});

function tagChipSx(color: PickerColor, selected: boolean): SxProps<Theme> {
  return (theme) => ({
    borderRadius: 1,
    fontSize: "0.76rem",
    fontWeight: selected ? 850 : 800,
    height: 26,
    ...(selected || color === "default" ? {} : {
      bgcolor: alpha(theme.palette[color as Exclude<PickerColor, "default">].main, 0.14),
      borderColor: alpha(theme.palette[color as Exclude<PickerColor, "default">].main, 0.88),
    }),
  });
}

export function JournalTagChip({ category, label }: Readonly<{
  category?: JournalTagPickerChoice["category"];
  label: string;
}>) {
  const resolvedCategory = category ?? journalTagPresetForName(label)?.category ?? "custom";
  const color = CATEGORY_COLORS[resolvedCategory];
  return <Chip color={color} label={label} size="small" sx={tagChipSx(color, false)} variant="outlined" />;
}

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
                sx={tagChipSx(color, active)}
                variant={active ? "filled" : "outlined"}
              />;
            })}
          </Stack>
        </Box>;
      })}
    </Stack>
  </Box>;
}
