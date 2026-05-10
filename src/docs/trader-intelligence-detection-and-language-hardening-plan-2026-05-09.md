# Trader Intelligence Detection And Language Hardening Plan

Last updated: 2026-05-10

## Status

Active prerequisite plan.

This plan must be worked before additional user-facing UI polish. The UI
depends on detections being trustworthy. If the app confidently names the wrong
behavior, better cards and charts only make the wrong feedback easier to trust.

## Purpose

Make Trader Intelligence detections product-safe, trader-readable, and
consistent across:

- `/coach`
- `/analytics`
- `/review`
- `/progress`
- `/trades`
- `/trades/[tradeId]`

The app must detect real trading behavior, explain it in human trader
language, and show the evidence behind the conclusion.

## Product Rule

No partial, uncertain, or uncertified detection must drive a primary
user-facing conclusion anywhere in the app.

A behavior can be in one of three states:

1. **Certified detection**
   - Can appear in primary coach, analytics, review, progress, saved trades,
     and trade-detail UI.
   - Has a clear trigger contract.
   - Has enough evidence attached for the user to inspect.
   - Has tests for positive cases, negative cases, and boundary cases.
   - Has beginner-readable language.

2. **Review prompt**
   - Can appear as a question, not a conclusion.
   - Example: "Review whether the second entry gave back the first gain."
   - Used when the app has useful evidence but cannot prove the behavior yet.
   - Must not drive top page headlines, risk/strength cards, fix-first actions,
     review queue priority, chart warning counts, progress status, saved-trade
     badges, or trade-detail summary conclusions unless the behavior is later
     certified.

3. **Research/internal signal**
   - Kept out of primary UI.
   - May appear only in admin or advanced/collapsed diagnostics for builders.
   - The visible title, summary, badge, or closed-state text for an advanced
     disclosure must still use plain user-facing language. Raw/internal labels
     can appear only after the user opens the advanced detail.
   - Must not drive any primary user-facing conclusion, priority, warning,
     badge, progress state, or fix-first action.

Do not use "partial support" as a user-facing product state.

## Definitions

Use these definitions when implementing routes, mappers, registries, tests, or
copy checks.

- `Primary user-facing conclusion`: any normal, non-advanced UI statement,
  badge, card, chart value, chart warning, priority, progress state, summary,
  queue reason, fix-first action, or metric explanation that tells the trader a
  behavior happened, mattered, improved the trade, damaged the trade, or should
  be fixed. This includes coach headlines, coach cards, analytics warnings and
  counts, review queue reasons and priority, progress status, saved-trade
  badges, trade-detail summaries, and trade-detail risk/strength cards.
- `Primary UI`: the default page view a normal user sees without opening an
  advanced disclosure, admin page, raw diagnostic panel, or builder-only area.
  This includes visible headings, summaries, badges, and closed-state labels on
  collapsed advanced disclosures.
- `Review prompt`: a question or inspection task that points the user toward
  evidence without claiming the behavior is proven. It can say what to inspect,
  but it must not be counted as a warning, ranked as a risk, scored as a
  problem, or used as the page's fix-first action.
- `Certified detection`: a behavior claim with a detection contract, required
  evidence, negative guards, confidence or fallback rules, beginner-readable
  language, and tests for positive, negative, and boundary cases.
- `Research/internal signal`: a raw or experimental signal for builders. It can
  remain in advanced/collapsed/admin diagnostics, but it cannot influence
  primary conclusions, priorities, warnings, badges, progress states, or
  fix-first actions.
- `Evidence source`: the concrete data used to support a claim, such as
  executions, position timeline, same-symbol thread, candles, generated levels,
  volume bars, saved review answers, or saved review queue state.

## Main Product Goal

For every behavior surfaced to the user, the app must answer:

1. What happened?
2. Why did it matter?
3. What exact evidence supports it?
4. What is the fix-first action?
5. What data was missing, if any?

The app must detect both coaching risks and coaching strengths. It must tell
the trader what to improve and what to keep doing well. A certified strength
needs the same evidence quality as a certified risk.

## Evidence Channels

Use the supporting evidence model when building or certifying detections:

- `src/docs/trader-intelligence-coaching-evidence-model-2026-05-09.md`

Trader Intelligence has two coaching evidence channels:

1. **Execution evidence**
   - Comes from the imported broker CSV and saved trade reconstruction.
   - Includes buys, sells, timestamps, shares, prices, position size, adds,
     reductions, full exits, re-entries, open positions, round trips,
     same-symbol ticker stories, session buckets, and gross realized P/L.
   - Can certify execution-sequence behaviors such as adding before reducing
     risk, poor first reduction, open trades, same-ticker overtrading,
     overtrading a session, day trade turning swing/overnight, good loss
     containment, and strong profit protection when the execution sequence
     proves it.

2. **Market context evidence**
   - Comes from the chart/levels system and candle/volume data around the
     trade.
   - Includes generated support/resistance levels, candles before entry,
     candles during the hold, candles after exit, volume, distance from levels,
     extension, fading volume, post-exit continuation, and whether price held
     or lost structure.
   - Is required before the app can certify claims such as bought near
     resistance, bought far from support, chased an extended move, added into
     chart weakness, volume faded during the second attempt, exited before a
     major continuation, sold near the top, or protected profit before a fade.

Market context must be evaluated in three windows:

- before entry,
- during the trade,
- after exit.

If only execution evidence exists, the app can still coach execution decisions,
but chart-specific feedback must stay a review prompt or show "chart context
waiting."

Historical support/resistance rule:

- Imported trades must use support/resistance and candle context as of the
  trade/session under review, not current live levels.
- Use `src/docs/trader-intelligence-historical-level-context-audit-2026-05-10.md`
  before certifying any new support/resistance, candle, volume, or after-exit
  behavior family.
- Trader Intelligence should consume the levels-system trade-analysis context
  path and its per-execution `levelsSystemExecutionRelations`/market facts for
  user-facing review. A single current/live level snapshot is not enough for
  historical imported-trade coaching.

## Detection Contract

Every user-facing behavior must have a contract with these fields:

- `behaviorId`
- `opportunityType`: `risk_to_reduce | strength_to_repeat | review_prompt | internal_only`
- `evidenceChannel`: `execution_only | market_context | combined`
- `userFacingLabel`
- `plainExplanation`
- `fixFirstAction`
- `requiredEvidence`
- `optionalEvidence`
- `triggerRules`
- `negativeGuards`
- `confidenceRules`
- `unsupportedFallback`
- `advancedHowDetected`
- `routesAllowed`
- `copySafetyNotes`
- `testCases`

Example:

```text
behaviorId: kept_adding_before_reducing_risk
opportunityType: risk_to_reduce
evidenceChannel: execution_only
userFacingLabel: Kept adding before reducing risk
requiredEvidence:
  - initial entry
  - at least two adds after initial entry
  - no meaningful reduction before those adds
negativeGuards:
  - do not call it weakness unless price/candle evidence shows weakness
  - do not call it revenge unless repeated losing re-entry evidence exists
unsupportedFallback:
  - show as "Review your add decisions" instead of a firm conclusion
advancedHowDetected:
  - "Detected because the trade had several add executions before the first
    meaningful reduction."
```

Strength example:

```text
behaviorId: protected_profit_before_fade
opportunityType: strength_to_repeat
evidenceChannel: combined
userFacingLabel: Protected profit before the fade
requiredEvidence:
  - reduction or full exit after open profit
  - post-reduction or post-exit candle window
  - later fade or loss of structure
negativeGuards:
  - do not call it a top exit unless post-exit chart context supports it
  - do not imply future trades should sell at the same level
unsupportedFallback:
  - show as "Review whether the exit protected profit" until market context is
    available
advancedHowDetected:
  - "Detected because the execution reduced exposure before the later chart
    window faded."
```

## Implementation Artifacts And API Direction

Prefer a small shared product-language layer instead of route-local replacement
tables. Exact filenames can adapt to the repo structure, but the implementation
must create one obvious home for the registry, mapper, and tests.

Suggested paths:

- `src/lib/user-facing-behavior/types/user-facing-behavior-contract.ts`
- `src/lib/user-facing-behavior/registry/user-facing-behavior-registry.ts`
- `src/lib/user-facing-behavior/mappers/map-user-facing-behavior.ts`
- `src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts`

The mapper must return an explicit product state, not just a string:

```text
state:
  certified_detection | review_prompt | internal_only
canDrivePrimaryConclusion:
  true | false
label
plainExplanation
evidenceSentence
fixFirstAction
missingDataSentence
advancedHowDetected
routesAllowed
copySafetyNotes
```

Implementation rule:

- routes can choose layout, ordering, links, and visual treatment,
- routes must not invent behavior labels or conclusion copy,
- routes must check `canDrivePrimaryConclusion` before using a behavior in a
  headline, badge, chart warning/count, queue priority, progress state,
  saved-trade badge, trade-detail summary, or fix-first action,
- unknown values must fail closed through the mapper instead of falling back to
  a raw label.

Current implementation status:

- The shared `src/lib/user-facing-behavior` contract/registry/mapper exists and
  carries state, opportunity type, evidence channel, route allow-list,
  fix-first action, missing-data copy, and advanced detection notes.
- Analytics report digests, chart behavior rows, saved-trade selectors,
  improvement intelligence, review-habit/product-polish/product-intelligence
  paths, import preview copy, and core route diagnostics now use product-safe
  mapped language or safe state copy before reaching user-facing UI.
- Decision-review evidence on import preview now renders plain evidence labels
  by default and hides raw calculation strings behind collapsed calculation
  detail.
- The same-symbol trade-thread model is surfaced as a user-facing ticker-story
  layer in coach, analytics, and progress, preserving round-trip accounting
  while giving re-entries, open re-entries, profit giveback, and overnight
  transitions a clear coaching context.
- Same-symbol ticker stories now carry explicit story kinds for single round
  trip, swing transition, open re-entry, profit giveback, re-entry added
  profit, repeated losing attempts, and multiple round trips. Repeated losing
  attempts are guarded so they cannot be mislabeled as profit giveback when no
  positive P/L peak existed.
- Coach, analytics, progress, and saved-trades surfaces now consume those
  story kinds for repeated-loss counts, ticker-story filtering, and story tone
  instead of inferring story meaning from loose P/L or lifecycle checks.
- Saved chart-context insight titles in ticker-story evidence now pass through
  the shared user-facing behavior mapper before appearing in primary UI.
- Decision-review and coaching copy has been tightened for trader readability:
  "limited room before resistance," "open profit was not protected,"
  "during-trade movement," "Added before the trade repaired," and
  "entry had little nearby support" now replace older engine-style phrasing in
  user-facing review paths.
- The first certified market-context behavior contracts now exist in the
  shared user-facing behavior registry:
  - entry near daily/4h resistance,
  - limited room before resistance,
  - entry near daily/4h support,
  - entry with little nearby support,
  - post-exit continuation,
  - chart-backed add-repair risk.
  These require market-context evidence and must not drive conclusions when
  chart context is waiting.
- Execution-feedback risks and strengths that currently surface in product
  read models are covered by mapper regression tests. Certified detections can
  drive primary UI; review prompts cannot.
- The decision-review bridge and quality dashboard now pass the deterministic
  daily/4h support/resistance scenarios. The stale fixture prices were updated
  to sit near the current sample levels instead of weakening the detector.
- The current broad verification baseline passes:
  `npx vitest run src/lib/user-facing-behavior src/lib/trader-analytics src/lib/user-facing-review src/lib/coaching`,
  `npx tsc --noEmit --pretty false`, `npm run build`,
  `npx playwright test tests/e2e/import-dry-run.spec.ts --project=chromium-desktop`,
  and
  `npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop`.
- Saved decision-review market-context insights now pass through the shared
  user-facing behavior mapper before they reach route read models. The saved
  trade-thread model exposes product-ready chart-context findings with
  opportunity type, evidence channel, source, review action, and safe tone.
- `/trades/[tradeId]`, `/review`, `/coach`, `/analytics`, `/progress`, and
  `/trades` now consume those product-ready chart-context findings for cards,
  queue reasons, counts, filters, and advanced hidden-note summaries.
- Short-specific chart-context findings fail closed in normal user routes, and
  prompt-only during-trade measurements remain review prompts instead of
  risk/strength conclusions.
- Support/resistance-aware exit behavior and first-entry versus re-entry
  volume comparison are implemented and verified. The completed route-handoff
  pass now exposes those findings through `priorityMarketContextFindings`,
  support/resistance exit counters, trade-detail chart handoff anchors,
  `/review` chart evidence links, `/trades` support/resistance exit filters,
  and analytics/coach/progress support-resistance exit metric cards.
- Future work should not rebuild those completed handoffs. Continue with a
  separate evidence family such as profit protection before a measured fade,
  strength-to-repeat ticker/session stories, session-story handoffs, or
  mobile/visual polish where the evidence and routes support it.

## Files To Inspect First

Start the implementation run by reading the current detection and language
surfaces, not by changing UI layout.

Primary code paths:

- `src/lib/trader-analytics/product/product-intelligence.ts`
- `src/lib/trader-analytics/product/coach-action-loop.ts`
- `src/lib/trader-analytics/product/coach-overall-focus.ts`
- `src/lib/user-facing-review/mappers/build-user-facing-trade-review-summary.ts`
- `src/lib/user-facing-review/types/user-facing-trade-review-summary.ts`
- `src/lib/pattern-normalization/pattern-metadata.ts`
- `src/lib/trader-analytics/server/saved-trade-threads.ts`
- `src/lib/trader-analytics/server/saved-review-queue.ts`

Primary docs to compare against:

- `src/docs/trader-feedback-capabilities.md`
- `src/docs/behavior-coverage-audit.md`
- `src/docs/layer2-pattern-detection/layer2-implemented-pattern-catalog.md`
- `src/docs/trader-intelligence-behavior-language-and-detection-audit-2026-05-09.md`

Primary route surfaces:

- `app/coach/page.tsx`
- `app/analytics/page.tsx`
- `app/review/page.tsx`
- `app/progress/page.tsx`
- `app/trades/page.tsx`
- `app/trades/[tradeId]/page.tsx`

Do not start by adding a new dashboard card or chart. First prove which
behavior conclusions are allowed to be shown.

## Full Audit Checklist For Run A

Before implementing the registry, audit both code and visible route output.
This prevents a future run from certifying one label while another route still
renders a raw value.

Search code for:

- raw behavior/taxonomy/pattern labels,
- route-local label maps,
- route-local fallback strings,
- review queue lane labels,
- chart warning/count labels,
- progress status labels,
- trade-detail risk/strength labels,
- collapsed disclosure titles and summaries,
- empty states and sample-data labels.

Suggested commands:

```powershell
rg -n "failed premise|premise|pattern|taxonomy|dominant|normalization|suppressed|scoring|diagnostic|analysis_failed|market_context_unavailable|saved_sqlite|fixture|raw json|debug" app src/lib
rg -n "label|reason|headline|summary|badge|pill|lane|status|focus|fixFirst|reviewPrompt" app src/lib/trader-analytics src/lib/user-facing-review
```

If a component directory exists outside `app` or `src/lib`, include it in the
same search before editing routes.

For each hit, decide whether it is:

- primary UI,
- visible collapsed/advanced wrapper,
- expanded advanced detail,
- admin/internal-only,
- test/fixture-only.

Only primary UI and visible collapsed wrappers must be fully user-facing.
Expanded advanced detail can contain builder wording, but it still must not
make unsafe product claims.

## Detection Areas To Certify

### 1. Entry Quality

Behaviors:

- chased entry,
- late entry after extension,
- failed breakout chase,
- bought near resistance,
- bought far from support,
- bought into overhead resistance.

Evidence needed:

- first entry timestamp and price,
- candle window around the entry,
- recent move/extension,
- support/resistance levels from the levels system,
- distance to support/resistance,
- volume context when available.

User-facing output:

- "Bought after the move was already stretched."
- "Bought near overhead resistance."
- "Entry was far from the nearest support area."

### 2. Trade Management And Adds

Behaviors:

- added into weakness,
- added after price moved against the trade,
- kept adding before reducing risk,
- averaged down,
- added into strength constructively,
- built too much size in a losing trade.

Evidence needed:

- ordered executions,
- position size after each execution,
- average price or basis when safe,
- reduction timing,
- candle/price movement after each add when claiming weakness,
- gross/open P/L progression when available.

User-facing output:

- "You added before the trade repaired."
- "You kept adding before taking risk off."
- "This add improved a working trade."

### 3. Profit Protection And Exits

Behaviors:

- profitable trade turned red,
- gave back too much open profit,
- scaled out well,
- sold most or all near the best part of the move,
- exited too early before continuation,
- left major continuation after full exit,
- protected profit into resistance.

Evidence needed:

- max favorable move during hold,
- realized result,
- reductions/exits and size removed,
- post-exit continuation window,
- resistance/support context when used,
- candle data around exit.

User-facing output:

- "The trade gave you profit, but too much was given back."
- "Your partials protected profit well."
- "The stock continued after your exit."

### 4. Re-Entries And Ticker Stories

Behaviors:

- re-entry gave back earlier profit,
- re-entry added profit,
- repeated losing attempts,
- possible revenge re-entry,
- closed day-trade re-entry,
- day trade turned swing,
- re-entry happened after volume faded.

Evidence needed:

- same-symbol same-session trade thread,
- round-trip order,
- P/L by round trip,
- time between exit and re-entry,
- open/closed status,
- session-date crossing,
- volume/candle context when making volume claims.

User-facing output:

- "The second attempt gave back profit from the first push."
- "This re-entry added profit to the ticker story."
- "This became overnight exposure after starting as a day trade."

Language rule:

- Use "possible revenge re-entry" only when repeated loss/re-entry evidence is
  present.
- Do not claim emotional intent as fact.

### 5. Day And Session Behavior

Behaviors:

- overtraded one symbol,
- overtraded the session,
- took too many different tickers,
- kept trading after the best trade,
- green day turned red,
- losses clustered after a prior loss.

Evidence needed:

- session-date grouping,
- ticker count,
- trade count,
- sequence order,
- cumulative P/L by day,
- best-trade point in day,
- trades after best-trade point.

User-facing output:

- "Most of the loss came after the best trade of the day."
- "Too many attempts on one ticker added risk."
- "The session got worse after repeated later trades."

### 6. Support, Resistance, Volume, And Chart Context

Behaviors:

- bought near support,
- bought far from support,
- bought into resistance,
- took profit into resistance,
- added into resistance,
- exit into support before relief or breakdown,
- volume faded during a later re-entry.

Evidence needed:

- levels-system support/resistance output,
- exact level source/basis,
- distance to level,
- candle window,
- volume bars,
- context status showing the data is attached and safe to use.

User-facing output:

- "Entry was close to resistance."
- "The exit happened near support."
- "Volume was lower on the later attempt."

Safety rule:

- If levels/candles/volume are missing, the UI must say "chart context waiting"
  or "execution-only review" instead of making a chart claim.

## Language Layer

Detection and language must be joined. A certified detection is not complete
until it has beginner-readable wording.

Build or refine a shared mapper that returns:

- primary label,
- one-sentence explanation,
- fix-first action,
- evidence sentence,
- advanced "how detected" sentence,
- missing-data sentence,
- severity or strength tone,
- safe route list.

This mapper must replace route-local wording in coach, analytics, review,
progress, saved trades, and trade detail.

The mapper and registry must fail closed:

- A route must never render a raw engine label, pattern ID, taxonomy ID, or
  unknown behavior label in primary UI when the mapper has no certified
  contract for it.
- Collapsed disclosure titles, visible summaries, pills, and badges count as
  primary UI for copy-safety purposes. Only the expanded advanced body may show
  builder/internal detail.
- Unknown or unmapped behavior must become either:
  - a neutral review prompt, if enough evidence exists to ask the trader to
    inspect it, or
  - advanced/internal-only diagnostics, if it is still a builder signal.
- Route-local fallback labels are not allowed for primary behavior conclusions.
  Route code can choose layout, priority, and links, but behavior wording must
  come from the product-facing registry or shared mapper.

## Implementation Runs

### Long Continuous Implementation Run Scope

When the user asks for a longer autonomous work block, treat Runs A-G as a
continuous ladder. Do not stop after creating the inventory artifact if the next
step is mechanically safe and the route/code surface is still clear.

Baseline ladder for the active hardening branch:

Do not restart completed items when the current next-run execution plan says
they are done. Use this ladder as context, then continue from the latest resume
point in `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`
and `src/docs/codex-project-log.md`.

1. Read the project log, plan index, active top-level plan, and this plan.
2. Create or update
   `src/docs/trader-intelligence-detection-contract-inventory-2026-05-09.md`
   with the Run A columns below.
3. Audit the core routes and product-language code for visible raw behavior
   labels, fallback strings, route-local label maps, and collapsed advanced
   disclosure titles.
4. Scaffold the shared user-facing behavior contract, registry, mapper, and
   focused tests under `src/lib/user-facing-behavior/...`.
5. Encode the first highest-risk behavior contracts, starting with:
   - "Added After Failed Premise"
   - "Scaled Losing Position"
   - "Added After Adverse Move"
   - "Revenge-Like Re-Entry Cluster"
   - "Early Winner Exit"
   - "Poor First Reduction"
   - "Overtraded Same Ticker"
   - "Overbuilt Losing Position"
   - "Left Open Position"
   - "Chased Entry"
   - "Breakout Into Overhead Resistance"
   - "Underutilized Winner"
6. Wire the mapper into the first route slice, starting with `/coach`, so any
   primary behavior conclusion must come from the shared allowlist.
7. When the mapper is stable and the next route wiring is mechanical, continue
   to `/trades/[tradeId]`, `/review`, `/analytics`, `/progress`, and `/trades`
   in that order instead of stopping after the first route.
8. Add copy-safety and mapper tests that prove unknown/internal behavior fails
   closed and cannot leak raw labels into primary UI.
9. Run the focused tests and type/build checks listed in Run G.
10. Update the inventory, this plan if scope changed, and
    `src/docs/codex-project-log.md` with the actual resume point.

Local blocker rule:

- If one label, route, or data source blocks progress, park that blocker in the
  inventory or project log and continue with the next independent behavior or
  route.
- Only stop the run for meaningful architecture ambiguity, lower-layer contract
  changes, saved-data safety risk, destructive filesystem/git work, or a
  verification failure that makes later work unreliable.

Do not stop after:

- only creating the inventory artifact,
- replacing one confusing label,
- wiring one route when the same mapper can be safely reused elsewhere,
- discovering missing chart/level evidence for one behavior while execution-only
  behavior contracts can still be completed.

### Run A: Detection Inventory

- Inventory all behavior/taxonomy/pattern IDs that can currently reach user UI.
- Classify each as certified, review prompt, or internal.
- Identify labels that are unclear for traders.
- Identify detections that currently overclaim without chart/level evidence.
- Produce a table in this plan or a companion catalog.
- Preferred companion catalog path:
  `src/docs/trader-intelligence-detection-contract-inventory-2026-05-09.md`.
- Include where each behavior currently appears:
  coach headline, coach evidence, analytics chart, review queue, trade detail,
  saved trades, progress, or advanced-only.
- Include the minimum safe route state for each behavior:
  execution-only, chart-context available, levels available, volume available,
  saved review completed, or thread-level evidence available.
- Use these columns in the inventory table so Run B can move directly into
  implementation:
  - `behaviorIdOrRawLabel`
  - `sourceFiles`
  - `currentUserFacingSurfaces`
  - `proposedState`
  - `requiredEvidence`
  - `availableEvidence`
  - `missingEvidence`
  - `negativeGuards`
  - `minimumSafeRouteState`
  - `allowedRoutes`
  - `defaultUserLabel`
  - `fallbackOrReviewPromptCopy`
  - `testsNeeded`
  - `implementationOwnerFiles`

### Run B: Detection Contract And Registry

- Create a product-facing detection registry.
- Add contract metadata for each certified behavior.
- Add unsupported fallback language for incomplete evidence.
- Ensure every primary user-facing behavior label comes from this registry.
- Treat the registry as an allowlist. If a behavior is missing from the
  registry or marked as review-prompt/internal, primary UI must not display its
  raw label as a conclusion.
- Keep the registry separate from raw engine internals. Engine IDs can map into
  it, but routes must consume the product-facing contract.
- Do not alter importer grouping, saved trade data, candle warehouse files, or
  lower-layer engine contracts just to make UI language easier. If a contract
  needs lower-layer data that does not exist, park the missing field and show a
  review prompt instead.

### Run C: Replace Confusing Labels

- Do this only after Run A classification decides whether the behavior is a
  certified detection, review prompt, or internal signal.
- If the behavior will remain in primary UI as a conclusion, do this only after
  Run B creates its product-facing detection contract.
- Replace "Added After Failed Premise" with "Kept adding before reducing risk."
- Replace vague engine language with trader language.
- Add cautious language for re-entry/revenge-like patterns.
- Add advanced "how detected" copy for each changed behavior.
- If a behavior is internal, remove it from primary UI instead of simply
  renaming it.

### Run D: Certify Core Behaviors

Prioritize these first:

1. kept adding before reducing risk,
2. added into weakness,
3. open-profit giveback,
4. strong profit protection,
5. sold well near the top / protected profit before fade,
6. premature exit / missed continuation,
7. possible revenge re-entry,
8. same-symbol overtrading,
9. bought near resistance / far from support when levels exist,
10. day trade turned swing,
11. session overtrading,
12. structured execution and good loss containment.

Each behavior needs:

- unit tests,
- at least one negative guard test,
- user-facing language test,
- route copy safety test if it appears in UI.
- explicit `opportunityType`,
- explicit `evidenceChannel`,
- a positive or preserve-first action for strengths,
- a fallback review prompt when the required evidence channel is missing.

### Run E: Wire Certified Behaviors Into UI

Route order:

1. `/coach`
2. `/trades/[tradeId]`
3. `/review`
4. `/analytics`
5. `/progress`
6. `/trades`

Rules:

- Primary conclusions on `/coach`, `/analytics`, `/review`, `/progress`,
  `/trades`, and `/trades/[tradeId]` can use only certified detections.
- Any route can show review prompts for uncertain areas, but must label them as
  things to inspect, not conclusions.
- Trade detail can show advanced evidence, but primary copy must stay plain.

### Run F: Copy And Product Safety Tests

Add tests that fail if primary UI shows:

- "failed premise",
- unmapped raw labels,
- raw pattern IDs,
- taxonomy IDs,
- scoring traces,
- suppressed behavior IDs,
- normalization details,
- unsupported chart-context claims,
- unsupported emotional intent.

### Run G: Verification

Run after implementation:

```powershell
npx tsc --noEmit --pretty false
npm run build
npx vitest run src/lib/user-facing-behavior src/lib/trader-analytics src/lib/user-facing-review
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop --grep "coach product loop|guided review workflow|progress and behavior visual surfaces|banned product claims|market context observational"
```

Also smoke:

- `/coach`
- `/analytics`
- `/review`
- `/progress`
- `/trades`
- one saved `/trades/[tradeId]`

## Acceptance Criteria

- No primary user-facing conclusion is based on a partial, uncertain, or
  uncertified detection.
- Uncertain behavior appears as a review prompt or stays internal.
- Every certified primary user-facing conclusion names or links to its evidence
  source.
- Every action-oriented coaching conclusion has a fix-first action.
- Every chart-context claim is gated by actual candle/level/volume data.
- Emotional labels are cautious and evidence-based.
- New traders can understand every primary behavior label.
- Advanced users can still inspect how the detection was made after opening an
  advanced section whose visible title and summary are plain-language.
- Unknown or unmapped behavior labels fail closed into review prompts or
  advanced/internal-only diagnostics.
- Tests prevent raw/internal labels from returning.

## Current Engineer Review Decision

The first implementation slice is complete enough to move into a longer
completion run. Do not stop again after only one additional hardening slice if
the next route or behavior family can be worked safely.

Completed in the current Run A/Run B slice:

- Created the detection contract inventory.
- Added `src/lib/user-facing-behavior` with shared contract types, registry,
  mapper, and fail-closed tests.
- Encoded the first high-risk behavior contracts, including
  `added_after_failed_premise`, adverse adds, overbuilt losing positions, poor
  first reductions, open positions, same-ticker overtrading, and prompt-only
  entry/re-entry/early-exit behaviors.
- Wired `/coach` primary severity, coach action loop, product intelligence,
  improvement visuals, daily coach session leak, and review-habit rule drafts
  through product-safe behavior copy.
- Wired product evidence cards so prompt-only behaviors cannot become primary
  evidence cards in coach/review/progress surfaces.
- Added tests that prevent raw labels such as "failed premise",
  "revenge-like", "Chased Entry", and "Early Winner Exit" from driving primary
  coach/product copy.
- Extended the behavior contract with opportunity type and evidence channel so
  each surfaced behavior can be treated as a risk to reduce, strength to
  repeat, review prompt, or internal-only signal.
- Added the first certified execution-only strengths:
  clean entry/full exit, controlled scale-in, structured partial exits, early
  risk reduction, clean full exits, consistent share sizing, and profitable
  reductions.
- Wired shared report/trade selectors through the user-facing behavior mapper
  so trade detail, analytics, progress, review, and saved-trades surfaces reuse
  the same safe labels instead of route-local wording.
- Replaced primary product copy that used "adverse add", "rapid-fire",
  "open leftover", and "decisive full exit" with trader-readable language.
- Fixed behavior-trend narration so increasing certified strengths read as
  improvement when the favorable direction is up.

Current verification status:

- `npx tsc --noEmit --pretty false` passes.
- `npm run build` passes.
- Focused Vitest suites for user-facing behavior, coaching, decision review,
  saved trade threads, coach overall focus, and analytics report generation
  pass.
- Broad library command
  `npx vitest run src/lib/trader-analytics src/lib/user-facing-behavior src/lib/user-facing-review src/lib/coaching`
  passes.
- Focused desktop Playwright coverage for import dry-run and main app feature
  regression passes.
- The old decision-review level-context failures are resolved; do not treat
  them as parked blockers.
- The user-facing behavior mapper suite now includes certified
  market-context cases and guards against "clean room," "trade-window
  movement," signal, and guaranteed language in visible contract copy.
- Same-symbol ticker-story output has explicit story kinds for profit giveback,
  repeated losing attempts, open re-entry, day-trade-to-swing transition, and
  re-entry added profit. Repeated losing attempts are guarded so they do not
  masquerade as profit giveback.
- Session-story output now exists above ticker stories for full-day execution
  review. Current execution-only session stories include green-to-red session,
  many attempts on one ticker, high trade-count session, open or swing exposure
  to review, positive controlled session, and mixed session review.
- Session-story copy is intentionally execution-evidence based. It can cite
  saved round trips, symbols, open/overnight lifecycle, cumulative P/L peak,
  final P/L, and giveback from peak. It must not claim volume faded, support or
  resistance failed, or emotional revenge intent unless separate certified
  market-context or user-note evidence exists.
- The first chart-context read-model bridge is complete. Product-safe
  market-context findings now flow through saved trade threads, review queue,
  trade detail, analytics, coach, progress, and saved trades without exposing
  raw insight IDs or short-specific coaching in normal routes.
- Focused chart-context bridge verification passes:
  `npx vitest run src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/trader-analytics/__tests__/sqlite-import-commit-repository.test.ts --reporter=dot`
  with 73 tests.
- `npx tsc --noEmit --pretty false`, `npm run build`, and focused
  `tests/e2e/app-feature-regression.spec.ts` desktop route coverage pass after
  the chart-context route handoffs.
- Next run priority correction: adverse-price adds must be audited before more
  coaching polish. Execution-only adverse-add facts can say size was added
  after adverse movement, but they must not imply the add was wrong, weak, or a
  failed dip buy unless market context proves no repair, weakening structure,
  fading volume, nearby resistance, or continued adverse movement after the
  add. The same audit must protect the opposite case: a planned dip buy or
  constructive add should not be mislabeled as a risk when chart/level context
  shows support held, structure repaired, or the trade improved after the add.

Superseded implementation slice:

1. Work from
   `src/docs/trader-intelligence-next-continuous-implementation-run-2026-05-09.md`.
2. Start at the plan's **Required Long-Run Batch Shape** section inside
   **Next Continuous Run Starts Here**. Treat the completed block tracker as
   authoritative for what not to redo.
3. Treat Blocks 1-3, the baseline route-family hardening, the evidence-label
   pass, ticker-story surfacing, first market-context contracts, first
   same-symbol thread-story/session-story hardening, and the first
   chart-context read-model/route bridge as complete unless a regression is
   found.
4. Do not use this older candidate list as active work. The later 2026-05-10
   sections below record completed support/resistance exits, volume comparison,
   protected-profit-before-fade, and strength-to-repeat session stories. For
   new work, add certified behavior contracts only when the evidence is strong
   enough and the family is not already covered.
5. Keep using the shared mapper. Do not add route-local replacement tables.
6. Add route-facing copy-safety tests after the route family pass, not only
   after one file.
7. If focused route tests and TypeScript pass, continue directly into the next
   certifiable behavior family or market-context gate before reporting back.
   A green focused test is a checkpoint, not the end of the run.

Operating loop for the next run:

1. Work one route or behavior family.
2. Run focused verification.
3. Fix any failures caused by the current work.
4. If verification is green, immediately continue into the next route or
   behavior family.
5. Use broader verification after multiple related slices.
6. Treat documentation updates as the end of a larger batch, not as a reason
   to stop after one slice.

The user does not need to approve each verified checkpoint. Codex must verify
and continue until the batch completion target below is reached or a true global
stop condition appears.

Historical completion target for the initial hardening batch:

- All currently surfaced execution-only behaviors are certified, review
  prompts, or internal-only. This baseline is complete for the implemented
  families as of 2026-05-10; keep applying the rule to future behavior
  families.
- No primary user route can show raw/internal behavior labels.
- No review prompt is counted or styled as a proven risk/strength.
- No support/resistance, candle, volume, or post-exit continuation claim can
  appear unless market-context evidence is present.
- The docs/log are updated after the larger completion pass, not after the
  first small slice.

## 2026-05-10 Add-Quality And Chart-Context Evidence Split

Completed in the latest continuous implementation run:

- Downgraded execution-only adverse-add behaviors (`scaled_loser` and
  `add_after_adverse_move`) to review prompts. They can say an add happened
  after adverse movement, but they cannot say the add was bad, weak, a failed
  dip buy, or a mistake without chart/level evidence.
- Preserved certified market-context add conclusions separately:
  - `adds_increased_risk_into_weakness` remains the chart-backed weak-add risk.
  - `adds_aligned_with_strength` remains the constructive add strength.
- Reworded the engine-derived failed-premise behavior in product defaults from
  "Added After Failed Premise" style language to "Added several times before
  reducing size."
- Filtered coach archetype signals to certified observations so prompt-only
  adverse-add detections do not inflate a confident "current pattern."
- Added saved trade-thread read-model counts for add quality, post-exit, level,
  and volume evidence and routed those through analytics, progress, saved
  trades, coach, and trade detail surfaces where useful.
- Added tests for:
  - adverse adds staying prompt-only without chart context,
  - chart-confirmed add weakness remaining certified,
  - constructive add evidence counting as a strength,
  - volume evidence only counting when saved chart-context evidence explicitly
    mentions volume.

Verification completed:

```powershell
npx vitest run src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts src/lib/trader-analytics/__tests__/build-trader-analytics-report.test.ts src/lib/trader-analytics/__tests__/end-user-product-expansion.test.ts src/lib/trader-analytics/__tests__/end-user-product-intelligence.test.ts src/lib/trader-analytics/__tests__/trader-review-habit-loop.test.ts src/lib/trader-analytics/__tests__/trader-coach-action-loop.test.ts --reporter=dot
npx tsc --noEmit --pretty false
npm run build
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop -g "analytics product intelligence|coach product loop|saved trade routing|progress and behavior|guided review workflow|market context observational|banned product claims"
```

Superseded implementation slice:

- Do not rebuild the add-quality prompt/certification split.
- Continue into a not-yet-covered market-context family only if the data can
  support it. First-entry versus re-entry volume comparison and
  support/resistance-aware exit behavior are now completed later in this plan,
  so use this older note only as historical context. The remaining direction is
  post-exit fade/relief behavior not already covered by the completed
  after-exit continuation gate or strength-to-repeat story wording based on
  explicit level/candle evidence.
- If the required candle, level, volume, or post-exit window is missing, keep
  the behavior as a review prompt or internal-only diagnostic and move to the
  next certifiable slice.

This slice is superseded by the later after-exit certification update below.
Do not treat the older continuation-gate wording here as active next work. The
active next work is described by the latest update at the bottom of this file.

## 2026-05-10 Post-Exit And Volume Language Update

Latest completed hardening slice:

- Post-exit and volume evidence now split into risk, strength, and review
  prompt counts instead of one ambiguous evidence total.
- Profit-protection findings now feed the after-exit evidence card.
- Volume evidence cards now use the attached certified finding for their title,
  detail, action, source, and tone.
- Primary user routes now avoid confusing/internal wording for this area:
  - use "after exit" or "after-exit review," not "post-exit checks";
  - use "risk to review" and "strength to repeat," not "risk-backed" or
    "strength-backed";
  - use "chart review," "chart context," or "chart findings," not visible
    hyphenated "chart-context" copy.
- A Playwright copy-safety guard now prevents those phrases from returning to
  core product routes.

Do not rebuild this slice in the next run. The next implementation should move
to a new certifiable market-context behavior family only when real chart,
level, volume, candle, or after-exit evidence supports the claim.

## 2026-05-10 After-Exit Certification And Add-Repair Language Update

Latest completed hardening slice:

- `exit_left_continuation` now requires complete enough after-exit candle
  evidence and a favorable move inside the current calibrated safe range.
- If a premature-exit pattern exists but after-exit candles are missing, the
  user sees the prompt-only finding `exit_needs_post_exit_context`.
- If after-exit candles exist but the favorable move is larger than the current
  calibrated safe range, the user sees the prompt-only finding
  `exit_large_post_exit_move_needs_review`.
- Prompt-only after-exit findings can be shown as review evidence, but they
  must not drive a primary coaching conclusion, risk count, strength count,
  cost driver, or rule recommendation.
- Chart-confirmed add weakness now uses "Added before the trade repaired."
  Execution-only adverse-add evidence still only asks the trader to review
  whether support held, price reclaimed, or the trade repaired before the add.
- Adverse-add rule recommendations now say "Require repair before adding size"
  instead of "Avoid..." or "No adds..." style copy.
- Verification for this slice included focused behavior/decision-review/thread
  tests, TypeScript, production build, and focused Playwright coverage for the
  coach loop, market-context observational copy, and banned product claims.

Do not rebuild this slice in the next run. The older next-candidate examples
from this point, support/resistance-aware exit behavior and first-entry versus
re-entry volume comparison, are completed later in this file. Keep any future
unproven behavior as a review prompt.

## 2026-05-10 Support/Resistance Exit And Re-Entry Volume Update

Latest completed hardening slice:

- Support/resistance-aware exit behavior has moved from next candidate to
  implemented contracts for reductions near resistance, exits that avoided
  adverse follow-through, exits into resistance followed by reversal, exits
  into resistance before measured breakout, exits into support before measured
  breakdown, and exits into support followed by relief as a review prompt.
- First-entry versus re-entry volume comparison has moved from next candidate
  to implemented saved-thread findings when saved snapshot volume evidence is
  available.
- Volume comparison can certify a risk only when later re-entry volume faded
  and the later outcome weakened. It can certify a strength only when later
  volume confirmed and the outcome held up. Missing volume evidence produces
  no volume claim.
- Execution-only adverse-add observations remain review prompts. Analytics can
  drill into the related trades, but fixture expectations and primary coach
  logic must not treat those observations as certified risks without chart
  context.

Do not rebuild this slice in the next run. The next implementation should
not use the older next-candidate list below as active work; route handoffs and
protected-profit-before-fade behavior were completed later. Historical
candidates from this point were:

- route action handoffs for the newly certified support/resistance and volume
  findings,
- profit-protection-before-fade behavior with explicit candle/after-exit
  evidence,
- or strength-to-repeat ticker/session story language backed by explicit
  chart, level, volume, or execution evidence.

## 2026-05-10 Protected-Profit Before Fade Completion

Latest completed hardening slice:

- `protected_profit_before_fade` is now a certified strength-to-repeat behavior
  only when capture and after-exit evidence agree.
- The detector requires:
  - meaningful realized capture,
  - a measured after-exit candle window,
  - after-exit adverse movement greater than favorable continuation,
  - an after-exit window ending flat-to-adverse for the trade direction.
- The user-facing label is "Protected profit before the fade." The app must not
  call this a perfect/top exit, a prediction, or a signal.
- If after-exit candles are missing, or if the chart continued after the exit,
  the protected-profit-before-fade conclusion does not appear.
- The stricter protected-profit card suppresses the older generic "Exit avoided
  a later fade" card so the user gets one clearer repeatable strength.
- Saved trade threads now count this family separately and route the count into
  analytics, coach, progress, saved trades, and trade detail.
- `/trades` now has a protected-before-fade ticker-story filter and badge.

Verification completed:

```powershell
npx vitest run src/lib/user-facing-behavior/__tests__/map-user-facing-behavior.test.ts src/lib/trade-analysis/review/__tests__/build-trade-decision-review.test.ts src/lib/trader-analytics/__tests__/saved-trade-threads.test.ts --reporter=dot
npx vitest run src/lib/user-facing-behavior src/lib/trader-analytics src/lib/user-facing-review --reporter=dot
npx tsc --noEmit --pretty false
npm run build
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-desktop
npx playwright test tests/e2e/app-feature-regression.spec.ts --project=chromium-mobile -g "mobile routes"
git diff --check
```

Do not rebuild this slice in the next run. This note is superseded by the
strength-session completion below. The next implementation should focus on
analytics/coach presentation polish that consumes the certified read models, or
on another evidence family only if chart, level, candle, volume, or after-exit
data can prove it. Keep unproven market-context behavior as a review prompt or
internal-only diagnostic.

## 2026-05-10 Strength-Session And Adverse-Add Language Update

Latest completed hardening slice:

- `strengths_to_repeat_session` is now a saved session-story type when:
  - the session finished green,
  - at least one certified market-context strength exists,
  - no open/swing, repeated-loss, or profit-giveback session concern outranks
    the strength story.
- Strength stories now carry counts for protected-profit, support/resistance,
  volume, and add-quality strengths so the UI can show what is worth
  repeating without implying a trade call or prediction.
- `/review` and `/trades/[tradeId]` now include session-story handoffs. This
  closes the gap where an individual trade review could ignore the broader
  same-day story.
- Primary route copy now says "Protected Profit" or "profit-protection
  strength" instead of hyphenated "protected-before-fade finding" wording.
- Adverse-add language now states the evidence boundary clearly:
  - execution evidence can show size was added after price moved against the
    position;
  - it cannot decide whether this was a planned dip buy, a repaired add, or
    added risk without chart/level context;
  - the visible rule label is "Require Repair Before Adding Size."

Do not rebuild this slice in the next run. The next implementation should
continue with coach/analytics presentation polish that consumes the certified
read models, or with a new evidence family only when chart, level, candle,
volume, or after-exit data can prove the claim.
