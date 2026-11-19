"use client";

import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

/** Fits inside the existing card-options popover; never adds another card toolbar row. */
export function GainerSwitchControl({ automatic, onChange }: {
  automatic: boolean;
  onChange: (automatic: boolean) => void;
}) {
  return <Box sx={{ mt: 0.75, pt: 0.75, borderTop: 1, borderColor: "divider", maxWidth: 260 }}>
    <FormControlLabel
      sx={{ m: 0, gap: 0.5, alignItems: "center", "& .MuiFormControlLabel-label": { fontSize: "0.78rem", lineHeight: 1.35 } }}
      control={<Switch size="small" checked={automatic} onChange={(_, checked) => onChange(checked)} />}
      label="Automatically switch to post-market gainers"
    />
    <Typography sx={{ mt: 0.25, fontSize: "0.72rem", lineHeight: 1.35 }} color="text.secondary">
      Off keeps Day Gainers through post-market.
    </Typography>
  </Box>;
}
