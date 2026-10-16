import type { CSSProperties } from "react";
import { membershipPriceCard } from "@/src/modules/platform/contracts/membership-price-card";
import type { MembershipPrice } from "@/src/modules/platform/contracts/platform-membership-pricing";
import styles from "./plan-catalog.module.css";

export function PlanPrice({ price }: { price: MembershipPrice }) {
  const display = membershipPriceCard(price);
  const symbol = display.currency ? new Intl.NumberFormat("en-CA", {
    style: "currency", currency: display.currency, currencyDisplay: "narrowSymbol",
  }).formatToParts(0).find(part => part.type === "currency")?.value : undefined;
  // Reduce the prominent price by 10%, retaining the fit for longer amounts.
  const amountStyle = { "--price-fit": `${90 / Math.max(1, display.amount.length * .65)}cqi` } as CSSProperties;
  return <div className={styles.priceBlock}>
    <div className={styles.price}>
      {display.currency ? <span className={styles.currency}>{display.currency}</span> : null}
      <strong className={styles.amount} style={amountStyle} aria-label={display.configured ? undefined : "Price to be confirmed"}>{symbol && symbol !== display.currency ? <span className={styles.currencySymbol}>{symbol}</span> : null}{display.amount}</strong>
      <span className={styles.period} aria-hidden={!display.period}>{display.period || "\u00a0"}</span>
    </div>
    {display.note ? <p className={styles.priceNote}>{display.note}</p> : null}
  </div>;
}
