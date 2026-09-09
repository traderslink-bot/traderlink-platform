# TraderLink Communities Partner Platform Progress

**Status:** Communities 1-7 implementation assembled and focused acceptance
proof passing. Integrated visual QA, final build, local checkpoint commits and
staging publication remain in progress. The owner has deliberately deferred
visual approval until the complete staging review.

**Controlling plan:** [TraderLink Communities Partner Platform Plan](traderlink-communities-partner-platform-plan.md)

## 2026-09-07 coaching plans and agreements revision

- [x] Locked the coach-offer sequence: services, work settings, required
  Journal access and coach-entered pricing are visible before the student
  chooses or pays for coaching.
- [x] Locked external payment as a server-level transaction; TraderLink may
  display coach-supplied prices and payment instructions but does not process,
  refund or reconcile the payment.
- [x] Locked required Journal access separately from optional additional
  access. Required access needs explicit student confirmation before activation
  and cannot be silently reduced or inferred.
- [x] Product direction approved for optional reusable plan templates and
  custom per-student agreements assembled from TraderLink-supported coaching
  items.
- [x] Recorded the finalized student agreement, rather than the advertised
  plan, as the source for generated coaching work, due dates, calendar entries,
  item counts and follow-up periods.
- [x] Added the visual-review
  [Coaching Agreement Builder Mockup](traderlink-coaching-agreement-builder-mockup.html)
  covering the starting point, coaching-item selection, conditional schedules,
  workload preview, draft review and student-confirmation handoff.
- [x] Added the matching
  [Coaching Offer Comparison Mockup](traderlink-coaching-offer-comparison-mockup.html)
  and
  [Student Coaching Agreement Mockup](traderlink-student-coaching-agreement-v2-mockup.html)
  inside the normal TraderLink dashboard, including exact Journal-sharing
  requirements, optional sharing, price comparison and confirmation.
- [ ] Owner visual approval of the agreement-builder and student-confirmation
  composition.
- [ ] Integrated agreement schema, work-generation rules and application UI.

## 2026-09-06 coaching operations revision

- [x] Product direction approved for one Coaching Work page combining the
  former work, review and session queues.
- [x] Product direction approved for number-of-days, week, month and custom
  range workload views with due-date ordering and period-responsive counts.
- [x] Product direction approved for a coach-private shared-trade table,
  single/multi-trade review selection, coach-only reviewed state, Trade Details
  and on-demand chart access.
- [x] Product direction approved for a full review editor covering trade,
  multi-trade, period, performance, session and general coaching work, including
  images, drafts, history and follow-up.
- [x] Product direction approved for separate work and due states, Delivered
  and Viewed timestamps, coach-created follow-up work and future plan-level
  follow-up limits.
- [x] Product direction approved for review workspaces generated from one trade,
  selected trades, a day session, a week, a custom period, the complete granted
  trade table or a group teaching item.
- [x] Owner visual approval of the
  [Coaching Work and Review Workspace Mockup](traderlink-coaching-work-review-workspace-mockup.html).
- [ ] Integrated data contracts, repositories, commands and route actions.
- [x] Integrated the first approved Coaching Work page: reviews, tasks,
  sessions and group teaching now share one searchable, filterable and sortable
  due-date queue with Upcoming, Week, Month, Custom and number-of-days views.
- [x] Replaced the separate Reviews and Sessions navigation entries and made
  their old URLs return to Coaching Work.
- [x] Added a true aligned desktop table and labelled mobile work cards. No
  internal `in_review` value appears in this surface.
- [ ] Integrated shared trades and the individual review editor.
- [ ] Owner visual approval of the
  [Coach Trade Review Workspace Mockup](traderlink-coach-trade-review-workspace-v2-mockup.html).
- [ ] Integrated student private coaching workspace updates.
- [x] Focused ESLint passes for the three changed application files. The
  repository-wide TypeScript process exhausted the low-memory machine before
  completion and was not repeated.
- [x] Direct local Next.js compilation and rendered Light-mode checks pass for
  the real component at desktop and mobile widths. Number-of-days filtering and
  the Month control respond; the desktop table and mobile-card breakpoint both
  render as intended.
- [ ] Disposable-database verification and final integrated type/build gate.
- [ ] Rendered desktop/mobile Light/Dark verification and staging acceptance.

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
- [x] Replace custom-first TraderLink roles with owner-controlled mappings from
  existing Discord roles to fixed TraderLink feature responsibilities.
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
| Communities 1 - identity and permissions | Implemented; focused proof passing | Isolated community membership, automatic all-member baseline and Discord-role-derived server features |
| Communities 2 - TraderLink Administration and onboarding | Implemented; final rendered QA pending | Global control plane and resumable first-server setup |
| Communities 3 - Owner Dashboard and staff composition | Implemented; final rendered QA pending | Owner-managed team and permission-derived workspaces |
| Communities 4 - alerts, watchlists and Discord publishing | Implemented; live Discord send deliberately not run | Private pages and exact-channel delivery |
| Communities 5 - member activity and analytics | Implemented with 90-day named-event default; final owner review pending | Named and aggregate community usage reporting |
| Communities 6 - coaching and Discord-role access | Implemented; final rendered QA pending | Coach offers, role-gated service access and explicit trader data grants |
| Communities 7 - Tier 2 partner attribution | Implemented as configurable, provider-neutral intake; commercial values remain disabled until set | Deterministic subscription attribution and earnings status |
| Communities 8 - first-server pilot | Review fixture implemented; real server and private test channel remain external staging acceptance steps | One accepted real Discord-server operating loop |

## Implementation record - 2026-09-05

- [x] Added additive migrations `0121` through `0125` for community identity,
  memberships, custom roles, Discord mappings, content audiences, destinations,
  alerts, watchlist placements, coaches, plans, relationships, revocable Journal
  grants, named activity, Tier 2 attribution/earnings and disabled future coach
  fee rules.
- [x] Extended Discord sign-in to discover owner guilds, refresh onboarded
  memberships and roles, and allow every verified member of an active connected
  server to use TraderLink without a server-selected admission role.
- [x] Added Communities controls inside `/admin/journal/communities`, a safe
  redirect from the former `/admin/communities`, server-owner onboarding, the plural
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
migrations plus `0121` through `0125`, exercises the real repositories and removes
the database afterward. Current result:

`{"capabilities":20,"communityIsolation":true,"discordRoleMapping":true,"foreignKeyViolations":0,"journalGrantRevoked":true,"namedActivity":true,"ok":true,"tables":17,"tier2Idempotent":true}`

The separate Discord-delivery proof uses a stubbed Discord HTTP boundary and
passes exact owner-selected alert/watchlist channels, exact TraderLink links,
persisted one-attempt receipts and mention suppression:

`{"ok":true,"delivered":2,"exactLinks":true,"ownerChannels":true,"mentionsSuppressed":true}`

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

## Staging owner-review checkpoint — 2026-09-05

- [x] Reconciled the 52-file implementation onto the exact staging parent
  without absorbing unrelated shared-checkout work.
- [x] Renumbered the additive Communities migrations to collision-free `0121`
  and `0122`, preserving all existing staging migrations through `0120`.
- [x] Applied both migrations one at a time through the guarded staging
  maintenance path with backup and post-migration verification.
- [x] Published final staging source
  `7ec96b4e0ab61fcd62d9e4fe166f97b2b317bc3b`; Railway deployment
  `09b87cea-40d5-4c7f-98fc-e1b30a2e01be` reached `SUCCESS`.
- [x] Verified `/api/platform/health` at HTTP 200 with `status: ready`,
  `sqlite_single_node` storage and 117 applied migrations.
- [x] Added the staging-only `/communities-preview` route and verified every
  member, coach, owner and staff section renders without a server-error state.
- [x] Verified the default Light and explicit Dark review surfaces. Dark owner
  review found and corrected the conditional Coach/Owner tab selection index.
- [ ] Owner visual/product acceptance remains intentionally open for the
  requested staging review and refinement loop.

No live Discord message was sent, no real partner terms or coach fee were
activated, no real server was onboarded and production remained unchanged.

## Continuous completion goal - 2026-09-06

**Status:** In progress

The owner directed one continuous implementation goal through a complete
in-application staging review. The order is now explicit:

1. finish every TraderLink Communities workspace and its internal features;
2. finish role-appropriate shared-shell navigation and authorization;
3. complete alerts, official server watchlists, alert templates, coaching,
   coach/student communication, member management, settings and page-specific
   analytics;
4. verify responsive Light and Dark rendering and the complete in-app flows;
5. publish the completed in-app system to staging for owner review; and
6. defer live Discord posting, Discord-role synchronization testing and
   test-account sign-in testing until the in-app product is complete.

Internal workspace implementation now includes migration `0126`, independently
typed personal and community alert templates, tracked-page versus full-Discord
publishing modes, editable and archivable alerts and official server
watchlists, coach/student messaging, trade-review requests and feedback,
coaching-plan pause/archive controls, member suspension/reactivation, role-aware
navigation and page-specific activity reporting. Ordinary members cannot read
full-Discord-post content through TraderLink; only publishers and authorized
managers can inspect it in their workspaces.

The updated disposable proof passes with 22 Communities tables and all 20
capabilities:

`{"capabilities":20,"communityIsolation":true,"discordRoleMapping":true,"foreignKeyViolations":0,"journalGrantRevoked":true,"namedActivity":true,"ok":true,"tables":22,"tier2Idempotent":true}`

The repository-wide TypeScript diagnostic reaches only pre-existing shared-tree
failures: deleted Help routes represented by stale `.next` types, the separately
deleted `0103` appearance migration and unrelated Coach test fixtures. No
Communities diagnostic remains. The completed staging result follows.

### Continuous-goal staging acceptance - 2026-09-06

- [x] Published the internal-workspace slice through the serialized staging
  release lane, applied only migration `0126`, and verified the normal service
  at `ready`, `sqlite_single_node` and 121 migrations.
- [x] Verified owner, admin, coach, contributor, member and student review
  compositions without an application error.
- [x] Verified alerts, independently typed alert templates, official server
  watchlists, coach plans, coaching requests, messaging, trade reviews, member
  management, settings and page-specific activity surfaces.
- [x] Verified that ordinary members and students cannot read full-Discord-post
  content through TraderLink while authorized publishers can manage it.
- [x] Verified representative desktop and 390-pixel mobile pages with no
  horizontal document overflow.
- [x] Verified Light and Dark surfaces; Dark navigation now preserves the review
  appearance across tabs and role switching with no white page or card gaps.
- [x] Final staging source `671b9ef44cb364361ac746b7d7f085eaf6a82787`
  deployed successfully as Railway deployment
  `4d11edd0-3294-4db4-b482-11a7f08926e9`.

Live Discord posting, live role synchronization and test-account Discord sign-in
remain deliberately deferred until after the owner's internal-product review.

## Coach workspace organization - 2026-09-06

**Status:** Implemented and released to staging; rendered owner review pending

- [x] Reorganized the coach experience into Coaching Work, Students, an
  individual private student workspace, and Coach Setup.
- [x] Moved profile, plans and enrollment requests into Coach Setup.
- [x] Added a coach work queue for open tasks and trade reviews.
- [x] Added a student roster with task, review and Journal-access status.
- [x] Added relationship-scoped tasks and durable shared or coach-private
  coaching history.
- [x] Added coach-controlled student messaging and trade-review-request access.
  New active relationships grant neither service until the coach enables it.
- [x] Preserved coach access to messaging and trade-review work while enforcing
  the student switches in the repository.
- [x] Expanded the private student workspace with services, tasks, messages,
  trade reviews, shared Journal data and coaching history.
- [x] Focused ESLint and the disposable Communities repository proof pass. The
  proof covers disabled-by-default student services, coach enablement, tasks,
  history, relationship isolation and zero foreign-key violations.
- [x] Published migration `0127` and the workspace UI to staging at source
  `a50df1964a2ef291d2e08de4bfade0534845f34c`.
- [x] Guarded migration deployment applied exactly one migration and verified
  122 migrations on `sqlite_single_node`. Normal deployment
  `a58681ae-447f-491f-8dfd-2d6ca540eb35` reached `SUCCESS`; direct health is
  `ready`.
- [ ] Verify desktop and mobile Light and Dark rendering on staging.

## Full coaching platform expansion - 2026-09-06

**Status:** Implemented and released to staging; owner review pending

- [x] Recorded that coaching reviews may cover one trade, multiple trades,
  weekly or monthly performance, general performance, a coaching session or a
  custom review.
- [x] Recorded private image attachments for annotated charts and screenshots
  across messages and reviews.
- [x] Recorded group lessons, classes and assignments for all students, one
  plan or selected students.
- [x] Moved enrollment capacity to each coaching plan while retaining only an
  optional coach-level safety ceiling.
- [x] Kept trade reviews optional for a plan and coach-controlled per student.
- [x] Preserved student-owned, revocable, read-only Journal sharing as the only
  source for coach performance comparisons and trade selection.
- [x] Expanded coach navigation into Coaching Work, Students, Reviews, Sessions,
  Teaching and Coach Setup while retaining the shared TraderLink shell.
- [x] Added plan-level capacity and optional messaging, review, session and
  teaching services. New enrollment checks use the selected plan's capacity.
- [x] Added single-trade, multi-trade, weekly, monthly, general, session and
  custom reviews with optional Journal trade selection and period bounds.
- [x] Added relationship-scoped review replies and private PNG, JPEG and WebP
  chart attachments with an 8 MB limit and authenticated no-store reads.
- [x] Added scheduled/completed sessions, lessons, classes and assignments for
  all students, a plan or selected students.
- [x] Added student-facing coaching inside the normal TraderLink dashboard with
  coach messages, images, reviews, replies, upcoming work, teaching and shared
  history.
- [x] Preserved exact relationship authorization: only the assigned coach and
  student can read private work, and Journal reads still require the student's
  active, revocable grant plus the coach's live Discord capability.
- [x] Focused ESLint passes for the expanded slice.
- [x] Disposable repository QA passes with 28 Communities tables, all 20
  capabilities, zero foreign-key violations and relationship isolation.
- [x] Completed the guarded staging release. Migration `0128` applied exactly
  once; final normal source `ffd0d5d2c9efa6716e75b275149bed72bf2599b3`
  deployed as Railway `1292a8e2-8d45-4b55-b1cb-2445a963d081` with one running
  instance, both maintenance controls absent, and health `ready` /
  `sqlite_single_node` / 123 migrations.
- [x] Verified every coach workspace route, the private student workspace and
  the student coaching composition in Dark mode without a 404 or load error.
  Verified representative desktop and 390-pixel Light and Dark layouts without
  horizontal overflow. The student hydration timestamp mismatch was repaired
  with deterministic UTC rendering.
- [ ] Owner-review the complete expanded coaching composition on staging.

## Coach plan builder and Discord coaching-role continuity - 2026-09-07

**Status:** Implemented and released to staging; owner review pending

- [x] Replaced the primitive coaching-plan form with a preset coaching-work
  builder that records frequency, coverage period, quantity, due timing,
  trade-selection responsibility and follow-up period for each selected item.
- [x] Separated billing cadence from the cadence of coaching work and added
  fixed price or quote-required pricing, currency and plan-level capacity.
- [x] Added required Journal scopes to the plan before a student agreement is
  activated.
- [x] Required each published plan to select an existing Discord coaching-role
  identifier. TraderLink verifies the role and does not represent the external
  Discord payment as processed by TraderLink.
- [x] Added plan-level paused-student archive timing with `Never` as the
  default, preserving the coaching record when access changes.
- [x] Added migration `0129` for structured plan items, required Journal scopes,
  price terms, the required Discord role and optional archive timing.
- [x] Derived coaching access from the most recently synchronized Discord roles
  so access pauses when the required role is missing and restores when it
  returns without deleting the relationship or its history.
- [x] Added visible `Access paused` treatment for coaches and the approved
  student-facing pause notice.
- [x] Blocked new relationship-scoped coaching messages, review work, sessions,
  replies and image submissions while the required role is unavailable.
- [x] Focused ESLint passes for the changed coaching files.
- [x] Published final source
  `903264d0b32ea7f31190f9d87c0c574ae4c83708` through the serialized
  staging lane. Guarded deployment
  `17c95abf-ad7f-4940-b649-1ebab7fe06e6` verified backup and restore and
  applied exactly migration `0129`.
- [x] Final normal deployment
  `dca1a755-b9f4-4bca-8f16-ab3c2069511b` reached `SUCCESS`; health is HTTP
  200, `ready`, `sqlite_single_node` and 124 migrations, with both temporary
  maintenance controls absent.
- [x] Signed-in staging verification passed for Coach Setup, the structured
  plan builder, required Discord role, populated plan cards, Students and the
  390-pixel responsive layout with no overflow or browser errors.
- [ ] Render-confirm the `Access paused` coach and student treatments with a
  role-missing review state. The current review fixture has its required role.
- [ ] Owner-review the staging composition.

## Session and lesson delivery boundary - 2026-09-07

**Status:** Product direction recorded; implementation follows the coaching-plan staging checkpoint

- [x] Defined one-to-one sessions as student-specific scheduled work with an
  agenda, planned duration, external meeting link, private coach notes, shared
  notes, action items, follow-up and history.
- [x] Kept live calls outside TraderLink for the first release. The coach may
  use Discord voice, Zoom, Google Meet or another service.
- [x] Defined live lessons, externally hosted recorded lessons, assignments and
  resources as separate reusable teaching formats.
- [x] Assigned lesson audience, availability, attendance and completion
  tracking to TraderLink while leaving video storage and streaming with the
  coach's selected provider.
- [x] Preserved the distinction between reusable lessons and private
  one-student sessions.
- [ ] Design and implement these session and teaching refinements after the
  structured coaching-plan builder is accepted on staging.

## Coaching measurement and custom-freedom decision - 2026-09-07

**Status:** Builder refinement released to staging; owner review pending

- [x] Rejected a generic item count for every coaching service.
- [x] Defined trade reviews by trades and trading-day reviews by trading days
  or sessions, with approved Journal context attached to that work.
- [x] Defined performance, strategy, risk and goal reviews as coach-defined,
  period-based work whose time and deadlines may be organized by TraderLink.
- [x] Kept risk review available as a separate service rather than forcing it
  into every trade review.
- [x] Required a bounded student-question allowance; unlimited questions are
  not offered by the structured builder.
- [x] Classified coach/student screenshots and marked charts as coaching
  attachments rather than Journal-access scopes.
- [x] Defined Custom coaching as the full-freedom option. Access, agreement,
  external commercial terms and explicit Journal permission remain required;
  quantities, timelines, planned time and generated work are optional.
- [x] Recorded that TraderLink should strongly encourage timelines because they
  provide calendar and workload organization without forcing them on custom
  coaching relationships.
- [x] Rebuilt the plan builder with separate Structured plan and Custom
  coaching paths.
- [x] Removed standalone Journal review from the coaching-service selector and
  removed coaching images from Journal-access scopes.
- [x] Added service-specific controls for trades, trading days, check-ins,
  sessions, lessons and bounded student questions.
- [x] Added period, planned minutes and due timing for coach-defined
  performance, rules, strategy, risk and goal reviews.
- [x] Added Trades only and Complete trading day choices to trading-day review.
- [x] Made Custom coaching usable with only its agreement and access terms;
  its timeline is optional.
- [x] Added additive migration `0130` so measurement kind, optional planned
  minutes, optional timeline and trading-day review depth are durable facts.
- [x] Focused ESLint and the disposable Communities repository proof pass with
  zero foreign-key violations.
- [x] Published migration `0130` and the refined builder to staging at
  `d83de0171858d116a251c30220237db92dbb8128`. Railway deployment
  `6e9a71cc-07f9-45bb-b489-417465b27fde` reached `SUCCESS`; health was HTTP 200,
  `ready`, `sqlite_single_node` and 125 migrations.
- [ ] Build the finalized relationship-scoped coach/student agreement flow
  from these persisted plan terms.

## Optional review sections and continuing focus - 2026-09-08

**Status:** Integrated review workspace implementation active; staging pending

- [x] Added optional Review, What went well, What needs work and Next focus
  sections to the coach's individual review workspace.
- [x] Added private Coach notes that are never returned in the student review.
- [x] Omitted every empty optional section from the student's review instead of
  displaying empty headings or fields.
- [x] Kept draft review content out of the student-facing review until the coach
  completes the review.
- [x] Carried the latest prior Next focus into the next review as Previous focus.
- [x] Added Not evaluated, Improving, Still struggling, Achieved and Replaced
  progress choices with an optional assessment.
- [x] Preserved coach freedom: none of these sections is mandatory and review
  template defaults remain a later coach-settings slice.
- [x] Added migration `0131` for durable optional review sections and continuing
  focus progress.
- [x] Focused ESLint, syntax checking, the disposable Communities repository
  proof and Git whitespace validation pass. The repository proof also confirms
  that students receive neither private Coach notes nor unfinished draft review
  content in their server-provided snapshot.
- [ ] Publish this slice to staging and complete rendered desktop/mobile
  Light/Dark verification.

## Integrated trade-review workspace correction - 2026-09-08

**Status:** Corrective integration active; staging replacement pending

- [x] Recorded that the optional review-section slice incorrectly replaced
  rather than extended the owner-approved V2 trade-review workspace.
- [x] Restored Find trades, To review and Saved views as the controlling trade
  workflow.
- [x] Restored search and date controls, right-side selection boxes, Select all,
  Add to review, Remove selected and Remove all.
- [x] Kept student-selected trades out of Find trades and placed them directly
  into To review with Student labels.
- [x] Restored the focused per-trade review editor, factual trade summary,
  Trade Details, Chart, image/action controls and Save trade review behavior.
- [x] Saving a trade review moves it from To review to Saved and advances the
  editor to the next queued trade. Saved reviews remain reopenable and editable.
- [x] Restored Student Journal drawers, Review agreement, Review progress and
  the separate Review and send confirmation page.
- [x] Preserved the newly approved optional overall-review sections after the
  trade workflow instead of using them as its replacement.
- [x] Kept desktop trade rows aligned as a table and used compact trade cards on
  mobile.
- [ ] Complete focused verification, publish the correction to staging and
  compare the rendered result against both approved mockups before reporting it.
