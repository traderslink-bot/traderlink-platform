import Typography from "@mui/material/Typography";
import type { BreakoutRow } from "@/src/modules/scanner/live/contracts";
import { SNAPSHOT_MAX_AGE_MS } from "@/src/modules/scanner/live/snapshots";
import { scannerGainColor } from "./scanner-gain-color";

const stateText = { above: "Above", at: "At level", below: "Back below" };
const easternTime = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York", hour: "numeric", minute: "2-digit", second: "2-digit", timeZoneName: "short",
});

function priceAge(ageMs: number): string {
  if (ageMs < 60_000) return `${Math.floor(ageMs / 1_000)}s`;
  if (ageMs < 3_600_000) return `${Math.floor(ageMs / 60_000)}m`;
  return `${Math.floor(ageMs / 3_600_000)}h`;
}

export function BreakoutStatus({ row, now }: { row: BreakoutRow; now: number }) {
  const priceAtUtc = row.breakoutPriceAtUtc ?? row.receivedAtUtc;
  const priceAt = Date.parse(priceAtUtc);
  const ageMs = now - priceAt;

  return <>
    <Typography component="span" variant="inherit" sx={{ color: scannerGainColor(row.price - row.breakoutLevel) }}>
      {stateText[row.breakoutState]}
    </Typography>
    {ageMs > SNAPSHOT_MAX_AGE_MS && (
      <Typography component="time" variant="inherit" dateTime={priceAtUtc} title={easternTime.format(priceAt)}
        sx={{ display: "block", fontSize: "0.65rem", color: "text.secondary" }}>
        Price {priceAge(ageMs)} old
      </Typography>
    )}
  </>;
}
