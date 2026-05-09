# Platform-Ready Trader Intelligence Feature Module Plan

Created: 2026-05-03

## Why This Plan Exists

Trader Intelligence is not meant to become the whole website. It is one feature
module inside a larger platform that will eventually contain multiple apps /
features under shared login, shared account/workspace context, shared tiered pay
plans, and shared navigation.

The product is still in feature-building mode. That means this repo should not
choose auth, billing, production database, or final platform shell yet. Instead,
it should become a clean, deeply tested, standalone feature module that can run
with demo/sample data now and be mounted into the larger website later.

## North Star

Build every Trader Intelligence feature so it can be used in two modes:

1. Standalone demo mode inside this repo.
2. Mounted platform mode inside the larger website.

The same underlying contracts should work in both modes.

## Non-Goals For Now

- Do not implement real login.
- Do not implement real billing or Stripe.
- Do not choose a production database.
- Do not add end-user export/download controls.
- Do not move candle, support/resistance, or market-structure ownership into
  this app.
- Do not treat `levels-system` market structure as scoring input until
  calibration promotes it later.

## Platform Ownership Model

The larger platform will own:

- authenticated user identity
- organization/workspace membership
- account selection
- global navigation
- subscription tier
- entitlement evaluation
- billing provider
- platform-wide admin roles

Trader Intelligence will own:

- broker execution import parsing and review contracts
- normalized execution storage boundary
- grouped trade review contracts
- execution-only reports
- trade replay
- guided review
- rule recommendations
- notes/lessons contracts
- review queues
- product intelligence
- market-context readiness gates

`levels-system` will own:

- candle fetching
- candle normalization
- support/resistance
- VWAP/EMA/dynamic levels
- market structure generation

## Step 1: Platform Context Contract

Goal:
Define the context this module expects from the larger website later.

Contract should include:

- platform user id
- workspace id
- account id
- role
- plan tier
- entitlement object
- module mount path
- environment mode
- demo/sample flag

Implementation:

- Add platform module contracts under
  `src/lib/trader-analytics/product/platform-module.ts`.
- Add `buildDemoTraderIntelligencePlatformContext(...)`.
- Keep the default context fixture-backed and deterministic.

Done when:

- Tests can build demo platform context without auth/billing.
- The module can identify whether it is running standalone or platform-mounted.

## Step 2: Entitlement Contract And Feature Gates

Goal:
Represent plan/tier access without implementing billing.

Features to gate:

- analytics dashboard
- imports
- guided review
- progress
- trade replay
- import health
- broker mapping admin
- account/storage readiness
- market context
- debug/admin raw JSON

Implementation:

- Add `TraderIntelligenceEntitlements`.
- Add feature keys.
- Add `evaluateTraderIntelligenceFeatureGate(...)`.
- Add usage-limit states for imports, saved trades, and active rules.
- Add admin-only states for broker mapping admin and debug routes.

Done when:

- Demo Pro context unlocks normal product routes.
- Starter/limited contexts can show locked or usage-limited states.
- Non-admin context cannot access admin feature gates.

## Step 3: Module Route Registry

Goal:
Make routes platform-aware instead of hardcoded as if this app is the whole
site.

Registry should include:

- standalone route path
- future platform path
- nav label
- nav group
- feature key
- audience
- admin/debug flags
- raw JSON/export policy
- implementation status

Implementation:

- Add route definitions for current routes:
  - `/analytics`
  - `/imports`
  - `/review`
  - `/progress`
  - `/import-health`
  - `/admin/broker-mappings`
  - `/account`
  - `/trades/[tradeId]`
  - debug routes
- Add `buildTraderIntelligenceRouteRegistry(...)`.

Done when:

- Tests prove every implemented product route has a registry entry.
- Platform paths can be generated under a mount path such as
  `/dashboard/trader-intelligence`.

## Step 4: Demo Context Provider / Fixture Harness

Goal:
Keep building features without real auth or users.

Implementation:

- Add a demo platform shell view model that combines:
  - platform context
  - workflow shell
  - route registry
  - feature gates
  - no-export audit
  - feature checklist
  - route smoke targets
  - visual QA checklist
  - broker fixture harness summary
- Keep it deterministic.

Done when:

- One helper can build a full module-readiness view model.
- Routes can use this helper without needing auth.

## Step 5: No-Export Policy Enforcement

Goal:
Make the end-user no-export policy testable at the module level.

Implementation:

- Route registry must mark all end-user routes as `allowsExport: false`.
- Raw JSON is allowed only for admin/debug routes.
- Add module-level audit:
  - end-user export violations
  - end-user raw JSON violations
  - missing route policy entries

Done when:

- Tests fail if a product route is added without a no-export policy.

## Step 6: Feature Completeness Checklist

Goal:
Track whether this module is ready for platform mounting.

Checklist categories:

- import workflow
- analytics dashboard
- trade replay
- guided review
- progress
- import health
- broker admin
- notes/lessons
- account/plan contract
- storage boundary
- market-context readiness
- no-export policy
- test harness

Implementation:

- Add `buildTraderIntelligenceFeatureReadinessChecklist(...)`.
- Each item should include:
  - id
  - label
  - status: `complete`, `partial`, or `blocked`
  - detail
  - next action

Done when:

- The checklist shows feature work as complete or partial without claiming real
  auth/database readiness.

## Step 7: Visual QA Checklist

Goal:
Give future UI polishing a concrete target.

Implementation:

- Add visual QA checklist for:
  - desktop and mobile analytics
  - imports
  - review
  - progress
  - import health
  - admin mappings
  - account
  - trade detail
- Track status as `pending`, `passed`, or `needs_review`.

Done when:

- Route smoke and visual QA targets are available from the module readiness
  helper.

## Step 8: Broker CSV Regression Fixture Harness

Goal:
Make broker CSV support safer as more real examples appear.

Implementation:

- Add fixture harness summary over existing CSV fixture files.
- Track:
  - fixture file
  - broker format
  - expected accepted executions
  - expected grouped trades
  - expected quality status
  - parse status
- Do not upload or export raw user data.

Done when:

- Tests can verify the current fixture pack through a single harness helper.

## Step 9: Platform Mount Readiness Route

Goal:
Create a route that shows the module is ready to be mounted later.

Implementation:

- Add `/platform-readiness`.
- Show:
  - demo platform context
  - entitlement summary
  - route registry
  - feature gates
  - no-export audit
  - feature readiness checklist
  - visual QA checklist
  - broker fixture harness summary
- Keep it sample/demo-only.

Done when:

- Route builds and smokes without auth.

## Step 10: Documentation And Resume Point

Goal:
Make this branch easy to resume.

Implementation:

- Link this plan from README.
- Update `src/docs/codex-project-log.md`.
- Document exact verification commands and results.
- Do not update the `levels-system` shared handoff unless this app finds a real
  levels-system blocker.

Done when:

- The next Codex session can resume from this plan and project log.

## Planned Files

- `src/docs/platform-ready-feature-module-plan.md`
- `src/lib/trader-analytics/product/platform-module.ts`
- `src/lib/trader-analytics/__tests__/platform-ready-feature-module.test.ts`
- `app/platform-readiness/page.tsx`
- `app/page.tsx`
- `src/lib/trader-analytics/index.ts`
- `README.md`
- `src/docs/codex-project-log.md`

## Verification Plan

Focused:

```bash
npx vitest run src/lib/trader-analytics/__tests__/platform-ready-feature-module.test.ts
npx tsc --noEmit
```

Full:

```bash
npm run verify:all
npm run lint
npm run build
```

Production smoke:

```text
GET /
GET /platform-readiness
GET /analytics
GET /imports
GET /review
GET /progress
GET /import-health
GET /admin/broker-mappings
GET /account
GET /trades/trade-rapid-fire
```

## Completion Definition

This plan is complete when:

- platform context and entitlements exist
- feature gates are deterministic
- route registry maps standalone and future platform paths
- no-export policy is auditable
- demo shell view model exists
- feature and visual QA checklists exist
- broker fixture harness exists
- `/platform-readiness` renders
- focused and full verification pass

## Progress Log

### 2026-05-03

- Created this plan.
- Added `src/lib/trader-analytics/product/platform-module.ts`.
- Added platform contracts for:
  - platform context
  - plan tiers
  - entitlements
  - feature gates
  - usage limits
  - route registry
  - no-export audit
  - feature readiness checklist
  - visual QA checklist
  - broker CSV regression fixture harness
  - module readiness view model
- Added `/platform-readiness`.
- Updated `/` with a Platform Readiness link.
- Exported platform module helpers and types from
  `src/lib/trader-analytics/index.ts`.
- Added focused platform module tests:
  `src/lib/trader-analytics/__tests__/platform-ready-feature-module.test.ts`.
- Focused verification passed:
  `npx vitest run src/lib/trader-analytics/__tests__/platform-ready-feature-module.test.ts`
  with 7 tests.
- TypeScript passed: `npx tsc --noEmit`.
- Full verification passed: `npm run verify:all` with 77 files / 720 tests,
  plus shared-engine, Layer 2, and Layer 3 checkpoints.
- Lint passed with 0 errors and the same 4 pre-existing unrelated warnings.
- Production build passed: `npm run build`.
- Production route smoke passed:
  - `GET /` -> 200
  - `GET /platform-readiness` -> 200
  - `GET /analytics` -> 200
  - `GET /imports` -> 200
  - `GET /review` -> 200
  - `GET /progress` -> 200
  - `GET /import-health` -> 200
  - `GET /admin/broker-mappings` -> 200
  - `GET /account` -> 200
  - `GET /trades/trade-rapid-fire` -> 200

Current implementation status:

- This plan is complete for demo/platform-ready module mode.
- Real auth, billing, production database, and global platform shell remain
  intentionally deferred.
- The app can keep building standalone with demo context and later accept real
  platform context from the larger website.
- No `levels-system` blocker was found, so the shared handoff file did not need
  an update for this pass.
