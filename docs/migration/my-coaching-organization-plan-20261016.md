# My coaching organization — owner review

Status: owner approved landing and coach-page structure; local source implementation complete, runtime/visual acceptance pending. Owner now authorizes work on My coaching; earlier leave-unchanged boundary is superseded for this feature only. Members, channel restriction work, stats and production unchanged. No deployment, tests, builds or preview server.

## Complete feature inventory to preserve
Student relationship selection (active/ended), pending/declined requests, accepted/proposed agreements and acceptance, pause/history access notices; coach identity/plan; upcoming sessions and open tasks; messages, allowances and shared images; lessons/classes/assignments, links and progress; reviews, feedback, actions, acknowledgements, replies and student trade requests; shared coaching history/completed-session notes; student-controlled Journal scopes/grants/revocation. Retain all existing server authorization and private-note exclusion.

## Proposed first screen
My coaching landing: Upcoming across this student's active relationships; Coaches cards grouped by coach, showing all associated enrolled plans and access status; Lessons entry with assigned/included content; Requests entry with pending/declined statuses. No purchases or courses until those capabilities exist. No fabricated counts, unread-message claims or inferred completion. Empty upcoming list explicitly says no scheduled work.

Upcoming includes scheduled sessions, actionable review due/follow-up work, open tasks and assigned published lessons with relevant dates. Exclude completed/cancelled work, drafts and paused relationships from active due counts; paused/history remains accessible separately. Show coach and plan on each item, UTC dates matching existing contract, overdue/due-soon meaning defined from actual due dates. Link to precise relationship/section/item without submitting or marking anything read automatically. Keep unscheduled work discoverable through its category.

## Coach page
Click coach name → page titled with coach name, associated plans/status and functional sections: Reviews, Messages, Sessions, Tasks, Lessons, Plans and agreement, Journal sharing, History. No extra Overview nav item. Initial coach page is the overview, showing upcoming and needs-attention for that coach. More than one plan: explicit plan selector; never silently mix agreements, message quotas or Journal grants across relationships. Ended/archived relationships remain read-only with original participant boundaries.

## Slice order
1. Owner review of mockup/structure.
2. Landing, precise non-mutating navigation and coach grouping/relationship selection.
3. Move existing student components into sections, preserving forms, notices, permissions and return paths.
4. Complete real-data empty/status states, Help and source review; owner visual iteration.
5. Appropriate verification and staging only under separate authorization. No data/schema changes planned for organization.

Progress: [My coaching progress](my-coaching-organization-progress-20261016.md). Preview uses illustrative names/content, no real account data or functional acceptance implied.

## Local implementation checkpoint
Approved landing and coach/plan sections implemented using existing student snapshot and action components. URL fragments provide bookmark/back navigation without new server routes or wider data reads. Members and server permission logic unchanged; no schema change for this slice. Upcoming excludes drafts, completed/cancelled and paused work, preserves exact item targets and uses existing UTC display. Existing independent forms and server actions retained. Plan/section navigation uses existing discard dialog extended to compare multiple forms in memory; no private draft storage. Browser back/reload behavior and exact source compile remain unverified and require appropriate acceptance. Source whitespace review only; no tests/build/server/deployment. No standalone lesson sales or courses added.
