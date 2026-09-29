# Public preview and images progress

Implementation underway. BKYI published page inspected at September 29 5:25 PM ET; approved analysis shown at September 29 5:20 PM ET, $3.06. Only explicitly selected display content will enter the static public preview. No live quote or member account details.

## Implemented candidate

- Unauthorized /watchlist visits render a static dated BKYI preview and join/sign-in controls. Member reads and detail/API authorization remain unchanged.
- Four light image groups in the approved order, complete section boundaries, new URL watermark, hidden groups omitted. Website analysis content is unchanged.
- Versioned export cache lets a newly requested share use four images without rewriting images frozen for an earlier Discord delivery.
- Free Chat and X accept four images. Help text updated in the exact-parent candidate.

## Verification

Focused offline render and access-branch checks pass. BKYI images are 1000px wide with heights 825, 1624, 1878 and 1730; all four visually inspected for readable text, watermark and clipping. Strict scoped TypeScript passes. Landing JSX was rendered to static HTML; interactive browser/mobile acceptance is not yet verified. Browser file previews are blocked by the browser tool, and no workaround server was started.

Owner follow-up: make the destination URL prominent at the top as well as the bottom of every image. Added a dedicated green bold URL line and 45px of header space without changing content widths or font sizes. All four images retain an identical 1000px width; their differing heights can cause chat thumbnails to appear different widths. Updated heights: 870, 1669, 1923 and 1775.

Owner watermark follow-up: increased navy watermark opacity from 5.5% to 10%. Rechecked PNG metadata: all four remain 1000px wide (heights 870, 1669, 1923, 1775). These are generated exports, not mobile screenshots; thumbnail scaling can change their apparent displayed widths.

No live posts or deployment. Owner visual acceptance and release remain pending. [Plan](watchlist-public-preview-and-images-plan.md).
