# Small-Cap Stocks, Float And Dilution Accuracy/Source Audit

Date: 2026-05-17

Audit pass: Pass 3 - Accuracy/Source Audit

Course: Small-Cap Stocks, Float And Dilution

Status: complete

## Files Reviewed

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

## Official Sources Used

| Source | Used For |
|---|---|
| SEC, [Microcap Stock: A Guide for Investors](https://www.sec.gov/about/reports-publications/investorpubsmicrocapstock) | Microcap and penny-stock risk, public-information risk, promotion risk, trading suspension context, and unusual audit/going-concern red flags. |
| Investor.gov, [Stocks FAQ](https://www.investor.gov/introduction-investing/investing-basics/investment-products/stocks) | Beginner-friendly stock risk framing, including the idea that very small companies and penny stocks can be higher-risk. |
| Investor.gov, [Glossary](https://www.investor.gov/introduction-investing/investing-basics/glossary) | Market capitalization framing and investor-facing terminology checks. |
| Investor.gov, [Stock Split](https://www.investor.gov/introduction-investing/investing-basics/glossary/stock-split) | Split mechanics, including share-count increase without shareholder-equity change and non-dilution framing for ordinary stock splits. |
| SEC, [Form S-3](https://www.sec.gov/submit-filings/forms-index/aboutformsforms-3pdf) and [Form S-3 PDF](https://www.sec.gov/about/forms/forms-3.pdf) | Shelf registration, delayed or continuous offerings, and Form S-3 filing context. |
| SEC, [What is Form D?](https://www.sec.gov/resources-small-businesses/capital-raising-building-blocks/what-form-d) | Regulation D and exempt-offering notice context for private placements. |
| Investor.gov, [Convertible Securities](https://www.investor.gov/introduction-investing/investing-basics/glossary/convertible-securities) | Fixed versus market-price conversion formulas, dilution risk, and EDGAR review guidance for convertible financings. |
| PCAOB, [AS 2415: Consideration of an Entity's Ability to Continue as a Going Concern](https://pcaobus.org/oversight/standards/auditing-standards/details/AS2415) | Auditor substantial-doubt framing and reasonable-period language. |
| FASB, [ASU 2014-15 Going Concern](https://storage.fasb.org/ASU%202014-15.pdf) | Management disclosure framing for substantial doubt within one year after financial statements are issued or available to be issued. |

## Overall Verdict

The Small-Cap Stocks, Float And Dilution course is broadly accurate and properly cautious. It teaches small-cap share structure, offering mechanics, dilution risk, warrants, convertibles, corporate actions, cash runway, and going-concern language as review context, not as trading signals.

No major factual correction was needed. The main source-audit improvement was adding official-source guardrails to the highest-risk lessons so learners know when a headline, scanner value, or simplified definition is not enough.

## Major Findings

1. The course avoids guarantee language. It does not claim that low float, dilution risk, offerings, reverse splits, cash runway, or going-concern language predicts a specific move.
2. Penny-stock and microcap risk framing matches official SEC and Investor.gov investor-education guidance: public information, liquidity, promotion, fraud risk, and company quality matter.
3. Float and shares outstanding are taught correctly as related but different share-count ideas. The course now adds a source-date warning so learners do not treat scanner values as permanent.
4. Offering and shelf lessons were accurate before this pass, but needed stronger reminders that the official filing package controls the terms.
5. ATM language correctly states that program capacity is not the same as actual sales. The lesson now explicitly directs learners to later filings for real usage.
6. Convertible-note coverage correctly separates fixed and variable conversion terms and avoids treating every note as identical. The lesson now emphasizes reading the actual note and registration-rights language.
7. Reverse split coverage correctly treats the split as a mechanical share-count and price adjustment, not a business improvement. The lesson now adds a source-check note about ratio, effective date, fractional treatment, and related filings.
8. Going-concern coverage was directionally correct and cautious. The lesson now distinguishes technical PCAOB/FASB timing language from the practical trader question: what raised the concern, what management plans, and what later filings show.

## Targeted Lesson Edits Completed

| Lesson | Edit |
|---|---|
| `/academy/penny-stocks/` | Added SEC/Investor.gov source-check note for penny-stock and microcap risk, public-information risk, liquidity, promotion, and fraud context. |
| `/academy/stock-float/` | Added source-date note for float, public float, shares outstanding, data-provider differences, filings, corporate actions, and recent financing. |
| `/academy/stock-offerings/` | Added source-check note directing learners to official filing packages, including registration statements, prospectus supplements, Form 8-Ks, purchase agreements, warrant agreements, and exhibits. |
| `/academy/at-the-market-offering/` | Added source-check note separating ATM program capacity from actual sales and directing review toward later 10-Q/10-K disclosures. |
| `/academy/shelf-registration/` | Added source-check note separating base shelf registration capacity from specific later prospectus supplements or takedowns. |
| `/academy/convertible-notes/` | Added source-check note for the actual note agreement, purchase agreement, registration rights, resale registration, fixed versus variable terms, floors, caps, defaults, and amendments. |
| `/academy/reverse-split/` | Added source-check note for split ratio, effective date, fractional shares, exchange notice, and related filings. |
| `/academy/going-concern/` | Added PCAOB/FASB-aligned source-check note that keeps trader education focused on conditions, management plans, and later filing evidence. |

## Source-Sensitive Review Table

| Area | Result | Notes |
|---|---|---|
| Penny stocks and microcaps | Pass with source note | Matches SEC/Investor.gov risk framing. No hype or low-price opportunity claims found. |
| Float and share count | Pass with source note | Correct distinction between float and shares outstanding. Added data-source/date guardrail. |
| Float rotation and low float | Pass | Teaches context without squeeze guarantees or continuation claims. |
| Fully diluted shares and market cap | Pass | Correctly frames potential future shares as context, not certainty. |
| Dilution and dilution risk | Pass | Correctly states dilution can affect proportional ownership and future supply without claiming automatic price impact. |
| Offering module | Pass with source notes | Official-document emphasis added to offering, ATM, and shelf lessons. |
| Private placement and Regulation D context | Pass | Existing language is appropriately broad; no exact filing deadlines or eligibility claims requiring correction. |
| Warrants and pre-funded warrants | Pass | No problematic guarantee language found. A later visual/source pass can add examples from filing excerpts if desired. |
| Convertible notes | Pass with source note | Investor.gov confirms fixed versus market-price conversion risk and EDGAR review framing. |
| Preferred stock | Pass | Existing lesson is broad and cautious. No source-sensitive correction needed. |
| Reverse and forward splits | Pass with source note | Reverse split lesson now explicitly reinforces mechanical nature and filing verification. |
| Cash runway | Pass | Kept as practical estimate language; no formal accounting formula claims needing correction. |
| Going concern | Pass with source note | Added PCAOB/FASB timing nuance while keeping lesson understandable for traders. |

## App Bridge Check

The Trader Intelligence bridge language remains restrained. The course uses app tie-ins as completed-trade review support for:

- News/Filing Review.
- Risk Review.
- Trade Review.
- Execution Review.
- Analytics.

No lesson was changed to imply prediction, signal generation, guaranteed improvement, or guaranteed risk reduction.

## Deferred Items

No urgent source correction is deferred.

Later optional improvements:

- Add an `offering-terms-review` lesson if the course needs a deeper guided walkthrough of price, size, warrants, proceeds, resale rights, and filing exhibits.
- Add realistic Small-Cap visual support during Pass 4, especially share-stack, shelf-to-offering, ATM-capacity-versus-sales, and going-concern review visuals.
- During UI planning, expose source-check prompts as lightweight learner reminders without making the lesson feel like legal research.

## Verification Completed

- Reviewed all 28 Small-Cap course markdown files.
- Checked source-sensitive claims against official SEC, Investor.gov, PCAOB, and FASB sources.
- Added targeted source guardrails to eight lesson files.
- Confirmed edits stayed in markdown lesson content and did not touch production website files.
- Confirmed no buy/sell signal language, prediction language, or guaranteed-outcome language was added.

## Recommended Next Action

Continue Pass 3 Accuracy/Source Audit with:

```text
Halts And High-Volatility Events
```

Include official-source checks for:

- Trading halts.
- SEC trading suspensions.
- Exchange volatility pauses.
- Limit up-limit down behavior.
- Market-wide circuit breakers.
- Halt resumption risk.
- Fast-spread and low-liquidity high-volatility context.
