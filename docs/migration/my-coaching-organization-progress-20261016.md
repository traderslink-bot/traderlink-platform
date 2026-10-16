# My coaching progress

[Controlling plan](my-coaching-organization-plan-20261016.md).

## Completed locally
- Owner approved proposed landing and coach-page hierarchy.
- Landing: Upcoming, Coaches grouped by coach with associated plans/statuses, Lessons and Requests.
- Coach page: named coach, explicit same-coach plan selection, needs-attention and Upcoming; no extra Overview menu.
- Sections: Reviews, Messages, Sessions, Tasks, Lessons, Plans and agreement, Journal sharing, History.
- Existing forms, action handlers, allowances, attachments, acknowledgements, replies, lesson completion and Journal controls preserved. Ended/pause boundaries retained.
- Exact item anchors and fragment navigation; empty sections explain their state. No automatic acknowledgement, messages or completion on navigation.
- Existing in-app discard dialog protects link/plan switches by comparing the current section's forms in memory. No private draft persistence. Browser Back/reload protection not established by source review.
- Help aligned. Both earlier channel restriction source and inherited navigation work preserved. Members unchanged.

## Proof and remaining acceptance
Source/diff inspection and whitespace check only. No tests, type checks, builds, installs, preview server, data mutation, provider action, push/commit or deployment. UI not visually accepted or runtime-verified.

Before release: compile/integrated verification in authorized environment; owner Light/Navy desktop/mobile review, precise item jumps, multiple-coach/multiple-plan isolation, pending/declined-only users, paused/ended history, unscheduled work, all original forms and draft-switch dialog; browser Back/reload and action return navigation. Existing action redirects return to the My coaching landing; no change to return routes was made.

No migration required for this organization slice, but full local tree includes separate channel restrictions migration0168. Never deploy the divergent tree blindly; preserve combined staging integration fixes and explicitly select feature scope.
