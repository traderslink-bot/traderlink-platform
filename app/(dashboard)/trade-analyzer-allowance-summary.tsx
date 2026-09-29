import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { SharedAnalyzerAvailability } from "@/src/modules/level-analysis/contracts/shared-analyzer-beta-contracts";

export function TradeAnalyzerAllowanceSummary({ availability, selected = 0 }: { availability: SharedAnalyzerAvailability; selected?: number }) {
  if (availability.membership) {
    const { remaining, resetsAtUtc } = availability.membership;
    return <>
      <Typography color="text.secondary" variant="body2">{remaining === null ? "Unlimited analyses" : `${Math.max(0, remaining - selected)} analyses available`}</Typography>
      {remaining !== null ? <Typography color="text.secondary" variant="body2">{resetsAtUtc ? `Resets ${new Date(resetsAtUtc).toLocaleString()}` : "No scheduled reset"}</Typography> : null}
      {remaining === 0 ? <Button href="/plans?feature=trade_analyzer.analyses" variant="outlined">View plans with more analyses</Button> : null}
    </>;
  }
  return <>
    <Typography color="text.secondary" variant="body2">{availability.unlimited ? "Unlimited" : `${Math.max(0, availability.dailyAvailable - selected)} available today`}</Typography>
    {!availability.unlimited ? <Typography color="text.secondary" variant="body2">{Math.max(0, availability.periodAvailable - selected)} available this period · resets in {availability.daysUntilReset} days</Typography> : null}
  </>;
}
