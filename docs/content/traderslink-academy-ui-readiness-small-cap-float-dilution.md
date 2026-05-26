# TradersLink Academy UI Readiness Review: Small-Cap Stocks, Float And Dilution

Date: 2026-05-18

Audit pass: Pass 5 - UI Readiness Review

Course: Small-Cap Stocks, Float And Dilution

Status: complete

## Scope

Reviewed the 28-lesson Small-Cap Stocks, Float And Dilution course for future `/academy` UI planning. This pass did not implement routes, schemas, React components, JSX, CSS, or production website files.

## Overall Verdict

Small-Cap Stocks, Float And Dilution is ready for UI planning, but it needs a strong grouped UI and future visual batch before polished launch.

This course is dense by nature. The UI should break it into a supply-and-risk learning path so beginners do not see a wall of filing, offering, warrant, and split terminology.

## UI Readiness Decision

| Area | Result | Notes |
|---|---|---|
| Course sequence | Ready with grouping requirement | The 28-lesson sequence is coherent but long. |
| Lesson metadata | Ready | Course metadata is normalized. |
| Progress tracking | Ready with module progress | Use overall and module-level progress. |
| Visual readiness | Planning ready, launch polish needed | Pass 4 identified an eight-SVG priority visual batch. |
| App bridge | Ready with restraint | News/Filing Review, Risk Review, and Trade Review are natural later surfaces. |

## Recommended UI Model

| Section | Lessons | UI Note |
|---|---|---|
| Small-Cap Foundation | Small-Cap Stocks, Penny Stocks | Set expectations about risk, liquidity, and quality. |
| Float Foundation | Stock Float, Low Float, Float Rotation | Teach tradable supply and crowding. |
| Share Structure | Float Vs Shares Outstanding, Fully Diluted Shares, Market Cap Vs Fully Diluted Market Cap | Explain share-count context before offerings. |
| Dilution Foundation | Dilution, Dilution Risk, How To Spot Dilution Risk | Turn dilution into a review workflow. |
| Offerings | Stock Offerings, Public Offering, Registered Direct, Private Placement, ATM, Shelf Registration | Use collapsible module cards. |
| Securities | Warrants, Warrant Vs Options, Pre-Funded Warrants, Convertible Notes, Preferred Stock | Treat as supply mechanics, not trivia. |
| Corporate Actions | Reverse Split, Reverse Split Vs Dilution, Forward Split | Show how share count changes can mislead. |
| Risk Context | Cash Runway, Going Concern | Close with company survival and financing context. |

## Visual Readiness

Pass 4 identified a priority visual batch before full UI-ready launch polish. The course can be planned now, but production design should account for missing visuals in float, dilution, offering, warrant, reverse split, cash runway, and going-concern concepts.

## App Bridge Placement

Use restrained future bridges to:

- News/Filing Review for filings, offerings, shelf registrations, and dilution clues.
- Risk Review for low-float, spread, halt, and financing risk.
- Trade Review for completed small-cap trades.
- Analytics for repeated small-cap context tags.

Avoid implying the app can predict dilution, offerings, or price reactions.

## Result

Pass 5 UI Readiness Review is complete for Small-Cap Stocks, Float And Dilution.

The course is ready for UI planning as a grouped 28-lesson supply-and-risk course, with visual-batch work still recommended before polished launch.

## Recommended Next Action

Next recommended audit:

```text
Pass 5: UI Readiness Review for Halts And High-Volatility Events
```
