import TextField from "@mui/material/TextField";
import { isMembershipNewsDelay } from "@/src/modules/platform/contracts/membership-news-delays";
import { watchlistBudgetUsdInput } from "@/src/modules/platform/contracts/membership-watchlist-budget";

export function FeatureLimitField({ featureKey, value = null }: { featureKey: string; value?: number | null }) {
  const budget = featureKey === "private_watchlist.cost_microusd";
  const delay = isMembershipNewsDelay(featureKey);
  return <>
    {budget ? <input type="hidden" name={`unit:${featureKey}`} value="USD" /> : null}
    <TextField name={`limit:${featureKey}`} label={budget ? "Generation budget (USD)" : delay ? "Delay (seconds)" : "Limit"}
      helperText={delay ? "0 or blank: immediate. 300: five minutes." : "Blank: unlimited. 0: none."}
      type="number" slotProps={{ htmlInput: { min: 0, step: budget ? "0.000001" : 1 } }}
      defaultValue={budget ? watchlistBudgetUsdInput(value) : value ?? ""} size="small" />
  </>;
}
