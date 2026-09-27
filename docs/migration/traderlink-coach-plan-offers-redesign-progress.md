# Coach plan offers redesign

Status: owner approved the builder direction; approved card colours and descriptions are implemented locally, pending staging review.
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

### Approved card presentation follow-up

- Owner approved exact descriptions for all13 service tiles in chat. Added verbatim;
  these explain choices and do not add requirements to the coach's saved offer.
- Always-visible tinted cards, coloured top border/title/status, distinct review
  accents: blue Trades, teal Trading-day, green Performance, orange Rules,
  purple Strategy, red Risk, pink Goals. Shared Material palette mapping also
  colours the corresponding editor and preview. Theme mode selects accessible
  darker/light accents; body copy uses shared text.primary.
- Selection retains its colour, changes + to Added, and strengthens border/tint.
  Card descriptions wrap and status aligns at bottom; keyboard focus is visible.
- No form state, save action, student access, schema or review-workspace changes.
- Help guidance reviewed: no behavioural change requires guide changes.
- Diff check clean; no local build or test suite. Staging visual check pending.

- [x] Distinct offer selection and configuration implemented.
- [x] Performance package and standalone services implemented.
- [x] Saved plan contents and live preview share the same offer summary formatter.
- [x] Focused TypeScript check: zero diagnostics in the two changed source files.
- [x] Existing Coaching and Journal privacy Help guidance remains accurate; no new prose added.
- [x] Coordinator staging deployment of initial design.
- [x] Mobile spacing correction deployed and inspected.
- [ ] Owner visual acceptance.

Staging evidence: source9b336fe9b0cab898ed25fbf6698c34527e3222f3,
Railway734af750-1d0a-4345-beba-9314a9966c41 SUCCESS/one RUNNING,
remote build36320618280 passed, public health200/ready140. Coordinator confirmed
unchanged migration registry and original volume; production ready127 unchanged.
Signed-in browser verified independent Trades/Rules editors, rules included within
Performance without adding a separate service, and matching live preview/resource
labels. No plan was submitted or existing record modified. At390px, the Added
chip crowded the Performance label; corrected service tiles to stack label/chip
below the small breakpoint. Desktop retains horizontal label/chip layout.

Final staging source ee6980336b2ad5778e3ee2dcd68eb5ccb8e8f1ba,
Railway cfcd4bcc-1c7c-42c3-a4b9-005ec2ecc062 SUCCESS/one RUNNING;
Coordinator confirmed full build passed, health200/ready140 and unchanged registry,
volume and production health. Signed-in390px screenshot confirms Performance
label and Added chip no longer overlap. Restored normal viewport, cleared only
unsaved preview inputs by reload, and left the plan builder open. Existing saved
plans unchanged. Save/publish was not exercised; owner design approval remains pending.

Source review: existing form action/item-type contract retained; selections
persist in existing plan items/focus JSON. Resource choices and coach-defined
details are included in the plan description, capped at4,000 characters with
submission blocked above the limit. No new grant fields, migrations or review
workspace edits. Removed services submit no hidden inputs; toggling back restores
the coach's unsaved settings. Questions retain a positive numeric allowance.
React checklist: direct MUI imports, stable controlled settings, external child
components, accessible service pressed states, mobile preview navigation, shared
theme tokens. No local build, dev server or automated test suite.
