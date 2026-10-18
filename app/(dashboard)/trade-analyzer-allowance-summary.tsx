import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import type { SharedAnalyzerAvailability } from "@/src/modules/level-analysis/contracts/shared-analyzer-beta-contracts";

export function TradeAnalyzerUpgradeLink({ availability }: { availability: SharedAnalyzerAvailability | null }) {
  const membership = availability?.membership;
  if (!membership || (membership.included !== false && membership.remaining !== 0)) return null;
  return <Button href="/plans?feature=trade_analyzer.analyses" size="small" variant="outlined">
    {membership.included === false ? "Upgrade for Trade Analyzer" : "Upgrade for more analyses"}
  </Button>;
}

export function TradeAnalyzerAllowanceSummary({ availability, selected = 0 }: { availability: SharedAnalyzerAvailability; selected?: number }) {
  if (availability.membership) {
    const { included, remaining, resetsAtUtc } = availability.membership;
    if (included === false) return <>
      <Typography color="text.secondary" variant="body2" sx={{ whiteSpace: "normal", overflowWrap: "anywhere" }}>See what your trades are telling you. Unlock Trade Analyzer and discover new ways to improve using TradersLink detail analysis data.</Typography>
      <Button href="/plans?feature=trade_analyzer.analyses" variant="contained">Start Analyzing your trades now!</Button>
    </>;
    return <>
      <Typography color="text.secondary" variant="body2">{remaining === null ? "Unlimited analyses" : `${Math.max(0, remaining - selected)} analyses available`}</Typography>
      {remaining !== null ? <Typography color="text.secondary" variant="body2">{resetsAtUtc ? `Resets ${new Date(resetsAtUtc).toLocaleString()}` : "No scheduled reset"}</Typography> : null}
      {remaining === 0 ? <Button href="/plans?feature=trade_analyzer.analyses" variant="outlined">Increase your Analyzer usage</Button> : null}
    </>;
  }
  return <>
    <Typography color="text.secondary" variant="body2">{availability.unlimited ? "Unlimited" : `${Math.max(0, availability.dailyAvailable - selected)} available today`}</Typography>
    {!availability.unlimited ? <Typography color="text.secondary" variant="body2">{Math.max(0, availability.periodAvailable - selected)} available this period · resets in {availability.daysUntilReset} days</Typography> : null}
  </>;
}
