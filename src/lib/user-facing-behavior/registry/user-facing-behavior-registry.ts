import type {
  UserFacingBehaviorContract,
  UserFacingBehaviorRoute,
} from "../types/user-facing-behavior-contract";

const CORE_ROUTES: UserFacingBehaviorRoute[] = [
  "/coach",
  "/analytics",
  "/review",
  "/progress",
  "/trades",
  "/trades/[tradeId]",
];

const TRADE_REVIEW_ROUTES: UserFacingBehaviorRoute[] = [
  "/coach",
  "/analytics",
  "/review",
  "/trades/[tradeId]",
];

export const USER_FACING_BEHAVIOR_REGISTRY = [
  {
    behaviorId: "added_after_failed_premise",
    aliases: [
      "Added After Failed Premise",
      "multiple_adds_before_first_reduction",
      "Multiple Adds Before First Reduction",
    ],
    state: "certified_detection",
    tone: "risk",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "execution_only",
    userFacingLabel: "Added several times before reducing size",
    plainExplanation:
      "The position kept getting larger before the trade sold or reduced a meaningful amount.",
    fixFirstAction:
      "Mark where size had to stop increasing unless the chart had clearly repaired.",
    evidenceSentence:
      "Detected from the execution sequence: several adds happened before the first meaningful reduction.",
    missingDataSentence:
      "Chart context can explain whether the trade idea weakened, but it is not required to review the add sequence.",
    requiredEvidence: [
      "ordered executions",
      "at least three adds after the first entry",
      "no meaningful reduction before those adds",
    ],
    optionalEvidence: ["candles around each add", "support/resistance context"],
    triggerRules: [
      "addCountAfterInitialEntry is high",
      "reductionCount is zero or comes after the add cluster",
    ],
    negativeGuards: [
      "Do not say the setup failed from execution-only data.",
      "Do not call this revenge trading without repeated re-entry evidence.",
      "Do not use the word premise in primary UI.",
    ],
    confidenceRules: [
      "High when the add/reduction sequence is clear.",
      "Lower to review prompt if execution ordering is incomplete.",
    ],
    unsupportedFallback:
      "Review the add sequence and mark where size should have stopped increasing.",
    advancedHowDetected:
      "Mapped from added_after_failed_premise after execution evidence shows multiple adds before meaningful risk reduction.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: [
      "Use add/risk language, not failed-premise language.",
      "Keep chart claims out unless candles/levels are attached.",
    ],
    testCases: [
      "three adds before reduction maps to certified add-risk copy",
      "unknown add label fails closed",
    ],
  },
  {
    behaviorId: "scaled_loser",
    aliases: ["Scaled Losing Position"],
    state: "review_prompt",
    tone: "warning",
    opportunityType: "review_prompt",
    evidenceChannel: "execution_only",
    userFacingLabel: "Review adds that need chart context",
    plainExplanation:
      "The trade increased size after price had moved against the current position.",
    fixFirstAction:
      "Check whether each add had repair evidence before treating it as good or bad.",
    evidenceSentence:
      "Detected from adverse-price add evidence in the saved execution summary.",
    missingDataSentence:
      "Chart context is needed to tell whether this was a planned dip buy, a repaired trade, or added risk into weakness.",
    requiredEvidence: ["ordered executions", "adverse price add count"],
    optionalEvidence: ["candle structure after the add", "nearest level context"],
    triggerRules: ["adversePriceAddCount is greater than zero"],
    negativeGuards: [
      "Do not call it averaging down unless below-basis evidence is available.",
      "Do not claim the add was wrong without chart or level evidence showing the trade failed to repair.",
      "Do not label a planned dip buy as a mistake when support held or price repaired.",
    ],
    confidenceRules: [
      "High confidence that an adverse-price add happened when executions and adverse add count agree.",
      "Low confidence on whether the add was good or bad until chart context is attached.",
    ],
    unsupportedFallback:
      "Review each add and decide whether it was a planned dip buy, a repaired trade, or only increased exposure.",
    advancedHowDetected:
      "Mapped from scaled_loser when saved execution evidence shows size increased after adverse movement.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: [
      "Use review language instead of loser jargon.",
      "Do not use as a primary risk without chart-confirmed weakness.",
    ],
    testCases: ["adverse add maps to review-prompt copy"],
  },
  {
    behaviorId: "add_after_adverse_move",
    aliases: [
      "Added After Adverse Move",
      "adverse_price_adds",
      "size_expansion_after_adverse_price",
      "Size Expansion After Adverse Price",
    ],
    state: "review_prompt",
    tone: "warning",
    opportunityType: "review_prompt",
    evidenceChannel: "execution_only",
    userFacingLabel: "Review adds that need chart context",
    plainExplanation:
      "The trade added size after the position already had adverse movement.",
    fixFirstAction:
      "Check whether the trade repaired before the add or kept weakening after it.",
    evidenceSentence:
      "Detected from saved execution facts that count adds after adverse movement.",
    missingDataSentence:
      "Chart context is needed before calling this a weak add, a planned dip buy, or a constructive add.",
    requiredEvidence: ["ordered executions", "adverse movement before add"],
    optionalEvidence: ["candles after add", "support/resistance context"],
    triggerRules: ["risk IDs or adversePriceAddCount show an adverse add"],
    negativeGuards: [
      "Do not say weakness unless candle evidence shows weakening or failed repair.",
      "Do not call the add bad if support held, price reclaimed, or the trade improved after the add.",
      "Do not call it revenge without re-entry evidence.",
    ],
    confidenceRules: [
      "High confidence that the add followed adverse movement when adverse add facts are present.",
      "Do not certify add quality until market context is present.",
    ],
    unsupportedFallback:
      "Inspect each add and decide whether it had repair evidence or only increased exposure.",
    advancedHowDetected:
      "Mapped from add_after_adverse_move using execution-only adverse add facts.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: [
      "Avoid raw adverse-move wording in primary cards.",
      "Do not promote this to a proven risk without market-context evidence.",
    ],
    testCases: ["adverse-move add maps to trader-readable review prompt"],
  },
  {
    behaviorId: "overbuilt_losing_position",
    aliases: ["Overbuilt Losing Position", "overbuilt_position", "Overbuilt Position"],
    state: "certified_detection",
    tone: "risk",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "execution_only",
    userFacingLabel: "Built too much size in a losing trade",
    plainExplanation:
      "The position became much larger while the trade later finished as a gross loser.",
    fixFirstAction:
      "Define a maximum add count or maximum size for trades that have not started working.",
    evidenceSentence:
      "Detected from gross losing outcome plus size expansion or overbuilt-position risk evidence.",
    missingDataSentence:
      "Exact avoidable loss needs deeper context; this only flags the size/risk sequence.",
    requiredEvidence: ["gross losing result", "size expansion or overbuilt risk ID"],
    optionalEvidence: ["max favorable excursion", "support/resistance context"],
    triggerRules: [
      "grossRealizedPnl is negative",
      "overbuilt risk ID or high add count is present",
    ],
    negativeGuards: [
      "Do not estimate alternate P/L.",
      "Do not say every add was wrong.",
    ],
    confidenceRules: ["High when losing outcome and size expansion both exist."],
    unsupportedFallback:
      "Review where size should have stopped increasing.",
    advancedHowDetected:
      "Mapped from overbuilt_losing_position when a losing trade also shows large position expansion.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Keep it about size and loss, not a guaranteed mistake."],
    testCases: ["overbuilt losing trade maps to certified copy"],
  },
  {
    behaviorId: "poor_first_reduction",
    aliases: [
      "Poor First Reduction",
      "small_first_risk_reduction",
      "Small First Risk Reduction",
    ],
    state: "certified_detection",
    tone: "warning",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "execution_only",
    userFacingLabel: "First reduction did not take much risk off",
    plainExplanation:
      "The first trim was too small to materially reduce the position or protect the trade.",
    fixFirstAction:
      "Choose a first-reduction size that actually changes the risk if the trade starts fading.",
    evidenceSentence:
      "Detected from a small-first-risk-reduction signal in the execution summary.",
    missingDataSentence:
      "Open-profit context can explain whether profit was available, but the first-reduction size is execution evidence.",
    requiredEvidence: ["first reduction", "small reduction size"],
    optionalEvidence: ["open profit before reduction", "planned target"],
    triggerRules: ["small_first_risk_reduction risk ID is present"],
    negativeGuards: [
      "Do not say profit was available without open-profit evidence.",
      "Do not say there was no plan without saved review evidence.",
    ],
    confidenceRules: ["High when first-reduction math is available."],
    unsupportedFallback:
      "Replay the first reduction and decide what size would have protected the trade better.",
    advancedHowDetected:
      "Mapped from poor_first_reduction when the first reduction barely changed exposure.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Use reduction/risk language, not judgmental wording."],
    testCases: ["poor first reduction maps to clear profit-protection review copy"],
  },
  {
    behaviorId: "left_open_position",
    aliases: [
      "Left Open Position",
      "Held Losing Trade Too Long",
      "open_position_leftover",
      "Open Position Leftover",
    ],
    state: "certified_detection",
    tone: "risk",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "execution_only",
    userFacingLabel: "Trade was left open",
    plainExplanation:
      "The import ended while shares were still open, so the trade cannot be judged as a fully closed review yet.",
    fixFirstAction:
      "Wait for a closing execution or mark the position as still open before using it as a closed-trade lesson.",
    evidenceSentence:
      "Detected from final position size or open-position flags in the saved execution sequence.",
    missingDataSentence:
      "Later executions may close the position outside the imported window.",
    requiredEvidence: ["final position size", "open-position flag"],
    optionalEvidence: ["later import batch", "overnight status"],
    triggerRules: ["isOpenPosition is true or final position size is not flat"],
    negativeGuards: [
      "Do not classify the whole trade as complete.",
      "Do not treat unrealized exposure as final P/L.",
    ],
    confidenceRules: ["High when the final position is non-flat."],
    unsupportedFallback:
      "Review the final exposure and confirm whether the position was still open.",
    advancedHowDetected:
      "Mapped from left_open_position when the saved execution sequence ends non-flat.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Keep open-trade state separate from closed-trade coaching."],
    testCases: ["open trade maps to non-closed review copy"],
  },
  {
    behaviorId: "overtraded_same_ticker",
    aliases: ["Overtraded Same Ticker"],
    state: "certified_detection",
    tone: "warning",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "execution_only",
    userFacingLabel: "Repeated risky trades on one ticker",
    plainExplanation:
      "The same symbol appears multiple times with risky or losing execution outcomes.",
    fixFirstAction:
      "Compare the same-symbol replays and decide whether a ticker cooldown rule would help.",
    evidenceSentence:
      "Detected from repeated same-symbol saved trades with risk labels or losing outcomes.",
    missingDataSentence:
      "Volume and level context can explain whether later attempts had worse market conditions.",
    requiredEvidence: ["same symbol", "multiple trades", "risk or losing outcome"],
    optionalEvidence: ["same-symbol thread", "volume context", "levels context"],
    triggerRules: ["same symbol has two or more risky/loss rows"],
    negativeGuards: [
      "Do not claim emotional revenge.",
      "Do not merge round trips into one accounting trade.",
    ],
    confidenceRules: [
      "Medium for two same-symbol risky trades.",
      "High for three or more repeated risky trades.",
    ],
    unsupportedFallback:
      "Compare the ticker attempts and decide whether later trades were still part of the same idea.",
    advancedHowDetected:
      "Mapped from overtraded_same_ticker after same-symbol risky trades repeat in the report.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Use same-ticker language rather than overtrader identity labels."],
    testCases: ["same ticker repeat maps to certified copy"],
  },
  {
    behaviorId: "all_or_nothing_exit_after_many_adds",
    aliases: [
      "All-Or-Nothing Exit After Many Adds",
      "All Or Nothing Exit After Many Adds",
    ],
    state: "certified_detection",
    tone: "warning",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "execution_only",
    userFacingLabel: "Many adds before one large exit",
    plainExplanation:
      "The trade built size through several adds and then relied on one large exit sequence.",
    fixFirstAction:
      "Plan an earlier risk reduction so the trade does not depend on one final exit.",
    evidenceSentence:
      "Detected from several add executions followed by a heavy exit sequence.",
    missingDataSentence:
      "The app needs saved review context before deciding whether the exit matched your original plan.",
    requiredEvidence: ["multiple adds", "large final exit or reduction"],
    optionalEvidence: ["saved trade plan", "open-profit path"],
    triggerRules: ["all_or_nothing_exit_after_many_adds risk ID is present"],
    negativeGuards: [
      "Do not say no plan existed without saved review notes.",
      "Do not call the exit wrong without context.",
    ],
    confidenceRules: ["High when add and exit sequence facts are available."],
    unsupportedFallback:
      "Review whether risk was reduced soon enough or left for one final exit.",
    advancedHowDetected:
      "Mapped from all_or_nothing_exit_after_many_adds using execution sequence structure.",
    routesAllowed: TRADE_REVIEW_ROUTES,
    copySafetyNotes: ["Ask about the plan rather than assuming there was none."],
    testCases: ["many-adds one-exit maps to reviewable risk copy"],
  },
  {
    behaviorId: "inconsistent_sizing",
    aliases: [
      "Inconsistent Sizing",
      "inconsistent_share_sizing",
      "Inconsistent Share Sizing",
    ],
    state: "certified_detection",
    tone: "warning",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "execution_only",
    userFacingLabel: "Inconsistent position sizing",
    plainExplanation:
      "Share size changed enough that risk may have been harder to control consistently.",
    fixFirstAction:
      "Set one sizing rule for similar setups and compare future trades against it.",
    evidenceSentence:
      "Detected from share-size variation in the saved execution sequence.",
    missingDataSentence:
      "The app needs your intended risk plan before calling any exact size wrong.",
    requiredEvidence: ["execution share sizes", "sizing variation"],
    optionalEvidence: ["planned risk per trade", "setup quality"],
    triggerRules: ["inconsistent share sizing risk ID is present"],
    negativeGuards: [
      "Do not say size was wrong without account/risk-plan context.",
    ],
    confidenceRules: ["High when size variation is clear in executions."],
    unsupportedFallback:
      "Compare share sizes and decide whether the size changes were intentional.",
    advancedHowDetected:
      "Mapped from inconsistent_sizing when execution sizes vary materially.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Keep this as sizing consistency, not account advice."],
    testCases: ["inconsistent sizing maps to certified review copy"],
  },
  {
    behaviorId: "rapid_fire_execution_cluster",
    aliases: ["Rapid Fire Execution Cluster", "Rapid-Fire Clusters"],
    state: "review_prompt",
    tone: "warning",
    opportunityType: "review_prompt",
    evidenceChannel: "execution_only",
    userFacingLabel: "Review fast execution clusters",
    plainExplanation:
      "Several executions happened close together. That can make decisions harder to review, but it does not prove a mistake by itself.",
    fixFirstAction:
      "Replay the fast sequence and mark whether each click had a planned reason.",
    evidenceSentence:
      "Detected from short gaps between executions or a high execution-per-minute rate.",
    missingDataSentence:
      "Needs trade plan, same-symbol thread context, or chart evidence before becoming a stronger conclusion.",
    requiredEvidence: ["execution timestamps", "execution clustering"],
    optionalEvidence: ["saved plan", "same-symbol thread", "candle context"],
    triggerRules: ["rapidFireGapCount is above zero or executionsPerMinute is high"],
    negativeGuards: [
      "Do not call this revenge or impulsive behavior from speed alone.",
      "Do not use it as the top fix-first action unless a certified risk also supports it.",
    ],
    confidenceRules: ["Review prompt unless another certified behavior confirms the risk."],
    unsupportedFallback:
      "Review whether the fast execution cluster was planned or reactive.",
    advancedHowDetected:
      "Mapped from rapid_fire_execution_cluster when executions were close together in time.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Keep this as a review prompt, not an emotional claim."],
    testCases: ["rapid-fire execution cannot drive primary conclusion"],
  },
  {
    behaviorId: "large_late_add",
    aliases: ["Large Late Add"],
    state: "certified_detection",
    tone: "warning",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "execution_only",
    userFacingLabel: "Added meaningful size late in the trade",
    plainExplanation:
      "The trade increased size after it had already started reducing exposure.",
    fixFirstAction:
      "Before re-adding late, write the condition that proves the trade is working again.",
    evidenceSentence:
      "Detected from add executions that happened after the first reduction.",
    missingDataSentence:
      "Chart context can explain whether the late add had room, but the add timing is execution evidence.",
    requiredEvidence: ["first reduction", "later add", "meaningful add size"],
    optionalEvidence: ["chart structure after re-add", "volume after re-add"],
    triggerRules: ["addsAfterFirstReductionCount is present and add size is meaningful"],
    negativeGuards: [
      "Do not call the late add wrong without market context.",
      "Do not merge this with a separate flat-to-flat round trip.",
    ],
    confidenceRules: ["High when the reduction-then-add order is clear."],
    unsupportedFallback:
      "Review whether the late add had a planned reason.",
    advancedHowDetected:
      "Mapped from large_late_add when meaningful size was added after the first reduction.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Use add timing language instead of blame."],
    testCases: ["late add maps to a certified execution-sequence review"],
  },
  {
    behaviorId: "losing_reduction_sequence",
    aliases: ["Losing Reduction Sequence"],
    state: "certified_detection",
    tone: "warning",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "execution_only",
    userFacingLabel: "Reduced after price was against the entry",
    plainExplanation:
      "At least one reduction happened at a price worse than the prior average entry.",
    fixFirstAction:
      "Replay the hold before that reduction and decide where risk should have been reduced sooner.",
    evidenceSentence:
      "Detected from reduction executions that realized an adverse price versus the prior average entry.",
    missingDataSentence:
      "Market context is needed before saying the chart failed or support broke.",
    requiredEvidence: ["average entry before reduction", "adverse reduction price"],
    optionalEvidence: ["candles before reduction", "support/resistance context"],
    triggerRules: ["losingReductionCount is greater than zero"],
    negativeGuards: [
      "Do not imply a guaranteed better exit.",
      "Do not call the hold wrong without plan or chart evidence.",
    ],
    confidenceRules: ["High when reduction price and prior average entry are known."],
    unsupportedFallback:
      "Review whether the reduction happened later than your plan allowed.",
    advancedHowDetected:
      "Mapped from losing_reduction_sequence when a reduction realized an adverse execution price.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Keep this about reduction timing, not hindsight certainty."],
    testCases: ["losing reduction maps to plain risk-reduction copy"],
  },
  {
    behaviorId: "clean_single_entry_full_exit",
    aliases: ["Clean Single Entry Full Exit"],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "execution_only",
    userFacingLabel: "Clean entry and full exit",
    plainExplanation:
      "The trade used one entry-side execution and one full exit, which makes the decision path easy to review.",
    fixFirstAction:
      "Keep this simple structure when the setup does not need extra adds or partials.",
    evidenceSentence:
      "Detected from one entry-side execution, one full exit, and a return to flat.",
    missingDataSentence:
      "Chart context can judge setup quality, but the clean execution structure is visible from executions.",
    requiredEvidence: ["one entry-side execution", "one full exit", "closed flat"],
    optionalEvidence: ["setup context", "exit context"],
    triggerRules: ["positionIncreaseCount is one, reductionCount is one, and closedToFlat is true"],
    negativeGuards: [
      "Do not imply the entry was good without chart context.",
      "Do not imply this structure fits every trade.",
    ],
    confidenceRules: ["High when the round trip is closed and the execution count is clear."],
    unsupportedFallback:
      "Review whether the clean structure matched the trade plan.",
    advancedHowDetected:
      "Mapped from clean_single_entry_full_exit after a simple entry-to-exit sequence closed flat.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Praise the structure, not the trade idea."],
    testCases: ["clean single-entry full-exit maps to a strength"],
  },
  {
    behaviorId: "controlled_scale_in",
    aliases: ["Controlled Scale In"],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "execution_only",
    userFacingLabel: "Controlled scale-in",
    plainExplanation:
      "The trade added size without adding at an adverse execution price versus the prior average entry.",
    fixFirstAction:
      "Keep requiring the trade to prove itself before adding size.",
    evidenceSentence:
      "Detected from add executions that did not occur at adverse prices versus the prior average entry.",
    missingDataSentence:
      "Chart context is needed before saying the adds were near support or strength.",
    requiredEvidence: ["add executions", "no adverse-price adds"],
    optionalEvidence: ["candle structure", "support/resistance context"],
    triggerRules: ["addCountAfterInitialEntry is present and adversePriceAddCount is zero"],
    negativeGuards: [
      "Do not call the add location good without market context.",
      "Do not treat controlled scale-in as a recommendation to add.",
    ],
    confidenceRules: ["High when add prices and average entry are known."],
    unsupportedFallback:
      "Review what evidence existed before each add.",
    advancedHowDetected:
      "Mapped from controlled_scale_in when added size avoided adverse execution prices.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Use repeat-strength language, not add-signal language."],
    testCases: ["controlled scale-in maps to a certified strength"],
  },
  {
    behaviorId: "structured_partial_exit_sequence",
    aliases: ["Structured Partial Exit Sequence"],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "execution_only",
    userFacingLabel: "Structured partial exits",
    plainExplanation:
      "The position was reduced in stages and eventually returned to flat.",
    fixFirstAction:
      "Keep writing down the reason for each partial so the staged exit stays intentional.",
    evidenceSentence:
      "Detected from multiple reductions followed by a final exit to flat.",
    missingDataSentence:
      "Chart context can explain whether those exits matched levels or a fade.",
    requiredEvidence: ["partial reductions", "closed flat"],
    optionalEvidence: ["planned targets", "post-exit candles"],
    triggerRules: ["partialReductionCount is greater than zero and closedToFlat is true"],
    negativeGuards: [
      "Do not say each partial was optimal without plan or chart context.",
    ],
    confidenceRules: ["High when reductions and flat close are clear."],
    unsupportedFallback:
      "Review whether each partial had a planned reason.",
    advancedHowDetected:
      "Mapped from structured_partial_exit_sequence when staged reductions closed the position.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Praise staged risk control without overclaiming exit quality."],
    testCases: ["structured partial exits map to a repeatable strength"],
  },
  {
    behaviorId: "early_position_risk_reduction",
    aliases: ["Early Position Risk Reduction"],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "execution_only",
    userFacingLabel: "Reduced risk early",
    plainExplanation:
      "The first reduction happened quickly and took off a meaningful part of the open position.",
    fixFirstAction:
      "Keep using a first reduction that actually changes risk when the trade needs protection.",
    evidenceSentence:
      "Detected from first-reduction timing and reduction size versus the prior position.",
    missingDataSentence:
      "Market context can explain whether that reduction came before a fade.",
    requiredEvidence: ["first reduction timing", "first reduction size"],
    optionalEvidence: ["open-profit path", "post-reduction candles"],
    triggerRules: ["first reduction removed at least a meaningful share quickly"],
    negativeGuards: [
      "Do not call it a top exit without post-reduction candles.",
    ],
    confidenceRules: ["High when timing and position-size math are available."],
    unsupportedFallback:
      "Review what triggered the early reduction.",
    advancedHowDetected:
      "Mapped from early_position_risk_reduction when risk was reduced early in the sequence.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Use risk-control praise, not trade advice."],
    testCases: ["early risk reduction maps to a repeatable strength"],
  },
  {
    behaviorId: "decisive_full_exit",
    aliases: ["Decisive Full Exit", "Decisive Full Exits"],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "execution_only",
    userFacingLabel: "Closed the trade cleanly",
    plainExplanation:
      "The execution sequence includes a clear final exit that returned the position to flat.",
    fixFirstAction:
      "Keep closing the trade cleanly when the review plan says the position should be flat.",
    evidenceSentence:
      "Detected from a final full-exit execution and flat ending position.",
    missingDataSentence:
      "Chart context is needed before saying the exit was near the best part of the move.",
    requiredEvidence: ["full exit", "final flat position"],
    optionalEvidence: ["post-exit candles", "planned target"],
    triggerRules: ["closedToFlat is true and fullExitCount is one"],
    negativeGuards: [
      "Do not call it sold the top without market context.",
      "Do not imply future exits should happen at the same price.",
    ],
    confidenceRules: ["High when final position is flat."],
    unsupportedFallback:
      "Review whether the full exit matched your plan.",
    advancedHowDetected:
      "Mapped from decisive_full_exit when the position returned cleanly to flat.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Praise clean closure without chart-specific claims."],
    testCases: ["decisive full exit maps to a certified strength"],
  },
  {
    behaviorId: "consistent_share_sizing",
    aliases: ["Consistent Share Sizing"],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "execution_only",
    userFacingLabel: "Consistent position sizing",
    plainExplanation:
      "Entry-side execution sizes stayed within a tighter range, making the trade easier to review.",
    fixFirstAction:
      "Keep using similar size when the setup and risk are similar.",
    evidenceSentence:
      "Detected from entry-side share sizes staying within a tight range of average size.",
    missingDataSentence:
      "The app still needs your intended risk plan before judging exact size.",
    requiredEvidence: ["entry-side share sizes", "tight size range"],
    optionalEvidence: ["planned risk per trade", "setup type"],
    triggerRules: ["increaseShareSizeRangePctOfAverage stays low"],
    negativeGuards: [
      "Do not imply size is correct without account/risk-plan context.",
    ],
    confidenceRules: ["High when multiple entry-side executions have similar share size."],
    unsupportedFallback:
      "Review whether consistent size matched the trade plan.",
    advancedHowDetected:
      "Mapped from consistent_share_sizing when entry-side execution sizes stayed consistent.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Keep account-risk advice out of the copy."],
    testCases: ["consistent sizing maps to a repeatable strength"],
  },
  {
    behaviorId: "profitable_reduction_sequence",
    aliases: ["Profitable Reduction Sequence"],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "execution_only",
    userFacingLabel: "Reduced at favorable prices",
    plainExplanation:
      "Each reduction happened at a favorable price versus the prior average entry.",
    fixFirstAction:
      "Keep reducing when the trade has paid you, then write what triggered each reduction.",
    evidenceSentence:
      "Detected from reduction executions that realized favorable prices versus the prior average entry.",
    missingDataSentence:
      "Chart context is needed before saying the reductions were near resistance or before a fade.",
    requiredEvidence: ["reduction executions", "favorable reduction prices"],
    optionalEvidence: ["post-reduction candles", "support/resistance context"],
    triggerRules: ["profitableReductionCount equals reductionCount"],
    negativeGuards: [
      "Do not say perfect exit or top tick without market context.",
    ],
    confidenceRules: ["High when every reduction price is favorable versus prior average entry."],
    unsupportedFallback:
      "Review what made the reduction timing repeatable.",
    advancedHowDetected:
      "Mapped from profitable_reduction_sequence when all reductions had favorable execution prices.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Use favorable execution language, not hindsight perfection."],
    testCases: ["profitable reductions map to a certified strength"],
  },
  {
    behaviorId: "entry_near_daily_4h_resistance",
    aliases: ["Entry was close to daily/4h resistance"],
    state: "certified_detection",
    tone: "risk",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "market_context",
    userFacingLabel: "Entry was close to resistance",
    plainExplanation:
      "The first entry started close to a higher-timeframe resistance area.",
    fixFirstAction:
      "Before entering near resistance, define the proof that the trade has enough room to keep working.",
    evidenceSentence:
      "Detected from levels-system daily/4h resistance distance and strength evidence.",
    missingDataSentence:
      "Needs daily/4h support and resistance context before this can be shown as a conclusion.",
    requiredEvidence: [
      "levels-system daily/4h resistance",
      "first entry price",
      "distance to nearest resistance",
      "resistance strength",
    ],
    optionalEvidence: ["reaction count", "trade-window candles", "volume context"],
    triggerRules: [
      "nearest daily/4h resistance exists",
      "first entry is within the configured resistance-distance threshold",
    ],
    negativeGuards: [
      "Do not show without levels-system market context.",
      "Do not call it a sell signal or imply the trade could not work.",
    ],
    confidenceRules: ["High when distance and level strength are both present."],
    unsupportedFallback:
      "Wait for chart context, then review whether the entry was too close to resistance.",
    advancedHowDetected:
      "Mapped from entry_near_daily_4h_resistance when the decision-review layer finds the first fill near daily/4h resistance.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: [
      "Use resistance-location language only when market context is attached.",
    ],
    testCases: ["near resistance maps to certified market-context copy"],
  },
  {
    behaviorId: "entry_limited_clean_room_to_resistance",
    aliases: [
      "Entry had limited clean room",
      "Entry had limited room before resistance",
    ],
    state: "certified_detection",
    tone: "risk",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "market_context",
    userFacingLabel: "Entry had limited room before resistance",
    plainExplanation:
      "The entry did not leave much nearby room before the next resistance area.",
    fixFirstAction:
      "Check the distance to resistance before entering and decide whether the reward path is wide enough.",
    evidenceSentence:
      "Detected from first-entry price compared with the nearest daily/4h resistance level.",
    missingDataSentence:
      "Needs support/resistance context before the app can judge room to resistance.",
    requiredEvidence: [
      "first entry price",
      "nearest daily/4h resistance",
      "distance to resistance",
    ],
    optionalEvidence: ["resistance strength", "recent candle extension"],
    triggerRules: [
      "entry is below or near resistance",
      "distance to resistance is below the configured room threshold",
    ],
    negativeGuards: [
      "Do not call it bad risk/reward without knowing the trader's plan.",
      "Do not use the phrase clean room in primary UI.",
    ],
    confidenceRules: ["High when the level and distance are both available."],
    unsupportedFallback:
      "Review whether the entry had enough room before the next resistance area.",
    advancedHowDetected:
      "Mapped from entry_limited_clean_room_to_resistance after distance-to-resistance evidence is attached.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Say limited room before resistance, not clean room."],
    testCases: ["limited room maps without clean-room wording"],
  },
  {
    behaviorId: "entry_near_daily_4h_support",
    aliases: ["Entry was close to daily/4h support"],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "market_context",
    userFacingLabel: "Entry was close to support",
    plainExplanation:
      "The first entry started near a higher-timeframe support area.",
    fixFirstAction:
      "Keep checking whether entries are near a real support area instead of chasing away from it.",
    evidenceSentence:
      "Detected from levels-system daily/4h support distance and strength evidence.",
    missingDataSentence:
      "Needs daily/4h support context before the app can praise entry location.",
    requiredEvidence: [
      "levels-system daily/4h support",
      "first entry price",
      "distance to nearest support",
      "support strength",
    ],
    optionalEvidence: ["support reaction count", "trade-window candles"],
    triggerRules: [
      "nearest daily/4h support exists",
      "first entry is within the configured support-distance threshold",
    ],
    negativeGuards: [
      "Do not imply support will hold in the future.",
      "Do not turn support proximity into a buy signal.",
    ],
    confidenceRules: ["High when distance and level strength are both present."],
    unsupportedFallback:
      "Wait for chart context, then review whether the entry had nearby support.",
    advancedHowDetected:
      "Mapped from entry_near_daily_4h_support when the decision-review layer finds the first fill near daily/4h support.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Praise the reviewed location without making a signal claim."],
    testCases: ["near support maps to certified strength copy"],
  },
  {
    behaviorId: "entry_far_from_daily_4h_support",
    aliases: ["Entry was not close to support", "Entry had little nearby support"],
    state: "certified_detection",
    tone: "warning",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "market_context",
    userFacingLabel: "Entry had little nearby support",
    plainExplanation:
      "Daily/4h context was available, but the first fill was not near a clear support area.",
    fixFirstAction:
      "Before entering, check whether the closest support is close enough to define risk.",
    evidenceSentence:
      "Detected from levels-system support context showing no nearby daily/4h support at entry.",
    missingDataSentence:
      "Needs daily/4h support context before this can be shown as a conclusion.",
    requiredEvidence: [
      "daily/4h support context",
      "first entry price",
      "nearest support unavailable or too far away",
    ],
    optionalEvidence: ["intraday support", "trade-window candles"],
    triggerRules: [
      "market context is present",
      "nearest support is unavailable or outside the configured distance threshold",
    ],
    negativeGuards: [
      "Do not show when support data is missing.",
      "Do not say the trade should not have been taken.",
    ],
    confidenceRules: ["High only when market context is present but not supportive."],
    unsupportedFallback:
      "Wait for chart context, then review whether the entry had nearby support.",
    advancedHowDetected:
      "Mapped from entry_far_from_daily_4h_support when support context is present but not close enough.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Separate unavailable support data from present-but-weak support context."],
    testCases: ["far-from-support maps only as market-context copy"],
  },
  {
    behaviorId: "exit_left_continuation",
    aliases: ["Exit came before more continuation"],
    state: "certified_detection",
    tone: "warning",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "market_context",
    userFacingLabel: "Exit came before more continuation",
    plainExplanation:
      "The post-exit chart window showed additional favorable movement after the trade was closed.",
    fixFirstAction:
      "Review whether the final exit had a planned reason or whether a runner rule would have helped.",
    evidenceSentence:
      "Detected from post-exit candle movement after the final exit.",
    missingDataSentence:
      "Needs safe post-exit candle context before the app can say continuation was left behind.",
    requiredEvidence: [
      "final exit timestamp",
      "post-exit candle window",
      "max favorable move after exit",
    ],
    optionalEvidence: ["support/resistance context", "saved exit plan"],
    triggerRules: [
      "post-exit movement is favorable by more than the configured threshold",
      "post-exit candle basis is safe for review",
    ],
    negativeGuards: [
      "Do not show from execution-only data.",
      "Do not say guaranteed missed profit or that the user should have held.",
    ],
    confidenceRules: ["High when post-exit candle evidence is aligned and complete."],
    unsupportedFallback:
      "Review whether the exit was early once post-exit chart context is available.",
    advancedHowDetected:
      "Mapped from exit_left_continuation when post-exit candles show favorable continuation after the final exit.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Use hindsight carefully and never turn continuation into trade advice."],
    testCases: ["post-exit continuation requires market-context evidence"],
  },
  {
    behaviorId: "exit_needs_post_exit_context",
    aliases: ["Exit needs after-exit chart check"],
    state: "review_prompt",
    tone: "warning",
    opportunityType: "review_prompt",
    evidenceChannel: "market_context",
    userFacingLabel: "Exit needs after-exit chart check",
    plainExplanation:
      "The execution pattern makes the exit worth reviewing, but after-exit candles are not complete enough for a confident continuation call.",
    fixFirstAction:
      "Use the execution replay now, then rerun chart review when after-exit candles are available.",
    evidenceSentence:
      "Detected from an exit-quality pattern with missing or incomplete after-exit candle evidence.",
    missingDataSentence:
      "Needs final exit time plus aligned after-exit candles before the app can say continuation was left behind.",
    requiredEvidence: [
      "final exit timestamp",
      "after-exit candle window",
      "max favorable move after exit",
    ],
    optionalEvidence: ["saved exit plan", "support/resistance context"],
    triggerRules: [
      "premature-exit or missed-continuation pattern appears",
      "post-exit candle evidence is missing or incomplete",
    ],
    negativeGuards: [
      "Do not show as a certified missed-continuation conclusion.",
      "Do not say the user should have held.",
    ],
    confidenceRules: ["Prompt-only until after-exit candle evidence is aligned."],
    unsupportedFallback:
      "Review whether the exit had a planned reason, then wait for after-exit chart context before making a continuation conclusion.",
    advancedHowDetected:
      "Mapped from exit_needs_post_exit_context when exit-quality patterns exist but post-exit candles are missing or incomplete.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: [
      "Use after-exit chart check language instead of missed-profit language.",
      "Keep it as a prompt, not a coaching conclusion.",
    ],
    testCases: ["missing post-exit candles create prompt-only exit review"],
  },
  {
    behaviorId: "exit_large_post_exit_move_needs_review",
    aliases: ["Large after-exit move needs review"],
    state: "review_prompt",
    tone: "warning",
    opportunityType: "review_prompt",
    evidenceChannel: "market_context",
    userFacingLabel: "Large after-exit move needs review",
    plainExplanation:
      "The after-exit chart move is larger than the current calibrated safe range, so it needs manual review before the app makes a confident continuation claim.",
    fixFirstAction:
      "Check whether the after-exit move is real, aligned to the same symbol and price basis, and connected to the same trade idea.",
    evidenceSentence:
      "Detected from an exit-quality pattern plus an after-exit move outside the current calibrated safe range.",
    missingDataSentence:
      "Needs calibrated after-exit context before this can become a certified continuation finding.",
    requiredEvidence: [
      "final exit timestamp",
      "after-exit candle window",
      "price-basis validation",
      "calibrated continuation threshold",
    ],
    optionalEvidence: ["support/resistance context", "volume context"],
    triggerRules: [
      "premature-exit or missed-continuation pattern appears",
      "after-exit move exceeds the current calibrated safe range",
    ],
    negativeGuards: [
      "Do not call it money left behind until calibration proves the move is usable.",
      "Do not imply a future hold decision.",
    ],
    confidenceRules: ["Prompt-only until large after-exit moves are calibrated."],
    unsupportedFallback:
      "Review the after-exit move manually before turning it into a coaching conclusion.",
    advancedHowDetected:
      "Mapped from exit_large_post_exit_move_needs_review when post-exit continuation evidence is present but outside the calibrated safe range.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: [
      "Treat very large after-exit moves as chart review prompts until calibrated.",
      "Avoid hindsight claims and guaranteed alternate outcomes.",
    ],
    testCases: ["large post-exit moves stay prompt-only until calibrated"],
  },
  {
    behaviorId: "adds_increased_risk_into_weakness",
    aliases: [
      "Added while price was moving against the trade",
      "Added before the trade repaired",
    ],
    state: "certified_detection",
    tone: "risk",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "market_context",
    userFacingLabel: "Added before the trade repaired",
    plainExplanation:
      "Later size was added after adverse movement, and the chart evidence did not show a clear repair first.",
    fixFirstAction:
      "Require the trade to repair before adding size after adverse movement.",
    evidenceSentence:
      "Detected from add timing plus during-trade chart evidence showing the trade had not clearly repaired before size increased.",
    missingDataSentence:
      "Execution data can show that size was added after adverse movement, but chart context is needed before calling it unrepaired.",
    requiredEvidence: [
      "add executions",
      "during-trade chart movement around the add",
      "safe candle or market-context basis",
    ],
    optionalEvidence: ["support/resistance context", "volume context"],
    triggerRules: [
      "add happens after adverse during-trade chart movement",
      "candle or market-context basis is safe for review",
    ],
    negativeGuards: [
      "Do not say weakness from execution-only adverse-price evidence.",
      "Do not label a planned dip buy as a mistake when support held or price repaired.",
      "Do not claim emotional intent.",
    ],
    confidenceRules: ["High when add timing and trade-window evidence agree."],
    unsupportedFallback:
      "Review each add and check whether support held, price reclaimed, or the trade had otherwise repaired first.",
    advancedHowDetected:
      "Mapped from adds_increased_risk_into_weakness when add timing is confirmed by during-trade chart evidence.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Keep weakness claims gated behind market context."],
    testCases: ["weakness add requires market-context evidence"],
  },
  {
    behaviorId: "stacked_daily_4h_resistance_above_entry",
    aliases: ["Resistance was stacked above the entry"],
    state: "certified_detection",
    tone: "risk",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "market_context",
    userFacingLabel: "Resistance was stacked above the entry",
    plainExplanation:
      "Multiple higher-timeframe resistance areas were overhead, so the trade had more chart structure to work through.",
    fixFirstAction:
      "Before entering under stacked resistance, decide what proves the move has enough room to continue.",
    evidenceSentence:
      "Detected from levels-system daily/4h resistance levels above the first entry.",
    missingDataSentence:
      "Needs daily/4h support and resistance context before stacked resistance can be reviewed.",
    requiredEvidence: ["daily/4h resistance levels", "first entry price"],
    optionalEvidence: ["distance to each resistance level", "reaction strength"],
    triggerRules: ["multiple resistance levels sit above the entry within the configured cluster"],
    negativeGuards: [
      "Do not say the trade could not work.",
      "Do not turn resistance into a sell signal.",
    ],
    confidenceRules: ["High when level count and distance evidence are present."],
    unsupportedFallback:
      "Wait for chart context, then review whether overhead resistance was crowded.",
    advancedHowDetected:
      "Mapped from stacked_daily_4h_resistance_above_entry when levels-system finds multiple resistance areas above entry.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Use overhead structure language, not trade-call language."],
    testCases: ["stacked resistance maps to certified chart-context copy"],
  },
  {
    behaviorId: "breakout_had_room_above",
    aliases: ["Breakout had room above"],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "market_context",
    userFacingLabel: "Breakout had room above",
    plainExplanation:
      "After nearby resistance was cleared, the chart had higher-timeframe room for continuation.",
    fixFirstAction:
      "When a breakout clears resistance with room above, write down what made that entry structure repeatable.",
    evidenceSentence:
      "Detected from levels-system resistance context and room-to-next-level evidence.",
    missingDataSentence:
      "Needs support/resistance context before the app can praise room above.",
    requiredEvidence: ["cleared nearby resistance", "room to next resistance"],
    optionalEvidence: ["trade-window follow-through", "volume context"],
    triggerRules: ["entry clears nearby resistance and has configured room to the next resistance area"],
    negativeGuards: [
      "Do not imply the breakout was guaranteed to continue.",
      "Do not call it a buy signal.",
    ],
    confidenceRules: ["High when both cleared-resistance and room evidence are present."],
    unsupportedFallback:
      "Wait for chart context, then review whether the breakout had room to continue.",
    advancedHowDetected:
      "Mapped from breakout_had_room_above after levels-system confirms room above cleared resistance.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Praise the reviewed structure without future-looking language."],
    testCases: ["breakout room maps as a repeatable strength"],
  },
  {
    behaviorId: "entry_chase_or_late_extension",
    aliases: ["Entry came after the move was extended"],
    state: "certified_detection",
    tone: "warning",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "market_context",
    userFacingLabel: "Entry came after extension",
    plainExplanation:
      "The entry happened after meaningful favorable movement had already occurred.",
    fixFirstAction:
      "Before entering after extension, mark the nearest cleaner pullback or proof level that would make the entry less rushed.",
    evidenceSentence:
      "Detected from candle and trade-window context around the first entry.",
    missingDataSentence:
      "Needs candle or level context before extension can be reviewed as a chart conclusion.",
    requiredEvidence: ["first entry timestamp", "pre-entry movement", "trade-window or candle context"],
    optionalEvidence: ["support/resistance location", "volume context"],
    triggerRules: ["entry follows a configured recent run-up or late favorable extension"],
    negativeGuards: [
      "Do not call the trader impulsive.",
      "Do not show from execution speed alone.",
    ],
    confidenceRules: ["High when pre-entry movement and first-entry location are both available."],
    unsupportedFallback:
      "Review whether the entry came after the easy part of the move was already gone.",
    advancedHowDetected:
      "Mapped from entry_chase_or_late_extension when chart context shows the first entry followed extension.",
    routesAllowed: TRADE_REVIEW_ROUTES,
    copySafetyNotes: ["Use extension language, not an accusation."],
    testCases: ["late-extension entry maps to safe review language"],
  },
  {
    behaviorId: "entry_had_constructive_location",
    aliases: ["Entry had constructive location evidence"],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "market_context",
    userFacingLabel: "Entry location was constructive",
    plainExplanation:
      "The entry had chart evidence that left room for the trade to work.",
    fixFirstAction:
      "Write down what made this entry location cleaner so it can be repeated intentionally.",
    evidenceSentence:
      "Detected from entry structure, favorable room, and trade-window context.",
    missingDataSentence:
      "Needs candle or level context before the app can praise entry location.",
    requiredEvidence: ["entry structure", "favorable room after entry"],
    optionalEvidence: ["support nearby", "room to resistance"],
    triggerRules: ["entry structure leaves meaningful favorable room"],
    negativeGuards: [
      "Do not imply the trade was guaranteed to work.",
      "Do not convert constructive location into a signal.",
    ],
    confidenceRules: ["High when entry structure and remaining-room evidence agree."],
    unsupportedFallback:
      "Review whether the entry had enough room to work once chart context is available.",
    advancedHowDetected:
      "Mapped from entry_had_constructive_location after chart-context entry structure is available.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Use repeatable structure language without future guarantees."],
    testCases: ["constructive entry location maps to strength copy"],
  },
  {
    behaviorId: "entry_breakout_failed",
    aliases: ["Breakout did not hold"],
    state: "certified_detection",
    tone: "risk",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "market_context",
    userFacingLabel: "Breakout did not hold",
    plainExplanation:
      "The entry had breakout-style structure, but follow-through did not hold after entry.",
    fixFirstAction:
      "For breakout-style entries, define the failed-breakout line that stops adding or forces review.",
    evidenceSentence:
      "Detected from breakout structure and chart follow-through after the entry.",
    missingDataSentence:
      "Needs chart context before failed breakout structure can be reviewed.",
    requiredEvidence: ["breakout-style entry", "post-entry follow-through"],
    optionalEvidence: ["support/resistance level", "volume context"],
    triggerRules: ["failed breakout entry structure is present"],
    negativeGuards: [
      "Do not say the user should not have entered.",
      "Do not call it a failed setup without chart evidence.",
    ],
    confidenceRules: ["High when breakout structure and failed follow-through are both present."],
    unsupportedFallback:
      "Review whether the breakout held after entry once chart context is available.",
    advancedHowDetected:
      "Mapped from entry_breakout_failed when chart context identifies failed breakout structure.",
    routesAllowed: TRADE_REVIEW_ROUTES,
    copySafetyNotes: ["Use observed follow-through language only."],
    testCases: ["failed breakout maps to supportable risk copy"],
  },
  {
    behaviorId: "winner_stayed_undersized",
    aliases: ["Winner stayed too small"],
    state: "certified_detection",
    tone: "warning",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "combined",
    userFacingLabel: "Winner was not pressed much",
    plainExplanation:
      "The trade produced useful favorable movement, but position size stayed limited relative to that opportunity.",
    fixFirstAction:
      "Review whether the setup deserved a planned add or whether staying small was intentional risk control.",
    evidenceSentence:
      "Detected from favorable movement, position-building evidence, and the trade's available move.",
    missingDataSentence:
      "Needs favorable movement and position-building evidence before this can be reviewed.",
    requiredEvidence: ["favorable movement", "position-building count"],
    optionalEvidence: ["support/resistance context", "user sizing plan"],
    triggerRules: ["winner opportunity exists while position building remains limited"],
    negativeGuards: [
      "Do not say the user should have added size.",
      "Do not ignore the user's risk plan.",
    ],
    confidenceRules: ["High when favorable movement and limited position building are both clear."],
    unsupportedFallback:
      "Review whether staying small was intentional risk control or an under-pressed winner.",
    advancedHowDetected:
      "Mapped from winner_stayed_undersized when favorable movement exists but position building stayed limited.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Frame as review, not a command to size up."],
    testCases: ["under-pressed winner maps without trading advice"],
  },
  {
    behaviorId: "adds_aligned_with_strength",
    aliases: ["Adds aligned with strength"],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "combined",
    userFacingLabel: "Adds followed strength",
    plainExplanation:
      "The add evidence shows size increases happening after constructive movement.",
    fixFirstAction:
      "Keep documenting what proof was present before adding into strength.",
    evidenceSentence:
      "Detected from add timing and favorable movement before the add sequence.",
    missingDataSentence:
      "Needs add timing and movement evidence before the app can praise the add sequence.",
    requiredEvidence: ["add executions", "favorable movement before adds"],
    optionalEvidence: ["support/resistance context", "volume context"],
    triggerRules: ["adds happen after constructive movement"],
    negativeGuards: [
      "Do not call every add good without outcome and risk context.",
      "Do not imply future continuation.",
    ],
    confidenceRules: ["High when add timing and favorable movement agree."],
    unsupportedFallback:
      "Review whether the adds had proof before size increased.",
    advancedHowDetected:
      "Mapped from adds_aligned_with_strength when add timing followed constructive movement.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Praise process evidence, not a guaranteed outcome."],
    testCases: ["strength-aligned adds map to repeatable behavior"],
  },
  {
    behaviorId: "adds_after_trade_already_used_range",
    aliases: ["Adds came after much of the move was already used"],
    state: "certified_detection",
    tone: "risk",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "market_context",
    userFacingLabel: "Added after much of the move was used",
    plainExplanation:
      "Later size was added high in the recent move, after a large part of the trade's available range had already happened.",
    fixFirstAction:
      "Before adding late, require fresh proof that the trade still has enough room to pay for the added risk.",
    evidenceSentence:
      "Detected from add location in the recent range and during-trade movement.",
    missingDataSentence:
      "Needs candle or range context before late-add range use can be reviewed.",
    requiredEvidence: ["add executions", "recent range position", "trade-window movement"],
    optionalEvidence: ["support/resistance context", "volume context"],
    triggerRules: ["average add price sits high in recent range"],
    negativeGuards: [
      "Do not say the add was wrong without plan context.",
      "Do not claim volume faded unless volume evidence exists.",
    ],
    confidenceRules: ["High when add range location and trade-window evidence are present."],
    unsupportedFallback:
      "Review whether late adds still had enough room to justify the added risk.",
    advancedHowDetected:
      "Mapped from adds_after_trade_already_used_range when add price sat high in the recent range.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Use range-use language, not hindsight blame."],
    testCases: ["late range add maps to certified risk copy"],
  },
  {
    behaviorId: "adds_near_daily_4h_resistance",
    aliases: ["Adds happened near daily/4h resistance"],
    state: "certified_detection",
    tone: "risk",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "market_context",
    userFacingLabel: "Adds were near resistance",
    plainExplanation:
      "One or more adds increased size while price was close to higher-timeframe resistance.",
    fixFirstAction:
      "Before adding near resistance, define what proves the level has cleared or that risk is still controlled.",
    evidenceSentence:
      "Detected from add executions compared with daily/4h resistance context.",
    missingDataSentence:
      "Needs support/resistance context before add location can be judged.",
    requiredEvidence: ["add executions", "daily/4h resistance", "distance from add to resistance"],
    optionalEvidence: ["reaction strength", "volume context"],
    triggerRules: ["one or more adds occur near resistance"],
    negativeGuards: [
      "Do not say never add near resistance.",
      "Do not turn resistance into a sell signal.",
    ],
    confidenceRules: ["High when add-to-level distance is available."],
    unsupportedFallback:
      "Wait for chart context, then review whether adds happened too close to resistance.",
    advancedHowDetected:
      "Mapped from adds_near_daily_4h_resistance when levels-system compares add executions to resistance.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Keep it as location review, not a trading instruction."],
    testCases: ["adds near resistance maps to certified risk copy"],
  },
  {
    behaviorId: "adds_above_resistance_with_room",
    aliases: ["Some adds cleared resistance with room"],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "market_context",
    userFacingLabel: "Adds cleared resistance with room",
    plainExplanation:
      "At least one add happened after resistance was cleared and still had room before the next higher-timeframe level.",
    fixFirstAction:
      "Write down what confirmed the cleared level before adding so the process can be repeated.",
    evidenceSentence:
      "Detected from add executions, cleared resistance, and room-to-next-resistance evidence.",
    missingDataSentence:
      "Needs support/resistance context before the app can praise add location.",
    requiredEvidence: ["add execution", "cleared resistance", "room to next resistance"],
    optionalEvidence: ["volume context", "follow-through candles"],
    triggerRules: ["add occurs above cleared resistance with configured room to the next level"],
    negativeGuards: [
      "Do not imply cleared resistance guarantees continuation.",
      "Do not call it a buy signal.",
    ],
    confidenceRules: ["High when cleared level and room evidence are present."],
    unsupportedFallback:
      "Wait for chart context, then review whether the add cleared resistance with room.",
    advancedHowDetected:
      "Mapped from adds_above_resistance_with_room when levels-system confirms cleared resistance plus room.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Use repeatable process language."],
    testCases: ["add above resistance with room maps to strength copy"],
  },
  {
    behaviorId: "reductions_near_resistance",
    aliases: ["Reduced near resistance", "Reductions happened near resistance"],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "market_context",
    userFacingLabel: "Reduced size near resistance",
    plainExplanation:
      "The trade took size off while price was close to higher-timeframe resistance.",
    fixFirstAction:
      "Save the resistance-based reduction rule so similar trades can use the same profit-protection cue.",
    evidenceSentence:
      "Detected from reduction executions compared with daily/4h resistance context.",
    missingDataSentence:
      "Needs support/resistance context before the app can praise reduction location.",
    requiredEvidence: ["reduction execution", "daily/4h resistance", "distance from reduction to resistance"],
    optionalEvidence: ["reaction strength", "post-reduction candle window"],
    triggerRules: ["one or more reductions occur near resistance"],
    negativeGuards: [
      "Do not say every resistance reduction is correct.",
      "Do not call resistance a sell signal.",
    ],
    confidenceRules: ["High when reduction-to-level distance is available."],
    unsupportedFallback:
      "Wait for chart context, then review whether reductions happened near resistance.",
    advancedHowDetected:
      "Mapped from reductions_near_resistance when levels-system compares reduction executions to resistance.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Praise the reviewed process, not the future trade decision."],
    testCases: ["reductions near resistance map to strength copy"],
  },
  {
    behaviorId: "protected_profit_before_fade",
    aliases: [
      "Protected profit before the fade",
      "protected_profit_before_later_fade",
      "Sold well before a later fade",
    ],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "market_context",
    userFacingLabel: "Protected profit before the fade",
    plainExplanation:
      "The trade protected a meaningful part of the available move before the after-exit chart faded.",
    fixFirstAction:
      "Write down the exit cue that protected profit so it can become a repeatable rule.",
    evidenceSentence:
      "Detected from realized capture, final-exit location versus the trade high, and after-exit candles that faded.",
    missingDataSentence:
      "Needs realized-capture evidence and an aligned after-exit candle window before the app can say profit was protected before a fade.",
    requiredEvidence: [
      "realized capture",
      "final exit distance from favorable extreme",
      "after-exit candle window",
      "after-exit fade evidence",
    ],
    optionalEvidence: ["support/resistance context", "partial reduction sequence", "saved exit plan"],
    triggerRules: [
      "realized capture clears the configured threshold",
      "after-exit adverse move is larger than favorable continuation",
      "after-exit window ends flat-to-adverse for the trade direction",
    ],
    negativeGuards: [
      "Do not say the trader sold the exact top.",
      "Do not imply the exit predicts future fades.",
      "Do not show without after-exit candles.",
    ],
    confidenceRules: [
      "High when capture, final-exit distance, adverse after-exit move, and net after-exit direction agree.",
    ],
    unsupportedFallback:
      "Wait for after-exit candles, then review whether the exit protected profit before the chart faded.",
    advancedHowDetected:
      "Mapped from protected_profit_before_fade when realized-capture and after-exit fade evidence agree.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: [
      "Frame this as a repeatable protection cue, not a perfect exit or prediction.",
    ],
    testCases: ["protected profit before fade maps to repeatable strength copy"],
  },
  {
    behaviorId: "exit_captured_trade_well",
    aliases: ["Exit captured the trade well"],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "market_context",
    userFacingLabel: "Exit captured the trade well",
    plainExplanation:
      "The exit captured a strong portion of the available move with limited giveback.",
    fixFirstAction:
      "Save what triggered this exit so similar trades can use the same profit-protection rule.",
    evidenceSentence:
      "Detected from realized capture and final-exit distance from the trade's favorable extreme.",
    missingDataSentence:
      "Needs trade-window or post-exit context before capture quality can be reviewed.",
    requiredEvidence: ["realized capture", "final exit distance from favorable extreme"],
    optionalEvidence: ["post-exit candles", "support/resistance context"],
    triggerRules: ["realized capture clears the configured threshold"],
    negativeGuards: [
      "Do not say top tick or perfect exit.",
      "Do not imply future exits should be identical.",
    ],
    confidenceRules: ["High when capture and giveback evidence agree."],
    unsupportedFallback:
      "Review whether the exit protected enough of the move once chart context is available.",
    advancedHowDetected:
      "Mapped from exit_captured_trade_well when trade-window exit evidence shows strong capture.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Praise capture without hindsight perfection."],
    testCases: ["captured exit maps to repeatable strength"],
  },
  {
    behaviorId: "balanced_management_with_constructive_exit",
    aliases: [
      "Managed the full trade constructively",
      "Balanced management with constructive exit",
      "recovery_with_balanced_management_and_constructive_final_exit",
    ],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "combined",
    userFacingLabel: "Managed the full trade constructively",
    plainExplanation:
      "The trade added, reduced, returned flat, kept giveback controlled, and after-exit candles later faded.",
    fixFirstAction:
      "Write down the add, trim, and final-exit cues so this management sequence can be repeated intentionally.",
    evidenceSentence:
      "Detected from add and reduction sequence, controlled open-profit giveback, flat final exit, and after-exit candles.",
    missingDataSentence:
      "Needs add/reduction sequence, controlled-giveback evidence, a flat final exit, and after-exit candles before the app can praise the whole trade.",
    requiredEvidence: [
      "add execution",
      "reduction execution",
      "controlled open-profit giveback",
      "flat final exit",
      "after-exit candle window",
    ],
    optionalEvidence: [
      "support/resistance context",
      "saved trade plan",
      "partial reduction notes",
    ],
    triggerRules: [
      "position increased after initial entry",
      "position was reduced before or at the final exit",
      "open-profit giveback stayed inside the calibrated threshold",
      "after-exit adverse movement was larger than favorable continuation",
    ],
    negativeGuards: [
      "Do not call the trade perfect.",
      "Do not say the final exit was top tick.",
      "Do not call this a buy signal or sell signal.",
    ],
    confidenceRules: [
      "High when add, reduction, giveback, realized-capture, and after-exit evidence all agree.",
    ],
    unsupportedFallback:
      "Wait for full trade-management and after-exit evidence, then review whether the management path was repeatable.",
    advancedHowDetected:
      "Mapped from balanced_management_with_constructive_exit when sequence, giveback, final-exit, and after-exit evidence agree.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: [
      "Praise the reviewed management process without implying a perfect exit or a future trade decision.",
    ],
    testCases: [
      "balanced management maps to repeatable full-trade strength",
    ],
  },
  {
    behaviorId: "exit_avoided_adverse_followthrough",
    aliases: ["Exit avoided adverse followthrough", "Disciplined defensive exit"],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "market_context",
    userFacingLabel: "Exit avoided a later fade",
    plainExplanation:
      "After the final exit, the chart moved against the trade direction more than it continued.",
    fixFirstAction:
      "Write down what told you to exit so this defensive exit can be repeated intentionally.",
    evidenceSentence:
      "Detected from after-exit candles showing more adverse follow-through than favorable continuation.",
    missingDataSentence:
      "Needs aligned after-exit candles before the app can say the exit avoided a fade.",
    requiredEvidence: [
      "final exit timestamp",
      "after-exit candle window",
      "max adverse move after exit",
      "net move at end of after-exit window",
    ],
    optionalEvidence: ["support/resistance context", "saved exit plan"],
    triggerRules: [
      "post-exit adverse move is larger than favorable continuation",
      "after-exit window ends flat-to-adverse for the trade direction",
    ],
    negativeGuards: [
      "Do not say the trader should always exit there.",
      "Do not use without post-exit candles.",
    ],
    confidenceRules: ["High when adverse after-exit move and net end move agree."],
    unsupportedFallback:
      "Wait for after-exit candles, then review whether the exit avoided a fade.",
    advancedHowDetected:
      "Mapped from exit_avoided_adverse_followthrough when after-exit candles move adversely after the final exit.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Frame as a repeatable exit cue, not hindsight perfection."],
    testCases: ["exit avoided adverse followthrough maps to strength copy"],
  },
  {
    behaviorId: "add_into_strength_with_constructive_final_exit",
    aliases: [
      "Added into strength and exited constructively",
      "Add Into Strength With Constructive Final Exit",
      "recovery_with_add_into_strength_and_constructive_final_exit",
      "add_into_strength_with_timely_profit_protection_and_constructive_final_exit",
      "recovery_with_add_into_strength_and_timely_profit_protection_and_constructive_final_exit",
    ],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "combined",
    userFacingLabel: "Added into strength and exited constructively",
    plainExplanation:
      "The trade increased size into strength, kept giveback controlled, returned flat, and after-exit candles later faded.",
    fixFirstAction:
      "Write down what confirmed strength before adding and what confirmed the final exit.",
    evidenceSentence:
      "Detected from add location, controlled giveback, flat final exit, realized capture, and after-exit candles.",
    missingDataSentence:
      "Needs add-location evidence, controlled-giveback evidence, a flat exit, realized capture, and after-exit candles before the app can praise pressing strength.",
    requiredEvidence: [
      "add execution",
      "add versus prior average entry",
      "recent range location",
      "controlled open-profit giveback",
      "after-exit candle window",
    ],
    optionalEvidence: [
      "recovery evidence",
      "timely profit-protection evidence",
      "support/resistance context",
    ],
    triggerRules: [
      "adds occurred after initial entry",
      "adds were above prior average entry",
      "average add location was high enough in the recent range",
      "open-profit giveback stayed inside the calibrated threshold",
      "after-exit adverse movement was larger than favorable continuation",
    ],
    negativeGuards: [
      "Do not say adding into strength is always correct.",
      "Do not call this a buy signal.",
      "Do not call the exit perfect or top tick.",
    ],
    confidenceRules: [
      "High when add location, giveback, realized-capture, and after-exit evidence all agree.",
    ],
    unsupportedFallback:
      "Wait for add-location and after-exit evidence, then review whether pressing strength was repeatable.",
    advancedHowDetected:
      "Mapped from add_into_strength_with_constructive_final_exit when add-location, giveback, final-exit, and after-exit evidence agree.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: [
      "Praise the reviewed management sequence without implying a future trade instruction.",
    ],
    testCases: [
      "add into strength with constructive final exit maps to repeatable management strength",
    ],
  },
  {
    behaviorId: "exit_into_resistance_with_reversal_after_exit",
    aliases: [
      "Exit into resistance with reversal after exit",
      "Stabilized recovery with exit into resistance and reversal",
    ],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "market_context",
    userFacingLabel: "Exit protected profit near resistance",
    plainExplanation:
      "The final exit happened near higher-timeframe resistance and the after-exit chart reversed instead of continuing cleanly.",
    fixFirstAction:
      "Save what made resistance a useful exit cue so it can be repeated when the evidence lines up.",
    evidenceSentence:
      "Detected from final-exit location near resistance plus after-exit candles that reversed.",
    missingDataSentence:
      "Needs both resistance context and after-exit candles before this can be shown as a strength.",
    requiredEvidence: [
      "final exit timestamp",
      "daily/4h resistance near final exit",
      "after-exit candle window",
      "post-exit reversal evidence",
    ],
    optionalEvidence: ["realized capture", "reduction sequence"],
    triggerRules: [
      "final exit occurs near resistance",
      "after-exit chart moves against continuation",
    ],
    negativeGuards: [
      "Do not say resistance always means sell.",
      "Do not imply the trader predicted the reversal.",
    ],
    confidenceRules: ["High when final-exit level location and after-exit direction agree."],
    unsupportedFallback:
      "Review the resistance exit after chart context is available.",
    advancedHowDetected:
      "Mapped from exit_into_resistance_with_reversal_after_exit or the stabilized recovery variant.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Praise risk management, not prediction."],
    testCases: ["resistance exit with reversal maps to strength copy"],
  },
  {
    behaviorId: "exit_into_resistance_before_breakout",
    aliases: [
      "Exit into resistance before breakout",
      "Stabilized recovery with exit into resistance before breakout",
    ],
    state: "certified_detection",
    tone: "warning",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "market_context",
    userFacingLabel: "Exit came before resistance broke",
    plainExplanation:
      "The final exit happened near resistance, then the after-exit chart cleared or continued through that area.",
    fixFirstAction:
      "Review whether a small runner rule would have kept partial size after resistance cleared.",
    evidenceSentence:
      "Detected from final-exit location near resistance plus after-exit continuation through that area.",
    missingDataSentence:
      "Needs both resistance context and after-exit candles before this can become an exit-quality conclusion.",
    requiredEvidence: [
      "final exit timestamp",
      "daily/4h resistance near final exit",
      "after-exit candle window",
      "post-exit continuation evidence",
    ],
    optionalEvidence: ["saved target plan", "partial-exit sequence"],
    triggerRules: [
      "final exit occurs near resistance",
      "after-exit chart clears or continues past resistance",
    ],
    negativeGuards: [
      "Do not say the trader should have held the full position.",
      "Do not calculate guaranteed missed P/L.",
    ],
    confidenceRules: ["High when resistance location and post-exit continuation agree."],
    unsupportedFallback:
      "Review whether the exit plan had a runner rule once after-exit chart context is available.",
    advancedHowDetected:
      "Mapped from exit_into_resistance_before_breakout or the stabilized recovery variant.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Use runner-review language instead of hindsight blame."],
    testCases: ["resistance exit before breakout maps to safe risk copy"],
  },
  {
    behaviorId: "exit_into_support_before_breakdown",
    aliases: [
      "Exit into support before breakdown",
      "Exit into thin support before breakdown",
      "Stabilized recovery with exit into thin support before breakdown",
    ],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "market_context",
    userFacingLabel: "Exit avoided a support break",
    plainExplanation:
      "The final exit happened near support before the after-exit chart broke lower.",
    fixFirstAction:
      "Save the support-loss or defensive-exit cue that helped avoid the later breakdown.",
    evidenceSentence:
      "Detected from final-exit location near support plus after-exit candles that broke down.",
    missingDataSentence:
      "Needs support context and after-exit candles before the app can say the exit avoided a breakdown.",
    requiredEvidence: [
      "final exit timestamp",
      "daily/4h support near final exit",
      "after-exit candle window",
      "post-exit breakdown evidence",
    ],
    optionalEvidence: ["support strength", "position size before exit"],
    triggerRules: [
      "final exit occurs near support",
      "after-exit chart breaks down instead of bouncing",
    ],
    negativeGuards: [
      "Do not say support always fails.",
      "Do not imply the trader predicted the breakdown.",
    ],
    confidenceRules: ["High when support location and post-exit breakdown agree."],
    unsupportedFallback:
      "Wait for after-exit chart context, then review whether the exit avoided a support break.",
    advancedHowDetected:
      "Mapped from exit_into_support_before_breakdown, exit_into_thin_support_before_breakdown, or the stabilized recovery variant.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Frame as defensive risk control, not a prediction."],
    testCases: ["support breakdown after exit maps to strength copy"],
  },
  {
    behaviorId: "exit_into_support_with_relief_after_exit",
    aliases: [
      "Exit into support with relief after exit",
      "Exit into stacked support with relief after exit",
      "Stabilized recovery with exit into stacked support and relief",
    ],
    state: "review_prompt",
    tone: "warning",
    opportunityType: "review_prompt",
    evidenceChannel: "market_context",
    userFacingLabel: "Review the exit near support",
    plainExplanation:
      "The final exit happened near support and the after-exit chart later bounced, but the app should not assume the exit was wrong without the trade plan.",
    fixFirstAction:
      "Compare the exit reason against the support area and decide whether the plan needed a bounce-test or partial-size rule.",
    evidenceSentence:
      "Detected from final-exit location near support plus after-exit relief movement.",
    missingDataSentence:
      "Needs support context, after-exit candles, and preferably the user's exit plan before becoming a stronger conclusion.",
    requiredEvidence: [
      "final exit timestamp",
      "daily/4h support near final exit",
      "after-exit candle window",
      "post-exit relief evidence",
    ],
    optionalEvidence: ["saved stop plan", "partial-exit sequence", "support strength"],
    triggerRules: [
      "final exit occurs near support",
      "after-exit chart bounces or relieves from support",
    ],
    negativeGuards: [
      "Do not say the exit was wrong without plan context.",
      "Do not imply the trader should hold through support.",
    ],
    confidenceRules: ["Prompt-only until plan context or stronger calibration exists."],
    unsupportedFallback:
      "Review whether the exit near support followed the plan or whether a partial-size bounce rule would have helped.",
    advancedHowDetected:
      "Mapped from exit_into_support_with_relief_after_exit or stacked-support relief variants.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Keep this as a review prompt because support exits can be valid defensive exits."],
    testCases: ["support relief after exit stays prompt-only"],
  },
  {
    behaviorId: "profit_protection_failed",
    aliases: ["Open profit was not protected"],
    state: "certified_detection",
    tone: "risk",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "combined",
    userFacingLabel: "Open profit was not protected",
    plainExplanation:
      "The trade gave back too much available open profit before risk was reduced or closed.",
    fixFirstAction:
      "Create a rule for when open profit must be reduced, protected, or closed.",
    evidenceSentence:
      "Detected from favorable excursion, realized capture, and profit-giveback evidence.",
    missingDataSentence:
      "Needs open-profit path and exit context before profit protection can be judged.",
    requiredEvidence: ["open profit path", "realized capture", "final exit or reduction evidence"],
    optionalEvidence: ["post-exit candles", "support/resistance context"],
    triggerRules: ["failed profit-protection structure is present"],
    negativeGuards: [
      "Do not calculate alternate guaranteed P/L.",
      "Do not say the user should have sold at the top.",
    ],
    confidenceRules: ["High when favorable excursion and realized capture evidence agree."],
    unsupportedFallback:
      "Review whether open profit had a protection rule before the trade gave it back.",
    advancedHowDetected:
      "Mapped from profit_protection_failed after open-profit giveback evidence is available.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Use protection-rule language, not hindsight blame."],
    testCases: ["profit protection failure maps without guaranteed P/L language"],
  },
  {
    behaviorId: "reentry_volume_faded",
    aliases: ["Re-entry volume faded", "Later re-entry had lower volume"],
    state: "certified_detection",
    tone: "risk",
    opportunityType: "risk_to_reduce",
    evidenceChannel: "market_context",
    userFacingLabel: "Re-entry had lower volume",
    plainExplanation:
      "A later same-symbol attempt had meaningfully less entry-window volume than the first push.",
    fixFirstAction:
      "Before taking a later re-entry, compare volume against the first push and require a fresh reason if participation has faded.",
    evidenceSentence:
      "Detected from saved chart-volume evidence comparing the first push with a later re-entry.",
    missingDataSentence:
      "Needs comparable volume evidence for the first push and later re-entry before this can be shown.",
    requiredEvidence: [
      "first round-trip entry volume",
      "later re-entry volume",
      "same-symbol thread",
      "saved chart context for both attempts",
    ],
    optionalEvidence: ["level location on each attempt", "P/L by round trip"],
    triggerRules: ["later re-entry volume is materially lower than first-push volume"],
    negativeGuards: [
      "Do not claim volume caused the loss.",
      "Do not show when the two volume windows are not comparable.",
    ],
    confidenceRules: ["High when both saved chart snapshots expose comparable entry-volume values."],
    unsupportedFallback:
      "Wait for comparable volume context before judging whether later participation faded.",
    advancedHowDetected:
      "Mapped from reentry_volume_faded when a same-symbol thread compares first-push and re-entry volume.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Use volume comparison language, not causation language."],
    testCases: ["faded re-entry volume maps to risk copy"],
  },
  {
    behaviorId: "reentry_volume_confirmed",
    aliases: ["Re-entry volume confirmed", "Later re-entry kept strong volume"],
    state: "certified_detection",
    tone: "strength",
    opportunityType: "strength_to_repeat",
    evidenceChannel: "market_context",
    userFacingLabel: "Re-entry kept strong volume",
    plainExplanation:
      "A later same-symbol attempt had comparable or stronger entry-window volume than the first push.",
    fixFirstAction:
      "Save what made the later attempt fresh so strong re-entry conditions can be recognized again.",
    evidenceSentence:
      "Detected from saved chart-volume evidence comparing the first push with a later re-entry.",
    missingDataSentence:
      "Needs comparable volume evidence for the first push and later re-entry before this can be shown.",
    requiredEvidence: [
      "first round-trip entry volume",
      "later re-entry volume",
      "same-symbol thread",
      "saved chart context for both attempts",
    ],
    optionalEvidence: ["level location on each attempt", "P/L by round trip"],
    triggerRules: ["later re-entry volume is comparable to or stronger than first-push volume"],
    negativeGuards: [
      "Do not imply strong volume guarantees continuation.",
      "Do not ignore entry location or risk management.",
    ],
    confidenceRules: ["High when both saved chart snapshots expose comparable entry-volume values."],
    unsupportedFallback:
      "Wait for comparable volume context before praising the later re-entry.",
    advancedHowDetected:
      "Mapped from reentry_volume_confirmed when a same-symbol thread compares first-push and re-entry volume.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Praise confirmed participation without turning it into a trade signal."],
    testCases: ["confirmed re-entry volume maps to strength copy"],
  },
  {
    behaviorId: "trade_window_excursion_measured",
    aliases: ["During-trade movement was measured"],
    state: "review_prompt",
    tone: "neutral",
    opportunityType: "review_prompt",
    evidenceChannel: "market_context",
    userFacingLabel: "During-trade movement was measured",
    plainExplanation:
      "The saved chart window measured favorable and adverse movement during the trade.",
    fixFirstAction:
      "Use this measurement as context, then rely on the stronger risk or strength findings for conclusions.",
    evidenceSentence:
      "Detected from bounded candle movement during the saved trade window.",
    missingDataSentence:
      "Needs aligned during-trade candles before movement can be measured.",
    requiredEvidence: ["bounded trade-window candles"],
    optionalEvidence: ["post-exit candles", "support/resistance context"],
    triggerRules: ["trade-window favorable or adverse movement is available"],
    negativeGuards: [
      "Do not treat measurement by itself as a coaching conclusion.",
      "Do not use trade-window engine wording in primary UI.",
    ],
    confidenceRules: ["Review prompt because movement measurement supports other findings."],
    unsupportedFallback:
      "Use measured movement as supporting context, not the main coaching conclusion.",
    advancedHowDetected:
      "Mapped from trade_window_excursion_measured when bounded candle movement is available.",
    routesAllowed: CORE_ROUTES,
    copySafetyNotes: ["Say during-trade movement, not trade-window movement."],
    testCases: ["trade window measurement stays supporting context"],
  },
  {
    behaviorId: "chased_entry",
    aliases: ["Chased Entry", "chasing"],
    state: "review_prompt",
    tone: "warning",
    opportunityType: "review_prompt",
    evidenceChannel: "market_context",
    userFacingLabel: "Review whether the entry was rushed",
    plainExplanation:
      "The current evidence can suggest a rushed entry, but a confident chasing call needs candle or level context.",
    fixFirstAction:
      "Check whether the entry came after the easy part of the move was already gone.",
    evidenceSentence:
      "Execution clustering can prompt this review, but it is not enough by itself to prove a chase.",
    missingDataSentence:
      "Needs candle extension, volume, or support/resistance context before becoming a certified entry-quality conclusion.",
    requiredEvidence: ["entry timestamp", "candle window around entry"],
    optionalEvidence: ["volume context", "support/resistance levels"],
    triggerRules: ["rapid execution clustering or chase pattern ID appears"],
    negativeGuards: [
      "Do not call it chasing from speed alone.",
      "Do not say buy/sell signal.",
    ],
    confidenceRules: ["Remain a prompt until chart context proves extension."],
    unsupportedFallback:
      "Review whether the entry was rushed or far from a cleaner decision point.",
    advancedHowDetected:
      "Mapped from chased_entry/chasing but downgraded to a review prompt without chart-context proof.",
    routesAllowed: TRADE_REVIEW_ROUTES,
    copySafetyNotes: ["Use review wording unless chart context is attached."],
    testCases: ["chased_entry cannot drive primary conclusion by default"],
  },
  {
    behaviorId: "revenge_reentry_cluster",
    aliases: ["Revenge-Like Re-Entry Cluster"],
    state: "review_prompt",
    tone: "warning",
    opportunityType: "review_prompt",
    evidenceChannel: "execution_only",
    userFacingLabel: "Review quick re-entry pressure",
    plainExplanation:
      "A quick re-entry or rapid cluster may deserve review, but the app should not claim emotional intent.",
    fixFirstAction:
      "Compare the re-entry sequence and decide where a cooldown should begin.",
    evidenceSentence:
      "Detected from losing or risky execution clusters, and should be checked against same-symbol trade threads.",
    missingDataSentence:
      "Needs same-symbol re-entry evidence and review context before it can become a stronger conclusion.",
    requiredEvidence: ["same-symbol re-entry sequence", "time gap", "P/L by attempt"],
    optionalEvidence: ["volume on later attempt", "support/resistance context"],
    triggerRules: ["gross losing trade with rapid-fire cluster"],
    negativeGuards: [
      "Never state revenge or emotion as fact.",
      "Do not use as a top coach conclusion without thread evidence.",
    ],
    confidenceRules: ["Review prompt unless repeated losing re-entry evidence exists."],
    unsupportedFallback:
      "Review whether the re-entry was part of the same trade idea or a new attempt.",
    advancedHowDetected:
      "Mapped from revenge_reentry_cluster and intentionally downgraded because emotional intent cannot be proven.",
    routesAllowed: TRADE_REVIEW_ROUTES,
    copySafetyNotes: ["Always use cautious language for emotional labels."],
    testCases: ["revenge-like label is prompt-only"],
  },
  {
    behaviorId: "early_winner_exit",
    aliases: ["Early Winner Exit"],
    state: "review_prompt",
    tone: "warning",
    opportunityType: "review_prompt",
    evidenceChannel: "market_context",
    userFacingLabel: "Review whether the winner was sold too soon",
    plainExplanation:
      "The exit may deserve review, but a confident early-exit conclusion needs post-exit continuation or plan evidence.",
    fixFirstAction:
      "Check whether the exit matched the plan or came before the move was finished.",
    evidenceSentence:
      "Execution-only evidence can flag the exit for review, but not prove missed continuation.",
    missingDataSentence:
      "Needs post-exit candle movement or saved plan evidence before saying money was left on the table.",
    requiredEvidence: ["winner context", "exit timestamp", "post-exit window"],
    optionalEvidence: ["planned target", "support/resistance context"],
    triggerRules: ["weak first reduction or premature-exit pattern appears"],
    negativeGuards: [
      "Do not say left money on the table without continuation evidence.",
    ],
    confidenceRules: ["Review prompt until post-exit movement is known."],
    unsupportedFallback:
      "Review whether the exit had a planned reason or happened too early.",
    advancedHowDetected:
      "Mapped from early_winner_exit and downgraded until continuation evidence exists.",
    routesAllowed: TRADE_REVIEW_ROUTES,
    copySafetyNotes: ["Avoid hindsight claims without candle evidence."],
    testCases: ["early winner exit is prompt-only by default"],
  },
  {
    behaviorId: "partialed_without_plan",
    aliases: ["Partialed Without Plan"],
    state: "review_prompt",
    tone: "warning",
    opportunityType: "review_prompt",
    evidenceChannel: "combined",
    userFacingLabel: "Review the partial exits",
    plainExplanation:
      "The partial exit sequence needs review, but the app cannot know whether there was a plan unless one was saved.",
    fixFirstAction:
      "For each partial, write the reason it happened and whether it reduced enough risk.",
    evidenceSentence:
      "Detected from reduction sequence evidence that looks inconsistent or late.",
    missingDataSentence:
      "Needs saved review notes or a planned target before saying the partials lacked a plan.",
    requiredEvidence: ["reduction sequence", "saved plan or checklist"],
    optionalEvidence: ["open profit path"],
    triggerRules: ["partial-exit risk ID appears"],
    negativeGuards: ["Do not claim no plan existed without saved plan evidence."],
    confidenceRules: ["Review prompt until saved plan evidence exists."],
    unsupportedFallback:
      "Review each partial and decide whether it had a planned reason.",
    advancedHowDetected:
      "Mapped from partialed_without_plan but kept as a prompt until user-plan evidence exists.",
    routesAllowed: TRADE_REVIEW_ROUTES,
    copySafetyNotes: ["Do not accuse the user of having no plan."],
    testCases: ["partialed without plan cannot drive primary conclusion"],
  },
  {
    behaviorId: "repeated_rule_violation",
    aliases: ["Repeated Rule Violation"],
    state: "review_prompt",
    tone: "warning",
    opportunityType: "review_prompt",
    evidenceChannel: "execution_only",
    userFacingLabel: "Review repeated rule breaks",
    plainExplanation:
      "A saved rule was broken more than once, but the user should still confirm whether the rule is useful.",
    fixFirstAction:
      "Inspect the linked trades and decide whether the rule needs a clearer threshold.",
    evidenceSentence:
      "Detected from saved rule evaluation counts.",
    missingDataSentence:
      "Needs user confirmation that the rule is still valid.",
    requiredEvidence: ["saved rule", "repeated rule violation count"],
    optionalEvidence: ["review notes", "newer report"],
    triggerRules: ["violatedTradeCount is at least two"],
    negativeGuards: ["Do not assume the rule itself is correct."],
    confidenceRules: ["Prompt until the user confirms or tightens the rule."],
    unsupportedFallback:
      "Review the repeated rule breaks and decide whether the threshold should change.",
    advancedHowDetected:
      "Mapped from repeated_rule_violation from saved rule evaluation output.",
    routesAllowed: ["/coach", "/review", "/progress"],
    copySafetyNotes: ["Keep this as rule review, not a trading instruction."],
    testCases: ["rule violation stays prompt-only"],
  },
  {
    behaviorId: "impulsive_reversal",
    aliases: ["Impulsive Reversal"],
    state: "internal_only",
    tone: "neutral",
    opportunityType: "internal_only",
    evidenceChannel: "combined",
    userFacingLabel: "Advanced behavior signal",
    plainExplanation:
      "This behavior is not certified for normal user-facing coaching yet.",
    fixFirstAction:
      "Keep this in advanced diagnostics until a detection contract exists.",
    evidenceSentence:
      "The current app does not have enough certified evidence to show this as a conclusion.",
    missingDataSentence:
      "Needs a clear detection contract, negative guards, and tests.",
    requiredEvidence: ["certified reversal/re-entry contract"],
    optionalEvidence: ["same-symbol thread", "saved plan", "candles"],
    triggerRules: ["internal experimental signal only"],
    negativeGuards: ["Do not show in primary UI."],
    confidenceRules: ["Internal-only until certified."],
    unsupportedFallback:
      "Keep this behavior in advanced diagnostics.",
    advancedHowDetected:
      "Mapped from impulsive_reversal and blocked from primary UI.",
    routesAllowed: ["advanced"],
    copySafetyNotes: ["Internal-only."],
    testCases: ["internal signal fails closed"],
  },
] as const satisfies readonly UserFacingBehaviorContract[];

function normalizedKey(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const CONTRACT_BY_KEY = new Map<string, UserFacingBehaviorContract>();

for (const contract of USER_FACING_BEHAVIOR_REGISTRY) {
  CONTRACT_BY_KEY.set(normalizedKey(contract.behaviorId), contract);
  CONTRACT_BY_KEY.set(normalizedKey(contract.userFacingLabel), contract);

  for (const alias of contract.aliases ?? []) {
    CONTRACT_BY_KEY.set(normalizedKey(alias), contract);
  }
}

export function findUserFacingBehaviorContract(
  behaviorIdOrLabel: string | null | undefined,
): UserFacingBehaviorContract | null {
  if (!behaviorIdOrLabel) {
    return null;
  }

  return CONTRACT_BY_KEY.get(normalizedKey(behaviorIdOrLabel)) ?? null;
}
