import Decimal from "decimal.js";

export const LOSS_NOTES_LIMIT = 1000;
export type ManualLossDraft = { buyPrice: string; sellPrice: string; notes: string };
export type ManualLossCard = ManualLossDraft & { percentage: string; lossLabel: string };
const PriceDecimal = Decimal.clone({ precision: 80 });

/** Only owner-entered prices. No quotes, publication state, clocks or trade inference. */
export function calculateManualLoss(draft: ManualLossDraft): ManualLossCard {
  const price = (text: string, label: string) => {
    if (typeof text !== "string" || text.trim().length > 64 || !/^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text.trim())) {
      throw Error(`Enter a valid ${label} price.`);
    }
    return new PriceDecimal(text.trim());
  };
  const buy = price(draft.buyPrice, "entry"), sell = price(draft.sellPrice, "exit");
  if (buy.lte(0)) throw Error("Entry price must be greater than zero.");
  if (sell.gt(buy)) throw Error("Exit price is above entry price. Enter a loss trade for this card.");
  if (typeof draft.notes !== "string" || draft.notes.length > LOSS_NOTES_LIMIT) throw Error(`Keep notes within ${LOSS_NOTES_LIMIT} characters.`);
  const percentage = sell.minus(buy).div(buy).times(100);
  const rounded = percentage.toFixed(2, Decimal.ROUND_HALF_UP);
  return {
    buyPrice: buy.toFixed(), sellPrice: sell.toFixed(), notes: draft.notes.trim(),
    percentage: percentage.toFixed(),
    lossLabel: percentage.isZero() ? "0.00%" : rounded === "-0.00" ? "Less than 0.01% loss" : `${rounded.replace("-", "−")}%`,
  };
}
