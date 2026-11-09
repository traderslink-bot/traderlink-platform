# Post-market Top Gainers volume review — November 6, 2026

Owner requested read-only audit review before deciding whether after-hours volume floors should match or be lower than premarket. No source thresholds, stored settings, hosted configuration, provider requests, deployments or scanner delivery changed.

## Source and method

Read the production scanner's existing settings and audit control SQLite database using a separate readonly, fileMustExist connection. Read indexed compressed evidence slices without changing any files; verified each slice's SHA-256 against its indexed digest before decompressing. Did not instantiate the audit writer/store. Remote analysis ran as a bounded low-priority Node process; evidence remained on the hosted volume and only aggregate summaries and market-data examples were returned. Refreshed production service metadata before access; active deployment e06e05fd-1ea4-4138-9362-f523aa800e3c, one replica, no pending work. Railway CLI SSH connection stalled; its own stalled processes were stopped and direct SSH with the same registered key succeeded. No service restart.

Reviewed all 1,331 stored after-hours cycles available at the query cutoff for November 6: 21:00:06.256Z–00:44:29.211Z (4:00:06–7:44:29 p.m. Eastern). These contain 1,389,300 ticker observations and 310,387 missing-symbol entries. This is observed evidence, not complete market coverage or the final 8 p.m. close. No stored audit integrity events were reported; missing quotes still limit conclusions.

Compared the current recorded qualification with two counterfactuals, changing only share/dollar volume requirements. A rejected observation could become eligible only if every recorded failure was volume_below_minimum or dollar_volume_below_minimum and its reported session counters passed the replacement floors. Missing/unavailable counters and all other rejections remained rejected. Combined original qualified observations with newly eligible observations and reranked by the recorded gainer comparison and symbol tie-break, retaining the configured top-20 limit. This is an eligibility/ranking replay, not a trading-profit or execution simulation. It does not claim first-detection timing improvements.

## Actual settings correction

Live Top Gainers has these floors, not the earlier illustrative code defaults:

| Session | Minimum shares | Minimum dollar turnover |
|---|---:|---:|
| Premarket | 0 | $0 |
| Regular | 4 | $1 |
| After-hours | 40,000 | $50,000 |

Post-market also requires at least 3% gain, maximum 16% spread and collection market cap at most $100 million. Those conditions remained unchanged in the replay. The 15,000/$15,000 comparison is the code's premarket starting default and live Momentum premarket floor; it is not live Top Gainers premarket configuration. No intent behind the existing settings is inferred.

## Results

| Alternative after-hours floor | Additional eligible ticker observations | Distinct additional eligible tickers | Scans with an additional displayed ticker |
|---|---:|---:|---:|
| 15,000 shares / $15,000 | 2,386 | 31 | 1,057 of 1,331 |
| 0 shares / $0 (actual live Top Gainers premarket floor) | 88,401 | 243 | 1,331 of 1,331 |

With zero floors, 144 distinct additional tickers entered the displayed top 20 across the period (17,025 additional displayed observations); the rest of the additional eligible names ranked below that display limit. With 15,000/$15,000, all 31 additional distinct eligible names appeared in the displayed list at some point. Counts across scans repeat observations of the same stock; 31 does not mean 31 additional stocks simultaneously.

Illustrative observed points that passed every other existing qualifier and would pass 15,000/$15,000:

| Ticker | After-hours gain | Session shares | Session turnover | Existing rejection |
|---|---:|---:|---:|---|
| NWGL | 56.13% | 31,088 | $111,614.13 | Shares below 40,000 |
| TGE | 54.61% | 70,549 | $31,770.84 | Turnover below $50,000 |
| XXII | 33.01% | 24,224 | $39,145.00 | Both |
| JDZG | 32.73% | 126,724 | $31,040.38 | Turnover below $50,000 |
| PASW | 29.77% | 26,892 | $43,560.54 | Both |
| WHLR | 29.53% | 87,114 | $39,067.59 | Turnover below $50,000 |

These are selected historical observations, not performance or entry recommendations. Zero floors also admitted FTHM at +52.36% with only 143 session shares and $26.11 turnover; a high percentage move can therefore represent very thin observed activity.

The existing audited post-market list never reached the configured 20-stock display cap during Nov 3–6. Maximum qualified counts were 14, 15, 18 and 18 respectively. A visually populated card is not evidence that its complete 20-row limit was filled. Earlier/different screen views cannot be reconstructed from the owner's description alone.

## Interpretation and next decision

Evidence supports trying a lower nonzero after-hours liquidity floor. 15,000 shares/$15,000 would admit significant additional observed movers without the extreme thinness admitted by zero floors. This is one latest-session counterfactual; it does not establish an optimal threshold or require making post-market equal to live premarket's zero floors. Further audit comparisons can examine alternate nonzero floors, entry timing, subsequent activity, spread and retention. Owner setting choice remains pending. Preserve current settings until a change is requested.
