# Trader Intelligence Behavior Language And Detection Audit

Last updated: 2026-05-09

## Purpose

This file is the product-language bridge between the detection engine and the
end-user Trader Intelligence UI.

The app should not show raw pattern IDs, scoring language, or internal labels to
normal users. A trader should be able to read the coach, analytics, review
queue, and trade detail pages and immediately understand:

- what happened in the trade,
- why it mattered,
- what evidence the app used,
- what to review first,
- what to try fixing next.

The UI is for humans and traders, especially newer traders. It should use plain
trading language, not diagnostic-terminal language.

## Engineer Review Conclusion

The current plan was not complete until it explicitly handled behavior language.
The codebase already contains useful behavior detection and a starter
user-facing summary mapper, but the product still leaks awkward/internal labels
in some core user-facing surfaces.

The next implementation work should prioritize detection hardening and a shared
trader-facing behavior language layer before more visual tuning. Better cards
and charts will not fix confusing labels or weak detections.

## No Partial Detection In Primary UI

The product should not treat "partial support" as good enough for any confident
primary user-facing conclusion.

From this point forward, a detection should be handled as one of these:

- Certified detection: allowed in primary user-facing conclusions across coach,
  analytics, review, progress, saved trades, and trade detail.
- Review prompt: allowed as a question for the trader to inspect, not as a firm
  conclusion.
- Internal/research signal: hidden from the primary UI and available only in
  advanced/collapsed builder diagnostics if needed.

Advanced/collapsed areas are not a loophole. Their visible titles, summaries,
badges, and closed-state labels are still part of the normal UI and must use
plain trader language. Raw diagnostics, pattern IDs, scoring traces, and
builder wording can appear only inside the expanded advanced detail.

If a detection cannot prove the behavior from executions, candles, levels,
volume, or saved reviews, it must not be worded as a conclusion.

See the active implementation plan:

- `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`

## Clarifying "Added After Failed Premise"

The phrase "Added After Failed Premise" should not appear in the default UI.

What it currently appears to mean in code:

- The trade had multiple adds after the initial entry.
- The trader had not meaningfully reduced risk yet.
- Related flags may include multiple adds before the first reduction or an
  overbuilt position.

What it does not prove by itself:

- It does not prove the trader's "premise" was objectively invalid.
- It does not prove emotional intent.
- It does not prove revenge trading unless repeated losing re-entries or
  adverse same-symbol attempts are also present.

Better default user-facing wording:

- "Kept adding before reducing risk"
- "Added multiple times before taking risk off"
- "Built size before protecting the trade"

Plain explanation:

> You added to the position several times before taking any risk off. Review
> whether those adds improved the trade or made the loss harder to control.

Advanced "how detected" wording:

> Detected because the trade had several add executions after the first entry
> before a meaningful reduction was recorded.

If chart context proves price was weakening, the wording can become stronger:

> You added before the trade repaired.

## Detection Areas To Certify Before Confident UI Claims

### Entry Quality

The current code and docs indicate signals for:

- late entries,
- chase entries,
- failed breakout chasing,
- entries after overextension,
- entries near or under resistance,
- entries far from nearby support,
- breakout, reclaim, mean-reversion, and opening-range style context when
  chart data is available.

User-facing goal:

> Did you buy after the move was already stretched, into resistance, or away
> from a better risk area?

### Trade Management And Scaling

The app has signals or pattern families for:

- adding into weakness,
- adding into strength,
- averaging down,
- multiple adds before first reduction,
- overbuilt losing positions,
- re-adds after trims,
- constructive adds,
- deteriorating re-entries,
- under-pressed winners.

User-facing goal:

> Did your adds improve the trade, or did they increase risk after the trade
> started working against you?

### Profit Protection And Exits

The app has signals for:

- gave back open profit,
- protected profit well,
- weak first reduction,
- premature exit,
- missed continuation after exit,
- strong winner management,
- strong loss containment,
- stop-like or defensive exits.

User-facing goal:

> Did you protect profit when the trade gave you a chance, or did you give back
> too much of the move?

### Re-Entries And Ticker Stories

The app has signals for:

- same-symbol repeated attempts,
- revenge-like re-entry clusters,
- re-add after trims,
- deteriorating re-entries,
- same-day ticker stories and profit giveback.

Important product rule:

Use cautious language. The app can say "possible revenge re-entry" or "re-entry
after a losing attempt." It should not claim emotional intent as fact.

User-facing goal:

> Did the second or third attempt help the overall ticker idea, or did it give
> back profit from the first attempt?

### Day And Session Behavior

The app has signals for:

- P/L by entry hour,
- session buckets,
- same-symbol overtrading,
- high-frequency execution clusters,
- day-level summaries.

Needed expansion:

- day-level overtrading,
- too many different tickers in one session,
- too many attempts after losses,
- performance before and after the best trade of the day,
- whether a green day turned red or a good trade was given back.

User-facing goal:

> Did the trading day become worse because of extra attempts after the best
> opportunity was already over?

### Support, Resistance, Volume, And Chart Context

The product goal depends on candle and level context. When available, the app
should explain:

- bought near resistance,
- bought closer to support,
- chased after a large move,
- added into weak intraday support,
- failed to protect profit after resistance rejection,
- exited before continuation,
- volume faded during a re-entry.

Important product rule:

If candles or generated levels are missing, the UI should say the review is
execution-only and avoid chart-context claims.

## Behavior Labels To Replace In User UI

| Internal or awkward label | Default user-facing label | Plain explanation |
| --- | --- | --- |
| Added After Failed Premise | Kept adding before reducing risk | You added several times before taking risk off. |
| Scaled Losing Position | Added before the trade repaired | Size increased before the chart showed a clear repair. |
| Added After Adverse Move | Review the add after adverse movement | You added after price moved away from your entry; confirm whether the trade repaired before adding. |
| Revenge-Like Re-Entry Cluster | Possible revenge re-entry | You re-entered quickly after a losing attempt. |
| Early Winner Exit | Exited before the move had time to finish | The trade kept going after you exited. |
| Poor First Reduction | First partial did not protect enough profit | The first sell did not lock in much of the available move. |
| Overtraded Same Ticker | Too many attempts on the same ticker | Repeated attempts on one symbol added risk. |
| Overbuilt Losing Position | Built too much size in a losing trade | The position grew while the trade was not improving. |
| Left Open Position | Position was still open after import | The app cannot finish the review until the trade is closed. |
| Chased Entry | Bought after the move was already stretched | Entry came after price had already moved sharply. |
| Breakout Into Overhead Resistance | Bought into nearby resistance | Entry was close to a level where sellers may appear. |
| Underutilized Winner | Did not press a working trade | The trade worked, but size or hold time did not capture much of it. |

## Required Product Translation Layer

Create a shared behavior-language module that all user routes can use:

- `/coach`
- `/analytics`
- `/review`
- `/progress`
- `/trades`
- `/trades/[tradeId]`

The module should map:

- taxonomy IDs,
- pattern IDs,
- pattern metadata labels,
- coach focus labels,
- review queue reasons,
- chart-context status labels,
- execution-only limitation labels.

The mapper should return:

- short label,
- trader-facing explanation,
- evidence sentence,
- "how detected" sentence for advanced/collapsed UI,
- confidence caveat when needed,
- whether chart context is required for the claim.

The mapper must fail closed:

- if a raw behavior label is unknown, unmapped, or not certified, primary UI
  should not display it as a conclusion,
- if a route asks for a behavior label that is missing from the registry, that
  missing mapping is a product-safety fallback path, not a reason to render the
  original raw label,
- if an advanced disclosure is collapsed, its visible title and summary should
  still be plain-language and product-safe,
- if evidence exists but the behavior is not certified, show a neutral review
  prompt,
- if evidence is weak or builder-only, keep it in advanced/internal
  diagnostics,
- normal routes should not create their own behavior wording fallback tables.

## What Needs To Be Added

1. Replace raw behavior labels across coach, analytics, review, progress, saved
   trades, and trade detail with trader-facing labels.
2. Add a shared language dictionary and tests so future features do not re-leak
   internal labels.
3. Add "how this was detected" copy behind advanced disclosures.
4. Expand analytics deep dives for:
   - winners turned losers,
   - missed continuation,
   - scale-out quality,
   - repeated same-symbol attempts,
   - day-level overtrading,
   - support/resistance entry quality,
   - volume fade during later re-entries.
5. Keep emotional labels cautious:
   - use "possible revenge re-entry" instead of "revenge trading" unless the
     evidence is strong and repeated.
6. Make chart-context claims only when candles and levels are actually present.
7. Add copy safety tests for confusing/internal words such as:
   - premise,
   - pattern ID,
   - dominant family,
   - normalization,
   - suppressed behavior,
   - raw diagnostics.

## Ready-To-Work Next Step

The next implementation pass should start with the active detection hardening
plan:

- `src/docs/trader-intelligence-detection-and-language-hardening-plan-2026-05-09.md`

First inventory and certify behavior detections. Then build the shared
trader-facing behavior language mapper, wire certified labels into the coach
first, then analytics and trade detail, and add tests that assert confusing
labels like "Added After Failed Premise" do not appear in primary user UI.
