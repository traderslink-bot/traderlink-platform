# Workspace Rules card performance progress — September 11, 2026

Status: repair released and browser-verified; focused internal timing is the next measurement-only slice.

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

## Production result

The repair was released at `240bc0f880451b217f5ae8c0f7a0718ff0f55e28` through Railway deployment `98d9ef7c-f50e-4e82-9bbe-1f5e3bd774da`. The settled signed-in All-time Workspace request completed in 1666 ms at the server and 2070 ms in the browser. Before the repair, the comparable browser navigation took 6030 ms and the server request took 3206 ms. The Rules card fell from 1664.7 ms to 945.8 ms while remaining visibly correct; the complete page rendered with no framework error overlay or captured console error.

The Rules card remains 60.1% of the settled measured server work. The next measurement records exclusive numeric durations for source-model materialization, rule/review database reads, preset evaluation, and custom-rule/card aggregation in the existing throttled Workspace timing log. It does not change rule results, call order, visible copy, or storage.

The production subphase sample then measured 1009.8 ms for the card: 984.9 ms in repeated per-date analytics model materialization, 19.0 ms in rule/review reads, 4.7 ms in preset evaluation, and 0.1 ms in custom-rule evaluation plus card aggregation. The behavior-preserving correction adds a batched rule-evaluation model read. It loads and normalizes the active account's source fact set once, groups the same realized rows by closing date once, and builds only the date, ticker round trips, and coverage fields consumed by preset and custom rule evaluation. It uses the existing source-currency selection, all-trading-date calculation, requested date bounds, limitation codes, account scope, and immutable model conventions. The full trading-day and Rules Results readers remain unchanged, and no cross-request cache is added.
