# End-User Execution Import And Storage Plan

Date: 2026-05-02

## Purpose

This is the active plan for making the product usable by end users who import
their trade executions from broker CSV files.

This plan is intentionally about execution data only.

Execution import means:

- user buys
- user sells
- symbol/ticker
- timestamp/date/time
- share quantity
- execution price
- order/execution IDs when present

Execution import does not mean:

- candle fetching
- support/resistance generation
- VWAP/EMA calculation
- market-structure reading
- exporting user data out of the app

## User Clarifications Captured

- This app is intended to become an end-user product, not a personal-only tool.
- Users should return to the app to view analytics, reports, notes, and action
  plans.
- Production UX should not encourage users to export raw saved trades or raw
  analytics out of the app.
- IBKR is currently relevant as a candle-data provider through `levels-system`.
- Broker CSV import in this plan is for user trade executions.
- CSV execution imports should support IBKR, Moomoo, Webull, Robinhood, and any
  other popular broker formats that can be handled safely.
- Moomoo/Webull/Robinhood/IBKR CSV import should not move candle ownership into
  this app.
- The future plan/billing model is wanted, but it needs more product planning
  before implementation.
- Onboarding should come later.
- UI-specific language polish should come when the UI import flow is built.
- Notification/reminder features can wait.
- Security/privacy hardening is required later, but it should be planned rather
  than rushed into this code pass.

## Ownership Boundary

`trader-intelligence-v2` owns:

- CSV execution import parsing
- execution normalization into `ProviderExecution`
- grouping executions into `UserTradeAnalysisRequest`
- import preview and validation
- saved execution trades
- saved analytics reports
- review workflows, tags, action plans, notes, and end-user analytics surfaces

`levels-system` owns:

- candle fetching
- candle normalization
- support/resistance engine
- VWAP/EMA
- market structure
- chart-reading logic

This app may ask `levels-system` for market context after an imported execution
trade exists, but imported broker CSV rows should not try to build candle
structure locally.

## Broker Research Notes

These are the source notes used for the current parser contract:

- IBKR activity statement trades include fields such as Symbol, Trade Date /
  Date-Time, Quantity, and Price. IBKR also supports Trade Confirmation Flex
  Queries in CSV format with configurable date/time formats.
  - https://www.ibkrguides.com/reportingreference/reportguide/et_trades.htm
  - https://www.ibkrguides.com/orgportal/performanceandstatements/tradeflex.htm
- Webull officially supports downloading order history into CSV, and that file
  can include filled, partially filled, pending, working, cancelled, and failed
  orders. The importer must skip non-filled rows when status is present.
  - https://www.webull.com/help/faq/992-How-do-I-get-a-copy-of-my-transaction-history
- Robinhood documents CSV transaction history reports for account activity /
  tax reporting that include transaction date/time, transaction type, symbols,
  amount/price details, and fees where applicable.
  - https://robinhood.com/eu/en/support/articles/finding-your-account-documents/
  - https://robinhood.com/us/en/support/articles/tax-documents-faq/
- Moomoo has official order-history screens and API order-history concepts, but
  public exact CSV headers vary by region and export route. Third-party import
  guides confirm desktop trade-history CSV export paths. The importer therefore
  treats Moomoo as observed-header support rather than pretending there is one
  universal official header set.
  - https://www.moomoo.com/us/manual/topic-14-49
  - https://tradesviz.crisp.help/en/article/how-to-import-trades-from-moomoo-to-tradesviz-trading-journal-fiskoh/
  - https://support.portseido.com/export-trades/moomoo/
- Schwab transaction history can be exported to CSV and includes Date, Action,
  Quantity, Symbol, Description, and Price fields. Schwab is included as a
  first extra popular broker because its export documentation is clear enough
  to map safely.
  - https://help.streetsmart.schwab.com/edge/1.40/Content/Transactions.htm
- Fidelity, E*TRADE, Tastytrade, TradeStation, and Thinkorswim/TDA-style
  account statement samples are represented in the fixture pack through the
  generic execution CSV mapper. They are not promoted to first-class broker keys
  yet because the app should not pretend one universal official header set is
  guaranteed without real redacted user samples or stronger official field
  contracts.

## Current Implementation

Status: Implemented and verified.

Files:

- `src/lib/execution-sources/csv/broker-execution-csv-import.ts`
- `src/lib/execution-sources/csv/index.ts`
- `src/lib/trader-analytics/product/import-preview.ts`
- `src/lib/trader-analytics/product/import-diagnostics.ts`
- `src/lib/trader-analytics/product/types.ts`
- `src/lib/trader-analytics/product/productization.ts`
- `src/lib/trader-analytics/index.ts`
- `src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts`
- `src/docs/trade-execution-import-fixtures/*.csv`
- `src/docs/end-user-database-schema-plan.md`

Public parser:

```ts
import { parseBrokerExecutionCsv } from "@/src/lib/execution-sources/csv";

const result = parseBrokerExecutionCsv({
  broker: "webull_order_history",
  csvText,
  defaultSessionBucket: "unknown",
});
```

Product preview wrapper:

```ts
import { previewBrokerExecutionCsvImport } from "@/src/lib/trader-analytics";

const preview = previewBrokerExecutionCsvImport({
  broker: "generic_execution_csv",
  csvText,
});
```

Supported broker keys:

- `auto`
- `ibkr_activity_statement`
- `moomoo_trade_history`
- `webull_order_history`
- `robinhood_transaction_history`
- `schwab_transactions`
- `generic_execution_csv`

Output contract:

- `contractVersion: broker_execution_csv_import_v1`
- resolved broker key and label
- header confidence:
  - `official`
  - `observed`
  - `best_effort`
- non-security `fileFingerprint` for same-file duplicate detection
- row counts
- accepted execution count
- rejected row count
- skipped row count
- per-request fingerprints for saved-trade duplicate detection
- diagnostics:
  - requested broker
  - resolved broker
  - timestamp timezone
  - options handling mode
  - header row number
  - detected columns
  - missing required fields
  - row outcomes
  - issue counts by code
  - duplicate request fingerprint groups
  - mapping confidence
  - trade grouping diagnostics
  - broker notes
- normalized `ProviderExecution[]`
- grouped `UserTradeAnalysisRequest[]`
- structured issues for import warnings/errors
- product diagnostics from the preview wrapper:
  - repair workflow
  - import summary cards
  - net P/L preview
  - P/L reconciliation
  - commit plan
  - mapping learning signal
  - options quarantine
  - import review dashboard model
  - grouping diagnostics for review

## Parser Behavior

The parser:

- supports quoted CSV cells and CRLF/LF newlines
- strips BOM from the first header
- normalizes headers by lowercasing and removing punctuation
- maps broker-specific aliases into canonical fields
- accepts timestamp, or date plus time
- accepts explicit column mapping overrides for unknown broker CSV headers
- accepts an optional `timestampTimezone` so broker-local CSV timestamps can be
  converted into UTC ISO timestamps before trade grouping
- falls back to UTC with a warning if the supplied timezone is not supported by
  the runtime
- accepts signed quantity when side is absent
- normalizes side into `buy` or `sell`
- normalizes symbol to uppercase
- strips currency symbols, commas, and parentheses from numbers
- skips non-trade rows such as dividends/transfers/fees
- skips non-filled Webull-style rows when status is present
- captures optional `commission`, `fees`, `netAmount`, and `currency` fields on
  imported executions when present
- builds a net P/L preview:
  - uses broker-provided `netAmount` when present on every execution in the
    grouped trade
  - otherwise estimates closed-trade net P/L from gross cash flow minus known
    commissions and fees
  - marks open trades or incomplete cost data as insufficient rather than
    pretending the number is final
- rejects options rows by default so stock analytics do not accidentally read
  option contracts as stock symbols
- can be configured with `optionsHandling: "skip"` or `"allow"` for future
  workflows, though stock analytics still should not treat options as fully
  supported yet
- keeps broker source labels on normalized executions
- groups executions by symbol and lifecycle
- returns grouping diagnostics so the future UI can explain whether each grouped
  trade closed at flat, remains open, or was split because one execution crossed
  through flat
- accepts optional grouping safety rules:
  - max time gap before splitting a still-open symbol sequence
  - split at session/date boundary
- splits over-reducing executions into closed trade plus new opposite-direction
  trade when one row crosses through flat
- validates generated requests through
  `validateTradeAnalysisRequest(...)`
- leaves request `provider` unset so broker import source does not become the
  candle provider
- returns a deterministic file fingerprint so the storage layer can flag the
  same raw CSV being uploaded again
- returns deterministic trade-request fingerprints so the app can identify
  saved-trade duplicates and same-batch duplicates without comparing raw files
- returns a mapping confidence score so the future UI can tell the user when a
  broker mapping should be reviewed before saving

## Current Product Hardening Pass: Steps 1 To 8

### Step 1: Import Repair Workflow

Status: Implemented

What now exists:

- product repair items are built from parser issues
- error issues become `fix_required`
- warning issues become `review`
- auto-detected format notices can become `info`
- repair action kinds include:
  - edit row field
  - choose timezone
  - choose options handling
  - skip row
  - skip duplicate
  - review broker mapping
  - review trade grouping

Purpose:

- the future import UI can show exactly what needs fixing before saving
- malformed rows can be repaired or skipped inside the app
- duplicate and grouping concerns are handled as review decisions, not silent
  parser behavior

### Step 2: Database Schema Plan

Status: Implemented as a detailed plan

File:

```text
src/docs/end-user-database-schema-plan.md
```

The plan covers:

- workspaces
- users
- workspace memberships
- trading accounts
- import batches
- import rows
- import issues
- import repair items
- normalized executions
- saved trades
- saved trade executions
- trade grouping diagnostics
- analysis jobs
- execution feedback summaries
- full trade-analysis summaries
- trader analytics reports
- notes
- review items
- rules
- action plan items
- market-context calibration tables

Important stance:

- this does not choose a database vendor
- this does not add user-facing export functionality
- fingerprints are internal reconciliation keys
- raw CSV retention remains a deliberate future privacy/product decision

### Step 3: Account Timezone Defaults

Status: Implemented

What changed:

- `TraderWorkspaceAccount` now carries `timezone`
- `TraderWorkspaceSummary` now exposes `accountTimezone`
- sample workspace account defaults to `America/New_York`
- `previewBrokerExecutionCsvImport(...)` accepts `accountTimezone`
- if `timestampTimezone` is not passed, the CSV preview uses
  `accountTimezone`

Why it matters:

- broker CSV timestamps are often local account timestamps
- the app should convert them to UTC ISO timestamps before trade grouping
- future users should not have to understand UTC manually during import

### Step 4: Net P/L Path

Status: Implemented as preview diagnostics

What exists:

- `buildBrokerCsvNetPnlPreview(...)`
- per-trade gross cash flow
- total commission
- total fees
- total costs
- broker net amount total when present
- estimated net P/L when enough closed-trade data exists
- source labeling:
  - `broker_net_amount`
  - `gross_minus_costs`
  - `insufficient_data`

Important limitation:

- this is a preview path, not final accounting
- real production P/L still needs storage, broker calibration, and possible
  corporate-action/adjustment handling later

### Step 5: Broker Mapping Confidence

Status: Implemented

What exists:

- `mappingConfidence.level`
- `mappingConfidence.score`
- required field count
- matched required field count
- detected column count
- human-readable reasons

Purpose:

- high-confidence broker mappings can move smoothly through preview
- medium/low confidence mappings can ask the user to review columns before
  saving
- generic imports are honestly labeled as best effort

### Step 6: Import Summary Cards

Status: Implemented as data contract

Cards now built by the product diagnostics helper:

- rows
- grouped trades
- mapping confidence
- timezone
- fees
- duplicates
- options

Purpose:

- future UI can show a compact import health summary without reinterpreting raw
  parser internals
- the product can stay in-app and preview-focused instead of offering exported
  files

### Step 7: CSV Fixture Pack Expansion

Status: Implemented as representative fixtures

Added fixture samples for:

- Fidelity account history style
- E*TRADE transactions style
- Tastytrade transactions style
- TradeStation trade history style
- Thinkorswim/TDA account statement style

Important caution:

- these parse through `generic_execution_csv`
- they are representative fixtures, not a promise that every broker export
  variant from those brokers will work without real samples
- promote a broker to a first-class key only after official field contracts or
  real redacted user samples prove the mapping

### Step 8: Trade Grouping Review Diagnostics

Status: Implemented

Diagnostics now describe:

- request index
- symbol
- trade direction
- lifecycle status
- grouping reason
- source row indexes
- execution count
- first and last timestamps
- final position shares
- notes

Grouping reasons:

- `flat_position`
- `end_of_symbol`
- `over_reduction_split`

Purpose:

- the future UI can explain why executions became one trade or multiple trades
- open imports can be reviewed before saving
- over-reducing executions are no longer mysterious when the importer splits
  them into separate lifecycle trades

## Follow-Up Product Hardening Pass: Steps 1 To 10

Status: Implemented

This pass turns the next useful ideas into contracts and focused coverage.

### Step 1: CSV Column Mapping Wizard Contract

Implemented:

- `parseBrokerExecutionCsv(...)` accepts `columnMapping`.
- The mapping uses canonical fields such as:
  - `symbol`
  - `timestamp`
  - `date`
  - `time`
  - `side`
  - `quantity`
  - `price`
  - `commission`
  - `fees`
  - `netAmount`
  - `currency`
- Mapped headers participate in header-row detection, missing-column checks,
  detected-column diagnostics, and row parsing.

Purpose:

- the future UI can let users map unknown broker CSV columns without requiring a
  new first-class broker parser every time.

### Step 2: Import Commit Pipeline Contract

Implemented:

- product diagnostics now include `commitPlan`.
- The plan models:
  - create import batch
  - save rows and issues
  - save normalized executions
  - save grouped trades
  - queue execution analysis
  - request market context later through `levels-system`
- The plan reports:
  - `ready_to_commit`
  - `needs_user_review`
  - `blocked`

Purpose:

- the future persistence/UI layer has a preview -> repair -> confirm -> save ->
  analyze sequence without saving bad rows accidentally.

### Step 3: P/L Reconciliation Check

Implemented:

- product diagnostics now include `pnlReconciliation`.
- The reconciliation compares broker-provided net amount against gross cash flow
  minus known commissions/fees.
- Mismatches create a `review_pnl_reconciliation` repair item.

Purpose:

- the app can tell when broker net amount and app-calculated cost-adjusted P/L
  disagree before treating net P/L as final.

### Step 4: Account Settings Contract

Implemented:

- `TraderWorkspaceAccount` now carries:
  - base currency
  - default broker
  - supported asset classes
  - import defaults
  - commission handling mode
- `TraderWorkspaceSummary` now exposes account base currency.

Purpose:

- account timezone, asset-class support, broker defaults, and commission
  handling become stable product settings instead of hidden assumptions.

### Step 5: Unknown Broker Learning Queue

Implemented:

- product diagnostics now include `mappingLearningSignal`.
- The signal captures:
  - whether the mapping should be reviewed
  - broker key
  - confidence score/level
  - header fingerprint
  - headers
  - detected fields
  - missing required fields
  - issue codes

Purpose:

- generic/low-confidence imports can be reviewed later to decide whether a
  broker deserves first-class support.

### Step 6: Analysis Confidence Badges

Implemented:

- `buildAnalysisConfidenceBadges(...)` creates badges for:
  - execution-only
  - execution plus levels
  - observational market structure
  - fully calibrated market context
- Experimental market structure remains hidden from scoring by default.

Purpose:

- end users can eventually understand what kind of evidence a report is based
  on without overstating uncalibrated market structure.

### Step 7: Options Quarantine Lane

Implemented:

- product diagnostics now include `optionsQuarantine`.
- Options rows are counted as rejected, skipped, or allowed based on import
  settings.

Purpose:

- options rows do not pollute stock analytics, but they are still visible as a
  future workflow lane.

### Step 8: Import Review Dashboard Model

Implemented:

- product diagnostics now include `reviewDashboard`.
- The dashboard model bundles:
  - summary cards
  - repair workflow
  - grouped trade reviews
  - row outcomes
  - P/L reconciliation
  - options quarantine
  - next action

Purpose:

- the future UI can render a full import review screen without rebuilding
  business logic in React components.

### Step 9: Retention And Delete Policy Contract

Implemented:

- `buildDefaultProductDataRetentionPolicy(...)` returns a no-export product
  policy.
- The policy defaults to:
  - no raw CSV retention
  - temporary raw row retention
  - normalized executions/reports retained until account deletion
  - no user-facing export
  - in-app delete actions for import batch, saved trade, and trading account

Purpose:

- the product stance is explicit: users can delete data in-app, but production
  UX should not add raw CSV/JSON/spreadsheet export controls.

### Step 10: Trade Grouping Safety Rules

Implemented:

- `parseBrokerExecutionCsv(...)` accepts `tradeGroupingRules`.
- Rules currently support:
  - `maxGapMinutes`
  - `splitAtSessionBoundary`
- New grouping diagnostics/issue codes explain safety splits.

Purpose:

- the app can avoid accidentally grouping separate trades in the same ticker
  when the user held partial shares across a large time gap or session boundary.

## Do-Now Work Completed In This Branch

### Step 1: Document The Execution Import Roadmap

Status: Completed

Tasks:

- [x] Capture user clarifications.
- [x] Separate execution-import ownership from candle/market-structure ownership.
- [x] Record which product ideas are do-now and which are later.
- [x] Record broker-source research links and confidence notes.

### Step 2: Add Broker CSV Execution Parser

Status: Completed

Tasks:

- [x] Add broker format keys.
- [x] Add broker header aliases.
- [x] Add resilient CSV parser.
- [x] Add numeric parsing for broker-formatted values.
- [x] Add timestamp parsing for common broker date/time shapes.
- [x] Add side parsing from side/action/type text.
- [x] Add signed-quantity side inference.
- [x] Add filled-status filtering for Webull-style order exports.
- [x] Add non-trade row skipping for dividends, fees, transfers, and interest.

### Step 3: Convert CSV Rows Into App Trade Requests

Status: Completed

Tasks:

- [x] Map parsed rows into `ProviderExecution`.
- [x] Group executions into `UserTradeAnalysisRequest`.
- [x] Preserve long/short lifecycle direction.
- [x] Support multi-entry, partial exit, and round-trip grouping.
- [x] Split over-reducing rows when one execution crosses through flat.
- [x] Use `sessionBucket: unknown` until UI/user rules provide a better value.
- [x] Validate generated requests through the existing request contract.
- [x] Keep candle provider options unset.

### Step 4: Connect CSV Import To Existing Import Preview

Status: Completed

Tasks:

- [x] Add `previewBrokerExecutionCsvImport(...)`.
- [x] Return both broker import result and saved-trade import preview.
- [x] Export the helper from `src/lib/trader-analytics/index.ts`.
- [x] Keep output inside app/product helper contracts.
- [x] Do not add user export/download controls.

### Step 5: Add Broker Fixtures And Tests

Status: Completed

Tasks:

- [x] Add representative CSV fixtures for:
  - IBKR
  - Moomoo
  - Webull
  - Robinhood
  - Schwab
  - generic execution CSV
- [x] Test each supported first-class broker mapper.
- [x] Test generic short trade import.
- [x] Test auto-detection.
- [x] Test skipped non-filled/non-trade rows.
- [x] Test rejected malformed rows.
- [x] Test over-reduction split behavior.
- [x] Test saved-trade import preview integration.

## Later Product Work

### Later A: Real Persistent Storage

Status: Planned, schema contract drafted

This is needed for the real end-user product, but it should not be faked in the
CSV parser.

Detailed schema contract:

```text
src/docs/end-user-database-schema-plan.md
```

Future storage should save:

- workspaces
- users
- accounts
- import batches
- import file fingerprints
- imported source files or file fingerprints, depending on retention policy
- normalized executions
- grouped saved trades
- validation issues
- analysis jobs
- generated execution-feedback summaries
- generated trader analytics reports
- notes
- review states
- rule/action-plan state

Recommended schema direction:

- `workspaces`
- `users`
- `trading_accounts`
- `import_batches`
- `import_rows`
- `executions`
- `saved_trades`
- `trade_analysis_jobs`
- `execution_feedback_summaries`
- `trader_analytics_reports`
- `report_notes`
- `trade_notes`
- `review_items`
- `rules`
- `action_plan_items`

Duplicate handling rules:

- Store `fileFingerprint` on each import batch.
- If a new upload has a previously stored `fileFingerprint`, show an in-app
  warning before saving anything.
- Store each grouped trade's request fingerprint.
- If a new grouped trade fingerprint matches an existing saved trade, mark the
  row as duplicate.
- If a grouped trade fingerprint appears more than once in the same import
  preview, mark the later rows as same-batch duplicates.
- Do not expose fingerprints as a user-facing export. They are internal
  reconciliation keys.

Important product stance:

- imports are allowed
- production exports are not part of the end-user UX
- raw JSON/file downloads should stay admin/debug-only unless the business
  deliberately changes this rule later

### Later B: Auth Provider Comparison

Status: Parked

The auth-provider comparison may not be needed yet. Do not spend build time on
this until the app is ready to choose real persistence and deployment.

When it becomes needed, compare:

- hosted auth/dashboard workflow
- organization/workspace support
- row-level permission support
- billing integration fit
- audit-log support
- data residency constraints

### Later C: Import UI

Status: Planned For UI Pass

Future UI should include:

- broker picker
- CSV file drop zone
- import preview table
- row-level error messages
- accepted/rejected counts
- duplicate detection
- "fix and retry" flow
- saved-trade confirmation
- no export/download controls

The UI copy should make clear:

- CSV is for executions
- market context is added later through `levels-system`
- unsupported rows can be skipped or rejected
- users should not edit broker exports unless they are using the generic
  template intentionally

### Later D: Onboarding

Status: Later

Onboarding should wait until the import UI exists.

Expected onboarding steps:

- create workspace
- create trading account
- choose import method
- upload CSV
- review import preview
- save accepted trades
- run first analytics report
- review first focus item

### Later E: Billing / Plans

Status: Needs More Planning

The user wants plan differentiation, but the packaging is not decided.

Possible future plan boundaries:

- number of imported trades per month
- number of connected accounts
- analytics history depth
- advanced review workflows
- market-context add-on after calibration
- team/admin features
- premium coaching/report views

Important caution:

- Do not prematurely hard-code billing gates in parser or analysis logic.
- Keep plan boundaries as product configuration around workflows.

### Later F: Notifications And Reminders

Status: Later

Useful later, not now.

Potential reminders:

- weekly review ready
- import has rejected rows
- action plan review due
- rule violation streak detected
- market-context calibration needs review

### Later G: UI Language Polish

Status: Later, With UI

Needed for the product, but best handled when the real import and analytics UI
is being built.

Target tone:

- clear
- trader-friendly
- not over-promising
- honest about execution-only vs market-context feedback
- no raw technical contract language in production user views

### Later H: Security, Privacy, And Retention

Status: Required Later

This needs focused planning before production.

Required decisions:

- whether raw uploaded CSV files are stored or discarded after normalization
- whether file fingerprints are stored for duplicate detection
- how long raw import rows are retained
- how users delete account data inside the app
- audit logging for imports and deletions
- admin/support access limits
- encryption and secret-management requirements
- production route access control

### Later I: Broker Expansion

Status: Add When Real Samples Exist

Schwab has first-class support now because the public CSV/export documentation
is clear enough.

Additional brokers should be promoted from generic to first-class only when we
have either:

- official field documentation, or
- real redacted user sample files, or
- enough reliable import failures to justify a specific mapper

Potential next brokers:

- Fidelity
- E*TRADE
- TradeStation
- Tastytrade
- TradeZero
- Thinkorswim/TDA legacy exports where still relevant

## Stop Conditions

Stop and update this file before continuing if:

- a parser change would treat a broker as a candle provider
- a parser change would create market-structure data locally
- a broker format cannot be supported without a real redacted sample file
- a UI change would add export/download controls for saved user data
- real persistence/auth choices become necessary
- `levels-system` changes are required

## Verification Plan

Focused checks:

```bash
npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts
npx tsc --noEmit
```

Full checks:

```bash
npm run verify:all
npm run build
npm run lint
```

## Current Progress Log

### 2026-05-02

- Created this plan.
- Added broker CSV execution parser and export boundary.
- Added import-preview wrapper for parsed CSV requests.
- Added broker sample CSV fixtures.
- Added focused broker import tests.
- Added import diagnostics:
  - detected columns
  - header row number
  - row outcomes
  - issue counts by code
  - duplicate request fingerprint groups
- Added non-security CSV file fingerprints and trade request fingerprints.
- Added same-file duplicate preview support through
  `existingFileFingerprints`.
- Added same-batch duplicate trade reconciliation.
- Added timezone-aware timestamp parsing:
  - default remains UTC for compatibility
  - callers can pass account/broker timezone such as `America/New_York`
  - diagnostics report the effective timezone
- Added optional fee/commission capture:
  - `commission`
  - `fees`
  - `netAmount`
  - `currency`
- Added options-row guardrails:
  - default `optionsHandling: reject`
  - optional `skip`
  - optional `allow` for future non-stock workflows
- Added import repair workflow data:
  - row-field fixes
  - timezone selection
  - options handling
  - duplicate skipping
  - broker mapping review
  - trade grouping review
- Added mapping confidence:
  - confidence level
  - score
  - detected/matched required fields
  - explanatory reasons
- Added import summary cards for future UI:
  - rows
  - grouped trades
  - confidence
  - timezone
  - fees
  - duplicates
  - options
- Added net P/L preview:
  - broker net amount source
  - gross minus known costs source
  - insufficient-data source for open/incomplete cases
- Added grouping diagnostics for closed, open, and over-reduction-split groups.
- Fixed over-reduction diagnostics so the closing split is reported as flat
  instead of incorrectly carrying the pre-flush open share count.
- Added account timezone defaults in the workspace/account product contract.
- Added representative generic fixture coverage for:
  - Fidelity
  - E*TRADE
  - Tastytrade
  - TradeStation
  - Thinkorswim/TDA-style account statement exports
- Added detailed database schema plan:
  `src/docs/end-user-database-schema-plan.md`.
- Added explicit column mapping support for unknown broker CSV headers.
- Added optional trade grouping safety rules:
  - max gap minutes
  - split at session/date boundary
- Added import commit plan contract.
- Added broker/app P/L reconciliation with mismatch repair items.
- Added mapping learning signal for generic or low-confidence broker imports.
- Added options quarantine contract.
- Added import review dashboard model.
- Added account settings fields for base currency, default broker, supported
  asset classes, import defaults, and commission handling.
- Added analysis confidence badges and default no-export retention/delete
  policy in the productization layer.
- Focused CSV import verification passed:
  `npx vitest run src/lib/execution-sources/csv/__tests__/broker-execution-csv-import.test.ts`
  with 25 tests.
- Focused productization verification passed:
  `npx vitest run src/lib/trader-analytics/__tests__/end-user-productization.test.ts`
  with 11 tests.
- TypeScript passed: `npx tsc --noEmit`.
- Lint passed with 0 errors and the same 4 pre-existing unrelated warnings.
- Full verification passed: `npm run verify:all` with 74 files / 700 tests,
  plus shared-engine, Layer 2, and Layer 3 checkpoints.
- Production build passed: `npm run build`.
- Production route smoke passed:
  - `GET /` -> 200
  - `GET /analytics` -> 200
  - `GET /trades/trade-rapid-fire` -> 200
