# Journal Review Workflow Corrections Progress

**Status:** Active. Corrections 0-7 remain technically verified. Corrections 8
 and 9 are planned from owner review feedback. Correction 11 is implemented
locally for the Daily Trade Tracker's one-day review workflow and awaits owner
visual review.

**Plan:** [Journal Review Workflow Corrections Plan](journal-review-workflow-corrections-plan.md)

**Current focused work:** [Cooldown After Loss Rule Progress](cooldown-after-loss-rule-progress.md)

## 2026-08-05 Workspace review summary

**Status:** Implemented locally; focused verification in progress.

- Workspace reads the selected account's latest saved **Current Focuses** value
  as of the current Eastern trading date. The card is intentionally absent when
  the trader has not saved a focus note.
- Active focus rules appear with their normal titles and rule scope.
- Workspace shows the most recent completed review before the current Eastern
  trading date. It keeps the display compact while naming each followed or
  broken day/trade rule beside the factual trade result. Full notes, tags and
  execution detail remain in Daily Trade Tracker.
- The future AI Reviews card is deferred until issued reviews have persistent
  storage. Workspace will not fabricate a review or show an empty placeholder.

## 2026-08-05 Current Focuses

**Status:** Implemented locally; owner visual review complete; focused verification deferred.

- The Daily Trade Tracker now calls the former visible Tomorrow's focus field
  **Current Focuses**.
- The selected account's latest saved non-empty focus carries to later Daily
  Tracker dates. Editing and saving it remains an immutable daily-note
  revision, so future weekly AI reviews can receive every focus version active
  through Friday rather than only the final wording.
- This change reuses existing account-scoped, versioned Journal note history;
  it does not add another execution, note or AI store.

## 2026-08-05 Cooldown after a loss

**Status:** Implemented locally; owner visual review and focused verification
pending.

- The owner approved the visible statement: “Wait after a completed losing
  trade before entering another Day trade.”
- The trader chooses the wait time; the Rules library and add-rule form do not
  suggest a duration.
- Automatic results will be calculated only from eligible completed Day trades:
  Followed, Broken or N/A for the affected trade when required facts are
  unavailable.
- No test suite ran during this design-first pass, at the owner’s direction.

## 2026-08-04 Factual Day-trade analytics classification

**Status:** Implemented locally; focused verification pending under the
active owner-review testing cadence.

- A ready-closed round trip is classified as a Day trade only when its opening
  and final closing executions share the account's trading date. All other
  completed round trips are Multi-day trades.
- The classification is separate from trader-authored Swing/Bag holding intent.
- Analytics Lab now provides a direct Day-trades-only filter. Analytics
  evidence rows include the same factual classification.

## 2026-08-04 Daily Trade Tracker presentation cleanup

**Status:** Implemented locally; owner visual review pending.

- Each completed trade card now owns its factual executions and their manual
  Edit action. The standalone execution list is removed.
- Within each trade card, Rules appear before the unchanged editable execution
  panel.
- A desktop trade card uses a two-column layout: trade details, tags, rules and
  executions on the left; one tall Trade notes field on the right.
- The tracker no longer renders the carried-position panel or Data Decisions
  notices. Data Decisions remain available from their dedicated surface.
- Price display preserves two decimal places when a stored price such as `0.3`
  represents a trading price of `0.30`.
- Technical notes and the ticker-level Long/Short aggregate are removed. Trade
  direction is shown only on its individual trade.
- A trader with no custom rules sees “You have no custom rules set up.” rather
  than disabled selectors. Preset outcomes remain absent until an actual
  Followed or Broken result exists.
- Manual entry now plainly asks for one day of Day Trade executions, shows a
  prominent Eastern Time reminder under its title and labels every time field
  accordingly. Redundant technical guidance and the decimal-display note are
  removed; no daily-note field is singled out as optional.
- The local `/trade-tracker` page returned HTTP 200 after the change. No test
  suite was run during the active owner review.

### Rule-result card layout

- On desktop, each trade card places the compact trade/P&L summary beside a
  full stacked preset-rule list, so every Followed, Broken or N/A outcome is
  visible without choosing a rule from a selector. Custom rules retain their
  editable selector below the preset list.
- On mobile, the card initially shows a compact followed/broken summary;
  tapping Rules expands the full preset and custom-rule detail.

## 2026-08-04 Daily Trade Tracker one-day review workflow

**Status:** Implemented locally; owner visual review pending.

- A manual Day Tracker submission is permitted for any entered date but must
  contain executions from exactly one Eastern Time trading date. A mixed-date
  submission is rejected without selecting a first-row date or discarding the
  trader's form.
- Execution saving remains separate from day-review completion. The only final
  action is Mark day reviewed; an unmarked day is simply incomplete. Marking a
  day reviewed automatically saves pending trade and daily notes; saved
  annotations stay editable afterward.
- An open manual position is valid execution activity. It must be classified as
  Swing, Long-term hold or Bag holding before the trader marks that date
  Reviewed.
- One-time weekly/monthly AI reviews use the resulting Reviewed state at run
  time, ignore incomplete/unreviewed dates and do not revise an already issued
  review after later Journal edits.
- The local database migration `0022_journal_trading_day_reviews` creates only
  account-scoped review state/history tables. It was applied to the local
  development database without changing executions, statements, notes or tags.
- A focused local `/trade-tracker` refresh returned HTTP 200 after the change.
  No test suite was run during active owner review.

## 2026-08-04 Open-position and Swing Tracker consolidation

**Status:** Owner-approved; implementation active.

- Daily Tracker open positions will use the ticker-card layout and a prominent
  Open position label, without displaying the internal Day trade still open
  classification label.
- Active Swing journaling will be consolidated into the Swing Tracker main
  page. Its prior standalone detail page will become a compatibility redirect.
- Non-Swing open positions retain their factual execution/annotation workflow
  in Daily Tracker; Swing notes, tags and rules are not duplicated there.

## 2026-08-04 Automatic preset Rules

**Status:** Implemented locally; focused lint passed on 2026-08-04.

- The owner approved three visible preset groups: Trade rules, Trade + day
  rules and Day rules.
- Presets evaluate eligible confirmed Day trades only; Swing rules remain
  explicitly out of scope.
- The implementation replaces manual preset review controls with calculated
  Followed/Broken/N/A outcomes and preserves custom-rule review controls.
- The catalog removes the four permanently retired presets, adds daily realized
  gain limit, and evaluates rules from the beginning of their activation date
  in the account trading timezone. Earlier dates remain N/A.
- Weighted-average entry price is the approved entry-price definition.
- The evaluator reads the current confirmed Journal facts for the selected Day
  Tracker date. Its result is recalculated after factual corrections rather
  than copied into a manual preset-review record; custom-rule reviews remain
  persisted and trader-authored.
- A file-scoped lint pass completed for the evaluator, Rules page, Day Tracker
  data/UI/types and rule-review route. No broad test suite, full typecheck or
  production build ran during active owner review.

## Accepted correction boundary

- Remove redundant confirmation for deterministic manual trades while retaining
  server preview, validation, idempotency and conflict questions.
- Add immutable versioned editing for saved manual executions.
- Give Day and Swing Trackers distinct lifecycle ownership over one ledger.
- Fix the complete parameterized Trading Rules catalog.
- Add categorized preset tags while preserving custom account-scoped tags.
- Simplify Data Decisions with server-authored questions and progressive detail.
- Make repeated coverage notices dismissible without hiding decisions.
- Add notes/tags/rules indicators to Calendar ticker activity.
- Keep a completed round trip separate from a later open position in the same
  ticker when Data Decisions present statement evidence.
- Make Data Decisions repair-first: show the actual imported row, let the
  trader correct it to their broker statement, and reserve exclusion for rare
  evidence problems rather than ordinary repair.
- Provide Statement details, Statement issues and Trades needing a decision as
  connected views over the same preserved source evidence.
- Permanently retire four owner-rejected Trading Rules presets and add the
  planned daily realized-gain-limit preset without using unrealized or guessed
  P/L.

## Audit evidence

- [x] The navigation currently marks both `/trade-tracker` and its nested Swing
  route active because prefix matching does not choose the most-specific route.
- [x] The ordinary manual UI exposes internal relationship/style values and asks
  for a completeness confirmation even when the preview is deterministic.
- [x] The existing “Add or correct executions” control starts a new batch instead
  of versioning a saved execution; saved rows have no Edit control.
- [x] Day Tracker duplicates full active-Swing lifecycle cards that already
  belong to Swing Tracker.
- [x] “Planned from entry” appears in Swing and reclassification UI even though
  Swing entry already expresses that intent.
- [x] All parameterized rule presets use camelCase configuration keys while the
  generic validator rejects uppercase letters. The empty-configuration preset
  succeeds, matching owner observation.
- [x] The current tag chooser supports only custom persisted tags; there is no
  preset catalog/category model.
- [x] Data Decisions expand all evidence/actions and show long implementation
  copy for every card.
- [x] Repeated coverage alerts have no persistent dismissal.
- [x] Calendar ticker rows contain P/L only and the Calendar read model has no
  Journal annotation summary.
- [x] The integrity contract contains one stale clause that creates a routine
  decision for every manual trading date, contradicting the accepted Tracker
  plan and owner intent.
- [x] The current screen can show accepted executions without the flagged
  imported row that caused the issue, making a row repair hard to understand.
- [x] The current open-position card exposes technical position-fact controls
  rather than practical open, closed-with-missing-executions or repair-this-row
  choices.
- [x] Same valid execution timestamps currently create an ordering issue even
  when preserved broker row order supplies a deterministic sequence.
- [x] The current preset catalog still includes four owner-rejected behavioral
  rules and does not yet include a daily realized-gain-limit rule.

## QA decisions

- [x] Preserve the preview as a server integrity step; remove it as a mandatory
  user ceremony when the result is deterministic.
- [x] Use append-only execution correction and chain rebuild; never update/delete
  the original evidence row.
- [x] Keep factual Swing fills visible by date while moving Swing lifecycle cards
  exclusively to Swing Tracker.
- [x] Preserve stored style-plan provenance but remove unhelpful visible wording.
- [x] Validate each rule template rather than weakening validation globally.
- [x] Use a versioned code catalog for preset tags and create selected presets in
  the selected account only.
- [x] Derive Data Decision questions and Calendar annotation relationships on the
  server.
- [x] Persist notice dismissal by account/surface/evidence digest without raw
  identifiers.
- [x] Revise the next Data Decisions slice so notice dismissal is account-wide
  across Journal and Analytics surfaces, while the unresolved navigation badge
  remains visible.
- [x] Treat an exact statement re-upload as idempotent; use trader review only
  for genuine near-duplicate or conflicting evidence.
- [x] Do not reintroduce the retired size-reduction, selected-direction,
  skip-after-outcome or wait-after-loss presets through later catalog ideation
  without a new explicit owner decision.

## Implementation checklist

- [x] Correction 0: documents and contracts
- [x] Correction 1: Tracker capture and ownership
- [x] Correction 2: versioned manual editing
- [x] Correction 3: Trading Rules catalog
- [x] Correction 4: tags and Swing annotations
- [x] Correction 5: Data Decisions and dismissible notices
- [x] Correction 6: Calendar annotations
- [x] Correction 7: focused/integrated verification and owner review readiness
- [ ] Correction 8: scoped open-position decision flow
- [ ] Correction 9: statement repair and review information architecture
- [ ] Correction 10: Trading Rules catalog revision

## Implemented evidence

- Deterministic Day/Swing captures retain server preview and validation but save
  without the redundant confirmation screen or internal relationship labels.
- Day and Swing execution histories use one shared editor. A correction appends
  evidence and an execution version, rebuilds affected chains, invalidates the
  stale edit reference and remains unavailable across Journal accounts or while
  broker reconciliation is pending.
- A focused correction test proves the rebuilt trade retains its stable round-trip
  identity and saved tag assignment.
- All rule templates use template-specific validation and their complete
  lifecycle passes in the annotation service suite.
- The code-owned categorized preset catalog is shared by Day and Swing; custom
  account tags remain available. Swing saves use its opaque position reference,
  which the server resolves to the account-scoped annotation target.
- Data Decision cards are collapsed by default, lead with a direct server-derived
  question and no longer show the long implementation paragraph. Repeated
  coverage notices are dismissible by account, surface and current decision
  digest without storing raw decision IDs.
- Calendar Week, Month and day detail views receive server-composed notes, rules
  and tags counts for the exact represented round trips. Dated Swing notes also
  create activity on their actual review date without inventing a closed trade
  or realized P/L.
- Focused ESLint passes. Four one-worker test files pass with 17 tests, including
  stable-annotation retention after a saved-manual correction. Whole-project
  TypeScript passes with incremental output disabled. Full lint passes with zero
  errors and 18 pre-existing warnings. The 165-file active replacement static
  guard and `git diff --check` pass using the local Node user-info workaround
  after Windows reported `ENOMEM` before project code.
- The final production build validates the Academy registry, compiles, completes
  TypeScript and generates all 126 routes.
- A fresh protected-port browser pass returns HTTP 200 with no page errors or
  framework error overlay for Workspace, Day Tracker, Swing Tracker and its
  position detail, Data Decisions, Trading Rules and Calendar Week. It verifies
  the deterministic save copy, shared Edit controls, single active Tracker nav,
  removed planning copy, all seven preset-tag categories plus custom creation,
  progressive Data Decisions and persistent notice dismissal. The current
  private development facts contain no applicable Calendar annotation chip, so
  that exact non-empty visual state remains for owner/use-data review; its
  server aggregation, TypeScript and production-build paths pass.

## Current runtime and Git boundary

- Replacement repository: `C:\Users\jerac\Documents\TraderLink\traderlink-platform`
- Branch: `codex/traderlink-platform-replacement`
- Baseline HEAD at correction start:
  `c0c998d8e456b9e70433e73123e8024b13ece203`
- Existing Admin/Tracker/replacement work remains unstaged and must be preserved.
- `.codex-node-userinfo-fallback.cjs` remains local-only and untracked.
- Port 3010 is active from this replacement repository for the completed owner
  review checkpoint.
- On 2026-08-04, four clearly labelled `TLDEMO` synthetic broker imports were
  added through the normal Journal import/decision/rebuild services to support
  owner review of the current Data Decisions screen. They create only contained
  pending examples: an open-trade/position conflict, missing execution price,
  same-time ordering ambiguity and an imported zero-quantity row beside a valid
  row. They are not real trader data and do not create completed-trade analytics
  results. `src/scripts/seed-journal-data-decisions-review-examples.ts` is the
  local rerunnable helper; exact re-runs are idempotent.
- No commit, stage, push, deployment or production mutation is authorized by
  this plan.
- This revision records the owner-approved workflow direction and the active
  implementation follow-up. It does not authorize a separate execution store,
  silent fact replacement, database reset, deployment, or production change.

## Active follow-up

- Swing Tracker cards are being consolidated into the main page: no visible
  Rules section, factual execution editing, tags, and dated saved notes remain
  on the card. The compatibility detail route redirects to that card.
- Swing manual capture permits different execution dates, so a trader can
  record a prior opening and a later closing together. Daily Trade Tracker
  retains its one-Eastern-trading-day batch rule.
- Daily open-position cards now use the factual Journal trade for execution
  editing, tags and one editable trade note. They show a Rules section only
  when the trader classifies the position as a Bag holding; Swing positions
  leave the Daily surface and carry no rule reviews into Swing Tracker.
- The Swing card action is an ordinary execution-entry shortcut. The same
  execution ledger accepts entries from either the card or the page-level form;
  sufficient closing executions close the position without a separate close
  mutation.
- Active Swing cards now use one Add execution action and a Mark failed swing
  action. Daily Tracker hides active Swings unless the displayed date contains
  an execution linked to that Swing; continuing or closing it through Daily
  entry preserves the existing Swing classification.
