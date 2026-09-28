# Watchlist membership feature split

Status: implemented locally; targeted TypeScript passed (8 route/page roots,
zero diagnostics). Scoped ESLint passed with no errors and one pre-existing
unused helper warning in the Watchlist client. Owner UI/runtime review pending.

Owner-approved scope: keep `watchlist.access` independent; add
`watchlist.ticker_details` and `watchlist.trade_analysis`. Members can view the
list without details, or details without Trade analysis & preparation. Do not
hard-code Premium roles or alter the owner's chosen enforcement mode.

Implementation:

- Register both selectable features in the existing membership registry.
- Check detail permission before reading live or archived detail data.
- Remove the AI preparation and legacy trader-read card from denied detail
  responses, including initial server props and polling responses.
- Send list-only projections for live and archived list props and the list API.
  Preserve the visible ticker/price/country/lifecycle list presentation.
- Public SSE sends refresh hints rather than full protected ticker objects.
  Refreshes use the current authenticated API permission checks.
- Show a gated card with a feature-filtered public Plans link. The filter uses
  the existing public catalog only; unlisted/private offers are never exposed.
- On detail access revocation, the next denied refresh replaces the detail UI
  with the gate. Analysis revocation strips cached protected cards while keeping
  quote-freshness reconciliation. Previously delivered data cannot be recalled.

No migration is needed for feature definitions: the existing registry seeds
built-in keys. Policies remain owner-controlled and off by default, so merely
deploying these definitions does not lock existing members out.

Next.js and React guidance applied: serializable minimal list props, server-side
permission checks before detail reads, shared gate component, no new polling
loop, and no hidden protected content in browser props. Help updated. No runtime
test or browser acceptance is claimed for this new scope.

No server, broad tests, production build, hosted migration, push or deployment
is part of this slice. This lives in the canonical mixed checkout and must be
selectively reconciled by the release coordinator, not copied over newer
production Watchlist work. Existing release/authentication blockers are separate.
