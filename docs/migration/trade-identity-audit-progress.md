# Trade identity audit — 2026-09-13

Owner authorized checking all old-ID consumers, fixing confirmed defects and
coordinated production release. This is not a blanket replacement of member
or execution IDs: a user-defined trade groups those immutable underlying facts.

## Navigation slice — verified locally, awaiting release

- Scaling Out and meaningful-profit rows used a logical ID in a member-ID field.
  They now expose the representative member for existing tracker navigation.
  Logical uniqueness checks and whole-trade financial calculations are retained.
- Candle Patterns occurrence rows had the same mismatch. Occurrence/revision
  identity and grouped counts remain logical; navigation retains execution focus.
- Room After Entry projected the logical ID into tracker links, including its
  single-member compatibility path. Both now use the first member consistently.
- Shared Analyzer full-analysis links and Candle Patterns preserve displayed
  Gross/Net. Existing offline links remain saved-day-only, without private IDs.
- Help reviewed and pattern navigation wording aligned. No visual layout change.
- Five focused files / 25 tests passed, one worker, 512 MB. Covers complete grouped
  P/L, account/revision boundaries, navigation identity and basis. Initial added
  compatibility fixture lacked movement fields; fixture corrected, rerun passed.
- No migration, schema, saved-data, provider, AI, entitlement or mutation changes.
- Remote build/typecheck and hosted acceptance remain coordinator-owned.

## Source inventory and broader audit — NOT COMPLETE

| Surface | Evidence / next check |
| --- | --- |
| Trend supporting/events and analyzed-trades index | Representative navigation; AEHL 5m Net hosted PASS on 81a1bbb. |
| Scaling / meaningful profit | Confirmed navigation mismatch repaired above. |
| Room After Entry / entry event paths | Confirmed navigation mismatch repaired above; grouped count and P/L regression passes. |
| Candle Patterns | Confirmed navigation mismatch repaired; logical occurrence identity retained. |
| Entries/exits and execution context | Source rows retain member IDs; shared links now preserve basis. |
| Green to red / Profit zones | Source uses representativeRoundTripId for drawer, logical tradeId for grouping. |
| Workspace table | Groups complete members; spreads first member ID. TradeDetailsDrawer resolves complete membership. |
| Trade Explorer / other analytics drawers | Member-based detail read resolves group; core summary versus projected table needs grouped-case proof. |
| Calendar / Rules result links | Day-only navigation; not the AEHL focus mismatch. Summary grouping still in broader review. |
| Tracker receiving screen | Groups visible same-day members before rendering; still member-keyed focus. Canonical-ID compatibility and stale-link handling remain review items. |
| Analyzer lookup / worker / notifications | Logical repository/worker and representative notification destination identified; broader lifecycle audit pending. |
| Whole-trade edit | Query includes all active logical memberships before editable/version checks. Mutation regressions pending. |
| Notes / tags / rules | Active logical review target and group persistence identified. Mutation regressions pending. |
| Delete | Workspace grouped rows suppress old single-member delete reference. Stale reference and other entry points require further checking. |
| Demo / offline | Source-aligned projection and ID stripping tests present; no demo mutation in this slice. Broader grouping/cache audit pending. |

Do not describe the app-wide audit or canonical-ID migration as completed.
Core analytics currently normalizes round trips, while Trade Explorer projects
logical table rows after summary computation. Establish a concrete grouped
fixture before changing core. Coordinator confirmed no known core owner overlap;
any proven core repair must be its own explicit shared-path allowlist/commit.

## Hosted acceptance targets

Scaling: non-first trade Full analysis selects matching trade/P&L in Net.
Room After Entry: non-first trade opens matching complete analysis, not first
trade for the day. Candle Patterns: selected occurrence opens matching trade,
execution, timeframe and basis. Check grouped trade remains one with full P/L.
Workspace and Trade Explorer controls must remain unchanged.
