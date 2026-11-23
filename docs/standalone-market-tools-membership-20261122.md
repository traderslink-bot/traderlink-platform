# Standalone market-tool membership

## Authority and source custody

The owner instructed Scanner on November 22 at 18:30:12 UTC to wire the real entitlement reader with Custom Plans and the Coordinator, then test Scanner, Screeners and Charts for a paid account with no Discord or Community membership and Watchlist off. The verified human message is `01a20485-e210-7423-baed-0c0d6e619364`.

Coordinator assigned `/home/traderlink/projects/standalone-market-tools-plans`, branch `codex/standalone-market-tools-plans-20261122`. The author baseline is `ca619bf9fb90f98f4507aa5fe18038baea45274f`. This baseline includes Scanner's reviewed nine-path dependency on `c8ec026024520910db9c5b5036a16abc73926362`. This handoff contains only the subsequent Custom Plans delta. The older market-tool/Options source and dirty News source remain preserved in their existing workspace.

Coordinator owns Git preservation, composition and any later publication. This assignment authorizes implementation and isolated fixture QA. It changes no hosted grants, rollout settings, prices, payment connections or provider configuration.

## Contract and current implementation

- `readMarketToolMembershipAccess(database, userId, checks, atUtc?)` reads the real effective Membership grants. Each check supplies a typed independent feature key, feature-verified `existingAccess`, and `memberReleaseReady`.
- `scanners.access`, `screeners.access` and `charts.access` are separate optional plan choices with editable brief and expanded copy. The contract has no Options dependency. Existing selections are unchanged.
- Existing feature-specific pilot and owner access is retained. The optional `prePaywallAccess` input is supplied only by released consumers after verifying existing global dashboard eligibility. For those released consumers, absent, off and shadow policy permit access without a tool grant. Enforced policy requires a current grant. Callers omitting that input keep the strict entitlement-only behavior, so private and experimental consumers are not opened. Readiness and provider fences still apply. This slice changes no hosted policies.
- An active tool-only grant implies dashboard entry. It grants no Journal, Community, shared Watchlist or other tool permission.
- The reader accepts the owner's normal subscription, free-plan, trial, manual and lifetime entitlement sources. It does not impose a payment provider or positive-price requirement.
- Shared Home and Screeners navigation use the tool entitlement rather than curated Watchlist pilot access. Scanner's legacy and live entry points retain their separate feature-specific pilot checks.
- New definitions use the existing catalog synchronization during normal owner publication. Reads do not write definitions, policies, grants or prices. No schema migration is added.

Shared Charts confirmed `charts.access` as the independent Charts key. Ordinary Charts supplies `existingAccess: false`; generic dashboard or curated Watchlist access cannot replace that grant. Shared frame and Home consume its `hasChartsDashboardAccess(identity)` export from `src/modules/market-data/server/chart-dashboard-access.ts`. That dependency belongs to the Charts handoff and is absent from this author baseline. Charts routes, shared data consumers and the canonical readiness input stay in that owner's scope. The approved Home amendment uses that canonical decision and provides a Charts-specific upgrade link for a dashboard member without Charts.

## Isolated fixture contract for joint browser QA

Use the final composed candidate, its official migrations and fresh disposable database and local keys. Keep all workers and external network effects disabled. Do not copy a production session, database, credential or browser profile.

Create ordinary local email accounts through native sign-up/verification/sign-in, or provision a synthetic Google identity through `PlatformLoginService.signInOAuth` without contacting Google. Use the resulting native Platform session cookie. The normal owner-preview assertion must be absent, so the request resolves the ordinary member rather than the development owner.

Synchronize definitions and create/publish a synthetic private plan through `PlatformMembershipRepository`. For the tool-only admission case, put only the selected market-tool keys in that plan. Give the exact synthetic user an active subscription-sourced entitlement referencing the fixture subscription. A payment-consistency fixture should also contain its synthetic offer and subscription record. Those rows are local test evidence and must never initiate a checkout or provider call.

Enable the applicable feature policies only in this disposable database. Enforce `dashboard.access`, `journal.access` and `watchlist.access` so unrelated default-open policies cannot mask admission failures. Leave the user with zero Discord identities and zero Community memberships. Confirm the actual session identity and those counts before the browser cohort.

Cover individual tools, the combined plan, an unentitled second account, expiry and revocation, direct routes/APIs, saved Home selection and navigation. Keep Watchlist denied throughout. Preserve feature enablement, provider availability, data ownership, sharing and administrative fences. No genuine paid provider, notification delivery or paid AI request belongs in this QA.

## Verification ledger

- First focused checkpoint: 23 passed and four failed across four files. All failures were new fixture plan keys generated as UUIDs that could start with a digit. Both fixture constructors now use the required `tools-` prefix. Scanner-only native session/Home admission and the existing Home regressions passed in that checkpoint.
- The corrected real-reader/catalog/native-session/Home checkpoint passed 29 tests across four files, including each of the three independent tool grants and real synthetic paid offer/subscription rows. This checkpoint preceded the canonical Charts helper imports and later additional free/trial/lifetime and all-combination coverage. Final source retest must use the composed real Charts dependency.
- Scoped TypeScript checked 16 roots and 2,350 source files. Its only two diagnostics are the expected absent Charts-owned module imports in the shared frame and Home access reader. No temporary signature fixture was used. Full composed qualification remains pending.
- Scoped lint found zero errors and the two existing dashboard-shell effect warnings. Whitespace verification passed. Final composed lint and the shared dashboard-template guard remain pending.
- Actual integrated browser qualification belongs to Scanner after Coordinator composes this delta with the reviewed Charts consumer. No production or provider acceptance is claimed.

The Help Center membership guide is updated in the same slice. The React review covers server-resolved permission props and the existing shared shell; no new client request, mutable shared identity state, hook, styling or page frame is introduced.

## Joint checkpoint and resume

Coordinator materialized clean local candidate `2b04203d0f07fd8a6073e3dc8d6fa9c9c3b5bcb4` in `/home/traderlink/projects/standalone-market-tools-joint-qa`. It contains the frozen 14-path Plans packet, the approved one-path Home amendment and the real Charts dependency. All 15 Plans postimages were verified. Home now uses the canonical Charts decision and presents the feature-specific upgrade link when the dashboard member lacks Charts. The author packet is `/tmp/standalone-market-tools-plans-20261122-handoff/manifest.json`; its Home amendment is `/tmp/standalone-market-tools-plans-home-amendment-20261122/manifest.json`.

Scanner `01a1ffbc-c319-7f52-8e28-3014ac777cae` took the shared QA guard for the single changed-file/native-session regression and real paid-member browser cohort. Custom Plans started no competing operation and must leave the pinned checkout and running controller unchanged. After Scanner's clean terminal handback, run the actual-source scoped driver `/tmp/standalone-market-tools-joint-types-20261122.cjs` from that checkout, changed-file lint and the dashboard-template verification under normal guards. Do not repeat checks already completed by that same cohort without a concrete reason.

Static peer review also asked Charts to reconcile the existing production owner bypass with its new grant-based admission. A production owner session with an active `journal_owner_admin` grant currently receives no special treatment in that helper, whereas the existing general Membership evaluator supports owner bypass. This is under the Charts owner's accepted-contract review. It does not authorize a new production grant, rollout switch or policy choice. Group any confirmed correction with actual joint findings, preserve ordinary-member isolation and have Coordinator pin a new candidate before retesting.

No hosted effect, release or payment-processor verification belongs to this checkpoint.

## Consolidated findings and correction batch

The joint member suite on `2b04203d` passed 109 tests in 20 files. Four signed-in paid-user browser pages passed with zero Watchlist requests. The first browser driver then stopped because it expected an authorization status from chart history, while that proxy deliberately returns its existing generic unavailable response when dashboard access is absent. The separate final denial driver completed 42 status checks, one positive gateway control and zero unauthorized gateway calls. It has no recorded failure. This assertion mismatch did not establish a data leak or justify changing the established proxy response.

Evidence remains attributed to that exact candidate:

- `/tmp/standalone-trading-tools-browser-vesEQolH/regression.log`: 109 passing tests in 20 files.
- `/tmp/standalone-browser-picker-qzpb2mmp/browser-results.json`, SHA-256 `fc23b5f658bf2ab615c6e29d1856df2d353423d03ac3e4455edf4e1bc4df888a`: four positive pages, zero page errors and Watchlist requests, followed by the recorded assertion failure.
- `/tmp/standalone-browser-denials-izx69j85/browser-results.json`, SHA-256 `71497278c5039758df82a767bba2f14c68dad0d8918b5381a9796dc2a3a11a4a`: the completed negative and crossed-key proof.

Charts confirmed the owner bypass regression. Its correction belongs to the existing Charts author lane and must preserve the existing active operator permission while retaining ordinary member denials. Plans' matching correction makes Home available whenever the canonical Charts decision admits the authenticated user. It does not create a new owner exemption or change rollout settings.

The expanded native session regression provisions an owner with existing dashboard access and the active operator grant, no paid subscription, no Charts grant, no Discord identity and no Community membership. It checks Charts and Home under off and enforced Charts policy, an unrelated dashboard user while the owner grant is active, and the revoked operator. The existing three paid tool-only cases and their independent grants remain covered.

Coordinator must combine these reviewed corrections and pin the corrected candidate before final actual-dependency tests, type checks, lint, template verification and applicable browser retest. The running or completed `2b04203d` proof must not be relabeled as a pass for the correction. No hosted or provider action is requested.

## Corrected runtime checkpoint

Coordinator pinned `20bbc430349d576c18926f560cd1f6364462b08f` on `2b04203d`. All six correction paths and frozen postimages were independently verified, with a clean worktree. The guarded Plans batch completed and released its marker and common flock without starting an app server or build. Receipt `/tmp/standalone-market-tools-final-20bbc430349d-20261122T192842Z/result.json`, SHA-256 `19b3cfd887d6dbc610c695a5452a12590c846b07f7c02fee61b18f35e2dba0e5`, records:

- Strict actual-dependency TypeScript: 47 roots, 2,593 source files, zero diagnostics.
- Changed-file lint: zero errors and the two existing dashboard-shell effect warnings.
- Native and regression tests: 104 passed and one failed across 19 files. The real native owner/Home regression passed, including the unrelated dashboard user and revoked operator.
- Whitespace passed. Source and index remained unchanged.
- The template guard passed seven checks and failed its feature-panel inventory check for two Scanner drawers.

The remaining native test failure is an incomplete partial Scanner fixture: the updated Charts helper now reads the existing operator repository, whose table was absent. Scanner's amendment supplies the empty table and real queried columns without seeding an owner or weakening the grant decision. The two flagged Scanner components were reviewed as feature-only drawers using shared panels inside route-level DashboardPage. Their narrow inventory amendment retains the shell and navigation guard checks.

Both remaining corrections are test-only, against `20bbc430`. Their manifests are `/tmp/standalone-scanner-operator-fixture-vb0vll_t/manifest.json` and `/tmp/standalone-scanner-panel-guard-d62n6r2r/manifest.json`. Custom Plans independently reviewed both changes and the operator repository's actual SELECT columns. Coordinator owns their shared-test scope and final candidate. Scanner takes the next affected-file and owner/member browser cohort first; Plans runs any still-required final static checks after its clean handback. Do not rerun the old source or relabel earlier evidence as the successor.

Final closeout remains pending. No production, payment, provider or notification action occurred.

## Owner rollout clarification — November 22, 19:32 UTC

The owner clarified in Scanner that these released features must remain outside a paywall for now, while Membership setup should be completed for future use. The direct human message `msg_01a204bf-289a-7a71-8412-1df9fd0c6117` was verified in its saved rollout. Earlier paid-member checks used disposable local records and enabled no live paywall, payment account or subscription.

The reader now accepts optional `prePaywallAccess`, default false. Only released Live Scanners, enabled Stock Screeners and Market Charts pass that input. The exported `hasMarketToolDashboardAdmission(database, identity, environment?, atUtc?)` mirrors existing app admission using current app grants, or the already verified Discord identity plus global dashboard policy and existing member/Premium configuration. A mere Billing-only sign-in is insufficient. Global authentication and admission are unchanged. Legacy Moomoo, Workspace and experimental consumers retain their scoped gates and omit this input.

Focused real SQLite tests passed 16 cases after this change, including absent/off/shadow release, enforced current grants, disabled readiness, default strict consumers, existing global admission and missing grant storage. Log `/tmp/standalone-market-tools-prepaywall-core-20261122.log`. Native coverage now also provisions an eligible free dashboard member with no tool grants, no subscription, no Discord and no Community. It checks pre-paywall access, future enforcement, retained Stock Screeners disablement and Billing-only denial. The existing owner bypass remains independently covered; ordinary dashboard users are now correctly allowed under off policy and denied without a grant under enforced policy.

Scanner and Charts own the explicit released-consumer inputs. Coordinator must compose their narrow changes with this reader/Home/native/help update and the already-reviewed two test corrections, then qualify the exact new candidate. Current enforced-mode policies exist only in isolated QA fixtures. No hosted enforcement, plan price, account, entitlement, grant, payment or provider configuration was changed.

## Open-launch integrated checkpoint

Coordinator pinned clean `09f5a45f22e9b1279f1b69d4083bdcddd3b8cf64`, tree `0747188fb3c7a5633ff37de00a2d6a3571dd58e7`, with all 13 reviewed paths and the exact dependency pins. Plans independently verified its seven postimages and Charts' three postimages before one guarded final run.

Strict TypeScript passed 48 roots and 2,594 source files with zero diagnostics. Lint passed with the same two existing shell warnings. The template guard and whitespace checks passed. The actual native/regression suite passed 125 tests and failed one legacy Home test across 20 files. The new eligible free-member, no-tool-grant, launch-mode, future-enforced, owner, cross-user and revoked-operator cases passed. Receipt `/tmp/standalone-market-tools-final-09f5a45f22e9-20261122T201554Z/result.json` retains the exact source and per-step logs.

The legacy test still expected removing Watchlist pilot access to remove Home despite released tools remaining available to the existing dashboard member. The narrow correction first verifies continued release access, then explicitly enables future enforcement in that disposable fixture before retaining the original fallback and dedicated private-pilot checks. Home admission now reads the released policy for the three keys after real dashboard authentication, rather than broadening the separate Home pilot from any private Scanner pilot. Extra native checks cover one tool remaining released while the others are enforced, and a disabled-only Screener release.

These Home corrections require one local successor before the affected native/legacy retest and the final open-launch browser cohort. They create no production enforcement or grants. The pinned joint checkout remains unchanged by the author corrections.
