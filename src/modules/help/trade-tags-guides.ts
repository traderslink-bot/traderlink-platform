import type { HelpGuide } from "./help-guide-types";

export const TRADE_TAGS_HELP_GUIDES: readonly HelpGuide[] = Object.freeze([
  Object.freeze({
    slug: "getting-started",
    title: "Getting started",
    description: "Learn what Trade Tags do, where they belong and how to start with a small useful set.",
    sections: Object.freeze([
      Object.freeze({
        id: "what-trade-tags-do",
        title: "What Trade Tags do",
        summary: "Give individual trades short labels you can recognize and reuse later.",
        keywords: Object.freeze(["trade tags", "tag a trade", "labels", "organize trades", "getting started"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Trade Tags help you record the setup, execution choice, exit, mistake, emotion, market context or risk process that you believe described one trade. A trade can have several tags." }),
          Object.freeze({ kind: "callout", title: "You choose every tag", text: "TraderLink does not infer a setup, mistake, emotion or market condition from your executions or P/L. A saved tag means you selected it." }),
        ]),
      }),
      Object.freeze({
        id: "where-tags-belong",
        title: "Where tags belong",
        summary: "Tags describe one completed trade or a supported Swing position.",
        keywords: Object.freeze(["individual trade", "ticker", "day", "day trade", "swing trade"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Place", "How tags apply"]), rows: Object.freeze([
            Object.freeze(["Completed Day trade", "Tags belong to the selected Trade 1, Trade 2 or other complete trade in that ticker."]),
            Object.freeze(["Swing position", "Tags belong to that specific position in Swing Trade Tracker."]),
            Object.freeze(["Ticker", "Tags do not automatically apply to every trade in the same ticker."]),
            Object.freeze(["Complete day", "Tags are not day-wide labels. Use Daily Notes for observations about the day as a whole."]),
            Object.freeze(["Execution", "A tag describes the trade, not one individual buy or sell fill."]),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "preset-and-custom-tags",
        title: "Preset and custom tags",
        summary: "Choose a ready-made label or create wording that fits your process better.",
        keywords: Object.freeze(["preset tag", "custom tag", "create tag", "tag categories"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Tag type", "What it means"]), rows: Object.freeze([
            Object.freeze(["Preset", "A ready-made label grouped under Setup, Entry and execution, Exit, Mistake, Emotion, Market context, or Risk and process."]),
            Object.freeze(["Custom", "A reusable tag you create in your own words when the preset list does not fit."]),
          ]) }),
          Object.freeze({ kind: "paragraph", text: "Presets are suggestions for organizing your own observations. Selecting one does not mean TraderLink confirmed that behavior." }),
        ]),
      }),
      Object.freeze({
        id: "simple-workflow",
        title: "A simple Tag workflow",
        summary: "Choose only useful labels and keep the wording consistent.",
        keywords: Object.freeze(["tag workflow", "add tags", "review tags", "consistent tags"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Open one trade", text: "In Daily Trade Tracker, open the ticker and select the exact completed trade you want to describe." }),
            Object.freeze({ title: "2. Choose Add tags", text: "Select the preset or custom labels that genuinely fit that trade." }),
            Object.freeze({ title: "3. Create a tag if needed", text: "Use a short, reusable name when the existing choices do not match your process." }),
            Object.freeze({ title: "4. Save the complete selection", text: "Choose Save tags. The checked choices become that trade's saved tag list." }),
            Object.freeze({ title: "5. Reuse the same wording", text: "Choose the same tag on later trades when it means the same thing." }),
          ]) }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "add-edit-tags",
    title: "Add and edit trade tags",
    description: "Choose tags for one completed Day trade, save the selection and change it later without changing the trade.",
    sections: Object.freeze([
      Object.freeze({
        id: "open-tag-editor",
        title: "Open the Tag editor",
        summary: "Start from the exact completed trade you want to label.",
        keywords: Object.freeze(["add tags", "edit tags", "daily trade tracker", "trade card"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Open Daily Trade Tracker", text: "Choose the trading date and open the ticker card." }),
            Object.freeze({ title: "2. Select the trade", text: "When the ticker has several trades, choose Trade 1, Trade 2 or the exact trade you want." }),
            Object.freeze({ title: "3. Choose Add tags or Edit tags", text: "Add tags appears when the trade has none. Edit tags appears when it already has saved tags." }),
          ]) }),
          Object.freeze({ kind: "callout", title: "Check the selected trade", text: "Tags belong only to the selected completed trade. Changing from Trade 1 to Trade 2 changes which tag list you are editing." }),
        ]),
      }),
      Object.freeze({
        id: "choose-tags",
        title: "Choose tags",
        summary: "Use the grouped checkboxes to build the complete tag list for that trade.",
        keywords: Object.freeze(["choose tags", "checkbox", "tag category", "preset choices"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Scroll through the grouped preset and custom choices.",
            "Check a tag to include it and clear a check to remove it from this trade.",
            "Choose only labels that you believe describe the trade. A preset is not an automatic finding.",
            "One trade can have up to 10 tags.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "create-while-editing",
        title: "Create a tag while editing",
        summary: "Add a reusable custom choice without leaving the trade.",
        keywords: Object.freeze(["create tag", "new tag", "custom tag", "enter key"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Enter a name in Create tag and choose Create. You can also press Enter. The new tag is added to your choices and selected for the current trade; choose Save tags to finish the trade assignment." }),
          Object.freeze({ kind: "paragraph", text: "A tag name can use up to 40 visible characters. Extra spaces are cleaned up, and two names that differ only by capitalization are treated as the same name." }),
        ]),
      }),
      Object.freeze({
        id: "save-or-cancel",
        title: "Save or cancel your changes",
        summary: "Save the complete checked set or leave the existing trade tags unchanged.",
        keywords: Object.freeze(["save tags", "cancel tags", "remove tag from trade", "ten tags"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Choice", "What happens"]), rows: Object.freeze([
            Object.freeze(["Save tags", "Replaces that trade's tag list with the complete set currently checked."]),
            Object.freeze(["Cancel", "Closes the editor without changing that trade's saved selection."]),
            Object.freeze(["Clear a checkbox and save", "Removes that tag from this trade only. The reusable tag remains available for other trades."]),
          ]) }),
          Object.freeze({ kind: "callout", tone: "warning", title: "Maximum 10 tags per trade", text: "Save tags is unavailable when more than 10 choices are checked. Clear one or more choices before saving." }),
        ]),
      }),
      Object.freeze({
        id: "edit-later",
        title: "Edit tags later",
        summary: "Correcting tags does not edit executions, P/L, rules or analysis.",
        keywords: Object.freeze(["edit later", "correct tags", "mark day reviewed", "trade facts"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "You can return to the trading day and edit tags after saving notes or marking the day reviewed, as long as the page is available for editing. Tag changes do not alter the trade's executions, realized result, Rule results or Analyzer results." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "preset-tags-reference",
    title: "Preset tags reference",
    description: "See all 41 preset labels and use each category as a prompt for your own honest trade review.",
    sections: Object.freeze([
      Object.freeze({
        id: "setup-tags",
        title: "Setup",
        summary: "Describe the price-action setup you believed you were trading.",
        keywords: Object.freeze(["setup tags", "breakout", "pullback", "reversal", "vwap reclaim"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Preset", "Plain meaning"]), rows: Object.freeze([
            Object.freeze(["Breakout", "You treated the trade as a move through a level or range boundary."]),
            Object.freeze(["Pullback", "You entered during or after a retracement within a larger move."]),
            Object.freeze(["Reversal", "You expected price to change direction from the prior move."]),
            Object.freeze(["Range breakout", "You treated the trade as a move out of a defined sideways range."]),
            Object.freeze(["VWAP reclaim", "You treated a move back above or below VWAP as part of the setup."]),
            Object.freeze(["First pullback", "You treated the first clear retracement after a move began as the setup."]),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "entry-execution-tags",
        title: "Entry and execution",
        summary: "Describe your entry timing and the quality of the fill you recorded.",
        keywords: Object.freeze(["entry tags", "patient entry", "early entry", "late entry", "chased", "fill"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Preset", "Plain meaning"]), rows: Object.freeze([
            Object.freeze(["Patient entry", "You believe you waited for the entry you planned."]),
            Object.freeze(["Early entry", "You believe you entered before your planned confirmation or timing."]),
            Object.freeze(["Late entry", "You believe the planned opportunity was already underway before you entered."]),
            Object.freeze(["Chased entry", "You believe you followed price after it had already moved away from the preferred entry."]),
            Object.freeze(["Good fill", "You believe the completed fill was favorable for the order and conditions you faced."]),
            Object.freeze(["Poor fill", "You believe the completed fill was unfavorable for the order and conditions you faced."]),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "exit-tags",
        title: "Exit",
        summary: "Describe how the trade was reduced or closed compared with your plan.",
        keywords: Object.freeze(["exit tags", "target", "cut loss", "too early", "held too long", "scaled out"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Preset", "Plain meaning"]), rows: Object.freeze([
            Object.freeze(["Followed target", "You believe the exit followed the target in your plan."]),
            Object.freeze(["Cut loss quickly", "You believe you exited a losing position promptly."]),
            Object.freeze(["Exit too early", "You believe you closed or reduced the trade earlier than intended."]),
            Object.freeze(["Held too long", "You believe you stayed in the trade longer than your plan supported."]),
            Object.freeze(["Scaled out", "You reduced the position in more than one exit instead of closing it all at once."]),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "mistake-tags",
        title: "Mistake",
        summary: "Record a mistake only when you believe it genuinely occurred.",
        keywords: Object.freeze(["mistake tags", "fomo", "overtraded", "averaged down", "ignored stop", "oversized", "revenge trade"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Preset", "Plain meaning"]), rows: Object.freeze([
            Object.freeze(["FOMO", "Fear of missing out influenced the decision to enter or remain in the trade."]),
            Object.freeze(["Overtraded", "You believe the trade was part of taking more trades than your plan supported."]),
            Object.freeze(["Averaged down", "You added while price moved against the position and lowered the average price."]),
            Object.freeze(["Ignored stop", "You did not act on the stop or exit condition in your plan."]),
            Object.freeze(["Oversized", "The position size was larger than your intended risk allowed."]),
            Object.freeze(["Revenge trade", "You believe the trade was driven by trying to recover a prior loss quickly."]),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "emotion-tags",
        title: "Emotion",
        summary: "Record the emotional state you noticed while making the trade decisions.",
        keywords: Object.freeze(["emotion tags", "calm", "confident", "hesitant", "anxious", "frustrated", "impulsive"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Calm",
            "Confident",
            "Hesitant",
            "Anxious",
            "Frustrated",
            "Impulsive",
          ]) }),
          Object.freeze({ kind: "callout", title: "Your observation, not a diagnosis", text: "Emotion tags record how you describe your state. TraderLink does not determine an emotion from trade behavior." }),
        ]),
      }),
      Object.freeze({
        id: "market-context-tags",
        title: "Market context",
        summary: "Record the market conditions you believed were relevant to the trade.",
        keywords: Object.freeze(["market context", "trend", "choppy", "volatility", "low volume", "news driven", "broad market"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Strong trend",
            "Choppy market",
            "High volatility",
            "Low volume",
            "News-driven",
            "Broad-market support",
          ]) }),
          Object.freeze({ kind: "paragraph", text: "These tags reflect the context you chose to record. They are not automatically confirmed by news, candle or market-data checks." }),
        ]),
      }),
      Object.freeze({
        id: "risk-process-tags",
        title: "Risk and process",
        summary: "Describe whether you believe the trade followed your chosen risk and decision process.",
        keywords: Object.freeze(["risk tags", "followed plan", "broke rule", "risk control", "took break", "waited confirmation"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Preset", "Plain meaning"]), rows: Object.freeze([
            Object.freeze(["Followed plan", "You believe the trade followed the plan you set for it."]),
            Object.freeze(["Broke a rule", "You believe a rule in your trading plan was broken. This tag does not create an automatic Rule result."]),
            Object.freeze(["Good risk control", "You believe size, loss control and exposure matched your plan."]),
            Object.freeze(["Poor risk control", "You believe one or more risk choices did not match your plan."]),
            Object.freeze(["Took a break", "You recorded that you paused before or after this trade as part of your process."]),
            Object.freeze(["Waited for confirmation", "You believe you waited for the confirmation required by your plan."]),
          ]) }),
          Object.freeze({ kind: "callout", title: "Tags and Rules are separate", text: "Choosing Broke a rule is your trade label. It does not mark a Trading Rule Broken, and an automatic Broken result does not add this tag for you." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "custom-tags",
    title: "Create and manage custom tags",
    description: "Create clear reusable names, rename them everywhere and retire tags you no longer want in current trade views.",
    sections: Object.freeze([
      Object.freeze({
        id: "create-useful-tag",
        title: "Create a useful custom tag",
        summary: "Choose wording that will mean the same thing when you see it again later.",
        keywords: Object.freeze(["create custom tag", "tag name", "reusable wording", "40 characters"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Use a short name that describes one repeatable setup, decision or condition.",
            "Keep one meaning per tag. For example, separate Opening range setup from Late entry instead of combining both ideas.",
            "Names can contain up to 40 visible characters.",
            "Names must be unique for the selected Trade Tracker account. Capitalization and extra spaces do not create a second version of the same name.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "open-manage-tags",
        title: "Open Manage tags",
        summary: "Manage the reusable list from a completed Day trade.",
        keywords: Object.freeze(["manage tags", "daily trade tracker", "rename tag", "delete tag"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Open a completed Day trade", text: "Choose Add tags or Edit tags on the trade." }),
            Object.freeze({ title: "2. Choose Manage tags", text: "The management window lists your active tag names and how many current trades use each one." }),
            Object.freeze({ title: "3. Rename or delete", text: "Save improved wording or retire a tag you no longer want in current trade views." }),
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "rename-tag",
        title: "Rename a tag",
        summary: "One saved rename updates the reusable label wherever that active tag appears.",
        keywords: Object.freeze(["rename tag", "change tag name", "assignment count", "preset rename"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Change the name in Manage tags and choose Save. The same tag keeps its trade assignments and displays the new wording in current views." }),
          Object.freeze({ kind: "paragraph", text: "A selected preset becomes part of your reusable tag list. If you rename it, the renamed wording behaves like a custom tag and the original preset wording can appear as a choice again." }),
        ]),
      }),
      Object.freeze({
        id: "retire-tag",
        title: "Retire a tag",
        summary: "Hide an unwanted tag from current trade views while preserving its history.",
        keywords: Object.freeze(["delete tag", "retire tag", "assigned trades", "confirmation"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Choose Delete in Manage tags. If current trades use the tag, TraderLink shows the assignment count and asks you to confirm before retiring it." }),
          Object.freeze({ kind: "callout", tone: "warning", title: "Retirement affects every current assignment", text: "Confirming retirement hides that tag from all current trade views, not only the trade you opened. Its history is preserved, and retirement cannot be undone from the current Tag controls." }),
          Object.freeze({ kind: "paragraph", text: "To remove a tag from only one trade, clear its checkbox in that trade's Edit tags window and save instead of retiring the tag." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "swing-trade-tracker",
    title: "Use tags in Swing Trade Tracker",
    description: "Choose preset or custom tags for one supported Swing position and keep them with that position over time.",
    sections: Object.freeze([
      Object.freeze({
        id: "find-swing-tags",
        title: "Find tags on a Swing position",
        summary: "Open the position's annotation area in Swing Trade Tracker.",
        keywords: Object.freeze(["swing tags", "swing trade tracker", "position tags", "add tags"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Open Swing Trade Tracker and find the position you want to review. Its Trade tags area shows the saved chips and an Add tags or Edit tags button." }),
          Object.freeze({ kind: "callout", title: "Tags stay with the position", text: "A Swing tag belongs to that specific tracked position. It does not automatically tag every trade in the ticker." }),
        ]),
      }),
      Object.freeze({
        id: "choose-swing-tags",
        title: "Choose and save Swing tags",
        summary: "Use the same preset and custom list available to your selected Trade Tracker account.",
        keywords: Object.freeze(["edit swing tags", "save swing tags", "preset swing tag", "custom swing tag"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "steps", items: Object.freeze([
            Object.freeze({ title: "1. Choose Add tags or Edit tags", text: "Open the tag choices for that Swing position." }),
            Object.freeze({ title: "2. Check the useful labels", text: "Choose from the grouped presets and your existing custom tags." }),
            Object.freeze({ title: "3. Create a tag if needed", text: "Enter a new reusable name and choose Create." }),
            Object.freeze({ title: "4. Choose Save tags", text: "The complete checked set becomes the position's saved tag list." }),
          ]) }),
          Object.freeze({ kind: "paragraph", text: "The same maximum of 10 tags applies to a Swing position." }),
        ]),
      }),
      Object.freeze({
        id: "manage-swing-tag-names",
        title: "Manage names used by Swing positions",
        summary: "Create and assign in Swing Tracker; use Daily Trade Tracker for the current global management window.",
        keywords: Object.freeze(["rename swing tag", "delete swing tag", "manage tags", "shared tag list"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Day and Swing trades use the same reusable tag list for the selected account. Swing Trade Tracker can create and assign tags. To rename or retire a reusable tag, open Manage tags from a completed Day trade in Daily Trade Tracker." }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "where-tags-are-used",
    title: "Where tags are used",
    description: "Understand where saved tags appear today, how AI Reviews may use them and which tag tools are not available yet.",
    sections: Object.freeze([
      Object.freeze({
        id: "trade-tracker-views",
        title: "Trade Tracker and Trade Explorer",
        summary: "Saved tags appear with their matching trade or supported position and can be edited from the matching review tools.",
        keywords: Object.freeze(["where tags appear", "tag chips", "daily tracker", "swing tracker", "trade explorer"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Daily Trade Tracker shows tags on the matching completed trade.",
            "Swing Trade Tracker shows tags on the matching supported Swing position.",
            "Trade Explorer opens the same completed-trade tag assignment from its Review action.",
            "Switching between two completed trades in one ticker switches their separate tag lists.",
            "Renaming an active tag updates its wording wherever that reusable tag appears in current views.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "ai-reviews",
        title: "AI Reviews",
        summary: "Tags saved before review generation may provide trader-authored context.",
        keywords: Object.freeze(["tags in AI Reviews", "review evidence", "saved before generation", "missing tags"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "An AI Review may use non-empty tags saved for trades inside its review period. A tag can add context that execution facts alone cannot show, such as the setup or emotion you chose to record." }),
          Object.freeze({ kind: "callout", title: "The saved tag is your statement", text: "AI Reviews may describe a tag you selected, but they should not present it as an independently confirmed setup, emotion or cause." }),
          Object.freeze({ kind: "paragraph", text: "Tags changed after a review starts do not silently rewrite that already issued review. Future reviews can use the updated saved information." }),
          Object.freeze({ kind: "link", href: "/help/ai-reviews/what-ai-uses#saved-reflections", label: "Read what AI Reviews can use", text: "The AI Reviews guide explains how tags fit with notes, rules and verified trading facts." }),
        ]),
      }),
      Object.freeze({
        id: "not-yet-available",
        title: "Tag tools not yet available",
        summary: "Keep current Help separate from future tag search and analysis ideas.",
        keywords: Object.freeze(["tag analytics", "tag filters", "bulk tags", "automatic tags", "not available"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Ordinary Analytics does not currently provide tag-based totals or comparisons.",
            "There is no Trade Explorer tag filter in the current replacement app.",
            "Bulk assignment across many trades is not available.",
            "TraderLink and AI do not automatically add or suggest tags.",
          ]) }),
        ]),
      }),
    ]),
  }),
  Object.freeze({
    slug: "data-availability",
    title: "Data availability and limitations",
    description: "Understand account boundaries, tag limits, editable history and places where saving tags is not currently connected.",
    sections: Object.freeze([
      Object.freeze({
        id: "account-boundary",
        title: "Tags belong to one Trade Tracker account",
        summary: "Switching accounts changes the reusable tag list and trade assignments you can see.",
        keywords: Object.freeze(["tag account", "account switcher", "private tags", "separate accounts"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Tag names and assignments belong to the selected Trade Tracker account. A tag created in one account does not automatically appear in another account, even when the same person uses both." }),
        ]),
      }),
      Object.freeze({
        id: "limits",
        title: "Tag limits",
        summary: "Keep names and trade selections within the current saved limits.",
        keywords: Object.freeze(["tag limit", "10 tags", "200 tags", "40 characters", "duplicate name"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "table", columns: Object.freeze(["Limit", "Current value"]), rows: Object.freeze([
            Object.freeze(["Tags on one trade or supported Swing position", "10"]),
            Object.freeze(["Tag names for one Trade Tracker account", "200, including names retained for preserved history"]),
            Object.freeze(["Visible characters in one tag name", "40"]),
          ]) }),
          Object.freeze({ kind: "paragraph", text: "A tag name must be unique inside the account. Capitalization, leading or trailing spaces, and repeated spaces do not create a different name." }),
        ]),
      }),
      Object.freeze({
        id: "supported-trades",
        title: "Where tags can be saved",
        summary: "Completed trades and connected Swing positions support saved tags today.",
        keywords: Object.freeze(["supported tag targets", "completed trade", "open position", "swing position", "read only"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "A completed Day trade can save tags from its Daily Trade Tracker card.",
            "Any confirmed completed trade shown in Trade Explorer can save tags from its Review editor.",
            "A connected Swing position can save tags from Swing Trade Tracker.",
            "An ordinary open-position row inside Daily Trade Tracker does not currently save a tag selection. If the position is an intentional Swing, classify it and use Swing Trade Tracker.",
            "Other historical read-only pages can display saved tags without offering the Trade Explorer Review editor.",
          ]) }),
        ]),
      }),
      Object.freeze({
        id: "trade-corrections",
        title: "Trade corrections and tag history",
        summary: "Tags do not become evidence for a different trade when trade facts change.",
        keywords: Object.freeze(["trade correction", "tag history", "import correction", "data decision", "missing tag"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "paragraph", text: "Tags are attached to the exact saved trade or position. If an import correction or Data Decision changes that trade's identity, TraderLink does not guess that an old tag belongs to a different trade." }),
          Object.freeze({ kind: "paragraph", text: "A tag may therefore be absent from the corrected trade until the connection can be confirmed or you select the tag again. The earlier history is preserved instead of being moved by a guess." }),
        ]),
      }),
      Object.freeze({
        id: "saving-problems",
        title: "When a tag change will not save",
        summary: "Use the visible message to correct the selection or refresh changed account data.",
        keywords: Object.freeze(["tag not saving", "duplicate tag", "refresh", "account changed", "too many tags"]),
        blocks: Object.freeze([
          Object.freeze({ kind: "bullets", items: Object.freeze([
            "Clear choices when more than 10 tags are selected.",
            "Use different wording when the name already exists in the selected account.",
            "Shorten a name longer than 40 visible characters.",
            "Refresh and try again when the tag or selected account changed in another page.",
            "Confirm retirement when a tag is still used by current trades and you want to hide it from all of them.",
          ]) }),
        ]),
      }),
    ]),
  }),
]);

export function tradeTagsGuideBySlug(slug: string): HelpGuide | undefined {
  return TRADE_TAGS_HELP_GUIDES.find((guide) => guide.slug === slug);
}
