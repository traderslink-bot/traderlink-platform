# Halts And High-Volatility Events Accuracy/Source Audit

Date: 2026-05-17

Audit pass: Pass 3 - Accuracy/Source Audit

Course: Halts And High-Volatility Events

Status: complete

## Files Reviewed

- `academy/trading-halts.md`
- `academy/volatility-halts.md`
- `academy/halt-resume.md`
- `academy/market-wide-circuit-breakers.md`
- `academy/fast-spread-risk.md`
- `academy/low-float-volatility.md`
- `academy/high-volatility-trade-review.md`

## Official Sources Used

| Source | Used For |
|---|---|
| FINRA, [Trading Halts, Delays and Suspensions](https://www.finra.org/investors/investing/investment-products/stocks/trading-halts-delays-suspensions) | Distinguishing exchange halts, delays, OTC halts, and SEC trading suspensions; confirming listed-stock halts are observed across U.S. markets. |
| SEC, [Trading Suspensions](https://www.sec.gov/enforcement-litigation/trading-suspensions?month=All&year=All) | SEC authority to suspend trading in a stock for up to 10 trading days when required in the public interest and for investor protection. |
| Investor.gov, [Investor Bulletin: Trading Suspensions](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/investor-5) | OTC quotation and solicitation risks after an SEC trading suspension ends. |
| LULD Plan, [Limit Up Limit Down](https://www.luldplan.com/) | Current LULD plan overview, NMS stock coverage, regular-hours application, price bands, Limit State, Straddle State, 15-second limit-state rule, five-minute trading pause, and possible extension. |
| FINRA, [Limit Up/Limit Down Plan](https://www.finra.org/filing-reporting/trf/limit-uplimit-down-luld-plan) | LULD purpose: preventing trades in NMS stocks outside specified price bands and coupling bands with trading pauses. |
| FINRA, [Guardrails for Market Volatility](https://www.finra.org/investors/insights/guardrails-market-volatility) | Investor-facing explanation of LULD, single-stock trading pauses, market-wide circuit breakers, timing, and thresholds. |
| NYSE, [Trading Information](https://www.nyse.com/trade/trading-information) | Market-wide circuit breaker thresholds and cross-market halt framing. |
| Investor.gov, [Stock Market Circuit Breakers](https://www.investor.gov/introduction-investing/general-resources/news-alerts/alerts-bulletins/investor-bulletins/measures) | Market-wide and single-stock circuit-breaker investor education, thresholds, and timing. |
| Nasdaq Trader, [Trading Halt Codes](https://nasdaqtrader.com/trader.aspx?id=tradehaltcodes) | Halt code reference and Nasdaq halt category checks. |
| NYSE, [Trading Halts](https://www.nyse.com/trade/trading-halts) | Current-day and historical NYSE halt page framing for news pending/news dissemination and LULD halt data. |
| Cboe, [Limit Up/Down FAQ](https://www.cboe.com/document/tech-spec/document/technical-specifications/cboe-limit-updown-faq/) | LULD limit-state, five-minute pause, re-opening, auction, and close-proximity handling context. |

## Overall Verdict

The Halts And High-Volatility Events course is accurate, risk-first, and appropriately cautious. It teaches halts, volatility pauses, resumes, market-wide circuit breakers, fast spreads, low-float volatility, and high-volatility review as market-structure and execution-risk context, not as trade signals.

No broad rewrite was needed. The main source-audit work was adding precise official-source guardrails where learners could otherwise overgeneralize: SEC suspensions versus exchange halts, LULD price bands versus generic "volatility halt" language, five-minute pause language versus actual resume uncertainty, market-wide circuit-breaker timing, and low float as context rather than an official halt category.

## Major Findings

1. The course correctly separates single-security halts from market-wide circuit breakers.
2. The lessons avoid claiming that a halt predicts continuation, reversal, liquidity, or a clean resume.
3. The Trading Halts opener correctly mentions volatility, pending news, regulatory concerns, order imbalances, and market-wide circuit breakers, but needed a stronger source note distinguishing exchange halts from SEC trading suspensions.
4. Volatility Halts correctly avoids exact formulas in the main lesson. A source note now explains LULD at a practical level and warns that coverage, timing, rights, warrants, OTC securities, and exchange procedures can vary.
5. Halt Resume is directionally accurate and now notes that the primary listing exchange reopening process can involve auctions, collars, order handling, and close-proximity rules.
6. Market-Wide Circuit Breakers correctly states the 7%, 13%, and 20% S&P 500 thresholds. The lesson now adds the current Level 1/Level 2 before-3:25 p.m. timing and Level 3 rest-of-day halt detail as source-checked context.
7. Fast Spread Risk and High-Volatility Trade Review remain accurate as execution/review lessons and did not require new rule-specific edits.
8. Low-Float Volatility correctly avoids saying low float guarantees a halt. A source note now clarifies that low float is not an official halt category by itself.

## Targeted Lesson Edits Completed

| Lesson | Edit |
|---|---|
| `/academy/trading-halts/` | Added a source-check note distinguishing FINRA trading halts/delays, exchange-listed stock halts, SEC trading suspensions, and OTC post-suspension quotation risk. Added Nasdaq halt codes to official references. |
| `/academy/volatility-halts/` | Added a source-check note explaining LULD price bands, NMS stock coverage, regular-hours context, 15-second Limit State, five-minute pause, possible extension, and exceptions/official-rule verification. |
| `/academy/halt-resume/` | Added a source-check note warning that resume procedures can depend on primary-listing-exchange rules, auctions, collars, order handling, and timing near the close. |
| `/academy/market-wide-circuit-breakers/` | Added source-checked timing details for Level 1/Level 2 before 3:25 p.m. ET and Level 3 rest-of-day halt treatment. Updated official reference links. |
| `/academy/low-float-volatility/` | Added a source-check note clarifying that low float is not an official halt category and that listed-stock volatility pauses relate to market-structure rules such as LULD bands and limit states. |

## Source-Sensitive Review Table

| Area | Result | Notes |
|---|---|---|
| Trading halt basics | Pass with source note | Correctly describes halt types at a high level. Source note now distinguishes exchange halts, FINRA/OTC context, and SEC suspensions. |
| SEC trading suspensions | Pass with source note | Lesson now reflects SEC suspension authority separately from ordinary exchange halts. |
| Volatility halts / LULD | Pass with source note | Lesson avoids brittle formulas in main teaching flow and points learners to official LULD/exchange sources. |
| Halt resume | Pass with source note | Correctly teaches resume uncertainty. Source note now avoids implying a fixed or clean five-minute return. |
| Market-wide circuit breakers | Pass with source note | Current 7%, 13%, and 20% thresholds were verified against NYSE, FINRA, and Investor.gov. Current timing details were added. |
| Fast spread risk | Pass | Execution framing is accurate and does not need official rule text. |
| Low-float volatility | Pass with source note | Low float is correctly taught as context, not a halt trigger by itself. |
| High-volatility trade review | Pass | Strong review capstone; no rule-specific correction needed. |

## App Bridge Check

The Trader Intelligence bridge language remains restrained. The course uses app tie-ins as completed-trade review support for:

- Risk Review.
- Execution Review.
- Trade Review.
- Session Review.
- News/Filing Review.
- Analytics.

No lesson was changed to imply prediction, signal generation, guaranteed improvement, or guaranteed risk reduction.

## Deferred Items

No urgent source correction is deferred.

Later optional improvements:

- Add `/academy/luld-bands/` if the Academy needs a deeper market-structure lesson on price bands, reference prices, Limit State, Straddle State, tiering, and exclusions.
- Add `/academy/sec-trading-suspensions/` if the News/Filings path should separate SEC suspensions from exchange halt basics.
- Add `/academy/halt-codes/` if future UI needs a reference-style lesson for Nasdaq/NYSE/FINRA halt codes.

These are optional. The current course is accurate enough for the Academy flow without turning a beginner/intermediate course into a rulebook.

## Verification Completed

- Reviewed all 7 Halts And High-Volatility Events course markdown files.
- Checked source-sensitive claims against official SEC, Investor.gov, FINRA, NYSE, Nasdaq, LULD, and Cboe sources.
- Added targeted source guardrails to five lesson files.
- Confirmed edits stayed in markdown lesson content and did not touch production website files.
- Confirmed no buy/sell signal language, prediction language, or guaranteed-outcome language was added.

## Recommended Next Action

Continue Pass 3 Accuracy/Source Audit with:

```text
Trading Foundations
```

Include official-source checks for:

- Market session and order-flow basics.
- Beginner day-trading framing.
- Short selling basics.
- Settlement or order-mechanics claims if present.
- Any education copy that could imply income, certainty, or regulatory rules without source support.
