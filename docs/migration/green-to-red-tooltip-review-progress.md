# Green-to-red tooltip review

## Local implementation

- Reviewed all five headline tooltips, section explanations, nine highest-zone table headings, and eight trade-record table headings against the saved scenario calculations.
- Added page-purpose help beside Green-to-red trades using the existing Section titleHelp slot. Title help can receive keyboard focus; no new button nested in the accordion button.
- Added individual tooltips beside No profit taken, Some profit taken, and Recovered after turning red.
- Plain-language explanations identify denominator populations, greater-than-zero profit taking, temporary recovery and overlapping red finishes, Gross before fees, and opportunity minus final P/L versus realized loss.
- Corrected misleading candle-close-only qualification copy: saved candle highs/lows or exits can reach +20%; no minimum hold time. Zone duration counts minute closes and does not measure precise seconds. Opportunity dollars use realized P/L plus open-share opportunity at the highest percentage-gain point, not necessarily an independently maximized dollar result.
- Preserved all calculation logic, visible table labels, filters, pagination, and timing values. Help articles remain deferred per owner instruction.

## Verification

- Focused ESLint and diff whitespace checks passed; source reviewed against buildGreenOpportunity and its candle/exit observations.
- No app build or test suite. React review found no new hooks, fetching, dependencies, or changed populations.
- Local-only follow-up after caa56b7ac. Previous combined production release remains a separate coordinator-owned package. Integrated tooltip rendering and owner acceptance pending.
