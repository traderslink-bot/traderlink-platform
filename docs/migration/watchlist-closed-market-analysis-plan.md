# Closed-market Watchlist analysis

Owner approved on 2026-09-26. [Progress](watchlist-closed-market-analysis-progress.md).

Separate owner-approved follow-up: [Extra High response allowance](watchlist-extra-high-output-progress.md). This changes only request sizing, not market-closed admission.

Status: implementation and bounded offline QA complete; Coordinator handoff, deployment and owner ticker acceptance are separate remaining checkpoints.

## Approved behavior

- With master generation on, a manual ticker addition with Generate analysis checked and a manual refresh can request analysis while the exchange is closed. Existing premarket/regular/postmarket switches keep their current open-session behavior.
- Closed-market requests remain private drafts for owner editing and approval. Notes-only additions, listing without analysis and notification choices retain their existing behavior.
- No automatic/startup/boundary/visibility-triggered requests are enabled by this change. No changes to models, fallback selection, spend limits, indicators, publisher scheduling or hosted settings.
- Fetch the most recently completed trading day's extended-hours candles when closed: use the current date after postmarket, otherwise the preceding exchange trading date, including weekends/holidays/DST. Keep historical daily/4h context.
- Resolve the analysis price from actual available candles in that completed session, retain their original timestamps, and tell the model explicitly that this is completed-session data, not live trading. Never fill an empty session with invented candles or relabel old observations as current.
- Preserve normal live-session price freshness rules. Missing required data remains a data error, not a market-closed prohibition.

## Implementation and acceptance

1. Confirm existing runtime edit ownership and exact release parent with Coordinator. Reuse the assigned checkout; do not create a copy/worktree or touch the deprecated folder.
2. Update generation admission, review persistence, manual-control availability, completed-session fetch and reference selection as one coherent slice.
3. Review Help and adjust only relevant copy. Existing admin status should explain: “Market closed: additions and manual refresh use the latest completed session. Automatic updates remain paused.” No new control or redesign.
4. At the completed-slice checkpoint, use bounded offline cases covering Saturday/Sunday, holiday, before premarket, after postmarket, DST, master Off, session switches, notes-only, persisted admission, no automatic calls, approval isolation, latest valid quote and empty data. No broad suites/builds/local server.
5. Supply a narrow source commit/patch, exact allowlist and verification to Coordinator. Deployment and a real owner-reviewed ticker test are separate; never claim live success from offline checks. No unapproved notifications.

## Plan QA

- Removing only the session guard is insufficient: the current Moomoo loader requests today's midnight-to-now range and the reference selector rejects candles older than 10/30 minutes.
- Admission normalization currently clears closed-session eligibility; it must preserve newly authorized admission across restart without changing historical false admissions.
- The public/manual availability read has no trigger; it must enable the manual button without permitting unrequested scheduler calls.
- Existing analysis and approved public cards must remain visible while a replacement is prepared privately.
- The generation time and actual candle/data time remain distinct. Latest known price is not a claim of live Saturday trading.
