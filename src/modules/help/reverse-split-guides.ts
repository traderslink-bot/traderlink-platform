import type { HelpGuide } from "./help-guide-types";

export const REVERSE_SPLIT_HELP_GUIDE: HelpGuide = {
  slug: "reverse-splits", title: "Reverse Splits",
  description: "Read verified reverse-split announcements and shareholder approvals.",
  sections: [{
    id: "statuses", title: "Approved and announced splits", summary: "Approval and implementation are different events.",
    keywords: ["reverse split", "shareholder", "approved", "announced", "ratio", "trading date"],
    blocks: [
      { kind: "paragraph", text: "Open Reverse Splits under Stock Tools. Search by ticker, choose All, Approved, Announced or History, and use the page controls to browse the tracked records. Refresh requests the latest saved information; it does not request a new filing or quote from a provider." },
      { kind: "paragraph", text: "Approved means the available source confirms shareholder authorization. An approved ratio range is not the company's final selected ratio. Announced means a selected reverse split has been announced. The trading date appears only when the source confirms the first split-adjusted trading session; a certificate's legal effective time is not automatically that date." },
      { kind: "paragraph", text: "History includes past announced dates, cancellations, postponements and explicitly expired authorizations. A past announced date alone does not prove the split was completed or that trading resumed. Open the source link for the original announcement or filing." },
    ],
  }, {
    id: "float-and-close", title: "Float and closing price", summary: "Read dated market data separately from split terms.",
    keywords: ["float", "estimate", "close", "regular session", "EODHD"],
    blocks: [
      { kind: "paragraph", text: "Float is the EODHD provider-reported estimate, not shares outstanding. Estimated post-split float divides that float by the confirmed future ratio and assumes the provider still reports the pre-split figure. Provider estimates and update timing differ; the calculated result is not a verified new float." },
      { kind: "paragraph", text: "The closing price is the dated regular-session close, not an after-hours quote or a theoretical split-adjusted price. Always check its date. A dash means the value is unavailable. Historical entries do not turn a current float snapshot into a historical float." },
    ],
  }, {
    id: "watchlist-and-coverage", title: "Watchlist and source coverage", summary: "The Watchlist uses the same stored reverse-split information.",
    keywords: ["watchlist", "ticker", "source", "coverage", "missing", "updates"],
    blocks: [
      { kind: "paragraph", text: "A Watchlist ticker shows Reverse split approved or Reverse split announced only when a current verified record is available. Its detail page shows the available ratio, dates, float, closing price and source. An absent label is not proof that no reverse split exists. Posting or viewing a ticker does not send another reverse-split alert." },
      { kind: "paragraph", text: "Coverage notices identify initial collection, delayed sources or information still being verified. The list covers tracked official notices and filings within the supported ticker scope, not a guarantee that every market event has been found. Keep the original source dates in mind when using the information." },
      { kind: "link", href: "/reverse-splits", label: "Open Reverse Splits", text: "Browse the current tracked list." },
    ],
  }],
};
