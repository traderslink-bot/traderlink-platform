# Community owner production review gate

Status: implemented locally for Coordinator review; not pushed or deployed.

## Decision

During the private production review, every human-facing Community page,
server action, and user API must admit only the owner's two already configured
accounts. The gate reuses
`TRADERLINK_WATCHLIST_DASHBOARD_NAV_DISCORD_SUBJECT`; it does not add account
identifiers to source or introduce another hosted variable. A configured
subject grants access only while its matching Discord identity remains active.

This is an outer review gate. Community ownership, membership, role,
capability, admission, payment, and content checks continue to run inside it.
Passing the review gate never grants a Community permission.

## Boundary

- `community-owner-review-request-identity.ts` is the canonical server helper.
- Local development identities remain available for isolated preview and test.
- Hosted access fails closed when the selector is missing, malformed, does not
  match the signed-in user, or matches only a revoked Discord identity.
- Community pages, onboarding, recovery, installation checks, lifecycle
  actions, settings actions, and Coaching actions use the canonical helper.
- The shared dashboard frame exposes Community navigation only when the same
  two-account selector passes; being a Community member cannot reveal the
  navigation to a third production account.
- Shared Alerts, Community Alerts/Watchlists/Content, and Paid Partner Channels
  must call the same helper in their own pages, user routes, and actions when
  their preserved source is assembled into the combined candidate.
- Authenticated workers and signed provider webhooks are explicit exceptions:
  they retain their existing machine authentication and do not impersonate a
  human review account. This includes Community Discord delivery and signed
  payment-provider callbacks.

No Help Center guide changes are required: this is a temporary access boundary
and does not alter accepted feature behavior or user instructions.

## Verification

- Focused identity tests prove both configured accounts are admitted.
- The same tests prove an ordinary third identity and a revoked configured
  identity are denied across request, page-action, authenticated-page, and
  server-component adapters.
- A source-boundary test inventories the current Community pages/actions and
  prevents regression to an ungated generic platform identity resolver.
- Combined candidate verification must repeat route/action checks after Shared,
  Paid, Alerts, Watchlists, and Content source is assembled.
