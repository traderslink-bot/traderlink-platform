import { Fragment } from "react";
import { HIDDEN_ANALYSIS_PRICE } from "@/src/lib/live-watchlist/premium-analysis-preview";
import styles from "./premium-analysis-card.module.css";
export function MaskedPriceText({text}:{text:string}) {
 return <>{text.split(HIDDEN_ANALYSIS_PRICE).map((part,index)=><Fragment key={index}>{index>0 ? <span aria-label="Price requires feature access" className={styles.price}><span aria-hidden="true">$••.••</span></span> : null}{part}</Fragment>)}</>;
}
