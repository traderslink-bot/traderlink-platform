# TradersLink Academy Visual Gap Audit: News, Catalysts And SEC Filings

Date: 2026-05-17

Audit pass: Pass 4 - Visual Gap Audit

Course: News, Catalysts And SEC Filings

Status: complete

## Scope

Reviewed the 37-lesson News, Catalysts And SEC Filings course for realistic catalyst, press-release, SEC filing, EDGAR, FDA, event-news, and news-review visual support.

Lessons reviewed:

- `academy/stock-catalysts.md`
- `academy/press-releases.md`
- `academy/how-to-read-stock-press-releases.md`
- `academy/sec-filings.md`
- `academy/how-to-use-edgar-source-documents.md`
- `academy/sec-filings/form-8-k.md`
- `academy/sec-filings/form-10-k.md`
- `academy/sec-filings/form-10-q.md`
- `academy/sec-filings/form-20-f.md`
- `academy/sec-filings/form-6-k.md`
- `academy/sec-filings/form-s-1.md`
- `academy/sec-filings/form-s-3.md`
- `academy/sec-filings/form-f-1.md`
- `academy/sec-filings/form-f-3.md`
- `academy/sec-filings/form-s-4.md`
- `academy/sec-filings/form-s-8.md`
- `academy/sec-filings/form-424b5.md`
- `academy/sec-filings/form-424b3.md`
- `academy/sec-filings/form-424b4.md`
- `academy/sec-filings/effect-notice.md`
- `academy/sec-filings/form-3.md`
- `academy/sec-filings/form-4.md`
- `academy/sec-filings/form-5.md`
- `academy/sec-filings/schedule-13d.md`
- `academy/sec-filings/schedule-13g.md`
- `academy/sec-filings/form-def-14a.md`
- `academy/sec-filings/form-pre-14a.md`
- `academy/sec-filings/nt-10-k.md`
- `academy/sec-filings/nt-10-q.md`
- `academy/sec-filings/form-25.md`
- `academy/earnings-news.md`
- `academy/fda-news-stocks.md`
- `academy/clinical-trial-news.md`
- `academy/contract-news-stocks.md`
- `academy/partnership-news-stocks.md`
- `academy/merger-news-stocks.md`
- `academy/how-to-review-news-trades.md`

Related files reviewed:

- `docs/content/traderslink-academy-quality-audit-news-catalysts-sec-filings.md`
- `docs/content/traderslink-academy-accuracy-source-audit-news-catalysts-sec-filings.md`
- `docs/content/traderslink-academy-course-index.md`
- `docs/content/learn-image-asset-manifest.md`
- `public/academy/images/chart-reading/`

## Overall Verdict

News, Catalysts And SEC Filings has strong visual support for the opening catalyst, press-release, and SEC filing hub lessons, but the full course is not visually complete yet.

The existing visuals are high quality:

- Catalyst quality and headline-versus-reaction dashboards.
- Press-release anatomy, reaction, reading workflow, and specific-versus-vague detail dashboards.
- SEC filing map, Form 8-K event review, and shelf-registration-to-offering flow diagrams.

The biggest visual gap is depth coverage. The EDGAR source-document lesson, individual SEC filing lessons, FDA/clinical news lessons, earnings/contract/partnership/merger lessons, and news-trade review capstone are mostly text-first. That is acceptable for the current audit pass because many of those lessons are source-document education, but the course should receive a focused future visual batch before it is treated as fully UI-ready.

Two existing press-release SVGs were lightly cleaned in this pass to replace journal-specific labels with broader review-focused labels.

## Coverage Summary

| Area | Lessons Reviewed | Current Direct Visual Coverage | Result |
|---|---:|---:|---|
| Catalyst Foundation | 1 | 1 lesson / 2 SVGs | Strong coverage. |
| Press Releases | 2 | 2 lessons / 4 SVGs | Strong coverage after review-label cleanup. |
| SEC Filing Hub | 1 | 1 lesson / 3 SVGs | Strong hub coverage. |
| EDGAR Source Documents | 1 | 0 | Needs future source-document review panel. |
| Individual SEC Filing Modules | 25 | 0 | Needs selective module-level visuals, not one SVG per form. |
| News Categories | 6 | 0 | Needs selective event-category visuals for earnings, FDA/clinical, and deal/news quality. |
| News Trade Review | 1 | 0 | Needs future capstone review dashboard. |

## Asset Verification

Direct scoped SVG references found in this course:

```text
9
```

Verification result:

- 4 of 37 lessons include direct `visual_assets` metadata.
- 4 of 37 lessons include in-body SVG placements.
- 9 of 9 unique scoped SVG references exist under `public/academy/images/chart-reading/`.
- 9 of 9 unique scoped SVG references are represented in `docs/content/learn-image-asset-manifest.md`.
- 9 of 9 unique scoped SVG files include embedded `title` tags.
- 9 of 9 unique scoped SVG files include embedded `desc` tags.
- No buy/sell labels, profit claims, or directional signal labels were found in the scoped SVG labels.
- Negated guarantee/prediction wording was found only where the visual explicitly says no press-release detail guarantees continuation or that the view is review, not prediction. That wording is educationally safe.

Existing verified assets:

- `public/academy/images/chart-reading/stock-catalyst-quality-review.svg`
- `public/academy/images/chart-reading/stock-catalyst-headline-vs-reaction.svg`
- `public/academy/images/chart-reading/press-release-anatomy-review.svg`
- `public/academy/images/chart-reading/press-release-reaction-review.svg`
- `public/academy/images/chart-reading/press-release-reading-workflow.svg`
- `public/academy/images/chart-reading/press-release-specific-vs-vague.svg`
- `public/academy/images/chart-reading/sec-filing-map-for-traders.svg`
- `public/academy/images/chart-reading/sec-filing-8k-event-review.svg`
- `public/academy/images/chart-reading/sec-filing-shelf-to-offering-flow.svg`

## Lesson-Level Visual Recommendations

| Lesson | Current Visual Coverage | Pass 4 Recommendation |
|---|---:|---|
| `/academy/stock-catalysts/` | 2 | Keep both catalyst visuals; they are strong course openers. |
| `/academy/press-releases/` | 2 | Keep both press-release visuals; cleanup completed to use review-focused labels. |
| `/academy/how-to-read-stock-press-releases/` | 2 | Keep both workflow/detail-quality visuals; cleanup completed to use review-focused labels. |
| `/academy/sec-filings/` | 3 | Keep all three SEC hub visuals; they cover filing categories, 8-K events, and shelf-to-offering flow. |
| `/academy/how-to-use-edgar-source-documents/` | 0 | Add future `edgar-source-document-review-panel.svg`. |
| `/academy/sec-filings/form-8-k/` | 0 | Reuse or adapt `sec-filing-8k-event-review.svg` later if individual module pages need visuals. |
| `/academy/sec-filings/form-10-k/` | 0 | Defer; possible future company-report comparison panel for 10-K, 10-Q, and 20-F. |
| `/academy/sec-filings/form-10-q/` | 0 | Defer; can share a company-report panel with 10-K and 20-F. |
| `/academy/sec-filings/form-20-f/` | 0 | Defer; can share a foreign-issuer report panel with 6-K if needed. |
| `/academy/sec-filings/form-6-k/` | 0 | Defer; possible foreign issuer current-report panel, but not blocking. |
| `/academy/sec-filings/form-s-1/` | 0 | Add future registration/offering terms visual shared with S-3, F-1, F-3, and 424B lessons. |
| `/academy/sec-filings/form-s-3/` | 0 | Add future registration/offering terms visual shared with S-1, F-1, F-3, and 424B lessons. |
| `/academy/sec-filings/form-f-1/` | 0 | Reuse future registration/offering terms visual. |
| `/academy/sec-filings/form-f-3/` | 0 | Reuse future registration/offering terms visual. |
| `/academy/sec-filings/form-s-4/` | 0 | Defer; can be supported by future deal/merger terms visual. |
| `/academy/sec-filings/form-s-8/` | 0 | Add to future share-supply/dilution review visual if Small-Cap course visuals do not already cover it. |
| `/academy/sec-filings/form-424b5/` | 0 | Add future offering-terms review visual; high priority. |
| `/academy/sec-filings/form-424b3/` | 0 | Reuse future offering/resale terms visual. |
| `/academy/sec-filings/form-424b4/` | 0 | Reuse future offering/final prospectus visual. |
| `/academy/sec-filings/effect-notice/` | 0 | Reuse future shelf-to-offering timeline visual or keep text-first. |
| `/academy/sec-filings/form-3/` | 0 | Add future insider/ownership review panel shared with Form 4, Form 5, 13D, and 13G. |
| `/academy/sec-filings/form-4/` | 0 | Add future insider/ownership review panel; high priority because beginners over-read insider headlines. |
| `/academy/sec-filings/form-5/` | 0 | Reuse future insider/ownership review panel. |
| `/academy/sec-filings/schedule-13d/` | 0 | Reuse future ownership review panel; emphasize active/passive distinction without prediction. |
| `/academy/sec-filings/schedule-13g/` | 0 | Reuse future ownership review panel. |
| `/academy/sec-filings/form-def-14a/` | 0 | Add future proxy/vote/dilution review panel if UI needs more module support. |
| `/academy/sec-filings/form-pre-14a/` | 0 | Reuse future proxy/vote/dilution review panel. |
| `/academy/sec-filings/nt-10-k/` | 0 | Defer; possible late-filing risk timeline shared with NT 10-Q. |
| `/academy/sec-filings/nt-10-q/` | 0 | Defer; possible late-filing risk timeline shared with NT 10-K. |
| `/academy/sec-filings/form-25/` | 0 | Add future listing/liquidity risk visual if Halts or Small-Cap visuals do not cover this risk. |
| `/academy/earnings-news/` | 0 | Add future earnings reaction review visual. |
| `/academy/fda-news-stocks/` | 0 | Add future FDA/clinical catalyst review flow shared with clinical trial news. |
| `/academy/clinical-trial-news/` | 0 | Reuse future FDA/clinical catalyst review flow. |
| `/academy/contract-news-stocks/` | 0 | Add or reuse future contract/partnership/merger quality visual. |
| `/academy/partnership-news-stocks/` | 0 | Reuse future contract/partnership/merger quality visual. |
| `/academy/merger-news-stocks/` | 0 | Reuse future deal-quality/merger terms visual. |
| `/academy/how-to-review-news-trades/` | 0 | Add future `news-trade-review-dashboard.svg`; this should be the capstone visual. |

## Priority Future Visual Batch

This course does not need one visual per filing type. It needs shared module visuals that teach how to review groups of related information.

| Priority | Proposed SVG | Related Lessons | Visual Type | Purpose | Suggested Placement |
|---:|---|---|---|---|---|
| 1 | `public/academy/images/chart-reading/edgar-source-document-review-panel.svg` | `/academy/how-to-use-edgar-source-documents/` | source_document_dashboard | Show ticker/CIK search, filing list, accepted time, exhibits, and source-vs-summary review. | Intro or source-document workflow section. |
| 2 | `public/academy/images/chart-reading/sec-filing-offering-terms-review.svg` | S-1, S-3, F-1, F-3, 424B3, 424B4, 424B5, EFFECT | filing_flow_diagram | Show registration statement, effectiveness, prospectus supplement, offering terms, warrants, proceeds, and dilution review. | Registration/prospectus module intro. |
| 3 | `public/academy/images/chart-reading/sec-filing-insider-ownership-review.svg` | Form 3, Form 4, Form 5, Schedule 13D, Schedule 13G | source_document_dashboard | Show transaction codes, footnotes, ownership percentage, active/passive context, and non-signal review. | Ownership module intro. |
| 4 | `public/academy/images/chart-reading/proxy-late-filing-listing-risk-review.svg` | DEF 14A, PRE 14A, NT 10-K, NT 10-Q, Form 25 | risk_review_dashboard | Show votes, late filings, listing status, liquidity/access notes, and follow-up filing review. | Proxy/late/listing module intro. |
| 5 | `public/academy/images/chart-reading/earnings-news-reaction-review.svg` | `/academy/earnings-news/` | realistic_trading_dashboard | Show revenue/guidance/cash details beside chart reaction, volume, and expectation-versus-actual review. | Earnings reaction section. |
| 6 | `public/academy/images/chart-reading/fda-clinical-catalyst-review-flow.svg` | `/academy/fda-news-stocks/`, `/academy/clinical-trial-news/` | event_review_dashboard | Show regulatory term, phase, endpoints, sample size, safety, cash runway, and reaction review without approval assumptions. | FDA/clinical module intro. |
| 7 | `public/academy/images/chart-reading/contract-partnership-merger-quality-review.svg` | Contract, partnership, merger lessons | event_review_dashboard | Show named counterparty, terms, value, timing, closing conditions, filings, and reaction review. | News category comparison section. |
| 8 | `public/academy/images/chart-reading/news-trade-review-dashboard.svg` | `/academy/how-to-review-news-trades/` | trade_review_dashboard | Show catalyst quality, source check, filing check, level reaction, volume/liquidity, execution, risk, and behavior notes. | Capstone intro or review checklist. |

## Reuse Decisions

| Existing Asset | Reuse Decision | Reason |
|---|---|---|
| `stock-catalyst-quality-review.svg` | Keep | Strong opener for catalyst quality and source/detail review. |
| `stock-catalyst-headline-vs-reaction.svg` | Keep | Strong headline-versus-reaction visual with volume and filing context. |
| `press-release-anatomy-review.svg` | Keep | Strong press-release document anatomy visual. |
| `press-release-reaction-review.svg` | Keep after cleanup | Strong reaction visual; label cleanup changed journal-specific wording to reaction/review wording. |
| `press-release-reading-workflow.svg` | Keep after cleanup | Strong workflow visual; label cleanup changed journal-specific wording to review notes. |
| `press-release-specific-vs-vague.svg` | Keep | Strong specific-versus-vague details visual with safe no-guarantee wording. |
| `sec-filing-map-for-traders.svg` | Keep | Strong hub-level filing category map. |
| `sec-filing-8k-event-review.svg` | Keep and potentially reuse | Strong 8-K event visual; can support the Form 8-K module later. |
| `sec-filing-shelf-to-offering-flow.svg` | Keep and potentially reuse | Strong shelf-to-offering concept visual; future offering terms visual should complement it, not duplicate it. |

## Visual Standards For Future Additions

Future News, Catalysts And SEC Filings visuals should follow these standards:

- Dark TradersLink dashboard look with blue accent.
- Realistic red and green candlesticks where market reaction is shown.
- Source-document panels for EDGAR, SEC filings, exhibits, accepted time, and form details.
- Filing timelines or module diagrams where the lesson teaches process rather than chart behavior.
- Volume bars and liquidity/spread notes when the visual includes price reaction.
- Labels should ask review questions or identify document context, not tell users what to trade.
- No buy/sell signal language.
- No profit claims.
- No guaranteed-outcome language.
- No implication that news, filings, FDA terms, insider activity, or offerings predict the next move.
- Include embedded `title` and `desc` tags.
- Keep labels readable on mobile.

## Manifest Notes

Two existing manifest rows were updated because the related SVG labels were cleaned from journal-specific wording to broader review wording:

- `public/academy/images/chart-reading/press-release-reaction-review.svg`
- `public/academy/images/chart-reading/press-release-reading-workflow.svg`

No new SVGs were created in this pass.

When future News, Catalysts And SEC Filings visuals are created, add manifest rows with:

- Asset file path.
- Related Academy lesson(s).
- Learning track: `News Catalysts Filings And Dilution`.
- Visual type.
- Purpose.
- Suggested placement.
- Alt text.
- Status: `editor_verified` only after confirming the visual supports the final lesson text.
- Commit SHA.

## App Bridge Notes

The visual layer should support the existing restrained bridge map:

- News/Filing Review for source, timestamp, form type, exhibit, accepted time, and related filing checks.
- Trade Review for comparing catalyst quality against chart reaction, liquidity, execution, and trader behavior.
- Risk Review for offerings, dilution, delisting, late filings, FDA/clinical uncertainty, and event risk.
- Analytics for repeated headline-chasing, event-type mistakes, and source-check misses.
- Review Notes for what was known before the trade, what was checked, what changed, and what should be watched next.

The visuals should teach verification and review, not product features, alerts, prediction, or guaranteed improvement.

## Result

Pass 4 is complete for News, Catalysts And SEC Filings.

The course has strong opening visual support but needs a future focused visual batch before it should be considered fully UI-ready. The priority should be shared module visuals rather than one SVG per SEC form.

## Recommended Next Action

Next recommended audit:

```text
Pass 4: Visual Gap Audit for Small-Cap Stocks, Float And Dilution
```
