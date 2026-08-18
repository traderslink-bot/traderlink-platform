import type { HelpGuide } from "./help-guide-types";

export const TRADING_RULES_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  Object.freeze({
    slug: "getting-started",
    title: "Getting started",
    description: "Learn what Trading Rules do, the difference between preset and custom rules, and a simple way to begin.",
    sections: Object.freeze([
      Object.freeze({
        id: "what-trading-rules-do",
        title: "What Trading Rules do",
        summary: "Turn parts of your trading plan into results you can review over time.",
        keywords: Object.freeze(["trading rules", "trading plan", "discipline", "process", "getting started"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Trading Rules help you compare your completed Day trades with the limits and habits you chose. They give you a consistent record of what was Followed, Broken, unavailable or left without a manual selection." }),
          Object.freeze({ kind: "callout", title: "Facts, not advice", text: "TraderLink reports what happened in your saved trading record. It does not decide whether you should keep, change or remove a rule." }),
        ]),
      }),
      Object.freeze({
        id: "preset-and-custom",
        title: "Preset and custom rules",
        summary: "Choose automatic checks when the facts are available or write a rule you review yourself.",
        keywords: Object.freeze(["preset", "custom", "manual rule", "automatic rule", "rule type"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Rule type", "How it works"]), rows: Object.freeze([
            Object.freeze(["Preset", "Choose a ready-made rule and its setting. TraderLink checks it automatically from saved completed Day trades."]),
            Object.freeze(["Custom", "Write the rule in your own words, choose whether to review it by trade or by day, and select the result yourself in Daily Trade Tracker."]),
          ]) }),
          Object.freeze({ kind: "paragraph", text: "Preset rules do not ask for a daily explanation or confirmation. A custom rule stays Not selected until you explicitly choose Followed or Broken." }),
        ]),
      }),
      Object.freeze({
        id: "when-a-rule-starts",
        title: "When a rule starts",
        summary: "A new or adjusted rule applies from that point forward.",
        keywords: Object.freeze(["active", "effective", "start", "future trades", "version"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "A rule becomes active when you save it. It does not judge trades that happened before it became active.",
            "Adjusting a rule starts a new version. Earlier results stay connected to the earlier setting.",
            "Pausing a rule stops checks during the paused time. Resuming starts them again from that moment.",
            "Retiring a rule ends future checks permanently while keeping its history.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "simple-workflow",
        title: "A simple Rules workflow",
        summary: "Start with a small set, review the evidence and compare the results over time.",
        keywords: Object.freeze(["workflow", "add rule", "review rule", "results page"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Choose a rule", text: "Open Trading Rules and add a preset from the Rule library, or create a custom rule in your own words." }),
            Object.freeze({ title: "2. Set the limit", text: "Enter the time, trade count, loss count, price range or account-currency amount requested by the preset." }),
            Object.freeze({ title: "3. Review the day", text: "Open Daily Trade Tracker to see automatic results, add custom-rule selections and read any Broken or N/A details." }),
            Object.freeze({ title: "4. Compare the history", text: "Open Rule Results to search individual checks and view factual totals for each rule version." }),
          ]) }),
          Object.freeze({ kind: "link", href: "/rules", label: "Open Trading Rules", text: "Start with the Trading Rules page when you are ready to choose a rule." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "rule-ideas",
    title: "Use Rule ideas",
    description: "Check completed Day trades for a well-supported pattern and decide whether to add, save or dismiss the suggested preset.",
    sections: Object.freeze([
      Object.freeze({
        id: "check-trades",
        title: "Check your trades",
        summary: "Run a factual check without adding or changing a rule.",
        keywords: Object.freeze(["rule idea", "check my trades", "suggested rule", "preset recommendation"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Start the check", text: "Open Trading Rules and choose Check my trades in the Rule idea card." }),
            Object.freeze({ title: "2. Read the comparison", text: "If a pattern qualifies, review the suggested preset setting, affected trades, comparison trades and their actual completed results." }),
            Object.freeze({ title: "3. Make your choice", text: "Choose Add rule, Save for later or Not for me. Add rule still opens the normal rule form so you can review the setting before activating it." }),
          ]) }),
          Object.freeze({ kind: "callout", title: "Checking changes nothing", text: "The check cannot activate, adjust, pause or retire a rule. If no pattern passes every evidence check, TraderLink says so and leaves your rules unchanged." }),
        ]),
      }),
      Object.freeze({
        id: "history-checked",
        title: "How much history is checked",
        summary: "Start with recent trades and extend backward only when more evidence is needed.",
        keywords: Object.freeze(["rule idea history", "14 days", "20 trades", "50 executions", "evidence window"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "The check starts with the latest 14 calendar days.",
            "It extends backward until it has at least 3 active Day-trading days, 20 eligible completed Day trades and 50 accepted executions.",
            "If that window has no qualifying idea, it adds 14 available trading dates at a time and checks again.",
            "It stops at the first window with a qualifying idea or after all available history for the selected account has been checked.",
          ]) }),
          Object.freeze({ kind: "paragraph", text: "The check uses the currently selected Trade Tracker account. Intentional Swing trades, open trades and facts still waiting for a required Data Decision are not treated as completed Day-trade evidence." }),
        ]),
      }),
      Object.freeze({
        id: "evidence-required",
        title: "What qualifies as a Rule idea",
        summary: "A repeated loss pattern must survive several checks before it can appear.",
        keywords: Object.freeze(["rule idea evidence", "comparison trades", "worst trade", "ticker concentration", "historical pattern"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "The pattern must occur across at least 3 trading days and meet the minimum event and affected-trade counts for that preset.",
            "The affected trades must have a negative combined result and a worse average result than the other completed trades on those days.",
            "The affected result must remain negative after its single worst trade is removed.",
            "One ticker cannot supply more than half of the affected trades.",
            "When enough history exists, both the earlier and more recent portions must show a negative affected result.",
          ]) }),
          Object.freeze({ kind: "callout", title: "A pattern is not proof", text: "Historical results do not prove that the rule caused the difference or that using it will improve future results." }),
        ]),
      }),
      Object.freeze({
        id: "existing-and-dismissed-rules",
        title: "Existing, saved and dismissed ideas",
        summary: "Avoid duplicate active rules and keep every choice explicit.",
        keywords: Object.freeze(["active rule", "save for later", "not for me", "dismiss rule idea", "duplicate rule"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Situation", "What happens"]), rows: Object.freeze([
            Object.freeze(["The preset is already active", "TraderLink does not recommend that preset again. It checks for another qualifying idea instead."]),
            Object.freeze(["Save for later", "The idea remains available without activating the rule or changing its setting."]),
            Object.freeze(["Not for me", "The idea is dismissed and the same preset is suppressed for 90 days."]),
            Object.freeze(["No idea qualifies", "TraderLink confirms that the check finished and that nothing was changed."]),
          ]) }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "manage-preset-rules",
    title: "Add and manage preset rules",
    description: "Choose a preset, enter its setting, and understand adjusting, pausing, resuming and retiring it.",
    sections: Object.freeze([
      Object.freeze({
        id: "choose-a-preset",
        title: "Choose a preset",
        summary: "Use the Rule library to find an automatic check that matches your plan.",
        keywords: Object.freeze(["rule library", "search rules", "category", "add rule", "preset"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Open the Rule library", text: "Open Trading Rules and move to Rule library." }),
            Object.freeze({ title: "2. Search or filter", text: "Search by name or description, or choose a rule group to narrow the list." }),
            Object.freeze({ title: "3. Read the check", text: "Review what the preset checks, whether it applies to a trade, ticker day or complete day, and what information it needs." }),
            Object.freeze({ title: "4. Add the rule", text: "Choose Add rule, enter the requested setting and activate it." }),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "choose-a-setting",
        title: "Choose the setting",
        summary: "Enter the value from your own trading plan instead of a guessed value.",
        keywords: Object.freeze(["setting", "limit", "time", "price", "amount", "wait time"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Each preset asks only for the setting it needs. For example, a cooldown asks for minutes, a daily stop asks for an account-currency amount, and a time rule asks for the latest allowed entry time." }),
          Object.freeze({ kind: "callout", title: "The setting is yours", text: "TraderLink checks the limit you choose. The Rules page does not choose a risk limit or trading plan for you." }),
        ]),
      }),
      Object.freeze({
        id: "adjust-a-rule",
        title: "Adjust an active rule",
        summary: "A changed setting starts a new version without rewriting the old results.",
        keywords: Object.freeze(["adjust", "edit", "change setting", "new version", "old results"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Choose Adjust on an active preset and save the new setting.",
            "The new setting applies from the time it is saved.",
            "Results from the earlier setting stay under the earlier version in Rule Results.",
            "A same-day adjustment does not apply the new setting to trades that occurred before the change.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "pause-resume-retire",
        title: "Pause, resume or retire a rule",
        summary: "Stop checks temporarily or permanently without losing the history.",
        keywords: Object.freeze(["pause", "resume", "retire", "active", "history"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Choice", "What happens"]), rows: Object.freeze([
            Object.freeze(["Pause", "Future checks stop while the rule is paused. Earlier results remain available."]),
            Object.freeze(["Resume", "Checks begin again from the time you resume the rule. The paused time remains excluded."]),
            Object.freeze(["Retire", "Future checks end permanently. The rule cannot be resumed, but its results and versions remain available."]),
          ]) }),
          Object.freeze({ kind: "callout", tone: "warning", title: "Retirement is permanent", text: "Use Pause when you may want the same rule again. Retire only when you want to end that rule permanently." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "preset-rules-reference",
    title: "Preset rules reference",
    description: "See what every available preset checks, when its limit is reached and what counts as a later broken event.",
    sections: Object.freeze([
      Object.freeze({
        id: "trade-rules",
        title: "Trade rules",
        summary: "These checks use the entry or the timing around completed trades.",
        keywords: Object.freeze(["entry price", "cooldown", "after time", "trade rules"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Preset", "What it checks"]), rows: Object.freeze([
            Object.freeze(["Avoid an entry-price range", "Marks a completed trade Broken when its average entry price is inside the lower and upper prices you selected."]),
            Object.freeze(["Cooldown after a loss", "Starts the wait when a losing trade fully closes. A new Day-trade entry before the wait ends is a broken event."]),
            Object.freeze(["No new trades after a selected time", "Uses the selected Eastern Time cutoff. A trade whose first entry is at or after that time is a broken event."]),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "ticker-day-rules",
        title: "Ticker-day rules",
        summary: "These checks follow repeated attempts in the same ticker during one trading day.",
        keywords: Object.freeze(["ticker attempts", "same ticker", "re-entry", "losing attempts"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Preset", "What it checks"]), rows: Object.freeze([
            Object.freeze(["Cooldown before re-entering the same ticker", "Starts the wait when a trade in that ticker fully closes. Re-entering the same ticker before the wait ends is a broken event."]),
            Object.freeze(["Maximum ticker attempts per day", "The allowed attempt completes the limit. The opening entry of the next completed attempt in that ticker is the first broken event."]),
            Object.freeze(["Stop a ticker after losing attempts", "The losing attempt that reaches your limit sets the stop. A later entry in the same ticker is the first broken event."]),
          ]) }),
          Object.freeze({ kind: "paragraph", text: "One ticker attempt runs from a flat position into a position and back to flat. Adding shares or making partial exits inside that position does not create another attempt." }),
        ]),
      }),
      Object.freeze({
        id: "daily-count-rules",
        title: "Daily trade and loss-count rules",
        summary: "These checks use the order of completed trades and completed losing trades in the day.",
        keywords: Object.freeze(["maximum trades", "consecutive losses", "total losses", "daily count"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Preset", "What it checks"]), rows: Object.freeze([
            Object.freeze(["Maximum completed trades per day", "The allowed trade count sets the limit. The opening entry of the next completed Day trade is the first broken event."]),
            Object.freeze(["Stop after consecutive losses", "The completed loss that reaches your uninterrupted losing streak sets the stop. A later entry is the first broken event."]),
            Object.freeze(["Stop after a selected total number of losing trades in a day", "The completed loss that reaches your total loss count sets the stop, even if gains occurred between losses. A later entry is the first broken event."]),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "daily-money-rules",
        title: "Daily money rules",
        summary: "These checks use realized results from trades that have fully closed.",
        keywords: Object.freeze(["daily loss limit", "gain limit", "profit giveback", "realized p/l"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Preset", "What it checks"]), rows: Object.freeze([
            Object.freeze(["Stop after a daily realized loss limit", "The closing trade that reaches or passes your realized loss amount sets the stop. A later entry is the first broken event."]),
            Object.freeze(["Stop after a realized profit giveback", "The closing trade that reaches your selected drop from the day's highest realized P/L sets the stop. A later entry is the first broken event."]),
            Object.freeze(["Stop after a daily realized gain limit", "The closing trade that reaches or passes your realized gain amount sets the stop. A later entry is the first broken event."]),
          ]) }),
          Object.freeze({ kind: "callout", title: "The trade that reaches the limit is the trigger", text: "For stop rules, reaching the selected limit does not make that closing trade the broken event. A later trade entered after the stop is the broken event." }),
          Object.freeze({ kind: "paragraph", text: "These presets use realized results only. They do not estimate open-position gains, losses or giveback." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "custom-rules",
    title: "Create and manage custom rules",
    description: "Write a rule in your own words, choose where to review it, and record Followed, Broken or Not selected.",
    sections: Object.freeze([
      Object.freeze({
        id: "when-to-use-custom",
        title: "When to use a custom rule",
        summary: "Track a rule that matters to you but cannot be confirmed from saved trade facts alone.",
        keywords: Object.freeze(["custom rule", "manual rule", "personal rule", "own words"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Use a custom rule for a decision or habit that needs your judgment, such as waiting for confirmation or following a specific setup. TraderLink will not pretend it can confirm that behavior from executions alone." }),
          Object.freeze({ kind: "callout", title: "Custom means you choose the result", text: "A custom rule is not checked automatically. You decide whether it was Followed or Broken for the trade or day." }),
        ]),
      }),
      Object.freeze({
        id: "create-custom-rule",
        title: "Create a custom rule",
        summary: "Give the rule a clear name, write it plainly and choose where it should appear.",
        keywords: Object.freeze(["create custom rule", "rule name", "category", "review with", "focus rule"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Choose Create custom rule", text: "Open Trading Rules and start a new custom rule." }),
            Object.freeze({ title: "2. Name and describe it", text: "Use a short name and write the rule in words you will understand later." }),
            Object.freeze({ title: "3. Choose its group", text: "Place it with trade, risk or routine rules so it is easier to find." }),
            Object.freeze({ title: "4. Choose where to review it", text: "Choose each trade, the complete day, or both." }),
            Object.freeze({ title: "5. Choose whether it is a Focus Rule", text: "Use Focus for a rule you want to keep especially visible while reviewing." }),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "record-custom-result",
        title: "Record a custom-rule result",
        summary: "The starting result is Not selected until you make a choice.",
        keywords: Object.freeze(["followed", "broken", "not selected", "dropdown", "rule note"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Result", "Meaning"]), rows: Object.freeze([
            Object.freeze(["Not selected", "No result was chosen for that trade or day. This is counted automatically and does not assume why."]),
            Object.freeze(["Followed", "You chose that the rule was followed for that trade or day."]),
            Object.freeze(["Broken", "You chose that the rule was broken for that trade or day."]),
          ]) }),
          Object.freeze({ kind: "paragraph", text: "A note is optional in every state. Use it when a short explanation will make the result more useful later. You do not need to add a note or choose Not selected just to leave the rule unanswered." }),
        ]),
      }),
      Object.freeze({
        id: "manage-custom-rule",
        title: "Edit, pause or retire a custom rule",
        summary: "Manage custom rules without erasing their earlier history.",
        keywords: Object.freeze(["edit custom rule", "pause custom", "retire custom", "history"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Editing the name, wording, group, review location or Focus choice starts a new version.",
            "Pause the rule when you want to stop seeing new checks for a while.",
            "Resume it when you want new checks to begin again.",
            "Retire it to end future checks permanently. Earlier selections and notes remain in Rule Results.",
          ]) }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "daily-trade-tracker",
    title: "Review rules in Daily Trade Tracker",
    description: "Read compact rule rows, open details, use the daily timeline and find grouped Rule markers on the chart.",
    sections: Object.freeze([
      Object.freeze({
        id: "find-rules",
        title: "Find trade and daily rules",
        summary: "Trade rules appear with the matching trade; daily rules appear in the Daily rules card.",
        keywords: Object.freeze(["daily trade tracker", "trade rules", "daily rules", "rule row"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "A trade rule is shown with the completed trade it checks or asks you to review.",
            "A ticker-day rule can use several completed attempts in the same ticker.",
            "A daily rule uses the ordered results across the complete trading day.",
            "Custom rules show a result selector. Preset rules display the automatic result.",
            "Trade Explorer's Review editor offers the same custom result choices for one completed trade and shows automatic trade-rule results as read-only. Daily rule results remain in Daily Trade Tracker.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "open-rule-details",
        title: "Open Broken or N/A details",
        summary: "Use the small row link when you need the reason behind an automatic result.",
        keywords: Object.freeze(["details", "why n/a", "broken evidence", "trigger", "violation"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Link", "What it shows"]), rows: Object.freeze([
            Object.freeze(["Details", "The setting, the moment the limit was reached, the later broken event, the affected trade result and available fee information."]),
            Object.freeze(["Why N/A", "The exact reason TraderLink could not make a reliable automatic check."]),
          ]) }),
          Object.freeze({ kind: "paragraph", text: "Followed preset rows stay compact because there is no broken event to explain. Their history remains available on Rule Results." }),
        ]),
      }),
      Object.freeze({
        id: "daily-rules-timeline",
        title: "Use the daily rules timeline",
        summary: "Read the day's limit and later broken events in time order.",
        keywords: Object.freeze(["daily rules timeline", "threshold time", "broken events", "chronological"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "The Daily rules card places the trigger and later broken events in chronological order. For example, it can show which completed trade reached a daily loss limit and which later entry became the first broken event." }),
          Object.freeze({ kind: "callout", title: "Rules broken and Broken events are different", text: "Rules broken counts different rules with at least one broken result. Broken events counts every detected violation, so one rule can supply more than one event." }),
        ]),
      }),
      Object.freeze({
        id: "rule-chart-markers",
        title: "Use Rule markers on the chart",
        summary: "Open the existing chart information box from a gold Rule marker.",
        keywords: Object.freeze(["rule marker", "gold marker", "chart", "rules box", "combined marker"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "A gold Rule marker points to the candle containing the first entry that broke the rule.",
            "Its longer line keeps the Rule label farther from the candle so execution and pattern markers stay easier to read.",
            "When several rules were broken on the same candle, one marker shows the number of rules instead of stacking several labels.",
            "Select the marker to open the chart's information box and read every rule grouped there. Close the box when you are finished.",
          ]) }),
          Object.freeze({ kind: "paragraph", text: "If chart candles are not available for the broken time, TraderLink does not invent a marker. The Broken result and its written details remain available in the rule row." }),
        ]),
      }),
      Object.freeze({
        id: "custom-notes",
        title: "Add a note to a custom result",
        summary: "Save optional context without changing what the result means.",
        keywords: Object.freeze(["rule note", "add note", "view note", "custom result"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Choose Add note or View note on a custom rule when context will help you later. The note can be saved while the result is Followed, Broken or Not selected, and changing the note does not force a different result." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "understand-results",
    title: "Understand rule results",
    description: "Learn what Followed, Broken, N/A and Not selected mean and how triggers differ from broken events.",
    sections: Object.freeze([
      Object.freeze({
        id: "result-meanings",
        title: "What each result means",
        summary: "Read automatic preset results and manual custom selections without mixing their meanings.",
        keywords: Object.freeze(["followed", "broken", "n/a", "not selected", "result meaning"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Result", "Meaning"]), rows: Object.freeze([
            Object.freeze(["Followed", "The available facts satisfied the preset, or you selected Followed for a custom rule."]),
            Object.freeze(["Broken", "The available facts found a preset violation, or you selected Broken for a custom rule."]),
            Object.freeze(["N/A", "A preset could not be checked reliably for that target because required facts were missing, unavailable or ambiguous."]),
            Object.freeze(["Not selected", "No custom-rule result was chosen. TraderLink counts the omission without guessing why."]),
          ]) }),
          Object.freeze({ kind: "callout", title: "N/A is not Broken", text: "N/A means the automatic check could not reach a reliable result. It does not count as Followed or Broken and does not require an override." }),
        ]),
      }),
      Object.freeze({
        id: "trigger-and-broken-event",
        title: "Trigger and broken event",
        summary: "See the difference between reaching a limit and trading after it.",
        keywords: Object.freeze(["trigger", "threshold", "broken event", "violation", "first later trade"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "For a stop rule, the trigger is the event that reaches your selected limit. The broken event is a later trade that starts after the limit was reached." }),
          Object.freeze({ kind: "table", columns: Object.freeze(["Example", "What happens"]), rows: Object.freeze([
            Object.freeze(["Maximum 3 completed trades", "Trade 3 reaches the allowed count. The entry that starts Trade 4 is the first broken event."]),
            Object.freeze(["Stop after a $500 realized loss", "The closing trade that takes the day to -$500 or lower reaches the limit. A later entry is the first broken event."]),
            Object.freeze(["Cooldown for 15 minutes after a loss", "The losing trade's closing time starts the wait. An entry before the 15 minutes end is a broken event."]),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "pnl-and-fees",
        title: "P/L and fee information",
        summary: "Rule results use the actual realized result of the affected completed trade when it is available.",
        keywords: Object.freeze(["p/l", "profit", "loss", "fees", "broken trade result"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "A broken event can show the realized gain or loss from its completed trade. A gain does not erase the Broken result: Broken describes the rule check, while P/L describes the trade outcome." }),
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Complete fee coverage means the saved result includes the fees available for every affected completed trade.",
            "Partial fee coverage means some affected trades have complete fee information and others do not.",
            "Unavailable fee coverage is shown plainly. TraderLink does not replace unknown fees with zero.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "results-can-update",
        title: "When an automatic result can update",
        summary: "Corrected trading facts can produce corrected automatic evidence.",
        keywords: Object.freeze(["correct trade", "updated result", "import correction", "data decision"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Preset results are rebuilt from your current accepted trading record. If an execution time, price, quantity, fee or completed-trade result is corrected, the matching automatic rule result can also change." }),
          Object.freeze({ kind: "callout", title: "Correct the trade facts first", text: "If an automatic result looks wrong because the trade details are wrong, correct the execution or finish the related Data Decision. Do not treat the old result as a separate fact to edit." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "results-history",
    title: "Use Rule Results and history",
    description: "Compare factual totals by rule, search individual checks and keep different settings separate.",
    sections: Object.freeze([
      Object.freeze({
        id: "open-rule-results",
        title: "Open Rule Results",
        summary: "Move from Trading Rules to the factual history page.",
        keywords: Object.freeze(["rule results", "view results", "statistics", "history"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Choose View results from Trading Rules to open Rule Results. The page combines automatic preset checks and saved custom-rule selections for the current Trade Tracker account." }),
          Object.freeze({ kind: "link", href: "/rules/results", label: "Open Rule Results", text: "Use Rule Results when you want totals and a searchable history instead of one day's review." }),
        ]),
      }),
      Object.freeze({
        id: "summary-cards",
        title: "Read the summary cards",
        summary: "Keep different counts and populations separate.",
        keywords: Object.freeze(["rules broken", "broken events", "eligible checks", "not selected"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Summary", "What it counts"]), rows: Object.freeze([
            Object.freeze(["Rules broken", "Different rules with at least one Broken result in the available history."]),
            Object.freeze(["Broken events", "Every detected preset violation and every saved custom Broken selection."]),
            Object.freeze(["Eligible checks", "Preset and custom opportunities included in the result history."]),
            Object.freeze(["Not selected", "Custom opportunities where no result was chosen."]),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "results-by-rule",
        title: "Read results by rule",
        summary: "Review counts, trading days, actual P/L and concentration facts for one rule version.",
        keywords: Object.freeze(["results by rule", "largest gain", "largest loss", "ticker concentration", "fee coverage"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Followed, Broken, N/A and Not selected are shown as separate facts.",
            "Broken-event P/L combines the actual realized results available for the affected completed trades.",
            "Largest gain, largest loss and gain concentration show when one trade supplied a large share of the total.",
            "Ticker concentration shows when several broken events occurred in the same ticker.",
            "Fee coverage tells you whether the displayed results have complete, partial or unavailable fee information.",
          ]) }),
          Object.freeze({ kind: "callout", title: "You decide what the facts mean", text: "Rule Results does not label a rule helpful or harmful and does not tell you to keep, change or remove it." }),
        ]),
      }),
      Object.freeze({
        id: "versions",
        title: "Keep rule versions separate",
        summary: "A changed setting has its own results and active time.",
        keywords: Object.freeze(["rule version", "earlier setting", "current setting", "effective date"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Each result card shows its rule version. If you change a $300 daily loss rule to $500, the earlier $300 results stay with the earlier version and the $500 setting begins its own history." }),
          Object.freeze({ kind: "paragraph", text: "Paused time is not silently included in either version. Retired rules keep their completed history even though they no longer receive new checks." }),
        ]),
      }),
      Object.freeze({
        id: "search-filter-sort",
        title: "Search, filter and sort the history",
        summary: "Find a date, ticker, rule, note or result and open the matching trading day.",
        keywords: Object.freeze(["search rule history", "filter preset manual", "sort p/l", "view day", "pagination"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Search by rule name, date, ticker or custom note.",
            "Filter by Preset or Manual, by result, and by Day or Trade target.",
            "Sort by newest date, oldest date or highest available P/L.",
            "Use Previous and Next to move through longer histories. Filters and search apply before the page is divided.",
            "Choose View day to open the matching Daily Trade Tracker date.",
          ]) }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "data-availability",
    title: "Data availability and limitations",
    description: "Understand which trades can be checked, why N/A appears and when chart, fee or timing evidence is unavailable.",
    sections: Object.freeze([
      Object.freeze({
        id: "eligible-trades",
        title: "Trades included in preset checks",
        summary: "Preset checks use accepted completed Day trades for the selected account.",
        keywords: Object.freeze(["eligible trades", "completed day trade", "swing", "open position", "data decisions"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "A completed Day trade begins when the position leaves zero and ends when it returns to zero.",
            "Open positions are not guessed into a realized result.",
            "Intentional Swing trades do not enter Day-rule checks.",
            "A trade that still needs a factual Data Decision is excluded only where that unresolved fact is required. Unrelated valid trades remain usable.",
            "Rules and results belong to the currently selected Trade Tracker account.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "facts-needed",
        title: "Facts needed for automatic checks",
        summary: "Different presets require different parts of the saved trading record.",
        keywords: Object.freeze(["required facts", "entry time", "exit time", "price", "p/l", "timezone"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Rule family", "Information it needs"]), rows: Object.freeze([
            Object.freeze(["Entry-price range", "A complete weighted-average entry price and currency facts."]),
            Object.freeze(["Cooldown and time cutoff", "Exact entry and exit times and the account's accepted timezone."]),
            Object.freeze(["Trade and ticker counts", "Unambiguous completed-trade order and stable ticker identity."]),
            Object.freeze(["Loss counts and money limits", "Exact completed-trade order and realized P/L."]),
            Object.freeze(["Chart marker", "A candle covering the broken event's exact time."]),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "why-na-appears",
        title: "Why N/A appears",
        summary: "N/A protects the history from a result that the available facts cannot support.",
        keywords: Object.freeze(["why n/a", "missing data", "ambiguous time", "unavailable result"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "A required time, price, P/L value or timezone is unavailable.",
            "Two events at the same time cannot be ordered reliably for a sequence-based rule.",
            "A fact needed to connect the trigger with the later trade is incomplete or still waiting for a factual decision.",
          ]) }),
          Object.freeze({ kind: "paragraph", text: "Open Why N/A on the rule row to see the reason for that check. N/A stays separate from Followed and Broken." }),
        ]),
      }),
      Object.freeze({
        id: "timezone-and-trading-day",
        title: "Time and trading-day boundaries",
        summary: "Time-based rules use the Trade Tracker account's accepted timezone.",
        keywords: Object.freeze(["timezone", "eastern time", "trading date", "cutoff", "day boundary"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Daily Trade Tracker currently presents trading times in Eastern Time. A time cutoff and the order of entries and exits are compared using the accepted account timezone, including daylight-saving changes." }),
          Object.freeze({ kind: "paragraph", text: "A daily rule applies only to the matching trading date. It does not carry a count or realized total into the next trading day." }),
        ]),
      }),
      Object.freeze({
        id: "fees-and-chart-coverage",
        title: "Fee and chart coverage",
        summary: "Missing fees or candles are shown as limitations instead of being guessed.",
        keywords: Object.freeze(["fee coverage", "chart coverage", "missing candle", "unavailable fees"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "A preset can still be Broken when its exact time and sequence are known even if fee coverage or chart candles are unavailable. The result details state the missing coverage separately." }),
          Object.freeze({ kind: "callout", title: "No invented zeroes or markers", text: "Unknown fees are not treated as $0, and a Rule marker is not placed on a candle that does not cover the broken time." }),
        ]),
      }),
    ]),
  }),
]);

export function tradingRulesGuideBySlug(slug: string): HelpGuide | undefined {
  return TRADING_RULES_HELP_GUIDES.find((guide) => guide.slug === slug);
}
