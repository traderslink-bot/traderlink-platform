import type { HelpGuide } from "./help-guide-types";

export const WATCHLIST_HELP_GUIDES: readonly HelpGuide[] = [{
  slug: "analysis", title: "Read Watchlist analysis",
  description: "Understand the posted price, setup areas and analysis updates.",
  sections: [{
    id: "setups", title: "TradersLink Analysis", summary: "Read the setup that fits your trading style.",
    keywords: ["watchlist", "pullback", "breakout", "failure", "posted price"],
    blocks: [{ kind: "paragraph", text: "Watchlist posts highlight active stocks attracting volume and attention—they are not signals to rush into a trade. Wait for your setup and use the pullback, breakout, and failure levels. A break below the failure level invalidates the momentum idea. The posted price reflects the price at the time of analysis." },
      { kind: "paragraph", text: "An analysis can include shallow and deep pullback areas, breakout continuation, where price could go next, and a separate recovery setup. Not every section is available for every ticker. An omitted setup does not mean the remaining analysis was rejected. If no analysis is displayed, available support and resistance levels still provide price context." }],
  }, {
    id: "updates", title: "Price and analysis updates", summary: "Live data and a new analysis are separate updates.",
    keywords: ["live price", "analysis time", "refresh"],
    blocks: [{ kind: "paragraph", text: "Price and market data can continue updating while the published analysis remains unchanged. Read the analysis timestamp and reference price; a live price change does not mean a new analysis has been generated." }],
  }],
}, {
  slug: "owner-review", title: "Review and publish Watchlist analysis",
  description: "Owner controls for drafts, approval, delivery and audit export.",
  sections: [{
    id: "approval", title: "Analysis Review", summary: "Review a saved analysis before publishing it.",
    keywords: ["owner", "admin", "approve", "draft", "Discord"],
    blocks: [{ kind: "steps", items: [
      { title: "Open the draft", text: "In Watchlist Admin, review status and View / edit analysis appear on eligible ticker rows automatically. That button opens the actual analysis card with inline section editors. The existing Analysis Review workflow in AI Controls also remains available. When review is required, the new post stays private while analysis is prepared and reviewed. A failed replacement leaves the previous saved version available; a storage error is not a successful save or publication." },
      { title: "Edit and save", text: "Expand Edit beside a card section to change text and prices, add or remove supported rows, include a missing setup, or hide/show a section. Save and close saves a separate edited version without publishing. Close warns before discarding unsaved edits. Editing does not request another AI analysis. Choose Approve and publish on the ticker row to publish the saved version, whether or not you edited it. Delivery details opens the existing recovery controls when delivery needs attention." },
      { title: "Preview and approve", text: "Preview the saved version. Website preview shows the analysis card; Discord preview shows the saved message text. Approve and publish authorizes that saved version. Published with omissions identifies recorded validation removals still reflected in the approved version. Review the saved analysis checks for details. If you edit again, save and preview again before approval." },
    ] }, { kind: "paragraph", text: "If a breakout was omitted from a draft, its editing fields remain available. Enter your corrected price and explanation, enable Show this section if needed, then save and preview. Price-order warnings do not rewrite or block your correction. The original and your saved version remain separate." },
      { kind: "paragraph", text: "A generation may provide a primary breakout and an optional supported backup in the same AI request. Both the price and explanation are checked before selection. Only the selected breakout appears in the draft; you can edit it before approval. If neither works, independent valid setups can remain. Candidate selection and omission reasons are kept in the audit." },
      { kind: "paragraph", text: "Website and Discord delivery are tracked separately. If delivery needs attention, inspect its status before retrying. An uncertain delivery must not be treated as a confirmed failure or blindly resent." },
      { kind: "paragraph", text: "If an approved message appeared in Discord but its delivery is awaiting confirmation, select that message part, enter its Discord message ID, and choose Verify existing message. Verification checks the existing message against the approved text and records a matching receipt; it does not send a message. After successful verification, Retry Discord delivery can finish any remaining parts without resending confirmed parts. A message that cannot be verified stays unresolved." }],
  }, {
    id: "controls", title: "Generation controls", summary: "Choose review and automatic follow-up behavior.",
    keywords: ["automatic updates", "manual refresh", "session", "cost"],
    // Interrupted requests must not look like a never-generated activation.
    blocks: [{ kind: "paragraph", text: "Automatic follow-up AI requests are off by default. Turning them off preserves their settings for later and does not stop live price/data updates. Manual refresh remains available and requests a new analysis. When a required-review replacement is waiting for approval or its generation failed, another automatic request waits for owner action; live data continues." },
      { kind: "paragraph", text: "Review before publishing applies to new activations when analysis generation is enabled for that session. If generation is off when you add the ticker, the post follows the normal publishing path without an initial AI request, even if settings or the session change while it prepares. Manual refresh remains available when generation is enabled. With review enabled, replacement analyses also wait for approval, including refreshes of older public tickers. The existing public analysis and live data remain available. Changing review settings does not silently approve a post already waiting for review." },
      { kind: "paragraph", text: "If a request was interrupted before publication was acknowledged, restart keeps that status visible. With automatic updates off, it does not send another initial request. Manual refresh remains a separate request when generation is enabled." }],
  }, {
    id: "inspect-request", title: "Inspect request", summary: "Open available request records in Watchlist Admin.",
    keywords: ["request", "input packet", "response", "omission", "validation"],
    blocks: [{ kind: "paragraph", text: "Choose an Audit generation, then Inspect request. Analysis checks summarize recorded section omissions, optional objective omissions and breakout selection. New original drafts retain their validation decisions with the saved version, so those reasons remain available even if temporary diagnostics expire. Owner edits remain separate from the original decisions. Expand the validation records or original version for full reasons and prices, or inspect the input packet, AI response and saved versions. Missing diagnostics are labelled. Very large sections are shortened on screen for performance; Export audit contains the full available record. Inspecting does not generate or publish analysis." },
      { kind: "paragraph", text: "Analysis checks also explain recorded core and must-clear price anchors and failed checks. A pullback or recovery explanation that fails a volume or session-high claim check can be omitted without removing an independent valid setup. Open its validation record for the original explanation and exact reason. These checks describe the generated analysis, not your later corrections; owner edits are saved separately." },
      { kind: "paragraph", text: "Captured records lists how many input, response, validation, prepared-analysis and transport-error records are available. A zero does not prove that no request was sent or that the stage never occurred; it means that record is unavailable in this audit." },
      { kind: "paragraph", text: "New input records include prompt, schema and request hashes, plus a fingerprint of the named analysis code files and the deployed commit when available. Missing code files are marked incomplete. This fingerprint covers the listed analysis modules, not the entire application." },
      { kind: "paragraph", text: "A rejected checkpoint can also remove levels that depend on it. Separately supported independent levels can remain. Older responses without dependency details may omit the later part of that sequence. The audit preserves the omitted levels and reasons; you can still edit the draft before approval." },
      { kind: "paragraph", text: "API requests counts distinct recorded attempt IDs for the selected generation, not the number of status or edit rows. Estimated cost uses recorded usage and pricing, including available usage for rejected analyses. Missing historical diagnostics, usage or pricing show Unavailable rather than zero. These recorded totals are not a provider billing statement." }],
  }, {
    id: "audit", title: "Export audit", summary: "Select the generation you want to inspect.",
    keywords: ["original", "edited", "audit", "failed request"],
    blocks: [{ kind: "paragraph", text: "Export audit downloads the selected generation's available request/response diagnostics and saved review history, including original, edited and approved versions when present. Failed generations can also be selected. Use Ticker history to inspect earlier saved histories, including before a ticker was removed and added again. Historical records are read only; select a request there to export its saved analysis and revisions. Review ticker returns to the current review. Missing or unavailable diagnostics are labelled; older requests are not reconstructed. Export does not automatically share the file with Codex or anyone else." }],
  }],
}];
