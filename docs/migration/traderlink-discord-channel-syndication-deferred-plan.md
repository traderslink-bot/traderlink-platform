# TraderLink Discord Channel Syndication — Deferred Plan

Recorded: 2026-09-29.

Status: deferred concept, not approved for implementation. Finish the current
Communities and coaching feature first. Revisit and refine this plan with the
owner before building anything. This document adds no current release scope.

Parent: [Communities Partner Platform Plan](traderlink-communities-partner-platform-plan.md).

## Purpose

Support the original idea of linking traders: bring participating providers,
valuable channels and paying members into TraderLink's Discord, while introducing
owners and traders to the TraderLink app, Journal and dashboard. Do not build a
standalone distribution service that primarily grows other servers without a
clear benefit to TraderLink.

## Two distinct concepts

### A. Syndicate existing Discord channels

- An outside server owner connects selected existing source channels.
- Posts automatically appear in corresponding destination channels in the
  TraderLink Discord server. These are Discord channels, not merely app pages.
- The provider sets the price for members to access its channel; paying members
  receive access to the specific paid destination channel.
- A source channel may also distribute to multiple other participating Discord
  servers. Example: Server A posts once; its connected channels in TraderLink,
  Server B and Server C receive the post.
- Source owners choose which channels participate; connecting a server does not
  authorize copying all its channels or unrelated member conversations.

### B. Analyst channels hosted directly in TraderLink Discord

- An analyst creates/operates a paid channel directly in TraderLink's Discord.
- The analyst sets pricing and uses their own Whop to charge members for access.
- There is no outside source channel being copied.
- This is a separate idea, not the same feature as syndication. Its detailed
  workflow is also deferred.

## Direction the owner liked

- Keep the service tied to TraderLink and the app rather than launching a separate
  downloadable/standalone bot business. Discord bots are invited to servers.
- TraderLink is the proposed management hub for source/destination connections.
- Participating source owners must make selected channels available in
  TraderLink's Discord in exchange for the additional distribution capability.
- Distribution to other servers is an additional partnership benefit, not a
  substitute for the TraderLink destination.
- Paid does not mean free: the owner still sets the access price for its offering.
- One bot with independently selectable coaching/community capabilities remains
  the preferred direction; a separate coaching bot was discussed and not chosen.
  A neutral bot name was suggested but no rename was authorized or performed.
- This discussion does not narrow existing Communities/coaching scope or force
  coaching customers to participate in syndication or cross-community sharing.

## Suggestions discussed, not finalized requirements

- Require each syndicated channel to also be offered in TraderLink, rather than
  accepting an empty/token channel while valuable content goes elsewhere.
- Preserve provider branding, source attribution and links to its own server.
- Start with a few providers and source-to-TraderLink delivery, then enable wider
  source-to-multiple-destination distribution after the first model is proven.
- Give the app a useful role in discovery and managing connections/access; Discord
  growth alone does not guarantee Journal adoption or Tier 2 conversion.

## Open commercial decisions

- What exactly does a purchase cover: a channel in one destination, access across
  participating destinations, or a destination server's redistribution licence?
- Who collects payment for syndicated offerings? Whop is specified for the direct
  analyst-channel idea, not yet a settled integration for every syndicated model.
- How do provider payment events grant/revoke the correct destination roles?
  Do not assume an existing Whop product automatically supports multiple servers.
- TraderLink's fee/revenue share, if any, is undecided. Do not invent one.
- Provider eligibility, pricing changes, trial access, cancellations, refunds,
  disputes and member support responsibilities need agreement.
- What happens to paying members and other destination connections when a provider
  leaves, disconnects TraderLink, stops posting or loses source-channel access?
- How is the required TraderLink participation enforced without unexpected loss
  of access for members who already paid?

## Technical and operational work to plan later

- Explicit source-to-destination channel mappings and authorized installation in
  each participating server; least-required permissions, not Administrator.
- Destination-specific paid role access, cancellation and expiry handling.
- New posts, edits/corrections, deletion policy, attachments/images, embeds,
  replies/threads and safe handling of mentions.
- Source message IDs mapped to destination message IDs; duplicate prevention,
  forwarding-loop prevention, delivery ordering and idempotent retries.
- Rate limits, fan-out queues, downtime recovery, missing permissions, removed
  bots/channels and visible delivery failures.
- Original posting times and a clear policy for delayed/stale trading posts;
  never present a delayed replay as a newly issued alert.
- Provider attribution and authorization to redistribute content, including
  content authored by analysts or supplied by third parties.
- Storage/retention, destination history on disconnect, privacy and audit trails.
- Isolation from the existing coaching membership checker and existing bots;
  current role-check success is not proof that message syndication is supported.

## Discord dependency and research snapshot

Automatic reading of source posts generally needs Message Content access.
Discord's June 10, 2026 announcement says privileged-access review applies at
10,000 total users and requires annual reapplication. Do not rely on older
100-server-only guidance. Approval of this specific redistribution use case has
not been established and must be checked before committing to broad availability.

- [Discord data-access requirements](https://discord.com/blog/updated-requirements-to-how-apps-access-data-in-servers)
- [Discord Developer Policy](https://support-dev.discord.com/hc/en-us/articles/8563934450327-Discord-Developer-Policy)

Recheck current Discord requirements, payment-provider capabilities and applicable
commercial/content terms when this plan is resumed. This is a research snapshot,
not approval or a claim that the proposed business model is compliant.

## Risks to validate

- Owners may see TraderLink as a competitor and fear losing direct customers.
- A nominal/empty TraderLink channel may provide no meaningful growth benefit.
- Distribution brings operating/support costs even when TraderLink takes no fee.
- Poor-quality or misleading provider content can affect TraderLink's reputation.
- Paid access leaks, inconsistent destination permissions and payment-sync failures.
- Late or incorrectly edited trading posts can materially misrepresent the source.
- Discord access approval and ongoing maintenance are external dependencies.
- Useful Discord content may grow only the Discord, not the app.

## Resume checkpoint

1. Finish the current Communities/coaching implementation and QA first.
2. Revisit this concept with the owner; settle the purchase/access model and the
   exact required TraderLink participation arrangement.
3. Validate Discord and payment-provider feasibility with a bounded pilot design.
4. Review and approve the complete implementation plan and UI scope before coding.
5. Create a linked implementation progress record only when the work is activated.

Documentation capture is complete. Feature implementation has not started.
