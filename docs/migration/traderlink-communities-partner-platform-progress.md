# TraderLink Communities Partner Platform Progress

**Status:** Communities 1-7 implementation assembled and focused acceptance
proof passing. Integrated visual QA, final build, local checkpoint commits and
staging publication remain in progress. The owner has deliberately deferred
visual approval until the complete staging review.

**Controlling plan:** [TraderLink Communities Partner Platform Plan](traderlink-communities-partner-platform-plan.md)

**Started:** 2026-09-05

## Approved direction

- [x] Treat Communities as a Discord-owner partner-distribution strategy first
  and a broader TraderLink community later.
- [x] Give every verified active member of an onboarded Discord server an
  eligible TraderLink join path; the owner does not select which roles may join
  TraderLink.
- [x] Keep server-content audiences separate from Platform admission: owners
  may limit specific alerts, watchlists and coaching offers to all members,
  selected roles or selected members.
- [x] Preserve Discord as the live conversation/notification surface while
  TraderLink provides durable community pages, permissions, coaching and usage
  reporting.
- [x] Give TraderLink a global Communities Administration surface.
- [x] Give each verified server owner control over their community, assigned
  staff, content pages, coaching, activity and Tier 2 partner reporting.
- [x] Use one permission-driven staff workspace instead of separate fixed apps
  for every coach/admin/analyst combination.
- [x] Allow community owners to create and name roles from TraderLink-provided
  capabilities.
- [x] Let coaches control their offers while server owners and coaches continue
  handling all coaching payments through their existing Discord-level systems.
- [x] Use verified Discord roles as the access entitlement for paid coaching,
  alert and watchlist areas inside TraderLink.
- [x] Let the owner map any Discord role name to one or more specific community
  services without making TraderLink interpret why the role was assigned.
- [x] Keep server-owner/coach revenue arrangements outside TraderLink for the
  first release.
- [x] Preserve a possible future TraderLink coaching fee as a later commercial
  concept, not an active first-release payment control.
- [x] Keep TraderLink coaching commerce separate from Tier 2 partner revenue.
- [x] Let owners inspect named member activity and content views inside their
  community.
- [x] Keep member-to-coach Journal access separately and explicitly approved by
  the trader.
- [x] Keep the official TradersLink Watchlist and existing personal Community
  Watchlists distinct from server-owned Community Watchlists.
- [x] Let every regular community member deliberately share their existing
  user-owned Community Watchlists into communities where they are active.
- [x] Reuse the nearly completed Community Watchlists editor and canonical page
  rather than building a second server-specific watchlist editor.
- [x] Treat community sharing as a placement, Discord-delivery and engagement
  relationship; the member remains the watchlist owner and named author.
- [x] Require no staff role or forced owner preapproval for member sharing in
  the first pilot.
- [x] Record one all-member Discord channel with a permanent TraderLink access
  message and bounded product updates as an idea for owner review only.
- [ ] Decide whether the partner arrangement uses a dedicated TraderLink
  channel, another visibility method or no formal visibility requirement.
- [x] Preserve alternative ideas for review: attribution on useful posts, one
  pinned link in an existing resources channel, a Discord Server Guide resource,
  a member-requested `/traderlink` command and an optional value-first recap.
- [x] Keep all visibility arrangements pending exact owner approval; any future
  coaching-related commercial agreement is separate and does not force a
  Discord visibility arrangement.
- [x] Reserve singular `/community` for the TraderLink-native user network:
  Community Watchlists and profiles first, with discovery, follows and possible
  stock or ticker discussion boards later.
- [x] Keep private Discord-server workspaces under plural `/communities` and
  require an explicit share before content crosses between the two layers.
- [x] Remove payment-provider selection from the first release. Whop remains a
  research reference only; Discord roles provide paid-service access without a
  TraderLink-controlled connected-account flow.

## Planning checkpoint

- [x] Created the complete product promise and business-model boundary.
- [x] Defined Platform, Communities, Coach, Journal, Affiliate, Discord-role
  entitlement and external server-commerce ownership.
- [x] Defined the user hierarchy and initial capability catalog.
- [x] Defined TraderLink Administration, Server Owner, Staff and Member screen
  inventories.
- [x] Defined server onboarding, multi-community isolation and Discord delivery.
- [x] Defined alerts, watchlists, coaching, named activity and Tier 2
  attribution boundaries.
- [x] Defined complete implementation checkpoints, verification gates,
  exclusions, stop conditions and decisions still requiring owner review.
- [x] Approved a non-colliding route family: existing personal watchlists keep
  singular `/community`, while Discord-server surfaces use plural
  `/communities`.
- [x] Assigned every unresolved commercial and operating decision to the first
  checkpoint that actually requires it.
- [x] Owner reviewed the direction, confirmed the plan was ready and authorized
  Communities 1 foundation work on 2026-09-05.
- [x] Singular `/community` and plural `/communities` route ownership is
  approved for the foundation; detailed navigation placement remains within
  each affected UI approval gate.
- [ ] Named activity retention and member-facing behavior are approved.
- [ ] Tier 2 partner commission and attribution rules are approved.
- [x] Confirmed that coaching payments and server-owner/coach revenue shares are
  handled outside TraderLink for the first release.
- [x] Confirmed that no coaching payment provider or transaction fee is required
  before Communities 6 or the first-server pilot.

## UI approval gates

On 2026-09-05 the owner authorized implementation from start to finish and
explicitly moved visual approval to the final integrated staging review. The
mockups remain the visual contracts; unchecked approval items below are final
owner-review gates rather than implementation blockers.

- [x] [TraderLink Communities Administration mockup](traderlink-communities-administration-mockup.html)
  created.
- [x] Initial TraderLink Communities Administration direction accepted by the
  owner as a "good start"; detailed visual corrections and final approval remain
  open.
- [x] [Server Owner Dashboard mockup](traderlink-server-owner-dashboard-mockup.html)
  created with the permission-derived Staff Workspace represented through team
  member access and responsibility combinations.
- [x] [Full permission-derived Staff Workspace mockup](traderlink-community-staff-workspace-mockup.html)
  created, including
  analyst-only, coach-only and combined coach/analyst views.
- [x] [Member Community dashboard mockup](traderlink-member-community-dashboard-mockup.html)
  created.
- [ ] Owner and staff compositions owner approved.
- [ ] Member Community composition owner approved.

The complete UI implementation is authorized. Final visual/product acceptance
remains open until the owner reviews staging.

### Administration mockup verification - 2026-09-05

- [x] Rendered through a lightweight local-only static preview without starting
  Next.js, opening the database or changing the existing dashboard process.
- [x] Desktop Light overview renders with the complete administration
  navigation, community summary, setup attention and server list.
- [x] Community list, search, selected-community Summary, Team, Pages,
  Activity, Coaching and Settings interactions are present.
- [x] The global Coaching view now inspects coaches, offers, mapped Discord
  access roles and role-verification health; it cannot change an owner's
  private-content audience. Obsolete checkout and fee controls are removed.
- [x] The Server Owner Coaching view now owns `Map access roles` and shows the
  exact Discord role attached to each offer.
- [x] Named member activity and combined staff-role examples render without
  exposing Journal details.
- [x] Desktop Dark state renders with readable navigation, tabs, tables and
  status treatments.
- [x] A 390-pixel mobile pass renders without horizontal document overflow and
  the mobile navigation opens.
- [x] Initial owner reaction recorded as "good start"; detailed corrections and
  final visual approval remain open.

### Server Owner Dashboard mockup verification - 2026-09-05

- [x] Rendered through the lightweight local-only static preview.
- [x] Desktop Light Overview, Team and Roles & Permissions interactions pass.
- [x] Combined analyst and coach responsibilities are clear without granting a
  server owner access to a coach's private student Journal data.
- [x] Owner Watchlists view distinguishes community-owned staff content from
  member-created watchlists shared for server engagement.
- [x] Desktop Dark state renders with readable navigation, cards, tables and
  permission treatments.
- [x] A 390-pixel mobile pass renders without horizontal document overflow and
  the mobile navigation opens.
- [x] The Watchlists view renders member contribution totals, named authors,
  views, follows, direct member sharing and the mapped Discord channel.
- [x] The Watchlists view includes a compact Discord-message preview whose
  `View watchlist in TraderLink` action points to the exact canonical
  TraderLink watchlist page.
- [x] The visual explains exact-page return after sign-in and separate
  community engagement when the same watchlist is shared into several servers.
- [x] The `Share to community` member-flow preview renders and works on desktop
  Light, desktop Dark and 390-pixel mobile layouts.
- [x] Community Settings now makes whole-server TraderLink eligibility
  non-selectable and separates it from alert, watchlist and coaching-offer
  audiences.
- [x] Discord Channels now shows the proposed `#traderlink-tools` exchange,
  permanent access message and recommended bounded update cadence.
- [x] Discord Channels also shows lower-pressure visibility alternatives and
  marks the entire partner-visibility choice as undecided.
- [x] The revised Community Settings and Discord Channels views render in
  desktop Light, desktop Dark and 390-pixel mobile layouts.
- [ ] Owner visual/product approval or corrections recorded.

### Staff Workspace mockup verification - 2026-09-05

- [x] Rendered through the lightweight local-only static preview.
- [x] Analyst, Coach, Analyst + Coach and Admin compositions change the visible
  navigation and responsibilities from one capability-driven workspace.
- [x] Analyst content, Discord delivery and content-activity modules render
  without exposing coaching relationships.
- [x] Coach offers, capacity, students and trader-approved Journal access render
  without granting community-administration or other-coach access.
- [x] The combined composition renders both responsibility sets without
  inventing another fixed staff role or application.
- [x] Coaching offers show the verified Discord roles that unlock each offer and
  make clear that payment is handled by the community in Discord.
- [x] The Admin composition exposes allowed administration while explicitly
  preserving the coaching and Journal privacy boundary.
- [x] Desktop Light and Dark compositions were inspected with readable cards,
  tables, navigation and permission notices.
- [x] A 390-pixel mobile pass renders the four composition choices as a two-by-two
  control, closes the navigation correctly and has no horizontal document
  overflow.
- [ ] Owner visual/product approval or corrections recorded.

### Member Community dashboard mockup verification - 2026-09-05

- [x] Rendered through the lightweight local-only static preview.
- [x] Community Home, Alerts, Watchlists, Coaches, My Coaching and Contributors
  render as one server-scoped member experience.
- [x] Whole-server TraderLink eligibility is visible without implying that every
  member can open every server-owned post or coaching offer.
- [x] The community switcher demonstrates that one user may belong to several
  isolated Discord communities.
- [x] Watchlists combine staff content and deliberately shared member-created
  lists while preserving the member's authorship and canonical watchlist page.
- [x] The `Share existing watchlist` interaction selects the user's list,
  audience and mapped Discord destination without creating a second editor.
- [x] Coach discovery is presented with coach-controlled offers and the Discord
  role required for access; TraderLink does not present a checkout.
- [x] My Coaching keeps Journal access under the member's explicit per-coach
  control and includes a revoke action.
- [x] Desktop Light, desktop Dark and 390-pixel mobile layouts were inspected;
  mobile navigation opens and closes without horizontal document overflow.
- [ ] Owner visual/product approval or corrections recorded.

## Planning package QA - 2026-09-05

**Result:** Pass for planning consistency and lightweight mockup behavior. This
does not close the separate owner visual gates or the Communities 1 technical
proof gate.

- [x] Reconciled the master plan, this progress record, the Communities 1
  progress record, the replacement plan and the migration register against the
  latest owner decisions.
- [x] Removed stale language that said implementation had not started or that
  the route family still blocked Communities 1.
- [x] Confirmed the launch payment boundary everywhere: coaching purchase,
  refunds and owner/coach revenue arrangements stay in Discord; TraderLink has
  no checkout, payment-provider selector or transaction-fee control.
- [x] Confirmed the authority boundary everywhere: every verified active server
  member may join TraderLink, the owner controls access to the server's own
  content and services, and TraderLink only verifies current Discord roles and
  applies the owner's mappings.
- [x] Confirmed that coaching eligibility never grants Journal access; every
  Journal share remains a separate trader-approved, revocable grant.
- [x] Checked 125 local Markdown links across the five controlling records; all
  targets resolve. Corrected one stale filename in the migration register's
  pre-existing Watchlist Usage Presence link.
- [x] Confirmed that all 17 planned `community.*` capability keys exactly match
  the Communities 1 contract source.
- [x] Confirmed that `0121_traderlink_communities_identity_permissions` is the
  only migration file with that number and is present in the migration
  manifest, managed-table inventory, migration register and Communities 1
  progress record.
- [x] Exercised all 10 Administration, 11 Server Owner, seven visible combined
  Staff Workspace and six Member Community navigation destinations. Every
  interaction leaves exactly one active content view and produced no console
  errors.
- [x] Exercised all six Administration community-detail tabs, all four staff
  permission compositions, and the member watchlist share modal and success
  feedback.
- [x] Rendered all four mockups at desktop and 390-by-844 mobile sizes in Light
  and Dark themes. Mobile drawers open and close, the staff composition control
  remains two columns, text and status treatments remain readable, and every
  checked state has zero horizontal document overflow.
- [x] Reset the temporary responsive viewport and returned the preserved preview
  tab to the Server Owner Dashboard.

Intentional open gates are not QA defects: detailed owner approval of each
visual composition, detailed designs for currently structural Administration
destinations, named-activity retention and disclosure, Tier 2 commission and
attribution rules, and selection of the first pilot server remain assigned to
their later checkpoints. No Vitest suite, production build, database migration,
live Discord operation, deployment or production change was run for this
planning QA.

## Implementation checkpoints

| Checkpoint | Status | Required result |
| --- | --- | --- |
| Communities 0 - plan and visual contracts | Planning and foundation routes approved; detailed visual review remains open | Complete plan plus approved routes, terminology and mockups |
| Communities 1 - identity and permissions | Implemented; focused proof passing | Isolated community, membership, custom roles and exact capabilities |
| Communities 2 - TraderLink Administration and onboarding | Implemented; final rendered QA pending | Global control plane and resumable first-server setup |
| Communities 3 - Owner Dashboard and staff composition | Implemented; final rendered QA pending | Owner-managed team and permission-derived workspaces |
| Communities 4 - alerts, watchlists and Discord publishing | Implemented; live Discord send deliberately not run | Private pages and exact-channel delivery |
| Communities 5 - member activity and analytics | Implemented with 90-day named-event default; final owner review pending | Named and aggregate community usage reporting |
| Communities 6 - coaching and Discord-role access | Implemented; final rendered QA pending | Coach offers, role-gated service access and explicit trader data grants |
| Communities 7 - Tier 2 partner attribution | Implemented as configurable, provider-neutral intake; commercial values remain disabled until set | Deterministic subscription attribution and earnings status |
| Communities 8 - first-server pilot | Review fixture implemented; real server and private test channel remain external staging acceptance steps | One accepted real Discord-server operating loop |

## Implementation record - 2026-09-05

- [x] Added additive migrations `0118` and `0119` for community identity,
  memberships, custom roles, Discord mappings, content audiences, destinations,
  alerts, watchlist placements, coaches, plans, relationships, revocable Journal
  grants, named activity, Tier 2 attribution/earnings and disabled future coach
  fee rules.
- [x] Extended Discord sign-in to discover owner guilds, refresh onboarded
  memberships and roles, and allow every verified member of an active connected
  server to use TraderLink without a server-selected admission role.
- [x] Added `/admin/communities`, server-owner onboarding, the plural
  `/communities` member workspace, permission-derived owner/staff sections,
  alert and coach detail pages, and a constrained coach student view.
- [x] Extended personal Community Watchlists with explicit server placement;
  the member remains the canonical author and owner.
- [x] Added retry-safe Discord delivery for alerts, watchlists and coaching
  plans. Messages suppress mentions and resolve only configured server channel
  destinations. No live Discord send was made.
- [x] Added named page activity plus durable daily projections and owner-only
  community analytics. Journal, broker, AI and private coaching payloads are not
  activity fields.
- [x] Added coach-created profiles and plans, capacity enforcement, server-role
  audiences, relationships, and explicit student-owned Journal grants with
  revocation and read-only account scoping.
- [x] Added provider-neutral Tier 2 billing intake with first-community
  attribution, idempotent event processing, refund reversal state and
  configurable per-server commission. Programs remain disabled until an
  operator explicitly sets commercial terms.
- [x] Added optional future coach fee records that are disabled by default and
  do not process or claim current coaching payments.
- [x] Updated Privacy, Terms and the Help Center with the implemented community
  activity, Discord-role, external coaching-payment and Journal privacy rules.
- [x] Added isolated `/communities/review` staging data so all roles and states
  can be reviewed without a live Discord server or fabricated production facts.

### Focused technical proof

The disposable SQLite acceptance script applies all required prerequisite
migrations plus `0118` and `0119`, exercises the real repositories and removes
the database afterward. Current result:

`{"capabilities":17,"communityIsolation":true,"discordRoleMapping":true,"foreignKeyViolations":0,"journalGrantRevoked":true,"namedActivity":true,"ok":true,"tables":14,"tier2Idempotent":true}`

The feature-scoped TypeScript diagnostic is clean. A repository-wide TypeScript
pass still reports unrelated stale `.next` Help routes, removed migration
`0103` and concurrent Coach test-fixture contract errors already present in the
shared working tree; none resolve inside the Communities allowlist.

## Current repository boundary

- Canonical path at planning time:
  `C:\Users\jerac\Documents\TraderLink\traderlink-platform`.
- Active branch at planning time: `main`.
- Observed HEAD before documentation: `5018066fbeca3c88500bec4bcdac762b4936c875`.
- The working tree already contained extensive unrelated staged, unstaged,
  deleted and untracked work before this planning slice.
- This slice must not stage, commit, reset, stash, overwrite or absorb that
  existing work.
- The Communities 0 planning checkpoint itself changed only documentation and
  mockups. Communities 1 code is tracked separately; no process, live Discord,
  Railway, deployment or production state was changed.

## Next authorized step

Complete focused lint/static checks, final integrated build and rendered
desktop/mobile Light/Dark review, create narrow local checkpoints, then publish
only to the configured staging target for owner visual review. Do not send a
live Discord message, configure real partner economics, activate a real server
or change production during this boundary.
