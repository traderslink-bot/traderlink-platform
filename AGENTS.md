<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## TraderLink Platform Replacement Direction - 2026-07-31

The active future-product direction is the controlled platform replacement in
`docs/migration/traderlink-platform-replacement-plan.md`. Read that plan, the
Import Integrity and Data Decisions contract, the migration register, and the
progress tracker before making a new platform, Journal, Journal Analytics, or
V3 roadmap decision.

The older Trader Intelligence Dashboard Baseline and Whole Site Source of Truth
sections below govern maintenance of the preserved legacy application. They do
not prescribe the replacement's future module architecture. The Phase 2 empty
database foundation is technically complete and accepted, and the
owner-accepted independent clone at
`C:\Users\jerac\Documents\TraderLink\traderlink-platform` is the active
replacement implementation candidate. The accepted independent-clone baseline
is branch `codex/traderlink-platform-replacement` at
`a3193e19806af955093aa236349d796171d9bf97`; this is a baseline record, not a
claim about the branch's current HEAD. Read
`docs/migration/migration-progress.md`,
`docs/migration/phase-2-replacement-baseline-progress.md`, and
`docs/migration/development-owner-seed-progress.md` for accepted commit
records and current checkpoint state, and verify the live HEAD directly with Git. The
owner-accepted Phase 2 database design is
`docs/migration/replacement-database-schema-and-migrations.md`. Its exact
schema digest, migration identity, initialization recovery, versioned account
fingerprinting, `WorkspaceAccessScope`, permission model, ownership-seed gate,
verification plan, and implementation-file list are implemented and
correction-verified. The coordinating technical auditor accepted the code,
database, and 10-file/53-test result under the owner's delegated technical
checkpoint authority. Phase 3 Journal integrity is now implemented at local
commit `8f6a4d4e4dec20ef6edcd50f476b14d368bde505`,
runtime-verified, and technically accepted under the owner's delegated
technical checkpoint authority. `development.sqlite` contains six migration
rows, the stable local development owner/workspace/account, one confirmed
source-account identity, one accepted-with-decisions statement import, 2,284
immutable source records, 1,072 Stock executions, 542 preserved unsupported
Forex records, 331 analytics-ready closed round trips, and two contained Data
Decisions. No unresolved chain hides unrelated valid data. The legacy
`traderslink.pro` folder remains the preserved recovery/reference application.
The exact Phase 4 Core Analytics plan in
`docs/migration/phase-4-core-analytics-plan.md` is technically accepted. Slices
A-D passed their exact focused and private read-only gates. The replacement now has the
Journal-owned read-only fact set, exact normalization and charge allocation,
explicit coverage/populations, 210 classified capabilities (181
implemented/conditional and 29 unavailable with exact missing-fact reasons),
all accepted groupings, bounded round-trip pagination, and exact independent
reconciliation against the accepted 331-ready/0-open/2-decision database.
Slice E implementation, focused verification and real loopback route checks
also passed. Workspace, Round Trips, the compatibility overview API, and the
five standard Analytics pages now use the replacement engine; Analytics Lab's
old V3/sample runtime is inactive. The owner visually approved the preserved
light Material dashboard on 2026-08-02, completing Phase 4. Calendar, Trade
Tracker and Rules still cross inherited V3 access paths, while Ticker/Open
Trades, Data Decisions, Manual Entry and Analytics Lab remain incomplete
replacement surfaces; these are explicit Phase 5 work and must not be reported
as complete. Public dashboard
login/account integration
is deliberately deferred until the complete dashboard is preparing to go live:
Discord is the first intended public login provider and email/password remains an
optional future capability. Preserve stable Platform/Journal UUID ownership so
that later authentication work does not rewrite Journal facts. Personal owner
involvement is reserved for irreversible or external actions and final
visual/product approval.

Phase 5 is controlled by
`docs/migration/phase-5-module-transfer-plan.md` and
`docs/migration/phase-5-module-transfer-progress.md`. Begin Slice A only: the
read-only Calendar, Trades by Ticker, Open Positions and Trade Tracker query/
route adapters. Imports move with Data Decisions in Slice B. Trade Tracker is
the canonical manual execution experience in Slice C. Rules, tags, notes and
reviews require the planned migration/legacy reconciliation in Slice D. Do not
reconnect V3, start port 3010 before the visual checkpoint, or write the real
database during Slice A.

Phase 3 is controlled by
`docs/migration/phase-3-journal-integrity-plan.md` and
`docs/migration/phase-3-journal-integrity-progress.md`. Read both before any
Journal schema, import, execution, Data Decisions, round-trip, private-source,
or migration-verifier work. The accepted runtime checkpoint separates the
immutable five-table Phase 2 ownership profile from the six-entry,
24-domain-table current manifest; preserves source evidence and versioned
executions; contains two fact-dependent chains in Data Decisions; and leaves
331 unrelated closed round trips usable. The exact 11-file, 129-test focused
suite passed with one worker and no file parallelism, the static verifier passed,
and disposable initialization, backup/restore rehearsal, real migration,
private preview/import/exact-reimport, append-only vault, and independent
database verification all passed. Preserve the private database, backup,
restore, verification, local authority, and evidence-vault boundaries recorded
in the tracker. Never print or commit the private statement name, broker account
identifier, identity fingerprints, HMAC material, or internal UUIDs. Phase 4
must consume the accepted Journal read contracts and coverage; it must not add a
V3 analytics dependency or reinterpret either contained decision as a fact.
Read `docs/migration/phase-3-journal-integrity-handoff.md` before Phase 4 work.
Also read `docs/migration/phase-4-core-analytics-plan.md` and
`docs/migration/phase-4-core-analytics-progress.md`. Slice D passed without
mutating the accepted private database. Slice E may now add only the planned
development scope, replacement launcher, and named Workspace/Trades/Analytics
route adapters before local visual review; it must preserve the accepted light
Material shell and must not add a V3 runtime fallback.

- Trader Intelligence V3 is legacy implementation, not the architecture for
  future ordinary dashboards. Do not add a new normal dashboard dependency on
  V3 analytics, replay, digest, authority, or proof systems.
- Preserve and port the useful safeguards: owner/account isolation, exact
  financial values, source identity, correction precedence, timezone/session
  scope, input validation, and visible data coverage.
- Data Decisions is a required Journal foundation. The system identifies and
  explains deterministic source/execution/round-trip issues; the trader makes
  factual corrections, exclusions, and open-position classifications from
  statement evidence. Do not silently exclude records or let an unresolved
  record hide unrelated valid trades.
- Broker-imported and Trade Tracker manual executions belong to one canonical
  owner/account execution ledger with preserved source provenance. Statement
  upload order is irrelevant. Rebuild the full affected chronological execution
  chain so later or earlier uploads can close or correct existing round trips.
- A round trip begins when position moves from zero to non-zero and closes when
  it returns to zero. The next execution after zero begins a new trade. Manual
  executions use their actual execution date/time, not the submission date;
  daily notes and reviews remain separate per trading date.
- `traderslink.pro` remains the complete legacy reference until the owner
  accepts a complete replacement. Do not create another replacement folder or
  database, mutate the verified empty replacement database, start a replacement
  process, deploy, or delete legacy code until the migration checkpoint
  authorizes the exact action.
- The approved visual baseline is the light Material UI dashboard with its
  complete left navigation. A dark or reduced dashboard that omits Trades,
  Calendar with week/month views, Analytics, Analytics Lab, or Trading Rules is
  not the final dashboard.
  Preserve the complete route/navigation inventory and obtain iterative owner
  approval for any visible change.
- The permanent architecture name is TraderLink Platform. `V4` is optional only
  as a later release label, not as the module/database architecture or a reason
  to create another duplicate folder. January IBKR data is development test
  data, not a complete live customer dataset. `v4-temp-sql` was located only
  inside `C:\Users\jerac\Documents\traderslink.pro back up july 29`; it is an
  early experiment, is not configured, and is rejected as a migration source.
- New replacement implementation belongs only in the clean, traceable full
  checkout at `traderlink-platform`. The original `traderslink.pro` folder
  remains intact as the legacy recovery/reference source and receives only
  explicitly approved emergency or preservation work during migration.
- Workspace cleanup is evidence-gated by
  `docs/migration/workspace-and-worktree-cleanup-plan.md`. Inventory unique
  commits, dirty/untracked files, private data, processes, and dependencies;
  show the owner exact proposed dispositions before deleting any folder.
- New planning documents belong in `docs/migration/`; keep the migration
  register and progress tracker current. Every new/reworked UI slice requires
  owner visual approval before acceptance.
- Treat phases as approval/scope boundaries, not mandatory chat boundaries.
  Multiple short phases may share a chat after the applicable delegated
  technical acceptance or retained owner gate authorizes the next scope; a
  large phase may span continuation chats. Technical code/database/test/Git
  checkpoints may be accepted by the coordinating auditor under the owner's
  delegation. At every completed phase, update all controlling documents and
  give the applicable coordinator or owner an optional ready-to-copy next-chat
  prompt using
  `docs/migration/phase-handoff-template.md`. Chat choice never broadens scope.
  If context ends mid-phase, create a continuation handoff and do not mark the
  phase complete.

## Canonical App Rule — main is the only complete app

This section governs the existing legacy application until the replacement
plan's promotion checkpoint declares `traderlink-platform` canonical.

`C:\Users\jerac\Documents\TraderLink\traderslink.pro` on branch `main` is the
complete approved TraderLink app.

- `main` is the complete approved integration app and the normal dashboard the
  user returns to between feature reviews.
- Build new or unfinished features on an isolated `codex/*` branch or
  worktree unless the user explicitly authorizes work directly on `main`.
- Review an unfinished feature only from its clearly identified isolated
  branch/worktree. After the user approves it, intentionally bring only that
  approved work into `main` before it becomes part of the normal app.
- A temporary feature workspace must not run the normal dashboard. Once its
  approved work is in `main` and its preservation is confirmed, remove that
  temporary workspace. Keep a feature branch only while it is still needed for
  active work, review, or recovery; otherwise remove it deliberately.
- Before starting any local dashboard or claiming a feature is ready to
  review, verify and state the repository path, branch, and port. Never
  present a feature-branch preview as the `main` app.
- `codex/v3-journal-preview` is only for the isolated Vercel Preview and its
  separate Neon test data. It does not replace `main` as the complete app.

## Documentation Home Rule — one folder for all new documents

`C:\Users\jerac\Documents\TraderLink\traderslink.pro\docs` is the single
home for all new human-readable project documents.

- Create every new plan, progress tracker, project log, feature brief,
  handoff, decision record, and implementation document in `docs/`.
- Do not create new project documents in `src/docs/`, `app/`, the repository
  root, a feature folder, a worktree-only folder, or any other location.
- Existing documents outside `docs/` are legacy documents. They may be read
  and linked when useful, but must not be moved, renamed, copied, or
  reorganized unless the user explicitly asks.
- When adding a new document, use a clear filename and link it from the
  relevant document in `docs/`.

## Codex Autonomy Rules

- Continue with the highest-value next implementation step unless blocked by meaningful ambiguity, architectural risk, or a destructive operation.
- After completing meaningful work, run the relevant tests and verification commands before closing out the task.
- For narrowly scoped display-only changes, such as copy, labels, styling, or simple rendering conditions, run focused tests, targeted lint, and TypeScript checks locally. Do not run a redundant local production build when required remote CI and the Vercel deployment will perform full builds. Run a local full build when changing routes, dependencies, build configuration, server behavior, authentication, or data contracts, or when remote CI will not provide equivalent verification.
- Keep `src/docs/codex-project-log.md` updated when the current resume point, roadmap branch, or best next step changes materially.
- Prefer continuing the current roadmap branch before starting a new pattern family or broader refactor.
- Use `src/docs/behavior-coverage-audit.md` and `src/docs/layer2-pattern-detection/layer2-implemented-pattern-catalog.md` as the main calibration docs for deciding what to build next.
- Only pause for user confirmation when a choice would materially affect architecture, contracts, safety, or destructive filesystem or git actions.
- When resuming cold, first read `src/docs/codex-project-log.md`, then consult the behavior audit and pattern catalog before making new roadmap decisions.

## Trader Intelligence Dashboard Baseline And Parallel Work

- The current approved design baseline is the light, Material-style dashboard on the `/workspace` route. Preserve that visual language and shell unless the user explicitly approves a replacement.
- Every Trader Intelligence dashboard page must live under `app/(dashboard)` and inherit `app/(dashboard)/layout.tsx`. That layout must render `V3DashboardTemplate`; pages must not rebuild the application frame locally.
- `app/dashboard-template.tsx` is the public dashboard UI contract. Import `DashboardPage`, `DashboardPanel`, `DashboardMetricCard`, `DashboardPrimaryAction`, and `DashboardSecondaryAction` from it instead of creating local page containers, card conventions, or action styles.
- `app/dashboard-shell.tsx` exclusively owns the header, TradersLink logo, responsive collapsible sidebar, and full-width page container. Dashboard pages must not create or import their own `AppBar`, `Toolbar`, `Drawer`, logo, `<main>`, or `DashboardShell`.
- `app/dashboard-navigation.ts` exclusively owns dashboard navigation groups, links, icon keys, and route titles. Add or change dashboard navigation there rather than duplicating navigation arrays in pages or the shell.
- The primary-action contract is deep navy `#011E56`, white text, 8px radius, 40px minimum height, bold sentence-case labels, and no elevation or shadow. Secondary actions use the same navy as an outlined treatment. These styles belong in `app/mui-theme.ts`, not page-level `sx`.
- Run `npm run verify:ti-v3:dashboard-template` after adding or structurally changing a dashboard page. The architecture test rejects local shell reconstruction and missing configured routes.
- Read `src/docs/trade-execution-analytics/v3-dashboard-template-contract.md` before creating or redesigning a Trader Intelligence dashboard page.
- The active review instance is commonly `http://127.0.0.1:3010/workspace`. Treat port `3010` as belonging to the worktree that started it; do not stop, restart, or replace that process from another worktree without coordinating first.
- Agents may inspect the `3010` instance read-only. An agent making parallel dashboard changes must use its own Git worktree, branch, and port such as `3011`.
- Divide parallel work by isolated pages or feature areas. Coordinate before editing shared shell or configuration files, especially `app/dashboard-shell.tsx`, `app/mui-theme.ts`, `app/mui-provider.tsx`, `next.config.ts`, or the main dashboard plan and progress documents.
- Changes made in another worktree do not automatically appear on the `3010` instance. Merge or cherry-pick the completed branch into the dashboard baseline worktree, resolve shared-file changes deliberately, then verify the integrated result on `3010`.
- Do not treat older `/intelligence` pages, a server on port `3000`, or the production website as the approved visual baseline for this dashboard.

## Academy Progress Preservation

- Academy progress is production user data. Do not reset, truncate, recreate, or switch the production progress database unless the user explicitly asks for a migration.
- Live Academy progress is keyed by lesson slug. Do not rename, delete, or move launch lesson slugs without updating `academy/_data/progress-slug-baseline.json` and adding an alias in `academy/_data/progress-slug-aliases.json`.
- Run `npm run validate:academy-registry` before deploying Academy content or route changes; it is expected to fail if a protected live slug disappears without an alias.
- See `docs/academy-progress-preservation.md` before changing Academy routing, lesson slugs, progress storage, or Vercel database environment variables.

## Whole Site Source Of Truth

This section governs legacy maintenance and production until the accepted
replacement is deliberately promoted under the migration plan. It does not
cancel the owner-approved clean replacement-folder direction.

- The preserved legacy and current production source-of-truth repo is `C:\Users\jerac\Documents\TraderLink\traderslink.pro`.
- The active replacement implementation candidate is `C:\Users\jerac\Documents\TraderLink\traderlink-platform`; new replacement work occurs there only within the authorized migration checkpoint.
- Work on branches inside the legacy repository only for explicitly approved emergency or preservation work. Do not make another sibling folder or a Codex visualization preview the active application just to work on a feature.
- Codex visualization folders and extra worktrees are temporary review copies only. Before relying on, restarting, or deleting one, save its intended changes to a GitHub branch and bring that branch back into this repository.
- Run the local dashboard from this repository once its branch has been integrated. Do not leave the user dependent on a temporary preview server or its private `.env.local` file.
- Before removing any duplicate project folder, show the user the exact folder, confirm its intended changes are safely on GitHub or already in this repository, and receive explicit approval.
- Do not deploy from the parent folder or stale siblings such as `website`, `trader-intelligence-v2`, `trader-intelligence-v2-svg-qa`, or `deploy-candidates/*` unless explicitly reconciled against this repo and production.
- Current source branch: `main`, tracking `origin/main`.
- Remote: `https://github.com/traderslink-bot/traderslink-trader-improvement-system.git`.
- On 2026-05-26, production Vercel deployment `dpl_H1tehMKTuB3uSxCHHkVk73WabBD8` was deployed from clean `main` at commit `48f0fb8178ff513e229a16eb7ebd7d446aa40a6a`.
- The Vercel project is `vercel-landing` (`prj_TFzKcdj4dS6BHv2maWsy7M5AEv2a`, org/team `team_D1yNeyNl1qTvK0pAWMu5nTWY`) with production aliases `traderslink.pro` and `www.traderslink.pro`.
- Production deploys must come from a completely clean `main` checkout synchronized exactly with `origin/main`. Dirty or uncommitted production deploys are forbidden even when the requested change is path-scoped, because Vercel publishes the entire application snapshot.
- Do not run raw production Vercel deploy commands such as `npx vercel deploy --prod --yes` from Codex. Use `npm run deploy:prod` from a clean clone or worktree linked to the expected project so the deploy guard can verify the repository, Vercel project, branch, remote sync, and clean state.
- If the user asks to deploy a specific page or feature, treat that as path-scoped intent for review and smoke testing. Before production, commit only the intended files, merge them through a green PR, then run `npm run deploy:prod:check -- --allow <path>` from clean synchronized `main`. The `--allow` paths document intent; they never authorize dirty deployment.
- Examples: homepage-only changes should include only `app/page.tsx` plus explicitly required shared assets; scanner access changes should include only `app/filtered-news-momentum-scanner-access` and required libraries; watchlist changes should include only `app/watchlist`, `app/api/live-watchlist`, `src/lib/live-watchlist`, and explicitly required watchlist CSS in `app/globals.css`.
- GitHub ruleset `Protect main` requires PRs and blocks deletion/non-fast-forward updates. The required approving review count is `0` because this repo currently has only the `traderslink-bot` maintainer account; CI must still be green before merge/deploy.
- Feature work completed in sibling folders should be handed off through `C:\Users\jerac\Documents\TraderLink\WEBSITE_DEPLOY_HANDOFF.md` or equivalent chat notes. Do not deploy sibling-folder work directly; port only the intended files into this repo and follow the branch/PR policy before deploying.
- The shared top navigation lives in `src/components/site/site-shell.tsx` and is re-exported by `app/site-shell.tsx`. Do not create separate Academy, News, or Intelligence topbars.
- Canonical feature roots are `app/academy`, `app/news`, and `app/intelligence`. Former workspace routes should redirect in `next.config.ts`; do not recreate duplicate top-level app pages for them.
- Read `docs/site-architecture.md`, `docs/routes.md`, `docs/deployment.md`, and `docs/auth.md` before structural, deployment, route, or auth changes.
