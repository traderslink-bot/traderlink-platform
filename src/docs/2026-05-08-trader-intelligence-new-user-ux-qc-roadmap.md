# Trader Intelligence New-User UX QC Roadmap

**Date:** 2026-05-08  
**Branch reviewed:** `codex/trader-ui-product-pass`  
**Repo:** `traderslink-bot/traderslink-trader-improvement-system`  
**Document type:** Product quality-control review, user-experience roadmap, and Codex implementation guide  
**Primary audience:** Codex, product owner, future frontend implementation sessions  

---

## 1. Purpose

This document captures a product and quality-control review of the current Trader Intelligence direction from the point of view of real end users.

The key concern is that Trader Intelligence is intended to be a trading journal and trade-improvement tool, but the analysis engine is naturally complex. If the product exposes too much internal analytics language, newer traders may not understand the feedback they are being given.

This roadmap explains how to keep the power of the engine while presenting the output in a way that is clear, useful, and not overwhelming.

The main goal is:

> Turn engine intelligence into simple, actionable trader coaching.

The product should not feel like a diagnostic console.

It should feel like a trading coach that says:

> Here is what happened, here is what mattered most, and here is what to fix on the next trade.

---

## 2. Current Branch Context

The current uploaded branch is `codex/trader-ui-product-pass`.

This branch is different from the older engine-only view of the app. It now includes a real TradersLink landing page with beta positioning, SEO metadata, feature sections, pricing, FAQ content, and a visual chart-style hero canvas.

The landing page currently positions TradersLink as a suite of trading tools including:

1. small-cap scanner alerts
2. AI-summarized press releases
3. SEC filing summaries
4. generated chart levels
5. Discord alerts
6. AI chart following coming soon
7. Trader Intelligence coming soon

The page describes Trader Intelligence as the execution-review tool and says it will include broker execution imports, saved trade analytics, session timing, and evidence-backed trade review.

That positioning is good. It makes Trader Intelligence one part of a larger trading-tools platform instead of forcing the homepage to explain the entire journal system immediately.

However, because the journal itself is not yet built as a product surface, the next implementation needs to be careful. The first Trader Intelligence UI should be simple, structured, and beginner-friendly.

---

## 3. High-Level QC Verdict

### Strong

The product direction is strong because TradersLink is not just a generic trading journal. It has a clearer edge:

- scanner context
- press release and filing context
- generated support/resistance levels
- execution review
- AI-style feedback
- Discord-driven trading workflow
- future chart-following intelligence

This creates a strong ecosystem where Trader Intelligence can eventually connect a trader's execution decisions to the same market context that triggered the idea.

### Risky

The biggest UX risk is complexity.

The analysis engine can produce many signals. That is useful internally, but the user should not see every raw signal by default.

Newer traders will likely struggle with terms like:

- normalized pattern
- scoring trace
- suppressed behavior
- dominant family
- primary anchor
- pattern confidence
- structural composite
- support/resistance overlay
- conflict resolution
- behavior classification

Those can exist internally and in advanced mode, but they should not dominate the main trade review screen.

### Best next direction

Build a user-facing explanation layer before building a complex journal dashboard.

The first Trader Intelligence user experience should answer one question first:

> What is the one thing this trade shows I need to fix or reinforce?

---

## 4. Product Principle

Trader Intelligence should be:

1. simple first
2. educational second
3. analytical third
4. technical only when requested

The app should first show the trader a clear trade review summary.

Then it should explain why.

Then it should show evidence.

Then it can offer advanced details.

The default user experience should not start with charts, tables, score traces, raw execution objects, or pattern IDs.

---

## 5. Target Users

### 5.1 Newer traders

Newer traders are the most vulnerable to confusion.

They may not fully understand:

- risk/reward
- chasing
- extension
- support/resistance context
- profit protection
- scaling quality
- averaging down
- exit quality
- position management
- partial exits
- failed breakout behavior
- late entries
- emotional re-entry behavior

For these users, the app must translate each insight into plain English.

A new trader should never have to decode the engine.

### 5.2 Intermediate traders

Intermediate traders will understand some concepts, but still benefit from clarity.

They may want:

- timeline evidence
- entry quality explanation
- exit quality explanation
- support/resistance context
- behavior trends
- recurring mistake detection
- session timing weakness

They need more detail than a beginner, but still not raw engine output by default.

### 5.3 Advanced traders

Advanced users may want:

- exact pattern evidence
- confidence details
- support/resistance measurements
- scoring breakdowns
- family-level pattern grouping
- raw trade timeline facts
- replay-style diagnostics

This should be available behind advanced panels, not placed at the top of the product.

---

## 6. Recommended UX Architecture

### 6.1 Main product layers

The user-facing product should sit above the engine in this order:

1. engine output
2. scoring and coaching output
3. user-facing insight presenter
4. UI card model
5. frontend components

The key missing layer is the user-facing insight presenter.

This layer should convert technical analysis into readable coaching.

### 6.2 User-facing insight presenter responsibility

The presenter should decide:

- what the user sees first
- what gets hidden in advanced mode
- how technical terms are translated
- whether the trade is shown as a mistake, strength, mixed result, or inconclusive result
- what the single fix-first action should be
- what educational tooltip or glossary entry is attached
- how to show confidence honestly without sounding vague

### 6.3 Suggested contract

Create a user-facing summary shape similar to this in a future implementation:

```ts
export interface UserFacingTradeReviewSummary {
  tradeId: string;
  reviewTitle: string;
  gradeLabel: "A" | "B" | "C" | "D" | "F" | "Needs more data";
  outcomeLabel: "Strong" | "Mixed" | "Weak" | "Inconclusive";
  primaryInsight: {
    type: "mistake" | "strength" | "mixed" | "inconclusive";
    title: string;
    plainEnglishSummary: string;
    whyItMatters: string;
    fixFirst: string;
    confidenceLabel: "High" | "Moderate" | "Low";
    confidenceExplanation: string;
  };
  secondaryInsights: Array<{
    title: string;
    summary: string;
    priority: "high" | "medium" | "low";
  }>;
  timelineEvidence: Array<{
    label: string;
    explanation: string;
    timestamp?: string;
    price?: number;
  }>;
  educationLinks: Array<{
    term: string;
    shortDefinition: string;
    anchorId: string;
  }>;
  advancedDetails: {
    patternIds: string[];
    dominantFamily: string | null;
    scoreBand: string | null;
    suppressedBehaviorIds: string[];
    rawConfidence: string;
  };
}
```

The exact type can change, but the product goal should remain the same.

The UI should consume user-facing summaries, not raw engine internals.

---

## 7. Recommended First Trader Intelligence Screens

### 7.1 Trader Intelligence landing section

Since the current homepage already mentions Trader Intelligence coming soon, add a deeper section or future route that explains it in simple terms.

Suggested copy direction:

> Trader Intelligence reviews your trades after they happen. Import executions, connect them to chart context, and get clear feedback on entries, exits, risk, profit protection, and recurring mistakes.

Avoid promising fully automatic perfection.

Avoid language that implies guaranteed trade improvement.

Use phrases like:

- evidence-backed review
- trade behavior feedback
- execution review
- pattern detection
- recurring mistake detection
- trade journaling for active traders

### 7.2 Trade import screen

This should be calm and simple.

Suggested sections:

1. Import broker executions
2. Add candle data or market context
3. Confirm ticker and session
4. Run review

Beginner copy:

> Upload your executions and Trader Intelligence will reconstruct the trade timeline before giving feedback.

Avoid overwhelming users with all engine capabilities at import time.

### 7.3 Single-trade review screen

This is the most important product surface.

Recommended layout:

1. trade result header
2. main issue or main strength
3. what happened
4. why it mattered
5. what to fix next time
6. key evidence timeline
7. supporting insights
8. advanced analysis accordion

The first screen should not start with a chart full of annotations. The feedback should come first.

### 7.4 Trader profile screen

This should come after individual trade review is stable.

Recommended sections:

1. top recurring mistake
2. strongest trading behavior
3. current focus area
4. behavior trends
5. session weakness
6. recent trades feeding the conclusion

Avoid identity labels that feel too harsh.

Instead of:

> You are chase-prone.

Use:

> Recent pattern: your last 5 trades show repeated chase entries.

Instead of:

> You are a weak profit protector.

Use:

> Current focus: protect open profit earlier when trades start to fade.

---

## 8. Single-Trade Review UX Specification

### 8.1 Top card

The top card should answer the entire review in one glance.

Example:

```text
Main issue: You chased the entry.
Trade review: Mixed
Confidence: High
Fix first: Wait for a pullback, reclaim, or cleaner breakout confirmation before sizing in.
```

For a good trade:

```text
Main strength: You protected profit well.
Trade review: Strong
Confidence: High
Reinforce first: Keep reducing risk when open profit starts to fade.
```

For mixed evidence:

```text
Main takeaway: The trade showed both good risk control and a weak entry.
Trade review: Mixed
Confidence: Moderate
Fix first: Improve entry location before increasing size.
```

For low-data cases:

```text
Review status: Needs more data
The app could reconstruct the trade, but there was not enough market context to make a strong coaching claim.
```

### 8.2 What happened card

This should describe the trade path in a small number of plain-English sentences.

Example:

```text
You entered after the stock had already extended.
The trade moved enough to offer opportunity, but the entry location reduced your margin for error.
Your biggest issue was not the ticker. It was paying too much for confirmation.
```

### 8.3 Why it mattered card

Example:

```text
Chasing matters because it usually gives you less upside, worse risk/reward, and less time to react if the move fails.
```

### 8.4 Fix-first card

This should give exactly one action.

Example:

```text
Before entering the next trade, ask:
Am I buying near support, after a pullback, or after a clean breakout hold?
If the answer is no, reduce size or wait.
```

Do not give five fixes at once.

One trade should produce one primary coaching assignment.

### 8.5 Evidence card

Evidence should be human-readable.

Bad:

```text
failed_breakout_chasing detected with behaviorPriorityScore 82.
```

Good:

```text
The entry came after a fast move higher, and price failed to hold the breakout after you entered.
```

### 8.6 Advanced details accordion

Only advanced users should see internal diagnostics by default.

Advanced details may include:

- detected pattern IDs
- normalized primary patterns
- supporting patterns
- score band
- confidence sources
- suppressed behavior IDs
- support/resistance facts
- raw timeline facts

Label this section clearly:

> Advanced analysis details

Do not make it the main screen.

---

## 9. Language Guidelines

### 9.1 Preferred language

Use simple, direct coaching language:

- You entered late.
- You added while the trade was weakening.
- You protected profit well.
- You exited before the trade actually failed.
- You gave back too much open profit.
- You held through danger instead of reducing.
- You improved the trade after a weak start.
- Your re-entry was constructive.
- Your final exit was defensive, not random.

### 9.2 Avoid default technical language

Avoid showing these terms in beginner-facing UI:

- structural composite
- pattern normalization
- suppression rule
- dominant family
- pattern lineage
- conflict resolution
- scoring trace
- behavior class
- normalized role
- anchor pattern
- contextual pattern

These can be shown in advanced mode.

### 9.3 Avoid harsh identity language

Do not label a user as a bad trader.

Avoid:

- You are a chaser.
- You are a bag holder.
- You are revenge trading.
- You are undisciplined.

Use:

- This trade showed chase behavior.
- This trade held through too much danger.
- This trade added risk while price was weakening.
- This trade lacked a clear risk-reduction point.

### 9.4 Avoid unsupported emotional claims

The system can detect behavior. It cannot prove emotion.

Avoid:

- You panicked.
- You were greedy.
- You revenge traded.
- You were scared.

Use:

- The exit looked fear-based from the trade structure.
- The add behaved like an averaging-down rescue attempt.
- The trade showed repeated risk increases during weakness.
- The exit came before the trade had clearly failed.

If emotional-style language is used, it should be framed as structural behavior, not as a certain mental state.

---

## 10. Beginner Education Layer

Every major feedback concept should have an explanation.

The app should include a glossary or inline education cards for terms such as:

- chasing
- profit protection
- averaging down
- adding into weakness
- adding into strength
- premature exit
- failed breakout
- support
- resistance
- reclaim
- breakout
- giveback
- open profit
- risk/reward
- partial exit
- re-entry

### Example education block

```text
What chasing means:
Chasing means entering after the stock has already moved far enough that the risk/reward is worse. It does not always mean the trade is bad, but it usually gives you less room for error.
```

### Example tooltip

```text
Profit protection means reducing risk or tightening your plan after a trade has already offered meaningful open profit.
```

Education should be available without forcing the user away from the trade review.

---

## 11. Confidence Display Rules

The app should explain confidence.

Bad:

```text
Confidence: Moderate
```

Better:

```text
Confidence: Moderate
Why: The trade showed chase behavior, but the exit evidence was mixed because you reduced some risk before the full breakdown.
```

Confidence should help users trust the feedback.

Recommended confidence labels:

1. High confidence
2. Moderate confidence
3. Low confidence
4. Needs more data

### High confidence copy

```text
The evidence was consistent across the entry, trade path, and exit.
```

### Moderate confidence copy

```text
The main behavior was visible, but some parts of the trade gave mixed evidence.
```

### Low confidence copy

```text
The app found some signals, but the trade did not provide enough clean evidence for a strong conclusion.
```

### Needs more data copy

```text
The trade can be logged, but there is not enough market or execution context to generate a reliable coaching takeaway.
```

---

## 12. Support and Resistance UX Rules

Support/resistance context is valuable, but it should be secondary to the main trade story.

The user should see support/resistance as a supporting explanation, not as the whole review.

Bad:

```text
entry_under_resistance_structure detected.
```

Good:

```text
Structure note: your entry was close to overhead resistance, which reduced room for continuation.
```

Bad:

```text
finalExitNearestSupportDistancePct crossed threshold.
```

Good:

```text
Your exit happened near support, and price recovered after you were out.
```

Support/resistance should answer:

- Did the entry have room?
- Was the trader buying into resistance?
- Was the trader selling into support?
- Did the trader add in a good or poor structural location?
- Did the final exit happen at a sensible defensive location?

---

## 13. Dashboard UX Direction

The dashboard should not be a wall of metrics.

Recommended dashboard sections:

### 13.1 This week summary

```text
Main mistake: Chasing entries
Best strength: Cutting losses faster
Focus for next trade: Wait for cleaner entry location
```

### 13.2 Current focus

```text
Your current focus is entry patience.
3 of your last 7 reviewed trades showed late entries after extension.
```

### 13.3 Recent trades

Each trade card should show:

- ticker
- date
- result
- main issue or strength
- confidence
- link to review

### 13.4 Progress

Show behavior trends:

- improving
- stable
- getting worse
- not enough data

Example:

```text
Profit protection: improving
Chase entries: still frequent
Exit patience: mixed
```

---

## 14. Navigation Recommendation

Recommended initial app navigation:

1. Dashboard
2. Trades
3. Review Trade
4. Progress
5. Learn
6. Settings

Avoid making `Patterns` a top-level beginner navigation item at first.

Pattern details can live inside advanced analysis or developer/debug views.

For advanced users, a future `Analytics` or `Advanced` section can expose deeper pattern and scoring views.

---

## 15. Trader Intelligence Product Positioning

The current homepage positions Trader Intelligence as coming soon. Keep that, but clarify the value.

Recommended positioning:

> Trader Intelligence is an execution-review system for active traders. It reconstructs your trades from broker executions, reviews entry quality, trade management, profit protection, and exits, then gives evidence-backed feedback on what to fix next.

Good SEO/product phrases:

- AI trading journal
- trading journal for day traders
- trade review tool
- execution analysis
- day trading analytics
- trade management feedback
- trading behavior analysis
- day trader performance review
- broker execution import
- trading mistake detection

Avoid overclaiming:

- Do not say it predicts winning trades.
- Do not say it guarantees improvement.
- Do not say it gives buy/sell signals.
- Do not present feedback as financial advice.

---

## 16. Recommended Implementation Phases

### Phase 1: Product contract and presenter layer

Build a user-facing review summary layer above the existing coaching/scoring outputs.

Deliverables:

1. user-facing summary type
2. mapper from coaching output to user-facing summary
3. copy rules for beginner-friendly text
4. confidence explanation generator
5. advanced details bundle
6. tests for common feedback cases

Goal:

The UI should receive a clean product-ready object, not raw engine internals.

### Phase 2: Static mock Trade Review UI

Before wiring real user data, build a static mock review page using representative mock summaries.

Mock cases:

1. chase entry
2. poor profit protection
3. premature exit
4. adding into weakness
5. strong profit protection
6. structured execution
7. low-confidence/mixed case
8. needs-more-data case

Goal:

Validate UX clarity before deep integration.

### Phase 3: Trade import shell

Build the trade import shell with clear steps:

1. upload executions
2. validate data
3. attach market context
4. run review

Goal:

Do not overbuild broker integrations yet. Focus on the user journey.

### Phase 4: Single-trade review integration

Wire the review page to actual engine output.

Keep advanced details collapsed.

Goal:

A user should understand the review without knowing anything about the engine.

### Phase 5: Dashboard and trade history

Add a dashboard and recent trade list.

Goal:

Help users see recurring behavior over time.

### Phase 6: Trader profile and progress

Add recurring mistake and strength tracking.

Goal:

Show trends and progress without harsh identity labels.

---

## 17. Testing and QA Requirements

### 17.1 UX copy tests

Add tests that ensure beginner-facing summaries do not expose internal engine terms.

Terms that should not appear in beginner mode:

- patternId
- suppressedBehaviorIds
- normalizedPatterns
- dominantFamily
- behaviorPriorityScore
- structural_composite
- storyline_composite
- PatternInput
- scoreBand
- conflictResolutionReason

These can appear in advanced details only.

### 17.2 Summary priority tests

For each trade review, the app should show one primary insight.

The summary should not produce five equally weighted issues.

Test that:

- one primary insight exists
- fix-first action exists when confidence is not low
- low-confidence cases do not overstate certainty
- strength-first trades can produce reinforcement language instead of only criticism

### 17.3 Beginner readability tests

Use short sentences.

Avoid dense paragraphs.

Recommended maximums:

- headline: 12 words or fewer
- primary summary: 2 to 3 sentences
- fix-first action: 1 clear action or checklist
- evidence cards: 1 idea per card

### 17.4 Advanced details tests

Advanced details should preserve useful internal traceability.

The app should still allow debugging and advanced review without polluting the beginner UI.

---

## 18. Product Copy Examples

### 18.1 Chase entry

```text
Main issue: You chased the entry.

What happened:
You entered after the stock had already extended. That gave the trade less room to work and made the exit harder to manage.

Why it mattered:
Late entries usually reduce risk/reward because you are paying up after the easy part of the move may already be gone.

Fix first:
Before entering, wait for a pullback, reclaim, or clean breakout hold instead of buying the first strong push.
```

### 18.2 Poor profit protection

```text
Main issue: You gave back too much open profit.

What happened:
The trade offered profit, but the exit came after a large part of that opportunity had faded.

Why it mattered:
When a trade has already moved in your favor, protecting part of the gain can keep a winning idea from turning into a frustrating result.

Fix first:
Create a profit-protection rule before entering the trade. Decide when you will reduce or tighten risk if open profit starts to fade.
```

### 18.3 Adding into weakness

```text
Main issue: You added risk while the trade was weakening.

What happened:
Instead of reducing or waiting for structure to repair, the trade increased exposure while price action was getting worse.

Why it mattered:
Adding into weakness can turn a normal losing trade into a much larger problem.

Fix first:
Only add when price is holding structure or proving strength. Do not add just to improve average price.
```

### 18.4 Premature exit

```text
Main issue: You exited before the trade had fully played out.

What happened:
Parts of the trade were managed well, but the final exit came before the move had clearly failed.

Why it mattered:
Cutting winners too early can limit the payoff from trades where your idea was actually working.

Fix first:
Keep a final piece until structure fails or a planned target is reached.
```

### 18.5 Strong profit protection

```text
Main strength: You protected profit well.

What happened:
You reduced risk after the trade offered open profit instead of letting the full gain fade.

Why it mattered:
Good profit protection helps keep winning trades from turning into avoidable frustration.

Reinforce first:
Keep using a planned protection point once a trade has meaningful open profit.
```

### 18.6 Needs more data

```text
Review status: Needs more data.

What happened:
The trade was imported, but the app did not have enough clean market context to produce a reliable coaching takeaway.

Why it mattered:
A weak conclusion can be worse than no conclusion. The app should not pretend to know more than the data supports.

Next step:
Add more complete candle data or review the trade manually.
```

---

## 19. Visual Design Direction

The current landing page has a dark trading-tech aesthetic with cyan, emerald, amber, and slate tones.

Trader Intelligence should visually connect to that brand, but the review UI should be calmer than the landing page.

Suggested UI tone:

- dark background
- high-contrast cards
- calm spacing
- fewer glowing effects inside the journal
- clear hierarchy
- readable body text
- status chips for confidence and focus area
- advanced sections collapsed by default

Avoid making the review page look like a scanner alert feed.

The scanner can be energetic.

The journal should be focused and reflective.

---

## 20. Accessibility Requirements

Codex should keep accessibility in mind from the first UI pass.

Requirements:

- semantic headings
- readable contrast
- keyboard-accessible accordion controls
- descriptive button text
- no important information conveyed only by color
- proper form labels on upload/import screens
- clear focus states
- reduced-motion support for animated chart/canvas elements where applicable

The landing hero canvas is visual only. Product-critical data should not be rendered only in canvas.

---

## 21. SEO and Marketing Connection

The existing homepage is SEO-focused around TradersLink tools. Trader Intelligence should support dedicated SEO pages later.

Possible future pages:

1. `/trader-intelligence/`
2. `/trading-journal-app/`
3. `/trade-review-tool/`
4. `/execution-analysis/`
5. `/learn/trading-journal/`
6. `/learn/how-to-review-your-trades/`
7. `/learn/common-day-trading-mistakes/`
8. `/learn/profit-protection/`
9. `/learn/chasing-stocks/`
10. `/learn/averaging-down/`

These should be content pages, not necessarily app product screens.

Do not mix app implementation with SEO content unless the task explicitly asks for that.

---

## 22. Important Non-Goals For The Next Pass

Do not build everything at once.

Avoid these next-pass mistakes:

1. Do not expose raw pattern IDs in the main UI.
2. Do not build a giant analytics dashboard before the single-trade review is clear.
3. Do not make support/resistance the dominant explanation for every trade.
4. Do not create harsh trader identity labels.
5. Do not imply the app gives financial advice.
6. Do not promise prediction or guaranteed performance improvement.
7. Do not bury the main coaching takeaway below charts and tables.
8. Do not let UI convenience leak back into lower-layer engine contracts.
9. Do not overbuild broker integration before the review experience is validated.
10. Do not use technical engine terms as the default product language.

---

## 23. Codex Implementation Checklist

When Codex starts work from this document, use this checklist.

### Read first

1. this document
2. `src/docs/future-app-surface-plan.md`
3. existing coaching and behavior-analysis types
4. current `app/page.tsx` on `codex/trader-ui-product-pass`
5. current landing hero canvas and global styling

### Then decide

1. Is the task product planning only?
2. Is the task frontend mock UI?
3. Is the task engine-to-UI presenter work?
4. Is the task SEO copy?
5. Is the task integration?

Do not blend all five unless specifically requested.

### First recommended build task

Create a user-facing Trader Intelligence review summary model and mock review UI.

Suggested files could include:

```text
src/lib/user-facing-review/types/user-facing-trade-review-summary.ts
src/lib/user-facing-review/mappers/build-user-facing-trade-review-summary.ts
src/lib/user-facing-review/__tests__/build-user-facing-trade-review-summary.test.ts
app/trader-intelligence/page.tsx
app/trader-intelligence/mock-trade-review-data.ts
```

File paths can change if the current project structure suggests a better home.

The important boundary is:

- engine and coaching internals stay internal
- UI consumes product-ready summaries
- advanced details are available but collapsed

---

## 24. Final Product Direction

Trader Intelligence should be built around this sentence:

> Review the trade, identify the main behavior, explain why it mattered, and give one fix-first action.

That should guide every early product decision.

If a feature does not help the trader understand what to fix next, it should probably wait.

If a piece of data is useful but confusing, put it in advanced details.

If a term is accurate but technical, translate it.

If confidence is low, say so clearly.

If the trade shows a strength, reinforce it instead of always looking for a mistake.

The best version of Trader Intelligence will feel like a calm, evidence-backed trading coach, not a complicated analytics terminal.
