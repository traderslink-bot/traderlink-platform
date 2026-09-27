# Coaching review types and inline trade feedback

Owner approved implementation on 2026-09-27 after the five-type recommendation.
Status: in progress; no claim of deployed or visually accepted changes.

## Controlling scope

1. Trade review: one or multiple selected trades, independently saved feedback.
2. Trading-day/session review: agreed dates, trades and permitted day Journal data.
3. Performance review: agreed period, factual results/comparisons and supporting trades.
4. Strategy review: coach-defined strategy/setup, supporting trades and feedback.
5. Custom review: coach-defined scope with optional structure and schedule.

Weekly/monthly are frequency/coverage, not new review types. Optional focus areas
are execution, risk, rules, notes/tags, goals, overall feedback and next steps.
They never imply new student data access. Rules/risk may be standalone named
services built using these types. Live sessions, lessons and questions remain
separate coaching services. Preserve existing plans and historical review records.

## Full preservation inventory

- Find trades / To review / Saved; counts, search, date range and pagination.
- Rightmost checkboxes and bottom-right select/add/remove controls.
- Student selections, coach selections, saved-review edits and removal.
- Trade Details, executions, permission-scoped notes/rules/tags, charts and images.
- Save-and-advance, draft persistence, student actions, previous coaching focus.
- Overall feedback separate from per-trade feedback; omit empty student sections.
- Agreement, due dates, progress, final assembled review and explicit delivery.
- Delivered/read acknowledgement/follow-up/completed/cancelled lifecycle.
- Normal shared app shell, Light/Navy Dark, responsive table/mobile cards.

## Implementation checkpoints

- [x] Inline trade editor source expands immediately beneath its trade row/mobile card.
- [x] Five types and optional focus areas persisted without rewriting legacy facts.
- [x] Plan/request configuration supplies the appropriate review workspace.
- [x] Permission-gated trade/rule/Journal context and bounded performance comparisons.
- [x] Optional overall fields and nonempty student/final focus feedback output.
- [ ] Focused static checks, remote build/runtime checks and owner UI review.

## Safety and delivery

Assigned source lane: coaching-resume-20260926, base b7b409af5. Exact new delta only;
held Coaching-nav change48077 is excluded. Coordinator owns migration reservation,
current-production-mirrored staging integration, remote builds and hosted work.
No local builds or broad tests. Production unchanged. Existing synthetic student
and saved coach work must be preserved. New UI descriptions need owner approval;
use concise labels, not added explanatory paragraphs.

Current assessment: existing review_type constraints cannot directly represent
the five new types. Prefer additive nullable workspace metadata and retain old
review_type values for compatibility. Do not automatically reinterpret legacy
weekly/monthly content as a different service. Coordinator reserved migration
0144_traderlink_communities_review_workspace_metadata, native order144 and
staging-adapter order157.

## Source checkpoint — 2026-09-27

- Focused TypeScript diagnostics: 0 across18 changed source files; reused installed
  canonical dependencies read-only, one process capped at768 MB. This is not a
  full project build or runtime acceptance. No Vitest, local build or dev server.
- git diff --check passed. Existing Find/To review/Saved, saved edits/removal,
  final delivery, images, chart/details and student-action controls retained.
- React checklist: one responsive editor instance, controlled per-trade draft
  text, checkbox accessible names, expandable action state, direct MUI imports
  in new components, server-owned permission-filtered Journal reads.
- Help review: existing Coaching and Journal privacy guide remains accurate;
  no guide text changed and no new UI descriptions added.
- Analytics-only grants deliberately remain unable to provide individual
  trades/Journal details. This slice's performance panel requires explicit
  trade sharing. A proposed analytics-only internal-row path was rejected by
  the safety gate and was not applied; no permission bypass or automatic grant.
- Trading-day notes and rules are separately student-selectable shares, off
  by default. Existing complete grants keep their existing full-scope meaning.
- Historical reviews remain untyped until the coach saves Review setup. Do not
  mutate existing staging drafts or overwrite the owner's synthetic test work.

## Migration and staging handoff

Four additive columns only: reviews.workspace_kind nullable constrained enum;
reviews.focus_areas_json array default[]; reviews.focus_feedback_json object
default{}; plan_items.focus_areas_json array default[]. No table rewrites,
deletes, new Journal writes or historical migration edits. Existing rows obtain
empty metadata without reinterpreting review_type or exposing drafts to students.
Old application code ignores the additional columns; forward application needs
0144 before new writes. Coordinator must rehearse on a staging snapshot, retain
backup and verify existing records. Do not remove columns as a rollback. Return
to the prior app build only if its migration-verifier compatibility is proven;
otherwise use coordinated restore/recovery with writes paused.

Pending: coordinator remote build, staging snapshot rehearsal, deployment and
mobile/desktop owner acceptance. This feature slice is not yet declared complete.
