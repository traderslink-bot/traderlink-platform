# Coaching lesson reuse QA correction

Status: source corrected; targeted source/syntax checks pass; staging retest pending.

Live staging QA found Reuse on a selected-student draft defaulted to All students
and Publish checked. The reused form must preserve the source audience mode,
plan and selected students, and start unpublished. New-lesson defaults are unchanged.

Changed file: `app/(dashboard)/communities/coaching-program-pages.tsx`.
No migration, configuration, scheduling, payment or Journal change.
Existing draft-copy content/recording persistence passed live before this fix.

Validation: all four explicit default bindings asserted; TypeScript TSX transpile
has zero syntax diagnostics; git diff --check passes. Worktree lacks ESLint
dependencies, so targeted ESLint could not run there. This is not a typecheck or
deployed-browser pass. No dedicated Communities teaching Help guide was found in
the current canonical file inventory; no public guide was changed.

Staging acceptance: reuse a selected-student draft and a plan-targeted lesson;
confirm source audience/plan/selections remain, Publish unchecked, original intact,
copy saved as draft and absent from student delivery until explicitly published.

Preserve the unrelated pre-existing live-QA document changes in this worktree.
Coordinator owns integration into staging source 0fa2e36759e34e30a4c031906b01325453a07d01.
