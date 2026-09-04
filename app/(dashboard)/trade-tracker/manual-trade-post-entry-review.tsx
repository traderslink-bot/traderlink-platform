"use client";

import Decimal from "decimal.js";
import React from "react";
import { Box, Button, Checkbox, FormControlLabel, MenuItem, Stack, TextField, Typography } from "@mui/material";
import type { JournalManualTradePreviewGroup } from "@/src/modules/journal/contracts/journal-manual-trade-capture-contracts";

export type PreviewLogicalTradeMerge = Readonly<{
  groupRefs: readonly string[];
  tradeStyle: "day" | "swing";
}>;

type AnalyzerUses = Readonly<{
  enabled: boolean;
  dailyAvailable: number;
  periodAvailable: number;
  selectableAvailable: number;
  daysUntilReset: number;
}>;

function marketDate(timestamp: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function timeLabel(timestamp: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York", hour: "numeric", minute: "2-digit",
  }).format(new Date(timestamp));
}

function accumulatedShares(group: JournalManualTradePreviewGroup): string {
  return group.allocations.filter((allocation) =>
    allocation.role === "opening" || allocation.role === "adding" || allocation.role === "flip_opening")
    .reduce((total, allocation) => total.plus(allocation.quantityDecimal), new Decimal(0)).toFixed();
}

export function ManualTradePostEntryReview({
  analyzerGroupRefs,
  analyzerUses,
  groups,
  merges,
  onAnalyzerGroupRefsChange,
  onError,
  onMergesChange,
}: Readonly<{
  analyzerGroupRefs: readonly string[];
  analyzerUses: AnalyzerUses | null;
  groups: readonly JournalManualTradePreviewGroup[];
  merges: readonly PreviewLogicalTradeMerge[];
  onAnalyzerGroupRefsChange: (refs: readonly string[]) => void;
  onError: (message: string | null) => void;
  onMergesChange: (merges: readonly PreviewLogicalTradeMerge[]) => void;
}>) {
  const [selected, setSelected] = React.useState<readonly string[]>([]);
  const [selectedStyle, setSelectedStyle] = React.useState<"day" | "swing" | "">("");
  const completed = groups.filter((group) =>
    group.state === "complete_trade" || group.state === "existing_position_closed");
  const mergedByRef = new Map(merges.flatMap((merge) => merge.groupRefs.map((ref) => [ref, merge] as const)));
  const showAnalyzer = analyzerUses?.enabled === true;
  const units = [
    ...merges.map((merge) => ({ groupRefs: merge.groupRefs, tradeStyle: merge.tradeStyle })),
    ...completed.filter((group) => !mergedByRef.has(group.groupRef)).map((group) => ({
      groupRefs: [group.groupRef] as readonly string[],
      tradeStyle: group.suggestedStyle === "swing" ? "swing" as const : "day" as const,
    })),
  ].sort((left, right) => {
    const leftGroup = groups.find((group) => group.groupRef === left.groupRefs[0]);
    const rightGroup = groups.find((group) => group.groupRef === right.groupRefs[0]);
    return (leftGroup?.openedAtUtc ?? "").localeCompare(rightGroup?.openedAtUtc ?? "");
  });
  const selectedGroups = selected.map((ref) => completed.find((group) => group.groupRef === ref))
    .filter((group): group is JournalManualTradePreviewGroup => Boolean(group));
  const firstSelected = selectedGroups[0] ?? null;
  const selectionDates = new Set(selectedGroups.flatMap((group) => [
    marketDate(group.openedAtUtc), marketDate(group.lastExecutionAtUtc),
  ]));
  const styleSet = new Set(selectedGroups.map((group) => group.suggestedStyle));
  const requiredStyle = selectionDates.size > 1 ? "swing" as const
    : styleSet.size === 1 && !styleSet.has("other")
      ? (styleSet.has("swing") ? "swing" as const : "day" as const)
      : null;
  const compatibleOrder = firstSelected ? completed.filter((group) =>
    group.symbol === firstSelected.symbol && group.currency === firstSelected.currency &&
    group.direction === firstSelected.direction && !mergedByRef.has(group.groupRef)) : [];
  const selectedIndices = selectedGroups.map((group) => compatibleOrder.indexOf(group)).sort((a, b) => a - b);
  const consecutive = selectedIndices.length < 2 ||
    (selectedIndices[0]! >= 0 && selectedIndices.at(-1)! - selectedIndices[0]! + 1 === selectedIndices.length);

  const toggleAnalyzer = (representative: string, checked: boolean) => {
    if (checked && (!analyzerUses || analyzerGroupRefs.length >= analyzerUses.selectableAvailable)) {
      onError("You have used all available Trade Analyzer uses.");
      return;
    }
    onError(null);
    onAnalyzerGroupRefsChange(checked
      ? [...analyzerGroupRefs, representative]
      : analyzerGroupRefs.filter((ref) => ref !== representative));
  };

  return <Stack spacing={1.5}>
    {showAnalyzer ? <Box>
      <Typography sx={{ fontWeight: 800 }} variant="body2">Analyzer uses</Typography>
      <Typography color="text.secondary" variant="body2">{Math.max(0, analyzerUses.dailyAvailable - analyzerGroupRefs.length)} available today</Typography>
      <Typography color="text.secondary" variant="body2">{Math.max(0, analyzerUses.periodAvailable - analyzerGroupRefs.length)} available this period · resets in {analyzerUses.daysUntilReset} days</Typography>
    </Box> : null}
    {units.map((unit) => {
      const members = unit.groupRefs.map((ref) => groups.find((group) => group.groupRef === ref))
        .filter((group): group is JournalManualTradePreviewGroup => Boolean(group));
      const first = members[0];
      const last = members.at(-1);
      if (!first || !last) return null;
      const representative = unit.groupRefs[0]!;
      const analyzerEligible = new Set(members.flatMap((member) => [
        marketDate(member.openedAtUtc), marketDate(member.lastExecutionAtUtc),
      ])).size === 1;
      return <Box key={representative} sx={{ border: 1, borderColor: "divider", borderRadius: 2, p: 1.25 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ justifyContent: "space-between" }}>
          <Box>
            <Typography sx={{ fontWeight: 850 }}>{first.symbol} · {first.direction === "long" ? "Long" : "Short"}</Typography>
            <Typography color="text.secondary" variant="body2">
              {members.reduce((count, member) => count + member.allocations.length, 0)} executions · {members.reduce((total, member) => total.plus(accumulatedShares(member)), new Decimal(0)).toFixed()} shares · {timeLabel(first.openedAtUtc)}–{timeLabel(last.lastExecutionAtUtc)}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            {analyzerEligible && showAnalyzer ? <FormControlLabel control={<Checkbox checked={analyzerGroupRefs.includes(representative)} onChange={(event) => toggleAnalyzer(representative, event.target.checked)} />} label="Analyze" /> : null}
            {unit.groupRefs.length > 1 ? <Button onClick={() => {
              onAnalyzerGroupRefsChange(analyzerGroupRefs.filter((ref) => ref !== representative));
              onMergesChange(merges.filter((merge) => merge.groupRefs[0] !== representative));
            }} size="small">Unmerge</Button> : null}
          </Stack>
        </Stack>
      </Box>;
    })}
    {completed.filter((group) => !mergedByRef.has(group.groupRef)).length > 1 ? <Box sx={{ borderTop: 1, borderColor: "divider", pt: 1.5 }}>
      <Typography sx={{ fontWeight: 800 }} variant="body2">Merge trades</Typography>
      <Stack spacing={0.25}>
        {completed.filter((group) => !mergedByRef.has(group.groupRef)).map((group) => {
          const compatible = !firstSelected || (group.symbol === firstSelected.symbol &&
            group.currency === firstSelected.currency && group.direction === firstSelected.direction);
          return <FormControlLabel key={group.groupRef} control={<Checkbox checked={selected.includes(group.groupRef)} disabled={!compatible} onChange={(event) => {
            onError(null);
            setSelected((current) => event.target.checked ? [...current, group.groupRef] : current.filter((ref) => ref !== group.groupRef));
            setSelectedStyle("");
          }} />} label={`${group.symbol} · ${timeLabel(group.openedAtUtc)}–${timeLabel(group.lastExecutionAtUtc)}`} />;
        })}
      </Stack>
      {selectedGroups.length > 1 && requiredStyle === null ? <TextField label="Trade type" onChange={(event) => setSelectedStyle(event.target.value as "day" | "swing")} select size="small" sx={{ mb: 1, minWidth: 170 }} value={selectedStyle}>
        <MenuItem value="day">Day Trade</MenuItem><MenuItem value="swing">Swing</MenuItem>
      </TextField> : null}
      {!consecutive ? <Typography color="error.main" variant="body2">Select consecutive trades.</Typography> : null}
      <Button disabled={selectedGroups.length < 2 || !consecutive || (!requiredStyle && !selectedStyle)} onClick={() => {
        const tradeStyle = requiredStyle ?? selectedStyle;
        if (!tradeStyle) return;
        const groupRefs = Object.freeze([...selected].sort((left, right) =>
          groups.findIndex((group) => group.groupRef === left) - groups.findIndex((group) => group.groupRef === right)));
        onAnalyzerGroupRefsChange(analyzerGroupRefs.filter((ref) => !groupRefs.includes(ref)));
        onMergesChange([...merges, Object.freeze({ groupRefs, tradeStyle })]);
        setSelected([]);
        setSelectedStyle("");
      }} size="small" variant="outlined">Merge selected</Button>
    </Box> : null}
  </Stack>;
}
