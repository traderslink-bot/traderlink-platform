# Community Company Facts Cache Plan

**Status:** Owner-authorized implementation in progress

**Parent feature:** [Community Watchlists Plan](community-watchlists-plan.md)

## Outcome

Store Company Facts once for Community ticker use instead of treating each
watchlist card as a temporary Finnhub response. The same dated record will be
available to later Community ticker and chat pages.

## Current slice

1. Create one Community-owned fact record per ticker symbol.
2. Store the provider, company name, country, industry, exchange, website,
   market capitalization, shares outstanding, and retrieval time.
3. Read the saved record first; later background work automatically refreshes
   active Community tickers after seven days.
4. Use that stored record for direct watchlist cards and cards opened from the
   Community Watchlists hub.

## Boundaries

- These are reference facts, not live quotes, recommendations, trade signals,
  or trader-entered research.
- A missing provider response is stored as a dated unavailable fact set; the
  app does not invent zeroes or substitute a different company.
- Traders do not request a refresh. A later background refresh for active
  Community tickers may improve recency without changing the user flow.
- This is a Community-owned global ticker reference cache. It does not read or
  expose Journal, broker, account, or performance data.
