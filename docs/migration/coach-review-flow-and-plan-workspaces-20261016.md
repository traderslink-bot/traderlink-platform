# Coach reviews — plan-driven workspace design

[Current approved follow-up progress](coach-review-selected-scope-fixes-progress-20261017.md).

## Current specification — controlling implementation target
This section consolidates the latest owner decisions on October 17. It supersedes contradictory wording in the decision history below. This is the design target, not a claim that source or staging implements it. [Progress and QA](coach-review-flow-progress-20261016.md). [Approved implementation progress](coach-review-template-implementation-20261017.md).

### Review types and focus
- New review types: Trade, Trading day, Performance. Preserve existing accepted agreements and all review/Journal history, including legacy standalone services; do not silently convert or delete them.
- Optional plan focus: Rules, Risk, Goals, Journal, Execution and Strategy guidance where offered. Strategy guidance is not a standalone new review. Coaches may use shared notes/tags and make relevant strategy observations without that focus separately selected. Explicit focus promises an assessment, not extra review allowance. Goals follows the finalized overall/day/period placement below, with trade-specific evidence where relevant.
- Plan offer/agreement determines service, unit, quantity, selection responsibility, period, depth, focus and follow-up. Every scheduled/manual/student-requested review must identify that frozen accepted service. Later public plan edits do not rewrite it. No per-review layout builder.
- Student sees required access before agreement and explicitly grants it for their Journal account. Offer is not a grant. Preserve granular trades/notes/rules/tags/day Journal/analytics permissions and private coach notes. Coach never edits the student’s Journal through review access.

### Trade review
- One main trade table: Find trades (eligible shared trades with search/date filters), To review (this review’s requested/permitted selected trades), Saved drafts. No separate All shared trades list and no analytical Add trades path. Clear filters changes only table filters, never eligibility.
- Exclude already individually reviewed trades from new review selection, including backend enforcement. Keep current drafts editable and prior reviews available as history/read-only analytical evidence. Apply the finalized historical boundary below.
- Use EXACT normal-workspace TradeDetailsDrawer and Analyzer tab/components with authorized student data; no old coaching-only Details renderer/fallback. Notes/rules/tags/executions and existing shared analysis are contextual to the trade. Table chart opens full-size for that trade’s symbol.
- Feedback/notes and image attachments are tied to that individual trade. Save as draft, revisit drafts, advance to next trade, then preview and explicitly send the overall review. Guidance follows agreed focus and actual available evidence. Never mark unsaved edits completed or silently send older feedback.
- Right recap shows agreed work, quantity, original request, progress such as1of5 completed, and saved/unsaved state. Insufficient student trades does not become coach failure: preserve promised quantity, review available work, record actual shortage transparently. Missing grants/partial data are not proof of fewer trades.

### Trading day review
- Actual shared calendar-style day summaries and permitted day selection; student-requested day preselected. Day count remains distinct from trade count.
- Selected day contains its chronological trade table using the shared card/draft workflow. Separate day-level Journal/rules card contains preparation, notes, recap and recorded rule results. Whole-day summary stays complete even if individual feedback covers only a capped subset. Previously reviewed trades can be context without another individual review.
- Day-level assessment covers agreed focus, findings/goals/actions, with per-trade drafts and day-level progress. Max trades per day versus across the whole multi-day review follows the finalized selectable cap modes below. Save/preview/confirmed delivery, preserving prior feedback and history.

### Performance review
- Agreed period summary/results/counts and full normal analytical resources, trading-day results, supporting trades and authorized Journal context.
- Feedback follows agreed results/consistency/risk/rules/execution/goals/strategy guidance and next-period actions. Use recorded facts and sample sizes; unavailable is not zero. Primary/comparison periods and units/filters are explicit.
- Previously reviewed trades can be read-only evidence, not another individual-review allowance. Additional individual reviews require the agreed service. Save drafts, preview student-visible content, confirm delivery.

### Resources — complete inventory, on demand
Right-side Resources card below requirements/progress. Expand groups with multiple pages; leaf click opens that page. No report/model preloading when review opens or group expands. Only the selected page and required authorized data load. Lightweight applicability metadata must not compute all reports.
- Analytics (expand): Overview, Ticker, Timing, Trade Breakdown.
- Trade Explorer: its own clickable resource.
- Compare Trades: a separate clickable resource, NOT grouped under Trade Explorer.
- Rules analytics: normal Rules results for agreed/shared Rules work; no rule-definition editing.
- Trade Analyzer (expand only when applicable): Day Trade Analysis, Entries and exits, Room after entry, Green to red, Scaling out, Candle patterns, Trend & Momentum, Analyzed trades. Show individual pages only when applicable to the review period and available shared analysis. Existing saved results only; no automatic paid jobs.
- Retain supported Analytics Lab/trade-candle-analysis inventory where applicable/available; do not automatically activate legacy routes or duplicate compatibility routes. Applicable multi-page resources expand; no omitted page merely because it is not linked from Overview.
- Required but missing sharing is explained in Requirements, not disguised as an irrelevant report or silently treated as complete. Unavailable results/loading errors have honest states inside the requested view. No old Analysis tools panel, count-only Analytics substitute, empty Focused trade notes or duplicate trade selector.

### Resource viewer and mobile
- Large slide-in view uses normal dashboard content width/height and ACTUAL normal page content, controls/charts and drilldowns, without nesting another dashboard shell/sidebar/header. Optional expanded desktop, full-screen mobile.
- Each page opens according to review period without manual date re-entry; adapt page-specific date parameters and preserve applicable filters/currency through navigation. Comparison dates are explicit. Do not silently default a missing period to all history.
- No repeated student/account banner: underlying review already identifies them. All server reads still enforce exact authorized student/account/review scope; no coach-account fallback, session impersonation, student mutations, automatic paid requests or owner-only offline snapshot behavior.
- Underlying review stays mounted; drafts, selected trade/day, filters, progress and scroll survive opening/closing/page switches. Back within drilldowns returns to parent; resource Back returns to Resources; Close returns directly to review. Preserve Resources expansion/scroll, keyboard focus and mobile/browser Back behavior. Loading failures do not lose work.
- Desktop uses right-hand requirements/progress/Resources cards. Mobile uses two compact Requirements & progress and Resources actions opening full-height sheets; do not ALSO duplicate the same cards beneath the review content. This is finalized under the owner-delegated decisions below.

### Final operating rules — owner delegated decision October 17
1. **Trading-day trade cap:** plan setup offers two explicit modes, Max trades per day (default for new day-review offers) or Max trades across this review. Coach chooses mode and quantity while creating the offer; accepting the agreement freezes them. Number of days remains separate. Per-day unused allowance does not silently transfer; whole-review allowance may be distributed among the agreed days without an invented equal per-day limit. Student sees the day count, cap mode and quantity before agreeing; recap shows the same values/remaining count. Selection responsibility follows the plan. Preserve existing accepted terms; legacy offers without an explicit cap need an explicit resolution, not retroactive guessed limits. Review available work and transparently record shortages without forcing coach to invent trades.
2. **No-repeat eligibility:** track delivered individual-trade feedback by the same coach for the same student within this community, across their plans/relationships. A trade individually reviewed within a delivered trading-day review counts too; mere inclusion as performance/day analytical evidence or an overall day assessment does not. Existing reviews/history remain viewable, and current drafts remain editable. A trade already selected for another active individual-review draft is unavailable for a second simultaneous selection; removing it or cancelling before delivery releases that reservation. Cancelling after delivery does not erase completed work or make it a new review. Enforce in the main table and atomic server selection/delivery checks. Match stable Journal trade identity and verified merge/reimport lineage, never ticker/date guesses; do not cross community access boundaries or reveal another coach’s history.
3. **Goals placement:** Goals is an optional overall assessment for the review; for Trading day it belongs to the relevant day assessment, and for Performance to the agreed period. Coach references individual trades as evidence when relevant, without filling the same Goals box on every trade. Use the student’s explicitly agreed/shared goal and next action, not invented targets. If no concrete goal is available, request clarification or leave optional Goals unselected rather than make generic text mandatory. Regular trade feedback can still mention a relevant goal.
4. **Trade-review analytics period:** use the explicit frozen agreement/review period when present. Otherwise derive the primary window from the earliest through latest selected trade’s trading date in the student’s Journal account timezone, inclusive. This applies to analytics, Trade Explorer and Compare views opened from the review; the actual trade details/chart remains tied to its specific trade. Display normal date controls with those defaults and clear comparison dates, without an extra student/account banner. Until at least one eligible trade is selected and no agreed period exists, explain that a selection is needed in Requirements and do not silently open all-history reports. Update the derived window when selection changes; reset incompatible old resource filters/caches. Missing verified trading dates require an explicit date choice rather than a UTC/all-history guess. Analytical evidence within the period may include already-reviewed trades but never adds another individual allowance.
5. **Mobile presentation:** finalize sheets only, not repeated below-review cards. Two compact actions, Requirements & progress and Resources, open full-height sheets. Resources expands groups without loading reports; a leaf opens the selected normal page full-screen. In-page Back returns to its parent; page Back returns to Resources with expansion/scroll preserved; Close returns directly to the unchanged review. Desktop retains right-side cards and the large slide-in page view. Maintain accessible focus, touch targets and browser Back behavior.

These decisions complete the plan’s identified operating-rule questions under the owner’s “U decide” instruction. They authorize no deployment, data migration or silent rewrite of legacy accepted plans. Review-type/resource inventory and granular student grants remain controlling.

### Acceptance and boundaries
QA the complete agreed design before coding checkpoints; owner visual approval throughout. After implementation verify plan binding/access requirements, same shared card, no-repeat eligibility, independent per-trade/day drafts, unsaved loss protection/uploads, progress/shortage, preview/send/student visibility/private notes, full resource inventory with on-demand loads, date scope, read-only permissions and mobile/theme behavior. Source presence/syntax is not functional acceptance. No Members/full Community Stats work, student-data mutation, tests/build or staging/production release is implied by this plan QA.

## Decision history — superseded wherever the current specification differs
Historical sections below retain reasoning, prior approvals and audit evidence. Four-type Strategy offerings, grouped Explorer/Compare navigation and inline analytics layouts below are NOT current implementation instructions.

## Historical initial inventory
- Accepted service controls review type, measurement unit, coverage, quantity, selection responsibility, depth, focus areas and follow-up. Resolve the exact agreement/plan item that generated an occurrence, even if superseded. Later public plan edits never rewrite accepted work. Ambiguous legacy records need explicit resolution; never infer permission or fabricate data.
- To review: student-requested trades inside their specific request, plus coach-selected shared trades only where that agreed service permits. Keep requests/reviews/relationships separate; do not silently move submissions into unrelated scheduled work. Saved: actual stored trade feedback, editable only within the allowed draft lifecycle. Inaccessible underlying Journal data must not hide retained selections/feedback or produce editable fake trades.
- Trade review: open selected trade, see summary and relevant details, review each agreed focus area, save feedback and move to Saved, then assemble overall feedback/next actions and preview/send. Retain chart images, private notes, prior focus and delivery/viewed history. Existing acceptance/due-date workflow stays distinct from layout configuration.
- Trading-day review: start with student's actual shared trading dates, using calendar-style day summaries (date, net result, trade count, wins/losses where supported, available Journal/rule indicators). Preselect a student-requested day; otherwise allow coach day selection only under agreed terms. Open a day to its chronological trades, executions, notes, tags, rules and day Journal. No fabricated metrics, unavailable values or empty days inferred from incomplete sharing.
- Day drilldown: guided review of each required trade with summary, authorized notes/rules/tags/executions, chart and existing analyzed chart/data when available and shared. Save trade feedback separately, then day feedback and next actions. Retain original selected day and agreement coverage rather than silently widening the period or changing the service.
- Performance review: agreed/requested date window, existing authorized Journal analytics, trading days and drilldown trades. Display actual filters, units and sample counts consistently. Rules focus includes the student's shared rule definitions/tracking, followed/broken/not-reviewed counts and organized per-rule feedback. Never infer compliance from missing tracking. Include risk/strategy/Journal/tags/goals only where offered and authorized, each with its own organized feedback and final summary.
- Strategy review (owner approved inclusion): use the accepted strategy-review service, its permitted selection and agreed period. Show the shared strategy/playbook and rules when an authorized source exists; relevant trades/days grouped by recorded strategy/setup, executions, notes, tags, charts and existing shared analysis. Keep strategy adherence separate from strategy performance. Missing strategy assignment, rules tracking or sharing is explicitly unavailable, never inferred from profit/loss or arbitrary tags. Guide feedback through setup selection, entries, exits, risk and execution only within accepted scope, then strategy assessment and next actions. Do not invent a strategy registry or broaden Journal sharing. Audit existing strategy identifiers/playbook storage before building grouping or metrics.
- Per-trade detail preserves execution history including partial entries/exits as supplied by existing Journal read services. Chart embeds and existing analysis are read only; do not trigger paid analysis/provider jobs or expose private/unshared artifacts.
- Analysis sharing is separate from trade, notes, rules, tags and day-Journal sharing. A plan promising a feature is not a grant. Missing scope needs a truthful explanation/student sharing action; do not broaden permissions. Preserve original participant and private-coach-note boundaries.
- Review workspace has no layout builder or editable focus/type checkboxes. Plan setup defines the offer; accepting the agreement defines the work. Operational choices (permitted trade/day selection, due date, feedback) remain available without redesigning the template.
- Saved/delivered/ended/paused states, images, action items, acknowledgements, attachments and read-only history must remain functional. No overwriting completed QA evidence or real student records.
- Light/Navy, desktop/mobile, clear empty/filter states, dirty-value protection and truthful pending/result handling are part of acceptance. Full Community Stats and Members remain outside this work.

## Proposed hierarchy inside a review
1. Agreed review scope and status (read only).
2. Requested work / eligible selection: trades, trading days, strategy or performance window according to the service.
3. Subject overview: selected trade, selected day, strategy evidence or period analytics.
4. Guided detail/feedback sections from the agreed focus/depth, with Trade details / Chart / Existing analysis available beside the relevant item.
5. Saved work and progress.
6. Overall feedback, next actions, private coach notes, preview/send.

## Sequence
A. Focused flow correction and truthful retained-item states — source written, acceptance pending.
B. Owner authorized proceeding with Strategy review alongside the review work. Continue UI approval at coherent layout checkpoints, including calendar-summary fields.
C. Audit existing calendar/Trade Tracker/analytics/chart read models and authorized sharing; propose only the missing contracts. Reuse existing components where practical; no cross-project changes.
D. Implement plan binding and trading-day selection/drilldown as one coherent UI slice, with owner visual review.
E. Implement strategy evidence/adherence/performance and performance/rules feedback with existing analyzed-chart access as coherent UI slices, with owner visual review.
F. Separately authorized integrated verification and coordinator staging handoff; no production release implied.

## Approved review taxonomy — local source slice
Only Trade, Trading day, Performance and Strategy are offered as new plan review types. Rules, Risk, Goals and Journal are focus areas across all four; Execution remains available. Existing standalone services, their stored configuration, accepted agreement snapshots and history are preserved without automatic conversion. Legacy item types remain readable in contracts/storage. Custom coaching remains a support arrangement, not a fifth new review type.

Source changes: remove retired offer tiles; expose a common focus picker; remove duplicate trade-specific focus controls; changing trading-day depth no longer clears selected focus. Plan action omits retired items and repository rejects direct creation of them while retaining stored legacy items/configuration on edits. New review scope choices omit Custom and retired service aliases, while legacy display mappings remain readable. Help updated. No migration/deployment/data mutation/tests.

## Owner-directed Trade review slice — October 17
Controlling inventory: use the EXACT shared normal-workspace TradeDetailsDrawer (Details and Analyzer tabs), with explicit coach-authorized read adapters rather than coach-account API reads; retain normal-user defaults. Existing student analysis only; no provider jobs/allowance usage from coaching. Show per-trade notes/feedback and per-trade attachments; Save trade review draft persists that trade’s feedback, moves it to Saved drafts and advances to the next queued trade. Overall review remains draft and student feedback stays hidden until Review and send. Right-side accepted scope/focus/quantity recap with completed count. Full-screen stock chart opens the clicked trade’s symbol. Existing shared Analyzer chart layout retained. Saved drafts can be reopened/edited before delivery; inaccessible retained items remain visible and removable without inventing details.

Shortage contract: keep accepted quantity unchanged. Only a live authorized Journal read with complete coverage can establish eligible availability in the agreed period; missing sharing/partial coverage returns unknown rather than zero. All available required work and every selected trade must have saved feedback. If availability is lower than agreed, permit delivery with actual counts recorded in existing delivered-event details. Freeze that evidence for lifecycle completion/history, even if later trades are added. Show recorded shortage to the student. No new schema. Source progress/acceptance evidence remains in the linked progress record; no release yet.

## Trade eligibility and selected-day presentation — owner discussion October 17
Owner requirement: previously reviewed trades must be tracked and excluded from new trade-review selection. Preserve current review drafts/Saved and delivered history; do not hide the evidence. Proposed boundary for confirmation during implementation: prior delivered/completed individual-trade feedback by this coach for this student (including individually reviewed trades within a day review), rather than another coach’s unrelated work. Saved drafts in the current review remain accessible. Enforce eligibility server-side as well as filtering; handle cancelled/removed work and stable trade identity explicitly. Do not confuse merely shared/selected trades with completed reviews.

Trading-day UI direction: selected day summary, then its trade table using the shared trade details/Analyzer and per-trade draft workflow; alongside it a distinct day-level Journal card with preparation/day notes/recap and day rules/results where shared. Individual trades are part of the selected-day workspace, not a separate page/workflow stage. Day-level feedback/goals/actions belong to the day. Whole-day facts should remain complete even if only a capped subset receives individual feedback; previously reviewed trades may remain read-only day context but cannot be added as new reviews under the proposed eligibility boundary.

Open plan decision: support an explicit trade-cap basis, per trading day OR across the complete multi-day review. Keep number of days separate from number of trades. Examples:3days,5trades per day gives up to15individual reviews;3days,10trades across review gives up to10total. Do not label either simply Max trades. Student sees quantity/basis before acceptance; workspace shows the same cap and remaining count. Actual selection responsibility follows accepted service. This cap design is proposed, not yet approved/implemented; no code changed during discussion.

## Performance review structure — owner accepted October 17
Performance review centres on results over an agreed period. Full inventory: period summary with dates/trade count/net P&L/wins/losses/available metrics; normal authorized TraderLink analytics relevant to accepted focus; trading-day results and day trades/Journal; evidence trade table using shared Details/Analyzer/Chart; shared notes/tags/reflections; accepted scope/focus and completion recap. Feedback sections follow the plan: results/consistency, recorded risk measures, rule adherence/examples, execution patterns, agreed goals, overall assessment and next-period actions. Comparisons use matching filters, explicit periods and sample sizes. Missing data is unavailable, not zero. Previously reviewed trades remain read-only evidence with existing feedback; opening evidence never creates or charges another individual trade review. Additional individual trade feedback requires an included service/allowance. Draft, student-facing preview and confirmed delivery. This accepted structure is recorded, not fully implemented. Strategy review discussion follows.

## Strategy guidance decision — owner approved October 17
This decision supersedes earlier proposals and the four-type setup approval where they offer Strategy as a new standalone review. Planned new review types are Trade, Trading day and Performance. Defer standalone Strategy review until a later explicit decision; preserve existing accepted Strategy services, reviews and history without automatic conversion or deletion. This is a plan update only; current source/staging may still show Strategy review.

Strategy guidance is an optional plan focus area within any of the three review types. It promises deliberate guidance on the coach’s own strategy or multiple strategies: whether a setup suited the trade, confirmations to wait for, potential entry, invalidation, risk management and exit, or why the coach would skip the trade. Present this as the coach’s reasoned approach, not invented evidence of what the student intended or a guaranteed outcome. No strategy tag is required for this kind of guidance.

Selecting Strategy guidance does not gate ordinary feedback: when the student grants access to notes/tags, the coach can use those to understand the student’s attempted strategy and make relevant strategy observations even without this explicit focus. A strategy tag identifies an attempted strategy, not proof of adherence. Assessing adherence to a specific student strategy requires a known definition/rules and identifiable examples from student notes/tags or explicit clarification; do not infer intention from ticker or profitability. Ambiguity is clarified with the student.

An explicit focus adds a promised assessment, not additional individual review allowance. Access to notes/tags supplies permitted context and never silently grants extra scopes, adds a standalone service, or consumes another review. Relevant strategy guidance can be given for a trade, across a trading day, or across the Performance period under the accepted plan. Implementation/migration of the existing source offering is pending; no deployment authorized by recording this decision.

## Non-negotiable Trade Details acceptance condition — October 17
Owner clarified the old coaching Trade Details drawer must never be used. Loading data in it is a failed UI requirement, not partial acceptance. All real review Details entry points must use the exact normal-workspace shared TradeDetailsDrawer, with Details/Analyzer tabs and authorized student read adapters. No coaching-specific duplicate or fallback. Local replacement is not proof of hosted completion; repeat QA against the actual deployed replacement.

## One-table trade navigation requirement — October 17
All eligible shared trades are browsed/selected in Find trades; current work is To review; persisted drafts are Saved drafts. Remove separate All shared trades list/drawer and alternate Add trades paths from analytical evidence. Keep evidence read-only and route any selection to the common table/policy. Main-table Clear filters remains valid; clearing dates/search must not bypass previous-review exclusions. Notes/Details/Analyzer and symbol-specific chart actions are contextual to a trade. Remove empty Focused trade notes and misleading count-only Analytics shortcuts; day Journal and real analytics use their accepted template areas. Latest QA found these duplicate paths present in both staging and local source; this requirement is recorded for the next implementation checkpoint, not already complete.

## Native student analytics access — owner requirement October 17
Owner explicitly directed deletion of the bespoke Analysis tools panel. Removed review-page import/render and its only-consumer coaching-analysis-drawer.tsx component locally; keep the authorized saved-Analyzer loader used by the exact shared TradeDetails component. No deployment. Focused trade notes is a redundant selected-trade Details shortcut with a broken empty-panel state; it is not a separate student data category. Its notes must be available from the actual shared trade card when granted.

Controlling full analytics target inventory from current normal-app routes/navigation:
- Core Analytics: Overview (/analytics), Ticker (/analytics/results), Timing (/analytics/timing), Trade Breakdown (/analytics/execution).
- Trade Explorer (/analytics/trade-explorer) and its comparison view (/analytics/trade-explorer/compare).
- Analytics Lab (/analytics/lab) and its trade-candle-analysis view (/analytics/lab/trade-candle-analysis), where applicable/available.
- Day Trade Analysis (/analytics/trade-analyzer/day), Entries and exits (/entry-exit), Room after entry (/mfe-mae), Green to red (/green-to-red), Scaling out (/scaling-out), Candle patterns (/candle-patterns), Trend & Momentum (/trend-momentum), analyzed trades (/trades), plus the normal shared per-trade Details/Analyzer card. Suffixes are under /analytics/trade-analyzer/day. /analytics/trade-analysis is a compatibility route, not a second product to duplicate.
- Rules analytics/results (/rules/results), including recorded rule tracking and relevant evidence when Rules is agreed/shared. Rules management (/rules) is not permission to edit the student’s definitions.

Reuse the real normal-user page components, filters, charts and drilldowns with an explicit authorized coach/student relationship and Journal-account read scope. Do not route to the coach’s own account or temporarily impersonate the student. The underlying review already identifies the student/account; do not repeat that banner in the side view. The data scope remains explicitly student-authorized server-side, with a return to review. Every server read/API/deep link enforces current grants and role/relationship access; a plan promise is not an implicit grant. Show required access before student acceptance and require explicit grant before coach reads. Existing analyzer results only where applicable and shared; paid/new analysis jobs are a separate explicit decision. Analytical evidence can include previously reviewed trades without creating another individual-review allowance. Actual individual selection remains in the common review trade table.

Implementation checkpoints needing UI/architecture review before full build: bind accepted service and derive requirements; establish reusable student-scoped page loaders and link/query propagation; wire complete native analytics inventory read-only; integrate Rules data permission checks and shared Analyzer; verify coach-default account is never used, permission revocation/deep links, consistent filters/samples, mobile/themes, no student-data offline snapshot writes through normal owner-only PWA capture, and no student mutation via saved-view/edit/analyze controls. Current normal routes use requireMembershipPageScope and owner-account API calls, and some render OfflineSavedViewCapture; ordinary links alone do not satisfy this requirement.

This is the required next integration design, not implemented native-page access. Existing count-only Analytics shortcut is still an identified failure and must not be described as full student analytics. Source Analysis tools removal is complete; the broader integration remains pending, with no release authorized by this discussion.

## On-demand native analytics side view — owner approved October 17
This supersedes the earlier inline main-area/right-feedback analytics proposal. Open only the requested native analytics/Trade Explorer/Rules/Analyzer page on demand in a large right-side view sized to normal dashboard content width and height (not the old narrow/simplified coaching panel). Do not render or fetch all page modules/models up front. Use the actual normal page UI, with normal filters/charts/drilldowns and page title plus Close/Back; allow full-screen where useful and full-screen mobile. The underlying review stays mounted and retains feedback drafts, focus, selected trade/day, table filters and progress when the side view opens/closes.

No repeated student/account identification block in the side view: context is already known from the underlying review. This is a display decision only; every request still enforces exact coach/student relationship, granted Journal account, applicable rules/analytics scopes and current access. Pages open according to the review period without requiring the coach to re-enter dates. Native page-specific date/query adapters must preserve that period and relevant filters through navigation and drilldown; comparisons must be explicitly identified under the agreed review, not silently replace its primary period. Previously reviewed trades can be analytical evidence, not another selection/chargeable review path. Full analytics route inventory remains the Native student analytics section above.

QA acceptance checklist: one requested module/model load; correct native page UI; review-period initialization on EVERY supported page (including Rules results and analyzer pages); correct authorized student account instead of coach account; normal controls/drilldowns preserve scope; wide/tall desktop and mobile full-screen; no redundant identity banner; Close/Back/full-screen restores draft and review position; missing scope/result accurately explained; no hidden owner-data mutations, offline capture or paid analysis jobs. This is a recorded future implementation target, not source completion.

## Design QA of the analytics side-view plan — October 17
Owner clarified QA means QA THE PLAN before implementation, not report approved future work as failed because source is absent. Implementation-status checks above are not a design verdict. The side-view design is coherent; tighten these details before building without adding a new workflow or redundant identity UI:

1. Reuse normal analytics PAGE CONTENT inside the large side view, not a second complete dashboard shell/sidebar/header. Size to the available dashboard content area; use full-screen mobile and optional expanded desktop. The underlying review remains mounted.
2. Load only the requested page and its permitted data when opened; opening the menu does not fetch every report. Switching page loads that page. Keep review scope consistent through drilldowns and Back.
3. Set each page’s primary period from the review automatically, using page-specific date adapters; preserve relevant currency/filter context. If comparison is part of the normal page/agreed assessment, label its comparison period separately rather than silently changing the primary review dates. Missing review dates must be resolved explicitly rather than defaulting to all history.
4. Preserve underlying feedback drafts, selected trade/day, table filters, progress and scroll on open/close/full-screen/page change. In-view drilldowns have Back within the side view; Close returns directly to the same review position. Analytical page state can be held in memory for this review but must not carry student data into another relationship/account.
5. Normal controls/charts are reused, but student data is read-only: no editing/deleting trades/rules, saving changes to the student’s views, or launching paid analysis jobs. Normal source pages’ owner-account/offline behavior cannot be inherited accidentally. Permitted trade details and existing Analyzer results stay in the same viewing context.
6. All analytics results/drilldowns use current authorized student/account scope and applicable plan-sharing requirements, including Rules analytics when Rules is agreed/shared. Do not display a redundant student/account banner, but keep the server scope and permission checks. Recheck access when opening/switching/retrying; unavailable access or data has an inline explanation and Back/Close, not a fallback to the coach account or placeholder metrics.
7. Analytics evidence is not another review-selection flow. Previously reviewed trades may appear as read-only evidence with existing feedback; new individual trade review selection stays in the one main Find/To review/Saved drafts table and follows no-repeat/quantity rules.
8. Keyboard focus moves into the side view and returns to the opening control on close; Escape/Close and mobile Back behave consistently. Review drafts remain intact even if loading fails. No persistent student-data cache or browser-local snapshot is implied.

Design QA verdict: proceed with this side-view design using these clarified interaction/data boundaries. No additional selector for student/account, narrow coaching report, duplicate trade selector, or up-front loading of all pages is needed. Full route inventory remains the Native student analytics section. This QA refines the plan only and does not claim implementation or runtime verification.

## Resources card, applicability and mobile — design QA October 17
Owner decisions recorded: right-side Resources card; expand groups that have multiple pages; expanding a group does not fetch/render its page modules; clicking a leaf loads that real page into the large side view. Analytics Overview does not provide navigation to the other Analytics pages, so provide explicit leaf links. Trade Analyzer has its own analysis pages, shown only when applicable to agreed scope and existing shared analysis in the review period. Do not show a blanket list of irrelevant empty analyzer reports.

Complete target Resources inventory (visibility is conditional on authorized/applicable capabilities, not automatic enablement of legacy routes):
- Analytics (expand): Overview, Ticker, Timing, Trade Breakdown.
- Trade Explorer: Explorer and Compare Trades; expandable when both supported/available. Opening a comparison is analytical evidence, never a second individual-review selection workflow.
- Rules analytics: normal Rules results when agreed/shared.
- Trade Analyzer (expand only when applicable): Day Trade Analysis, Entries and exits, Room after entry, Green to red, Scaling out, Candle patterns, Trend & Momentum, Analyzed trades. Each leaf has its own applicable-data check. Existing per-trade Analyzer tab stays on the shared trade card.
- Analytics Lab inventory remains covered: normal Lab and trade-candle-analysis page, only if applicable/available; no new product or hidden route automatically activated. Multi-page Lab uses its own expandable group when exposed.

Applicability must be established from lightweight metadata/grant checks, not loading all report models merely to decide visibility. Distinguish no relevant saved analysis (omit irrelevant analyzer entries) from missing access needed for an agreed review (show the requirement/problem in Requirements, not silently conceal unmet work). Each actual page read rechecks authorization. Loading/error/no-data states belong inside the requested view and must preserve the review.

Mobile QA correction to earlier conversational proposal: do not BOTH stack right-column cards below the review AND offer duplicate sheets. Proposed single mobile presentation is two compact accessible actions, Requirements & progress and Resources. Each opens a full-height sheet; resource groups expand in that sheet; selecting a page opens a full-screen native page view on demand. Back returns to Resources, retaining expanded groups/scroll; Close returns directly to the review and its prior position/draft. In-page drilldown Back first returns to its parent page. Opening/closing must preserve all feedback, selected work, filters/progress. On desktop retain right-hand cards and large side view. Do not create a second global navigation or repeated student/account banner.

Interaction/accessibility QA refinements: clear disclosure chevrons versus leaf links; selected page visible when reopening Resources; keyboard-expanded state/focus management; mobile touch targets; Close/Escape consistent; browser Back handles the opened view before leaving the review. Read-only normal-page content, automatic review-period adaptation and no student mutation/cache/job behavior remain controlling.

Design QA verdict: side-view approach is coherent. Plan gaps found were duplicated mobile presentation, incomplete Trade Explorer navigation and undefined applicability/error distinction; refinements above address them. The mobile deduplication is a QA recommendation for owner review, not a claim of built UI. Resource access/period/plan binding still require implementation checks later, not a failed design because code is absent. No implementation, runtime QA, test run or deployment in this pass.

## Resources correction — owner clarified October 17
Trade Explorer and Compare Trades are TWO SEPARATE resources, not pages grouped under Trade Explorer. This supersedes the earlier Resources/mobile QA suggestion to group them. Each is its own clickable Resources entry and opens its normal student-scoped interface in the large side view, according to the review period.

Do not load every report into the review. Initial review rendering and expanding Resources groups load no report pages/models. Only selecting one resource/page loads that page and its required authorized data; switching resources loads the selected destination. Lightweight availability metadata may determine applicable Analyzer links, but must not compute/fetch all reports. Normal review data (selected trades/day, progress and feedback) remains separate from report loading. Keep the full supported resource inventory without eagerly rendering/fetching it.


### October 17 QA correction follow-up
[Three approved QA fixes and repeat source review](coach-review-template-qa-fixes-20261017.md): account selection, browser Back draft protection and complete dirty-state readiness. Source correction complete; integrated runtime and owner visual acceptance remain pending.


### Analyzer/history correction checkpoint
[Additional QA fixes and repeat source review](coach-review-analyzer-history-qa-fixes-20261017.md): shared Analyzer rendering, exact review/period authorization and post-read revocation checks, and multi-entry history draft protection. Source corrections complete; browser/runtime/owner acceptance pending.


### Details API source correction
[Review-state and period enforcement with repeat QA](coach-review-details-api-qa-fix-20261017.md) is source-complete. Runtime/visual acceptance remains pending. No deployment.


### Full-flow source QA - five open findings
[Complete review-flow source QA](coach-review-full-flow-source-qa-20261017.md) covers requests/sharing, selection/drafts, all three review types, Resources, preview/send and student history. Five findings remain open; full-flow acceptance is not complete. No implementation or deployment in this QA pass.


### Owner-approved five-finding implementation
[Current correction progress](coach-review-five-fixes-progress-20261017.md) tracks all five full-flow QA fixes and preservation boundaries. No deployment.


### Five-finding source correction checkpoint
[All five corrections and full-flow QA](coach-review-five-fixes-full-flow-qa-20261017.md) are source-complete; original accepted terms/history preserved. Integrated runtime and owner visual acceptance remain pending. No deployment.


## Repeat full-flow source QA - October 17
[Latest repeat QA](coach-review-full-flow-repeat-qa-20261017.md) records four open issues in shortage eligibility, mixed student/coach selection caps, restored draft visibility and day-request evidence. Earlier source-complete checkpoints do not constitute final acceptance. No feature fixes, tests, build or deployment in this pass.


## Approved four-finding correction slice - October 17
[Progress](coach-review-four-fixes-progress-20261017.md). Owner approved correcting all four repeat-QA findings while preserving accepted plans/history. Day request selection uses an explicit bounded date range so shared notes/rules days can be discovered without an all-history read. No deployment.


## Four-finding correction checkpoint - October 17
All four findings corrected in local source. [Corrections and repeat full-flow QA](coach-review-four-fixes-full-flow-qa-20261017.md); [progress](coach-review-four-fixes-progress-20261017.md). Browser/runtime and owner visual acceptance remain pending. No tests/build/deployment.


## Post-correction full-flow QA - October 17
[Latest QA](coach-review-post-four-fixes-full-flow-qa-20261017.md) identifies two remaining source issues: requested-day false shortages and merged-trade projection inconsistency between table/eligibility and Details. Prior four corrections remain; final acceptance is pending. Documentation-only QA, no tests/build/deployment.


## Approved two-finding correction slice - October 17
[Progress](coach-review-two-fixes-progress-20261017.md). Measure days before requested-day filtering and allow students to add missing days within existing review dates. Use normal Details facts for current merged rows; retain original selection IDs and immutable agreement/delivery history.


## Two-finding correction checkpoint - October 17
Both findings corrected locally. [Corrections and repeat full-flow source QA](coach-review-two-fixes-full-flow-qa-20261017.md); [progress](coach-review-two-fixes-progress-20261017.md). Accepted plans/history preserved; runtime and visual acceptance pending. No tests/build/deployment.


## Post-two-fix full-flow QA - October 17
[Latest source QA](coach-review-post-two-fixes-full-flow-qa-20261017.md) records one remaining logical-ID compatibility issue in native Details/save lookup. Earlier corrections remain; final acceptance pending. Documentation-only pass, no tests/build/deployment.


## Approved logical-ID correction - October 17
[Progress](coach-review-logical-id-fix-progress-20261017.md). Resolve current logical IDs only inside the authorized shared account for native Details/save/Analyzer calls. Keep stored review IDs and agreement/delivery history unchanged.


## Logical-ID correction checkpoint - October 17
[Correction and repeat full-flow source QA](coach-review-logical-id-full-flow-qa-20261017.md): logical IDs resolve to verified native member IDs for Details/save/Analyzer; stored IDs, accepted plans and history preserved. No further confirmed source finding. Runtime/visual acceptance pending; no tests/build/deploy.


## Complete plan-to-student source audit - October 17
[Full audit](coach-plan-to-student-review-complete-source-audit-20261017.md) covers plan creation, agreements, activation, scheduling, each review type, supporting offers, resources, drafts, Send and student history. Six source-confirmed defects plus one mobile risk pending browser verification; additional evidence/acceptance gaps separated. Not final acceptance. Documentation only, no implementation/test/build/deployment.


## Approved complete-audit corrections - October 17
[Progress](coach-review-complete-audit-fixes-progress-20261017.md). Owner authorized the six confirmed corrections; mobile Requirements preservation is included. New Performance Journal consent must be versioned in new offer configuration; old accepted agreements are not silently broadened. No deployment.


## Complete-audit source correction checkpoint - October 17
A1-A6 corrected and A7 mounting/dirty-observer integration addressed. [Corrections and full plan-to-student source QA](coach-review-complete-audit-fixes-full-flow-qa-20261017.md); [progress](coach-review-complete-audit-fixes-progress-20261017.md). No further confirmed source finding within corrected paths. Browser/runtime/visual acceptance and separately documented product gaps remain pending. No tests/build/deploy.


## Entire-flow repeat QA - October 17
[Latest full-flow source QA](coach-plan-review-entire-flow-repeat-qa-20261017.md) records three remaining issues: selected-item schedule coverage, cross-day auto-advance and duplicated responsive Requirements draft state. Continued through all stages; previous corrections remain. Documentation only, no tests/build/deploy. Final acceptance pending.


## Approved B1-B3 follow-up
[Corrections](coach-review-selected-scope-fixes-progress-20261017.md) and [entire-flow source QA](coach-review-selected-scope-full-flow-qa-20261017.md). Existing accepted plans/history preserved; no tests or deployment.


## Subsequent entire-flow QA C
[Read all three remaining source findings](coach-plan-review-complete-repeat-qa-c-20261017.md). Full checklist completed; no feature edits, tests or deployment.

[Approved QA C corrections](coach-review-c-fixes-progress-20261017.md).


[QA C fixes and entire-flow follow-up](coach-review-c-fixes-full-flow-qa-20261017.md): all three source corrections complete; accepted plans/history preserved. No deployment.


## Repeat entire-flow QA D
[Two remaining Overall review findings and full checklist](coach-plan-review-complete-repeat-qa-d-20261017.md). Previous C fixes retained; no feature edits, tests or deployment.

[Approved QA D progress](coach-review-d-fixes-progress-20261017.md).


[QA D fixes and full-flow follow-up](coach-review-d-fixes-full-flow-qa-20261017.md): both corrected in source; accepted plans/history preserved; no deployment.


[Repeat entire-flow QA E](coach-plan-review-complete-repeat-qa-e-20261017.md): no new confirmed source defect; known product gaps and browser/runtime acceptance remain. No source edits or deployment.

[Approved sharing and goals implementation](coaching-sharing-goals-progress-20261017.md): explicit student-shared review goals and post-activation requirements handoff, preserving old terms/history.


## Sharing and structured goal gaps
[Implementation and full-flow QA](coaching-sharing-goals-full-flow-qa-20261017.md): source complete for active-enrollment requirements handoff and explicitly student-shared review goals. Old terms/history unchanged. No automatic grants, Journal-wide goal store, tests or deployment; browser acceptance pending.


[Repeat full-flow QA F including sharing/goals](coach-plan-review-complete-repeat-qa-f-20261017.md): one Browser Back/Forward student-draft finding. Entire checklist reviewed; no feature edits or deployment.

[Approved student history protection](student-coaching-history-fix-progress-20261017.md).


[Student Back/Forward correction and full-flow QA](student-coaching-history-full-flow-qa-20261017.md): source complete; accepted plans/history preserved. Browser acceptance pending; no deployment.


[Repeat full-flow QA G](coach-plan-review-complete-repeat-qa-g-20261017.md): one remaining untracked-history direction/restoration finding; complete checklist reviewed. No source edits or deployment.

- G1 correction: [Untracked student history progress](student-coaching-untracked-history-progress-20261017.md).

- Approved student untracked-history correction source-complete: [progress](student-coaching-untracked-history-progress-20261017.md), [full QA H](coach-plan-review-complete-repeat-qa-h-20261017.md). Two remaining findings; browser acceptance pending. No deployment.

- H1/H2 approved correction: [progress](coach-review-history-help-fixes-progress-20261017.md).

- H1/H2 local source checkpoint complete: [progress](coach-review-history-help-fixes-progress-20261017.md), [whole-flow QA I](coach-plan-review-complete-repeat-qa-i-20261017.md). No new confirmed source findings. Browser acceptance pending; no deployment.

- Repeat whole-flow [QA J](coach-plan-review-complete-repeat-qa-j-20261017.md) completed, including coach/student history, sharing and saved goals. Two remaining student-navigation source findings; all 83 hashes/syntax match. No feature edits or deployment; runtime acceptance pending.

- Approved J1/J2 correction: [progress](student-navigation-j-fixes-progress-20261017.md).

- J1/J2 local source correction complete: [progress](student-navigation-j-fixes-progress-20261017.md), [full QA K](coach-plan-review-complete-repeat-qa-k-20261017.md). No new confirmed source findings; browser acceptance pending. No deployment.
- Repeat whole-flow source review: [QA L](coach-plan-review-complete-repeat-qa-l-20261017.md). No new confirmed source defect; signed-in browser acceptance remains pending. No deployment.
