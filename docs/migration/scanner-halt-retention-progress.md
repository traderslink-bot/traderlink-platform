# Scanner halt retention

The published source ranks fresh gainers ahead of retained rows. A halt can make the last Alpaca trade stale while the price remains the last valid price. In a full list the stale row can fall below the display cutoff. Momentum and other scanner books also have normal freshness or expiry rules. POAS was reported by the owner. This mechanism was reproduced with a POAS fixture and was not verified against the original live tick.

The scanner uses the existing cached Alpaca status read to keep already visible, eligible rows in their existing lists during a confirmed halt. It preserves their last displayed values and their Momentum section. A confirmed resume returns the ticker to normal ranking. A failed status read keeps the last confirmed halt set for the trading day. Listing exclusions, configuration and session boundaries still apply. Market Events keeps its existing reason-code filters. Detection audit continues to record the raw detector decisions, and halt retention applies to the published lists.

Seven focused suites and 67 tests passed against the canonical source plus this change. The POAS replay covers a full list, a stale trade, a temporary halt-status outage, resume and removal by listing exclusion. The focused strict TypeScript check passed. The separate UI/API Market Events suite could not start in the isolated source fixture because a press-release dependency was absent. No production, preview or gateway changes were made.

## Market Events display expiry

The live Trading Workspace still listed the Nov. 16 AIRI news halt and the CCEL volatility pause after post-market close. The active scanner payload marked both paused even though the CCEL row already held the exchange’s 4 p.m. ET trade-resume time. The Alpaca branch bypassed the previous one-hour display expiry and the card did not use the scanner's closed-session state.

The Trading Workspace card and its compact drawer copy now remove an alert when its matching trade-resume time arrives, one hour passes, or the session closes, whichever comes first. The regular cutoff is 8 p.m. Eastern. The card follows the scanner's closed state on early-close days and ignores rows from a prior trading date. Quote resumption alone does not expire an alert. A single timeout per mounted card clears expired rows without depending on another scanner event or request. The existing pause icons, halt reason filters, and scanner ranking still use the existing halt status.

Four focused suites passed all 15 tests, including the actual card rendered with a frozen scanner payload. CCEL cleared at 4 p.m. Eastern and AIRI at 4:21:40 p.m. Eastern. Targeted TypeScript and card lint checks passed against the published source. This checkpoint has not been deployed.
