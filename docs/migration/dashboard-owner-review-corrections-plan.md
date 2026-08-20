# Dashboard Owner Review Corrections Plan

**Status:** Owner-approved on 2026-08-17. Implementation is active.

**Progress:** [Dashboard Owner Review Corrections Progress](dashboard-owner-review-corrections-progress.md)

## 1. Outcome

Apply the owner's integrated dashboard review corrections while preserving the accepted light Material shell, the canonical Journal ledger, exact financial facts, account isolation, and stable route URLs.

## 2. Approved corrections

### Workspace and Calendar

- Remove the Workspace **Performance over time** panel.
- Replace the Workspace's compact Trading calendar panel with the same responsive Week calendar presentation used by `/calendar`.
- Keep `/calendar` unchanged and reuse one shared Week component instead of maintaining two calendar implementations.
- Show Current Focuses, Focus rules and Previous trading-day review only when each card has trader-visible content.
- Give Previous trading-day review its own full-width row; use its former top-row space for an **Add trades** card linking to imports and manual entry.

### Daily Trade Tracker

- Keep the combined trade analysis visible when an individual execution is selected.
- Use an execution selection only to emphasize its chart marker; it must not replace the complete-trade analysis.
- Replace Green-to-Red system language with direct trader-facing descriptions of each period's calculated P/L range and giveback.
- Give each ticker analysis card a complete black outline, including its chart, and clearer separation from the next ticker.
- Reduce desktop chart zoom controls while retaining mobile touch target sizing.

### Trading Rules and navigation

- Present preset and custom rules together under **Your trading rules**.
- Use black card outlines, explicit **Preset** or **Custom** labels, and no visible version numbers.
- Keep one Create custom rule action and preserve rule lifecycle and sorting behavior.
- Add **Rule Results** directly after **Trading Rules** in the left navigation.
- Move **Trade Analyzer** before **Analytics** and show **Day Trade Analysis** as the parent of Entry & Exit, MFE & MAE, Green-to-Red, Candle Patterns, and Analyzed Trades.

### Trade Explorer and analytics

- Use the approved Trade Explorer description and continue using the shared Journal annotations read/write path for notes, tags, and rule results.
- Diagnose and correct the DSDY/DSY empty-result behavior without inventing trades or changing source facts.
- Make ticker rows on Analytics Results open a responsive completed-trade detail drawer with exact executions.
- Rename the visible `/analytics/execution` experience to **Trade Breakdown** while preserving the stable URL.
- Use the supporting sentence: “See how your completed trades were entered, sized, held, and exited.”
- Make Trade Breakdown rows open the same factual responsive trade-detail experience and keep pagination at the bottom right.
- Show a complete-trade analyzer chart only where analyzer coverage actually exists; otherwise show an honest unavailable state or direct path to the existing analysis.

### Candle patterns and small presentation corrections

- Use one retail-friendly presentation catalog everywhere: **Inside Bar**, **Bullish Inside Bar Breakout**, **Bearish Inside Bar Breakdown**, **Bullish Engulfing**, **Bearish Engulfing**, **Bullish Hammer**, **Bearish Shooting Star**, **Bullish Rejection Candle**, **Bearish Rejection Candle**, **Strong Bullish Candle**, **Strong Bearish Candle**, and **High-Volume Exhaustion**.
- Keep the current factual detectors unchanged. Additional pattern detection is outside this correction set.
- Remove the visible Market Charts page title while retaining an accessible page heading.
- Remove the second sentence from the Notifications empty state.

## 3. Data and architecture boundaries

- No new database, ledger, pattern detector, or analytics authority.
- No mock, sample, guessed, or zero-filled trading facts.
- Exact executions come from the existing owner/account-scoped Journal reads.
- Notes, tags, and rules continue to use the shared Journal annotation service used by the Daily Trade Tracker and AI Reviews.
- Unavailable analyzer coverage remains visibly unavailable.
- Existing route URLs remain stable unless the owner separately approves a route migration.

## 4. Delivery sequence

1. Record this plan and its progress tracker.
2. Implement the shared presentation corrections across Workspace, Calendar, Tracker, Rules, navigation, charts, Notifications, and candle names.
3. Correct Trade Explorer ticker/currency behavior and confirm the shared annotation contract.
4. Add one reusable responsive exact-trade detail experience to Results and Trade Breakdown.
5. Update affected Help Center guides and focused progress records.
6. Run only low-resource targeted static checks during implementation. Broader tests remain deferred by owner direction.
7. Present the integrated UI for owner visual/product review before final acceptance.

## 5. Acceptance boundary

- Every approved correction is implemented without weakening Journal facts or account scope.
- Help content matches the corrected visible behavior.
- Focused lint, TypeScript/static checks, and source inspection pass for the changed slice.
- No broad test suite or production build runs during the active design-first checkpoint.
- The owner completes the final integrated visual/product review.
