# TradersLink Academy Visual Gap Audit: Small-Cap Stocks, Float And Dilution

Date: 2026-05-17

Audit pass: Pass 4 - Visual Gap Audit

Course: Small-Cap Stocks, Float And Dilution

Status: complete

## Scope

Reviewed the 28-lesson Small-Cap Stocks, Float And Dilution course for realistic visual support across small-cap context, float, share structure, dilution, offerings, securities, corporate actions, cash runway, and going-concern risk.

Lessons reviewed:

- `academy/small-cap-stocks.md`
- `academy/penny-stocks.md`
- `academy/stock-float.md`
- `academy/low-float-stocks.md`
- `academy/float-rotation.md`
- `academy/float-vs-shares-outstanding.md`
- `academy/fully-diluted-shares.md`
- `academy/market-cap-vs-fully-diluted-market-cap.md`
- `academy/dilution.md`
- `academy/dilution-risk.md`
- `academy/how-to-spot-dilution-risk.md`
- `academy/stock-offerings.md`
- `academy/public-offering.md`
- `academy/registered-direct-offering.md`
- `academy/private-placement.md`
- `academy/at-the-market-offering.md`
- `academy/shelf-registration.md`
- `academy/shelf-registration-vs-offering.md`
- `academy/warrants.md`
- `academy/warrants-vs-options.md`
- `academy/pre-funded-warrants.md`
- `academy/convertible-notes.md`
- `academy/preferred-stock.md`
- `academy/reverse-split.md`
- `academy/reverse-split-vs-dilution.md`
- `academy/forward-split.md`
- `academy/cash-runway.md`
- `academy/going-concern.md`

Related files reviewed:

- `docs/content/traderslink-academy-quality-audit-small-cap-float-dilution.md`
- `docs/content/traderslink-academy-accuracy-source-audit-small-cap-float-dilution.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-image-asset-manifest.md`
- `public/academy/images/chart-reading/`

## Overall Verdict

Small-Cap Stocks, Float And Dilution is content-ready but visually under-supported.

This course teaches concepts that are hard for beginners to picture: tradable share supply, fully diluted share counts, shelf registrations, prospectus supplements, warrants, convertibles, reverse splits, cash runway, and going-concern warnings. Those are not abstract SEO terms; they are structural context that would benefit from concrete diagrams.

No direct course SVG references were found in the 28 lesson files. That is acceptable for a completed markdown course, but this course should not be treated as fully UI-ready until a focused future visual batch is created.

## Coverage Summary

| Area | Lessons Reviewed | Current Direct Visual Coverage | Result |
|---|---:|---:|---|
| Small-Cap Foundation | 2 | 0 | Needs course opener/risk dashboard support. |
| Float Foundation | 4 | 0 | Needs float and float-rotation diagrams. |
| Share Structure | 2 | 0 | Needs float/share-count/fully diluted stack visuals. |
| Dilution Foundation | 3 | 0 | Needs dilution-risk filing flow and review dashboard support. |
| Offerings | 7 | 0 | Needs offering terms and shelf-to-offering visuals. |
| Securities | 5 | 0 | Needs warrant/convertible/preferred share-supply visuals. |
| Corporate Actions | 3 | 0 | Needs split mechanics context, especially reverse split versus dilution. |
| Cash And Going Concern | 2 | 0 | Needs cash runway and going-concern review visual. |

## Asset Verification

Direct scoped SVG references found in this course:

```text
0
```

Verification result:

- 0 of 28 lessons include direct `visual_assets` metadata.
- 0 of 28 lessons include in-body SVG placements.
- No course-specific SVG files needed manifest verification in this pass.
- No existing SVG labels required cleanup.

## Lesson-Level Visual Recommendations

| Lesson Group | Current Visual Coverage | Pass 4 Recommendation |
|---|---:|---|
| Small-cap and penny-stock foundation | 0 | Add `small-cap-risk-dashboard.svg` to show catalyst, float, spread, filing, and liquidity context. |
| Float, low float, float rotation | 0 | Add `float-vs-shares-outstanding-diagram.svg` and a float-rotation visual if one shared diagram is not enough. |
| Fully diluted shares and market cap | 0 | Add `fully-diluted-share-stack.svg` to show warrants, options, convertibles, and preferred stock. |
| Dilution and dilution risk | 0 | Add `dilution-risk-filing-flow.svg` to connect cash needs, filings, shelf capacity, and future supply. |
| Offerings and shelf registrations | 0 | Add `offering-terms-review-dashboard.svg` for pricing, warrants, proceeds, resale, and shelf distinction. |
| Warrants, convertibles, preferred stock | 0 | Add `warrant-convertible-share-supply.svg` for future-share mechanics. |
| Reverse/forward splits | 0 | Add `reverse-split-share-count-context.svg`; keep it educational and not bearish by default. |
| Cash runway and going concern | 0 | Add `cash-runway-going-concern-review.svg` for cash, burn, runway, warning language, and financing risk. |

## Priority Future Visual Batch

| Priority | Proposed SVG | Related Lessons | Visual Type | Purpose | Suggested Placement |
|---:|---|---|---|---|---|
| 1 | `public/academy/images/chart-reading/small-cap-risk-dashboard.svg` | Small-cap, penny-stock, low-float lessons | risk_review_dashboard | Show float, spread, liquidity, catalyst, filing, and dilution checks in one beginner dashboard. | Course opener. |
| 2 | `public/academy/images/chart-reading/float-vs-shares-outstanding-diagram.svg` | Stock float, low float, float vs shares outstanding | share_structure_diagram | Explain tradable supply versus total shares and restricted/insider shares. | Float foundation section. |
| 3 | `public/academy/images/chart-reading/fully-diluted-share-stack.svg` | Fully diluted shares, market cap vs fully diluted market cap | share_structure_diagram | Show common future-share components without implying immediate dilution. | Fully diluted shares section. |
| 4 | `public/academy/images/chart-reading/dilution-risk-filing-flow.svg` | Dilution, dilution risk, how to spot dilution risk | filing_flow_diagram | Connect cash needs, shelf registration, offering terms, warrants, and review notes. | Dilution risk section. |
| 5 | `public/academy/images/chart-reading/offering-terms-review-dashboard.svg` | Stock offerings, public offering, RDO, private placement, ATM, shelf lessons | source_document_dashboard | Show price, warrants, proceeds, buyer type, resale, and filing source details. | Offering terms section. |
| 6 | `public/academy/images/chart-reading/warrant-convertible-share-supply.svg` | Warrants, pre-funded warrants, convertibles, preferred stock | share_supply_diagram | Show exercise/conversion mechanics and future share-supply review. | Securities module intro. |
| 7 | `public/academy/images/chart-reading/reverse-split-share-count-context.svg` | Reverse split, reverse split vs dilution, forward split | corporate_action_diagram | Show share consolidation versus dilution without treating split direction as a signal. | Corporate actions section. |
| 8 | `public/academy/images/chart-reading/cash-runway-going-concern-review.svg` | Cash runway, going concern | risk_review_dashboard | Show cash, burn, runway, operating losses, warning language, and financing review. | Risk context capstone. |

## Visual Standards

Future Small-Cap visuals should use dark TradersLink dashboard styling, blue accents, realistic red and green candlesticks only when chart reaction matters, and document-style panels where filing mechanics matter. Labels should teach context and review questions, not trade instructions.

No visual should imply that low float, dilution, offerings, warrants, reverse splits, or going-concern language guarantees a move.

## Manifest Notes

No manifest rows were added or changed because no SVGs were created or edited in this pass.

## Result

Pass 4 is complete for Small-Cap Stocks, Float And Dilution.

The course needs a future priority visual batch before full UI-ready status.

