# Workspace Rules card performance progress — September 11, 2026

Status: implementation candidate ready for focused verification and coordinated release.

## Measured cause

Production commit `141d74c7cce1b1775d81251b12c07841d48b4862` measured a 3057 ms Workspace request. The Rules card consumed 1664.7 ms, or 54.5% of the measured server work. Its card read reopened the database through three runtime helpers, rebuilt source and reporting-currency trading-day models, evaluated every rule result, and calculated full result summaries and P/L details. Workspace displays only the distinct broken-rule count and three most recent broken-rule titles.

## Repair contract

- Use the verified read-only database already open for the Workspace request.
- Reuse the source analytics reader, including the request's prefetched all-time fact set when available.
- Evaluate the same preset and custom rule versions, effective intervals, target eligibility, account scope, and date range as the full Rules Results page.
- Return only the distinct broken-rule count and the same three titles ordered by most recent date and title.
- Do not add a cross-request card cache or weaken account isolation and database verification.
- Keep the full Rules Results page and its detailed events, P/L values, currency conversion, and summaries unchanged.
- Keep bounded phase timing through the production comparison, then remove it in a later exact release.

## Acceptance gates

- Exact-candidate TypeScript and focused lint checks.
- Behavior comparison between the full Rules Results projection and the dedicated card projection, including preset violations, custom day/trade reviews, rule versions, date filtering, and empty results.
- Release-coordinator review from the exact production parent and complete file allowlist.
- Hosted Workspace behavior and timing comparison after Railway reports healthy.
