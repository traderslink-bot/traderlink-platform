import TextField from "@mui/material/TextField";

export function GenerationResetField({ featureKey, value = null }: { featureKey: string; value?: number | null }) {
  if (featureKey !== "trade_analyzer.analyses" && featureKey !== "levels.generations") return null;
  return <TextField name={`resetDays:${featureKey}`} label="Reset every (days)" type="number"
    defaultValue={value ?? ""} slotProps={{ htmlInput: { min: 1, step: 1 } }}
    helperText="Blank means no reset. For example: 1, 3, 7, 14 or 30 days. Periods start at this version's publication time (UTC)." />;
}
