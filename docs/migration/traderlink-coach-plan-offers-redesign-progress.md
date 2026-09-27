# Coach plan offers redesign

Status: owner requested a new staging design on 2026-09-27; implementation in progress.
This supersedes the rejected generic five-type plan-builder presentation, not
the existing review-workspace workflow.

## Controlling target

- Plan creation defines what a coach sells before a student joins.
- Restore separate Trade, Trading-day, Performance, Rules, Strategy, Risk and
  Goals selections. Keep sessions, lessons, questions, check-ins and follow-ups.
- Performance can package rules, risk, execution, Journal and goals without
  requiring a separately scheduled service for each included area.
- Distinct service editors: trade counts for trades, days for trading days,
  period-based assessments for performance/rules/strategy/risk/goals.
- Analytics reports, Trade Explorer and Trade Analyzer findings can be named
  as the coach's review resources. This is a plan offering, not a student grant.
- No Journal access controls or image-permission checkbox in the plan builder.
- Selected-service editors only, clear labels, no unapproved descriptive copy.
- Live plan summary; preserve billing, price/quote, capacity, plan descriptions,
  draft/publish, Discord enrollment settings and custom coaching freedom.
- Do not change the approved trade-review workspace, data readers, permissions,
  existing plans/student records, migration140 or held navigation changes.

## Implementation boundary

Use existing item types/focus fields. Review-resource choices and service-specific
coach text are included in the saved plan description; they are not promises of
new coach-side data viewers. No new schema or automatic student sharing.
Source lane: coaching-resume-20260926 at8d82570fb; exact child delta only.
Coordinator owns remote build and staging on the current production-mirrored
baseline. No local build or test suite. Owner visual acceptance remains required.

## Checkpoints

- [x] Distinct offer selection and configuration implemented.
- [x] Performance package and standalone services implemented.
- [x] Saved plan contents and live preview share the same offer summary formatter.
- [x] Focused TypeScript check: zero diagnostics in the two changed source files.
- [x] Existing Coaching and Journal privacy Help guidance remains accurate; no new prose added.
- [ ] Coordinator staging deployment and owner visual acceptance.

Source review: existing form action/item-type contract retained; selections
persist in existing plan items/focus JSON. Resource choices and coach-defined
details are included in the plan description, capped at4,000 characters with
submission blocked above the limit. No new grant fields, migrations or review
workspace edits. Removed services submit no hidden inputs; toggling back restores
the coach's unsaved settings. Questions retain a positive numeric allowance.
React checklist: direct MUI imports, stable controlled settings, external child
components, accessible service pressed states, mobile preview navigation, shared
theme tokens. No local build, dev server or automated test suite.
