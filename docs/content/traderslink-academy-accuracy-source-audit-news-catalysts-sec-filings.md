# TradersLink Academy Accuracy/Source Audit: News, Catalysts And SEC Filings

Date: 2026-05-17

## Audit Scope

Course: News, Catalysts And SEC Filings

Audit pass: Pass 3: Accuracy/Source Audit

Status: complete

Files reviewed: 37 Academy lesson files across stock catalysts, press releases, EDGAR source documents, SEC filing modules, earnings/FDA/clinical/news-category lessons, merger/contract/partnership lessons, and news-trade review.

Purpose: verify source-sensitive SEC, EDGAR, FDA, clinical-trial, filing, offering, beneficial-ownership, insider-ownership, and delisting language before the Academy moves toward production UI planning.

## Official Sources Used

| Source | Used For |
|---|---|
| SEC Search Filings: https://www.sec.gov/search-filings | EDGAR search, company filings, full-text search, latest filings, CIK lookup, Forms 3/4/5 filter. |
| SEC About EDGAR: https://www.sec.gov/submit-filings/about-edgar | EDGAR definition, public database, official filing access framing. |
| SEC Investor Bulletin, How to Read an 8-K: https://www.sec.gov/files/readan8k.pdf | Form 8-K purpose, material event context, typical four-business-day timing for most 8-K disclosures. |
| SEC Investor Bulletin, How to Read a 10-K: https://www.sec.gov/files/reada10k.pdf | Form 10-K purpose, annual report context, SEC review/vouching distinction. |
| SEC Form 25: https://www.sec.gov/about/forms/form25.pdf | Form 25 official title and removal from listing/registration framing. |
| Investor.gov Schedules 13D and 13G: https://www.investor.gov/introduction-investing/investing-basics/glossary/schedules-13d-and-13g | Beneficial ownership, more-than-5% threshold, Schedule 13D/13G distinction. |
| Investor.gov Insider Transactions and Forms 3, 4, and 5: https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins-69 | Forms 3/4/5 descriptions, transaction-code context, Form 4 timing, Form 5 timing. |
| FDA Fast Track: https://www.fda.gov/patients/fast-track-breakthrough-therapy-accelerated-approval-priority-review/fast-track | Fast Track purpose, eligibility concepts, rolling review and communication context, not approval. |
| FDA Orphan Product Designation: https://www.fda.gov/industry/medical-products-rare-diseases-and-conditions/designating-orphan-product-drugs-and-biological-products | Orphan drug designation incentives and separation from approval/licensing. |
| FDA PDUFA: https://www.fda.gov/industry/fda-user-fee-programs/prescription-drug-user-fee-amendments | PDUFA user-fee/review framework and continued timely review framing. |
| FDA Step 3 Clinical Research: https://www.fda.gov/patients/drug-development-process/step-3-clinical-research | Clinical trial phase framing, protocol factors, Phase 2 and Phase 3 review context. |

## Major Findings

The course is broadly accurate and already avoids the biggest educational risks: it does not turn filings, press releases, FDA terms, trial updates, offerings, insider forms, ownership forms, mergers, contracts, or news catalysts into buy/sell signals or guaranteed price outcomes.

The most important source-sensitive improvement was not a rewrite. It was adding explicit official-source guardrails where beginners are most likely to over-read a label:

- SEC filings should be verified through official EDGAR records, not screenshots or social summaries.
- Form 8-K is a current-event filing, but the event item, timing, exhibits, and accepted time matter.
- Form 4 timing is useful, but transaction codes and footnotes matter more than the headline.
- Schedule 13D/13G ownership thresholds and filer eligibility are technical enough that lessons should frame them as review context, not legal conclusions.
- Form 25 should be reviewed as removal from listing and/or registration context, not a simple "stock is worthless" headline.
- FDA Fast Track, orphan designation, PDUFA dates, and clinical-trial phases need official-term caution because none of them guarantees approval or a clean price move.

## Lesson Edits Made

| Lesson | Edit |
|---|---|
| `/academy/sec-filings/` | Added EDGAR official-source guardrail after the quick definition. |
| `/academy/sec-filings/form-8-k/` | Added SEC investor guidance note about most 8-K disclosures generally being filed within four business days, with event date, filing date, accepted time, item number, and exhibits as review details. |
| `/academy/sec-filings/form-4/` | Added Form 4 timing and transaction-code/footnote guardrail. |
| `/academy/sec-filings/schedule-13d/` | Added beneficial-ownership threshold and Schedule 13G alternative caution from SEC/Investor.gov framing. |
| `/academy/sec-filings/schedule-13g/` | Added caution that Schedule 13G can be a shorter alternative depending on facts and does not prove active intent by itself. |
| `/academy/sec-filings/form-25/` | Added official Form 25 title and removal from listing/registration review details. |
| `/academy/fda-news-stocks/` | Added FDA source-sensitive guardrail distinguishing Fast Track, orphan designation, and PDUFA from approval promises. |
| `/academy/clinical-trial-news/` | Added official FDA clinical-research review context and phase-description caution. |

## Source-Sensitive Course Review

| Area | Result | Notes |
|---|---|---|
| EDGAR and source documents | Passed with small enhancement. | EDGAR lesson already included official SEC links and source-first workflow. SEC hub now also includes EDGAR guardrail. |
| 8-K, 10-K, 10-Q | Passed with small enhancement. | Form 8-K now includes typical SEC timing context. 10-K and 10-Q descriptions match official annual/quarterly report framing. |
| Registration statements and prospectus supplements | Passed. | S-1, S-3, F-1, F-3, S-4, S-8, 424B3, 424B4, 424B5, and EFFECT lessons already frame registration/effectiveness/offering context without implying immediate dilution or guaranteed reaction. |
| Insider and beneficial ownership | Passed with small enhancement. | Form 4 and Schedules 13D/13G now carry stronger source/timing/eligibility caution. Form 3 and Form 5 remained consistent with Investor.gov framing. |
| Proxy and late-filing notices | Passed. | DEF 14A, PRE 14A, NT 10-K, and NT 10-Q lessons use broad educational framing and avoid strict legal advice. |
| Form 25 and delisting | Passed with small enhancement. | Form 25 now quotes the official removal from listing/registration frame and keeps liquidity/access context separate from company-failure assumptions. |
| FDA and clinical-trial catalysts | Passed with small enhancement. | FDA and clinical lessons now emphasize exact regulatory term review and official clinical phase context. |
| Press releases, contracts, partnerships, mergers, earnings, and news-trade review | Passed. | These lessons correctly frame news as catalyst context, not prediction, and point users toward source documents and reaction review. |

## Deferred Items

No blocking accuracy issues remain for this course.

Later source passes should still revisit:

- Detailed SEC filing deadlines if the Academy later chooses to teach deadline rules directly.
- Exchange-specific listing standards if Form 25 or delisting lessons expand beyond general SEC filing context.
- FDA device-specific language if future lessons cover 510(k), De Novo, PMA, or clearance/approval pathways in detail.
- ClinicalTrials.gov and NIH source context if future lessons add dedicated trial-registry workflows.

## App Bridge Check

The app bridge remains appropriately restrained. The audit did not add hard app route links or product claims. Existing bridge language stays centered on completed-trade review, source-checking behavior, filing/news context, risk review, execution review, and repeated mistake patterns.

## Recommended Next Action

Next recommended audit: Pass 3: Accuracy/Source Audit for Small-Cap Stocks, Float And Dilution.

Reason: this is the next most source-sensitive Academy course because it covers float, shares outstanding, dilution, offerings, warrants, convertible notes, preferred stock, reverse splits, cash runway, going concern, resale registrations, and offering mechanics.
