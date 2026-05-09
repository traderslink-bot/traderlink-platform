# End-User Analytics Product Expansion Plan

Date: 2026-05-02

## Purpose

This file is the working plan for the next end-user product layer on top of
the completed `trader_analytics_report_v1` and `/analytics` prototype.

The product direction is:

- make the app valuable as a place users return to
- keep raw data and export-like affordances out of production end-user routes
- use execution data as the stable first analytics lane
- keep candle, support/resistance, and market-structure analytics separate
  until calibrated
- avoid pretending a real database/auth choice exists before it does

## Non-Negotiable Product Guardrails

- No production JSON, CSV, spreadsheet, or raw-data export controls.
- No production raw payload panels.
- Debug/admin pages may show raw JSON for QA, but must stay clearly labeled.
- User-facing analytics should emphasize saved history, focus items, rules,
  notes, reviews, and in-app drill-downs.
- Execution-only analytics must not require market hours, candles, IBKR,
  support/resistance, or `levels-system`.
- Market context can be displayed only as a separate experimental add-on until
  real saved-trade calibration proves it is useful.

## Product Scope For This Pass

This pass should complete the product-facing shape without choosing a real
backend provider.

In scope:

- production storage readiness contract
- saved report snapshot cards
- import/review inbox model
- weekly review dashboard model
- user rule compliance summary
- behavior streaks
- trade notes and journal prompts
- experimental market-context add-on panel
- production UI sections on `/analytics`
- trade-detail note/journal evidence on `/trades/[tradeId]`
- tests proving no-export posture and market-context isolation

Out of scope until backend/auth decisions exist:

- real database schema migrations
- real authenticated accounts
- billing
- user management
- broker OAuth
- production file upload plumbing
- real persistent note writes

## Architecture Decisions

### Storage

`SavedTraderAnalyticsRepository` remains the read/write boundary. A production
adapter must later enforce:

- authenticated user ownership on every read/write
- account scoping
- server-side persistence
- report snapshot immutability
- no end-user export endpoint
- retention/deletion policy owned by the app

This pass should add readiness checks and UI copy that say the current sample
repository is not production persistence.

### Import Inbox

Imports should land in an in-app review inbox before becoming saved analytics.

Inbox states:

- `ready_to_save`
- `needs_review`
- `rejected`

The inbox should show issues and warnings, but should not expose downloadable
raw input.

### Notes And Journal

Notes live inside saved trades/reports. The user should have prompts and review
areas, but no export controls. This pass can use sample notes and deterministic
prompts until write actions are wired to real storage.

### Weekly Review

Weekly review should summarize:

- completed trades
- gross execution-only P/L
- most repeated risk
- best repeated strength
- primary focus
- rule violations
- streaks
- suggested next review action

### Streaks

Streaks should be behavior-based, not gamified fluff. Useful streaks:

- trades without adverse-price adds
- trades closed to flat
- trades without rapid-fire execution clusters
- trades with decisive full exits

### Market Context

Market context should remain separate and explicitly experimental.

This pass should show readiness state only:

- whether the add-on is enabled for display
- whether calibration is complete
- which market-context sources will eventually feed it
- why it is not used in execution scoring yet

Do not let market context alter trader grades, scoring, rules, streaks, focus
queue, or final execution analytics.

## Phases

### Phase 0: Plan And Resume Tracking

Status: Completed

Tasks:

- [x] `EP-000` Create this roadmap.
- [x] `EP-001` Add the roadmap to the project log.
- [x] `EP-002` Define completion boundaries and stop conditions.

Definition of done:

- this file can be used as the active working plan
- future sessions can resume from this file and `src/docs/codex-project-log.md`

### Phase 1: Product Storage Readiness

Status: Completed

Tasks:

- [x] `EP-010` Add product storage readiness types.
- [x] `EP-011` Add helper that audits the active repository mode.
- [x] `EP-012` Surface readiness state on `/analytics`.
- [x] `EP-013` Test that fixture/in-memory mode is clearly not production
  persistence.

Definition of done:

- production UI can explain whether analytics are sample-backed or persistent
- no code pretends in-memory storage is a real user database

### Phase 2: Import Review Inbox

Status: Completed

Tasks:

- [x] `EP-020` Add import inbox types and builder.
- [x] `EP-021` Convert validation preview items into review inbox items.
- [x] `EP-022` Add inbox summary and issue counts.
- [x] `EP-023` Surface inbox on `/analytics`.
- [x] `EP-024` Test accepted, warning, and rejected rows.

Definition of done:

- a user can see which imported trades would be ready, need review, or be
  rejected before those trades affect analytics
- no raw import export is introduced

### Phase 3: Saved Report Snapshots

Status: Completed

Tasks:

- [x] `EP-030` Add saved snapshot card types.
- [x] `EP-031` Build report snapshot cards from saved reports.
- [x] `EP-032` Surface snapshots on `/analytics`.
- [x] `EP-033` Test ordering and immutable snapshot labels.

Definition of done:

- users can see historical report snapshots inside the app
- snapshots preserve what the system calculated at generation time

### Phase 4: Weekly Review Dashboard

Status: Completed

Tasks:

- [x] `EP-040` Add weekly review view-model types.
- [x] `EP-041` Build weekly review from latest report, focus queue, rules, and
  streaks.
- [x] `EP-042` Surface weekly review on `/analytics`.
- [x] `EP-043` Test summary values and suggested action.

Definition of done:

- `/analytics` has a concise review block that tells the user what to look at
  next

### Phase 5: Behavior Streaks

Status: Completed

Tasks:

- [x] `EP-050` Add behavior streak types.
- [x] `EP-051` Build streaks from report source summaries.
- [x] `EP-052` Surface streak visuals on `/analytics`.
- [x] `EP-053` Test adverse-add, close-to-flat, rapid-fire, and decisive-exit
  streaks.

Definition of done:

- streaks are tied to real execution-feedback facts
- streaks do not depend on candles or market context

### Phase 6: Notes And Journal

Status: Completed

Tasks:

- [x] `EP-060` Add journal prompt types and builder.
- [x] `EP-061` Add useful sample notes to fixture trades/reports.
- [x] `EP-062` Surface prompts on `/analytics`.
- [x] `EP-063` Surface notes and prompts on `/trades/[tradeId]`.
- [x] `EP-064` Test prompt generation and note visibility.

Definition of done:

- the app provides in-app review prompts and visible saved notes
- no note export or raw download exists

### Phase 7: Rule Compliance Summary

Status: Completed

Tasks:

- [x] `EP-070` Add rule compliance summary helper.
- [x] `EP-071` Surface pass/violation totals beyond the existing rule tracker.
- [x] `EP-072` Test summary counts and worst violated rule.

Definition of done:

- user-defined rules become a dashboard summary, not just a list of cards

### Phase 8: Experimental Market-Context Add-On Panel

Status: Completed

Tasks:

- [x] `EP-080` Add market-context add-on status type.
- [x] `EP-081` Build status as disabled/experimental until calibration is
  complete.
- [x] `EP-082` Surface the panel on `/analytics`.
- [x] `EP-083` Test that market context is observational and does not affect
  execution-only analytics.

Definition of done:

- product UI acknowledges future candle/market-structure value without mixing
  it into current execution feedback

### Phase 9: Production UI Polish

Status: Completed

Tasks:

- [x] `EP-090` Add compact visuals for weekly review, streaks, inbox, and
  snapshots.
- [x] `EP-091` Keep layout dense, scan-friendly, and app-like.
- [x] `EP-092` Avoid nested cards, export controls, and raw data copy.
- [x] `EP-093` Smoke test `/analytics` and `/trades/[tradeId]`.

Definition of done:

- the product page feels more like an end-user analytics product and less like
  a debug report

## Verification Ladder

Run focused checks while building:

```bash
npx vitest run src/lib/trader-analytics/__tests__/end-user-product-expansion.test.ts
npx tsc --noEmit
```

Before closing the branch:

```bash
npm run verify:all
npm run build
npm run lint
```

Smoke routes locally after build:

- `GET /analytics`
- `GET /trades/trade-rapid-fire`
- `GET /`

## Stop Conditions

Stop and update this file before proceeding if:

- a real database/auth decision is required
- a feature would expose raw user data outside the app
- a route needs export/download controls
- a market-context feature would influence execution scoring or final
  conclusions before calibration
- a change requires modifying `levels-system`

## Current Status Board

| Phase | Status | Current Pointer |
| --- | --- | --- |
| Phase 0: Plan and resume tracking | Completed | roadmap created |
| Phase 1: Product storage readiness | Completed | storage status on `/analytics` |
| Phase 2: Import review inbox | Completed | import inbox on `/analytics` |
| Phase 3: Saved report snapshots | Completed | snapshot cards on `/analytics` |
| Phase 4: Weekly review dashboard | Completed | weekly review panel on `/analytics` |
| Phase 5: Behavior streaks | Completed | streak visuals on `/analytics` |
| Phase 6: Notes and journal | Completed | prompts on analytics and trade detail |
| Phase 7: Rule compliance summary | Completed | compliance summary on `/analytics` |
| Phase 8: Market-context add-on panel | Completed | separate observational panel |
| Phase 9: Production UI polish | Completed | verified and smoked |

## Current Progress Log

### 2026-05-02

- Created this roadmap from the end-user analytics product ideas.
- Added product expansion contracts and helpers under
  `src/lib/trader-analytics/product/product-expansion.ts`.
- Added production UI sections for storage readiness, import inbox, saved
  snapshots, weekly review, behavior streaks, journal prompts, rule compliance,
  and market-context add-on status.
- Added trade-detail notes and journal prompts.
- Added focused expansion tests:
  `src/lib/trader-analytics/__tests__/end-user-product-expansion.test.ts`.
- Focused verification passed:
  `npx vitest run src/lib/trader-analytics/__tests__/end-user-product-expansion.test.ts`
  with `8` tests and `npx tsc --noEmit`.
- `npm run build` passed and produced `/analytics` and `/trades/[tradeId]`.
- `npm run lint` passed with `0` errors and the same `4` pre-existing warnings.
- Full verification passed:
  `npm run verify:all` with `72` files / `664` tests plus the focused
  shared-engine, Layer 2, and Layer 3 checkpoints.
- Production route smoke passed against `next start` on a local test port:
  - `GET /analytics` returned `200` and rendered `Weekly Review`,
    `Import Review Inbox`, `Storage Status`, and `Behavior Streaks`.
  - `GET /trades/trade-rapid-fire` returned `200` and rendered `Saved Notes`
    and `Journal Prompts`.
  - `GET /` returned `200` and linked to `/analytics`.
- Current implementation pointer: complete.

## Current Best Next Step

The next real product step is choosing authenticated storage and wiring the
repository boundary to it. Until that backend/auth choice is made, the
production UI remains a sample-backed product prototype with explicit storage
readiness blockers.
